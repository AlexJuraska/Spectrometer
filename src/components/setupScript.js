
let calibrationScreen = false;

function changeCalibrationScreen() {

    if (calibrationScreen) {
        document.getElementById('graphWindowContainer').style.display = 'block';
        document.getElementById('calibrationWindowContainer').style.display = 'none';
        document.getElementById('calibrationSettings').style.display = 'none';
        document.getElementById('cameraSettingsWindow').style.display = 'block';
    } else {
        document.getElementById('graphWindowContainer').style.display = 'none';
        document.getElementById('calibrationWindowContainer').style.display = 'block';
        document.getElementById('calibrationSettings').style.display = 'block';
        document.getElementById('cameraSettingsWindow').style.display = 'none';
    }

    calibrationScreen = !calibrationScreen;
}