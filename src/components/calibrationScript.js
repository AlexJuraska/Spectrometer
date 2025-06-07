const minInputBoxNumber = 4
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

    // Label for the translation of "Point" and for the numbering
    const pointLabel = document.createElement("label");
    const spanLabel = document.createElement("span");
    spanLabel.setAttribute("data-translate", "point");
    pointLabel.appendChild(spanLabel);
    pointLabel.append(` ${inputBoxCounter}:`);

    // Create the first input for px with label
    const inputPx = document.createElement("input");
    inputPx.id = `point${inputBoxCounter}px`;
    inputPx.type = "number";
    inputPx.classList.add("form-control");
    inputPx.classList.add("form-control-sm");

    // Create the second input for nm with label
    const inputNm = document.createElement("input");
    inputNm.id = `point${inputBoxCounter}nm`;
    inputNm.type = "number";
    inputNm.classList.add("form-control");
    inputNm.classList.add("form-control-sm");

    // Append everything to the div
    div.appendChild(pointLabel);
    div.appendChild(inputPx);
    div.appendChild(inputNm);

    // Append the div to the container
    container.appendChild(div);

    // Sets the labels for the new pair
    updateTextContent();
}

/**
 * Removes one pair of input boxes
 */
function removeInputPair() {
    const inputContainer = document.getElementById("input-container");
    if (inputContainer.children.length > minInputBoxNumber) {
        const lastInputPair = inputContainer.lastElementChild;
        inputContainer.removeChild(lastInputPair); // Remove the last input pair
        inputBoxCounter --;
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
            removeInputPair();
        }
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

            //In case we want , and . either way

            // const isPxValid = /^\d+$/.test(rawPx);
            // const isNmValid = /^\d+([.,]\d+)?$/.test(rawNm);

            // if (!isPxValid) {
            //     resetCalValues();
            //     alert(`${rawPx} is not a valid number`)
            //     return;
            // }
            //
            // if (!isNmValid) {
            //     resetCalValues();
            //     alert(`${rawNm} is not a valid number`)
            //     return;
            // }

            const pxValue = parseFloat(rawPx);
            const nmValue = parseFloat(rawNm);

            if (!isNaN(pxValue) &&
                !isNaN(nmValue)
            ) {
                calibrationData.push({ px: pxValue, nm: nmValue });
            } else {
                resetCalValues();
                alert(`Numbers out of allowed range`);
                return;
            }
        }
    }

    if (calibrationData.length < minInputBoxNumber) {
        resetCalValues();
        window.alert("Insufficient number of calibration points");
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
}

/**
 * Exports calibration settings into a .txt file
 */
function exportCalibrationFile() {
    if (calibrationData.length === 0) {
        alert("No calibration data to export. Please calibrate first.");
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
    resetInputBoxes();

    const fileInput = document.getElementById("my-file");
    const file = fileInput.files[0]; // Get the selected file

    fileInput.value = "";

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const reader = new FileReader();

    const validFormatRegex = /^(\d+(?:[.,]\d+)?);(\d+(?:[.,]\d+)?)(?:\n|$)/;

    //reading the content of the file
    reader.onload = function(event) {
        const fileContent = event.target.result; // Get file content as text

        const lines = fileContent.trim().split("\n").map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length < minInputBoxNumber || lines.length > maxInputBoxNumber) {
            alert(`There must be between ${minInputBoxNumber} and ${maxInputBoxNumber} calibration points`);
            resetInputBoxes()
            return;
        }

        // If there are more than minInputBoxNumber lines, add extra input pairs for the additional lines
        const extraLines = lines.length - inputBoxCounter;
        for (let i = 0; i < extraLines; i++) {
            addInputPair(); // Add extra input fields dynamically
        }

        // Fills the input fields with the file content
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (!validFormatRegex.test(line)) {
                alert(`Invalid format at line ${i + 1}: "${line}"`);
                resetInputBoxes()
                return;
            }

            const [px, nm] = lines[i].split(";");

            let pxValue = px.trim().replace(',', '.');
            let nmValue = nm.trim().replace(',', '.'); // Replace comma with dot

            const pxFloat = parseFloat(pxValue);
            const nmFloat = parseFloat(nmValue);

            // if (pxValue < rangeBeginX || pxValue > rangeEndX) {
            //     alert(`Invalid px value at line ${i + 1}: "${pxValue}". It must be between ${rangeBeginX} and ${rangeEndX}.`);
            //     resetInputBoxes();
            //     return;
            // }

            // Validate nm value
            // if (nmFloat < rangeBeginY || nmFloat > rangeEndY) {
            //     alert(`Invalid nm value at line ${i + 1}: "${nmFloat}". It must be between ${rangeBeginY} and ${rangeEndY}.`);
            //     resetInputBoxes();
            //     return;
            // }

            const pxInput = document.querySelector(`#point${i+1}px`);
            const nmInput = document.querySelector(`#point${i+1}nm`);

            if (pxInput && nmInput) {
                pxInput.value = pxFloat; // Set px value
                nmInput.value = nmFloat; // Set nm value
            }
        }
    };

    reader.readAsText(file); // Read the file as text (adjust if you need other formats)
}

/**
 * Converts the Px Axis into Nm using with the help of the calibration points
 * @returns {*[]}
 */
function convertPxAxisIntoNm(){
    for (let i = 1; i <= 1920; i++) {
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

    const interpolate = lagrangeInterpolation(pixelCalPoints, nmCalPoints);

    graphCtxCalibration.beginPath();

    const stepSize = 5; // Space between plot points
    let firstPoint = true;

    for (let x = 0; x <= 1280; x += stepSize) {
        const yInterpolated = interpolate(x);

        // Scale x and y to fit within the graph dimensions
        let xScaled = padding + ((x - rangeBeginX) / (rangeEndX - rangeBeginX)) * (width - 2 * padding);
        let yScaled = height - padding - ((yInterpolated - rangeBeginY) / (rangeEndY - rangeBeginY)) * (height - 2 * padding);

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
});

drawGridCalibration();