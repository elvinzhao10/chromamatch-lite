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
        // Create a single pixel ImageData for processing
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        
        // Set pixel data
        const imageData = ctx.createImageData(1, 1);
        imageData.data[0] = Math.round(r * 255);
        imageData.data[1] = Math.round(g * 255);
        imageData.data[2] = Math.round(b * 255);
        imageData.data[3] = 255;

        // Apply color transfer if available
        let processedData = imageData;
        if (colorTransfer && colorTransfer.sourceStats && colorTransfer.targetStats) {
            // Convert to LAB and apply color transfer
            const labData = colorTransfer.rgbToLab(imageData);
            
            // Apply color transfer transformation
            const sourceStats = colorTransfer.sourceStats;
            const targetStats = colorTransfer.targetStats;
            
            for (let channel = 0; channel < 3; channel++) {
                const sourceValue = labData[channel];
                const sourceMean = sourceStats.mean[channel];
                const sourceStd = sourceStats.std[channel];
                const targetMean = targetStats.mean[channel];
                const targetStd = targetStats.std[channel];

                if (sourceStd > 0) {
                    labData[channel] = (sourceValue - sourceMean) * (targetStd / sourceStd) + targetMean;
                } else {
                    labData[channel] = targetMean;
                }
            }

            // Convert back to RGB
            processedData = colorTransfer.labToRgb(labData, 1, 1);
        }

        // Apply image adjustments
        if (imageAdjustments && imageAdjustments.currentAdjustments) {
            const adjustedData = imageAdjustments.cloneImageData(processedData);
            const adjustments = imageAdjustments.currentAdjustments;

            // Apply each adjustment
            if (adjustments.temperature !== 0) imageAdjustments.applyTemperature(adjustedData, adjustments.temperature);
            if (adjustments.tint !== 0) imageAdjustments.applyTint(adjustedData, adjustments.tint);
            if (adjustments.exposure !== 0) imageAdjustments.applyExposure(adjustedData, adjustments.exposure);
            if (adjustments.contrast !== 0) imageAdjustments.applyContrast(adjustedData, adjustments.contrast);
            if (adjustments.highlights !== 0) imageAdjustments.applyHighlights(adjustedData, adjustments.highlights);
            if (adjustments.shadows !== 0) imageAdjustments.applyShadows(adjustedData, adjustments.shadows);
            if (adjustments.whites !== 0) imageAdjustments.applyWhites(adjustedData, adjustments.whites);
            if (adjustments.blacks !== 0) imageAdjustments.applyBlacks(adjustedData, adjustments.blacks);
            if (adjustments.saturation !== 0) imageAdjustments.applySaturation(adjustedData, adjustments.saturation);

            processedData = adjustedData;
        }

        // Return normalized RGB values
        return {
            r: Math.max(0, Math.min(1, processedData.data[0] / 255)),
            g: Math.max(0, Math.min(1, processedData.data[1] / 255)),
            b: Math.max(0, Math.min(1, processedData.data[2] / 255))
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