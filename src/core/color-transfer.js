/**
 * Color Transfer Algorithm Implementation for Browser
 * Based on "Color Transfer between Images" by Reinhard et al.
 */

class ColorTransfer {
    constructor() {
        this.sourceStats = null;
        this.targetStats = null;
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
    computeColorStatistics(labData) {
        const pixelCount = labData.length / 4;
        const means = [0, 0, 0];
        const stds = [0, 0, 0];

        // Calculate means
        for (let i = 0; i < labData.length; i += 4) {
            means[0] += labData[i];     // L
            means[1] += labData[i + 1]; // A
            means[2] += labData[i + 2]; // B
        }

        means[0] /= pixelCount;
        means[1] /= pixelCount;
        means[2] /= pixelCount;

        // Calculate standard deviations
        for (let i = 0; i < labData.length; i += 4) {
            stds[0] += Math.pow(labData[i] - means[0], 2);
            stds[1] += Math.pow(labData[i + 1] - means[1], 2);
            stds[2] += Math.pow(labData[i + 2] - means[2], 2);
        }

        stds[0] = Math.sqrt(stds[0] / pixelCount);
        stds[1] = Math.sqrt(stds[1] / pixelCount);
        stds[2] = Math.sqrt(stds[2] / pixelCount);

        return { mean: means, std: stds };
    }

    /**
     * Transfer colors from target to source image
     * @param {ImageData} sourceImageData - Source image data
     * @param {ImageData} targetImageData - Target image data
     * @returns {Object} Result containing transferred image and statistics
     */
    transferColors(sourceImageData, targetImageData) {
        // Step 1: Convert to LAB color space
        console.log('Converting images to LAB color space...');
        const sourceLab = this.rgbToLab(sourceImageData);
        const targetLab = this.rgbToLab(targetImageData);

        // Step 2: Compute color statistics
        console.log('Computing color statistics...');
        const sourceStats = this.computeColorStatistics(sourceLab);
        const targetStats = this.computeColorStatistics(targetLab);

        this.sourceStats = sourceStats;
        this.targetStats = targetStats;

        console.log('Source stats:', sourceStats);
        console.log('Target stats:', targetStats);

        // Step 3: Apply color transfer transformation
        console.log('Applying color transfer transformation...');
        const transferredLab = new Float32Array(sourceLab.length);

        for (let i = 0; i < sourceLab.length; i += 4) {
            // Apply transformation for each LAB channel
            for (let channel = 0; channel < 3; channel++) {
                const sourceValue = sourceLab[i + channel];
                const sourceMean = sourceStats.mean[channel];
                const sourceStd = sourceStats.std[channel];
                const targetMean = targetStats.mean[channel];
                const targetStd = targetStats.std[channel];

                if (sourceStd > 0) {
                    transferredLab[i + channel] = 
                        (sourceValue - sourceMean) * (targetStd / sourceStd) + targetMean;
                } else {
                    transferredLab[i + channel] = targetMean;
                }
            }
            transferredLab[i + 3] = sourceLab[i + 3]; // Alpha channel
        }

        // Step 4: Convert back to RGB
        console.log('Converting back to RGB...');
        const resultImageData = this.labToRgb(
            transferredLab, 
            sourceImageData.width, 
            sourceImageData.height
        );

        return {
            imageData: resultImageData,
            sourceStats: sourceStats,
            targetStats: targetStats
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