let zoomList = [];
let isDragging = false;
let dragStartX = 0;
let dragEndX = 0;
let animationId;
let minValue = 0;
let spectrumList = [];
let referenceColors = ['#ff7602' ,'#ffdd00' ,'#00ffd3' ,'#8f5bf8',
    '#d64d4d', '#a6794b', '#77ba7b', '#f800ff',
    '#f89a8e', '#cabb6e', '#237c24', '#3109a5',
    '#ff6767', '#545a03', '#4cb15f', '#6a0345',
    '#a51104', '#ffbb28', '#1a371a', '#470925',
    '#9f9f00', '#a8ac6b', '#956f83', '#a53be4']
let referenceGraph = [];
let captureReferenceGraph = false;
let showReferenceGraph = false;
let needToRecalculateMaxima = true;
let maxima = [];
let maximaR = [];
let maximaG = [];
let maximaB = [];
let eventListeners = [];

let graphCanvas = document.getElementById('graphCanvas');
let graphCtx = graphCanvas.getContext('2d', { willReadFrequently: true });

const MAX_ZOOM_HISTORY = 4;

let lineCtx;

let gradientOpacity = 0.7;

/**
 * Plots the RGB line graph from the camera or image element, deals with resizing, event listeners and drawing
 */
function plotRGBLineFromCamera() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    let lineCanvas = createLineCanvas();
    lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });
    graphCanvas = document.getElementById('graphCanvas');

    graphCanvas.width = document.getElementById("graphWindowContainer").getBoundingClientRect().width;
    graphCanvas.height = document.getElementById("graphWindowContainer").getBoundingClientRect().height;

    graphCtx = graphCanvas.getContext('2d', { willReadFrequently: true });

    const resizeObserver = new ResizeObserver(() => {
        graphCanvas.width = document.getElementById("graphWindowContainer").getBoundingClientRect().width;
        graphCanvas.height = document.getElementById("graphWindowContainer").getBoundingClientRect().height;
        graphCtx = graphCanvas.getContext('2d', { willReadFrequently: true });
        redrawGraphIfLoadedImage()
    });

    initializeZoomList();
    resizeObserver.observe(graphCanvas);
    generateSpectrumList(getElementWidth(videoElement));
    setupEventListeners();
    draw();
}

function draw() {
    drawGraphLine();
    if (!(videoElement instanceof HTMLImageElement)) {
        animationId = requestAnimationFrame(draw);
        needToRecalculateMaxima = true;
    }
}

/**
 * Draws the graph line, graph grid and labels, deals with peaks, zooming and reference graph
 */
function drawGraphLine() {
    const stripeWidth = getStripeWidth();
    const { toggleCombined, toggleR, toggleG, toggleB } = getToggleStates();
    const fillArea = document.getElementById('colorGraph').checked;
    const startY = getElementHeight(videoElement) * getYPercentage() - stripeWidth / 2;
    lineCtx.drawImage(videoElement, 0, startY, getElementWidth(videoElement), stripeWidth, 0, 0, getElementWidth(videoElement), stripeWidth);

    let pixels = lineCtx.getImageData(0, 0, getElementWidth(videoElement), stripeWidth).data;
    let pixelWidth = getElementWidth(videoElement);

    if (stripeWidth > 1) {
        pixels = averagePixels(pixels, pixelWidth);
    }

    if (captureReferenceGraph) {
        referenceGraph.push([pixels, pixelWidth, minValue]);
        captureReferenceGraph = false;
    }


    if (needToRecalculateMaxima && document.getElementById('togglePeaksCheckbox').checked) {
        maxima = findPeaks(pixels, pixelWidth, minValue);
        if (toggleR) {
            maximaR = findPeaks(pixels, pixelWidth, minValue, 0);
        }
        if (toggleG) {
            maximaG = findPeaks(pixels, pixelWidth, minValue, 1);
        }
        if (toggleB) {
            maximaB = findPeaks(pixels, pixelWidth, minValue, 2);
        }
        needToRecalculateMaxima = false;
    }

    let [zoomStart, zoomEnd] = getZoomRange(pixelWidth);

    if (zoomList.length !== 0 && (zoomEnd - zoomStart) >= 2) {
        pixels = pixels.slice(zoomStart * 4, zoomEnd * 4);
        pixelWidth = zoomEnd - zoomStart;
    }

    clearGraph(graphCtx, graphCanvas);
    drawGrid(graphCtx, graphCanvas, zoomStart, zoomEnd, pixels);

    let maxValue = calculateMaxValue(pixels);

    if (showReferenceGraph) {
        for (let i = 0; i < referenceGraph.length; i++) {
            let [tempPixels, tempPixelWidth] = referenceGraph[i];
            if (zoomList.length !== 0) {
                tempPixels = tempPixels.slice(zoomStart * 4, zoomEnd * 4);
                tempPixelWidth = zoomEnd - zoomStart;
            }
            drawLine(graphCtx, tempPixels, tempPixelWidth, referenceColors[i % referenceColors.length], -1, maxValue);
        }
    }

    if (toggleCombined) {
        drawLine(graphCtx, pixels, pixelWidth, 'black', -1, maxValue, fillArea);
        if (document.getElementById('togglePeaksCheckbox').checked && maxima.length > 0) {
            drawPeaks(maxima, maxValue, 'black');
        }
    }
    if (toggleR) {
        drawLine(graphCtx, pixels, pixelWidth, 'red', 0, maxValue, false);
        if (document.getElementById('togglePeaksCheckbox').checked && maximaR.length > 0) {
            drawPeaks(maximaR, maxValue, 'red');
        }
    }
    if (toggleG) {
        drawLine(graphCtx, pixels, pixelWidth, 'green', 1, maxValue, false);
        if (document.getElementById('togglePeaksCheckbox').checked && maximaG.length > 0) {
            drawPeaks(maximaG, maxValue, 'green');
        }
    }
    if (toggleB) {
        drawLine(graphCtx, pixels, pixelWidth, 'blue', 2, maxValue, false);
        if (document.getElementById('togglePeaksCheckbox').checked && maximaB.length > 0) {
            drawPeaks(maximaB, maxValue, 'blue');
        }
    }

    if (isDragging) {
        const rectX = Math.min(dragStartX, dragEndX);
        const rectWidth = Math.abs(dragStartX - dragEndX);
        graphCtx.fillStyle = 'rgba(0, 0, 255, 0.2)';
        graphCtx.fillRect(rectX, 30, rectWidth, graphCanvas.height - 60);
    }
}

/**
 * Calculates the maximum value of the graph and adds a small padding for dynamic Y axis
 */
function calculateMaxValue(pixels) {
    let maxValue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        const value = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (value > maxValue) {
            maxValue = value;
        }
    }
    return maxValue + 5;
}

/**
 * Averages the pixels in a stripe
 */
function averagePixels(pixels, pixelWidth) {
    let averagedPixels = new Uint8ClampedArray(pixelWidth * 4);
    for (let x = 0; x < pixelWidth; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let y = 0; y < stripeWidth; y++) {
            r += pixels[(y * pixelWidth + x) * 4];
            g += pixels[(y * pixelWidth + x) * 4 + 1];
            b += pixels[(y * pixelWidth + x) * 4 + 2];
            a += pixels[(y * pixelWidth + x) * 4 + 3];
        }
        averagedPixels[x * 4] = r / stripeWidth;
        averagedPixels[x * 4 + 1] = g / stripeWidth;
        averagedPixels[x * 4 + 2] = b / stripeWidth;
        averagedPixels[x * 4 + 3] = a / stripeWidth;
    }
    return averagedPixels;
}

/**
 * Finds the peaks of the graph
 */
function findPeaks(pixels, pixelWidth, minValue, colorOffset = -1) {
    let maxima = [];
    let start = null;

    for (let x = 1; x < pixelWidth - 1; x++) {
        let value = colorOffset === -1
            ? calculateMaxColor(pixels, x)
            : pixels[x * 4 + colorOffset];
        let prevValue = colorOffset === -1
            ? calculateMaxColor(pixels, x - 1)
            : pixels[(x - 1) * 4 + colorOffset];
        let nextValue = colorOffset === -1
            ? calculateMaxColor(pixels, x + 1)
            : pixels[(x + 1) * 4 + colorOffset];

        if (value > minValue && value >= prevValue && value >= nextValue) {
            if (start === null && prevValue < value) {
                start = x;
            }
        } else {
            if (start !== null) {
                let plateauValue = colorOffset === -1
                    ? calculateMaxColor(pixels, start)
                    : pixels[start * 4 + colorOffset];
                let nextPlateauValue = colorOffset === -1
                    ? calculateMaxColor(pixels, x)
                    : pixels[x * 4 + colorOffset];

                if (plateauValue > nextPlateauValue) {
                    maxima.push({ x: start, value: plateauValue });
                }
                start = null;
            }
        }
    }

    const firstPixelValue = colorOffset === -1
        ? calculateMaxColor(pixels, 0)
        : pixels[4 + colorOffset];
    if (firstPixelValue > (colorOffset === -1
        ? calculateMaxColor(pixels, 1)
        : pixels[4 + colorOffset]) && firstPixelValue > minValue) {
        maxima.push({ x: 0, value: Math.floor(firstPixelValue) });
    }

    const lastPixelValue = colorOffset === -1
        ? calculateMaxColor(pixels, pixelWidth - 1)
        : pixels[(pixelWidth - 1) * 4 + colorOffset];
    if (lastPixelValue > (colorOffset === -1
        ? calculateMaxColor(pixels, pixelWidth - 2)
        : pixels[(pixelWidth - 2) * 4 + colorOffset]) && lastPixelValue > minValue) {
        maxima.push({ x: pixelWidth - 1, value: Math.floor(lastPixelValue) });
    }

    return maxima;
}

/**
 * Draws dotted lines below the peaks on the graph canvas
 */
function drawDottedLine(x, yStart, yEnd, color) {
    graphCtx.beginPath();
    graphCtx.setLineDash([5, 5]);
    graphCtx.moveTo(x, yEnd);
    graphCtx.lineTo(x, yStart);
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 1;
    graphCtx.stroke();
    graphCtx.setLineDash([]);
}

/**
 * Draws the peaks on the graph canvas
 */
function drawPeaks(maxima, maxValue, color) {
    const padding = 30;
    const height = graphCanvas.height;
    const [zoomStart, zoomEnd] = getZoomRange(getElementWidth(videoElement));
    maxima.forEach(max => {
        if (max.x >= zoomStart && max.x <= zoomEnd) {
            const x = calculateXPosition(max.x - zoomStart, zoomEnd - zoomStart, graphCanvas.width);
            const y = calculateYPosition(max.value, height, maxValue);
            drawDottedLine(x, height - padding, y, color);
            drawPeakLabel(x, y, max.x);
        }
    });
}

/**
 * Draws the peak label on the graph canvas
 */
function drawPeakLabel(x, y, peakX) {
    const toggleXLabelsPx = document.getElementById('toggleXLabelsPx').checked;
    let label;
    if (!toggleXLabelsPx) {
        label = `${getWaveLengthByPx(peakX).toFixed(1)}`;
    } else {
        label = `${peakX.toFixed(0)}`;
    }
    const textWidth = graphCtx.measureText(label).width;
    const textHeight = 20;

    graphCtx.fillStyle = 'black';
    graphCtx.font = '16px Arial';
    graphCtx.fillText(label, x - textWidth / 2, y - textHeight / 2);
}

/**
 * Creates a canvas element for the line graph
 */
function createLineCanvas() {
    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = getElementWidth(videoElement);
    lineCanvas.height = getStripeWidth();
    return lineCanvas;
}

/**
 * Removes existing event listeners from the graph canvas
 */
function removeEventListeners() {
    eventListeners.forEach(({ element, type, listener }) => {
        element.removeEventListener(type, listener);
    });
    eventListeners = [];
}

/**
 * Sets up event listeners for the graph canvas
 */
function setupEventListeners() {
    removeEventListeners();

    function addEventListener(element, type, listener) {
        element.addEventListener(type, listener);
        eventListeners.push({ element, type, listener });
    }

    addEventListener(document.getElementById('togglePeaksCheckbox'), 'change', () => {
        redrawGraphIfLoadedImage(true);
    });

    addEventListener(document.getElementById('minValueRange'), 'input', function() {
        minValue = parseInt(this.value, 10);
        document.getElementById('minValueValue').textContent = minValue;
        redrawGraphIfLoadedImage(true);
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        addEventListener(checkbox, 'change', () => {
            needToRecalculateMaxima = true;
            redrawGraphIfLoadedImage();
        });
    });

    addEventListener(document.getElementById('resetZoomButton'), 'click', () => {
        resetZoom();
        redrawGraphIfLoadedImage()
    });

    document.getElementById('colorGraph').addEventListener('change', () => {
        redrawGraphIfLoadedImage();
    });

    document.getElementById('stepBackButton').addEventListener('click', stepBackZoom);

    document.getElementById('referenceGraphCheckbox').addEventListener( 'change', () => {
        const referenceGraphCheckbox = document.getElementById('referenceGraphCheckbox');
        if (referenceGraphCheckbox.checked) {
            document.getElementById("referenceGraphControl").style.display = "block";
            showReferenceGraph = true;
        } else {
            document.getElementById("referenceGraphControl").style.display = "none";
            showReferenceGraph = false;
        }
        redrawGraphIfLoadedImage()
    });

    addEventListener(graphCanvas, 'mousedown', (event) => {
        isDragging = true;
        const rect = graphCanvas.getBoundingClientRect();
        dragStartX = Math.max(30, Math.min(event.clientX - rect.left, graphCanvas.width - 30));
        dragEndX = dragStartX;
        redrawGraphIfLoadedImage()
    });

    addEventListener(graphCanvas, 'mousemove', (event) => {
        const rect = graphCanvas.getBoundingClientRect();

        if (isDragging) {
            dragEndX = Math.max(30, Math.min(event.clientX - rect.left, graphCanvas.width - 30));

            if (zoomList.length !== 0) {
                dragEndX = Math.max(30, Math.min(event.clientX - rect.left, graphCanvas.width - 30));
            }
        }
        redrawGraphIfLoadedImage(true);
    });

    addEventListener(graphCanvas, 'mouseup', () => {
        if (isDragging) {
            isDragging = false;
            addZoomRange(dragStartX, dragEndX);
            redrawGraphIfLoadedImage()
        }
    });

    document.querySelectorAll('input[name="toggleXLabels"]').forEach(radio => {
        addEventListener(radio, 'change', () => {
            redrawGraphIfLoadedImage()
        });
    });

    document.addEventListener('keydown', (event) => {
        if (zoomList.length === 0) return;

        const [zoomStart, zoomEnd] = zoomList[zoomList.length - 1];
        const elementWidth = getElementWidth(videoElement);
        const zoomRange = zoomEnd - zoomStart;
        const step = Math.ceil(zoomRange / 10);

        if (event.key === 'ArrowLeft') {
            const newZoomStart = Math.max(0, zoomStart - step);
            const newZoomEnd = Math.min(elementWidth, newZoomStart + zoomRange);
            updateZoomRange(newZoomStart, newZoomEnd);
        } else if (event.key === 'ArrowRight') {
            const newZoomEnd = Math.min(elementWidth, zoomEnd + step);
            const newZoomStart = Math.max(0, newZoomEnd - zoomRange);
            updateZoomRange(newZoomStart, newZoomEnd);
        }
    });

    document.getElementById('colorGraph').addEventListener('change', function () {
        const sliderContainer = document.getElementById('gradientOpacitySliderContainer');
        sliderContainer.style.display = this.checked ? 'block' : 'none';
        redrawGraphIfLoadedImage();
    });

    document.getElementById('gradientOpacitySlider').addEventListener('input', function () {
        gradientOpacity = parseFloat(this.value);
        document.getElementById('gradientOpacityValue').textContent = gradientOpacity.toFixed(1);
        redrawGraphIfLoadedImage();
    });
}

/**
 * Returns the states of RGB toggle buttons
 */
function getToggleStates() {
    return {
        toggleCombined: document.getElementById('toggleCombined').checked,
        toggleR: document.getElementById('toggleR').checked,
        toggleG: document.getElementById('toggleG').checked,
        toggleB: document.getElementById('toggleB').checked
    };
}

/**
 * Returns the zoom range based on pixel width
 */
function getZoomRange(pixelWidth) {
    let zoomStart = 0;
    let zoomEnd = pixelWidth;
    if (zoomList.length !== 0) {
        [zoomStart, zoomEnd] = zoomList[zoomList.length - 1];
    }
    return [zoomStart, zoomEnd];
}

function redrawGraphIfLoadedImage(invalidatePeaks = false) {
    if (invalidatePeaks) {
        needToRecalculateMaxima = true;
    }
    if (videoElement instanceof HTMLImageElement) {
        generateSpectrumList(getElementWidth(videoElement));
        draw();
    }
}

/**
 * Updates the zoom range in the zoom list
 */
function updateZoomRange(newZoomStart, newZoomEnd) {
    zoomList[zoomList.length - 1] = [newZoomStart, newZoomEnd];
    redrawGraphIfLoadedImage();
    console.log(zoomList);
}

/**
 * Clears the graph canvas
 */
function clearGraph(graphCtx, graphCanvas) {
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    graphCtx.fillStyle = 'white';
    graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
}

/**
 * Draws the grid on the graph canvas
 */
function drawGrid(graphCtx, graphCanvas, zoomStart, zoomEnd, pixels) {
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    const padding = 30;

    let maxValue = calculateMaxValue(pixels);
    const numOfYLabels = 25;

    graphCtx.beginPath();
    graphCtx.strokeStyle = '#e0e0e0';
    graphCtx.lineWidth = 0.5;
    graphCtx.font = '14px Arial';
    graphCtx.fillStyle = 'black';

    for (let i = 0; i <= numOfYLabels; i++) {
        const y = padding + ((height - 2 * padding) / numOfYLabels) * i;
        graphCtx.moveTo(padding, y);
        graphCtx.lineTo(width - padding, y);
        const label = (maxValue - (i * (maxValue / numOfYLabels))).toFixed(0);
        graphCtx.fillText(label, 5, y + 3);
    }

    const toggleXLabelsPx = document.getElementById('toggleXLabelsPx').checked;
    const zoomRange = zoomEnd - zoomStart;
    const numOfXLabels = Math.min(20, zoomRange);
    const stepSize = Math.ceil(zoomRange / numOfXLabels);

    for (let i = Math.ceil(zoomStart / stepSize) * stepSize; i <= zoomEnd; i += stepSize) {
        const x = calculateXPosition(i - zoomStart, zoomRange, width);
        graphCtx.moveTo(x, padding);
        graphCtx.lineTo(x, height - padding);
        let label;
        if (!toggleXLabelsPx) {
            label = getWaveLengthByPx(i).toFixed(1);
        } else {
            label = i.toFixed(0);
        }
        graphCtx.fillText(label, x - 10, height - 5);
    }

    graphCtx.stroke();
}

/**
 * Generates the spectrum list based on the number of pixels
 */
function generateSpectrumList(pixelWidth) {
    spectrumList = [];
    for (let i = 0; i < pixelWidth; i++) {
        const ratio = i / (pixelWidth - 1);
        const r = Math.round(255 * Math.max(1 - 2 * ratio, 0));
        const g = Math.round(255 * Math.max(1 - Math.abs(2 * ratio - 1), 0));
        const b = Math.round(255 * Math.max(2 * ratio - 1, 0));
        spectrumList.push(`rgb(${r}, ${g}, ${b})`);
    }
}

/**
 * Draws a line with a gradient based on the spectrum list
 */
function drawLine(graphCtx, pixels, pixelWidth, color, colorOffset, maxValue, fillArea = false) {
    const [zoomStart, zoomEnd] = getZoomRange(pixelWidth);
    const zoomRange = zoomEnd - zoomStart;
    const zoomedSpectrum = spectrumList.slice(zoomStart, zoomEnd);

    if (fillArea) {
        for (let x = 0; x < zoomRange - 1; x++) {
            let value = colorOffset === -1 ? calculateMaxColor(pixels, x) : pixels[x * 4 + colorOffset];
            let nextValue = colorOffset === -1 ? calculateMaxColor(pixels, x + 1) : pixels[(x + 1) * 4 + colorOffset];

            const y = calculateYPosition(value, graphCtx.canvas.height, maxValue);
            const nextY = calculateYPosition(nextValue, graphCtx.canvas.height, maxValue);
            const scaledX = calculateXPosition(x, zoomRange, graphCtx.canvas.width);
            const nextX = calculateXPosition(x + 1, zoomRange, graphCtx.canvas.width);

            const gradient = graphCtx.createLinearGradient(scaledX, 0, nextX, 0);
            const startColor = zoomedSpectrum[x].replace('rgb', 'rgba').replace(')', `, ${gradientOpacity})`);
            const endColor = (zoomedSpectrum[x + 1] || zoomedSpectrum[x]).replace('rgb', 'rgba').replace(')', `, ${gradientOpacity})`);

            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);

            graphCtx.beginPath();
            graphCtx.moveTo(scaledX, graphCtx.canvas.height - 30);
            if (x === 0) {
                graphCtx.lineTo(scaledX, y);
                graphCtx.lineTo(nextX, y);
            } else {
                graphCtx.lineTo(scaledX, graphCtx.currentY || y);
                graphCtx.lineTo(nextX, graphCtx.currentY || y);
            }
            graphCtx.lineTo(nextX, graphCtx.canvas.height - 30);
            graphCtx.closePath();

            graphCtx.fillStyle = gradient;
            graphCtx.fill();
            graphCtx.currentY = nextY;
        }
    }

    graphCtx.beginPath();
    for (let x = 0; x < zoomRange; x++) {
        let value = colorOffset === -1 ? calculateMaxColor(pixels, x) : pixels[x * 4 + colorOffset];
        const y = calculateYPosition(value, graphCtx.canvas.height, maxValue);
        const scaledX = calculateXPosition(x, zoomRange, graphCtx.canvas.width);

        if (x === 0) {
            graphCtx.moveTo(scaledX, y);
        } else {
            graphCtx.lineTo(scaledX, graphCtx.currentY || y);
            graphCtx.lineTo(scaledX, y);
        }
        graphCtx.currentY = y;
    }
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 1;
    graphCtx.stroke();
}

/**
 * Returns the maximum color value of a pixel
 */
function calculateMaxColor(pixels, x) {
    return Math.max(pixels[x * 4], pixels[x * 4 + 1], pixels[x * 4 + 2]);
}

/**
 * Calculates the Y position of a value on the canvas
 */
function calculateYPosition(value, canvasHeight, maxValue) {
    const padding = 30;
    return canvasHeight - padding - (value / maxValue) * (canvasHeight - 2 * padding);
}

/**
 * Calculates the X position of a value on the canvas
 */
function calculateXPosition(x, pixelWidth, canvasWidth) {
    const padding = 30;
    return padding + (x / (pixelWidth - 1)) * (canvasWidth - 2 * padding);
}

function initializeZoomList() {
    zoomList = [[0, getElementWidth(videoElement)]];
}

/**
 * Adds a zoom range to the zoom list and stores the previous zoom level in history
 */
function addZoomRange(startX, endX) {
    const rect = graphCanvas.getBoundingClientRect();
    const canvasWidth = rect.width - 60;

    let zoomStart;
    let zoomEnd;
    [zoomStart, zoomEnd] = zoomList[zoomList.length - 1];

    const startIndex = Math.floor(zoomStart + (startX - 30) / canvasWidth * (zoomEnd - zoomStart));
    const endIndex = Math.floor(zoomStart + (endX - 30) / canvasWidth * (zoomEnd - zoomStart));

    if (Math.abs(startIndex - endIndex) < 2) {
        console.log('Zoom range too small, zoom not applied.');
        return;
    }

    const newZoom = startIndex > endIndex ? [endIndex, startIndex] : [startIndex, endIndex];
    newZoom[0] = Math.max(0, newZoom[0]);
    newZoom[1] = Math.min(getElementWidth(videoElement), newZoom[1]);

    shiftZoomListIfFull();
    zoomList.push(newZoom);
    console.log(zoomList);
}

function resetZoom() {
    shiftZoomListIfFull();
    zoomList.push([0, getElementWidth(videoElement)]);
}

function shiftZoomListIfFull() {
    if (zoomList.length === MAX_ZOOM_HISTORY) {
        zoomList.shift();
    }
}

/**
 * Steps back to the previous zoom level
 */
function stepBackZoom() {
    if (zoomList.length > 1) {
        zoomList.pop();
        redrawGraphIfLoadedImage()
    } else {
        console.log('No previous zoom level to step back to.');
    }
}

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (videoElement) {
            plotRGBLineFromCamera();
        }
    });
});