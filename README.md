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

## Keeping the App Awake

### UptimeRobot Configuration
To prevent the Render free tier from sleeping, use a monitoring service like UptimeRobot:

1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Create a new Monitor
   - Type: HTTP(s)
   - Friendly Name: Hilos App Health Check
   - URL: `https://your-render-url.onrender.com/health`
   - Monitoring Interval: Every 5 minutes

### Alternative Approaches
- Use cron jobs or scheduled tasks to ping the `/health` endpoint
- Consider upgrading to Render's paid tier for continuous deployment

### Performance Considerations
- The health check is lightweight and won't consume significant resources
- Helps keep the application warm and reduces cold start times

## Local Development
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the application: `uvicorn app:app --reload`

## Features
- Upload images
- Generate thread-like image representations
- Customizable thread generation parameters