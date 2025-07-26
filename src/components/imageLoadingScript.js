const maxLoadableImages = 5;
let loadedImageCounter = 0;

/**
 * Adds a new div for the choice of comparison between multiple spectrums
 */
function addImageElement() {

    if (loadedImageCounter === maxLoadableImages) {
        return;
    }

    loadedImageCounter++;

    const parent = document.getElementById("sidebar-right");

    const id = loadedImageCounter;

    const wrapper = document.createElement("div");
    wrapper.classList.add("image-loaded");
    wrapper.id = `loadedImage${id}`;

    const controls = document.createElement("div");
    controls.classList.add("image-controls");

    const radioButton = document.createElement("input");
    radioButton.id = `imageRadio${id}`;
    radioButton.type = "radio";
    radioButton.onclick = function () { checkRadio(id); };

    const deleteButton = document.createElement("button");
    deleteButton.id = `imageDeleteButton${id}`;
    deleteButton.innerHTML = '&times;';
    deleteButton.classList.add("btn", "btn-sm", "btn-danger", "btn-secondary", "pb-0.5");
    deleteButton.onclick = function () { removeImageElement(id); };

    controls.appendChild(radioButton);
    controls.appendChild(deleteButton);
    wrapper.appendChild(controls);

    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("image-wrapper");

    const image = document.createElement("img");
    image.classList.add("loaded-image");
    image.src = "../../image_24-07-2025_10-33-24.png"

    imageWrapper.appendChild(image);
    wrapper.appendChild(imageWrapper);

    parent.appendChild(wrapper);
}

/**
 * Checks the wanted radio button and selects its associated image for analysis, unchecks the rest
 */
function checkRadio(radioId) {
    if (radioId > maxLoadableImages || radioId < 0) {
        return;
    }

    for (let i = 0; i <= loadedImageCounter; i++) {
        const radioButton = document.getElementById(`imageRadio${i}`);
        radioButton.checked = i === radioId;
    }

    // Functionality for radioId
}

/**
 * Removes the wanted image selection element, adjusts ids/functions on the rest
 */
function removeImageElement(loadedImageId) {
    if (loadedImageId > maxLoadableImages || loadedImageId < 1) {
        return;
    }

    adjustForRemovedId(loadedImageId);

    const parent = document.getElementById("sidebar-right");
    const element = document.getElementById(`loadedImage${loadedImageId}`);

    parent.removeChild(element);

    loadedImageCounter--;
}

/**
 * Adjusts ids/funcs for the removal of a specific selection image
 */
function adjustForRemovedId(removedId) {
    if (removedId < 1 || removedId > maxLoadableImages) {
        return;
    }

    const radioButton = document.getElementById(`imageRadio${removedId}`);
    if (radioButton.checked) {
        checkRadio(0);
    }

    for (let i = removedId+1; i <= loadedImageCounter ; i++) {
        let wrapper = document.getElementById(`loadedImage${i}`);
        wrapper.id = `loadedImage${i-1}`;

        let deleteButton = document.getElementById(`imageDeleteButton${i}`);
        deleteButton.id = `imageDeleteButton${i-1}`;
        deleteButton.onclick = function () { removeImageElement(i-1); };
    }
}

//Temporary
document.addEventListener("keydown", (event) => {
    if (event.key === "q") {
        addImageElement()
    }
});