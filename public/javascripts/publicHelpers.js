var selectedImages = [];

function applyToArray(arrayToBeAppliedTo, checkbox) {
    if (checkbox.checked == true) {
        arrayToBeAppliedTo.push(checkbox.id);
    }
    else {
        var index = arrayToBeAppliedTo.indexOf(checkbox.id);
        if (index > -1) {
            arrayToBeAppliedTo.splice(index, 1);
        }
    }

    console.log(arrayToBeAppliedTo);
}

function convertFilenameArrayToString() {
    document.getElementById('selectedImagesField').value = JSON.stringify(selectedImages);
    return true;
}