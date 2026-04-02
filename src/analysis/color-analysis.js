/**
 * Color Analysis and Visualization System
 * Provides histogram and vectorgram visualizations for color transfer analysis
 */

class ColorAnalysis {
    constructor() {
        this.histogramBins = 256;
        this.vectorgramSize = 200;
        this.canvasSize = { width: 300, height: 200 };
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
        const colorStats = this.calculateColorStatistics(imageData);
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
    calculateColorStatistics(imageData) {
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

        return {
            rgb: { mean: rgbMean, std: rgbStd },
            lab: labStats,
            pixelCount
        };
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

        // Create main visualization container
        const vizContainer = document.createElement('div');
        vizContainer.className = 'color-visualization-container';

        // Create tabs for different visualization types
        const tabContainer = document.createElement('div');
        tabContainer.className = 'viz-tabs';
        
        const tabs = [
            { id: 'rgb-histograms', label: 'RGB Analysis', active: true },
            { id: 'lab-histograms', label: 'LAB Analysis', active: false },
            { id: 'vectorgrams', label: 'Color Distribution', active: false },
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

        analyses.forEach(analysis => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderRGBHistogram(canvas, analysis.data.rgbHistogram, analysis.label);
            canvasWrapper.appendChild(canvas);

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

        analyses.forEach(analysis => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderLABHistogram(canvas, analysis.data.labHistogram, analysis.label);
            canvasWrapper.appendChild(canvas);

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

        analyses.forEach(analysis => {
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'histogram-item';

            const canvas = document.createElement('canvas');
            this.renderVectorgram(canvas, analysis.data.vectorgramData, analysis.label);
            canvasWrapper.appendChild(canvas);

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

        // RGB Statistics
        const rgbStats = document.createElement('div');
        rgbStats.className = 'stats-section';
        rgbStats.innerHTML = '<h5>RGB Statistics</h5>';
        
        const rgbTable = this.createStatsTable([
            { label: 'Original', stats: original.colorStats.rgb },
            { label: 'Reference', stats: reference.colorStats.rgb },
            { label: 'Result', stats: result.colorStats.rgb }
        ], 'rgb');
        
        rgbStats.appendChild(rgbTable);
        statsContainer.appendChild(rgbStats);

        // LAB Statistics
        const labStats = document.createElement('div');
        labStats.className = 'stats-section';
        labStats.innerHTML = '<h5>LAB Statistics</h5>';
        
        const labTable = this.createStatsTable([
            { label: 'Original', stats: original.colorStats.lab },
            { label: 'Reference', stats: reference.colorStats.lab },
            { label: 'Result', stats: result.colorStats.lab }
        ], 'lab');
        
        labStats.appendChild(labTable);
        statsContainer.appendChild(labStats);

        view.appendChild(statsContainer);
        container.appendChild(view);
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
        headerRow.innerHTML = '<th>Image</th><th>Channel</th><th>Mean</th><th>Std Dev</th>';
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
                
                if (type === 'rgb') {
                    meanCell.textContent = analysis.stats.mean[channel].toFixed(2);
                    stdCell.textContent = analysis.stats.std[channel].toFixed(2);
                } else {
                    meanCell.textContent = analysis.stats.mean[channel].toFixed(2);
                    stdCell.textContent = analysis.stats.std[channel].toFixed(2);
                }
                
                if (index === 0) row.appendChild(imageCell);
                row.appendChild(channelCell);
                row.appendChild(meanCell);
                row.appendChild(stdCell);
                
                body.appendChild(row);
            });
        });
        
        table.appendChild(body);
        return table;
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
        const tabIds = ['rgb-histograms', 'lab-histograms', 'vectorgrams', 'statistics'];
        return tabIds.indexOf(tabId) + 1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorAnalysis;
}