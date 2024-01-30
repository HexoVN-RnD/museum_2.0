let mobileNetStyleModel;
let inceptionStyleModel;
let originalTransformerModel;
let separableTransformerModel;

const camModal = new bootstrap.Modal(document.getElementById('webcamModal'));
const imgModal = new bootstrap.Modal(document.getElementById('imageModal'));
const outModal = new bootstrap.Modal(document.getElementById('outputModal'));
const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
const loadingScreen = document.getElementById('loading-screen');
const errorText = document.getElementById('error-message-text');

// Define the style options
const styleOptions = [
    { name: 'Select from file' },
    { name: 'Style 1', src: 'style1.jpg' },
    { name: 'Style 2', src: 'style2.jpg' },
    { name: 'Style 3', src: 'style3.jpg' },
    { name: 'Style 4', src: 'style4.jpg' },
    { name: 'Style 5', src: 'style5.jpg' },
    { name: 'Style 6', src: 'style6.jpg' },
];

// Get the dropdown and the style image element
const styleDropdown = document.getElementById('styleDropdown');
const styleImage = document.getElementById('style-image');
const fileInput = document.getElementById('file-input');
const dropdownStyleButton = document.getElementById('dropdownMenuStyleButton');

// Get the input elements and the span elements
const styleImageSizeInput = document.getElementById('style-image-size');
const styleImageSizeValue = document.getElementById('style-image-size-value');

const outputImageSizeInput = document.getElementById('output-image-size');
const outputImageSizeValue = document.getElementById('output-image-size-value');

const styleStrengthInput = document.getElementById('style-strength');
const styleStrengthValue = document.getElementById('style-strength-value');

const imageDownloadButton = document.getElementById('img-download-button');
const outputDownloadButton = document.getElementById('output-download-button');

// Set the initial values
styleImageSizeValue.textContent = styleImageSizeInput.value;
outputImageSizeValue.textContent = outputImageSizeInput.value;
styleStrengthValue.textContent = styleStrengthInput.value;

async function loadModels() {
    try {
        loadingScreen.style.display = 'flex';
        console.log('Loading models..');

        mobileNetStyleModel = await tf.loadGraphModel('model_inception_lite/model.json');
        console.log('MobileNet Style Model loaded.');

        // inceptionStyleModel = await tf.loadGraphModel('model_inception/model.json');
        // console.log('Inception Style Model loaded.');

        // originalTransformerModel = await tf.loadGraphModel('model_transformer/model.json');
        // console.log('Original Transformer Model loaded.');

        separableTransformerModel = await tf.loadGraphModel('model_transformer_lite/model.json');
        console.log('Separable Transformer Model loaded.');
        loadingScreen.style.display = 'none';
    } catch (error) {
        console.error('Error during style transfer:', error);
        // Display an error message to the user
        errorText.textContent = 'Cannot load the models. Please try refreshing the page.';
        loadingScreen.style.display = 'none';
        errorModal.show();
    }
}


function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function downloadImage(elementId) {
    const capturedImage = document.getElementById(elementId);
    const a = document.createElement('a');
    a.href = capturedImage.src;
    const date = new Date();
    const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const [{ value: month }, , { value: day }, , { value: year }, , { value: hour }, , { value: minute }, , { value: second }] = dateTimeFormat.formatToParts(date);
    a.download = `${year}${month}${day}_${hour}${minute}${second}.png`;
    a.click();
}

async function shareImage(elementId) {
    const capturedImage = document.getElementById(elementId);
    const blob = await fetch(capturedImage.src).then(r => r.blob());
    const date = new Date();
    const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const [{ value: month }, , { value: day }, , { value: year }, , { value: hour }, , { value: minute }, , { value: second }] = dateTimeFormat.formatToParts(date);
    const filename = `${year}${month}${day}_${hour}${minute}${second}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const filesArray = [file];

    if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        try {
            await navigator.share({
                files: filesArray,
                title: 'Image',
                text: 'Share your image',
            });
            console.log('Image shared successfully');
        } catch (error) {
            console.error(`Error sharing image: ${error.message}`);
        }
    } else {
        console.error("Your system doesn't support sharing files.");
    }
}

loadModels();

window.onload = function () {
    if (isIOS()) {
        imageDownloadButton.textContent = 'Share';
        outputDownloadButton.textContent = 'Share';
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const dropdown = document.getElementById('cameraDropdown');
    const dropdownButton = document.getElementById('dropdownMenuButton');
    videoDevices.forEach((device, i) => {
        const option = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = '#';
        link.dataset.deviceId = device.deviceId;
        link.textContent = device.label || `Camera ${i + 1}`;
        link.addEventListener('click', function () {
            dropdownButton.textContent = this.textContent;
            document.querySelector('.dropdown-item.active')?.classList.remove('active');
            this.classList.add('active');
        });
        option.appendChild(link);
        dropdown.appendChild(option);
    });
    camModal.show();
    // errorModal.show(); // Debug
});

// Add the options to the dropdown
for (const option of styleOptions) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'dropdown-item text-white';
    a.href = '#';
    a.textContent = option.name;
    a.addEventListener('click', function (event) {
        event.preventDefault();
        if (option.name === 'Select from file') {
            // Trigger the file input when the "Select from file" option is selected
            fileInput.click();
        } else {
            // Change the source of the style image when the option is selected
            styleImage.src = option.src;
            // Change the dropdown button text to the name of the current style
            dropdownStyleButton.textContent = option.name;
        }
    });
    li.appendChild(a);
    styleDropdown.appendChild(li);
}

// Change the source of the style image when a file is selected
fileInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            styleImage.src = e.target.result;
            // Change the dropdown button text to "Custom" when a file is selected
            dropdownStyleButton.textContent = 'Custom style';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

document.querySelector('.modal-footer .btn-primary').addEventListener('click', async () => {
    const selectedOption = document.querySelector('.dropdown-item.active');
    const error = document.getElementById('cameraError');
    if (!selectedOption) {
        error.textContent = 'Please select a camera';
        error.style.color = 'red';
        error.style.display = 'block';
        return;
    }
    goFullScreen();
    error.style.display = 'none';
    const deviceId = selectedOption.dataset.deviceId;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
    const webcam = document.getElementById('webcam-video');
    webcam.srcObject = stream;
    await webcam.play();
    webcam.style.display = 'block'; // Show the video element
    const canvas = document.getElementById('canvas');

    webcam.addEventListener('click', () => {
        canvas.width = webcam.videoWidth;
        canvas.height = webcam.videoHeight;
        canvas.getContext('2d').drawImage(webcam, 0, 0);
        document.getElementById('captured-image').src = canvas.toDataURL('image/png');
        imgModal.show();
    });
    camModal.hide();
});

document.getElementById('webcam-button').addEventListener('click', () => {
    camModal.show();
});

// Add an input event listener to each input element
styleImageSizeInput.addEventListener('input', function () {
    styleImageSizeValue.textContent = this.value;
});

outputImageSizeInput.addEventListener('input', function () {
    outputImageSizeValue.textContent = this.value;
});

styleStrengthInput.addEventListener('input', function () {
    styleStrengthValue.textContent = this.value;
});

imageDownloadButton.addEventListener('click', () => {
    if (!isIOS()) {
        downloadImage('captured-image');
    }
    else {
        shareImage('captured-image');
        console.log('ios device detected');
    }
});

outputDownloadButton.addEventListener('click', () => {
    if (!isIOS()) {
        downloadImage('output-image');
    }
    else {
        shareImage('output-image');
        console.log('ios device detected');
    }
});

document.getElementById('transfer-button').addEventListener('click', async () => {
    try {
        loadingScreen.style.display = 'flex';
        const imgElement = document.getElementById('captured-image');

        // Resize the content image
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = outputImageSizeInput.value;
        console.log(canvas.width);
        canvas.height = imgElement.height * (canvas.width / imgElement.width);
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        let resizedImageElement = document.createElement('img');
        resizedImageElement.src = canvas.toDataURL();
        let img = await new Promise((resolve) => {
            resizedImageElement.onload = () => {
                resolve(tf.browser.fromPixels(resizedImageElement));
            };
        });

        // Wait for the image to load
        await new Promise((resolve) => {
            if (styleImage.complete) {
                resolve();
            } else {
                styleImage.onload = resolve;
            }
        });

        // Resize the style image
        let styleCanvas = document.createElement('canvas');
        let styleCtx = styleCanvas.getContext('2d');
        styleCanvas.width = styleImageSizeInput.value;
        console.log(styleCanvas.width);
        styleCanvas.height = styleImage.height * (300 / styleImage.width);
        styleCtx.drawImage(styleImage, 0, 0, styleCanvas.width, styleCanvas.height);
        let resizedStyleImageElement = document.createElement('img');
        resizedStyleImageElement.src = styleCanvas.toDataURL();
        let styleImg = await new Promise((resolve) => {
            resizedStyleImageElement.onload = () => {
                resolve(tf.browser.fromPixels(resizedStyleImageElement));
            };
        });


        // Select the style prediction model
        let styleModel;
        switch ('mobileNetStyleModel') {
            case 'mobileNetStyleModel':
                styleModel = mobileNetStyleModel;
                break;
            case 'inceptionStyleModel':
                styleModel = inceptionStyleModel;
                break;
            default:
                console.log('Invalid style model name');
                return;
        }

        // Select the style transfer model
        let transferModel;
        switch ('separableTransformerModel') {
            case 'separableTransformerModel':
                transferModel = separableTransformerModel;
                break;
            case 'originalTransformerModel':
                transferModel = originalTransformerModel;
                break;
            default:
                console.log('Invalid transfer model name');
                return;
        }

        // Extract the style of the style image
        const styleBottleneck = tf.tidy(() => styleModel.predict(styleImg.toFloat().div(tf.scalar(255)).expandDims()));

        // Adjust the style strength
        const styleRatio = styleStrengthInput.value / 100;
        let adjustedBottleneck;
        if (styleRatio !== 1.0) {
            const identityBottleneck = tf.tidy(() => styleModel.predict(img.toFloat().div(tf.scalar(255)).expandDims()));
            adjustedBottleneck = tf.tidy(() => {
                const styleBottleneckScaled = styleBottleneck.mul(tf.scalar(styleRatio));
                const identityBottleneckScaled = identityBottleneck.mul(tf.scalar(1.0 - styleRatio));
                return styleBottleneckScaled.add(identityBottleneckScaled);
            });
            styleBottleneck.dispose();
            identityBottleneck.dispose();
        } else {
            adjustedBottleneck = styleBottleneck;
        }

        // Apply the style to the content image
        const resultImg = tf.tidy(() => transferModel.predict([img.toFloat().div(tf.scalar(255)).expandDims(), adjustedBottleneck]).squeeze().mul(255).cast('int32'));

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = img.shape[1];
        outputCanvas.height = img.shape[0];
        await tf.browser.toPixels(resultImg, outputCanvas);

        // Show the result
        document.getElementById('output-image').src = outputCanvas.toDataURL('image/png');
        outModal.show();
        imgModal.hide();
        loadingScreen.style.display = 'none';

        // Dispose tensors
        img.dispose();
        styleImg.dispose();
        adjustedBottleneck.dispose();
        resultImg.dispose();

    } catch (error) {
        console.error('Error during style transfer:', error);
        // Display an error message to the user
        errorText.textContent = 'The image size is too large for the current device to handle. Please try reducing the style image or output image size.';
        loadingScreen.style.display = 'none';
        errorModal.show();
    }
});

document.getElementById('qr-button').addEventListener('click', () => {
    qrModal.show();
});

document.getElementById('image-settings-button').addEventListener('click', () => {
    settingsModal.show();
});

function goFullScreen() {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}
