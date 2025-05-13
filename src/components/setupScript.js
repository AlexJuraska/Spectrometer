
let currentStep = 2;

/**
 * Changes the step in the stepper
 * @param direction -1 = previous, 1 = next
 */
function changeStep(direction) {

    document.getElementById(`step${currentStep}`).classList.remove('active');   //Remove the previous step
    currentStep += direction;   // Add the following step
    document.getElementById(`step${currentStep}`).classList.add('active');  //Add the current step

    if (currentStep === 2) {
        document.getElementById('prevButton').disabled = false;
        document.getElementById('nextButton').disabled = true;
        drawGridCalibration();
    } else if (currentStep === 3) {
        document.getElementById('stepper-buttons').classList.add('disabled');
        getCameras();
    }
}