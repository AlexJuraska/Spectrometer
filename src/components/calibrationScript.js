const minInputBoxNumber = 2
const maxInputBoxNumber = 15

const rangeBeginX = 0;
const rangeEndX = 1280;
const rangeBeginY = 350;
const rangeEndY = 1000;

let inputBoxCounter = minInputBoxNumber;
let polyFitCoefficientsArray = [];
let calibrationData = [];
let pixelCalPoints = [];
let nmCalPoints = [];
let nMAxis = []

let graphCanvasCalibration;
let graphCtxCalibration;

let previousFileName = null;

/**
 *Adds a pair of input boxes
 */
function addInputPair() {

    if (inputBoxCounter === maxInputBoxNumber) {
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

    // Append everything to the div
    div.appendChild(pointLabel);
    div.appendChild(inputPx);
    div.appendChild(inputNm);
    div.appendChild(deleteButton);

    // Append the div to the container
    container.appendChild(div);

    // Sets the labels for the new pair
    updateTextContent();

    if (inputBoxCounter > minInputBoxNumber) {
        enablePairRemoveButtons();
    }
}

function removeInputPair(inputBoxNumber) {
    if (inputBoxNumber > maxInputBoxNumber || inputBoxNumber < 1) {
        return;
    }

    if (inputBoxNumber > inputBoxCounter) {
        return;
    }

    if (inputBoxCounter === minInputBoxNumber) {
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
 * Removes one pair of input boxes
 */
function removeLastInputPair() {
    const inputContainer = document.getElementById("input-container");
    if (inputContainer.children.length > minInputBoxNumber) {
        const lastInputPair = inputContainer.lastElementChild;
        inputContainer.removeChild(lastInputPair); // Remove the last input pair
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
        pxInput.value = ""; // Set px value
        nmInput.value = ""; // Set nm value
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

function disablePairRemoveButtons() {
    for (let i = 1; i <= inputBoxCounter; i++) {
        const button = document.getElementById(`deleteButton${i}`);
        button.disabled = true;
    }
}

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
    resetCalValues(); // resets the content of arrays before saving new calibration points
    for (let i = 1; i < inputBoxCounter + 1; i++) {
        const pxInput = document.getElementById(`point${i}px`);
        const nmInput = document.getElementById(`point${i}nm`);

        // Ensure both inputs exist before trying to get their values
        if (pxInput && nmInput) {
            const rawPx = pxInput.value.trim();
            const rawNm = nmInput.value.trim();

            const pxValue = parseFloat(rawPx);
            const nmValue = parseFloat(rawNm);

            if (!isNaN(pxValue) &&
                !isNaN(nmValue)
            ) {
                calibrationData.push({ px: pxValue, nm: nmValue });
            } else {
                resetCalValues();
                callError("notEnoughCalPointsError");
                return;
            }
        }
    }

    if (calibrationData.length < minInputBoxNumber) {
        resetCalValues();
        callError("notEnoughCalPointsError");
        return;
    }

    calibrate();
    clearGraph(graphCtxCalibration, graphCanvasCalibration);
    drawGridCalibration();
    drawCalibrationLine();
    drawCalibrationPoints();
}

/**
 * Creates an array of coefficients with the help of the Polynomial Regression located in polynomialReggressionScript.js
 */
function calibrate() {
    for (let i = 0; i < calibrationData.length; i++) {
        const point = calibrationData[i];
        pixelCalPoints.push(point.px);
        nmCalPoints.push(point.nm);
    }
    const polyfit = new Polyfit(pixelCalPoints, nmCalPoints);

    const degree = Math.min(minInputBoxNumber - 1, nmCalPoints.length - 1)

    polyFitCoefficientsArray = polyfit.computeCoefficients(degree)

    // if (nmCalPoints.length === 3) {
    //     polyFitCoefficientsArray = polyfit.computeCoefficients(2);
    // }
    // else if (nmCalPoints.length > 3) {
    //     polyFitCoefficientsArray = polyfit.computeCoefficients(3);
    // }
}

// TODO zmeniť na bool ktory sa setne pri kalibracii
function isCalibrated() {
    return calibrationData.length !== 0;
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
            waveLength += number * Math.pow(pixel, i); // Calculate each term: coefficient * (pixel^i)
        }
    }
    return waveLength;
}

/**
 * deletes the content of polyFitCoefficientsArray, calibrationData, pixelCalPoints, nmCalPoints before saving new values
 */
function resetCalValues() {
    polyFitCoefficientsArray = [];
    calibrationData = [];
    pixelCalPoints = [];
    nmCalPoints = [];
    nMAxis = [];

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
    const filename = filenameInput !== "" ? filenameInput : "calibration_points.txt";

    const finalFilename = filename.endsWith(".txt") ? filename : filename + ".txt";

    const lines = calibrationData.map(point => `${point.px};${point.nm}`).join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Temporary <a> element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();

    // Clean up by revoking the Object URL and removing the element
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Lets the user choose a file and then automatically fill out input boxes with the calibration points from the file
 */
function importCalibrationFile() {

    const fileInput = document.getElementById("my-file");
    const file = fileInput.files[0]; // Get the selected file

    if (!file) {
        return;
    }

    resetInputBoxes();

    const reader = new FileReader();

    const validFormatRegex = /^(\d+(?:[.,]\d+)?);(\d+(?:[.,]\d+)?)(?:\n|$)/;

    //reading the content of the file
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
    };

    reader.readAsText(file);
}

/**
 * Converts the Px Axis into Nm using with the help of the calibration points
 * @returns {*[]}
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
        const px = i + 1; // pixel positions are 1-based
        const nm = nMAxis[i];

        // Scale coordinates to fit the canvas
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
 * Returns a function made from arrX and arrY points
 * @param arrX represents the x value for each point
 * @param arrY represents the y value for each point
 * @returns {function(*): number}
 */
function lagrangeInterpolation(arrX, arrY) {
    return function(x) {
        let result = 0;

        for (let i = 0; i < arrX.length; i++) {
            let term = arrY[i];
            for (let j = 0; j < arrX.length; j++) {
                if (i !== j) {
                    term *= (x - arrX[j]) / (arrX[i] - arrX[j]);
                }
            }
            result += term;
        }
        return result;
    };
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

        // Draw point
        graphCtxCalibration.fillStyle = 'red';
        graphCtxCalibration.strokeStyle = 'red';
        graphCtxCalibration.beginPath();
        graphCtxCalibration.arc(x, y, 4, 0, 2 * Math.PI);
        graphCtxCalibration.fill();
        graphCtxCalibration.stroke();
    }
}

window.addEventListener("resize", () => {
    resizeCanvasToDisplaySize(graphCtxCalibration, graphCanvasCalibration, "Calibration");
    changeStripeWidth(0);
});

drawGridCalibration();