/**
 * Display the camera selection above the graph
 * NOTE: This is the original version of the func, possibly may be needed for revert
 */
function showSelectedStripe() {
    const stripeCanvas = document.getElementById('stripeCanvas');
    const graphCanvas = document.getElementById('graphCanvas');
    if (!stripeCanvas || !graphCanvas) {
        console.error('stripeCanvas or graphCanvas element not found');
        return;
    }

    const stripeCtx = stripeCanvas.getContext('2d');
    if (!stripeCtx) {
        console.error('Unable to get 2D context for stripeCanvas');
        return;
    }

    const stripeWidth = getStripeWidth();
    if (typeof stripeWidth !== 'number' || stripeWidth <= 0) {
        return;
    }

    if (!videoElement || getElementWidth(videoElement) <= 0 || getElementHeight(videoElement) <= 0) {
        return;
    }

    const videoWidth = getElementWidth(videoElement);
    const stripePosition = getElementHeight(videoElement) * getYPercentage() - stripeWidth / 2;

    let zoomStart = 0;
    let zoomEnd = videoWidth;

    if (zoomList.length !== 0) {
        zoomStart = zoomList[zoomList.length - 1][0];
        zoomEnd = zoomList[zoomList.length - 1][1];
    }

    stripeCtx.drawImage(videoElement, zoomStart, stripePosition, zoomEnd - zoomStart, stripeWidth, 0, 0, stripeCanvas.width, stripeCanvas.height);
}

function showSelectedStripeNewAndRejected() {
    const stripeCanvas = document.getElementById('stripeCanvas');
    if (!stripeCanvas) {
        console.error('stripeCanvas or graphCanvas element not found');
        return;
    }

    const stripeCtx = stripeCanvas.getContext('2d');
    if (!stripeCtx) {
        console.error('Unable to get 2D context for stripeCanvas');
        return;
    }

    const stripeWidth = getStripeWidth();
    if (typeof stripeWidth !== 'number' || stripeWidth <= 0) {
        return;
    }

    if (!videoElement || getElementWidth(videoElement) <= 0 || getElementHeight(videoElement) <= 0) {
        return;
    }

    const startY = getElementHeight(videoElement) * getYPercentage() - stripeWidth / 2;
    lineCtx.drawImage(videoElement, 0, startY, getElementWidth(videoElement), stripeWidth, 0, 0, getElementWidth(videoElement), stripeWidth);

    let pixels = lineCtx.getImageData(0, 0, getElementWidth(videoElement), stripeWidth).data;
    let pixelWidth = getElementWidth(videoElement);

    if (stripeWidth > 1) {
        pixels = averagePixels(pixels, pixelWidth);
    }

    const videoWidth = getElementWidth(videoElement);

    let zoomStart = 0;
    let zoomEnd = videoWidth;

    if (zoomList.length !== 0) {
        zoomStart = zoomList[zoomList.length - 1][0];
        zoomEnd = zoomList[zoomList.length - 1][1];
    }

    const canvasWidth = stripeCanvas.width;
    const canvasHeight = stripeCanvas.height;

    const slicedPixels = pixels.slice(zoomStart * 4, zoomEnd * 4);

    for (let x = 0; x < canvasWidth; x++) {
        const pixelIndex = Math.floor((x / canvasWidth) * (zoomEnd - zoomStart));
        const { r, g, b } = getDominantColor(slicedPixels, pixelIndex);

        stripeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        stripeCtx.fillRect(x, 0, 1, canvasHeight);
    }
}

/**
 * Similar to calculateMaxColor, this function returns the maximum color of a pixel,
 * but with the other two values set to 0
 */
function getDominantColor(pixels, x) {
    const r = pixels[x * 4];
    const g = pixels[x * 4 + 1];
    const b = pixels[x * 4 + 2];

    const max = Math.max(r, g, b);

    return {
        r: r === max ? r : 0,
        g: g === max ? g : 0,
        b: b === max ? b : 0
    };
}

/**
 * Updates the stripe continuously
 */
function updateStripeContinuously() {
    showSelectedStripe();
    requestAnimationFrame(updateStripeContinuously);
}

updateStripeContinuously();