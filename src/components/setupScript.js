
function changeSettingsScreen(changeTo) {

    if (changeTo === "Graph") {
        document.getElementById('graphWindowContainer').style.display = 'block';
        document.getElementById('calibrationWindowContainer').style.display = 'none';

        document.getElementById('calibrationSettings').style.display = 'none';
        document.getElementById('cameraSettingsWindow').style.display = 'block';
        document.getElementById('videoMainWindow').style.display = 'block';
        document.getElementById('cameraExposureWindow').style.display = 'none';

        document.getElementById('changeToCalibrationButton').style.display = 'block';
        document.getElementById('changeFromCalibrationButton').style.display = 'none';
        document.getElementById('changeToLongExpoButton').style.display = 'block';
        document.getElementById('changeFromLongExpoButton').style.display = 'none';
    } else if (changeTo === "Calibration") {
        document.getElementById('graphWindowContainer').style.display = 'none';
        document.getElementById('calibrationWindowContainer').style.display = 'block';

        document.getElementById('calibrationSettings').style.display = 'flex';
        document.getElementById('cameraSettingsWindow').style.display = 'none';
        document.getElementById('videoMainWindow').style.display = 'none';
        document.getElementById('cameraExposureWindow').style.display = 'none';

        document.getElementById('changeToCalibrationButton').style.display = 'none';
        document.getElementById('changeFromCalibrationButton').style.display = 'block';
        document.getElementById('changeToLongExpoButton').style.display = 'block';
        document.getElementById('changeFromLongExpoButton').style.display = 'none';

        resizeCanvasToDisplaySize(graphCtxCalibration, graphCanvasCalibration, "Calibration");
    } else if (changeTo === "LongExpo") {
        document.getElementById('graphWindowContainer').style.display = 'block';
        document.getElementById('calibrationWindowContainer').style.display = 'none';

        document.getElementById('calibrationSettings').style.display = 'none';
        document.getElementById('cameraSettingsWindow').style.display = 'none';
        document.getElementById('videoMainWindow').style.display = 'block';
        document.getElementById('cameraExposureWindow').style.display = 'block';

        document.getElementById('changeToCalibrationButton').style.display = 'block';
        document.getElementById('changeFromCalibrationButton').style.display = 'none';
        document.getElementById('changeToLongExpoButton').style.display = 'none';
        document.getElementById('changeFromLongExpoButton').style.display = 'block';

    }
}

function callError(errorMessageTranslate) {
    const errorMessageSpan = document.getElementById('errorMessage');
    errorMessageSpan.dataset.translate = errorMessageTranslate;
    updateTextContent();

    const box = document.getElementById("errorBox");
    box.classList.add('show');

    const blocker = document.getElementById("errorBlock");
    blocker.classList.add('show');
}

function uncallError() {
    const box = document.getElementById("errorBox");
    box.classList.remove('show');

    const blocker = document.getElementById("errorBlock");
    blocker.classList.remove('show');
}

document.getElementById("errorBlock").addEventListener("click", () => {
    uncallError();
})