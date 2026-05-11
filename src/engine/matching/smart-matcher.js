class SmartMatcher {
    constructor() {
        this.sourceStats = null;
        this.targetStats = null;
        this.colorTransfer = new ColorTransfer();
        this.autoCalibrationResults = null;
    }

    rgbToLab(imageData) {
        return this.colorTransfer.rgbToLab(imageData);
    }

    computeColorStatistics(labData, sampleStep = 1) {
        return this.colorTransfer.computeColorStatistics(labData, sampleStep);
    }

    deltaE2000(lab1, lab2) {
        const L1 = lab1[0], a1 = lab1[1], b1 = lab1[2];
        const L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];

        const kL = 1, kC = 1, kH = 1;
        const C1 = Math.sqrt(a1 * a1 + b1 * b1);
        const C2 = Math.sqrt(a2 * a2 + b2 * b2);
        const Cb = (C1 + C2) / 2;
        const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));

        const a1p = a1 * (1 + G);
        const a2p = a2 * (1 + G);
        const C1p = Math.sqrt(a1p * a1p + b1 * b1);
        const C2p = Math.sqrt(a2p * a2p + b2 * b2);

        let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
        if (h1p < 0) h1p += 360;
        let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
        if (h2p < 0) h2p += 360;

        const dLp = L2 - L1;
        const dCp = C2p - C1p;

        let dhp;
        if (C1p * C2p === 0) {
            dhp = 0;
        } else if (Math.abs(h2p - h1p) <= 180) {
            dhp = h2p - h1p;
        } else if (h2p - h1p > 180) {
            dhp = h2p - h1p - 360;
        } else {
            dhp = h2p - h1p + 360;
        }
        const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

        const Lbp = (L1 + L2) / 2;
        const Cbp = (C1p + C2p) / 2;

        let Cbp7 = Math.pow(Cbp, 7);
        const Gs = 0.5 * (1 - Math.sqrt(Cbp7 / (Cbp7 + Math.pow(25, 7))));
        const a1pS = a1 * (1 + Gs);
        const a2pS = a2 * (1 + Gs);
        const C1pS = Math.sqrt(a1pS * a1pS + b1 * b1);
        const C2pS = Math.sqrt(a2pS * a2pS + b2 * b2);
        const CbpS = (C1pS + C2pS) / 2;

        let h1pS = Math.atan2(b1, a1pS) * 180 / Math.PI;
        if (h1pS < 0) h1pS += 360;
        let h2pS = Math.atan2(b2, a2pS) * 180 / Math.PI;
        if (h2pS < 0) h2pS += 360;

        let Hbp;
        if (C1pS * C2pS === 0) {
            Hbp = h1pS + h2pS;
        } else if (Math.abs(h2pS - h1pS) <= 180) {
            Hbp = (h1pS + h2pS) / 2;
        } else if (h1pS + h2pS < 360) {
            Hbp = (h1pS + h2pS + 360) / 2;
        } else {
            Hbp = (h1pS + h2pS - 360) / 2;
        }

        const T = 1 - 0.17 * Math.cos((Hbp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * Hbp * Math.PI / 180) + 0.32 * Math.cos((3 * Hbp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * Hbp - 63) * Math.PI / 180);
        const dTheta = 30 * Math.exp(-Math.pow((Hbp - 275) / 25, 2));
        const RC = 2 * Math.sqrt(Math.pow(CbpS, 7) / (Math.pow(CbpS, 7) + Math.pow(25, 7)));
        const SL = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
        const SC = 1 + 0.045 * CbpS;
        const SH = 1 + 0.015 * CbpS * T;
        const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC;

        const dE = Math.sqrt(
            Math.pow(dLp / (kL * SL), 2) +
            Math.pow(dCp / (kC * SC), 2) +
            Math.pow(dHp / (kH * SH), 2) +
            RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
        );

        return dE;
    }

    computeMatchScoreDE2000(sourceImageData, targetImageData, resultImageData, sampleStep = 4) {
        const srcLab = this.rgbToLab(sourceImageData);
        const refLab = this.rgbToLab(targetImageData);
        const resLab = this.rgbToLab(resultImageData);

        const step = Math.max(1, sampleStep) * 4;
        let totalDE = 0;
        let count = 0;

        for (let i = 0; i < srcLab.length; i += step) {
            const srcPixel = [srcLab[i], srcLab[i + 1], srcLab[i + 2]];
            const refPixel = [refLab[i], refLab[i + 1], refLab[i + 2]];
            const resPixel = [resLab[i], resLab[i + 1], resLab[i + 2]];

            const deBefore = this.deltaE2000(srcPixel, refPixel);
            const deAfter = this.deltaE2000(resPixel, refPixel);
            totalDE += deAfter;
            count++;
        }

        const avgDE = totalDE / count;
        const score = Math.max(0, Math.min(100, 100 - avgDE * 2));
        return { score: Math.round(score), avgDE: avgDE.toFixed(2) };
    }

    computeAdaptiveStrength(sourceImageData, targetImageData, sampleStep = 4) {
        const srcLab = this.rgbToLab(sourceImageData);
        const tgtLab = this.rgbToLab(targetImageData);
        const srcStats = this.computeColorStatistics(srcLab, sampleStep);
        const tgtStats = this.computeColorStatistics(tgtLab, sampleStep);

        const channelWeights = [0, 0, 0];
        for (let c = 0; c < 3; c++) {
            const meanDist = Math.abs(tgtStats.mean[c] - srcStats.mean[c]);
            const stdRatio = tgtStats.std[c] / (srcStats.std[c] + 0.001);
            channelWeights[c] = 1 / (1 + meanDist * 0.05 + Math.abs(1 - stdRatio) * 0.5);
        }

        const totalWeight = channelWeights.reduce((a, b) => a + b, 0);
        return channelWeights.map(w => w / totalWeight);
    }

    detectLuminanceZones(imageData, sampleStep = 4) {
        const data = imageData.data;
        const zones = { shadows: [], midtones: [], highlights: [] };

        for (let i = 0; i < data.length; i += sampleStep * 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 0.3) zones.shadows.push(lum);
            else if (lum < 0.7) zones.midtones.push(lum);
            else zones.highlights.push(lum);
        }

        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.5;
        return {
            shadowMean: avg(zones.shadows),
            midtoneMean: avg(zones.midtones),
            highlightMean: avg(zones.highlights),
            shadowCount: zones.shadows.length,
            midtoneCount: zones.midtones.length,
            highlightCount: zones.highlights.length
        };
    }

    buildImagePyramid(imageData) {
        const { width, height } = imageData;
        const scales = [1, 0.5, 0.25];
        const pyramid = [];

        for (const scale of scales) {
            if (scale === 1) {
                pyramid.push(imageData);
            } else {
                const newWidth = Math.max(1, Math.round(width * scale));
                const newHeight = Math.max(1, Math.round(height * scale));
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                const img = this.imageDataToCanvas(imageData);
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                const scaledImageData = ctx.getImageData(0, 0, newWidth, newHeight);
                pyramid.push(scaledImageData);
            }
        }

        return pyramid;
    }

    imageDataToCanvas(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    canvasToImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    transferReinhardLab(sourceImageData, targetImageData, strength, sampleStep) {
        return this.colorTransfer.transferReinhardLab(sourceImageData, targetImageData, strength, sampleStep);
    }

    transferWithAdaptiveStrength(sourceImageData, targetImageData, channelWeights, strength, sampleStep) {
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);
        const sourceStats = this.computeColorStatistics(sourceLab, sampleStep);
        const targetStats = this.computeColorStatistics(targetLab, sampleStep);

        const transferredLab = new Float32Array(sourceLab.length);
        for (let i = 0; i < sourceLab.length; i += 4) {
            for (let channel = 0; channel < 3; channel++) {
                const sourceValue = sourceLab[i + channel];
                const sourceMean = sourceStats.mean[channel];
                const sourceStd = sourceStats.std[channel];
                const targetMean = targetStats.mean[channel];
                const targetStd = targetStats.std[channel];

                const transferred = sourceStd > 1e-6
                    ? (sourceValue - sourceMean) * (targetStd / sourceStd) + targetMean
                    : targetMean;

                const weight = channelWeights[channel];
                const adaptiveStrength = strength * weight * 1.5;
                transferredLab[i + channel] = sourceValue + adaptiveStrength * (transferred - sourceValue);
            }
            transferredLab[i + 3] = sourceLab[i + 3];
        }

        return this.colorTransfer.labToRgb(transferredLab, sourceImageData.width, sourceImageData.height);
    }

    transferRegionAware(sourceImageData, targetImageData, strength, sampleStep) {
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);
        const sourceStats = this.computeColorStatistics(sourceLab, sampleStep);
        const targetStats = this.computeColorStatistics(targetLab, sampleStep);

        const zones = this.detectLuminanceZones(sourceImageData, sampleStep);

        const transferredLab = new Float32Array(sourceLab.length);
        for (let i = 0; i < sourceLab.length; i += 4) {
            const r = sourceImageData.data[i] / 255;
            const g = sourceImageData.data[i + 1] / 255;
            const b = sourceImageData.data[i + 2] / 255;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            let zoneStrength = strength;
            if (lum < 0.3) {
                zoneStrength *= 0.7;
            } else if (lum > 0.7) {
                zoneStrength *= 0.85;
            }

            for (let channel = 0; channel < 3; channel++) {
                const sourceValue = sourceLab[i + channel];
                const sourceMean = sourceStats.mean[channel];
                const sourceStd = sourceStats.std[channel];
                const targetMean = targetStats.mean[channel];
                const targetStd = targetStats.std[channel];

                const transferred = sourceStd > 1e-6
                    ? (sourceValue - sourceMean) * (targetStd / sourceStd) + targetMean
                    : targetMean;

                transferredLab[i + channel] = sourceValue + zoneStrength * (transferred - sourceValue);
            }
            transferredLab[i + 3] = sourceLab[i + 3];
        }

        return this.colorTransfer.labToRgb(transferredLab, sourceImageData.width, sourceImageData.height);
    }

    transferMultiScale(sourceImageData, targetImageData, strength, sampleStep = 1) {
        const pyramid = this.buildImagePyramid(sourceImageData);
        const refPyramid = this.buildImagePyramid(targetImageData);

        let result = null;
        for (let level = pyramid.length - 1; level >= 0; level--) {
            const srcData = pyramid[level];
            const refData = refPyramid[level];
            const levelStrength = level === pyramid.length - 1 ? strength * 0.5 : strength;

            if (result && level < pyramid.length - 1) {
                result = this.upscaleImageData(result, srcData.width, srcData.height);
            }

            if (result) {
                const canvas = document.createElement('canvas');
                canvas.width = srcData.width;
                canvas.height = srcData.height;
                const ctx = canvas.getContext('2d');
                ctx.putImageData(result, 0, 0);
                result = ctx.getImageData(0, 0, srcData.width, srcData.height);
            } else {
                result = this.transferReinhardLab(srcData, refData, levelStrength, sampleStep).imageData;
            }

            if (level > 0) {
                result = this.transferReinhardLab(result, refData, levelStrength * 0.6, sampleStep).imageData;
            }
        }

        return result;
    }

    upscaleImageData(imageData, newWidth, newHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = newWidth;
        outputCanvas.height = newHeight;
        const outCtx = outputCanvas.getContext('2d');
        outCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        return outCtx.getImageData(0, 0, newWidth, newHeight);
    }

    autoCalibrate(sourceImageData, targetImageData, options = {}) {
        const maxIterations = options.maxIterations || 5;
        const targetScore = options.targetScore || 85;
        const minImprovement = options.minImprovement || 0.5;

        let currentStrength = options.initialStrength || 0.8;
        let bestResult = null;
        let bestScore = 0;
        let iteration = 0;
        const adjustmentLog = [];
        const convergenceHistory = [];

        while (iteration < maxIterations) {
            const result = this.transferReinhardLab(sourceImageData, targetImageData, currentStrength, 4);
            const matchResult = this.computeMatchScoreDE2000(sourceImageData, targetImageData, result.imageData, 4);
            const score = matchResult.score;

            const prevScore = iteration === 0 ? 0 : convergenceHistory[convergenceHistory.length - 1].score;
            const improvement = score - prevScore;

            convergenceHistory.push({
                iteration: iteration + 1,
                strength: currentStrength,
                score,
                improvement
            });

            if (score > bestScore) {
                bestScore = score;
                bestResult = result.imageData;
            }

            adjustmentLog.push({
                iteration: iteration + 1,
                strength: currentStrength,
                score,
                avgDE: matchResult.avgDE,
                improvement
            });

            if (score >= targetScore || improvement < minImprovement) {
                break;
            }

            const strengthDelta = Math.min(0.15, (targetScore - score) / 200);
            currentStrength = Math.min(1.0, currentStrength + strengthDelta);
            iteration++;
        }

        this.autoCalibrationResults = {
            result: bestResult,
            finalScore: bestScore,
            iterationsUsed: iteration + 1,
            finalStrength: currentStrength,
            convergenceHistory,
            adjustmentLog
        };

        return this.autoCalibrationResults;
    }

    smartTransfer(sourceImageData, targetImageData, options = {}) {
        const {
            method = 'hybrid-lab',
            strength = 1.0,
            useAdaptiveStrength = true,
            useRegionAware = false,
            useMultiScale = false,
            useAutoCalibrate = false,
            performanceMode = 'balanced'
        } = options;

        const sampleStep = performanceMode === 'fast' ? 4 : performanceMode === 'quality' ? 1 : 2;

        if (useAutoCalibrate) {
            return this.autoCalibrate(sourceImageData, targetImageData, {
                maxIterations: 5,
                targetScore: 85,
                minImprovement: 0.5,
                initialStrength: strength
            });
        }

        let result;
        if (useMultiScale) {
            result = this.transferMultiScale(sourceImageData, targetImageData, strength, sampleStep);
        } else if (useRegionAware) {
            result = this.transferRegionAware(sourceImageData, targetImageData, strength, sampleStep);
        } else if (useAdaptiveStrength) {
            const weights = this.computeAdaptiveStrength(sourceImageData, targetImageData, sampleStep);
            result = this.transferWithAdaptiveStrength(sourceImageData, targetImageData, weights, strength, sampleStep);
        } else if (method === 'hybrid-lab') {
            result = this.colorTransfer.transferHybridLab(sourceImageData, targetImageData, strength, sampleStep).imageData;
        } else {
            result = this.transferReinhardLab(sourceImageData, targetImageData, strength, sampleStep).imageData;
        }

        const matchResult = this.computeMatchScoreDE2000(sourceImageData, targetImageData, result, sampleStep);

        return {
            imageData: result,
            matchScore: matchResult.score,
            avgDE: matchResult.avgDE,
            method,
            strength,
            adaptiveWeights: useAdaptiveStrength ? this.computeAdaptiveStrength(sourceImageData, targetImageData, sampleStep) : null
        };
    }

    getStatisticsComparison() {
        return this.colorTransfer.getStatisticsComparison();
    }
}

window.SmartMatcher = SmartMatcher;
