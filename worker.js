self.onmessage = function(e) {
    const imageData = e.data.imageData;
    const width = e.data.width;
    const height = e.data.height;
    const method = e.data.method;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);

    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i/4] = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
    }

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    const laplacian = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    const prewittX = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
    const prewittY = [-1, -1, -1, 0, 0, 0, 1, 1, 1];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let px = 0;
            let py = 0;
            let val = 0;

            if (method === 'sobel') {
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = grayscale[(y + ky) * width + (x + kx)];
                        const weightX = sobelX[(ky + 1) * 3 + (kx + 1)];
                        const weightY = sobelY[(ky + 1) * 3 + (kx + 1)];
                        px += pixel * weightX;
                        py += pixel * weightY;
                    }
                }
                val = Math.sqrt(px * px + py * py);
            } else if (method === 'laplacian') {
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = grayscale[(y + ky) * width + (x + kx)];
                        const weight = laplacian[(ky + 1) * 3 + (kx + 1)];
                        val += pixel * weight;
                    }
                }
                val = Math.abs(val);
            } else if (method === 'prewitt') {
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = grayscale[(y + ky) * width + (x + kx)];
                        const weightX = prewittX[(ky + 1) * 3 + (kx + 1)];
                        const weightY = prewittY[(ky + 1) * 3 + (kx + 1)];
                        px += pixel * weightX;
                        py += pixel * weightY;
                    }
                }
                val = Math.sqrt(px * px + py * py);
            }

            const outIdx = (y * width + x) * 4;
            output[outIdx] = val;
            output[outIdx + 1] = val;
            output[outIdx + 2] = val;
            output[outIdx + 3] = 255;
        }
    }

    for (let i = 0; i < output.length; i += 4) {
        if (output[i+3] === 0) {
            output[i] = data[i];
            output[i+1] = data[i+1];
            output[i+2] = data[i+2];
            output[i+3] = 255;
        }
    }

    self.postMessage({ imageData: new ImageData(output, width, height) });
};
