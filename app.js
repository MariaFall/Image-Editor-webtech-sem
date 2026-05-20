// app.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("image-form");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const resetButton = document.getElementById("reset-button");
    const fileInput = document.getElementById("image-upload");

    let originalImage = null;
    const worker = new Worker("worker.js");

    worker.onmessage = function(e) {
        ctx.putImageData(e.data.imageData, 0, 0);
    };

    fileInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            originalImage = new Image();
            originalImage.onload = function() {
                canvas.style.display = "block";
                processImage();
            };
            originalImage.src = url;
        }
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        processImage();
    });

    resetButton.addEventListener("click", function() {
        form.reset();
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

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (brightness !== 0) {
                data[i] = Math.min(255, Math.max(0, data[i] + brightness * 2.55));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 2.55));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 2.55));
            }

            if (solarization) {
                data[i] = data[i] > 128 ? 255 - data[i] : data[i];
                data[i + 1] = data[i + 1] > 128 ? 255 - data[i + 1] : data[i + 1];
                data[i + 2] = data[i + 2] > 128 ? 255 - data[i + 2] : data[i + 2];
            }

            if (negativeType === "color") {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            } else if (negativeType === "bw") {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const neg = 255 - gray;
                data[i] = neg;
                data[i + 1] = neg;
                data[i + 2] = neg;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        if (edgeDetection !== "none") {
            worker.postMessage({
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                width: canvas.width,
                height: canvas.height,
                method: edgeDetection
            });
        }
    }
});
