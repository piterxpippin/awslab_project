var selectedImages = Array();

function applyToArray(checkbox) {
    if (checkbox.checked == true) {
        selectedImages.push(checkbox.id);
    }
    else {
        var index = selectedImages.indexOf(checkbox.id);
        if (index > -1) {
            selectedImages.splice(index, 1);
        }
    }

    console.log(selectedImages);
}

function convertFilenameArrayToString() {
    document.getElementById('selectedImagesField').value = JSON.stringify(selectedImages);
    return true;
}