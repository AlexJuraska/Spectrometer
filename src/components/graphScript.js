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
let toggleCombined = false;
let toggleR = false;
let toggleG = false;
let toggleB = false;
let fillArea = false;

let graphCanvas = document.getElementById('graphCanvas');
let graphCtx = graphCanvas.getContext('2d', { willReadFrequently: true });

const MAX_Y_VALUE_PADDING = 5;

let lineCtx;

let gradientOpacity = 0.7;

let lowerPeakBound = 1;
let upperPeakBound = 255;

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
    drawGraph();
    if (!(videoElement instanceof HTMLImageElement)) {
        animationId = requestAnimationFrame(draw);
        needToRecalculateMaxima = true;
    }
}

/**
 * Draws the graph line, graph grid and labels, deals with peaks, zooming and reference graph
 */
function drawGraph() {
    const stripeWidth = getStripeWidth();
    const toggleStates = getToggleStates();
    toggleCombined = toggleStates.toggleCombined;
    toggleR = toggleStates.toggleR;
    toggleG = toggleStates.toggleG;
    toggleB = toggleStates.toggleB;
    fillArea = document.getElementById("colorGraph").checked;
    const startY = getElementHeight(videoElement) * getYPercentage() - stripeWidth / 2;
    lineCtx.drawImage(videoElement, 0, startY, getElementWidth(videoElement), stripeWidth, 0, 0, getElementWidth(videoElement), stripeWidth);

    let pixels = lineCtx.getImageData(0, 0, getElementWidth(videoElement), stripeWidth).data;
    let pixelWidth = getElementWidth(videoElement);

    if (stripeWidth > 1) {
        pixels = averagePixels(pixels, pixelWidth);
    }

    if (captureReferenceGraph) {
        referenceGraph.push([pixels, pixelWidth, minValue, calculateMaxValue(pixels) - MAX_Y_VALUE_PADDING]);
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

    if (fillArea && (toggleCombined || toggleR || toggleG || toggleB)) {
        drawGradient(graphCtx, pixels, pixelWidth, maxValue);
    }
    // console.log(fillArea);
    // console.log(toggleCombined);
    // console.log(toggleR);
    // console.log(toggleG);
    // console.log(toggleB);
    let peaksToggled = document.getElementById('togglePeaksCheckbox').checked;

    if (toggleCombined) {
        drawLine(graphCtx, pixels, pixelWidth, 'black', -1, maxValue);
        if (peaksToggled && maxima.length > 0) {
            drawPeaks(maxima, maxValue, 'black');
        }
    }
    if (toggleR) {
        drawLine(graphCtx, pixels, pixelWidth, 'red', 0, maxValue);
        if (peaksToggled && maximaR.length > 0) {
            drawPeaks(maximaR, maxValue, 'red');
        }
    }
    if (toggleG) {
        drawLine(graphCtx, pixels, pixelWidth, 'green', 1, maxValue);
        if (peaksToggled && maximaG.length > 0) {
            drawPeaks(maximaG, maxValue, 'green');
        }
    }
    if (toggleB) {
        drawLine(graphCtx, pixels, pixelWidth, 'blue', 2, maxValue);
        if (peaksToggled && maximaB.length > 0) {
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
    if (referenceGraph.length > 0 && showReferenceGraph) {
        for (let i = 0; i < referenceGraph.length; i++) {
            const tempMaxValue = referenceGraph[i][3];
            if (tempMaxValue > maxValue) {
                maxValue = tempMaxValue;
            }
        }
    }
    for (let i = 0; i < pixels.length; i += 4) {
        const value = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (value > maxValue) {
            maxValue = value;
        }
    }
    return maxValue + MAX_Y_VALUE_PADDING;
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
function findPeaks(pixels, pixelWidth, minValue, colorOffset = -1, minProminence = 10) {
    function getValue(x) {
        return colorOffset === -1
            ? calculateMaxColor(pixels, x)
            : pixels[x * 4 + colorOffset];
    }

    function findLeftMin(startX) {
        let min = getValue(startX);
        for (let i = startX - 1; i >= 0; i--) {
            let val = getValue(i);
            if (val <= min) min = val;
            else break;
        }
        return min;
    }

    function findRightMin(startX) {
        let min = getValue(startX);
        for (let i = startX + 1; i < pixelWidth; i++) {
            let val = getValue(i);
            if (val <= min) min = val;
            else break;
        }
        return min;
    }

    let maxima = [];
    let start = null;
    let numOfOkPeaks = 0;

    for (let x = 1; x < pixelWidth - 1; x++) {
        let value = getValue(x);
        let prevValue = getValue(x - 1);
        let nextValue = getValue(x + 1);

        if (value > minValue && value >= prevValue && value >= nextValue) {
            if (start === null && prevValue < value) {
                start = x;
            }
        } else {
            if (start !== null) {
                let plateauValue = getValue(start);
                let nextPlateauValue = getValue(x);

                if (plateauValue > nextPlateauValue) {
                    const leftMin = findLeftMin(start);
                    const rightMin = findRightMin(x - 1);
                    const leftProminence = plateauValue - leftMin;
                    const rightProminence = plateauValue - rightMin;
                    const checkedMinValue = Math.min(leftProminence, rightProminence);
                    if (lowerPeakBound <= checkedMinValue) {
                        maxima.push({ x: start, value: plateauValue });
                    }
                }
                start = null;
            }
        }
    }

    const firstValue = getValue(0);
    if (firstValue > getValue(1) && firstValue > minValue) {
        const rightMin = findRightMin(1);
        const rightProminence = firstValue - rightMin;

        if (lowerPeakBound <= rightProminence) {
            maxima.push({ x: 0, value: firstValue });
        }
    }

    const lastX = pixelWidth - 1;
    const lastValue = getValue(lastX);
    if (lastValue > getValue(lastX - 1) && lastValue > minValue) {
        const leftMin = findLeftMin(lastX - 1);
        const leftProminence = lastValue - leftMin;

        if (lowerPeakBound <= leftProminence) {
            maxima.push({ x: lastX, value: lastValue });
        }
    }

    return maxima;
}

function getLowerPeakBound() {
    return parseInt(document.getElementById('peakSizeLower').value, 10);
}

function setPeakBounds() {
    const lowerBound = document.getElementById('peakSizeLower').value;

    if (lowerBound === '') {
        resetPeakBounds()
        return;
    }

    const lowerBoundInt = getLowerPeakBound();

    if (lowerBoundInt < 0 || lowerBoundInt > 255) {
        resetPeakBounds();
        return;
    }
    lowerPeakBound = lowerBoundInt;
}

function resetPeakBounds() {
    document.getElementById('peakSizeLower').value = '1';
    lowerPeakBound = getLowerPeakBound();
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
        const step = Math.ceil(zoomRange / 25);
        console.log(zoomRange, step)

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

    document.getElementById('peakSizeLower').addEventListener("input", () => {
        setPeakBounds();
        redrawGraphIfLoadedImage(true);
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
 * Calculates the best step size for axis labels
 */
function niceStep(range, maxLabels) {
    const roughStep = range / maxLabels;
    const exponent = Math.floor(Math.log10(roughStep));
    const fraction = roughStep / Math.pow(10, exponent);
    let niceFraction;
    if (fraction <= 1) {
        niceFraction = 1;
    }
    else if (fraction <= 2) {
        niceFraction = 2;
    }
    else if (fraction <= 5) {
        niceFraction = 5;
    }
    else {
        niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
}

/**
 * Draws the grid on the graph canvas
 */
function drawGrid(graphCtx, graphCanvas, zoomStart, zoomEnd, pixels) {
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    const padding = 30;

    let maxValue = calculateMaxValue(pixels);

    const numOfYLabels = Math.min(25, Math.floor(maxValue));
    const yStep = niceStep(maxValue, numOfYLabels);

    graphCtx.beginPath();
    graphCtx.strokeStyle = '#e0e0e0';
    graphCtx.lineWidth = 0.5;
    graphCtx.font = '14px Arial';
    graphCtx.fillStyle = 'black';

    for (let yValue = 0; yValue <= maxValue; yValue += yStep) {
        const y = padding + ((height - 2 * padding) * (1 - yValue / maxValue));
        const label = Math.round(yValue).toString();
        graphCtx.moveTo(padding, y);
        graphCtx.lineTo(width - padding, y);
        graphCtx.fillText(label, 5, y + 3);
    }

    const toggleXLabelsPx = document.getElementById('toggleXLabelsPx');
    const toggleXLabelsNm = document.getElementById("toggleXLabelsNm");
    const zoomRange = zoomEnd - zoomStart;
    const numOfXLabels = Math.min(20, zoomRange);
    const xStep = niceStep(zoomRange, numOfXLabels);

    let showNm;
    if (toggleXLabelsNm.checked) {
        if (!isCalibrated()) {
            showNm = false;
            toggleXLabelsPx.checked = true;
            toggleXLabelsNm.checked = false;
            showInfoPopup("noNmNeedToCalibrate", "acknowledge");
        } else {
            showNm = true;
        }
    } else {
        showNm = false;
    }

    for (let i = Math.ceil(zoomStart / xStep) * xStep; i <= zoomEnd; i += xStep) {
        const x = calculateXPosition(i - zoomStart, zoomRange, width);
        graphCtx.moveTo(x, padding);
        graphCtx.lineTo(x, height - padding);
        let label;
        if (showNm) {
            label = getWaveLengthByPx(i).toFixed(1);
        } else {
            label = Math.round(i).toString();
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
 * Draws a line based on the spectrum list
 */
function drawLine(graphCtx, pixels, pixelWidth, color, colorOffset, maxValue) {
    const [zoomStart, zoomEnd] = getZoomRange(pixelWidth);
    const zoomRange = zoomEnd - zoomStart;
    const width = graphCtx.canvas.width;
    const height = graphCtx.canvas.height;

    graphCtx.beginPath();
    for (let x = 0; x < zoomRange; x++) {
        let value = colorOffset === -1 ? calculateMaxColor(pixels, x) : pixels[x * 4 + colorOffset];
        const y = calculateYPosition(value, height, maxValue);
        const scaledX = calculateXPosition(x, zoomRange, width);
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
 * Fills the area under the line with a gradient based on the spectrum list
 */
function drawGradient(graphCtx, pixels, pixelWidth, maxValue) {
    const [zoomStart, zoomEnd] = getZoomRange(pixelWidth);
    const zoomRange = zoomEnd - zoomStart;
    const padding = 30;
    const width = graphCtx.canvas.width;
    const height = graphCtx.canvas.height;

    const onlyR = toggleR && !toggleG && !toggleB;
    const onlyG = !toggleR && toggleG && !toggleB;
    const onlyB = !toggleR && !toggleG && toggleB;

    for (let x = 0; x < zoomRange; x++) {
        const pxIndex = x * 4;
        let r = pixels[pxIndex];
        let g = pixels[pxIndex + 1];
        let b = pixels[pxIndex + 2];

        let value, fillColor;
        if (onlyR) {
            value = r;
            fillColor = `rgba(${r},0,0,${gradientOpacity})`;
        } else if (onlyG) {
            value = g;
            fillColor = `rgba(0,${g},0,${gradientOpacity})`;
        } else if (onlyB) {
            value = b;
            fillColor = `rgba(0,0,${b},${gradientOpacity})`;
        } else {
            value = calculateGradient(pixels, x);
            fillColor = `rgba(${r},${g},${b},${gradientOpacity})`;
        }

        const y = calculateYPosition(value, height, maxValue);
        const leftX = Math.round(calculateXPosition(x, zoomRange, width));
        const rightX = Math.round(
            x < zoomRange - 1
                ? calculateXPosition(x + 1, zoomRange, width)
                : width - padding
        );
        const rectWidth = rightX - leftX;

        graphCtx.fillStyle = fillColor;
        graphCtx.fillRect(leftX, Math.floor(y), rectWidth, Math.ceil(height - padding - y));
    }
}

/**
 * Returns the maximum color value of a pixel
 */
function calculateMaxColor(pixels, x) {
    return Math.max(pixels[x * 4], pixels[x * 4 + 1], pixels[x * 4 + 2]);
}

/**
 * Calculates and returns the maximum value of a pixel based on the toggled colors
 */
function calculateGradient(pixels, x) {
    if (toggleCombined || (toggleR && toggleG && toggleB)) {
        return Math.max(pixels[x * 4], pixels[x * 4 + 1], pixels[x * 4 + 2]);
    }
    if (toggleR) {
        if (toggleG) {
            return Math.max(pixels[x * 4], pixels[x * 4 + 1]);
        }
        if (toggleB) {
            return Math.max(pixels[x * 4], pixels[x * 4 + 2]);
        }
        return pixels[x * 4];
    }
    if (toggleG) {
        if (toggleB) {
            return Math.max(pixels[x * 4 + 1], pixels[x * 4 + 2]);
        }
        return pixels[x * 4 + 1];
    }
    return pixels[x * 4 + 2];
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

    zoomList.push(newZoom);
    console.log(zoomList);
}

function resetZoom() {
    zoomList = [[0, getElementWidth(videoElement)]];
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
            redrawGraphIfLoadedImage();
        }
    });
});

/**
 * Resizes the canvas to fit the current window size
 */
function resizeCanvasToDisplaySize(ctx, canvas, type) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    clearGraph(ctx, canvas);

    if (type === "Calibration") {
        drawGridCalibration();
        drawCalibrationLine();
        drawCalibrationPoints();
    } else if (type === "Divergence") {
        drawGridDivergence();
        drawDivergenceLine();
        drawDivergencePoints();
    } else if (type === "Normal") {
        plotRGBLineFromCamera();
    }
}