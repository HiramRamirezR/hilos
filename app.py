import os
import uuid
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

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

# Ensure output directory exists
OUTPUT_DIR = "thread_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
    pins: Optional[int] = 240, 
    lines: Optional[int] = 3500, 
    pixel_width: Optional[int] = 500
):
    """
    Generate a thread-like representation of an uploaded image.
    
    - **file**: Image file to process
    - **pins**: Number of pins (default: 240)
    - **lines**: Number of lines to draw (default: 3500)
    - **pixel_width**: Size of resulting image (default: 500)
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_input.jpg"
    input_path = os.path.join(OUTPUT_DIR, unique_filename)

    # Save uploaded file
    try:
        with open(input_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    try:
        # Generate thread image
        output_image, line_sequence = generate_thread_image(
            input_path, 
            output_dir=OUTPUT_DIR, 
            pins=pins, 
            lines=lines, 
            pixel_width=pixel_width
        )

        return {
            "output_image": os.path.basename(output_image),
            "line_sequence": os.path.basename(line_sequence)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating thread image: {str(e)}")

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
