# Image Editor (PWA)

A web application for image editing using basic graphic transformations and filters. The application uses Web Workers to calculate convolutional filters and a Service Worker for PWA features (offline access and A2HS).

## Running the Application

For the Service Worker to function properly, the application must be run on a local server:

1. Open a terminal in the project folder.
2. Start a local server (e.g., using Python):
   python -m http.server 8000
3. Open your browser and navigate to `http://localhost:8000`.

## Features
- Brightness adjustment, solarization, negative
- Resizing and transposition
- Edge detection (Sobel, Laplacian, Prewitt) running in a background thread
- PWA (Progressive Web App) support
