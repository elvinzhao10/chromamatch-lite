/**
 * Main application logic for the Color Transfer Tool
 */

// Global variables
let sourceImage = null;
let targetImage = null;
let colorTransfer = new ColorTransfer();
let imageAdjustments = new ImageAdjustments();
let lutExport = new LUTExport();
let exportManager = new ExportManager();
let colorAnalysis = new ColorAnalysis();
let originalResultData = null;

// DOM elements
const sourceInput = document.getElementById('sourceInput');
const targetInput = document.getElementById('targetInput');
const sourcePreview = document.getElementById('sourcePreview');
const targetPreview = document.getElementById('targetPreview');
const sourceImg = document.getElementById('sourceImg');
const targetImg = document.getElementById('targetImg');
const processBtn = document.getElementById('processBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const originalCanvas = document.getElementById('originalCanvas');
const referenceCanvas = document.getElementById('referenceCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const statsGrid = document.getElementById('statsGrid');

// Adjustment elements
const adjustmentsSection = document.getElementById('adjustmentsSection');
const temperatureSlider = document.getElementById('temperatureSlider');
const tintSlider = document.getElementById('tintSlider');
const exposureSlider = document.getElementById('exposureSlider');
const contrastSlider = document.getElementById('contrastSlider');
const highlightsSlider = document.getElementById('highlightsSlider');
const shadowsSlider = document.getElementById('shadowsSlider');
const whitesSlider = document.getElementById('whitesSlider');
const blacksSlider = document.getElementById('blacksSlider');
const saturationSlider = document.getElementById('saturationSlider');

// Value display elements
const temperatureValue = document.getElementById('temperatureValue');
const tintValue = document.getElementById('tintValue');
const exposureValue = document.getElementById('exposureValue');
const contrastValue = document.getElementById('contrastValue');
const highlightsValue = document.getElementById('highlightsValue');
const shadowsValue = document.getElementById('shadowsValue');
const whitesValue = document.getElementById('whitesValue');
const blacksValue = document.getElementById('blacksValue');
const saturationValue = document.getElementById('saturationValue');

// Event listeners
sourceInput.addEventListener('change', (e) => handleImageUpload(e, 'source'));
targetInput.addEventListener('change', (e) => handleImageUpload(e, 'target'));

// Adjustment sliders event listeners
temperatureSlider.addEventListener('input', (e) => updateAdjustment('temperature', e.target.value));
tintSlider.addEventListener('input', (e) => updateAdjustment('tint', e.target.value));
exposureSlider.addEventListener('input', (e) => updateAdjustment('exposure', e.target.value));
contrastSlider.addEventListener('input', (e) => updateAdjustment('contrast', e.target.value));
highlightsSlider.addEventListener('input', (e) => updateAdjustment('highlights', e.target.value));
shadowsSlider.addEventListener('input', (e) => updateAdjustment('shadows', e.target.value));
whitesSlider.addEventListener('input', (e) => updateAdjustment('whites', e.target.value));
blacksSlider.addEventListener('input', (e) => updateAdjustment('blacks', e.target.value));
saturationSlider.addEventListener('input', (e) => updateAdjustment('saturation', e.target.value));
contrastSlider.addEventListener('input', updateSliderValue);
saturationSlider.addEventListener('input', updateSliderValue);

brightnessSlider.addEventListener('input', updatePreview);
contrastSlider.addEventListener('input', updatePreview);
saturationSlider.addEventListener('input', updatePreview);

/**
 * Handle image upload
 * @param {Event} event - File input change event
 * @param {string} type - 'source' or 'target'
 */
function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showStatus('Please select a valid image file.', 'error');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showStatus('Image file is too large. Please select a file smaller than 10MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (type === 'source') {
                sourceImage = img;
                sourceImg.src = e.target.result;
                sourcePreview.style.display = 'block';
                document.getElementById('sourceUpload').classList.add('has-image');
            } else {
                targetImage = img;
                targetImg.src = e.target.result;
                targetPreview.style.display = 'block';
                document.getElementById('targetUpload').classList.add('has-image');
            }
            
            updateProcessButton();
            showStatus('Image loaded successfully!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Remove uploaded image
 * @param {string} type - 'source' or 'target'
 */
function removeImage(type) {
    if (type === 'source') {
        sourceImage = null;
        sourceInput.value = '';
        sourcePreview.style.display = 'none';
        document.getElementById('sourceUpload').classList.remove('has-image');
    } else {
        targetImage = null;
        targetInput.value = '';
        targetPreview.style.display = 'none';
        document.getElementById('targetUpload').classList.remove('has-image');
    }
    
    updateProcessButton();
    hideResults();
    showStatus('');
}

/**
 * Update process button state
 */
function updateProcessButton() {
    processBtn.disabled = !sourceImage || !targetImage;
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('success', 'error', 'processing')
 */
function showStatus(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

/**
 * Show loading state
 */
function showLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');
    
    btnText.textContent = 'Processing...';
    spinner.style.display = 'block';
    processBtn.disabled = true;
}

/**
 * Hide loading state
 */
function hideLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');
    
    btnText.textContent = 'Transfer Colors';
    spinner.style.display = 'none';
    processBtn.disabled = !sourceImage || !targetImage;
}

/**
 * Process images and perform color transfer
 */
async function processImages() {
    if (!sourceImage || !targetImage) return;

    showLoading();
    showStatus('Processing images...', 'processing');
    hideResults();

    try {
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Resize images for processing (max 800px)
        const maxSize = 800;
        const sourceCanvas = resizeImage(sourceImage, maxSize);
        const targetCanvas = resizeImage(targetImage, maxSize);

        // Get image data
        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');
        
        const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const targetImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

        // Perform color transfer
        showStatus('Applying color transfer algorithm...', 'processing');
        await new Promise(resolve => setTimeout(resolve, 50));

        const result = colorTransfer.transferColors(sourceImageData, targetImageData);

        // Display results
        displayResults(sourceImageData, targetImageData, result);
        showStatus('Color transfer completed successfully!', 'success');

    } catch (error) {
        console.error('Error processing images:', error);
        showStatus('An error occurred while processing the images. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Resize image while maintaining aspect ratio
 * @param {Image} img - Source image
 * @param {number} maxSize - Maximum dimension
 * @returns {HTMLCanvasElement} Resized canvas
 */
function resizeImage(img, maxSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let { width, height } = img;

    // Calculate new dimensions
    if (width > height) {
        if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        }
    } else {
        if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
}

/**
 * Display processing results
 * @param {ImageData} sourceData - Source image data
 * @param {ImageData} targetData - Target image data
 * @param {Object} result - Processing result
 */
function displayResults(sourceData, targetData, result) {
    // Store original result data for adjustments
    originalResultData = result.imageData;
    imageAdjustments.setOriginalImageData(result.imageData);

    // Display images on canvases
    displayImageData(originalCanvas, sourceData);
    displayImageData(referenceCanvas, targetData);
    displayImageData(resultCanvas, result.imageData);

    // Generate comprehensive color analysis (includes statistics)
    generateColorAnalysisVisualization(sourceData, targetData, result.imageData);

    // Show adjustments section
    adjustmentsSection.style.display = 'block';

    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display image data on canvas
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {ImageData} imageData - Image data to display
 */
function displayImageData(canvas, imageData) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Display color statistics comparison
 */
function displayStatistics() {
    const stats = colorTransfer.getStatisticsComparison();
    
    statsGrid.innerHTML = '';
    
    stats.forEach(stat => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        statItem.innerHTML = `
            <h4>${stat.name}</h4>
            <div class="stat-row">
                <span class="stat-label">Source Mean:</span>
                <span class="stat-value">${stat.source.mean}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Source Std:</span>
                <span class="stat-value">${stat.source.std}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Target Mean:</span>
                <span class="stat-value">${stat.target.mean}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Target Std:</span>
                <span class="stat-value">${stat.target.std}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Mean Diff:</span>
                <span class="stat-value">${stat.difference.mean}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Std Ratio:</span>
                <span class="stat-value">${stat.difference.stdRatio}</span>
            </div>
        `;
        
        statsGrid.appendChild(statItem);
    });
}

/**
 * Hide results section
 */
function hideResults() {
    resultsSection.style.display = 'none';
    adjustmentsSection.style.display = 'none';
    originalResultData = null;
    imageAdjustments.resetAdjustments();
}

/**
 * Download the result image (legacy function)
 */
function downloadResult() {
    const link = document.createElement('a');
    link.download = 'color-transfer-result.png';
    link.href = resultCanvas.toDataURL();
    link.click();
}

/**
 * Quick export with optimized settings
 */
async function quickExportResult() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    try {
        const result = await exportManager.quickExport(resultCanvas, 'color-transfer-quick', {
            format: 'jpeg',
            quality: 0.85,
            maxDimension: 2048,
            showProgress: true
        });

        showStatus(`Quick export completed: ${result.filename} (${exportManager.formatFileSize(result.size)})`, 'success');
    } catch (error) {
        console.error('Quick export error:', error);
        showStatus(`Quick export failed: ${error.message}`, 'error');
    }
}

/**
 * Show full quality export dialog
 */
function showFullExportDialog() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    // Initialize dialog values
    document.getElementById('exportFormat').value = 'png';
    document.getElementById('exportQuality').value = '0.95';
    document.getElementById('exportResolution').value = 'original';
    document.getElementById('colorProfile').value = 'srgb';
    document.getElementById('exportFilename').value = 'color-transfer-full-quality';
    document.getElementById('preserveMetadata').checked = true;

    // Update quality group visibility
    updateQualityGroupVisibility();
    
    // Update preview
    updateExportPreview();

    // Show dialog
    document.getElementById('fullExportModal').style.display = 'flex';
}

/**
 * Close full quality export dialog
 */
function closeFullExportDialog() {
    document.getElementById('fullExportModal').style.display = 'none';
}

/**
 * Update quality group visibility based on format
 */
function updateQualityGroupVisibility() {
    const format = document.getElementById('exportFormat').value;
    const qualityGroup = document.getElementById('qualityGroup');
    const customSizeGroup = document.getElementById('customSizeGroup');
    const resolution = document.getElementById('exportResolution').value;
    
    // Show/hide quality slider for lossy formats
    qualityGroup.style.display = format === 'png' ? 'none' : 'block';
    
    // Show/hide custom size inputs
    customSizeGroup.style.display = resolution === 'custom' ? 'block' : 'none';
    
    // Update quality value display
    const qualitySlider = document.getElementById('exportQuality');
    const qualityValue = document.getElementById('qualityValue');
    qualityValue.textContent = Math.round(qualitySlider.value * 100) + '%';
}

/**
 * Update export preview information
 */
function updateExportPreview() {
    if (!resultCanvas) return;

    updateQualityGroupVisibility();

    const format = document.getElementById('exportFormat').value;
    const quality = parseFloat(document.getElementById('exportQuality').value);
    const resolution = document.getElementById('exportResolution').value;
    const customWidth = parseInt(document.getElementById('customWidth').value) || null;
    const customHeight = parseInt(document.getElementById('customHeight').value) || null;

    const settings = {
        format,
        quality,
        resolution,
        customWidth,
        customHeight
    };

    const preview = exportManager.generatePreview(resultCanvas, settings);

    document.getElementById('previewDimensions').textContent = `${preview.dimensions.width} × ${preview.dimensions.height}`;
    document.getElementById('previewSize').textContent = preview.estimatedSize;
    document.getElementById('previewTime').textContent = preview.estimatedTime;
    document.getElementById('previewQuality').textContent = preview.quality;
}

/**
 * Execute full quality export
 */
async function executeFullExport() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    const settings = {
        filename: document.getElementById('exportFilename').value || 'color-transfer-full-quality',
        format: document.getElementById('exportFormat').value,
        quality: parseFloat(document.getElementById('exportQuality').value),
        resolution: document.getElementById('exportResolution').value,
        colorProfile: document.getElementById('colorProfile').value,
        preserveMetadata: document.getElementById('preserveMetadata').checked,
        customWidth: parseInt(document.getElementById('customWidth').value) || null,
        customHeight: parseInt(document.getElementById('customHeight').value) || null,
        dpi: 300
    };

    try {
        closeFullExportDialog();
        
        const result = await exportManager.fullQualityExport(resultCanvas, settings);

        showStatus(`Full quality export completed: ${result.filename} (${exportManager.formatFileSize(result.size)})`, 'success');
    } catch (error) {
        console.error('Full quality export error:', error);
        showStatus(`Full quality export failed: ${error.message}`, 'error');
    }
}

/**
 * Generate comprehensive color analysis visualization
 * @param {ImageData} sourceData - Original image data
 * @param {ImageData} targetData - Reference image data
 * @param {ImageData} resultData - Result image data
 */
function generateColorAnalysisVisualization(sourceData, targetData, resultData) {
    showStatus('Generating color analysis visualizations...', 'processing');
    
    // Small delay to allow UI to update
    setTimeout(() => {
        try {
            // Analyze all three images
            const originalAnalysis = colorAnalysis.analyzeImage(sourceData, 'Original Image');
            const referenceAnalysis = colorAnalysis.analyzeImage(targetData, 'Reference Image');
            const resultAnalysis = colorAnalysis.analyzeImage(resultData, 'Result Image');

            // Get visualization container
            const container = document.getElementById('colorVisualizationContainer');
            
            // Create comprehensive visualization
            colorAnalysis.createComprehensiveVisualization(
                originalAnalysis,
                referenceAnalysis,
                resultAnalysis,
                container
            );

            showStatus('Color analysis visualization completed!', 'success');
        } catch (error) {
            console.error('Color analysis error:', error);
            showStatus('Error generating color analysis visualization.', 'error');
        }
    }, 100);
}

// Drag and drop functionality
function setupDragAndDrop() {
    const uploadBoxes = document.querySelectorAll('.upload-box');
    
    uploadBoxes.forEach(box => {
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.style.borderColor = '#667eea';
            box.style.backgroundColor = '#f8f9ff';
        });
        
        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.style.borderColor = '#ddd';
            box.style.backgroundColor = '';
        });
        
        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.style.borderColor = '#ddd';
            box.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const type = box.id === 'sourceUpload' ? 'source' : 'target';
                const input = type === 'source' ? sourceInput : targetInput;
                input.files = files;
                handleImageUpload({ target: input }, type);
            }
        });
    });
}

/**
 * Update adjustment value and apply real-time changes
 * @param {string} adjustmentType - Type of adjustment
 * @param {string} value - New value
 */
function updateAdjustment(adjustmentType, value) {
    const numValue = parseInt(value);
    
    // Update display value
    const valueElement = document.getElementById(`${adjustmentType}Value`);
    if (valueElement) {
        valueElement.textContent = numValue;
    }
    
    // Update adjustment object
    imageAdjustments.updateAdjustments({ [adjustmentType]: numValue });
    
    // Apply adjustments in real-time if we have processed image data
    if (originalResultData) {
        applyAdjustmentsRealTime();
    }
}

/**
 * Apply adjustments in real-time
 */
function applyAdjustmentsRealTime() {
    if (!originalResultData) return;
    
    const adjustedImageData = imageAdjustments.applyAllAdjustments();
    if (adjustedImageData) {
        displayImageData(resultCanvas, adjustedImageData);
    }
}

/**
 * Reset all adjustments to default values
 */
function resetAdjustments() {
    imageAdjustments.resetAdjustments();
    
    // Reset all sliders
    temperatureSlider.value = 0;
    tintSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 0;
    highlightsSlider.value = 0;
    shadowsSlider.value = 0;
    whitesSlider.value = 0;
    blacksSlider.value = 0;
    saturationSlider.value = 0;
    
    // Reset all value displays
    temperatureValue.textContent = '0';
    tintValue.textContent = '0';
    exposureValue.textContent = '0';
    contrastValue.textContent = '0';
    highlightsValue.textContent = '0';
    shadowsValue.textContent = '0';
    whitesValue.textContent = '0';
    blacksValue.textContent = '0';
    saturationValue.textContent = '0';
    
    // Apply reset adjustments
    if (originalResultData) {
        applyAdjustmentsRealTime();
    }
}



/**
 * Show LUT export dialog
 */
function showLUTExportDialog() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }
    
    document.getElementById('lutExportModal').style.display = 'flex';
}

/**
 * Close LUT export dialog
 */
function closeLUTExportDialog() {
    document.getElementById('lutExportModal').style.display = 'none';
    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
}

/**
 * Export LUT with current settings
 */
async function exportLUT() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }

    const format = document.getElementById('lutFormat').value;
    const lutSize = parseInt(document.getElementById('lutSize').value);
    const bitDepth = parseInt(document.getElementById('lutBitDepth').value);
    const filename = document.getElementById('lutFilename').value || 'color-transfer-lut';
    const title = document.getElementById('lutTitle').value || 'Color Transfer LUT';

    // Show progress
    document.getElementById('exportProgress').style.display = 'block';
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    try {
        const result = await lutExport.exportLUT(colorTransfer, imageAdjustments, {
            format,
            lutSize,
            bitDepth,
            filename,
            title,
            progressCallback: (progress, message) => {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = message;
            }
        });

        showStatus(`LUT exported successfully: ${result.filename} (${result.size} bytes)`, 'success');
        
        // Close dialog after a short delay
        setTimeout(() => {
            closeLUTExportDialog();
        }, 2000);

    } catch (error) {
        console.error('LUT export error:', error);
        showStatus(`LUT export failed: ${error.message}`, 'error');
        progressText.textContent = 'Export failed';
    }
}



// Initialize drag and drop when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop();
    
    // Add event listeners for export dialog
    const exportFormat = document.getElementById('exportFormat');
    const exportResolution = document.getElementById('exportResolution');
    const exportQuality = document.getElementById('exportQuality');
    
    if (exportFormat) {
        exportFormat.addEventListener('change', updateExportPreview);
    }
    if (exportResolution) {
        exportResolution.addEventListener('change', updateExportPreview);
    }
    if (exportQuality) {
        exportQuality.addEventListener('input', updateExportPreview);
    }
});