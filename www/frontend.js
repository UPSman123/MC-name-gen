let requestNr = 0;
let openRequests = [];
const sock = new WebSocket(`ws://${window.location.host}/ws`);

const stringToIgns = string => {
    return string.split(/[\s,]+/).filter(Boolean);
};

class Request {
    constructor(igns) {
        this.requestNr = requestNr++;
        this.igns = igns;
    }

    send() {
        sock.send(JSON.stringify({
            requestType: 'check igns',
            requestNr: this.requestNr,
            igns: this.igns,
        }));
    }
}

const handleGoClick = async () => {
    console.log('clicked');
    // Get the user given names.
    const inputElem = document.getElementById('input-ign');
    const inputIgns = stringToIgns(inputElem.value);

    // Send a request to test all names.
    const request = new Request(inputIgns);
    openRequests.push(request);
    request.send();
}

// After the server is done checking the names it sends back the results.
// These are handled here.
const handleServerResponse = async (e) => {
    // Retrieve data from response
    const response = JSON.parse(e.data);
    const requestIdx = openRequests.findIndex(req => req.requestNr === response.requestNr);
    if (requestIdx === -1) {
        // Request has already been handled.
        console.error(`request already handled. ${response.requestNr}`);
        return;
    }
    const request = openRequests.splice(requestIdx, 1)[0];

    // Remove processed igns from input.
    const inputTextElem = document.getElementById('input-ign');
    console.log(response);
    const notificationField = document.getElementById('notification-field');
    if (request.igns.length === response.processed.length) {
        // All igns were processed so the entire input can be cleared.
        inputTextElem.value = '';
        // Remove any warnings.
        notificationField.style.display = 'none';
    } else {
        // Some igns have not been processed and should not be cleared.
        const newIgns = request.igns.filter(requestIgn => !response.processed.includes(requestIgn));
        inputTextElem.value = newIgns.join('\n');
        // Notify the user.
        notificationField.innerText =
            `Mojang timeout.
Not all names were processed. The processed names have been removed from the input.`;
        notificationField.style.display='';

        // Give alert when Mojang timeout is over.
        setTimeout(() => alert('Mojang timeout is over'), 10 * 60 * 1000);
    }

    // Display available names to the user.
    const outputTextElem = document.getElementById('output-ign');
    outputTextElem.value = response.available.join('\n');
    const outputDivElem = document.getElementById('output-div');
    outputDivElem.style.display = '';
}

const handleCopyClick = () => {
    const outputElem = document.getElementById('output-ign');
    outputElem.select();
}

const handleDrop = (e, textArea) => {
    e.stopPropagation();
    e.preventDefault();

    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length !== 1) alert('You have to insert exactly 1 file.');
    const file = files[0];

    file.text()
        .then(text => {
            const names = stringToIgns(text);
            textArea.value = names.join('\n');
        })
        .catch(err => console.error(err));
};

const stopEvent = (e) => {
    e.stopPropagation();
    e.preventDefault();
};

const onLoad = () => {
    // Setup socket to communicate with node.
    sock.addEventListener('message', e => handleServerResponse(e));

    // attach drag/drop callbacks to input-ign text area
    const textArea = document.getElementById('input-ign');
    textArea.addEventListener("dragenter", stopEvent);
    textArea.addEventListener("dragover", stopEvent);
    textArea.addEventListener("drop", e => handleDrop(e, textArea));
};

onLoad();
