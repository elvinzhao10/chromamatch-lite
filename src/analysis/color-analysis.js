/**
 * Color Analysis and Visualization System
 * Provides histogram and vectorgram visualizations for color transfer analysis
 */

class ColorAnalysis {
    constructor() {
        this.histogramBins = 256;
        this.vectorgramSize = 200;
        this.canvasSize = { width: 300, height: 200 };
        // Live-update state
        this.resultCanvases = { rgb: null, lab: null, vectorgram: null, rgbComparison: null, labComparison: null };
        this.suggestionsEl = null;
        this.cachedRefAnalysis = null;
        this.cachedOriginalAnalysis = null;
        this.statsContainer = null;
        this.matchSummaryContainer = null;
        this.matchDetailsContainer = null;
    }

    /**
     * Generate comprehensive color analysis for an image
     * @param {ImageData} imageData - Image data to analyze
     * @param {string} label - Label for the analysis
     * @returns {Object} Analysis results
     */
    analyzeImage(imageData, label) {
        const rgbHistogram = this.calculateRGBHistogram(imageData);
        const labHistogram = this.calculateLABHistogram(imageData);
        const colorStats = this.calculateColorStatistics(imageData, rgbHistogram, labHistogram);
        const vectorgramData = this.calculateVectorgramData(imageData);

        return {
            label,
            rgbHistogram,
            labHistogram,
            colorStats,
            vectorgramData,
            imageData
        };
    }

    /**
     * Calculate RGB histogram
     * @param {ImageData} imageData - Image data
     * @returns {Object} RGB histogram data
     */
    calculateRGBHistogram(imageData) {
        const histogram = {
            red: new Array(this.histogramBins).fill(0),
            green: new Array(this.histogramBins).fill(0),
            blue: new Array(this.histogramBins).fill(0),
            luminance: new Array(this.histogramBins).fill(0)
        };

        const data = imageData.data;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            histogram.red[r]++;
            histogram.green[g]++;
            histogram.blue[b]++;

            // Calculate luminance (Y in YUV)
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            histogram.luminance[Math.min(255, Math.max(0, luminance))]++;
        }

        // Normalize histograms
        for (let channel of ['red', 'green', 'blue', 'luminance']) {
            for (let i = 0; i < this.histogramBins; i++) {
                histogram[channel][i] /= pixelCount;
            }
        }

        return histogram;
    }

    /**
     * Calculate LAB histogram
     * @param {ImageData} imageData - Image data
     * @returns {Object} LAB histogram data
     */
    calculateLABHistogram(imageData) {
        const labData = this.rgbToLabArray(imageData);
        const histogram = {
            L: new Array(101).fill(0), // L: 0-100
            A: new Array(256).fill(0), // A: -128 to +127 (shifted to 0-255)
            B: new Array(256).fill(0)  // B: -128 to +127 (shifted to 0-255)
        };

        const pixelCount = labData.length / 3;

        for (let i = 0; i < labData.length; i += 3) {
            const L = Math.round(Math.min(100, Math.max(0, labData[i])));
            const A = Math.round(Math.min(255, Math.max(0, labData[i + 1] + 128)));
            const B = Math.round(Math.min(255, Math.max(0, labData[i + 2] + 128)));

            histogram.L[L]++;
            histogram.A[A]++;
            histogram.B[B]++;
        }

        // Normalize histograms
        for (let channel of ['L', 'A', 'B']) {
            const bins = histogram[channel].length;
            for (let i = 0; i < bins; i++) {
                histogram[channel][i] /= pixelCount;
            }
        }

        return histogram;
    }

    /**
     * Calculate color statistics
     * @param {ImageData} imageData - Image data
     * @returns {Object} Color statistics
     */
    calculateColorStatistics(imageData, rgbHistogram, labHistogram) {
        const data = imageData.data;
        const pixelCount = data.length / 4;
        
        let rgbSum = { r: 0, g: 0, b: 0 };
        let rgbSumSquared = { r: 0, g: 0, b: 0 };

        // Calculate means
        for (let i = 0; i < data.length; i += 4) {
            rgbSum.r += data[i];
            rgbSum.g += data[i + 1];
            rgbSum.b += data[i + 2];
        }

        const rgbMean = {
            r: rgbSum.r / pixelCount,
            g: rgbSum.g / pixelCount,
            b: rgbSum.b / pixelCount
        };

        // Calculate standard deviations
        for (let i = 0; i < data.length; i += 4) {
            rgbSumSquared.r += Math.pow(data[i] - rgbMean.r, 2);
            rgbSumSquared.g += Math.pow(data[i + 1] - rgbMean.g, 2);
            rgbSumSquared.b += Math.pow(data[i + 2] - rgbMean.b, 2);
        }

        const rgbStd = {
            r: Math.sqrt(rgbSumSquared.r / pixelCount),
            g: Math.sqrt(rgbSumSquared.g / pixelCount),
            b: Math.sqrt(rgbSumSquared.b / pixelCount)
        };

        // Calculate LAB statistics
        const labData = this.rgbToLabArray(imageData);
        const labStats = this.calculateLabStatistics(labData);
        const rgbPercentiles = {
            r: this.calculatePercentilesFromHistogram(rgbHistogram.red, [0.1, 0.5, 0.9], 0, 255),
            g: this.calculatePercentilesFromHistogram(rgbHistogram.green, [0.1, 0.5, 0.9], 0, 255),
            b: this.calculatePercentilesFromHistogram(rgbHistogram.blue, [0.1, 0.5, 0.9], 0, 255),
            luminance: this.calculatePercentilesFromHistogram(rgbHistogram.luminance, [0.1, 0.5, 0.9], 0, 255)
        };
        labStats.percentiles = [
            this.calculatePercentilesFromHistogram(labHistogram.L, [0.1, 0.5, 0.9], 0, 100),
            this.calculatePercentilesFromHistogram(labHistogram.A, [0.1, 0.5, 0.9], -128, 127),
            this.calculatePercentilesFromHistogram(labHistogram.B, [0.1, 0.5, 0.9], -128, 127)
        ];

        return {
            rgb: { mean: rgbMean, std: rgbStd, percentiles: rgbPercentiles },
            lab: labStats,
            pixelCount
        };
    }

    calculatePercentilesFromHistogram(histogram, percentiles, minValue, maxValue) {
        const values = [];
        let cumulative = 0;
        let percentileIndex = 0;
        const span = maxValue - minValue;

        for (let i = 0; i < histogram.length && percentileIndex < percentiles.length; i++) {
            cumulative += histogram[i];
            while (percentileIndex < percentiles.length && cumulative >= percentiles[percentileIndex]) {
                const mapped = minValue + (i / Math.max(1, histogram.length - 1)) * span;
                values.push(mapped);
                percentileIndex++;
            }
        }

        while (values.length < percentiles.length) {
            values.push(maxValue);
        }

        return values;
    }

    /**
     * Calculate vectorgram data for A*B* color space visualization
     * @param {ImageData} imageData - Image data
     * @returns {Object} Vectorgram data
     */
    calculateVectorgramData(imageData) {
        const labData = this.rgbToLabArray(imageData);
        const vectorgram = new Array(this.vectorgramSize).fill(null).map(() => 
            new Array(this.vectorgramSize).fill(0)
        );

        const pixelCount = labData.length / 3;

        for (let i = 0; i < labData.length; i += 3) {
            const A = labData[i + 1];
            const B = labData[i + 2];

            // Map A and B to vectorgram coordinates
            const x = Math.round(((A + 128) / 256) * (this.vectorgramSize - 1));
            const y = Math.round(((B + 128) / 256) * (this.vectorgramSize - 1));

            if (x >= 0 && x < this.vectorgramSize && y >= 0 && y < this.vectorgramSize) {
                vectorgram[y][x]++;
            }
        }

        // Normalize vectorgram
        let maxValue = 0;
        for (let y = 0; y < this.vectorgramSize; y++) {
            for (let x = 0; x < this.vectorgramSize; x++) {
                maxValue = Math.max(maxValue, vectorgram[y][x]);
            }
        }

        if (maxValue > 0) {
            for (let y = 0; y < this.vectorgramSize; y++) {
                for (let x = 0; x < this.vectorgramSize; x++) {
                    vectorgram[y][x] /= maxValue;
                }
            }
        }

        return vectorgram;
    }

    /**
     * Convert RGB ImageData to LAB array
     * @param {ImageData} imageData - RGB image data
     * @returns {Float32Array} LAB data array
     */
    rgbToLabArray(imageData) {
        const data = imageData.data;
        const labData = new Float32Array((data.length / 4) * 3);

        for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
            const r = data[i] / 255.0;
            const g = data[i + 1] / 255.0;
            const b = data[i + 2] / 255.0;

            // RGB to XYZ
            let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
            let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
            let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

            // Normalize by D65 illuminant
            x /= 0.95047;
            y /= 1.00000;
            z /= 1.08883;

            // XYZ to LAB
            const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
            const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
            const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

            labData[j] = 116 * fy - 16;     // L
            labData[j + 1] = 500 * (fx - fy); // A
            labData[j + 2] = 200 * (fy - fz); // B
        }

        return labData;
    }

    /**
     * Calculate LAB statistics
     * @param {Float32Array} labData - LAB data array
     * @returns {Object} LAB statistics
     */
    calculateLabStatistics(labData) {
        const pixelCount = labData.length / 3;
        const means = [0, 0, 0];
        const stds = [0, 0, 0];

        // Calculate means
        for (let i = 0; i < labData.length; i += 3) {
            means[0] += labData[i];     // L
            means[1] += labData[i + 1]; // A
            means[2] += labData[i + 2]; // B
        }

        means[0] /= pixelCount;
        means[1] /= pixelCount;
        means[2] /= pixelCount;

        // Calculate standard deviations
        for (let i = 0; i < labData.length; i += 3) {
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
     * Render RGB histogram
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {Object} histogram - Histogram data
     * @param {string} title - Chart title
     */
    renderRGBHistogram(canvas, histogram, title) {
        const ctx = canvas.getContext('2d');
        const { width, height } = this.canvasSize;
        
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Chart area
        const margin = { top: 30, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Find max value for scaling
        let maxValue = 0;
        for (let channel of ['red', 'green', 'blue']) {
            maxValue = Math.max(maxValue, Math.max(...histogram[channel]));
        }

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // Draw histograms
        const colors = { red: '#ff4444', green: '#44ff44', blue: '#4444ff' };
        const binWidth = chartWidth / this.histogramBins;

        for (let channel of ['red', 'green', 'blue']) {
            ctx.strokeStyle = colors[channel];
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();

            for (let i = 0; i < this.histogramBins; i++) {
                const x = margin.left + i * binWidth;
                const y = height - margin.bottom - (histogram[channel][i] / maxValue) * chartHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);

        // Draw labels
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('0', margin.left - 5, height - margin.bottom + 15);
        ctx.textAlign = 'right';
        ctx.fillText('255', width - margin.right, height - margin.bottom + 15);
    }

    /**
     * Render LAB histogram
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {Object} histogram - LAB histogram data
     * @param {string} title - Chart title
     */
    renderLABHistogram(canvas, histogram, title) {
        const ctx = canvas.getContext('2d');
        const { width, height } = this.canvasSize;
        
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Chart area
        const margin = { top: 30, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Find max value for scaling
        let maxValue = 0;
        for (let channel of ['L', 'A', 'B']) {
            maxValue = Math.max(maxValue, Math.max(...histogram[channel]));
        }

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // Draw histograms
        const colors = { L: '#888888', A: '#ff8888', B: '#8888ff' };
        
        for (let channel of ['L', 'A', 'B']) {
            const bins = histogram[channel].length;
            const binWidth = chartWidth / bins;
            
            ctx.strokeStyle = colors[channel];
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();

            for (let i = 0; i < bins; i++) {
                const x = margin.left + i * binWidth;
                const y = height - margin.bottom - (histogram[channel][i] / maxValue) * chartHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);
    }

    /**
     * Render vectorgram (A*B* color space visualization)
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {Array} vectorgramData - Vectorgram data
     * @param {string} title - Chart title
     */
    renderVectorgram(canvas, vectorgramData, title) {
        const ctx = canvas.getContext('2d');
        const { width, height } = this.canvasSize;
        
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Chart area
        const margin = { top: 30, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create image data for vectorgram
        const imageData = ctx.createImageData(chartWidth, chartHeight);
        const data = imageData.data;

        for (let y = 0; y < chartHeight; y++) {
            for (let x = 0; x < chartWidth; x++) {
                const srcY = Math.floor((y / chartHeight) * this.vectorgramSize);
                const srcX = Math.floor((x / chartWidth) * this.vectorgramSize);
                
                const intensity = vectorgramData[srcY][srcX];
                const pixelIndex = (y * chartWidth + x) * 4;
                
                // Create heatmap coloring
                const color = this.intensityToColor(intensity);
                data[pixelIndex] = color.r;     // Red
                data[pixelIndex + 1] = color.g; // Green
                data[pixelIndex + 2] = color.b; // Blue
                data[pixelIndex + 3] = 255;     // Alpha
            }
        }

        // Draw vectorgram
        ctx.putImageData(imageData, margin.left, margin.top);

        // Draw axes and labels
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);

        // Draw axis labels
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A* (Green ← → Red)', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('B* (Blue ← → Yellow)', 0, 0);
        ctx.restore();
    }

    /**
     * Convert intensity to heatmap color
     * @param {number} intensity - Intensity value (0-1)
     * @returns {Object} RGB color object
     */
    intensityToColor(intensity) {
        if (intensity === 0) {
            return { r: 255, g: 255, b: 255 }; // White for no data
        }

        // Create heatmap: blue -> cyan -> green -> yellow -> red
        const colors = [
            { r: 0, g: 0, b: 255 },     // Blue
            { r: 0, g: 255, b: 255 },   // Cyan
            { r: 0, g: 255, b: 0 },     // Green
            { r: 255, g: 255, b: 0 },   // Yellow
            { r: 255, g: 0, b: 0 }      // Red
        ];

        const scaledIntensity = intensity * (colors.length - 1);
        const index = Math.floor(scaledIntensity);
        const fraction = scaledIntensity - index;

        if (index >= colors.length - 1) {
            return colors[colors.length - 1];
        }

        const color1 = colors[index];
        const color2 = colors[index + 1];

        return {
            r: Math.round(color1.r + (color2.r - color1.r) * fraction),
            g: Math.round(color1.g + (color2.g - color1.g) * fraction),
            b: Math.round(color1.b + (color2.b - color1.b) * fraction)
        };
    }

    /**
     * Create comprehensive visualization for three images
     * @param {Object} originalAnalysis - Original image analysis
     * @param {Object} referenceAnalysis - Reference image analysis
     * @param {Object} resultAnalysis - Result image analysis
     * @param {HTMLElement} container - Container element
     */
    createComprehensiveVisualization(originalAnalysis, referenceAnalysis, resultAnalysis, container) {
        container.innerHTML = '';

        // Cache analyses for live updates
        this.cachedOriginalAnalysis = originalAnalysis;
        this.cachedRefAnalysis = referenceAnalysis;

        // Create main visualization container
        const vizContainer = document.createElement('div');
        vizContainer.className = 'color-visualization-container';

        // Suggestions panel — always visible above tabs, updates live
        const suggestionsPanel = document.createElement('div');
        suggestionsPanel.className = 'analysis-suggestions';
        this.suggestionsEl = suggestionsPanel;
        const initSuggestions = this.generateSuggestions(resultAnalysis.colorStats, referenceAnalysis.colorStats);
        const initScore = this.computeMatchScore(resultAnalysis.colorStats, referenceAnalysis.colorStats);
        this.renderSuggestions(suggestionsPanel, initSuggestions, initScore);
        vizContainer.appendChild(suggestionsPanel);

        // Tabs
        const tabContainer = document.createElement('div');
        tabContainer.className = 'viz-tabs';
        
        const tabs = [
            { id: 'rgb-histograms', label: 'RGB Analysis', active: true },
            { id: 'lab-histograms', label: 'LAB Analysis', active: false },
            { id: 'vectorgrams', label: 'Color Distribution', active: false },
            { id: 'match-analysis', label: 'Match Analysis', active: false },
            { id: 'statistics', label: 'Statistical Data', active: false }
        ];

        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = `viz-tab ${tab.active ? 'active' : ''}`;
            tabButton.textContent = tab.label;
            tabButton.onclick = () => this.switchVisualizationTab(tab.id);
            tabContainer.appendChild(tabButton);
        });

        vizContainer.appendChild(tabContainer);

        // Create content areas
        this.createRGBHistogramView(vizContainer, originalAnalysis, referenceAnalysis, resultAnalysis);
        this.createLABHistogramView(vizContainer, originalAnalysis, referenceAnalysis, resultAnalysis);
        this.createVectorgramView(vizContainer, originalAnalysis, referenceAnalysis, resultAnalysis);
        this.createMatchAnalysisView(vizContainer, originalAnalysis, referenceAnalysis, resultAnalysis);
        this.createStatisticsView(vizContainer, originalAnalysis, referenceAnalysis, resultAnalysis);

        container.appendChild(vizContainer);

        // Show initial tab
        this.switchVisualizationTab('rgb-histograms');
    }

    /**
     * Create RGB histogram visualization
     */
    createRGBHistogramView(container, original, reference, result) {
        const view = document.createElement('div');
        view.id = 'rgb-histograms';
        view.className = 'viz-content';

        const title = document.createElement('h4');
        title.textContent = 'RGB Channel Histograms';
        view.appendChild(title);

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'histogram-grid';

        const analyses = [
            { data: original, label: 'Original Image' },
            { data: reference, label: 'Reference Image' },
            { data: result, label: 'Result Image' }
        ];

        analyses.forEach((analysis, index) => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderRGBHistogram(canvas, analysis.data.rgbHistogram, analysis.label);
            canvasWrapper.appendChild(canvas);

            if (index === 2) this.resultCanvases.rgb = canvas;
            canvasContainer.appendChild(canvasWrapper);
        });

        view.appendChild(canvasContainer);
        container.appendChild(view);
    }

    /**
     * Create LAB histogram visualization
     */
    createLABHistogramView(container, original, reference, result) {
        const view = document.createElement('div');
        view.id = 'lab-histograms';
        view.className = 'viz-content';
        view.style.display = 'none';

        const title = document.createElement('h4');
        title.textContent = 'LAB Color Space Histograms';
        view.appendChild(title);

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'histogram-grid';

        const analyses = [
            { data: original, label: 'Original Image' },
            { data: reference, label: 'Reference Image' },
            { data: result, label: 'Result Image' }
        ];

        analyses.forEach((analysis, index) => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderLABHistogram(canvas, analysis.data.labHistogram, analysis.label);
            canvasWrapper.appendChild(canvas);

            if (index === 2) this.resultCanvases.lab = canvas;
            canvasContainer.appendChild(canvasWrapper);
        });

        view.appendChild(canvasContainer);
        container.appendChild(view);
    }

    /**
     * Create vectorgram visualization
     */
    createVectorgramView(container, original, reference, result) {
        const view = document.createElement('div');
        view.id = 'vectorgrams';
        view.className = 'viz-content';
        view.style.display = 'none';

        const title = document.createElement('h4');
        title.textContent = 'A*B* Color Space Vectorgrams';
        view.appendChild(title);

        const description = document.createElement('p');
        description.className = 'viz-description';
        description.textContent = 'Vectorgrams show the distribution of colors in the A*B* plane of LAB color space. Warmer colors indicate higher pixel density.';
        view.appendChild(description);

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'histogram-grid';

        const analyses = [
            { data: original, label: 'Original Image' },
            { data: reference, label: 'Reference Image' },
            { data: result, label: 'Result Image' }
        ];

        analyses.forEach((analysis, index) => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderVectorgram(canvas, analysis.data.vectorgramData, analysis.label);
            canvasWrapper.appendChild(canvas);

            if (index === 2) this.resultCanvases.vectorgram = canvas;
            canvasContainer.appendChild(canvasWrapper);
        });

        view.appendChild(canvasContainer);
        container.appendChild(view);
    }

    /**
     * Create statistics comparison view
     */
    createStatisticsView(container, original, reference, result) {
        const view = document.createElement('div');
        view.id = 'statistics';
        view.className = 'viz-content';
        view.style.display = 'none';

        const title = document.createElement('h4');
        title.textContent = 'Detailed Color Statistics Comparison';
        view.appendChild(title);

        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-comparison-grid';
        this.statsContainer = statsContainer;

        this._buildStatsContent(statsContainer, original, reference, result);

        view.appendChild(statsContainer);
        container.appendChild(view);
    }

    createMatchAnalysisView(container, original, reference, result) {
        const view = document.createElement('div');
        view.id = 'match-analysis';
        view.className = 'viz-content';
        view.style.display = 'none';

        const title = document.createElement('h4');
        title.textContent = 'Granular Match Analysis';
        view.appendChild(title);

        const description = document.createElement('p');
        description.className = 'viz-description';
        description.textContent = 'These overlays and channel metrics compare the live result against the reference. They update as you move strength and fine-tune sliders.';
        view.appendChild(description);

        const summary = document.createElement('div');
        summary.className = 'analysis-summary-grid';
        this.matchSummaryContainer = summary;
        view.appendChild(summary);

        const compareGrid = document.createElement('div');
        compareGrid.className = 'analysis-compare-grid';

        const rgbCard = document.createElement('div');
        rgbCard.className = 'analysis-compare-card';
        const rgbCanvas = document.createElement('canvas');
        this.resultCanvases.rgbComparison = rgbCanvas;
        rgbCard.appendChild(rgbCanvas);
        compareGrid.appendChild(rgbCard);

        const labCard = document.createElement('div');
        labCard.className = 'analysis-compare-card';
        const labCanvas = document.createElement('canvas');
        this.resultCanvases.labComparison = labCanvas;
        labCard.appendChild(labCanvas);
        compareGrid.appendChild(labCard);

        view.appendChild(compareGrid);

        const details = document.createElement('div');
        details.className = 'analysis-detail-sections';
        this.matchDetailsContainer = details;
        view.appendChild(details);

        const metrics = this.computeDistributionMetrics(result, reference);
        this.renderMatchSummary(summary, metrics);
        this.renderDistributionComparison(
            rgbCanvas,
            reference.rgbHistogram,
            result.rgbHistogram,
            [
                { key: 'red', label: 'Red', color: '#e53e3e' },
                { key: 'green', label: 'Green', color: '#38a169' },
                { key: 'blue', label: 'Blue', color: '#3182ce' }
            ],
            'RGB Distribution Overlay'
        );
        this.renderDistributionComparison(
            labCanvas,
            reference.labHistogram,
            result.labHistogram,
            [
                { key: 'L', label: 'L*', color: '#4a5568' },
                { key: 'A', label: 'A*', color: '#d53f8c' },
                { key: 'B', label: 'B*', color: '#dd6b20' }
            ],
            'LAB Distribution Overlay'
        );
        this.renderMatchDetails(details, metrics);

        container.appendChild(view);
    }

    _buildStatsContent(statsContainer, original, reference, result) {
        statsContainer.innerHTML = '';

        const rgbStats = document.createElement('div');
        rgbStats.className = 'stats-section';
        rgbStats.innerHTML = '<h5>RGB Statistics</h5>';
        rgbStats.appendChild(this.createStatsTable([
            { label: 'Original', stats: original.colorStats.rgb },
            { label: 'Reference', stats: reference.colorStats.rgb },
            { label: 'Result', stats: result.colorStats.rgb }
        ], 'rgb'));
        statsContainer.appendChild(rgbStats);

        const labStats = document.createElement('div');
        labStats.className = 'stats-section';
        labStats.innerHTML = '<h5>LAB Statistics</h5>';
        labStats.appendChild(this.createStatsTable([
            { label: 'Original', stats: original.colorStats.lab },
            { label: 'Reference', stats: reference.colorStats.lab },
            { label: 'Result', stats: result.colorStats.lab }
        ], 'lab'));
        statsContainer.appendChild(labStats);
    }

    /**
     * Create statistics table
     */
    createStatsTable(analyses, type) {
        const table = document.createElement('table');
        table.className = 'stats-table';

        // Header
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Image</th><th>Channel</th><th>Mean</th><th>Std Dev</th><th>P10</th><th>P50</th><th>P90</th>';
        header.appendChild(headerRow);
        table.appendChild(header);

        // Body
        const body = document.createElement('tbody');
        
        analyses.forEach(analysis => {
            const channels = type === 'rgb' ? ['r', 'g', 'b'] : [0, 1, 2];
            const channelNames = type === 'rgb' ? ['Red', 'Green', 'Blue'] : ['L*', 'A*', 'B*'];
            
            channels.forEach((channel, index) => {
                const row = document.createElement('tr');
                
                const imageCell = document.createElement('td');
                imageCell.textContent = index === 0 ? analysis.label : '';
                if (index === 0) imageCell.rowSpan = channels.length;
                
                const channelCell = document.createElement('td');
                channelCell.textContent = channelNames[index];
                
                const meanCell = document.createElement('td');
                const stdCell = document.createElement('td');
                const p10Cell = document.createElement('td');
                const p50Cell = document.createElement('td');
                const p90Cell = document.createElement('td');
                
                if (type === 'rgb') {
                    meanCell.textContent = analysis.stats.mean[channel].toFixed(2);
                    stdCell.textContent = analysis.stats.std[channel].toFixed(2);
                    p10Cell.textContent = analysis.stats.percentiles[channel][0].toFixed(1);
                    p50Cell.textContent = analysis.stats.percentiles[channel][1].toFixed(1);
                    p90Cell.textContent = analysis.stats.percentiles[channel][2].toFixed(1);
                } else {
                    meanCell.textContent = analysis.stats.mean[channel].toFixed(2);
                    stdCell.textContent = analysis.stats.std[channel].toFixed(2);
                    p10Cell.textContent = analysis.stats.percentiles[channel][0].toFixed(1);
                    p50Cell.textContent = analysis.stats.percentiles[channel][1].toFixed(1);
                    p90Cell.textContent = analysis.stats.percentiles[channel][2].toFixed(1);
                }
                
                if (index === 0) row.appendChild(imageCell);
                row.appendChild(channelCell);
                row.appendChild(meanCell);
                row.appendChild(stdCell);
                row.appendChild(p10Cell);
                row.appendChild(p50Cell);
                row.appendChild(p90Cell);
                
                body.appendChild(row);
            });
        });
        
        table.appendChild(body);
        return table;
    }

    /**
     * Live update — re-analyze result image and refresh all result-column visuals + suggestions.
     * Called on every slider change (debounced in app.js).
     */
    updateResultVisualization(resultImageData) {
        const resultAnalysis = this.analyzeImage(resultImageData, 'Result Image');

        if (this.resultCanvases.rgb) {
            this.renderRGBHistogram(this.resultCanvases.rgb, resultAnalysis.rgbHistogram, 'Result Image');
        }
        if (this.resultCanvases.lab) {
            this.renderLABHistogram(this.resultCanvases.lab, resultAnalysis.labHistogram, 'Result Image');
        }
        if (this.resultCanvases.vectorgram) {
            this.renderVectorgram(this.resultCanvases.vectorgram, resultAnalysis.vectorgramData, 'Result Image');
        }
        if (this.resultCanvases.rgbComparison && this.cachedRefAnalysis) {
            this.renderDistributionComparison(
                this.resultCanvases.rgbComparison,
                this.cachedRefAnalysis.rgbHistogram,
                resultAnalysis.rgbHistogram,
                [
                    { key: 'red', label: 'Red', color: '#e53e3e' },
                    { key: 'green', label: 'Green', color: '#38a169' },
                    { key: 'blue', label: 'Blue', color: '#3182ce' }
                ],
                'RGB Distribution Overlay'
            );
        }
        if (this.resultCanvases.labComparison && this.cachedRefAnalysis) {
            this.renderDistributionComparison(
                this.resultCanvases.labComparison,
                this.cachedRefAnalysis.labHistogram,
                resultAnalysis.labHistogram,
                [
                    { key: 'L', label: 'L*', color: '#4a5568' },
                    { key: 'A', label: 'A*', color: '#d53f8c' },
                    { key: 'B', label: 'B*', color: '#dd6b20' }
                ],
                'LAB Distribution Overlay'
            );
        }
        if (this.statsContainer && this.cachedOriginalAnalysis && this.cachedRefAnalysis) {
            this._buildStatsContent(this.statsContainer, this.cachedOriginalAnalysis, this.cachedRefAnalysis, resultAnalysis);
        }
        if (this.matchSummaryContainer && this.matchDetailsContainer && this.cachedRefAnalysis) {
            const metrics = this.computeDistributionMetrics(resultAnalysis, this.cachedRefAnalysis);
            this.renderMatchSummary(this.matchSummaryContainer, metrics);
            this.renderMatchDetails(this.matchDetailsContainer, metrics);
        }
        if (this.suggestionsEl && this.cachedRefAnalysis) {
            const suggestions = this.generateSuggestions(resultAnalysis.colorStats, this.cachedRefAnalysis.colorStats);
            const matchScore = this.computeMatchScore(resultAnalysis.colorStats, this.cachedRefAnalysis.colorStats);
            this.renderSuggestions(this.suggestionsEl, suggestions, matchScore);
        }
    }

    /**
     * Compute a 0-100 match score between result and reference LAB stats.
     */
    computeMatchScore(resultStats, refStats) {
        const lr = resultStats.lab, lf = refStats.lab;
        const lDiff  = Math.abs(lr.mean[0] - lf.mean[0]);
        const aDiff  = Math.abs(lr.mean[1] - lf.mean[1]);
        const bDiff  = Math.abs(lr.mean[2] - lf.mean[2]);
        const lsDiff = Math.abs(lr.std[0]  - lf.std[0]);
        const err = (lDiff / 50 + aDiff / 30 + bDiff / 30 + lsDiff / 30) * 25;
        return Math.max(0, Math.min(100, Math.round(100 - err)));
    }

    /**
     * Derive concrete slider suggestions by comparing result vs reference LAB stats.
     */
    generateSuggestions(resultStats, refStats) {
        const THRESHOLD = 1.5;
        const lr = resultStats.lab, lf = refStats.lab;
        const suggestions = [];

        const lMeanDelta = lr.mean[0] - lf.mean[0];
        const lStdDelta  = lr.std[0]  - lf.std[0];
        const aMeanDelta = lr.mean[1] - lf.mean[1]; // A* = green(-) ↔ magenta(+)
        const bMeanDelta = lr.mean[2] - lf.mean[2]; // B* = blue(-) ↔ yellow(+)

        const resultChroma = Math.sqrt(lr.std[1] ** 2 + lr.std[2] ** 2);
        const refChroma    = Math.sqrt(lf.std[1] ** 2 + lf.std[2] ** 2);
        const chromaDelta  = resultChroma - refChroma;

        if (Math.abs(lMeanDelta) > THRESHOLD) {
            suggestions.push({
                slider: 'exposure', label: 'Exposure',
                direction: lMeanDelta > 0 ? 'decrease' : 'increase',
                magnitude: Math.abs(lMeanDelta),
                reason: `Result is ${Math.abs(lMeanDelta).toFixed(1)} L* ${lMeanDelta > 0 ? 'brighter' : 'darker'} than reference`
            });
        }

        if (Math.abs(lStdDelta) > THRESHOLD) {
            suggestions.push({
                slider: 'contrast', label: 'Contrast',
                direction: lStdDelta > 0 ? 'decrease' : 'increase',
                magnitude: Math.abs(lStdDelta),
                reason: `Result has ${lStdDelta > 0 ? 'more' : 'less'} tonal spread (Δ${Math.abs(lStdDelta).toFixed(1)} L* std)`
            });
        }

        if (Math.abs(bMeanDelta) > THRESHOLD) {
            suggestions.push({
                slider: 'temperature', label: 'Temperature',
                direction: bMeanDelta > 0 ? 'decrease' : 'increase',
                magnitude: Math.abs(bMeanDelta),
                reason: `Result B* is ${bMeanDelta > 0 ? 'too warm / yellow' : 'too cool / blue'} (Δ${Math.abs(bMeanDelta).toFixed(1)})`
            });
        }

        if (Math.abs(aMeanDelta) > THRESHOLD) {
            suggestions.push({
                slider: 'tint', label: 'Tint',
                direction: aMeanDelta > 0 ? 'decrease' : 'increase',
                magnitude: Math.abs(aMeanDelta),
                reason: `Result A* is ${aMeanDelta > 0 ? 'too magenta' : 'too green'} (Δ${Math.abs(aMeanDelta).toFixed(1)})`
            });
        }

        if (Math.abs(chromaDelta) > THRESHOLD) {
            suggestions.push({
                slider: 'saturation', label: 'Saturation',
                direction: chromaDelta > 0 ? 'decrease' : 'increase',
                magnitude: Math.abs(chromaDelta),
                reason: `Result is ${chromaDelta > 0 ? 'over' : 'under'}saturated by ${Math.abs(chromaDelta).toFixed(1)}`
            });
        }

        // Sort largest delta first
        suggestions.sort((a, b) => b.magnitude - a.magnitude);
        return suggestions;
    }

    /**
     * Render the suggestions panel with match score and per-slider cards.
     */
    renderSuggestions(container, suggestions, matchScore) {
        const scoreColor = matchScore >= 80 ? '#48bb78' : matchScore >= 55 ? '#ed8936' : '#f56565';

        container.innerHTML = `
            <div class="suggestions-header">
                <h4>Match Analysis</h4>
                <div class="match-score-badge" style="background: ${scoreColor}">
                    <span class="match-score-number">${matchScore}</span><span class="match-score-label">%</span>
                </div>
            </div>
        `;

        if (suggestions.length === 0) {
            const ok = document.createElement('p');
            ok.className = 'suggestions-all-good';
            ok.textContent = 'Excellent match — no further adjustments needed.';
            container.appendChild(ok);
            return;
        }

        const cardsEl = document.createElement('div');
        cardsEl.className = 'suggestion-cards';

        for (const sug of suggestions) {
            const card = document.createElement('div');
            card.className = `suggestion-card ${sug.direction}`;

            const arrow = sug.direction === 'increase' ? '↑' : '↓';
            const magnitudeLabel = sug.magnitude > 10 ? 'Large' : sug.magnitude > 4 ? 'Moderate' : 'Small';
            const magnitudeClass = sug.magnitude > 10 ? 'high' : sug.magnitude > 4 ? 'medium' : 'low';
            const barPct = Math.min(100, (sug.magnitude / 20) * 100);

            card.innerHTML = `
                <div class="suggestion-card-header">
                    <span class="suggestion-arrow">${arrow}</span>
                    <span class="suggestion-slider-name">${sug.label}</span>
                    <span class="suggestion-magnitude-badge ${magnitudeClass}">${magnitudeLabel}</span>
                </div>
                <p class="suggestion-reason">${sug.reason}</p>
                <div class="suggestion-bar-track">
                    <div class="suggestion-bar-fill" style="width: ${barPct}%"></div>
                </div>
            `;
            cardsEl.appendChild(card);
        }

        container.appendChild(cardsEl);
    }

    /**
     * Switch visualization tab
     */
    switchVisualizationTab(activeTabId) {
        // Update tab buttons
        document.querySelectorAll('.viz-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.viz-tab:nth-child(${this.getTabIndex(activeTabId)})`).classList.add('active');

        // Update content visibility
        document.querySelectorAll('.viz-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(activeTabId).style.display = 'block';
    }

    /**
     * Get tab index for switching
     */
    getTabIndex(tabId) {
        const tabIds = ['rgb-histograms', 'lab-histograms', 'vectorgrams', 'match-analysis', 'statistics'];
        return tabIds.indexOf(tabId) + 1;
    }

    computeDistributionMetrics(resultAnalysis, referenceAnalysis) {
        const rgbChannels = [
            this.buildRgbChannelMetric('Red', 'r', 'red', resultAnalysis, referenceAnalysis),
            this.buildRgbChannelMetric('Green', 'g', 'green', resultAnalysis, referenceAnalysis),
            this.buildRgbChannelMetric('Blue', 'b', 'blue', resultAnalysis, referenceAnalysis)
        ];

        const labChannels = [
            this.buildLabChannelMetric('L*', 0, 'L', resultAnalysis, referenceAnalysis),
            this.buildLabChannelMetric('A*', 1, 'A', resultAnalysis, referenceAnalysis),
            this.buildLabChannelMetric('B*', 2, 'B', resultAnalysis, referenceAnalysis)
        ];

        const rgbOverlap = rgbChannels.reduce((sum, channel) => sum + channel.overlap, 0) / rgbChannels.length;
        const labOverlap = labChannels.reduce((sum, channel) => sum + channel.overlap, 0) / labChannels.length;
        const luminanceOverlap = this.calculateHistogramOverlap(
            resultAnalysis.rgbHistogram.luminance,
            referenceAnalysis.rgbHistogram.luminance
        );

        const resultChroma = Math.sqrt(resultAnalysis.colorStats.lab.std[1] ** 2 + resultAnalysis.colorStats.lab.std[2] ** 2);
        const refChroma = Math.sqrt(referenceAnalysis.colorStats.lab.std[1] ** 2 + referenceAnalysis.colorStats.lab.std[2] ** 2);

        return {
            score: this.computeMatchScore(resultAnalysis.colorStats, referenceAnalysis.colorStats),
            rgbOverlap,
            labOverlap,
            luminanceOverlap,
            chromaSpreadDelta: resultChroma - refChroma,
            rgbChannels,
            labChannels
        };
    }

    buildRgbChannelMetric(label, statsKey, histogramKey, resultAnalysis, referenceAnalysis) {
        const resultStats = resultAnalysis.colorStats.rgb;
        const referenceStats = referenceAnalysis.colorStats.rgb;
        return {
            label,
            overlap: this.calculateHistogramOverlap(resultAnalysis.rgbHistogram[histogramKey], referenceAnalysis.rgbHistogram[histogramKey]),
            resultMean: resultStats.mean[statsKey],
            referenceMean: referenceStats.mean[statsKey],
            meanDelta: resultStats.mean[statsKey] - referenceStats.mean[statsKey],
            resultStd: resultStats.std[statsKey],
            referenceStd: referenceStats.std[statsKey],
            stdDelta: resultStats.std[statsKey] - referenceStats.std[statsKey],
            resultPercentiles: resultStats.percentiles[statsKey],
            referencePercentiles: referenceStats.percentiles[statsKey]
        };
    }

    buildLabChannelMetric(label, index, histogramKey, resultAnalysis, referenceAnalysis) {
        const resultStats = resultAnalysis.colorStats.lab;
        const referenceStats = referenceAnalysis.colorStats.lab;
        return {
            label,
            overlap: this.calculateHistogramOverlap(resultAnalysis.labHistogram[histogramKey], referenceAnalysis.labHistogram[histogramKey]),
            resultMean: resultStats.mean[index],
            referenceMean: referenceStats.mean[index],
            meanDelta: resultStats.mean[index] - referenceStats.mean[index],
            resultStd: resultStats.std[index],
            referenceStd: referenceStats.std[index],
            stdDelta: resultStats.std[index] - referenceStats.std[index],
            resultPercentiles: resultStats.percentiles[index],
            referencePercentiles: referenceStats.percentiles[index]
        };
    }

    calculateHistogramOverlap(resultHistogram, referenceHistogram) {
        let overlap = 0;
        for (let i = 0; i < resultHistogram.length; i++) {
            overlap += Math.min(resultHistogram[i], referenceHistogram[i]);
        }
        return overlap * 100;
    }

    renderMatchSummary(container, metrics) {
        const cards = [
            { label: 'Overall Match', value: `${metrics.score}%`, tone: metrics.score >= 80 ? 'good' : metrics.score >= 55 ? 'mid' : 'warn' },
            { label: 'RGB Overlap', value: `${metrics.rgbOverlap.toFixed(1)}%`, tone: metrics.rgbOverlap >= 80 ? 'good' : metrics.rgbOverlap >= 60 ? 'mid' : 'warn' },
            { label: 'LAB Overlap', value: `${metrics.labOverlap.toFixed(1)}%`, tone: metrics.labOverlap >= 80 ? 'good' : metrics.labOverlap >= 60 ? 'mid' : 'warn' },
            { label: 'Luma Overlap', value: `${metrics.luminanceOverlap.toFixed(1)}%`, tone: metrics.luminanceOverlap >= 80 ? 'good' : metrics.luminanceOverlap >= 60 ? 'mid' : 'warn' },
            { label: 'Chroma Spread Δ', value: `${metrics.chromaSpreadDelta > 0 ? '+' : ''}${metrics.chromaSpreadDelta.toFixed(2)}`, tone: Math.abs(metrics.chromaSpreadDelta) <= 2 ? 'good' : Math.abs(metrics.chromaSpreadDelta) <= 5 ? 'mid' : 'warn' }
        ];

        container.innerHTML = '';
        cards.forEach(card => {
            const el = document.createElement('div');
            el.className = `analysis-summary-card ${card.tone}`;
            el.innerHTML = `<span class="analysis-summary-label">${card.label}</span><strong class="analysis-summary-value">${card.value}</strong>`;
            container.appendChild(el);
        });
    }

    renderMatchDetails(container, metrics) {
        container.innerHTML = '';
        container.appendChild(this.createChannelMetricSection('RGB Channel Match', metrics.rgbChannels));
        container.appendChild(this.createChannelMetricSection('LAB Channel Match', metrics.labChannels));
    }

    createChannelMetricSection(title, channels) {
        const section = document.createElement('div');
        section.className = 'analysis-detail-card';

        const heading = document.createElement('h5');
        heading.textContent = title;
        section.appendChild(heading);

        const tableWrap = document.createElement('div');
        tableWrap.className = 'analysis-detail-table-wrap';

        const table = document.createElement('table');
        table.className = 'analysis-detail-table';
        table.innerHTML = '<thead><tr><th>Channel</th><th>Overlap</th><th>Mean Δ</th><th>Std Δ</th><th>P10 Δ</th><th>P50 Δ</th><th>P90 Δ</th></tr></thead>';

        const body = document.createElement('tbody');
        channels.forEach(channel => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${channel.label}</td>
                <td>${channel.overlap.toFixed(1)}%</td>
                <td>${channel.meanDelta > 0 ? '+' : ''}${channel.meanDelta.toFixed(2)}</td>
                <td>${channel.stdDelta > 0 ? '+' : ''}${channel.stdDelta.toFixed(2)}</td>
                <td>${(channel.resultPercentiles[0] - channel.referencePercentiles[0]).toFixed(2)}</td>
                <td>${(channel.resultPercentiles[1] - channel.referencePercentiles[1]).toFixed(2)}</td>
                <td>${(channel.resultPercentiles[2] - channel.referencePercentiles[2]).toFixed(2)}</td>
            `;
            body.appendChild(row);
        });

        table.appendChild(body);
        tableWrap.appendChild(table);
        section.appendChild(tableWrap);
        return section;
    }

    renderDistributionComparison(canvas, referenceHistogram, resultHistogram, channels, title) {
        const ctx = canvas.getContext('2d');
        const width = 420;
        const height = 220;
        const margin = { top: 32, right: 16, bottom: 28, left: 34 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        let maxValue = 0;
        channels.forEach(channel => {
            maxValue = Math.max(maxValue, Math.max(...referenceHistogram[channel.key]), Math.max(...resultHistogram[channel.key]));
        });
        maxValue = Math.max(maxValue, 1e-6);

        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        channels.forEach(channel => {
            this.drawDistributionLine(ctx, referenceHistogram[channel.key], channel.color, chartWidth, chartHeight, margin, height, maxValue, [5, 4], 0.5);
            this.drawDistributionLine(ctx, resultHistogram[channel.key], channel.color, chartWidth, chartHeight, margin, height, maxValue, [], 0.95);
        });

        ctx.setLineDash([]);
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 18);

        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Dashed: Reference', margin.left, height - 8);
        ctx.textAlign = 'right';
        ctx.fillText('Solid: Live Result', width - margin.right, height - 8);
    }

    drawDistributionLine(ctx, histogram, color, chartWidth, chartHeight, margin, height, maxValue, dash, alpha) {
        const binWidth = chartWidth / Math.max(1, histogram.length - 1);
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = alpha;
        ctx.setLineDash(dash);

        histogram.forEach((value, index) => {
            const x = margin.left + index * binWidth;
            const y = height - margin.bottom - (value / maxValue) * chartHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
        ctx.restore();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorAnalysis;
}