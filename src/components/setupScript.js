
let calibrationScreen = false;

function changeCalibrationScreen() {

    if (calibrationScreen) {
        document.getElementById('graphWindowContainer').style.display = 'block';
        document.getElementById('calibrationWindowContainer').style.display = 'none';
        document.getElementById('calibrationSettings').style.display = 'none';
        document.getElementById('cameraSettingsWindow').style.display = 'block';
        document.getElementById('videoMainWindow').style.display = 'block';

        document.getElementById('recordingToCalibrationButton').style.display = 'block';
        document.getElementById('calibrationToRecordingButton').style.display = 'none';
    } else {
        document.getElementById('graphWindowContainer').style.display = 'none';
        document.getElementById('calibrationWindowContainer').style.display = 'block';
        document.getElementById('calibrationSettings').style.display = 'flex';
        document.getElementById('cameraSettingsWindow').style.display = 'none';
        document.getElementById('videoMainWindow').style.display = 'none';

        document.getElementById('recordingToCalibrationButton').style.display = 'none';
        document.getElementById('calibrationToRecordingButton').style.display = 'block';
    }

    calibrationScreen = !calibrationScreen;
}