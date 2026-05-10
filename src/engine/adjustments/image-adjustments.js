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

    srgbToLinear(value) {
        const normalized = Math.max(0, Math.min(1, value));
        if (normalized <= 0.04045) return normalized / 12.92;
        return Math.pow((normalized + 0.055) / 1.055, 2.4);
    }

    linearToSrgb(value) {
        const normalized = Math.max(0, value);
        if (normalized <= 0.0031308) return normalized * 12.92;
        return 1.055 * Math.pow(normalized, 1 / 2.4) - 0.055;
    }

    softClip(value, knee = 0.94) {
        if (value <= knee) return Math.max(0, value);
        const shoulder = 1 - knee;
        return knee + shoulder * (1 - Math.exp(-(value - knee) / Math.max(shoulder, 1e-6)));
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

        const adjustedImageData = this.cloneImageData(this.originalImageData);
        const data = adjustedImageData.data;

        // Pre-compute factors outside the loop
        const tempFactor = adjustments.temperature / 100;
        const tintFactor = adjustments.tint / 100;
        const expFactor = adjustments.exposure !== 0 ? Math.pow(2, adjustments.exposure / 100) : 1;
        const contFactor = adjustments.contrast !== 0
            ? (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast))
            : 1;
        const highlightFactor = adjustments.highlights / 100;
        const shadowFactor = adjustments.shadows / 100;
        const whitesFactor = adjustments.whites / 100;
        const blacksFactor = adjustments.blacks / 100;
        const satFactor = (adjustments.saturation + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = this.srgbToLinear(data[i] / 255);
            let g = this.srgbToLinear(data[i + 1] / 255);
            let b = this.srgbToLinear(data[i + 2] / 255);

            // Temperature
            if (adjustments.temperature !== 0) {
                if (tempFactor > 0) {
                    r *= 1 + tempFactor * 0.18;
                    b *= 1 - tempFactor * 0.14;
                } else {
                    r *= 1 + tempFactor * 0.12;
                    b *= 1 - tempFactor * 0.18;
                }
            }

            // Tint
            if (adjustments.tint !== 0) {
                r *= 1 + tintFactor * 0.08;
                g *= 1 - tintFactor * 0.12;
                b *= 1 + tintFactor * 0.08;
            }

            // Exposure
            if (adjustments.exposure !== 0) {
                r *= expFactor;
                g *= expFactor;
                b *= expFactor;
            }

            // Contrast
            if (adjustments.contrast !== 0) {
                r = ((r - 0.5) * contFactor) + 0.5;
                g = ((g - 0.5) * contFactor) + 0.5;
                b = ((b - 0.5) * contFactor) + 0.5;
            }

            // Highlights, Shadows, Whites, Blacks — single luminance calculation
            if (adjustments.highlights !== 0 || adjustments.shadows !== 0 ||
                adjustments.whites !== 0 || adjustments.blacks !== 0) {
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (adjustments.highlights !== 0 && lum > 0.5) {
                    const adj = highlightFactor * (lum - 0.5) * 0.32;
                    r += adj;
                    g += adj;
                    b += adj;
                }
                if (adjustments.shadows !== 0 && lum < 0.5) {
                    const adj = shadowFactor * (0.5 - lum) * 0.34;
                    r += adj;
                    g += adj;
                    b += adj;
                }
                if (adjustments.whites !== 0 && lum > 0.8) {
                    const adj = whitesFactor * (lum - 0.8) * 0.28;
                    r += adj;
                    g += adj;
                    b += adj;
                }
                if (adjustments.blacks !== 0 && lum < 0.2) {
                    const adj = blacksFactor * (0.2 - lum) * 0.24;
                    r += adj;
                    g += adj;
                    b += adj;
                }
            }

            // Saturation
            if (adjustments.saturation !== 0) {
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                r = lum + satFactor * (r - lum);
                g = lum + satFactor * (g - lum);
                b = lum + satFactor * (b - lum);
            }

            data[i] = Math.round(this.softClip(this.linearToSrgb(r)) * 255);
            data[i + 1] = Math.round(this.softClip(this.linearToSrgb(g)) * 255);
            data[i + 2] = Math.round(this.softClip(this.linearToSrgb(b)) * 255);
        }

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

window.ImageAdjustments = ImageAdjustments;
