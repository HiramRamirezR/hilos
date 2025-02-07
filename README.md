# Hilos: Thread Image Generator

## Project Description
Hilos is a web application that generates thread-like representations of images using FastAPI and computer vision techniques.

## Deployment

### Render Deployment
1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service with the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Branch: `main`

## Local Development
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the application: `uvicorn app:app --reload`

## Features
- Upload images
- Generate thread-like image representations
- Customizable thread generation parameters