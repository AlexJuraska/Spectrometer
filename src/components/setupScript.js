/**
 * Changes the active settings screen on the sidebar
 */
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

        changeDisplayScreen('main');
        changeDisplayScreen('settings');
        changeDisplayScreen("graph");
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

        changeDisplayScreen('main');
        changeDisplayScreen('settings');

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

        changeDisplayScreen('main');
        changeDisplayScreen('settings');
        changeDisplayScreen("graph");
    }
}

/**
 * Changes which sections are displayed on the main screen
 */
function changeDisplayScreen(action) {
    const settings = document.getElementById('sidebar');
    const drawer = document.getElementById('graphSettingsDrawer');
    const handle = document.getElementById('sidebarToggleHandle');
    const detectionArea = document.getElementById('sidebarHoverZone');

    if (action === "main") {
        settings.classList.add('hidden');
        drawer.classList.add('hidden');

        handle.classList.remove('moved');
        detectionArea.classList.remove('moved');

        document.getElementById("graphCanvas").classList.remove("withDrawer");
    } else if (action === "settings") {
        const isHidden = settings.classList.toggle('hidden');
        handle.innerHTML = isHidden ? '↪' : '↩';

        handle.classList.toggle('moved');
        detectionArea.classList.toggle('moved');
    } else if (action === "graph") {
        document.getElementById("graphCanvas").classList.toggle("withDrawer");
        drawer.classList.toggle('hidden');
    }

    document.activeElement.blur();
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

/**
 * Opens a message window
 */
function showInfoPopup(messageTranslate, buttonTranslate){
    const messageSpan = document.getElementById('infoPopupMessage');
    messageSpan.dataset.translate = messageTranslate;

    const button = document.getElementById("infoPopupButton");
    button.dataset.translate = buttonTranslate;
    updateTextContent();

    const popupWindow = document.getElementById("infoPopup");
    popupWindow.classList.add('show');

    const blocker = document.getElementById("infoPopupBlock");
    blocker.classList.add('show');
}

/**
 * Closes the message window
 */
function closeInfoPopup(){
    const popupWindow = document.getElementById("infoPopup");
    popupWindow.classList.remove('show');

    const blocker = document.getElementById("infoPopupBlock");
    blocker.classList.remove('show');
}

document.getElementById("infoPopupBlock").addEventListener("click", () => {
    if (!isRecording) {
        closeInfoPopup();
    }
})

/**
 * Opens the waiting window while the graph is being recorded
 */
function showCameraRecordingWindow(){
    const exposureWindow = document.getElementById("cameraRecordingIsOn");
    exposureWindow.classList.add('show');

    const blocker = document.getElementById("infoPopupBlock");
    blocker.classList.add('show');
}

/**
 * Closes the waiting window while the graph is being recorded
 */
function  closeCameraRecordingWindow(){
    const exposureWindow = document.getElementById("cameraRecordingIsOn");
    exposureWindow.classList.remove('show');

    const blocker = document.getElementById("infoPopupBlock");
    blocker.classList.remove('show');
}

const handle = document.getElementById('sidebarToggleHandle');
const hoverZone = document.getElementById('sidebarHoverZone');

hoverZone.addEventListener('mouseenter', () => {
    handle.style.opacity = '1';
    handle.style.pointerEvents = 'auto';
});

handle.addEventListener('mouseenter', () => {
    handle.style.opacity = '1';
    handle.style.pointerEvents = 'auto';
});

hoverZone.addEventListener('mouseleave', () => {
    handle.style.opacity = '0';
    handle.style.pointerEvents = 'none';
});

handle.addEventListener('mouseleave', () => {
    handle.style.opacity = '0';
    handle.style.pointerEvents = 'none';
});