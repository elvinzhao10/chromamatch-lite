/**
 * Image Adjustments Class for Post-Processing
 * Handles real-time image adjustments after color transfer
 */

class ImageAdjustments {
    constructor() {
        this.originalImageData = null;
        this.currentAdjustments = {
            temperature: 0,
            tint: 0,
            exposure: 0,
            contrast: 0,
            highlights: 0,
            shadows: 0,
            whites: 0,
            blacks: 0,
            saturation: 0
        };
    }

    /**
     * Set the original image data for adjustments
     * @param {ImageData} imageData - Original processed image data
     */
    setOriginalImageData(imageData) {
        this.originalImageData = this.cloneImageData(imageData);
    }

    /**
     * Clone ImageData object
     * @param {ImageData} imageData - Source image data
     * @returns {ImageData} Cloned image data
     */
    cloneImageData(imageData) {
        const clonedData = new Uint8ClampedArray(imageData.data);
        return new ImageData(clonedData, imageData.width, imageData.height);
    }

    /**
     * Apply temperature adjustment (warm/cool balance)
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} temperature - Temperature value (-100 to 100)
     */
    applyTemperature(imageData, temperature) {
        const data = imageData.data;
        const factor = temperature / 100;

        for (let i = 0; i < data.length; i += 4) {
            if (factor > 0) {
                // Warm (increase red, decrease blue)
                data[i] = Math.min(255, data[i] + factor * 30);     // Red
                data[i + 2] = Math.max(0, data[i + 2] - factor * 20); // Blue
            } else {
                // Cool (decrease red, increase blue)
                data[i] = Math.max(0, data[i] + factor * 20);       // Red
                data[i + 2] = Math.min(255, data[i + 2] - factor * 30); // Blue
            }
        }
    }

    /**
     * Apply tint adjustment (green/magenta balance)
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} tint - Tint value (-100 to 100)
     */
    applyTint(imageData, tint) {
        const data = imageData.data;
        const factor = tint / 100;

        for (let i = 0; i < data.length; i += 4) {
            if (factor > 0) {
                // Magenta (increase red and blue, decrease green)
                data[i] = Math.min(255, data[i] + factor * 15);     // Red
                data[i + 1] = Math.max(0, data[i + 1] - factor * 15); // Green
                data[i + 2] = Math.min(255, data[i + 2] + factor * 15); // Blue
            } else {
                // Green (decrease red and blue, increase green)
                data[i] = Math.max(0, data[i] + factor * 15);       // Red
                data[i + 1] = Math.min(255, data[i + 1] - factor * 15); // Green
                data[i + 2] = Math.max(0, data[i + 2] + factor * 15);   // Blue
            }
        }
    }

    /**
     * Apply exposure adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} exposure - Exposure value (-200 to 200)
     */
    applyExposure(imageData, exposure) {
        const data = imageData.data;
        const factor = Math.pow(2, exposure / 100);

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * factor);     // Red
            data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
            data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
        }
    }

    /**
     * Apply contrast adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} contrast - Contrast value (-100 to 100)
     */
    applyContrast(imageData, contrast) {
        const data = imageData.data;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // Red
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // Green
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // Blue
        }
    }

    /**
     * Apply highlights adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} highlights - Highlights value (-100 to 100)
     */
    applyHighlights(imageData, highlights) {
        const data = imageData.data;
        const factor = highlights / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply adjustment more to brighter pixels
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance > 0.5) {
                const adjustment = factor * (luminance - 0.5) * 2;
                data[i] = Math.max(0, Math.min(255, data[i] + adjustment * 50));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment * 50));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment * 50));
            }
        }
    }

    /**
     * Apply shadows adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} shadows - Shadows value (-100 to 100)
     */
    applyShadows(imageData, shadows) {
        const data = imageData.data;
        const factor = shadows / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply adjustment more to darker pixels
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance < 0.5) {
                const adjustment = factor * (0.5 - luminance) * 2;
                data[i] = Math.max(0, Math.min(255, data[i] + adjustment * 50));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment * 50));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment * 50));
            }
        }
    }

    /**
     * Apply whites adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} whites - Whites value (-100 to 100)
     */
    applyWhites(imageData, whites) {
        const data = imageData.data;
        const factor = whites / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply adjustment to very bright pixels
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance > 0.8) {
                const adjustment = factor * (luminance - 0.8) * 5;
                data[i] = Math.max(0, Math.min(255, data[i] + adjustment * 30));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment * 30));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment * 30));
            }
        }
    }

    /**
     * Apply blacks adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} blacks - Blacks value (-100 to 100)
     */
    applyBlacks(imageData, blacks) {
        const data = imageData.data;
        const factor = blacks / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply adjustment to very dark pixels
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance < 0.2) {
                const adjustment = factor * (0.2 - luminance) * 5;
                data[i] = Math.max(0, Math.min(255, data[i] + adjustment * 30));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment * 30));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment * 30));
            }
        }
    }

    /**
     * Apply saturation adjustment
     * @param {ImageData} imageData - Image data to adjust
     * @param {number} saturation - Saturation value (-100 to 100)
     */
    applySaturation(imageData, saturation) {
        const data = imageData.data;
        const factor = (saturation + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Calculate luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply saturation adjustment
            const newR = luminance + factor * (r - luminance);
            const newG = luminance + factor * (g - luminance);
            const newB = luminance + factor * (b - luminance);
            
            data[i] = Math.max(0, Math.min(255, newR * 255));
            data[i + 1] = Math.max(0, Math.min(255, newG * 255));
            data[i + 2] = Math.max(0, Math.min(255, newB * 255));
        }
    }

    /**
     * Apply all adjustments to the image
     * @param {Object} adjustments - Adjustment values
     * @returns {ImageData} Adjusted image data
     */
    applyAllAdjustments(adjustments = this.currentAdjustments) {
        if (!this.originalImageData) return null;

        // Clone the original image data
        const adjustedImageData = this.cloneImageData(this.originalImageData);

        // Apply adjustments in order
        if (adjustments.temperature !== 0) this.applyTemperature(adjustedImageData, adjustments.temperature);
        if (adjustments.tint !== 0) this.applyTint(adjustedImageData, adjustments.tint);
        if (adjustments.exposure !== 0) this.applyExposure(adjustedImageData, adjustments.exposure);
        if (adjustments.contrast !== 0) this.applyContrast(adjustedImageData, adjustments.contrast);
        if (adjustments.highlights !== 0) this.applyHighlights(adjustedImageData, adjustments.highlights);
        if (adjustments.shadows !== 0) this.applyShadows(adjustedImageData, adjustments.shadows);
        if (adjustments.whites !== 0) this.applyWhites(adjustedImageData, adjustments.whites);
        if (adjustments.blacks !== 0) this.applyBlacks(adjustedImageData, adjustments.blacks);
        if (adjustments.saturation !== 0) this.applySaturation(adjustedImageData, adjustments.saturation);

        return adjustedImageData;
    }

    /**
     * Update current adjustments
     * @param {Object} newAdjustments - New adjustment values
     */
    updateAdjustments(newAdjustments) {
        this.currentAdjustments = { ...this.currentAdjustments, ...newAdjustments };
    }

    /**
     * Reset all adjustments to default values
     */
    resetAdjustments() {
        this.currentAdjustments = {
            temperature: 0,
            tint: 0,
            exposure: 0,
            contrast: 0,
            highlights: 0,
            shadows: 0,
            whites: 0,
            blacks: 0,
            saturation: 0
        };
    }
}