// ##################
//    Graph save
// ##################

/**
 * Saves the data
 */
function saveRecordingData() {
    saveGraphImage();
    saveCameraImage();
    saveGraphValues();
}

/**
 * Saves the numbers from the graph to a .xlsx file
 */
function saveGraphValues() {

    if (noGraphShown()) {
        return;
    }

    const stripeWidth = getStripeWidth();

    let pixels = lineCtx.getImageData(0, 0, getElementWidth(videoElement), stripeWidth).data;
    let pixelWidth = getElementWidth(videoElement);

    if (stripeWidth > 1) {
        pixels = averagePixels(pixels, pixelWidth);
    }

    let [zoomStart, zoomEnd] = getZoomRange(pixelWidth);

    if (zoomList.length !== 0 && (zoomEnd - zoomStart) >= 2) {
        pixels = pixels.slice(zoomStart * 4, zoomEnd * 4);
        pixelWidth = zoomEnd - zoomStart;
    }

    const result = [];
    // result.push([ "px", "nm", "Intensity", "R", "G", "B" ]);
    result.push([ "px", "nm", "R", "G", "B" ]);
    for (let i = 0; i < pixelWidth; i++) {
        const x = i + zoomStart;
        const nm = getWaveLengthByPx(x);
        const intensity = 0; //TODO Zistit co to ma robit
        const r = pixels[x * 4];
        const g = pixels[x * 4 + 1];
        const b = pixels[x * 4 + 2];
        // result.push([ x, nm, intensity, r, g, b ]);
        result.push([ x, nm, r, g, b ]);
    }
    const filename = "values.xlsx"

    const worksheet = XLSX.utils.aoa_to_sheet(result);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Values");
    XLSX.writeFile(workbook, filename);
}

/**
 * Saves the graph as an image
 */
function saveGraphImage(){

    if (noGraphShown()) {
        callError("noGraphSelectedError");
        return;
    }

    let wasPaused = false;
    if (videoElement instanceof HTMLImageElement){
        wasPaused = true;
    }
    else{
        if(videoElement.paused){
            wasPaused = true;
        }
        videoElement.pause();
    }

    const graphImageData = graphCanvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = graphImageData;
    link.download = 'graph.png';
    link.click();

    if (!wasPaused) {
        videoElement.play();
    }
}

/**
 * Saves the camera image as an image
 */
function saveCameraImage(){

    if (noGraphShown()) {
        return;
    }

    let wasPaused = false;
    if(videoElement.paused){
        wasPaused = true;
    }
    videoElement.pause();

    const videoCanvas = document.createElement('canvas');
    const ctx = videoCanvas.getContext('2d');
    videoCanvas.width = videoElement.videoWidth;
    videoCanvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height);
    const videoImageData = videoCanvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = videoImageData;
    link.download = 'image.png';
    link.click();

    if (!wasPaused) {
        videoElement.play();
    }
}