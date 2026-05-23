if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("image-form");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const resetButton = document.getElementById("reset-button");
    const fileInput = document.getElementById("image-upload");
    
    const startCameraBtn = document.getElementById("start-camera");
    const cameraVideo = document.getElementById("camera-video");
    const captureFrameBtn = document.getElementById("capture-frame");

    let originalImage = null;
    let cameraStream = null;
    const worker = new Worker("worker.js");

    worker.onmessage = function(e) {
        ctx.putImageData(e.data.imageData, 0, 0);
    };

    fileInput.addEventListener("change", function(event) {
        stopCamera();
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            loadImage(url);
        }
    });

    startCameraBtn.addEventListener("click", async function() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false
            });
            cameraVideo.srcObject = cameraStream;
            cameraVideo.style.display = "block";
            captureFrameBtn.style.display = "block";
            startCameraBtn.style.display = "none";
        } catch (err) {
            alert("Nepodařilo se přistoupit k fotoaparátu: " + err.message);
        }
    });

    captureFrameBtn.addEventListener("click", function() {
        if (!cameraStream) return;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cameraVideo.videoWidth;
        tempCanvas.height = cameraVideo.videoHeight;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(cameraVideo, 0, 0, tempCanvas.width, tempCanvas.height);
        
        loadImage(tempCanvas.toDataURL("image/png"));
        stopCamera();
    });

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraVideo.style.display = "none";
        captureFrameBtn.style.display = "none";
        startCameraBtn.style.display = "block";
    }

    function loadImage(src) {
        originalImage = new Image();
        originalImage.onload = function() {
            canvas.style.display = "block";
            processImage();
        };
        originalImage.src = src;
    }

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        processImage();
    });

    resetButton.addEventListener("click", function() {
        form.reset();
        stopCamera();
        processImage();
    });

    function processImage() {
        if (!originalImage) return;

        const resizePercent = parseInt(document.getElementById("resize").value) / 100;
        const brightness = parseInt(document.getElementById("brightness").value);
        const solarization = document.getElementById("solarization").checked;
        const negativeType = document.getElementById("negative-type").value;
        const transposition = document.getElementById("transposition").value;
        const edgeDetection = document.getElementById("edge-detection").value;

        const w = originalImage.width * resizePercent;
        const h = originalImage.height * resizePercent;

        if (transposition === "rotate_90" || transposition === "rotate_270") {
            canvas.width = h;
            canvas.height = w;
        } else {
            canvas.width = w;
            canvas.height = h;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        let cssFilters = [];
        if (brightness !== 0) {
            cssFilters.push(`brightness(${100 + brightness}%)`);
        }
        if (negativeType === "color") {
            cssFilters.push(`invert(100%)`);
        } else if (negativeType === "bw") {
            cssFilters.push(`grayscale(100%) invert(100%)`);
        }

        if (cssFilters.length > 0) {
            ctx.filter = cssFilters.join(' ');
        }

        if (transposition === "flip_lr") {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        } else if (transposition === "flip_tb") {
            ctx.translate(0, h);
            ctx.scale(1, -1);
        } else if (transposition === "rotate_90") {
            ctx.translate(h, 0);
            ctx.rotate(90 * Math.PI / 180);
        } else if (transposition === "rotate_180") {
            ctx.translate(w, h);
            ctx.rotate(180 * Math.PI / 180);
        } else if (transposition === "rotate_270") {
            ctx.translate(0, w);
            ctx.rotate(270 * Math.PI / 180);
        }

        ctx.drawImage(originalImage, 0, 0, w, h);
        ctx.restore();

        if (solarization || edgeDetection !== "none") {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            if (solarization) {
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = data[i] > 128 ? 255 - data[i] : data[i];
                    data[i + 1] = data[i + 1] > 128 ? 255 - data[i + 1] : data[i + 1];
                    data[i + 2] = data[i + 2] > 128 ? 255 - data[i + 2] : data[i + 2];
                }
                ctx.putImageData(imageData, 0, 0);
            }

            if (edgeDetection !== "none") {
                worker.postMessage({
                    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                    width: canvas.width,
                    height: canvas.height,
                    method: edgeDetection
                });
            }
        }
    }
});
