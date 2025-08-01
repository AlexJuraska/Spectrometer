const minInputBoxNumber = 2;
const maxInputBoxNumber = 15;

const rangeBeginX = 0;
const rangeEndX = 1280;
const rangeBeginY = 350;
const rangeEndY = 1000;

let inputBoxCounter = 0;
let polyFitCoefficientsArray = [];
let calibrationData = [];
let pixelCalPoints = [];
let nmCalPoints = [];
let nMAxis = []
let divergencePoints = [];

let graphCanvasCalibration;
let graphCtxCalibration;

let graphCanvasDivergence;
let graphCtxDivergence;

/**
 * Creates the initial minimum number of calibration input pairs
 */
function initializeCalibration() {
    for (let i = 1; i <= minInputBoxNumber; i++) {
        addInputPair();
    }
    disablePairRemoveButtons();
}

/**
 * Adds event listeners to all number inputs in the input div, the event listeners
 * activate calibration upon a value being entered
 */
function addInputPairListener(div) {
    const inputs = div.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener("input", function() {
            const [inputPx, inputNm] = inputs;
            if (inputPx.value.trim() !== "" && inputNm.value.trim() !== "") {
                setCalibrationPoints();
            }
        });
    });
}

/**
 *Adds a pair of input boxes
 */
function addInputPair() {
    if (inputBoxCounter === maxInputBoxNumber) {
        callError("maxNumberOfCalibrationPointsError");
        return;
    }

    inputBoxCounter++;

    const container = document.getElementById("input-container");
    const div = document.createElement("div");
    div.classList.add("input-pair")

    // "Point n"
    const pointLabel = document.createElement("label");
    const spanLabel = document.createElement("span");
    spanLabel.setAttribute("data-translate", "point");
    pointLabel.appendChild(spanLabel);
    pointLabel.append(` ${inputBoxCounter}:`);

    // Px input
    const inputPx = document.createElement("input");
    inputPx.id = `point${inputBoxCounter}px`;
    inputPx.type = "number";
    inputPx.classList.add("form-control");
    inputPx.classList.add("form-control-sm");

    // Nm input
    const inputNm = document.createElement("input");
    inputNm.id = `point${inputBoxCounter}nm`;
    inputNm.type = "number";
    inputNm.classList.add("form-control");
    inputNm.classList.add("form-control-sm");

    // Point delete button
    const deleteButton = document.createElement("button");
    deleteButton.id = `deleteButton${inputBoxCounter}`;
    deleteButton.innerHTML = '&times;';
    deleteButton.classList.add("btn", "btn-sm", "btn-danger", "btn-secondary", "pb-0.5");

    const id = inputBoxCounter;
    deleteButton.onclick = function () { removeInputPair(id); };

    div.appendChild(pointLabel);
    div.appendChild(inputPx);
    div.appendChild(inputNm);
    div.appendChild(deleteButton);

    container.appendChild(div);

    addInputPairListener(div);

    // Sets the labels for the new pair
    updateTextContent();

    if (inputBoxCounter > minInputBoxNumber) {
        enablePairRemoveButtons();
    }
}

/**
 * Removes a specific input pair based on an id
 * @param inputBoxNumber - id of wanted input pair, indexing from 1
 */
function removeInputPair(inputBoxNumber) {
    if (inputBoxNumber > maxInputBoxNumber || inputBoxNumber < 1) {
        return;
    }

    if (inputBoxNumber > inputBoxCounter) {
        return;
    }

    if (inputBoxCounter <= minInputBoxNumber) {
        disablePairRemoveButtons();
        return;
    }

    let currPx = document.getElementById(`point${inputBoxNumber}px`);
    let currNm = document.getElementById(`point${inputBoxNumber}nm`);
    for (let i = inputBoxNumber+1; i <= inputBoxCounter; i++) {
        let nextPx = document.getElementById(`point${i}px`);
        let nextNm = document.getElementById(`point${i}nm`);

        currPx.value = nextPx.value;
        currNm.value = nextNm.value;

        currPx = nextPx;
        currNm = nextNm;
    }

    removeLastInputPair();

    if (inputBoxCounter === minInputBoxNumber) {
        disablePairRemoveButtons();
        return;
    }
}

/**
 * Removes the last pair of input boxes
 */
function removeLastInputPair() {
    const inputContainer = document.getElementById("input-container");
    if (inputContainer.children.length > minInputBoxNumber) {
        const lastInputPair = inputContainer.lastElementChild;
        inputContainer.removeChild(lastInputPair);
        inputBoxCounter --;
    }

    if (inputBoxCounter === minInputBoxNumber) {
        disablePairRemoveButtons();
    }
}

/**
 * Clears the values from all currently displayed input boxes
 */
function clearInputBoxes() {
    for (let i = 1; i <= inputBoxCounter; i++) {
        const pxInput = document.getElementById(`point${i}px`);
        const nmInput = document.getElementById(`point${i}nm`);
        pxInput.value = "";
        nmInput.value = "";
    }
}

/**
 * Removes all the additional boxes that were already added by the user
 */
function deleteAllAdditionalInputPairs() {
    if (inputBoxCounter !== minInputBoxNumber) {
        for (let i = inputBoxCounter; i > minInputBoxNumber; i--) {
            removeLastInputPair();
        }
    }
}

/**
 * Disables the [X] removal buttons for all input pairs
 */
function disablePairRemoveButtons() {
    for (let i = 1; i <= inputBoxCounter; i++) {
        const button = document.getElementById(`deleteButton${i}`);
        button.disabled = true;
    }
}

/**
 * Enables the [X] removal buttons for all input pairs
 */
function enablePairRemoveButtons() {
    for (let i = 1; i <= inputBoxCounter; i++) {
        const button = document.getElementById(`deleteButton${i}`);
        button.disabled = false;
    }
}

/**
 * Saves the calibration points from the input boxes
 */
function setCalibrationPoints() {
    resetCalValues();
    for (let i = 1; i < inputBoxCounter + 1; i++) {
        const pxInput = document.getElementById(`point${i}px`);
        const nmInput = document.getElementById(`point${i}nm`);

        if (pxInput && nmInput) {
            const rawPx = pxInput.value.trim();
            const rawNm = nmInput.value.trim();

            const pxValue = parseFloat(rawPx);
            const nmValue = parseFloat(rawNm);

            if (!isNaN(pxValue) &&
                !isNaN(nmValue)
            ) {
                calibrationData.push({ px: pxValue, nm: nmValue });
            }
        }
    }

    if (calibrationData.length >= minInputBoxNumber) {
        calibrate();
    }
    clearGraph(graphCtxCalibration, graphCanvasCalibration);

    drawGridCalibration();
    drawCalibrationLine();
    drawCalibrationPoints();

    drawGridDivergence();
    drawDivergenceLine();
    drawDivergencePoints();
}

/**
 * Creates an array of coefficients with the help of the Polynomial Regression located in polynomialReggressionScript.js
 */
function calibrate() {
    for (let i = 0; i < calibrationData.length; i++) {
        const point = calibrationData[i];
        if (pixelCalPoints.includes(point.px) && nmCalPoints.includes(point.nm)) {
            callError("duplicateCalPointsError");
            resetCalValues();
            return;
        }
        pixelCalPoints.push(point.px);
        nmCalPoints.push(point.nm);
    }
    const polyfit = new Polyfit(pixelCalPoints, nmCalPoints);

    const degree = Math.min(3, nmCalPoints.length-1);

    polyFitCoefficientsArray = polyfit.computeCoefficients(degree);
}

/**
 * Returns true if there is an active calibration, false otherwise
 */
function isCalibrated() {
    return nmCalPoints.length !== 0;
}

/**
 * Gets the wave Length from the pixel
 */
function getWaveLengthByPx(pixel) {
    let waveLength = 0;
    for (let i = 0; i < polyFitCoefficientsArray.length; i++) {
        let number = parseFloat(polyFitCoefficientsArray[i]);
        if (i === 0) {
            waveLength += number;
        }
        else {
            waveLength += number * Math.pow(pixel, i);
        }
    }
    return waveLength;
}

/**
 * Deletes the content of polyFitCoefficientsArray, calibrationData, pixelCalPoints, nmCalPoints before saving new values
 */
function resetCalValues() {
    polyFitCoefficientsArray = [];
    calibrationData = [];
    pixelCalPoints = [];
    nmCalPoints = [];
    nMAxis = [];
    divergencePoints = [];

    document.getElementById("my-file").value = null;
}

/**
 * Exports calibration settings into a .txt file
 */
function exportCalibrationFile() {
    if (calibrationData.length === 0) {
        callError("noCalPointsToExportError");
        return;
    }

    const filenameInput = document.getElementById("exportCalibrationNameInput").value.trim();
    const filename = filenameInput !== "" ? filenameInput : `calibration_points_${getTimestamp()}.txt`;

    const finalFilename = filename.endsWith(".txt") ? filename : filename + ".txt";

    const lines = calibrationData.map(point => `${point.px};${point.nm}`).join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Lets the user choose a file and then automatically fill out input boxes with the calibration points from the file
 */
function importCalibrationFile() {

    const fileInput = document.getElementById("my-file");
    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    resetInputBoxes();

    const reader = new FileReader();

    const validFormatRegex = /^(\d+(?:[.,]\d+)?);(\d+(?:[.,]\d+)?)(?:\n|$)/;

    reader.onload = function(event) {
        const fileContent = event.target.result;

        const lines = fileContent.trim().split("\n").map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length < minInputBoxNumber || lines.length > maxInputBoxNumber) {
            callError("wrongNumberOfCalPointsError");
            resetInputBoxes();
            return;
        }

        const extraLines = lines.length - inputBoxCounter;
        for (let i = 0; i < extraLines; i++) {
            addInputPair();
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (!validFormatRegex.test(line)) {
                callError("wrongCalPointsFormatError");
                resetInputBoxes()
                return;
            }

            const [px, nm] = lines[i].split(";");

            let pxValue = px.trim().replace(',', '.');
            let nmValue = nm.trim().replace(',', '.');

            const pxFloat = parseFloat(pxValue);
            const nmFloat = parseFloat(nmValue);

            const pxInput = document.querySelector(`#point${i+1}px`);
            const nmInput = document.querySelector(`#point${i+1}nm`);

            if (pxInput && nmInput) {
                pxInput.value = pxFloat;
                nmInput.value = nmFloat;
            }
        }
        setCalibrationPoints();
    };

    reader.readAsText(file);
}

/**
 * Converts the Px Axis into Nm using with the help of the calibration points
 */
function convertPxAxisIntoNm(){
    for (let i = 1; i <= rangeEndX; i++) {
        nMAxis.push(getWaveLengthByPx(i));
    }
    return nMAxis;
}
/**
 * Resets the input boxes, deletes all calibrated data
 */
function resetCalibrationPoints() {
    resetInputBoxes();
    resetCalValues();
    inputBoxCounter = minInputBoxNumber;
    drawGridCalibration();
    drawGridDivergence();
}

/**
 * Resets all input boxes, leaves only minInputBoxNumber of pairs
 */
function resetInputBoxes() {
    deleteAllAdditionalInputPairs();
    clearInputBoxes();
}

/**
 * Draws the grid of the graph
 */
function drawGridCalibration() {
    graphCanvasCalibration = document.getElementById('graphCalibration');
    graphCtxCalibration = graphCanvasCalibration.getContext('2d');
    clearGraph(graphCtxCalibration, graphCanvasCalibration);

    resizeCanvasToDisplaySize(graphCtxCalibration, graphCanvasCalibration, "None");

    const width = graphCanvasCalibration.getBoundingClientRect().width;
    const height = graphCanvasCalibration.getBoundingClientRect().height;
    const padding = 30;

    const yMin = rangeBeginY;
    const yMax = rangeEndY;
    const yStep = 50;

    graphCtxCalibration.beginPath();
    graphCtxCalibration.strokeStyle = '#e0e0e0';
    graphCtxCalibration.lineWidth = 0.5;
    graphCtxCalibration.font = '10px Arial';
    graphCtxCalibration.fillStyle = 'black';

    for (let yValue = yMin; yValue <= yMax; yValue += yStep) {
        const isMultiple200 = yValue % 200 === 0;
        const isEndpoint = (yValue === yMin || yValue === yMax);
        const y = padding + ((height - 2 * padding) / (yMax - yMin)) * (yMax - yValue);

        if (isMultiple200) {
            graphCtxCalibration.moveTo(padding, y);
            graphCtxCalibration.lineTo(width - padding, y);
            graphCtxCalibration.fillText(yValue.toFixed(0), 5, y + 3);
        } else if (isEndpoint) {
            graphCtxCalibration.fillText(yValue.toFixed(0), 5, y + 3);
        }
    }

    const xMin = rangeBeginX;
    const xMax = rangeEndX;
    const xStep = 40

    for (let xValue = xMin; xValue <= xMax; xValue += xStep) {
        const isMultiple200 = xValue % 200 === 0;
        const isEndpoint = (xValue === xMin || xValue === xMax);
        const x = padding + ((xValue - xMin) / xMax) * (width - 2 * padding);

        if (isMultiple200 || isEndpoint) {
            const label = xValue.toFixed(0);
            graphCtxCalibration.font = xValue >= 1000 ? '9px Arial' : '10px Arial';

            const textWidth = graphCtxCalibration.measureText(label).width;
            const textX = x - textWidth / 2;

            if (isMultiple200) {
                graphCtxCalibration.moveTo(x, padding);
                graphCtxCalibration.lineTo(x, height - padding);
            }

            graphCtxCalibration.fillText(label, textX, height - padding + 15);
        }
    }

    graphCtxCalibration.font = '11px Arial';
    graphCtxCalibration.fillStyle = 'black';

    graphCtxCalibration.fillText("nm", 10, padding - 10);
    graphCtxCalibration.fillText("px", width - padding + 14, height - padding + 15);

    graphCtxCalibration.stroke();
}

/**
 * Draws the function created from the pixelCalPoints and nmCalPoints arrays
 */
function drawCalibrationLine() {
    const width = graphCanvasCalibration.getBoundingClientRect().width;
    const height = graphCanvasCalibration.getBoundingClientRect().height;
    const padding = 30;

    nMAxis = convertPxAxisIntoNm();

    graphCtxCalibration.beginPath();

    let firstPoint = true;

    for (let i = 0; i < nMAxis.length; i++) {
        const px = i + 1;
        const nm = nMAxis[i];

        const xScaled = padding + ((px - rangeBeginX) / (rangeEndX - rangeBeginX)) * (width - 2 * padding);
        const yScaled = height - padding - ((nm - rangeBeginY) / (rangeEndY - rangeBeginY)) * (height - 2 * padding);

        if (firstPoint) {
            graphCtxCalibration.moveTo(xScaled, yScaled);
            firstPoint = false;
        } else {
            graphCtxCalibration.lineTo(xScaled, yScaled);
        }
    }

    graphCtxCalibration.strokeStyle = 'blue';
    graphCtxCalibration.lineWidth = 1.5;
    graphCtxCalibration.stroke();
}

/**
 * Draws the points represented by nmCalPoints and pixelCalPoints
 */
function drawCalibrationPoints() {
    const width = graphCanvasCalibration.getBoundingClientRect().width;
    const height = graphCanvasCalibration.getBoundingClientRect().height;
    const padding = 30;

    const rangeBeginX = 0;
    const rangeEndX = 1280;
    const rangeBeginY = 350;
    const rangeEndY = 1000;

    for (let i = 0; i < nmCalPoints.length; i++) {
        const x = padding + ((pixelCalPoints[i] - rangeBeginX) / (rangeEndX - rangeBeginX)) * (width - 2 * padding);
        const y = height - padding - ((nmCalPoints[i] - rangeBeginY) / (rangeEndY - rangeBeginY)) * (height - 2 * padding);

        graphCtxCalibration.fillStyle = 'red';
        graphCtxCalibration.strokeStyle = 'red';
        graphCtxCalibration.beginPath();
        graphCtxCalibration.arc(x, y, 4, 0, 2 * Math.PI);
        graphCtxCalibration.fill();
        graphCtxCalibration.stroke();
    }
}

/**
 * Draws up the graph representing the distance from calibration points to the created calibration function.
 * Creates the graph itself, then fills it using adjacent functions
 */
function drawGridDivergence() {
    graphCanvasDivergence = document.getElementById('graphDivergence');
    graphCtxDivergence = graphCanvasDivergence.getContext('2d');
    clearGraph(graphCtxDivergence, graphCanvasDivergence);

    resizeCanvasToDisplaySize(graphCtxDivergence, graphCanvasDivergence, "None");

    computeDivergence();

    const width = graphCanvasDivergence.getBoundingClientRect().width;
    const height = graphCanvasDivergence.getBoundingClientRect().height;
    const padding = 30;

    const xMin = rangeBeginX;
    const xMax = rangeEndX;
    const xStep = 40;

    const deltas = divergencePoints.map(p => p.delta);
    let maxAbs = Math.max(...deltas.map(Math.abs));

    if (maxAbs < 0.001) {
        maxAbs = 0.001;
    }

    const yMax = maxAbs * 1.25;
    const yMin = -yMax;
    const yStep = yMax / 3;

    graphCtxDivergence.beginPath();
    graphCtxDivergence.strokeStyle = '#e0e0e0';
    graphCtxDivergence.lineWidth = 0.5;
    graphCtxDivergence.font = '9px Arial';
    graphCtxDivergence.fillStyle = 'black';

    for (let yVal = yMin; yVal <= yMax + 1e-6; yVal += yStep) {
        const y = height - padding - ((yVal - yMin) / (yMax - yMin)) * (height - 2 * padding);

        graphCtxDivergence.moveTo(padding, y);
        graphCtxDivergence.lineTo(width - padding, y);

        const label = yVal.toFixed(3);
        graphCtxDivergence.fillText(label, 5, y + 3);
    }

    for (let xVal = xMin; xVal <= xMax; xVal += xStep) {
        const isMultiple200 = xVal % 200 === 0;
        const isEndpoint = (xVal === xMin || xVal === xMax);
        const x = padding + ((xVal - xMin) / (xMax - xMin)) * (width - 2 * padding);

        if (isMultiple200 || isEndpoint) {
            graphCtxDivergence.moveTo(x, padding);
            graphCtxDivergence.lineTo(x, height - padding);

            const label = xVal.toFixed(0);
            const textWidth = graphCtxDivergence.measureText(label).width;
            graphCtxDivergence.fillText(label, x - textWidth / 2, height - padding + 15);
        }
    }

    graphCtxDivergence.font = '11px Arial';
    graphCtxDivergence.fillText("nm", 10, padding - 10);
    graphCtxDivergence.fillText("px", width - padding + 14, height - padding + 15);

    graphCtxDivergence.stroke();

    drawZeroLineDivergence();
}

/**
 * Draws a line representing the created calibration function, the function is represented as Y=0 on the graph
 */
function drawZeroLineDivergence() {
    if (!graphCtxDivergence || !graphCanvasDivergence) return;

    const width = graphCanvasDivergence.getBoundingClientRect().width;
    const height = graphCanvasDivergence.getBoundingClientRect().height;
    const padding = 30;

    const deltas = divergencePoints.map(p => p.delta);
    let maxAbs = Math.max(...deltas.map(Math.abs));

    if (maxAbs < 0.001) {
        maxAbs = 0.001;
    }

    const yMax = maxAbs * 1.25;
    const yMin = -yMax;

    const yZero = height - padding - ((0 - yMin) / (yMax - yMin)) * (height - 2 * padding);

    const xStart = padding;
    const xEnd = width - padding;

    graphCtxDivergence.beginPath();
    graphCtxDivergence.strokeStyle = 'blue';
    graphCtxDivergence.lineWidth = 1.5;
    graphCtxDivergence.moveTo(xStart, yZero);
    graphCtxDivergence.lineTo(xEnd, yZero);
    graphCtxDivergence.stroke();
}

/**
 * Draws dotted lines indicating the distance from calibration points to the created calibration function
 */
function drawDivergenceLine() {
    if (divergencePoints.length < 2) return;

    const width = graphCanvasDivergence.getBoundingClientRect().width;
    const height = graphCanvasDivergence.getBoundingClientRect().height;
    const padding = 30;

    const xMin = rangeBeginX;
    const xMax = rangeEndX;

    const deltas = divergencePoints.map(p => p.delta);
    let maxAbs = Math.max(...deltas.map(Math.abs));

    if (maxAbs < 0.001) {
        maxAbs = 0.001;
    }

    const yMax = maxAbs * 1.25;
    const yMin = -yMax;

    for (let i = 0; i < divergencePoints.length; i++) {
        const point = divergencePoints[i];
        const x = padding + ((point.px - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const y = height - padding - ((point.delta - yMin) / (yMax - yMin)) * (height - 2 * padding);

        if (i === 0) {
            graphCtxDivergence.beginPath();
            graphCtxDivergence.moveTo(x, y);
        } else {
            graphCtxDivergence.lineTo(x, y);
        }

        graphCtxDivergence.beginPath();
        graphCtxDivergence.setLineDash([6, 4]);
        const yZero = height - padding - ((0 - yMin) / (yMax - yMin)) * (height - 2 * padding);
        graphCtxDivergence.moveTo(x, y);
        graphCtxDivergence.lineTo(x, yZero);
        graphCtxDivergence.strokeStyle = 'gray';
        graphCtxDivergence.lineWidth = 2;
        graphCtxDivergence.stroke();
        graphCtxDivergence.setLineDash([]);
    }


    graphCtxDivergence.stroke();
}

/**
 * Draws the input calibration points into the graph in positions informing their distance from
 * the created calibration function
 */
function drawDivergencePoints() {
    const width = graphCanvasDivergence.getBoundingClientRect().width;
    const height = graphCanvasDivergence.getBoundingClientRect().height;
    const padding = 30;

    const xMin = rangeBeginX;
    const xMax = rangeEndX;

    const deltas = divergencePoints.map(p => p.delta);
    let maxAbs = Math.max(...deltas.map(Math.abs));

    if (maxAbs < 0.001) {
        maxAbs = 0.001;
    }

    const yMax = maxAbs * 1.25;
    const yMin = -yMax;

    for (const point of divergencePoints) {
        const x = padding + ((point.px - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const y = height - padding - ((point.delta - yMin) / (yMax - yMin)) * (height - 2 * padding);

        graphCtxDivergence.fillStyle = 'red';
        graphCtxDivergence.beginPath();
        graphCtxDivergence.arc(x, y, 3, 0, 2 * Math.PI);
        graphCtxDivergence.fill();
    }
}

/**
 * Calculates the differences between the calibration points and the created calibration function
 */
function computeDivergence() {
    divergencePoints = [];

    for (let i = 0; i < calibrationData.length; i++) {
        const { px, nm } = calibrationData[i];
        const predictedNm = getWaveLengthByPx(px);
        const delta = predictedNm - nm;

        divergencePoints.push({
            px: px,
            realNm: nm,
            predictedNm: predictedNm,
            delta: -delta
        });
    }
    divergencePoints.sort((a, b) => a.px - b.px);
}

window.addEventListener("resize", () => {
    resizeCanvasToDisplaySize(graphCtxCalibration, graphCanvasCalibration, "Calibration");
    resizeCanvasToDisplaySize(graphCtxDivergence, graphCanvasDivergence, "Divergence");
    changeStripeWidth(0);
});

initializeCalibration();
drawGridCalibration();
drawGridDivergence();