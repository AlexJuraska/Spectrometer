/**
 * Adds a reference line to the graph
 */
function addReferenceLine() {
    captureReferenceGraph = true;
    redrawGraphIfLoadedImage();
}

/**
 * Removes all reference lines and adds a new reference line
 */
function removeReferenceLinesAndAddNewReferenceLine() {
    referenceGraph = [];
    addReferenceLine();
}

/**
 * Opens a dialog to input an .xlsx file with data, adds the data as a reference line
 */
function addReferenceLineFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".xlsx";

    input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const array = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                let pixelWidth = 1280;
                let pixels = [];
                for (let i = 1; i < array.length; i++) {
                    if (i === array.length - 1) {
                        pixelWidth = array[i][0] + 1;
                    }
                    pixels.push(...[array[i][2], array[i][3], array[i][4], 0]);
                }

                referenceGraph.push([pixels, pixelWidth, minValue, calculateMaxValue(pixels)]);
            }
            reader.readAsArrayBuffer(file);
        }
    })

    input.click()
}