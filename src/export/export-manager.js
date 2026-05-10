/**
 * Enhanced Export Manager for Color Transfer Tool
 * Provides full-quality and quick export functionalities
 */

class ExportManager {
    constructor() {
        this.supportedFormats = {
            png: { name: 'PNG', extension: 'png', quality: 1.0, lossless: true },
            jpeg: { name: 'JPEG', extension: 'jpg', quality: 0.95, lossless: false },
            webp: { name: 'WebP', extension: 'webp', quality: 0.95, lossless: false }
        };
        
        this.colorProfiles = {
            srgb: 'sRGB IEC61966-2.1',
            adobergb: 'Adobe RGB (1998)',
            prophoto: 'ProPhoto RGB'
        };
        
        this.resolutionPresets = {
            original: { name: 'Original Size', multiplier: 1.0 },
            hd: { name: 'HD (1920x1080)', width: 1920, height: 1080 },
            '4k': { name: '4K (3840x2160)', width: 3840, height: 2160 },
            print300: { name: 'Print 300 DPI', multiplier: 1.0, dpi: 300 },
            web72: { name: 'Web 72 DPI', multiplier: 1.0, dpi: 72 }
        };
    }

    /**
     * Quick export with optimized settings for speed
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     */
    async quickExport(canvas, filename = 'quick-export', options = {}) {
        const defaultOptions = {
            format: 'jpeg',
            quality: 0.85,
            maxDimension: 2048,
            showProgress: true
        };
        
        const exportOptions = { ...defaultOptions, ...options };
        
        try {
            if (exportOptions.showProgress) {
                this.showExportProgress('Quick Export', 'Preparing image...');
            }
            
            // Resize if needed for quick export
            let exportCanvas = canvas;
            if (this.needsResize(canvas, exportOptions.maxDimension)) {
                exportCanvas = await this.resizeCanvas(canvas, exportOptions.maxDimension);
                if (exportOptions.showProgress) {
                    this.updateExportProgress(30, 'Resizing image...');
                }
            }
            
            if (exportOptions.showProgress) {
                this.updateExportProgress(60, 'Encoding image...');
            }
            
            // Convert to blob
            const blob = await this.canvasToBlob(exportCanvas, exportOptions.format, exportOptions.quality);
            
            if (exportOptions.showProgress) {
                this.updateExportProgress(90, 'Finalizing...');
            }
            
            // Download
            this.downloadBlob(blob, `${filename}.${this.supportedFormats[exportOptions.format].extension}`);
            
            if (exportOptions.showProgress) {
                this.updateExportProgress(100, 'Export complete!');
                setTimeout(() => this.hideExportProgress(), 1500);
            }
            
            return {
                success: true,
                filename: `${filename}.${this.supportedFormats[exportOptions.format].extension}`,
                size: blob.size,
                format: exportOptions.format
            };
            
        } catch (error) {
            console.error('Quick export error:', error);
            if (exportOptions.showProgress) {
                this.hideExportProgress();
            }
            throw new Error(`Quick export failed: ${error.message}`);
        }
    }

    /**
     * Full-quality export with maximum settings and options
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {Object} settings - Full export settings
     */
    async fullQualityExport(canvas, settings) {
        const {
            filename = 'full-quality-export',
            format = 'png',
            quality = 1.0,
            resolution = 'original',
            colorProfile = 'srgb',
            preserveMetadata = true,
            customWidth = null,
            customHeight = null,
            dpi = 300
        } = settings;
        
        try {
            this.showExportProgress('Full Quality Export', 'Initializing...');
            
            // Calculate target dimensions
            const targetDimensions = this.calculateTargetDimensions(
                canvas, resolution, customWidth, customHeight
            );
            
            this.updateExportProgress(10, 'Calculating dimensions...');
            
            // Create high-quality canvas
            const exportCanvas = await this.createHighQualityCanvas(
                canvas, targetDimensions, { dpi, colorProfile }
            );
            
            this.updateExportProgress(40, 'Rendering high-quality image...');
            
            // Apply color profile if supported
            if (preserveMetadata && colorProfile !== 'srgb') {
                await this.applyColorProfile(exportCanvas, colorProfile);
            }
            
            this.updateExportProgress(70, 'Encoding with maximum quality...');
            
            // Convert with maximum quality settings
            const blob = await this.canvasToBlob(exportCanvas, format, quality);
            
            this.updateExportProgress(90, 'Adding metadata...');
            
            // Add metadata if requested
            let finalBlob = blob;
            if (preserveMetadata) {
                finalBlob = await this.addMetadata(blob, {
                    format,
                    dpi,
                    colorProfile,
                    software: 'Color Transfer Tool',
                    timestamp: new Date().toISOString()
                });
            }
            
            this.updateExportProgress(95, 'Finalizing export...');
            
            // Download
            const finalFilename = `${filename}.${this.supportedFormats[format].extension}`;
            this.downloadBlob(finalBlob, finalFilename);
            
            this.updateExportProgress(100, 'Export complete!');
            setTimeout(() => this.hideExportProgress(), 2000);
            
            return {
                success: true,
                filename: finalFilename,
                size: finalBlob.size,
                format: format,
                dimensions: targetDimensions,
                quality: quality,
                colorProfile: colorProfile
            };
            
        } catch (error) {
            console.error('Full quality export error:', error);
            this.hideExportProgress();
            throw new Error(`Full quality export failed: ${error.message}`);
        }
    }

    /**
     * Generate preview for full-quality export
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {Object} settings - Export settings
     * @returns {Object} Preview information
     */
    generatePreview(canvas, settings) {
        const {
            format = 'png',
            resolution = 'original',
            customWidth = null,
            customHeight = null,
            quality = 1.0
        } = settings;
        
        const targetDimensions = this.calculateTargetDimensions(
            canvas, resolution, customWidth, customHeight
        );
        
        const estimatedSize = this.estimateFileSize(targetDimensions, format, quality);
        const processingTime = this.estimateProcessingTime(targetDimensions, format);
        
        return {
            dimensions: targetDimensions,
            estimatedSize: this.formatFileSize(estimatedSize),
            estimatedTime: this.formatTime(processingTime),
            format: this.supportedFormats[format].name,
            quality: format === 'png' ? 'Lossless' : `${Math.round(quality * 100)}%`
        };
    }

    /**
     * Calculate target dimensions based on resolution setting
     */
    calculateTargetDimensions(canvas, resolution, customWidth, customHeight) {
        if (customWidth && customHeight) {
            return { width: customWidth, height: customHeight };
        }
        
        const preset = this.resolutionPresets[resolution];
        if (!preset) {
            return { width: canvas.width, height: canvas.height };
        }
        
        if (preset.width && preset.height) {
            // Fixed dimensions (HD, 4K)
            const aspectRatio = canvas.width / canvas.height;
            const targetAspectRatio = preset.width / preset.height;
            
            if (aspectRatio > targetAspectRatio) {
                // Canvas is wider
                return {
                    width: preset.width,
                    height: Math.round(preset.width / aspectRatio)
                };
            } else {
                // Canvas is taller
                return {
                    width: Math.round(preset.height * aspectRatio),
                    height: preset.height
                };
            }
        } else {
            // Multiplier-based (original, print, web)
            return {
                width: Math.round(canvas.width * preset.multiplier),
                height: Math.round(canvas.height * preset.multiplier)
            };
        }
    }

    /**
     * Create high-quality canvas with proper scaling
     */
    async createHighQualityCanvas(sourceCanvas, targetDimensions, options = {}) {
        const { dpi = 300, colorProfile = 'srgb' } = options;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = targetDimensions.width;
        canvas.height = targetDimensions.height;
        
        // Configure high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Apply color space if supported
        if (ctx.drawImage.length > 3 && colorProfile !== 'srgb') {
            // Modern browsers support color space
            try {
                const colorSpace = this.getColorSpaceFromProfile(colorProfile);
                if (colorSpace) {
                    ctx.colorSpace = colorSpace;
                }
            } catch (e) {
                console.warn('Color space not supported:', e);
            }
        }
        
        // Draw with high quality scaling
        ctx.drawImage(
            sourceCanvas,
            0, 0, sourceCanvas.width, sourceCanvas.height,
            0, 0, targetDimensions.width, targetDimensions.height
        );
        
        return canvas;
    }

    /**
     * Convert canvas to blob with specified format and quality
     */
    canvasToBlob(canvas, format, quality) {
        return new Promise((resolve, reject) => {
            const mimeType = `image/${format}`;
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, mimeType, quality);
        });
    }

    /**
     * Check if canvas needs resizing
     */
    needsResize(canvas, maxDimension) {
        return Math.max(canvas.width, canvas.height) > maxDimension;
    }

    /**
     * Resize canvas maintaining aspect ratio
     */
    async resizeCanvas(canvas, maxDimension) {
        const aspectRatio = canvas.width / canvas.height;
        let newWidth, newHeight;
        
        if (canvas.width > canvas.height) {
            newWidth = maxDimension;
            newHeight = maxDimension / aspectRatio;
        } else {
            newHeight = maxDimension;
            newWidth = maxDimension * aspectRatio;
        }
        
        const resizedCanvas = document.createElement('canvas');
        const ctx = resizedCanvas.getContext('2d');
        
        resizedCanvas.width = newWidth;
        resizedCanvas.height = newHeight;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
        
        return resizedCanvas;
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Estimate file size based on dimensions and format
     */
    estimateFileSize(dimensions, format, quality) {
        const pixels = dimensions.width * dimensions.height;
        
        switch (format) {
            case 'png':
                return pixels * 4; // 4 bytes per pixel for RGBA
            case 'jpeg':
                return pixels * 3 * quality * 0.1; // Rough JPEG estimation
            case 'webp':
                return pixels * 3 * quality * 0.08; // WebP is more efficient
            default:
                return pixels * 3;
        }
    }

    /**
     * Estimate processing time based on dimensions and format
     */
    estimateProcessingTime(dimensions, format) {
        const pixels = dimensions.width * dimensions.height;
        const baseTime = pixels / 1000000; // Base time per megapixel
        
        const formatMultiplier = {
            png: 1.5,
            jpeg: 1.0,
            webp: 1.2
        };
        
        return baseTime * (formatMultiplier[format] || 1.0);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Format time for display
     */
    formatTime(seconds) {
        if (seconds < 1) {
            return '< 1 second';
        } else if (seconds < 60) {
            return `${Math.round(seconds)} seconds`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        }
    }

    /**
     * Add metadata to image blob (simplified implementation)
     */
    async addMetadata(blob, metadata) {
        // For now, return the original blob
        // In a full implementation, you would use libraries like piexifjs for JPEG
        // or modify PNG chunks for PNG files
        return blob;
    }

    /**
     * Apply color profile (simplified implementation)
     */
    async applyColorProfile(canvas, profile) {
        // Simplified implementation - in practice, you'd use color management libraries
        console.log(`Applying color profile: ${profile}`);
    }

    /**
     * Get color space from profile name
     */
    getColorSpaceFromProfile(profile) {
        const mapping = {
            srgb: 'srgb',
            adobergb: 'display-p3', // Closest available
            prophoto: 'rec2020' // Closest available
        };
        return mapping[profile] || 'srgb';
    }

    /**
     * Show export progress modal
     */
    showExportProgress(title, message) {
        const modal = document.getElementById('exportProgressModal');
        if (modal) {
            document.getElementById('exportProgressTitle').textContent = title;
            document.getElementById('exportProgressMessage').textContent = message;
            document.getElementById('exportProgressBar').style.width = '0%';
            modal.style.display = 'flex';
        }
    }

    /**
     * Update export progress
     */
    updateExportProgress(percentage, message) {
        const progressBar = document.getElementById('exportProgressBar');
        const progressMessage = document.getElementById('exportProgressMessage');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }

    /**
     * Hide export progress modal
     */
    hideExportProgress() {
        const modal = document.getElementById('exportProgressModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}

window.ExportManager = ExportManager;