/**
 * LUT (Lookup Table) Export Class
 * Generates and exports color transformation data in various formats
 */

class LUTExport {
    constructor() {
        this.lutSize = 33; // Standard 33x33x33 LUT size
        this.bitDepth = 10; // 10-bit precision
        this.format = 'cube'; // Default format
    }

    /**
     * Generate 3D LUT data based on current color transformations
     * @param {ColorTransfer} colorTransfer - Color transfer instance
     * @param {ImageAdjustments} imageAdjustments - Image adjustments instance
     * @returns {Array} 3D LUT data array
     */
    generateLUTData(colorTransfer, imageAdjustments) {
        const lutData = [];
        const step = 1.0 / (this.lutSize - 1);

        for (let b = 0; b < this.lutSize; b++) {
            for (let g = 0; g < this.lutSize; g++) {
                for (let r = 0; r < this.lutSize; r++) {
                    // Input RGB values (0-1 range)
                    const inputR = r * step;
                    const inputG = g * step;
                    const inputB = b * step;

                    // Apply transformations
                    const transformedColor = this.applyTransformations(
                        inputR, inputG, inputB, 
                        colorTransfer, imageAdjustments
                    );

                    lutData.push(transformedColor);
                }
            }
        }

        return lutData;
    }

    /**
     * Apply all color transformations to a single RGB pixel
     * @param {number} r - Red component (0-1)
     * @param {number} g - Green component (0-1)
     * @param {number} b - Blue component (0-1)
     * @param {ColorTransfer} colorTransfer - Color transfer instance
     * @param {ImageAdjustments} imageAdjustments - Image adjustments instance
     * @returns {Object} Transformed RGB values
     */
    applyTransformations(r, g, b, colorTransfer, imageAdjustments) {
        // Apply color transfer directly via LAB math — no DOM/canvas needed
        if (colorTransfer && colorTransfer.sourceStats && colorTransfer.targetStats) {
            // RGB (0-1) → XYZ
            let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
            let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
            let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

            x /= 0.95047; y /= 1.00000; z /= 1.08883;

            // XYZ → LAB
            const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x + 16 / 116);
            const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y + 16 / 116);
            const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z + 16 / 116);

            let L = 116 * fy - 16;
            let A = 500 * (fx - fy);
            let B = 200 * (fy - fz);

            // Apply per-channel transfer stats
            const ss = colorTransfer.sourceStats;
            const ts = colorTransfer.targetStats;
            const lab = [L, A, B];
            for (let ch = 0; ch < 3; ch++) {
                lab[ch] = ss.std[ch] > 0
                    ? (lab[ch] - ss.mean[ch]) * (ts.std[ch] / ss.std[ch]) + ts.mean[ch]
                    : ts.mean[ch];
            }
            [L, A, B] = lab;

            // LAB → XYZ
            const fy2 = (L + 16) / 116;
            const fx2 = A / 500 + fy2;
            const fz2 = fy2 - B / 200;

            x = (fx2 > 0.206897 ? fx2 ** 3 : (fx2 - 16 / 116) / 7.787) * 0.95047;
            y = (fy2 > 0.206897 ? fy2 ** 3 : (fy2 - 16 / 116) / 7.787) * 1.00000;
            z = (fz2 > 0.206897 ? fz2 ** 3 : (fz2 - 16 / 116) / 7.787) * 1.08883;

            // XYZ → RGB with gamma
            r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
            g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
            b = x * 0.0556434  + y * -0.2040259 + z *  1.0572252;

            r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
            g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
            b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : 12.92 * b;

            r = Math.max(0, Math.min(1, r));
            g = Math.max(0, Math.min(1, g));
            b = Math.max(0, Math.min(1, b));
        }

        // Apply image adjustments at pixel scale
        if (imageAdjustments && imageAdjustments.currentAdjustments) {
            const adj = imageAdjustments.currentAdjustments;
            let rp = r * 255, gp = g * 255, bp = b * 255;

            const tempFactor = adj.temperature / 100;
            if (adj.temperature !== 0) {
                if (tempFactor > 0) {
                    rp = Math.min(255, rp + tempFactor * 30);
                    bp = Math.max(0, bp - tempFactor * 20);
                } else {
                    rp = Math.max(0, rp + tempFactor * 20);
                    bp = Math.min(255, bp - tempFactor * 30);
                }
            }

            const tintFactor = adj.tint / 100;
            if (adj.tint !== 0) {
                rp = Math.max(0, Math.min(255, rp + tintFactor * 15));
                gp = Math.max(0, Math.min(255, gp - tintFactor * 15));
                bp = Math.max(0, Math.min(255, bp + tintFactor * 15));
            }

            if (adj.exposure !== 0) {
                const expF = Math.pow(2, adj.exposure / 100);
                rp = Math.min(255, rp * expF);
                gp = Math.min(255, gp * expF);
                bp = Math.min(255, bp * expF);
            }

            if (adj.contrast !== 0) {
                const cF = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));
                rp = Math.max(0, Math.min(255, cF * (rp - 128) + 128));
                gp = Math.max(0, Math.min(255, cF * (gp - 128) + 128));
                bp = Math.max(0, Math.min(255, cF * (bp - 128) + 128));
            }

            const lum = 0.299 * (rp / 255) + 0.587 * (gp / 255) + 0.114 * (bp / 255);
            if (adj.highlights !== 0 && lum > 0.5) {
                const a = (adj.highlights / 100) * (lum - 0.5) * 2 * 50;
                rp = Math.max(0, Math.min(255, rp + a));
                gp = Math.max(0, Math.min(255, gp + a));
                bp = Math.max(0, Math.min(255, bp + a));
            }
            if (adj.shadows !== 0 && lum < 0.5) {
                const a = (adj.shadows / 100) * (0.5 - lum) * 2 * 50;
                rp = Math.max(0, Math.min(255, rp + a));
                gp = Math.max(0, Math.min(255, gp + a));
                bp = Math.max(0, Math.min(255, bp + a));
            }
            if (adj.whites !== 0 && lum > 0.8) {
                const a = (adj.whites / 100) * (lum - 0.8) * 5 * 30;
                rp = Math.max(0, Math.min(255, rp + a));
                gp = Math.max(0, Math.min(255, gp + a));
                bp = Math.max(0, Math.min(255, bp + a));
            }
            if (adj.blacks !== 0 && lum < 0.2) {
                const a = (adj.blacks / 100) * (0.2 - lum) * 5 * 30;
                rp = Math.max(0, Math.min(255, rp + a));
                gp = Math.max(0, Math.min(255, gp + a));
                bp = Math.max(0, Math.min(255, bp + a));
            }
            if (adj.saturation !== 0) {
                const satF = (adj.saturation + 100) / 100;
                const lum2 = 0.299 * (rp / 255) + 0.587 * (gp / 255) + 0.114 * (bp / 255);
                rp = Math.max(0, Math.min(255, (lum2 + satF * (rp / 255 - lum2)) * 255));
                gp = Math.max(0, Math.min(255, (lum2 + satF * (gp / 255 - lum2)) * 255));
                bp = Math.max(0, Math.min(255, (lum2 + satF * (bp / 255 - lum2)) * 255));
            }

            r = rp / 255;
            g = gp / 255;
            b = bp / 255;
        }

        return {
            r: Math.max(0, Math.min(1, r)),
            g: Math.max(0, Math.min(1, g)),
            b: Math.max(0, Math.min(1, b))
        };
    }

    /**
     * Export LUT in .cube format (Adobe/Davinci Resolve compatible)
     * @param {Array} lutData - 3D LUT data
     * @param {string} title - LUT title
     * @returns {string} .cube format string
     */
    exportCubeFormat(lutData, title = 'Color Transfer LUT') {
        let cubeContent = '';
        
        // Header
        cubeContent += `TITLE "${title}"\n`;
        cubeContent += `DOMAIN_MIN 0.0 0.0 0.0\n`;
        cubeContent += `DOMAIN_MAX 1.0 1.0 1.0\n`;
        cubeContent += `LUT_3D_SIZE ${this.lutSize}\n\n`;

        // LUT data
        for (let i = 0; i < lutData.length; i++) {
            const color = lutData[i];
            const precision = this.bitDepth === 16 ? 6 : 6;
            cubeContent += `${color.r.toFixed(precision)} ${color.g.toFixed(precision)} ${color.b.toFixed(precision)}\n`;
        }

        return cubeContent;
    }

    /**
     * Export LUT in .3dl format (Autodesk/Flame compatible)
     * @param {Array} lutData - 3D LUT data
     * @param {string} title - LUT title
     * @returns {string} .3dl format string
     */
    export3dlFormat(lutData, title = 'Color Transfer LUT') {
        let content3dl = '';
        
        // Header
        content3dl += `# ${title}\n`;
        content3dl += `# Generated by Color Transfer Tool\n`;
        content3dl += `# LUT Size: ${this.lutSize}x${this.lutSize}x${this.lutSize}\n\n`;

        // LUT data with indices
        let index = 0;
        for (let b = 0; b < this.lutSize; b++) {
            for (let g = 0; g < this.lutSize; g++) {
                for (let r = 0; r < this.lutSize; r++) {
                    const color = lutData[index];
                    const precision = 6;
                    content3dl += `${r} ${g} ${b} ${color.r.toFixed(precision)} ${color.g.toFixed(precision)} ${color.b.toFixed(precision)}\n`;
                    index++;
                }
            }
        }

        return content3dl;
    }

    /**
     * Export LUT in .lut format (Generic format)
     * @param {Array} lutData - 3D LUT data
     * @param {string} title - LUT title
     * @returns {string} .lut format string
     */
    exportLutFormat(lutData, title = 'Color Transfer LUT') {
        let lutContent = '';
        
        // Header
        lutContent += `# ${title}\n`;
        lutContent += `# LUT_3D_SIZE ${this.lutSize}\n`;
        lutContent += `# Generated by Color Transfer Tool\n\n`;

        // LUT data
        for (let i = 0; i < lutData.length; i++) {
            const color = lutData[i];
            const precision = 6;
            lutContent += `${color.r.toFixed(precision)} ${color.g.toFixed(precision)} ${color.b.toFixed(precision)}\n`;
        }

        return lutContent;
    }

    /**
     * Generate and download LUT file
     * @param {ColorTransfer} colorTransfer - Color transfer instance
     * @param {ImageAdjustments} imageAdjustments - Image adjustments instance
     * @param {Object} options - Export options
     */
    async exportLUT(colorTransfer, imageAdjustments, options = {}) {
        const {
            format = 'cube',
            lutSize = 33,
            bitDepth = 10,
            filename = 'color-transfer-lut',
            title = 'Color Transfer LUT'
        } = options;

        this.lutSize = lutSize;
        this.bitDepth = bitDepth;
        this.format = format;

        try {
            // Show progress
            const progressCallback = options.progressCallback;
            if (progressCallback) progressCallback(0, 'Generating LUT data...');

            // Generate LUT data
            const lutData = this.generateLUTData(colorTransfer, imageAdjustments);
            
            if (progressCallback) progressCallback(50, 'Formatting LUT file...');

            // Format based on selected format
            let fileContent = '';
            let fileExtension = '';
            let mimeType = 'text/plain';

            switch (format.toLowerCase()) {
                case 'cube':
                    fileContent = this.exportCubeFormat(lutData, title);
                    fileExtension = '.cube';
                    break;
                case '3dl':
                    fileContent = this.export3dlFormat(lutData, title);
                    fileExtension = '.3dl';
                    break;
                case 'lut':
                    fileContent = this.exportLutFormat(lutData, title);
                    fileExtension = '.lut';
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            if (progressCallback) progressCallback(90, 'Preparing download...');

            // Create and download file
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}${fileExtension}`;
            link.click();
            URL.revokeObjectURL(url);

            if (progressCallback) progressCallback(100, 'LUT exported successfully!');

            return {
                success: true,
                filename: `${filename}${fileExtension}`,
                size: fileContent.length,
                lutSize: this.lutSize,
                format: format
            };

        } catch (error) {
            console.error('LUT export error:', error);
            throw error;
        }
    }


}