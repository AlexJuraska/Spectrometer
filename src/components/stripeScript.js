// ##################
//    Canvas/Pasik
// ##################

/**
 * Returns the width of the stripe
 * @returns {number}
 */
function getStripeWidth(){
    return stripeWidth;
}

/**
 * Returns the Y position of the stripe as a percentage. yPercentage represents the middle point of the stripe.
 * @returns {number}
 */
function getYPercentage() {
    return yPercentage;
}

/**
 * Checks whether the threshold for stripe increase has been reached
 * @param change 1 to increment, -1 to decrement or 0 to set to current slider value
 */
function changeStripeWidth(change) {
    if (![-1,0,1].includes(change)) { return; }

    const rangeInput = document.getElementById("stripeWidthRange");
    const rangeText = document.getElementById("stripeWidthValue");

    let cameraStripeWidth = parseInt(rangeInput.value) + change;

    if (!checkStripeWidthWithinRange(cameraStripeWidth)) {
        return;
    }

    rangeInput.value = cameraStripeWidth;
    rangeText.textContent = cameraStripeWidth;

    stripeWidth = calculateActualStripeWidth(cameraStripeWidth);
    updateStripeWidth();
}

/**
 * Function checks whether the newValue stripe width is within the camera range
 * @param newValue stripe width scaled to camera capabilities
 */
function checkStripeWidthWithinRange(newValue) {
    const checkUpperLimit = parseInt(newValue, 10) <= parseInt(cameraOutputHeight, 10);
    const checkBottomLimit = parseInt(newValue, 10) >= parseInt(1, 10);

    return checkUpperLimit && checkBottomLimit
}

/**
 * Calculates the width of the stripe to be displayed on the canvas element itself.
 * The returned number is rounded to a whole number.
 */
function calculateActualStripeWidth(value) {
    return parseInt(((value - 1) / (cameraOutputHeight - 1)) * (stripeGraphCanvas.height - 1) + 1);
}

/**
 * Updates the width of the stripe based on the value
 */
function updateStripeWidth() {
    var y = yPercentage * stripeGraphCanvas.height;
    if (y < stripeWidth/2){
        y = stripeWidth/2;
        yPercentage = y / stripeGraphCanvas.height;
    }
    else if (y + stripeWidth/2 > stripeGraphCanvas.height){
        y = stripeGraphCanvas.height - stripeWidth/2;
        yPercentage = y / stripeGraphCanvas.height;
    }
    drawSelectionLine();
    if (videoElement) {
        needToRecalculateMaxima = true;
        plotRGBLineFromCamera();
    }
}

/**
 * // Draws the yellow selection line knows as Stripe
 */
function drawSelectionLine() {
    stripeGraphCtx.clearRect(0, 0, stripeGraphCanvas.width, stripeGraphCanvas.height); // Clear the canvas
    stripeGraphCtx.beginPath(); // Start a new path to avoid connecting lines
    stripeGraphCtx.strokeStyle = "rgba(255, 255, 0, 0.5)"; // Set line color to yellow
    stripeGraphCtx.lineWidth = getStripeWidth();
    var y = yPercentage * stripeGraphCanvas.height; // Calculate Y-coordinate based on percentage
    stripeGraphCtx.moveTo(0, y);
    stripeGraphCtx.lineTo(stripeGraphCanvas.width, y);
    stripeGraphCtx.stroke();
}

// Canvas for the camera window
var stripeGraphCanvas = document.getElementById("cameraWindowCanvasRecording");

// Unless the Canvas is present, nothing will be done with it
var stripeGraphCtx = stripeGraphCanvas.getContext("2d", { willReadFrequently: true });
var yPercentage = 0.5; // Global variable representing Y position as a percentage (default to 50%)
var stripeWidth = 1;
var videoWindow = document.getElementById("videoMainWindow");
var computedStyle = getComputedStyle(videoWindow);

// Set the canvas width and height to match the video window
stripeGraphCanvas.width = parseInt(computedStyle.width, 10);
stripeGraphCanvas.height = parseInt(computedStyle.height, 10);

// Event listener for mouse clicks on the canvas
stripeGraphCanvas.addEventListener("click", function (event) {
    stripeGraphCanvas.height = parseInt(getComputedStyle(videoWindow).height,10);
    var rect = stripeGraphCanvas.getBoundingClientRect(); // Get canvas position
    var y = event.clientY - rect.top; // Calculate Y within canvas
    if (y < getStripeWidth()/2){
        y = getStripeWidth()/2;
    }
    else if (y + getStripeWidth()/2 > stripeGraphCanvas.height){
        y = stripeGraphCanvas.height - getStripeWidth()/2;
    }
    yPercentage = y / stripeGraphCanvas.height; // Update global variable as percentage
    drawSelectionLine(); // Redraw line at the new position
    if (videoElement) {
        needToRecalculateMaxima = true;
        plotRGBLineFromCamera();
    }
});

// Initial draw of the line at the default percentage
drawSelectionLine();