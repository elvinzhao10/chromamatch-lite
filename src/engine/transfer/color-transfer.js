/**
 * Color Transfer Algorithm Implementation for Browser
 * Based on "Color Transfer between Images" by Reinhard et al.
 */

class ColorTransfer {
    constructor() {
        this.sourceStats = null;
        this.targetStats = null;
        this.activeMethod = 'reinhard-lab';
    }

    /**
     * Convert RGB to LAB color space
     * @param {ImageData} imageData - RGB image data
     * @returns {Float32Array} LAB image data
     */
    rgbToLab(imageData) {
        const { data, width, height } = imageData;
        const labData = new Float32Array(data.length);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255.0;
            const g = data[i + 1] / 255.0;
            const b = data[i + 2] / 255.0;

            // RGB to XYZ conversion
            let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
            let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
            let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

            // Normalize by D65 illuminant
            x /= 0.95047;
            y /= 1.00000;
            z /= 1.08883;

            // XYZ to LAB conversion
            const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
            const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
            const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

            const L = 116 * fy - 16;
            const A = 500 * (fx - fy);
            const B = 200 * (fy - fz);

            labData[i] = L;
            labData[i + 1] = A;
            labData[i + 2] = B;
            labData[i + 3] = data[i + 3]; // Alpha channel
        }

        return labData;
    }

    /**
     * Convert LAB to RGB color space
     * @param {Float32Array} labData - LAB image data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {ImageData} RGB image data
     */
    labToRgb(labData, width, height) {
        const rgbData = new Uint8ClampedArray(labData.length);

        for (let i = 0; i < labData.length; i += 4) {
            const L = labData[i];
            const A = labData[i + 1];
            const B = labData[i + 2];

            // LAB to XYZ conversion
            const fy = (L + 16) / 116;
            const fx = A / 500 + fy;
            const fz = fy - B / 200;

            const x = (fx > 0.206897 ? Math.pow(fx, 3) : (fx - 16/116) / 7.787) * 0.95047;
            const y = (fy > 0.206897 ? Math.pow(fy, 3) : (fy - 16/116) / 7.787) * 1.00000;
            const z = (fz > 0.206897 ? Math.pow(fz, 3) : (fz - 16/116) / 7.787) * 1.08883;

            // XYZ to RGB conversion
            let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
            let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
            let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

            // Gamma correction
            r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
            g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
            b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;

            rgbData[i] = Math.max(0, Math.min(255, r * 255));
            rgbData[i + 1] = Math.max(0, Math.min(255, g * 255));
            rgbData[i + 2] = Math.max(0, Math.min(255, b * 255));
            rgbData[i + 3] = labData[i + 3]; // Alpha channel
        }

        return new ImageData(rgbData, width, height);
    }

    /**
     * Compute color statistics for LAB image
     * @param {Float32Array} labData - LAB image data
     * @returns {Object} Statistics object with mean and std arrays
     */
    computeColorStatistics(labData, sampleStep = 1) {
        const step = Math.max(1, sampleStep) * 4;
        const means = [0, 0, 0];
        const stds = [0, 0, 0];
        let pixelCount = 0;

        // Calculate means
        for (let i = 0; i < labData.length; i += step) {
            means[0] += labData[i];     // L
            means[1] += labData[i + 1]; // A
            means[2] += labData[i + 2]; // B
            pixelCount++;
        }

        means[0] /= pixelCount;
        means[1] /= pixelCount;
        means[2] /= pixelCount;

        // Calculate standard deviations
        for (let i = 0; i < labData.length; i += step) {
            stds[0] += Math.pow(labData[i] - means[0], 2);
            stds[1] += Math.pow(labData[i + 1] - means[1], 2);
            stds[2] += Math.pow(labData[i + 2] - means[2], 2);
        }

        stds[0] = Math.sqrt(stds[0] / pixelCount);
        stds[1] = Math.sqrt(stds[1] / pixelCount);
        stds[2] = Math.sqrt(stds[2] / pixelCount);

        return { mean: means, std: stds };
    }

    getDefaultSampleStep(performanceMode) {
        if (performanceMode === 'fast') return 4;
        if (performanceMode === 'quality') return 1;
        return 2;
    }

    chooseAutoMethod(sourceImageData, performanceMode) {
        const pixels = sourceImageData.width * sourceImageData.height;
        if (performanceMode === 'fast') return 'rgb-mean-std';
        if (pixels <= 1500000 && performanceMode !== 'balanced') return 'lab-histogram';
        if (pixels <= 1000000) return 'lab-histogram';
        return 'reinhard-lab';
    }

    computeRgbStatistics(imageData, sampleStep = 1) {
        const data = imageData.data;
        const means = [0, 0, 0];
        const stds = [0, 0, 0];
        let count = 0;
        const step = Math.max(1, sampleStep) * 4;

        for (let i = 0; i < data.length; i += step) {
            means[0] += data[i];
            means[1] += data[i + 1];
            means[2] += data[i + 2];
            count++;
        }

        means[0] /= count;
        means[1] /= count;
        means[2] /= count;

        for (let i = 0; i < data.length; i += step) {
            stds[0] += (data[i] - means[0]) * (data[i] - means[0]);
            stds[1] += (data[i + 1] - means[1]) * (data[i + 1] - means[1]);
            stds[2] += (data[i + 2] - means[2]) * (data[i + 2] - means[2]);
        }

        stds[0] = Math.sqrt(stds[0] / count);
        stds[1] = Math.sqrt(stds[1] / count);
        stds[2] = Math.sqrt(stds[2] / count);

        return { mean: means, std: stds };
    }

    labChannelToByte(channel, value) {
        if (channel === 0) return Math.round(Math.max(0, Math.min(255, (value / 100) * 255)));
        return Math.round(Math.max(0, Math.min(255, value + 128)));
    }

    byteToLabChannel(channel, byteValue) {
        if (channel === 0) return (byteValue / 255) * 100;
        return byteValue - 128;
    }

    buildHistogramMapping(sourceLab, targetLab, channel, bins = 256, sampleStep = 1) {
        const srcHist = new Array(bins).fill(0);
        const tgtHist = new Array(bins).fill(0);
        const stride = Math.max(1, sampleStep) * 4;

        for (let i = 0; i < sourceLab.length; i += stride) {
            srcHist[this.labChannelToByte(channel, sourceLab[i + channel])]++;
        }
        for (let i = 0; i < targetLab.length; i += stride) {
            tgtHist[this.labChannelToByte(channel, targetLab[i + channel])]++;
        }

        const srcCdf = new Array(bins).fill(0);
        const tgtCdf = new Array(bins).fill(0);
        srcCdf[0] = srcHist[0];
        tgtCdf[0] = tgtHist[0];
        for (let i = 1; i < bins; i++) {
            srcCdf[i] = srcCdf[i - 1] + srcHist[i];
            tgtCdf[i] = tgtCdf[i - 1] + tgtHist[i];
        }

        const srcTotal = srcCdf[bins - 1] || 1;
        const tgtTotal = tgtCdf[bins - 1] || 1;
        for (let i = 0; i < bins; i++) {
            srcCdf[i] /= srcTotal;
            tgtCdf[i] /= tgtTotal;
        }

        const mapping = new Array(bins).fill(0);
        let j = 0;
        for (let i = 0; i < bins; i++) {
            const p = srcCdf[i];
            while (j < bins - 1 && tgtCdf[j] < p) j++;
            mapping[i] = j;
        }

        return mapping;
    }

    transferReinhardLab(sourceImageData, targetImageData, strength, sampleStep) {
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);
        const sourceStats = this.computeColorStatistics(sourceLab, sampleStep);
        const targetStats = this.computeColorStatistics(targetLab, sampleStep);

        this.sourceStats = sourceStats;
        this.targetStats = targetStats;

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

                transferredLab[i + channel] = sourceValue + strength * (transferred - sourceValue);
            }
            transferredLab[i + 3] = sourceLab[i + 3];
        }

        return {
            imageData: this.labToRgb(transferredLab, sourceImageData.width, sourceImageData.height),
            sourceStats,
            targetStats
        };
    }

    transferHistogramLab(sourceImageData, targetImageData, strength, sampleStep) {
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);
        const sourceStats = this.computeColorStatistics(sourceLab, sampleStep);
        const targetStats = this.computeColorStatistics(targetLab, sampleStep);
        this.sourceStats = sourceStats;
        this.targetStats = targetStats;

        const mappingL = this.buildHistogramMapping(sourceLab, targetLab, 0, 256, sampleStep);
        const mappingA = this.buildHistogramMapping(sourceLab, targetLab, 1, 256, sampleStep);
        const mappingB = this.buildHistogramMapping(sourceLab, targetLab, 2, 256, sampleStep);
        const transferredLab = new Float32Array(sourceLab.length);

        for (let i = 0; i < sourceLab.length; i += 4) {
            const sL = sourceLab[i];
            const sA = sourceLab[i + 1];
            const sB = sourceLab[i + 2];

            const tL = this.byteToLabChannel(0, mappingL[this.labChannelToByte(0, sL)]);
            const tA = this.byteToLabChannel(1, mappingA[this.labChannelToByte(1, sA)]);
            const tB = this.byteToLabChannel(2, mappingB[this.labChannelToByte(2, sB)]);

            transferredLab[i] = sL + strength * (tL - sL);
            transferredLab[i + 1] = sA + strength * (tA - sA);
            transferredLab[i + 2] = sB + strength * (tB - sB);
            transferredLab[i + 3] = sourceLab[i + 3];
        }

        return {
            imageData: this.labToRgb(transferredLab, sourceImageData.width, sourceImageData.height),
            sourceStats,
            targetStats
        };
    }

    transferRgbMeanStd(sourceImageData, targetImageData, strength, sampleStep) {
        const srcStats = this.computeRgbStatistics(sourceImageData, sampleStep);
        const tgtStats = this.computeRgbStatistics(targetImageData, sampleStep);
        const out = new Uint8ClampedArray(sourceImageData.data.length);
        const srcData = sourceImageData.data;

        for (let i = 0; i < srcData.length; i += 4) {
            for (let channel = 0; channel < 3; channel++) {
                const s = srcData[i + channel];
                const ss = srcStats.std[channel];
                const transformed = ss > 1e-6
                    ? (s - srcStats.mean[channel]) * (tgtStats.std[channel] / ss) + tgtStats.mean[channel]
                    : tgtStats.mean[channel];
                out[i + channel] = Math.max(0, Math.min(255, s + strength * (transformed - s)));
            }
            out[i + 3] = srcData[i + 3];
        }

        // Keep LAB stats available for UI and LUT logic.
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);
        this.sourceStats = this.computeColorStatistics(sourceLab, sampleStep);
        this.targetStats = this.computeColorStatistics(targetLab, sampleStep);

        return {
            imageData: new ImageData(out, sourceImageData.width, sourceImageData.height),
            sourceStats: this.sourceStats,
            targetStats: this.targetStats
        };
    }

    /**
     * Transfer colors from target to source image.
     * Supported methods:
     * - reinhard-lab (default): balanced quality/speed
     * - lab-histogram: higher distribution matching accuracy, slower
     * - rgb-mean-std: fastest method
     * - auto: chooses method based on image size and performance mode
     */
    transferColors(sourceImageData, targetImageData, options = {}) {
        const normalized = typeof options === 'number' ? { strength: options } : options;
        const strength = Math.max(0, Math.min(1, normalized.strength ?? 1.0));
        const performanceMode = normalized.performanceMode || 'balanced';
        const sampleStep = normalized.sampleStep || this.getDefaultSampleStep(performanceMode);

        const requestedMethod = normalized.method || 'reinhard-lab';
        const method = requestedMethod === 'auto'
            ? this.chooseAutoMethod(sourceImageData, performanceMode)
            : requestedMethod;

        this.activeMethod = method;

        let result;
        if (method === 'lab-histogram') {
            result = this.transferHistogramLab(sourceImageData, targetImageData, strength, sampleStep);
        } else if (method === 'rgb-mean-std') {
            result = this.transferRgbMeanStd(sourceImageData, targetImageData, strength, sampleStep);
        } else {
            result = this.transferReinhardLab(sourceImageData, targetImageData, strength, sampleStep);
        }

        return {
            ...result,
            method,
            requestedMethod,
            performanceMode,
            sampleStep,
            strength
        };
    }

    /**
     * Get statistics comparison for display
     * @returns {Array} Array of channel statistics
     */
    getStatisticsComparison() {
        if (!this.sourceStats || !this.targetStats) {
            return [];
        }

        const channels = [
            { name: 'L (Lightness)', index: 0 },
            { name: 'A (Green-Red)', index: 1 },
            { name: 'B (Blue-Yellow)', index: 2 }
        ];

        return channels.map(channel => {
            const sourceMean = this.sourceStats.mean[channel.index];
            const sourceStd = this.sourceStats.std[channel.index];
            const targetMean = this.targetStats.mean[channel.index];
            const targetStd = this.targetStats.std[channel.index];

            return {
                name: channel.name,
                source: {
                    mean: sourceMean.toFixed(2),
                    std: sourceStd.toFixed(2)
                },
                target: {
                    mean: targetMean.toFixed(2),
                    std: targetStd.toFixed(2)
                },
                difference: {
                    mean: (targetMean - sourceMean).toFixed(2),
                    stdRatio: sourceStd > 0 ? (targetStd / sourceStd).toFixed(2) : 'inf'
                }
            };
        });
    }
}

window.ColorTransfer = ColorTransfer;