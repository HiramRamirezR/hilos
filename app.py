import os
import uuid
from typing import Optional
from fastapi import Query

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from hilos import generate_thread_image

app = FastAPI(
    title="Thread Image Generator",
    description="Generate thread-like representations of images",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure output directory exists
OUTPUT_DIR = "thread_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/", response_class=FileResponse)
async def serve_index():
    """
    Serve the main index.html file
    """
    return "static/index.html"

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Simple health check endpoint to verify the application is running.
    
    Returns:
        dict: A simple status message
    """
    return {
        "status": "healthy",
        "message": "Thread Image Generator is up and running!"
    }

@app.post("/generate-thread-image/")
async def create_thread_image(
    file: UploadFile = File(...), 
    pins: Optional[int] = Query(240), 
    lines: Optional[int] = Query(3500), 
    pixel_width: Optional[int] = Query(500)
):
    """
    Generate a thread-like representation of an uploaded image.
    
    - **file**: Image file to process
    - **pins**: Number of pins (default: 240)
    - **lines**: Number of lines to draw (default: 3500)
    - **pixel_width**: Size of resulting image (default: 500)
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Only JPEG and PNG are supported. Received: {file.content_type}"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_input{os.path.splitext(file.filename)[1]}"
    input_path = os.path.join(OUTPUT_DIR, unique_filename)

    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            buffer.write(await file.read())

        # Ensure parameters are integers
        pins = int(pins) if pins is not None else 240
        lines = int(lines) if lines is not None else 3500
        pixel_width = int(pixel_width) if pixel_width is not None else 500

        # Generate thread image
        output_image_path, line_sequence_path = generate_thread_image(
            input_path, 
            OUTPUT_DIR, 
            pins=pins, 
            lines=lines, 
            pixel_width=pixel_width
        )

        # Return the generated image
        return FileResponse(
            output_image_path, 
            media_type="image/jpeg", 
            filename=os.path.basename(output_image_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Eliminar el archivo de entrada si existe
        if os.path.exists(input_path):
            os.remove(input_path)

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    """
    Retrieve output files (images or JSON)
    """
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
