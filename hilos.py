from PIL import Image, ImageDraw, ImageOps
from tqdm import tqdm
import collections
import numpy as np
import math as m
import cv2
import os
import json
import uuid
import time
import random

def generate_thread_image(file_path, output_dir=None, pins=240, lines=3500, pixel_width=500):
    """
    Generate a thread-like representation of an input image.
    
    Args:
        file_path (str): Path to the input image
        output_dir (str, optional): Directory to save output files. Defaults to same directory as input.
        pins (int, optional): Number of pins. Defaults to 240.
        lines (int, optional): Number of lines to draw. Defaults to 3500.
        pixel_width (int, optional): Size of resulting image. Defaults to 500.
    
    Returns:
        tuple: (output_image_path, line_sequence_path)
    """
    # Validate and use passed parameters
    PIN_NO = max(10, min(pins, 1000))  # Constrain between 10 and 1000
    LINE_NO = max(100, min(lines, 10000))  # Constrain between 100 and 10000
    PIXEL_WIDTH = pixel_width
    MIN_PREVIOUS_PINS = 20
    LINE_WIDTH = 30
    MIN_DISTANCE = 20
    SCALE = 50

    # Log the actual values being used
    print(f"Generating thread image with: pins={PIN_NO}, lines={LINE_NO}")

    # Determine output directory
    if output_dir is None:
        output_dir = os.path.dirname(file_path)
    os.makedirs(output_dir, exist_ok=True)

    # Filename handling
    file_name = os.path.splitext(os.path.basename(file_path))[0]

    # Read input image
    img = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
    
    # Resize image if necessary
    if img.shape[0] > pixel_width or img.shape[1] > pixel_width:
        img = cv2.resize(img, (pixel_width, pixel_width), interpolation=cv2.INTER_AREA)

    # Read input image
    img = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
    
    # Resize image if necessary
    if img.shape[0] > pixel_width or img.shape[1] > pixel_width:
        img = cv2.resize(img, (pixel_width, pixel_width), interpolation=cv2.INTER_AREA)

    # Crop image
    def crop(image):
        height, width = image.shape[0:2]
        minEdge = min(height, width)
        topEdge = int((height - minEdge)/2)
        leftEdge = int((width - minEdge)/2)
        return image[topEdge:topEdge+minEdge, leftEdge:leftEdge+minEdge]

    # Cut image into a circle
    def circularMask(PIXEL_WIDTH, resized, center, radius):
        y, x = np.ogrid[:PIXEL_WIDTH, :PIXEL_WIDTH]
        mask = (x - center[0]) ** 2 + (y - center[1]) ** 2 >= radius ** 2
        resized[mask] = 255
        return resized

    # Calculating the coordinates of each pin
    def pinCoordinates(PIN_NO, center, radius):
        pinCoord = []
        angleIncrement = 2 * m.pi / PIN_NO

        for i in range(PIN_NO):
            pinCoord.append((
                m.floor(center[0] + radius * m.cos(i * angleIncrement)),
                m.floor(center[1] + radius * m.sin(i * angleIncrement))
            ))

        return pinCoord

    # Dimensions and center
    dim = (PIXEL_WIDTH, PIXEL_WIDTH)
    center = [PIXEL_WIDTH/2, PIXEL_WIDTH/2]
    radius = PIXEL_WIDTH/2 - 1/2

    # Mask the image to be circular
    imgMasked = circularMask(PIXEL_WIDTH, img, center, radius)

    # Defining the pin coordinates
    pinCoord = pinCoordinates(PIN_NO, center, radius)

    # Finding the coordinates between two points
    lineY = [None] * PIN_NO * PIN_NO
    lineX = [None] * PIN_NO * PIN_NO

    for point1 in range(PIN_NO):
        for point2 in range(point1 + MIN_DISTANCE, PIN_NO):
            x0, y0 = pinCoord[point1]
            x1, y1 = pinCoord[point2]

            hypDistance = int(m.sqrt((x1-x0)**2 + (y1-y0)**2))

            xCoords = np.linspace(x0, x1, hypDistance, dtype=int)
            yCoords = np.linspace(y0, y1, hypDistance, dtype=int)

            lineY[point2*PIN_NO + point1] = yCoords
            lineY[point1*PIN_NO + point2] = yCoords
            lineX[point2*PIN_NO + point1] = xCoords
            lineX[point1*PIN_NO + point2] = xCoords

    # Inverting the image for processing
    invertedImg = np.ones((imgMasked.shape)) * 255 - imgMasked.copy()

    # Resultant image canvas
    result = np.ones((imgMasked.shape[0] * SCALE, imgMasked.shape[1] * SCALE), np.uint8) * 255

    lineSequence = []
    currentPin = 0
    previousPins = collections.deque(maxlen=MIN_PREVIOUS_PINS)

    lineSequence.append(currentPin)

    for _ in tqdm(range(LINE_NO), desc="Creating lines", unit='Lines'):
        maxError = -m.inf
        bestPin = -1
        for difference in range(MIN_DISTANCE, PIN_NO-MIN_DISTANCE):
            testPin = (currentPin + difference) % PIN_NO
            if testPin in previousPins:
                continue

            xCoords = lineX[testPin*PIN_NO + currentPin]
            yCoords = lineY[testPin*PIN_NO + currentPin]

            lineError = np.sum(invertedImg[yCoords, xCoords])

            if lineError > maxError:
                maxError = lineError
                bestPin = testPin

        lineSequence.append(bestPin)

        xCoords = lineX[bestPin * PIN_NO + currentPin]
        yCoords = lineY[bestPin * PIN_NO + currentPin]

        lineMask = np.zeros(imgMasked.shape, np.float64)
        lineMask[yCoords, xCoords] = LINE_WIDTH
        invertedImg = invertedImg - lineMask
        invertedImg.clip(0, 255)

        cv2.line(result, 
                 (pinCoord[currentPin][0] * SCALE, pinCoord[currentPin][1] * SCALE),
                 (pinCoord[bestPin][0] * SCALE, pinCoord[bestPin][1] * SCALE), 
                 color=0, thickness=4, lineType=8)

        previousPins.append(bestPin)
        currentPin = bestPin

    # Resize output image
    resultImg = cv2.resize(result, (500, 500), interpolation=cv2.INTER_AREA)

    # Save output image
    output_image_path = os.path.join(output_dir, f"{file_name}_output.png")
    cv2.imwrite(output_image_path, resultImg)

    # Save line sequence
    line_sequence_path = os.path.join(output_dir, f"{file_name}.json")
    with open(line_sequence_path, "w") as f:
        json.dump(lineSequence, f)

    return output_image_path, line_sequence_path

def main():
    # Example usage
    input_image = "img/tigre.jpg"
    output_image, line_sequence = generate_thread_image(input_image)
    print(f"Output image saved as: {output_image}")
    print(f"Line sequence saved as: {line_sequence}")

if __name__ == "__main__":
    main()
