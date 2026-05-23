# Image Editor

A web app for image editing using basic graphic transformations and filters. The app uses web workers to calculate convolutional filters and a service worker for PWA features.

## Running the App

For the service worker to function properly, the application must be run on a local server:

1. Open a terminal in the project folder.
2. Start a local server (e.g., using Python):
   python -m http.server 8000
3. Open your browser and navigate to `http://localhost:8000`.

## Features
- Brightness adjustment, solarization, negative
- Resizing and transposition
- Edge detection (Sobel, Laplacian, Prewitt)
