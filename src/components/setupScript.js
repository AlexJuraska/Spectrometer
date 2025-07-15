/**
 * Changes the active settings screen on the sidebar
 */
function changeSettingsScreen(changeTo) {
    const show = (id, display = 'block') => document.getElementById(id).style.display = display;
    const hide = (id) => show(id, 'none');

    const hideAll = () => {
        hide('graphWindowContainer');
        hide('calibrationWindowContainer');
        hide('calibrationSettings');
        hide('cameraSettingsWindow');
        hide('videoMainWindow');
        hide('cameraExposureWindow');
        hide('changeToCalibrationButton');
        hide('changeFromCalibrationButton');
        hide('changeToLongExpoButton');
        hide('changeFromLongExpoButton');
    };

    hideAll();

    if (changeTo === "Graph") {
        show('graphWindowContainer');
        show('cameraSettingsWindow');
        show('videoMainWindow');
        show('changeToCalibrationButton');
        show('changeToLongExpoButton');

        changeDisplayScreen('main');
        changeDisplayScreen('settings');
        changeDisplayScreen('graph');
    } else if (changeTo === "Calibration") {
        show('calibrationWindowContainer');
        show('calibrationSettings', 'flex');
        show('changeFromCalibrationButton');
        show('changeToLongExpoButton');

        changeDisplayScreen('main');
        changeDisplayScreen('settings');

        resizeCanvasToDisplaySize(graphCtxCalibration, graphCanvasCalibration, "Calibration");
    } else if (changeTo === "LongExpo") {
        show('graphWindowContainer');
        show('videoMainWindow');
        show('cameraExposureWindow');
        show('changeToCalibrationButton');
        show('changeFromLongExpoButton');

        changeDisplayScreen('main');
        changeDisplayScreen('settings');
        changeDisplayScreen('graph');
    }
}

/**
 * Changes which sections are displayed on the main screen
 */
function changeDisplayScreen(action) {
    const bottomDrawer = document.getElementById('graphSettingsDrawer');

    const settings = document.getElementById('sidebar-left');
    const leftHandle = document.getElementById('sidebarToggleHandleLeft');
    const leftDetectionArea = document.getElementById('sidebarHoverZoneLeft');

    const imageSelection = document.getElementById('sidebar-right')
    const rightHandle = document.getElementById('sidebarToggleHandleRight');
    const rightDetectionArea = document.getElementById('sidebarHoverZoneRight');

    if (action === "main") {
        imageSelection.classList.add('hidden');
        settings.classList.add('hidden');
        bottomDrawer.classList.add('hidden');

        leftHandle.classList.remove('moved');
        leftDetectionArea.classList.remove('moved');

        rightHandle.classList.remove('moved');
        rightDetectionArea.classList.remove('moved');

        document.getElementById("graphCanvas").classList.remove("withDrawer");
    } else if (action === "settings") {
        const isHidden = settings.classList.toggle('hidden');
        leftHandle.innerHTML = isHidden ? '↪' : '↩';

        leftHandle.classList.toggle('moved');
        leftDetectionArea.classList.toggle('moved');

        playVideo();
    } else if (action === "imgSelect") {
        const isHidden = imageSelection.classList.toggle('hidden');
        rightHandle.innerHTML = isHidden ? '↩' : '↪';

        rightHandle.classList.toggle('moved');
        rightDetectionArea.classList.toggle('moved');
    } else if (action === "graph") {
        document.getElementById("graphCanvas").classList.toggle("withDrawer");
        bottomDrawer.classList.toggle('hidden');
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

const handleLeft = document.getElementById('sidebarToggleHandleLeft');
const hoverZoneLeft = document.getElementById('sidebarHoverZoneLeft');

hoverZoneLeft.addEventListener('mouseenter', () => {
    handleLeft.style.opacity = '1';
    handleLeft.style.pointerEvents = 'auto';
});

handleLeft.addEventListener('mouseenter', () => {
    handleLeft.style.opacity = '1';
    handleLeft.style.pointerEvents = 'auto';
});

hoverZoneLeft.addEventListener('mouseleave', () => {
    handleLeft.style.opacity = '0';
    handleLeft.style.pointerEvents = 'none';
});

handleLeft.addEventListener('mouseleave', () => {
    handleLeft.style.opacity = '0';
    handleLeft.style.pointerEvents = 'none';
});

const handleRight = document.getElementById('sidebarToggleHandleRight');
const hoverZoneRight = document.getElementById('sidebarHoverZoneRight');

hoverZoneRight.addEventListener('mouseenter', () => {
    handleRight.style.opacity = '1';
    handleRight.style.pointerEvents = 'auto';
});

handleRight.addEventListener('mouseenter', () => {
    handleRight.style.opacity = '1';
    handleRight.style.pointerEvents = 'auto';
});

hoverZoneRight.addEventListener('mouseleave', () => {
    handleRight.style.opacity = '0';
    handleRight.style.pointerEvents = 'none';
});

handleRight.addEventListener('mouseleave', () => {
    handleRight.style.opacity = '0';
    handleRight.style.pointerEvents = 'none';
});