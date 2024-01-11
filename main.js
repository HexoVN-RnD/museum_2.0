let mobileNetStyleModel;
let inceptionStyleModel;
let originalTransformerModel;
let separableTransformerModel;

async function loadModels() {
    console.log('Loading models..');

    mobileNetStyleModel = await tf.loadGraphModel('model_inception_lite/model.json');
    console.log('MobileNet Style Model loaded.');

    inceptionStyleModel = await tf.loadGraphModel('model_inception/model.json');
    console.log('Inception Style Model loaded.');

    originalTransformerModel = await tf.loadGraphModel('model_transformer/model.json');
    console.log('Original Transformer Model loaded.');

    separableTransformerModel = await tf.loadGraphModel('model_transformer_lite/model.json');
    console.log('Separable Transformer Model loaded.');
}

loadModels();

const modal = new bootstrap.Modal(document.getElementById('webcamModal'));

document.addEventListener('DOMContentLoaded', async function() {
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
        link.addEventListener('click', function() {
            dropdownButton.textContent = this.textContent;
            document.querySelector('.dropdown-item.active')?.classList.remove('active');
            this.classList.add('active');
        });
        option.appendChild(link);
        dropdown.appendChild(option);
    });
    modal.show();
});

document.querySelector('.modal-footer .btn-primary').addEventListener('click', async () => {
    const selectedOption = document.querySelector('.dropdown-item.active');
    const deviceId = selectedOption.dataset.deviceId;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
    const webcam = document.createElement('video');
    webcam.srcObject = stream;
    await webcam.play();
    document.getElementById('webcam-container').appendChild(webcam);
    const canvas = document.getElementById('canvas');
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    webcam.addEventListener('click', () => {
        canvas.getContext('2d').drawImage(webcam, 0, 0);
        document.getElementById('captured-image').src = canvas.toDataURL('image/png');
        document.getElementById('transfer-button').classList.remove('d-none');
    });
    modal.hide();
});

document.getElementById('webcam-button').addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const webcam = document.createElement('video');
    webcam.srcObject = stream;
    await webcam.play();
    document.getElementById('webcam-container').appendChild(webcam);
    const canvas = document.getElementById('canvas');
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    webcam.addEventListener('click', () => {
        canvas.getContext('2d').drawImage(webcam, 0, 0);
        document.getElementById('captured-image').src = canvas.toDataURL('image/png');
        document.getElementById('transfer-button').classList.remove('d-none');
    });
});

document.getElementById('transfer-button').addEventListener('click', async () => {
    const imgElement = document.getElementById('captured-image');

    // Resize the content image
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = 300;  // Set this to the desired width
    canvas.height = imgElement.height * (300 / imgElement.width);  // Calculate the height to maintain aspect ratio
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    let resizedImageElement = document.createElement('img');
    resizedImageElement.src = canvas.toDataURL();
    let img = await new Promise((resolve) => {
        resizedImageElement.onload = () => {
            resolve(tf.browser.fromPixels(resizedImageElement));
        };
    });

    // Load the style image
    const styleImageElement = document.createElement('img');
    styleImageElement.src = 'style.jpg';  // Path to your style image
    await new Promise((resolve) => {
        styleImageElement.onload = resolve;
    });

    // Resize the style image
    let styleCanvas = document.createElement('canvas');
    let styleCtx = styleCanvas.getContext('2d');
    styleCanvas.width = 300;  // Set this to the desired width
    styleCanvas.height = styleImageElement.height * (300 / styleImageElement.width);  // Calculate the height to maintain aspect ratio
    styleCtx.drawImage(styleImageElement, 0, 0, styleCanvas.width, styleCanvas.height);
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
    const styleRatio = 0.5;  // Set this to the desired style strength
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
    document.getElementById('output-image').src = outputCanvas.toDataURL('image/png');

    // Dispose tensors
    img.dispose();
    styleImg.dispose();
    adjustedBottleneck.dispose();
    resultImg.dispose();
});
