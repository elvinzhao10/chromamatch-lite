/**
 * ChromaMatch Lite - Advanced Color Grading Application
 * Full Stack with Smart Reference Search and Presets System
 */

// Global state
let sourceImage = null;
let targetImage = null;
let colorTransfer = new ColorTransfer();
let imageAdjustments = new ImageAdjustments();
let lutExport = new LUTExport();
let exportManager = new ExportManager();
let colorAnalysis = new ColorAnalysis();
let smartMatcher = new SmartMatcher();
let presetManager = new PresetManager();

let originalResultData = null;
let currentAdjustedResultData = null;
let cachedSourceImageData = null;
let cachedTargetImageData = null;
let analysisUpdateTimer = null;
let strengthDebounceTimer = null;
let adjustmentFrame = null;
let analysisFrame = null;
let shouldAutoScrollToResults = true;
let currentReferenceDataUrl = null;
const REFERENCE_MEMORY_KEY = 'chromamatch_reference_memory';
const displayScratchCanvas = document.createElement('canvas');
const analysisScratchCanvas = document.createElement('canvas');

// Search state
let searchService = new SearchService();

// DOM elements
const sourceInput = document.getElementById('sourceInput');
const targetInput = document.getElementById('targetInput');
const uploadSection = document.getElementById('uploadSection');
const sourcePreview = document.getElementById('sourcePreview');
const targetPreview = document.getElementById('targetPreview');
const sourceImg = document.getElementById('sourceImg');
const targetImg = document.getElementById('targetImg');
const processBtn = document.getElementById('processBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const themeToggle = document.getElementById('themeToggle');
const originalCanvas = document.getElementById('originalCanvas');
const referenceCanvas = document.getElementById('referenceCanvas');
const resultCanvas = document.getElementById('resultCanvas');

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

const temperatureValue = document.getElementById('temperatureValue');
const tintValue = document.getElementById('tintValue');
const exposureValue = document.getElementById('exposureValue');
const contrastValue = document.getElementById('contrastValue');
const highlightsValue = document.getElementById('highlightsValue');
const shadowsValue = document.getElementById('shadowsValue');
const whitesValue = document.getElementById('whitesValue');
const blacksValue = document.getElementById('blacksValue');
const saturationValue = document.getElementById('saturationValue');
const strengthSlider = document.getElementById('strengthSlider');
const strengthValue = document.getElementById('strengthValue');
const algorithmMethod = document.getElementById('algorithmMethod');
const performanceMode = document.getElementById('performanceMode');
const methodHint = document.getElementById('methodHint');

// Advanced mode toggles
const advancedOptionsPanel = document.getElementById('advancedOptionsPanel');
const presetPanelBtn = document.getElementById('presetPanelBtn');

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('chromamatch-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('chromamatch-theme', next);
    applyTheme(next);
}

// Event listeners
sourceInput.addEventListener('change', (e) => handleImageUpload(e, 'source'));
if (targetInput) {
    targetInput.addEventListener('change', (e) => handleImageUpload(e, 'target'));
}

temperatureSlider.addEventListener('input', (e) => updateAdjustment('temperature', e.target.value));
tintSlider.addEventListener('input', (e) => updateAdjustment('tint', e.target.value));
exposureSlider.addEventListener('input', (e) => updateAdjustment('exposure', e.target.value));
contrastSlider.addEventListener('input', (e) => updateAdjustment('contrast', e.target.value));
highlightsSlider.addEventListener('input', (e) => updateAdjustment('highlights', e.target.value));
shadowsSlider.addEventListener('input', (e) => updateAdjustment('shadows', e.target.value));
whitesSlider.addEventListener('input', (e) => updateAdjustment('whites', e.target.value));
blacksSlider.addEventListener('input', (e) => updateAdjustment('blacks', e.target.value));
saturationSlider.addEventListener('input', (e) => updateAdjustment('saturation', e.target.value));
strengthSlider.addEventListener('input', (e) => updateStrength(e.target.value));

algorithmMethod.addEventListener('change', () => {
    updateMethodHint();
    if (cachedSourceImageData) reapplyTransfer();
});
performanceMode.addEventListener('change', () => {
    updateMethodHint();
    if (cachedSourceImageData) reapplyTransfer();
});

// Advanced feature buttons
if (presetPanelBtn) {
    presetPanelBtn.addEventListener('click', togglePresetPanel);
}

function updateMethodHint(result = null) {
    const method = algorithmMethod.value;
    const perf = performanceMode.value;
    const baseHint = {
        'hybrid-lab': 'Hybrid LAB: balanced global transfer plus histogram refinement for higher matching accuracy.',
        'reinhard-lab': 'Reinhard LAB: fast and natural global color transfer.',
        'lab-histogram': 'LAB histogram matching: better tonal alignment, slower on large images.',
        'rgb-mean-std': 'RGB mean/std: fastest option, less perceptual accuracy.',
        'auto': 'Auto mode picks method from image size + performance setting.'
    }[method];

    const perfHint = {
        fast: 'Fast mode uses heavier sampling for speed.',
        balanced: 'Balanced mode provides good speed/quality tradeoff.',
        quality: 'Quality mode uses dense sampling for better accuracy.'
    }[perf];

    const resolved = result?.method && result.method !== method
        ? ` Active: ${result.method}.`
        : '';

    if (methodHint) {
        methodHint.textContent = `${baseHint} ${perfHint}${resolved}`;
    }
}

function revertToImageSelection() {
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
    hideResults();
    shouldAutoScrollToResults = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAllModals() {
    ['fullExportModal', 'lutExportModal', 'refPopup', 'settingsModal'].forEach((id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

function setActiveDashboardWindow(windowId) {
    document.querySelectorAll('.dashboard-window').forEach((panel) => {
        panel.classList.toggle('active', panel.id === windowId);
    });

    const resultWindowToggles = document.getElementById('resultWindowToggles');
    if (resultWindowToggles) {
        resultWindowToggles.querySelectorAll('.window-toggle').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.window === windowId);
        });
    }

    if (windowId === 'windowOrigVsResult' && originalCanvas.width) {
        const slider = document.getElementById('compareOriginalResultSlider');
        redrawComparison(
            document.getElementById('compareOriginalResultBottom'),
            document.getElementById('compareOriginalResultTop'),
            originalCanvas, resultCanvas,
            slider ? parseInt(slider.value, 10) : 50
        );
    }
    if (windowId === 'windowRefVsResult' && referenceCanvas.width) {
        const slider = document.getElementById('compareReferenceResultSlider');
        redrawComparison(
            document.getElementById('compareReferenceResultBottom'),
            document.getElementById('compareReferenceResultTop'),
            referenceCanvas, resultCanvas,
            slider ? parseInt(slider.value, 10) : 50
        );
    }
}

function setActiveToolLayer(layerId) {
    document.querySelectorAll('.tool-layer').forEach((layer) => {
        layer.classList.toggle('active', layer.id === layerId);
    });

    const toolLayerToggles = document.getElementById('toolLayerToggles');
    if (toolLayerToggles) {
        toolLayerToggles.querySelectorAll('.layer-toggle').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.layer === layerId);
        });
    }
}

function setupDashboardInteractions() {
    const resultWindowToggles = document.getElementById('resultWindowToggles');
    if (resultWindowToggles) {
        resultWindowToggles.addEventListener('click', (event) => {
            const button = event.target.closest('.window-toggle');
            if (!button) return;
            setActiveDashboardWindow(button.dataset.window);
        });
    }

    const toolLayerToggles = document.getElementById('toolLayerToggles');
    if (toolLayerToggles) {
        toolLayerToggles.addEventListener('click', (event) => {
            const button = event.target.closest('.layer-toggle');
            if (!button) return;
            setActiveToolLayer(button.dataset.layer);
        });
    }

    const origSlider = document.getElementById('compareOriginalResultSlider');
    if (origSlider) {
        origSlider.addEventListener('input', () => {
            redrawComparison(
                document.getElementById('compareOriginalResultBottom'),
                document.getElementById('compareOriginalResultTop'),
                originalCanvas, resultCanvas,
                parseInt(origSlider.value, 10)
            );
        });
    }

    const refSlider = document.getElementById('compareReferenceResultSlider');
    if (refSlider) {
        refSlider.addEventListener('input', () => {
            redrawComparison(
                document.getElementById('compareReferenceResultBottom'),
                document.getElementById('compareReferenceResultTop'),
                referenceCanvas, resultCanvas,
                parseInt(refSlider.value, 10)
            );
        });
    }
}

function getTransferOptions() {
    return {
        strength: parseInt(strengthSlider.value, 10) / 100,
        method: algorithmMethod.value,
        performanceMode: performanceMode.value
    };
}

function getProcessingMaxSize() {
    const mode = performanceMode ? performanceMode.value : 'balanced';
    if (mode === 'fast') return 1440;
    if (mode === 'quality') return 2800;
    return 2048;
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showStatus('Please select a valid image file.', 'error');
        return;
    }

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
                currentReferenceDataUrl = e.target.result;
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

function removeImage(type) {
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }

    if (type === 'source') {
        sourceImage = null;
        sourceInput.value = '';
        sourcePreview.style.display = 'none';
        document.getElementById('sourceUpload').classList.remove('has-image');
    } else {
        targetImage = null;
        currentReferenceDataUrl = null;
        targetInput.value = '';
        targetPreview.style.display = 'none';
        document.getElementById('targetUpload').classList.remove('has-image');
    }

    updateProcessButton();
    hideResults();
    showStatus('');
}

function updateProcessButton() {
    if (processBtn) {
        processBtn.disabled = !sourceImage || !targetImage;
    }
}

function showStatus(message, type = '') {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }
}

function showError(message) {
    showStatus(message, 'error');
}

function getReferenceMemory() {
    try {
        return JSON.parse(localStorage.getItem(REFERENCE_MEMORY_KEY)) || {
            lastQuery: '',
            searchHistory: [],
            selectedPresetId: null,
            savedLooks: []
        };
    } catch {
        return {
            lastQuery: '',
            searchHistory: [],
            selectedPresetId: null,
            savedLooks: []
        };
    }
}

function saveReferenceMemory(memory) {
    localStorage.setItem(REFERENCE_MEMORY_KEY, JSON.stringify(memory));
}

function updateReferenceMemory(patch) {
    const next = { ...getReferenceMemory(), ...patch };
    saveReferenceMemory(next);
    return next;
}

function rememberSearchQuery(query, details = {}) {
    const memory = getReferenceMemory();
    const searchHistory = [
        { query, timestamp: new Date().toISOString(), ...details },
        ...memory.searchHistory.filter((item) => item.query !== query)
    ].slice(0, 12);
    saveReferenceMemory({
        ...memory,
        lastQuery: query,
        searchHistory
    });
}

function rememberReferenceSelection(meta = {}) {
    const memory = getReferenceMemory();
    const savedLooks = [
        {
            timestamp: new Date().toISOString(),
            presetId: memory.selectedPresetId,
            styleState: unifiedSession?.styleState || null,
            ...meta
        },
        ...memory.savedLooks
    ].slice(0, 8);
    saveReferenceMemory({
        ...memory,
        savedLooks
    });
}

function applyReferenceMemoryToPrompt(query) {
    const memory = getReferenceMemory();
    const preset = memory.selectedPresetId ? presetManager.getPresetById(memory.selectedPresetId) : null;
    const recentQueries = memory.searchHistory.slice(0, 3).map((item) => item.query);
    const hints = [];

    if (preset?.name) {
        hints.push(`anchor preset: ${preset.name}`);
    }
    if (preset?.tags?.length) {
        hints.push(`preset tags: ${preset.tags.join(', ')}`);
    }
    if (unifiedSession?.styleState?.visualStyle) {
        hints.push(`style memory: ${unifiedSession.styleState.visualStyle}`);
    }
    if (recentQueries.length) {
        hints.push(`recent reference intent: ${recentQueries.join(' | ')}`);
    }

    return hints.length ? `${query}\nContext: ${hints.join(' ; ')}` : query;
}

function buildReferenceSearchContext(query) {
    const memory = getReferenceMemory();
    const preset = memory.selectedPresetId ? presetManager.getPresetById(memory.selectedPresetId) : null;
    const hints = [];

    if (preset?.name) hints.push(`anchor preset: ${preset.name}`);
    if (preset?.tags?.length) hints.push(`preset tags: ${preset.tags.slice(0, 4).join(', ')}`);
    if (unifiedSession?.styleState?.visualStyle) hints.push(`style memory: ${unifiedSession.styleState.visualStyle}`);

    return hints.length ? `${query}\nSearch context: ${hints.join(' ; ')}` : query;
}

function showLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');

    btnText.textContent = 'Processing...';
    spinner.style.display = 'block';
    processBtn.disabled = true;
}

function hideLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');

    btnText.textContent = 'Transfer Colors';
    spinner.style.display = 'none';
    processBtn.disabled = !sourceImage || !targetImage;
}

async function processImages() {
    if (!sourceImage || !targetImage) return;

    showLoading();
    showStatus('Processing images...', 'processing');
    hideResults();

    try {
        const maxProcessingSize = getProcessingMaxSize();
        const sourceCanvas = resizeImage(sourceImage, maxProcessingSize);
        const targetCanvas = resizeImage(targetImage, maxProcessingSize);

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');

        const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const targetImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

        showStatus('Applying color transfer algorithm...', 'processing');

        cachedSourceImageData = sourceImageData;
        cachedTargetImageData = targetImageData;

        const options = getTransferOptions();
        let result;

        result = colorTransfer.transferColors(sourceImageData, targetImageData, options);

        updateMethodHint(result);

        displayResults(sourceImageData, targetImageData, result);
        showStatus('Color transfer completed successfully!', 'success');

    } catch (error) {
        console.error('Error processing images:', error);
        showStatus('An error occurred while processing the images. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function resizeImage(img, maxSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let { width, height } = img;

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

    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
}

function displayResults(sourceData, targetData, result) {
    originalResultData = result.imageData;
    currentAdjustedResultData = result.imageData;
    imageAdjustments.setOriginalImageData(result.imageData);

    displayImageData(originalCanvas, sourceData);
    displayImageData(referenceCanvas, targetData);
    displayImageData(resultCanvas, result.imageData);
    updateComparisonViews();

    generateColorAnalysisVisualization(sourceData, targetData, result.imageData);

    adjustmentsSection.style.display = 'block';

    setActiveDashboardWindow('windowThreeUp');
    setActiveToolLayer('layerTransfer');

    if (uploadSection) {
        uploadSection.style.display = 'none';
    }

    resultsSection.style.display = 'block';
    if (shouldAutoScrollToResults) {
        shouldAutoScrollToResults = false;
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateComparisonViews() {
    const compareOriginalResultBottom = document.getElementById('compareOriginalResultBottom');
    const compareOriginalResultTop = document.getElementById('compareOriginalResultTop');
    const compareOriginalResultSlider = document.getElementById('compareOriginalResultSlider');
    const compareReferenceResultBottom = document.getElementById('compareReferenceResultBottom');
    const compareReferenceResultTop = document.getElementById('compareReferenceResultTop');
    const compareReferenceResultSlider = document.getElementById('compareReferenceResultSlider');

    if (compareOriginalResultSlider && compareOriginalResultBottom) {
        redrawComparison(
            compareOriginalResultBottom,
            compareOriginalResultTop,
            originalCanvas,
            resultCanvas,
            parseInt(compareOriginalResultSlider.value, 10)
        );
    }

    if (compareReferenceResultSlider && compareReferenceResultBottom) {
        redrawComparison(
            compareReferenceResultBottom,
            compareReferenceResultTop,
            referenceCanvas,
            resultCanvas,
            parseInt(compareReferenceResultSlider.value, 10)
        );
    }
}

function redrawComparison(bottomCanvas, topCanvas, leftCanvas, rightCanvas, splitPercent) {
    if (!leftCanvas.width || !rightCanvas.width) return;

    const width = Math.max(leftCanvas.width, rightCanvas.width);
    const height = Math.max(leftCanvas.height, rightCanvas.height);

    bottomCanvas.width = width;
    bottomCanvas.height = height;
    topCanvas.width = width;
    topCanvas.height = height;

    const bottomCtx = bottomCanvas.getContext('2d');
    const topCtx = topCanvas.getContext('2d');
    bottomCtx.clearRect(0, 0, width, height);
    topCtx.clearRect(0, 0, width, height);

    bottomCtx.drawImage(leftCanvas, 0, 0, width, height);
    topCtx.drawImage(rightCanvas, 0, 0, width, height);

    topCanvas.style.clipPath = `inset(0 0 0 ${splitPercent}%)`;
}

function displayImageData(canvas, imageData) {
    const MAX_DISPLAY = 1200;
    let w = imageData.width;
    let h = imageData.height;
    if (w > MAX_DISPLAY || h > MAX_DISPLAY) {
        const scale = MAX_DISPLAY / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    displayScratchCanvas.width = imageData.width;
    displayScratchCanvas.height = imageData.height;
    displayScratchCanvas.getContext('2d').putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(displayScratchCanvas, 0, 0, w, h);
}

function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    adjustmentsSection.style.display = 'none';
    originalResultData = null;
    currentAdjustedResultData = null;
    cachedSourceImageData = null;
    cachedTargetImageData = null;
    if (adjustmentFrame) cancelAnimationFrame(adjustmentFrame);
    if (analysisFrame) cancelAnimationFrame(analysisFrame);
    clearTimeout(analysisUpdateTimer);
    clearTimeout(strengthDebounceTimer);
    adjustmentFrame = null;
    analysisFrame = null;
    imageAdjustments.resetAdjustments();
}

function downloadResult() {
    const link = document.createElement('a');
    link.download = 'chromamatch-result.png';
    link.href = resultCanvas.toDataURL();
    link.click();
}

async function quickExportResult() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    try {
        const result = await exportManager.quickExport(resultCanvas, 'chromamatch-quick', {
            format: 'jpeg',
            quality: 0.85,
            maxDimension: 2048,
            showProgress: true
        });

        showStatus(`Quick export completed: ${result.filename}`, 'success');
    } catch (error) {
        console.error('Quick export error:', error);
        showStatus(`Quick export failed: ${error.message}`, 'error');
    }
}

function showFullExportDialog() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    const exportFormat = document.getElementById('exportFormat');
    const exportQuality = document.getElementById('exportQuality');
    const exportResolution = document.getElementById('exportResolution');
    const qualityGroup = document.getElementById('qualityGroup');
    const customSizeGroup = document.getElementById('customSizeGroup');

    if (exportFormat) exportFormat.value = 'png';
    if (exportQuality) exportQuality.value = '0.95';
    if (exportResolution) exportResolution.value = 'original';

    if (qualityGroup) qualityGroup.style.display = 'none';
    if (customSizeGroup) customSizeGroup.style.display = 'none';

    document.getElementById('fullExportModal').style.display = 'flex';
}

function closeFullExportDialog() {
    document.getElementById('fullExportModal').style.display = 'none';
}

async function executeFullExport() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    const settings = {
        filename: document.getElementById('exportFilename')?.value || 'chromamatch-full-quality',
        format: document.getElementById('exportFormat')?.value || 'png',
        quality: parseFloat(document.getElementById('exportQuality')?.value || '0.95'),
        resolution: document.getElementById('exportResolution')?.value || 'original'
    };

    try {
        closeFullExportDialog();
        const result = await exportManager.fullQualityExport(resultCanvas, settings);
        showStatus(`Full quality export completed: ${result.filename}`, 'success');
    } catch (error) {
        console.error('Full quality export error:', error);
        showStatus(`Full quality export failed: ${error.message}`, 'error');
    }
}

function generateColorAnalysisVisualization(sourceData, targetData, resultData) {
    showStatus('Generating color analysis...', 'processing');
    clearTimeout(analysisUpdateTimer);
    analysisUpdateTimer = setTimeout(() => {
        try {
            const originalAnalysis = colorAnalysis.analyzeImage(sourceData, 'Original Image');
            const referenceAnalysis = colorAnalysis.analyzeImage(targetData, 'Reference Image');
            const resultAnalysis = colorAnalysis.analyzeImage(resultData, 'Result Image');

            const container = document.getElementById('colorVisualizationContainer');

            colorAnalysis.createComprehensiveVisualization(
                originalAnalysis,
                referenceAnalysis,
                resultAnalysis,
                container
            );

            showStatus('Color analysis completed!', 'success');

        } catch (error) {
            console.error('Color analysis error:', error);
            showStatus('Error generating color analysis.', 'error');
        }
    }, 60);
}

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

function updateAdjustment(adjustmentType, value) {
    const numValue = parseInt(value);

    const valueElement = document.getElementById(`${adjustmentType}Value`);
    if (valueElement) {
        valueElement.textContent = numValue;
    }

    imageAdjustments.updateAdjustments({ [adjustmentType]: numValue });

    if (originalResultData) {
        scheduleAdjustmentPreview();
    }
}

function applyAdjustmentsRealTime() {
    if (!originalResultData) return;

    const adjustedImageData = imageAdjustments.applyAllAdjustments();
    if (adjustedImageData) {
        currentAdjustedResultData = adjustedImageData;
        displayImageData(resultCanvas, adjustedImageData);
        updateComparisonViews();
        scheduleAnalysisUpdate();
    }
}

function scheduleAdjustmentPreview() {
    if (adjustmentFrame) {
        cancelAnimationFrame(adjustmentFrame);
    }

    adjustmentFrame = requestAnimationFrame(() => {
        adjustmentFrame = null;
        applyAdjustmentsRealTime();
    });
}

function reapplyTransfer() {
    if (!cachedSourceImageData || !cachedTargetImageData) return;

    const result = colorTransfer.transferColors(cachedSourceImageData, cachedTargetImageData, getTransferOptions());
    updateMethodHint(result);
    originalResultData = result.imageData;
    imageAdjustments.setOriginalImageData(result.imageData);
    applyAdjustmentsRealTime();
}

function scheduleAnalysisUpdate() {
    clearTimeout(analysisUpdateTimer);
    if (analysisFrame) cancelAnimationFrame(analysisFrame);
    analysisUpdateTimer = setTimeout(() => {
        analysisFrame = requestAnimationFrame(() => {
            analysisFrame = null;
            updateLiveAnalysis();
        });
    }, 180);
}

function updateLiveAnalysis() {
    if (!currentAdjustedResultData || !colorAnalysis.cachedRefAnalysis) return;

    const maxSize = 400;
    let imageData = currentAdjustedResultData;

    if (currentAdjustedResultData.width > maxSize || currentAdjustedResultData.height > maxSize) {
        const scale = maxSize / Math.max(currentAdjustedResultData.width, currentAdjustedResultData.height);
        const w = Math.round(currentAdjustedResultData.width * scale);
        const h = Math.round(currentAdjustedResultData.height * scale);
        analysisScratchCanvas.width = w;
        analysisScratchCanvas.height = h;
        const scratchCtx = analysisScratchCanvas.getContext('2d');
        displayScratchCanvas.width = currentAdjustedResultData.width;
        displayScratchCanvas.height = currentAdjustedResultData.height;
        displayScratchCanvas.getContext('2d').putImageData(currentAdjustedResultData, 0, 0);
        scratchCtx.clearRect(0, 0, w, h);
        scratchCtx.drawImage(displayScratchCanvas, 0, 0, w, h);
        imageData = scratchCtx.getImageData(0, 0, w, h);
    }

    colorAnalysis.updateResultVisualization(imageData);
}

function updateStrength(value) {
    strengthValue.textContent = parseInt(value);
    clearTimeout(strengthDebounceTimer);
    strengthDebounceTimer = setTimeout(reapplyTransfer, 120);
}

function resetAdjustments() {
    imageAdjustments.resetAdjustments();

    temperatureSlider.value = 0;
    tintSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 0;
    highlightsSlider.value = 0;
    shadowsSlider.value = 0;
    whitesSlider.value = 0;
    blacksSlider.value = 0;
    saturationSlider.value = 0;
    strengthSlider.value = 100;

    temperatureValue.textContent = '0';
    tintValue.textContent = '0';
    exposureValue.textContent = '0';
    contrastValue.textContent = '0';
    highlightsValue.textContent = '0';
    shadowsValue.textContent = '0';
    whitesValue.textContent = '0';
    blacksValue.textContent = '0';
    saturationValue.textContent = '0';
    strengthValue.textContent = '100';

    if (cachedSourceImageData) {
        reapplyTransfer();
    }
}

// Reference Popup System
function openReferencePopup() {
    closeAllModals();
    document.getElementById('refPopup').style.display = 'flex';
    setupRefPopupEvents();
}

function closeReferencePopup() {
    document.getElementById('refPopup').style.display = 'none';
}

function setupRefPopupEvents() {
    const searchInput = document.getElementById('refPopupSearchInput');
    const searchBtn = document.getElementById('refPopupDoSearch');
    const sourceSelect = document.getElementById('refPopupSourceSelect');
    const chips = document.querySelectorAll('.ref-popup-chips button');
    const tabs = document.querySelectorAll('.ref-tab-btn');
    
    searchBtn.onclick = () => doRefPopupSearch();
    searchInput.onkeypress = (e) => { if (e.key === 'Enter') doRefPopupSearch(); };
    if (sourceSelect && !sourceSelect.dataset.bound) {
        sourceSelect.dataset.bound = 'true';
        sourceSelect.addEventListener('change', updateReferenceModeHint);
        updateReferenceModeHint();
    }
    
    chips.forEach(ch => {
        ch.onclick = () => { searchInput.value = ch.dataset.search; doRefPopupSearch(); };
    });
    
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.ref-panel').forEach(p => p.style.display = 'none');
            const panel = document.getElementById(tab.dataset.panel);
            if (panel) panel.style.display = 'block';
        };
    });
    
    document.getElementById('refAiSend').onclick = sendRefAiMessage;
    document.getElementById('refAiInput').onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRefAiMessage(); }
    };
    
    document.querySelectorAll('.ref-ai-quick-chips button').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('refAiInput').value = btn.dataset.msg;
            sendRefAiMessage();
        };
    });
    
    const zone = document.getElementById('refUploadZone');
    if (zone && !zone._dropSetup) {
        zone._dropSetup = true;
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const f = e.dataTransfer?.files?.[0];
            if (f) handleRefFile(f);
        });
    }
}

function updateReferenceModeHint() {
    const mode = document.getElementById('refPopupSourceSelect')?.value || 'ai';
    const hint = document.getElementById('refSourceHint');
    if (!hint) return;

    const text = {
        ai: 'AI expands fuzzy descriptions and searches across the best sources.',
        cinema: 'Bias toward film stills, widescreen frames, and cinematography references.',
        photo: 'Bias toward strong photographic lighting, palette, and environment references.',
        archive: 'Bias toward literal documentary and archival imagery with less stylization.'
    }[mode] || '';

    hint.textContent = text;
}

function summarizeReferenceClassification(classification) {
    if (!classification) return '';
    const facets = classification.facets || {};
    const parts = [
        ...(facets.colors || []).slice(0, 2),
        ...(facets.subjects || []).slice(0, 2),
        ...(facets.techniques || []).slice(0, 2),
        ...Object.values(facets.taxonomy || {}).flat().slice(0, 2)
    ].filter(Boolean);

    const labelMap = {
        film: 'Film match',
        'film-keyword': 'Cinema search',
        style: 'Style search',
        descriptive: 'Visual search',
        keyword: 'Keyword search'
    };

    const label = labelMap[classification.type] || 'Search';
    return parts.length ? `${label}: ${parts.join(' • ')}` : label;
}

async function doRefPopupSearch() {
    const query = document.getElementById('refPopupSearchInput')?.value?.trim();
    if (!query) return;
    
    const source = document.getElementById('refPopupSourceSelect')?.value || 'ai';
    const container = document.getElementById('refPopupResults');
    const grid = document.getElementById('refPopupGrid');
    
    const oldBanner = container.querySelector('.film-match-banner, .desc-banner');
    if (oldBanner) oldBanner.remove();
    
    grid.innerHTML = '<div class="loading">Searching...</div>';
    container.style.display = 'block';
    rememberSearchQuery(query, { source });
    
    try {
        let result;
        const aiSearchPrompt = buildReferenceSearchContext(query);
        const aiProvider = getSelectedAiProvider() || unifiedSession.routeTask('chat', aiSearchPrompt);
        const aiKey = getAIKey(aiProvider);
        const aiModel = getAIChatModel(aiProvider);
        const aiBaseUrl = getAIBaseUrl(aiProvider);
        
        const modeSources = searchService.resolveMode(source);

        if (aiKey && source === 'ai') {
            result = await searchService.aiDrivenSearch(query, {
                provider: aiProvider,
                apiKey: aiKey,
                model: aiModel,
                baseUrl: aiBaseUrl,
                contextHint: aiSearchPrompt,
                sources: modeSources
            });
        } else {
            result = await searchService.smartSearch(query, modeSources);
        }
        
        const existingBanner = container.querySelector('.film-match-banner, .desc-banner');
        if (existingBanner) existingBanner.remove();
        
        if (result.filmMatch) {
            const banner = document.createElement('div');
            banner.className = 'film-match-banner';
            banner.textContent = `${result.filmMatch.title} (${result.filmMatch.year}) \u2014 Dir: ${result.filmMatch.director} \u2014 DP: ${result.filmMatch.dp} \u2014 ${result.filmMatch.keywords}`;
            container.insertBefore(banner, grid);
        } else if (result.classification?.type === 'descriptive' || result.classification?.type === 'style' || result.classification?.type === 'film-keyword') {
            const banner = document.createElement('div');
            banner.className = 'desc-banner';
            banner.textContent = summarizeReferenceClassification(result.classification);
            container.insertBefore(banner, grid);
        }
        
        if (!result.results || !result.results.length) {
            grid.innerHTML = '<div class="no-results">No results found. Try simplifying your search, using a film title, director name, or style keywords like "teal orange cinematic".</div>';
            return;
        }
        
        grid.innerHTML = result.results.map(img => `
            <div class="reference-result-card" data-url="${img.url}" data-thumb="${img.thumbnail}">
                <img src="${img.thumbnail}" alt="${img.description || 'Reference'}" loading="lazy" />
                <div class="result-overlay"><span class="result-source">${img.source}</span></div>
            </div>
        `).join('');
        grid.querySelectorAll('.reference-result-card').forEach(card => {
            card.addEventListener('click', () => loadRefPopupImage(card));
        });
    } catch (e) {
        console.error('Search error:', e);
        grid.innerHTML = '<div class="error-message">Search failed. Check the browser console for details.</div>';
    }
}

function loadRefPopupImage(card) {
    const url = card.dataset.url;
    showStatus('Loading reference image...', 'processing');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        try {
            const id = c.getContext('2d').getImageData(0, 0, c.width, c.height);
            setRefImageData(id);
            closeReferencePopup();
        } catch (e) { showError('CORS error. Try upload instead.'); }
    };
    img.onerror = () => showError('Failed to load. Try another image.');
    img.src = url;
}

function setRefImageData(imageData) {
    const c = document.createElement('canvas');
    c.width = imageData.width; c.height = imageData.height;
    c.getContext('2d').putImageData(imageData, 0, 0);
    const dataUrl = c.toDataURL();
    currentReferenceDataUrl = dataUrl;
    cachedTargetImageData = imageData;
    rememberReferenceSelection({
        width: imageData.width,
        height: imageData.height,
        referenceDataUrl: dataUrl.slice(0, 128)
    });
    targetImg.src = dataUrl;
    targetPreview.style.display = 'block';
    document.getElementById('targetUpload').classList.add('has-image');
    
    const img = new Image();
    img.onload = () => {
        targetImage = img;
        updateProcessButton();
        if (cachedSourceImageData) processImages();
    };
    img.src = dataUrl;
    
    updateProcessButton();
    showStatus('Loaded!', 'success');
}

function handleRefFile(file) {
    if (!file.type.startsWith('image/')) { showError('Select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            setRefImageData(c.getContext('2d').getImageData(0, 0, c.width, c.height));
            closeReferencePopup();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// AI Unified Session
const unifiedSession = new UnifiedSession();

function getAIKey(provider) { return localStorage.getItem('ai_key_' + provider) || ''; }
function getAIBaseUrl(provider) { var c = PROVIDER_CONFIGS[provider]; return localStorage.getItem('ai_baseurl_' + provider) || (c && c.chatBaseUrl) || ''; }
function getAIChatModel(provider) {
    var customOverride = localStorage.getItem('ai_custom_chatmodel_' + provider) || '';
    return customOverride || localStorage.getItem('ai_chatmodel_' + provider) || (PROVIDER_CONFIGS[provider] && PROVIDER_CONFIGS[provider].chatModels[0] && PROVIDER_CONFIGS[provider].chatModels[0].value) || '';
}
function getAIImgModel(provider) {
    var customOverride = localStorage.getItem('ai_custom_imgmodel_' + provider) || '';
    return customOverride || localStorage.getItem('ai_imgmodel_' + provider) || (PROVIDER_CONFIGS[provider] && PROVIDER_CONFIGS[provider].imgModels[0] && PROVIDER_CONFIGS[provider].imgModels[0].value) || '';
}
const PROVIDER_REGISTRY_KEY = 'cm_provider_registry_v1';
const PROVIDER_MODEL_CACHE_KEY = 'cm_provider_model_cache_v1';
let providerEditorState = { editingId: null };

function readJsonStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getProviderModelCache() {
    return readJsonStorage(PROVIDER_MODEL_CACHE_KEY, {});
}

function setProviderModelCache(cache) {
    writeJsonStorage(PROVIDER_MODEL_CACHE_KEY, cache || {});
}

function buildProviderEntry(preset, overrides) {
    const config = PROVIDER_CONFIGS[preset] || {};
    const now = new Date().toISOString();
    return {
        id: 'provider_' + Math.random().toString(36).slice(2, 10),
        preset,
        displayName: config.label || preset,
        apiKey: '',
        baseUrl: config.chatBaseUrl || '',
        chatModel: config.chatModels?.[0]?.value || '',
        imgModel: config.imgModels?.[0]?.value || '',
        customChatModel: '',
        customImgModel: '',
        docsUrl: config.docsUrl || '',
        createdAt: now,
        updatedAt: now,
        ...(overrides || {})
    };
}

function syncLegacyProviderSettings(entries) {
    ['openai', 'gemini', 'deerapi', 'custom'].forEach((preset) => {
        const entry = entries.find((item) => item.preset === preset);
        const values = {
            ['ai_key_' + preset]: entry?.apiKey || '',
            ['ai_baseurl_' + preset]: entry?.baseUrl || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
            ['ai_chatmodel_' + preset]: entry?.chatModel || (PROVIDER_CONFIGS[preset]?.chatModels?.[0]?.value || ''),
            ['ai_imgmodel_' + preset]: entry?.imgModel || (PROVIDER_CONFIGS[preset]?.imgModels?.[0]?.value || ''),
            ['ai_custom_chatmodel_' + preset]: entry?.customChatModel || '',
            ['ai_custom_imgmodel_' + preset]: entry?.customImgModel || ''
        };
        Object.entries(values).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
            else localStorage.removeItem(key);
        });
    });
}

function migrateLegacyProviderRegistry() {
    const entries = [];
    ['openai', 'gemini', 'deerapi', 'custom'].forEach((preset) => {
        const apiKey = localStorage.getItem('ai_key_' + preset) || '';
        const baseUrl = localStorage.getItem('ai_baseurl_' + preset) || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || '');
        const chatModel = localStorage.getItem('ai_chatmodel_' + preset) || (PROVIDER_CONFIGS[preset]?.chatModels?.[0]?.value || '');
        const imgModel = localStorage.getItem('ai_imgmodel_' + preset) || (PROVIDER_CONFIGS[preset]?.imgModels?.[0]?.value || '');
        const customChatModel = localStorage.getItem('ai_custom_chatmodel_' + preset) || '';
        const customImgModel = localStorage.getItem('ai_custom_imgmodel_' + preset) || '';
        if (apiKey || baseUrl || chatModel || imgModel || customChatModel || customImgModel) {
            entries.push(buildProviderEntry(preset, {
                displayName: PROVIDER_CONFIGS[preset]?.label || preset,
                apiKey,
                baseUrl,
                chatModel,
                imgModel,
                customChatModel,
                customImgModel,
                docsUrl: PROVIDER_CONFIGS[preset]?.docsUrl || ''
            }));
        }
    });
    if (entries.length) {
        writeJsonStorage(PROVIDER_REGISTRY_KEY, entries);
    }
    return entries;
}

function getProviderRegistry() {
    const stored = readJsonStorage(PROVIDER_REGISTRY_KEY, null);
    return Array.isArray(stored) ? stored : migrateLegacyProviderRegistry();
}

function saveProviderRegistry(entries) {
    writeJsonStorage(PROVIDER_REGISTRY_KEY, entries);
    syncLegacyProviderSettings(entries);
}

function getProviderPresetOptions() {
    return Object.keys(PROVIDER_CONFIGS).map((preset) => ({
        value: preset,
        label: PROVIDER_CONFIGS[preset].label || preset
    }));
}

function maskKey(key) {
    if (!key) return 'Missing key';
    if (key.length <= 8) return 'Saved';
    return key.slice(0, 4) + '…' + key.slice(-4);
}

function getProviderStatus(entry) {
    if (!entry.apiKey) return 'Needs API key';
    if (entry.preset === 'custom' && !entry.baseUrl) return 'Needs base URL';
    return 'Ready';
}

function getMergedModelOptions(preset, kind, currentValue) {
    const configOptions = (kind === 'chat' ? PROVIDER_CONFIGS[preset]?.chatModels : PROVIDER_CONFIGS[preset]?.imgModels) || [];
    const cache = getProviderModelCache();
    const cachedOptions = cache[preset]?.[kind] || [];
    const map = new Map();
    [...configOptions, ...cachedOptions].forEach((item) => {
        if (!item?.value) return;
        map.set(item.value, { value: item.value, label: item.label || item.value });
    });
    if (currentValue && !map.has(currentValue)) {
        map.set(currentValue, { value: currentValue, label: currentValue + ' (current)' });
    }
    return Array.from(map.values());
}

function populateModelSelect(selectId, options, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
    select.value = selectedValue && options.some((option) => option.value === selectedValue)
        ? selectedValue
        : (options[0]?.value || '');
}

function renderProviderRegistryTable() {
    const tbody = document.getElementById('providerRegistryTableBody');
    if (!tbody) return;
    const entries = getProviderRegistry();
    if (!entries.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-muted">No providers added yet. Use “Add Provider” to start from a preset.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((entry) => `
        <tr>
            <td>${entry.displayName || PROVIDER_CONFIGS[entry.preset]?.label || entry.preset}<div class="provider-subtle">${maskKey(entry.apiKey)}</div></td>
            <td>${PROVIDER_CONFIGS[entry.preset]?.label || entry.preset}</td>
            <td><span class="provider-status-chip ${getProviderStatus(entry) === 'Ready' ? 'ready' : 'pending'}">${getProviderStatus(entry)}</span></td>
            <td>${entry.customChatModel || entry.chatModel || '<span class="table-muted">Unset</span>'}</td>
            <td>${entry.customImgModel || entry.imgModel || '<span class="table-muted">Unset</span>'}</td>
            <td>${entry.baseUrl || '<span class="table-muted">Default</span>'}</td>
            <td>${entry.docsUrl ? `<a href="${entry.docsUrl}" target="_blank" rel="noopener noreferrer">Docs</a>` : '<span class="table-muted">Custom</span>'}</td>
            <td><button type="button" class="secondary-btn provider-edit-btn" data-provider-id="${entry.id}">Edit</button></td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.provider-edit-btn').forEach((button) => {
        button.addEventListener('click', () => openProviderEditor(button.dataset.providerId));
    });
}

function getSelectablePresets(editingId) {
    const entries = getProviderRegistry();
    const editingEntry = entries.find((entry) => entry.id === editingId);
    const taken = new Set(entries.filter((entry) => entry.id !== editingId).map((entry) => entry.preset));
    return getProviderPresetOptions().filter((option) => !taken.has(option.value) || option.value === editingEntry?.preset);
}

function refreshProviderPresetSelect(editingId) {
    const select = document.getElementById('providerPresetSelect');
    if (!select) return;
    const options = getSelectablePresets(editingId);
    select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
}

function updateProviderEditorModels(preset, entry) {
    populateModelSelect('providerChatModel', getMergedModelOptions(preset, 'chat', entry.chatModel), entry.chatModel);
    populateModelSelect('providerImgModel', getMergedModelOptions(preset, 'img', entry.imgModel), entry.imgModel);
}

function applyProviderPreset(preset, entry) {
    const config = PROVIDER_CONFIGS[preset] || {};
    const docsLink = document.getElementById('providerDocsLink');
    const hint = document.getElementById('providerEditorHint');
    const baseInput = document.getElementById('providerBaseUrl');
    if (docsLink) {
        docsLink.href = config.docsUrl || '#';
        docsLink.style.display = config.docsUrl ? 'inline-flex' : 'none';
    }
    if (hint) {
        hint.textContent = config.setupBlurb || 'Fill the required fields for this provider.';
    }
    if (baseInput && !providerEditorState.editingId && !baseInput.value) {
        baseInput.value = config.chatBaseUrl || '';
    }
    updateProviderEditorModels(preset, entry);
}

function closeProviderEditor() {
    providerEditorState.editingId = null;
    const card = document.getElementById('providerEditorCard');
    if (card) card.style.display = 'none';
}

function openProviderEditor(providerId) {
    const entries = getProviderRegistry();
    const editing = entries.find((entry) => entry.id === providerId) || null;
    providerEditorState.editingId = editing?.id || null;
    refreshProviderPresetSelect(providerEditorState.editingId);
    const selectablePresets = getSelectablePresets(providerEditorState.editingId);
    if (!editing && !selectablePresets.length) {
        showError('All built-in provider presets are already added. Edit an existing row instead.');
        return;
    }
    const preset = editing?.preset || document.getElementById('providerPresetSelect')?.value || selectablePresets?.[0]?.value || 'openai';
    const entry = editing || buildProviderEntry(preset);
    document.getElementById('providerEditorCard').style.display = 'block';
    document.getElementById('providerEditorTitle').textContent = editing ? 'Edit Provider' : 'Add Provider';
    document.getElementById('providerPresetSelect').value = preset;
    document.getElementById('providerDisplayName').value = entry.displayName || '';
    document.getElementById('providerApiKey').value = entry.apiKey || '';
    document.getElementById('providerBaseUrl').value = entry.baseUrl || '';
    document.getElementById('providerCustomChatModel').value = entry.customChatModel || '';
    document.getElementById('providerCustomImgModel').value = entry.customImgModel || '';
    document.getElementById('deleteProviderBtn').style.display = editing ? 'inline-flex' : 'none';
    applyProviderPreset(preset, entry);
}

function collectProviderEditorData() {
    const preset = document.getElementById('providerPresetSelect')?.value || 'openai';
    return {
        preset,
        displayName: document.getElementById('providerDisplayName')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.label || preset),
        apiKey: document.getElementById('providerApiKey')?.value?.trim() || '',
        baseUrl: document.getElementById('providerBaseUrl')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
        chatModel: document.getElementById('providerChatModel')?.value || '',
        imgModel: document.getElementById('providerImgModel')?.value || '',
        customChatModel: document.getElementById('providerCustomChatModel')?.value?.trim() || '',
        customImgModel: document.getElementById('providerCustomImgModel')?.value?.trim() || '',
        docsUrl: PROVIDER_CONFIGS[preset]?.docsUrl || ''
    };
}

function saveProviderFromEditor() {
    const data = collectProviderEditorData();
    if (!data.apiKey) {
        showError('API key is required for a provider to be usable.');
        return;
    }
    if (data.preset === 'custom' && !data.baseUrl) {
        showError('Custom providers need a base URL.');
        return;
    }
    const entries = getProviderRegistry();
    const duplicate = entries.find((entry) => entry.preset === data.preset && entry.id !== providerEditorState.editingId);
    if (duplicate) {
        showError((PROVIDER_CONFIGS[data.preset]?.label || data.preset) + ' is already added. Edit the existing row instead.');
        return;
    }
    if (providerEditorState.editingId) {
        const index = entries.findIndex((entry) => entry.id === providerEditorState.editingId);
        if (index >= 0) entries[index] = { ...entries[index], ...data, updatedAt: new Date().toISOString() };
    } else {
        entries.push(buildProviderEntry(data.preset, data));
    }
    saveProviderRegistry(entries);
    renderProviderRegistryTable();
    showStatus('Provider saved.', 'success');
    closeProviderEditor();
}

function deleteProviderFromEditor() {
    if (!providerEditorState.editingId) return;
    const entries = getProviderRegistry().filter((entry) => entry.id !== providerEditorState.editingId);
    saveProviderRegistry(entries);
    renderProviderRegistryTable();
    showStatus('Provider removed.', 'success');
    closeProviderEditor();
}

function classifyRemoteModels(provider, modelIds) {
    const chat = [];
    const img = [];
    modelIds.forEach((modelId) => {
        const lower = modelId.toLowerCase();
        const option = { value: modelId, label: modelId };
        if (/image|imagen|vision-image|dall-e|gpt-image/.test(lower)) img.push(option);
        else if (!/embed|embedding|tts|transcrib|speech|rerank/.test(lower)) chat.push(option);
    });
    return {
        chat: chat.length ? chat : getMergedModelOptions(provider, 'chat'),
        img: img.length ? img : getMergedModelOptions(provider, 'img')
    };
}

async function refreshProviderModels() {
    const data = collectProviderEditorData();
    if (!data.apiKey) {
        showError('Add an API key first so the app can ask the provider for its model list.');
        return;
    }
    const baseUrl = (data.baseUrl || PROVIDER_CONFIGS[data.preset]?.chatBaseUrl || '').replace(/\/+$/, '');
    if (!baseUrl) {
        showError('This provider needs a base URL before models can be refreshed.');
        return;
    }
    try {
        let modelIds = [];
        if (data.preset === 'gemini') {
            const response = await fetch(baseUrl + '/models?key=' + encodeURIComponent(data.apiKey));
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load Gemini models');
            modelIds = (payload.models || []).map((model) => String(model.name || '').replace(/^models\//, '')).filter(Boolean);
        } else {
            const response = await fetch(baseUrl + '/models', {
                headers: { Authorization: 'Bearer ' + data.apiKey }
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load models');
            modelIds = (payload.data || []).map((model) => model.id).filter(Boolean);
        }
        const cache = getProviderModelCache();
        cache[data.preset] = classifyRemoteModels(data.preset, modelIds);
        setProviderModelCache(cache);
        applyProviderPreset(data.preset, { ...data });
        showStatus('Model list refreshed.', 'success');
    } catch (error) {
        showError('Could not refresh models: ' + error.message);
    }
}

function initSettingsUi() {
    if (document.body.dataset.settingsUiReady === 'true') return;
    document.body.dataset.settingsUiReady = 'true';
    document.getElementById('addProviderBtn')?.addEventListener('click', () => openProviderEditor());
    document.getElementById('providerEditorClose')?.addEventListener('click', closeProviderEditor);
    document.getElementById('saveProviderBtn')?.addEventListener('click', saveProviderFromEditor);
    document.getElementById('deleteProviderBtn')?.addEventListener('click', deleteProviderFromEditor);
    document.getElementById('refreshProviderModelsBtn')?.addEventListener('click', refreshProviderModels);
    document.getElementById('providerPresetSelect')?.addEventListener('change', (event) => {
        const preset = event.target.value;
        const entry = buildProviderEntry(preset, {
            displayName: document.getElementById('providerDisplayName')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.label || preset),
            apiKey: document.getElementById('providerApiKey')?.value?.trim() || '',
            baseUrl: document.getElementById('providerBaseUrl')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
            customChatModel: document.getElementById('providerCustomChatModel')?.value?.trim() || '',
            customImgModel: document.getElementById('providerCustomImgModel')?.value?.trim() || ''
        });
        applyProviderPreset(preset, entry);
    });
}
function getSelectedAiProvider() {
    var selected = document.getElementById('refAiProvider')?.value || 'auto';
    return selected === 'auto' ? null : selected;
}
function getSelectedAiAction() {
    return document.getElementById('refAiAction')?.value || 'auto';
}
function resolveProviderForIntent(intent, message) {
    var forcedProvider = getSelectedAiProvider();
    if (forcedProvider) return forcedProvider;
    if (intent === 'generate' || intent === 'tune') return unifiedSession.routeTask('generate_image', message);
    return unifiedSession.routeTask('chat', message);
}
function getReferenceImageForAi() {
    return currentReferenceDataUrl || targetImg?.src || unifiedSession.generatedImages[unifiedSession.generatedImages.length - 1] || null;
}

function sendRefAiMessage() {
    var input = document.getElementById('refAiInput');
    var chat = document.getElementById('refAiChat');
    var msg = input.value.trim();
    if (!msg) return;
    var welcome = chat.querySelector('.ref-ai-welcome');
    if (welcome) welcome.remove();
    appendChatMessage('user', msg);
    input.value = '';
    var enrichedMessage = applyReferenceMemoryToPrompt(msg);
    var intent = classifyUserIntent(msg, getSelectedAiAction());
    var provider = resolveProviderForIntent(intent, msg);
    var apiKey = getAIKey(provider);
    if (!apiKey) {
        appendChatMessage('assistant', 'No API key for ' + (PROVIDER_CONFIGS[provider] ? PROVIDER_CONFIGS[provider].label : provider) + '. Go to Settings.');
        return;
    }
    var model = getAIChatModel(provider);
    var baseUrl = getAIBaseUrl(provider);
    rememberSearchQuery(msg, { source: 'ai-guide', provider, intent });
    if (intent === 'generate') { doGenerateImage(provider, enrichedMessage, apiKey, getAIImgModel(provider), baseUrl, chat); return; }
    if (intent === 'tune') { doTuneReference(provider, enrichedMessage, apiKey, getAIImgModel(provider), baseUrl, chat); return; }
    if (intent === 'search') { doSearchIntent(enrichedMessage, provider, model, apiKey, baseUrl, chat); return; }
    doChatIntent(enrichedMessage, provider, model, apiKey, baseUrl, chat);
}

function classifyUserIntent(msg, forcedAction) {
    if (forcedAction && forcedAction !== 'auto') {
        return forcedAction;
    }
    var l = msg.toLowerCase();
    if (/\b(tune|edit|adjust|refine|variant|remix|iterate)\b/i.test(l) && /\b(reference|image|shot|look)\b/i.test(l)) return 'tune';
    if (/\b(generate|create|make|draw|paint|produce|dall-e|imagen)\b/i.test(l) && /\b(image|picture|scene|visual)\b/i.test(l)) return 'generate';
    if (l.startsWith('generate ') || l.startsWith('create ')) return 'generate';
    if (/\b(search|find|look|browse|fetch|get me|show me|give me)\b/i.test(l)) return 'search';
    if (l.startsWith('find ') || l.startsWith('search ')) return 'search';
    return 'chat';
}

async function doChatIntent(msg, provider, model, apiKey, baseUrl, chat) {
    var thinkEl = appendChatMessage('assistant', 'Thinking...', 'thinking');
    try {
        var reply = await unifiedSession.chat(msg, [], {
            provider: provider, chatModel: model, baseUrl: baseUrl, apiKey: apiKey,
            systemPrompt: 'You are a professional color grading and cinematography assistant. Help with film references, color palettes, lighting, visual aesthetics. Be concise (2-4 sentences).',
            metadata: { routed_to: provider }
        });
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', reply);
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Error: ' + e.message); }
}

async function doSearchIntent(msg, provider, model, apiKey, baseUrl, chat) {
    var thinkEl = appendChatMessage('assistant', 'Searching...', 'thinking');
    try {
        var kw = await getSearchKeywordsFromAI(provider, msg, apiKey, model, baseUrl);
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', 'Searching with: ' + kw);
        var sources = ['wikimedia', 'flickr'];
        if (localStorage.getItem('sett_tmdb_key')) sources.push('tmdb');
        if (localStorage.getItem('sett_unsplash_key')) sources.push('unsplash');
        if (localStorage.getItem('sett_pexels_key')) sources.push('pexels');
        var keywords = kw.split(/\n|,/).map(function(part) { return part.trim(); }).filter(Boolean);
        var searches = keywords.length ? keywords : [msg];
        var collected = await searchService.searchMultiQuery(searches, sources, { perPage: 8, limit: 16 });
        var ranked = searchService.rankResults(collected, msg, searchService.classifyQuery(msg));
        var r = { results: ranked.slice(0, 16) };
        if (!r.results || !r.results.length) { appendChatMessage('assistant', 'No results.'); return; }
        appendChatMessage('assistant', 'Found ' + r.results.length + ' images:');
        renderChatResults(chat, r.results);
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Failed: ' + e.message); }
}

async function getSearchKeywordsFromAI(provider, msg, apiKey, model, baseUrl) {
    try {
        var ts = new UnifiedSession();
        var r = await ts.chat(msg, [], {
            provider: provider, chatModel: model, baseUrl: baseUrl, apiKey: apiKey,
            systemPrompt: 'Turn the request into 3 short search queries for finding cinematic reference imagery. Use one line per query. Include film titles or style terms only when they improve retrieval. Output only the queries.'
        });
        return r ? r.replace(/["']/g, '').trim() : msg;
    } catch (e) { return msg; }
}

function renderChatResults(chat, results) {
    var g = document.createElement('div');
    g.className = 'ref-popup-grid chat-inline-grid';
    g.innerHTML = results.map(function(i) {
        return '<div class="reference-result-card" data-url="' + i.url + '" data-thumb="' + i.thumbnail + '"><img src="' + i.thumbnail + '" alt="' + (i.description || 'Ref') + '" loading="lazy" /><div class="result-overlay"><span class="result-source">' + i.source + '</span></div></div>';
    }).join('');
    g.querySelectorAll('.reference-result-card').forEach(function(c) {
        c.addEventListener('click', function() { loadRefPopupImage(c); });
    });
    chat.appendChild(g); chat.scrollTop = chat.scrollHeight;
}

async function doGenerateImage(provider, prompt, apiKey, imgModel, baseUrl, chat) {
    var label = PROVIDER_CONFIGS[provider] ? PROVIDER_CONFIGS[provider].label : provider;
    var thinkEl = appendChatMessage('assistant', 'Generating image (' + label + ')...', 'thinking');
    try {
        var url = await unifiedSession.generateImage(prompt, { provider: provider, imgModel: imgModel, baseUrl: baseUrl, apiKey: apiKey });
        if (thinkEl) thinkEl.remove();
        if (!url) { appendChatMessage('assistant', 'No image generated.'); return; }
        appendChatMessage('assistant', 'Generated image:');
        var c = document.createElement('div'); c.className = 'chat-generated-img';
        c.innerHTML = '<img src="' + url + '" alt="Generated" /><button class="use-gen-btn">Use as Reference</button>';
        c.querySelector('button').onclick = function() {
            var i = new Image(); i.crossOrigin = 'anonymous';
            i.onload = function() {
                var cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height;
                cv.getContext('2d').drawImage(i, 0, 0);
                try { setRefImageData(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)); closeReferencePopup(); } catch(e) { showError('CORS error.'); }
            };
            i.src = url;
        };
        chat.appendChild(c); chat.scrollTop = chat.scrollHeight;
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Failed: ' + e.message); }
}

async function doTuneReference(provider, prompt, apiKey, imgModel, baseUrl, chat) {
    var referenceImage = getReferenceImageForAi();
    if (!referenceImage) {
        appendChatMessage('assistant', 'Load or generate a reference first, then ask me to tune it.');
        return;
    }

    var thinkEl = appendChatMessage('assistant', 'Tuning current reference...', 'thinking');
    try {
        var url = await unifiedSession.generateImage(prompt, {
            provider: provider,
            imgModel: imgModel,
            baseUrl: baseUrl,
            apiKey: apiKey,
            referenceImages: [referenceImage]
        });
        if (thinkEl) thinkEl.remove();
        if (!url) {
            appendChatMessage('assistant', 'No edited image returned.');
            return;
        }
        appendChatMessage('assistant', 'Tuned reference ready:');
        var c = document.createElement('div'); c.className = 'chat-generated-img';
        c.innerHTML = '<img src="' + url + '" alt="Tuned reference" /><button class="use-gen-btn">Use as Reference</button>';
        c.querySelector('button').onclick = function() {
            var i = new Image(); i.crossOrigin = 'anonymous';
            i.onload = function() {
                var cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height;
                cv.getContext('2d').drawImage(i, 0, 0);
                try { setRefImageData(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)); closeReferencePopup(); } catch(e) { showError('CORS error.'); }
            };
            i.src = url;
        };
        chat.appendChild(c); chat.scrollTop = chat.scrollHeight;
    } catch (e) {
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', 'Failed: ' + e.message);
    }
}

function appendChatMessage(role, text, extraClass) {
    var chat = document.getElementById('refAiChat');
    var el = document.createElement('div');
    el.className = 'chat-msg ' + role + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
}

function openSettings() {
    closeAllModals();
    initSettingsUi();
    document.getElementById('settingsModal').style.display = 'flex';
    renderProviderRegistryTable();
    closeProviderEditor();
    const tmdb = document.getElementById('settTmdbKey');
    const unsplash = document.getElementById('settUnsplashKey');
    const pexels = document.getElementById('settPexelsKey');
    if (tmdb) tmdb.value = localStorage.getItem('sett_tmdb_key') || '';
    if (unsplash) unsplash.value = localStorage.getItem('sett_unsplash_key') || '';
    if (pexels) pexels.value = localStorage.getItem('sett_pexels_key') || '';
    document.getElementById('settSaveBtn').onclick = saveSettings;
}

function saveSettings() {
    var g = function(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
    localStorage.setItem('sett_tmdb_key', g('settTmdbKey'));
    localStorage.setItem('sett_unsplash_key', g('settUnsplashKey'));
    localStorage.setItem('sett_pexels_key', g('settPexelsKey'));
    if (g('settTmdbKey')) searchService.apiKeys.tmdb = g('settTmdbKey');
    if (g('settUnsplashKey')) searchService.apiKeys.unsplash = g('settUnsplashKey');
    if (g('settPexelsKey')) searchService.apiKeys.pexels = g('settPexelsKey');
    searchService.saveApiKeys(searchService.apiKeys); searchService.tmdbConfig = null;
    showStatus('All settings saved!', 'success'); closeSettings();
}

function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function exposeUiActions() {
    Object.assign(window, {
        removeImage,
        processImages,
        openReferencePopup,
        closeReferencePopup,
        resetAdjustments,
        quickExportResult,
        showFullExportDialog,
        closeFullExportDialog,
        executeFullExport,
        showLUTExportDialog,
        closeLUTExportDialog,
        exportLUT,
        openSettings,
        closeSettings,
        toggleTheme
    });
}

function setupModalDismissals() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Preset System
function togglePresetPanel() {
    const presetPanel = document.getElementById('presetPanel');

    if (presetPanel) {
        const isVisible = presetPanel.style.display !== 'none';
        presetPanel.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            initPresetPanel();
        }
    }
}

function initPresetPanel() {
    const presetPanel = document.getElementById('presetPanel');
    if (!presetPanel) return;

    const presets = presetManager.getAllPresets();

    presetPanel.innerHTML = `
        <div class="preset-panel-header">
            <h3>Presets</h3>
            <button class="preset-panel-close" id="closePresetPanel">×</button>
        </div>
        <div class="preset-search">
            <input type="text" id="presetSearchInput" placeholder="Search presets..." />
        </div>
        <div class="preset-list" id="presetList">
            ${presets.map(p => `
                <div class="preset-card" data-preset-id="${p.id}">
                    <div class="preset-name">${p.name}</div>
                    <div class="preset-tags">${(p.tags || []).join(', ')}</div>
                </div>
            `).join('')}
        </div>
        <div class="preset-actions">
            <button class="preset-action-btn" id="saveCurrentAsPreset">Save Current</button>
            <button class="preset-action-btn" id="exportPresetsBtn">Export All</button>
        </div>
    `;

    document.getElementById('closePresetPanel')?.addEventListener('click', togglePresetPanel);

    document.getElementById('presetSearchInput')?.addEventListener('input', (e) => {
        const query = e.target.value;
        const filtered = presetManager.searchPresets(query);
        renderPresetList(filtered);
    });

    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const presetId = card.dataset.presetId;
            loadPreset(presetId);
        });
    });

    document.getElementById('saveCurrentAsPreset')?.addEventListener('click', saveCurrentAsPreset);
    document.getElementById('exportPresetsBtn')?.addEventListener('click', exportAllPresets);
}

function renderPresetList(presets) {
    const list = document.getElementById('presetList');
    if (!list) return;

    list.innerHTML = presets.map(p => `
        <div class="preset-card" data-preset-id="${p.id}">
            <div class="preset-name">${p.name}</div>
            <div class="preset-tags">${(p.tags || []).join(', ')}</div>
        </div>
    `).join('');

    list.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            const presetId = card.dataset.presetId;
            loadPreset(presetId);
        });
    });
}

function loadPreset(presetId) {
    const allPresets = presetManager.getAllPresets();
    const preset = allPresets.find(p => p.id === presetId);
    if (!preset) {
        showStatus('Preset not found.', 'error');
        return;
    }

    if (preset.adjustments) {
        updateReferenceMemory({ selectedPresetId: preset.id });
        unifiedSession.setStyleState({
            visualStyle: preset.name,
            colorPalette: (preset.tags || []).join(', ')
        });
        applyPresetAdjustments(preset.adjustments);
        showStatus(`Preset "${preset.name}" loaded!`, 'success');
    } else {
        showStatus('Preset has no adjustment data.', 'error');
    }
}

function applyPresetAdjustments(adj) {
    if (adj.temperature !== undefined) {
        temperatureSlider.value = adj.temperature;
        temperatureValue.textContent = adj.temperature;
    }
    if (adj.tint !== undefined) {
        tintSlider.value = adj.tint;
        tintValue.textContent = adj.tint;
    }
    if (adj.saturation !== undefined) {
        saturationSlider.value = adj.saturation;
        saturationValue.textContent = adj.saturation;
    }
    if (adj.contrast !== undefined) {
        contrastSlider.value = adj.contrast;
        contrastValue.textContent = adj.contrast;
    }
    if (adj.highlights !== undefined) {
        highlightsSlider.value = adj.highlights;
        highlightsValue.textContent = adj.highlights;
    }
    if (adj.shadows !== undefined) {
        shadowsSlider.value = adj.shadows;
        shadowsValue.textContent = adj.shadows;
    }
    if (adj.whites !== undefined) {
        whitesSlider.value = adj.whites;
        whitesValue.textContent = adj.whites;
    }
    if (adj.blacks !== undefined) {
        blacksSlider.value = adj.blacks;
        blacksValue.textContent = adj.blacks;
    }
    if (adj.exposure !== undefined) {
        exposureSlider.value = adj.exposure;
        exposureValue.textContent = adj.exposure;
    }
    if (adj.strength !== undefined) {
        strengthSlider.value = adj.strength;
        strengthValue.textContent = adj.strength;
    }
    if (adj.method !== undefined) {
        algorithmMethod.value = adj.method;
    }

    reapplyTransfer();
}

function saveCurrentAsPreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;

    const tags = prompt('Enter tags (comma separated):', 'custom') || 'custom';

    const adjustments = {
        temperature: parseInt(temperatureSlider.value),
        tint: parseInt(tintSlider.value),
        saturation: parseInt(saturationSlider.value),
        contrast: parseInt(contrastSlider.value),
        highlights: parseInt(highlightsSlider.value),
        shadows: parseInt(shadowsSlider.value),
        whites: parseInt(whitesSlider.value),
        blacks: parseInt(blacksSlider.value),
        exposure: parseInt(exposureSlider.value),
        strength: parseInt(strengthSlider.value),
        method: algorithmMethod.value
    };

    const preset = presetManager.savePreset({
        name,
        tags: tags.split(',').map(t => t.trim()),
        adjustments,
        referenceMemory: getReferenceMemory(),
        sessionStyleState: unifiedSession.styleState || null
    });

    updateReferenceMemory({ selectedPresetId: preset.id });
    showStatus(`Preset "${name}" saved!`, 'success');
    initPresetPanel();
}

function exportAllPresets() {
    try {
        const exportData = presetManager.exportAllPresets();
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chromamatch-presets-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showStatus('Preset export ready.', 'success');
    } catch (error) {
        showError(`Preset export failed: ${error.message}`);
    }
}

// LUT Export
function showLUTExportDialog() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }

    document.getElementById('lutExportModal').style.display = 'flex';
}

function closeLUTExportDialog() {
    document.getElementById('lutExportModal').style.display = 'none';
    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
}

async function exportLUT() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }

    const format = document.getElementById('lutFormat')?.value || 'cube';
    const lutSize = parseInt(document.getElementById('lutSize')?.value || '33');
    const bitDepth = parseInt(document.getElementById('lutBitDepth')?.value || '16');
    const filename = document.getElementById('lutFilename')?.value || 'chromamatch-lut';
    const title = document.getElementById('lutTitle')?.value || 'ChromaMatch LUT';

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
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressText) progressText.textContent = message;
            }
        });

        showStatus(`LUT exported: ${result.filename}`, 'success');

        setTimeout(() => {
            closeLUTExportDialog();
        }, 2000);

    } catch (error) {
        console.error('LUT export error:', error);
        showStatus(`LUT export failed: ${error.message}`, 'error');
        if (progressText) progressText.textContent = 'Export failed';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    exposeUiActions();
    initializeTheme();
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    setupDragAndDrop();
    setupDashboardInteractions();
    setupModalDismissals();
    setActiveDashboardWindow('windowThreeUp');
    setActiveToolLayer('layerTransfer');

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }

    const changeImagesBtn = document.getElementById('changeImagesBtn');
    if (changeImagesBtn) {
        changeImagesBtn.addEventListener('click', revertToImageSelection);
    }

    updateMethodHint();

    const exportFormat = document.getElementById('exportFormat');
    const exportResolution = document.getElementById('exportResolution');
    const exportQuality = document.getElementById('exportQuality');

    if (exportFormat) exportFormat.addEventListener('change', () => {
        const qualityGroup = document.getElementById('qualityGroup');
        if (qualityGroup) {
            qualityGroup.style.display = exportFormat.value === 'png' ? 'none' : 'block';
        }
    });
    if (exportResolution) exportResolution.addEventListener('change', () => {
        const customSizeGroup = document.getElementById('customSizeGroup');
        if (customSizeGroup) {
            customSizeGroup.style.display = exportResolution.value === 'custom' ? 'block' : 'none';
        }
    });
    if (exportQuality) exportQuality.addEventListener('input', () => {
        const qualityValue = document.getElementById('qualityValue');
        if (qualityValue) {
            qualityValue.textContent = Math.round(exportQuality.value * 100) + '%';
        }
    });
});
