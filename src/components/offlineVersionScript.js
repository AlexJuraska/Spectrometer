const OFFLINE = false;

function attachDownload(button, content, filename) {
    button.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = content;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

const downloadWrapper = document.getElementById('downloadWrapper');
const toggleButton = document.getElementById('toggleDownload');


if (OFFLINE) {
    if (downloadWrapper && downloadWrapper.parentNode) {
        downloadWrapper.parentNode.removeChild(downloadWrapper);
    }

    if (toggleButton && toggleButton.parentNode) {
        toggleButton.parentNode.removeChild(toggleButton);
    }
} else {
    toggleButton.addEventListener('click', () => {
        downloadWrapper.classList.toggle('active');
    });

    const offWinButton = document.getElementById('offWinButton');
    const offMacButton = document.getElementById('offMacButton');
    const offLinButton = document.getElementById('offLinButton');

    attachDownload(offWinButton, "../../offline/Spectra Web.exe", "Spectra Web.exe");
    attachDownload(offMacButton, "../../offline/Spectra Web.zip", "Spectra Web.zip");
}

