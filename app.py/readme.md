from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from tinydb import TinyDB
from datetime import datetime
import asyncio
import random

app = FastAPI()
db = TinyDB("db.json")

# Serve the static directory containing HTML, CSS, and JS files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def home():
    return FileResponse("static/index.html")

@app.get("/camera-stream")
async def camera_stream():
    return FileResponse("static/camera.html")

@app.get("/logs")
async def get_logs():
    return db.all()

# Dedicated connection pool for active dashboard clients
connected_dashboards = set()


@app.websocket("/ws")
async def sensor_websocket_endpoint(websocket: WebSocket):
    """
    Handles telemetry stream dispatching to dashboards and manages 
    abrupt socket terminations gracefully.
    """
    await websocket.accept()
    connected_dashboards.add(websocket)
    print("🔒 Main Dashboard paired with live telemetry stream.")
    
    try:
        while True:
            # Generate randomized simulated sensor metrics
            motion_status = random.choice(["Detected", "Safe"])
            door_status = random.choice(["Open", "Closed"])
            alarm_status = "ON" if (motion_status == "Detected" or door_status == "Open") else "OFF"
            timestamp = datetime.now().strftime("%I:%M:%S %p")

            payload = {
                "type": "telemetry",
                "motion": motion_status,
                "door": door_status,
                "alarm": alarm_status,
                "timestamp": timestamp
            }
            
            # Log event state to persistent storage
            db.insert(payload)
            
            # --- THE CLEAN DISCONNECT BUGFIX ---
            try:
                await websocket.send_json(payload)
            except Exception:
                # Intercepts sudden tab closures and terminates the thread silently
                break 
                
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        print("🔓 Main Dashboard connection closed via expected protocol.")
    finally:
        # Cleanup connection pool memory leaks
        if websocket in connected_dashboards:
            connected_dashboards.remove(websocket)


@app.websocket("/ws-camera")
async def camera_websocket_endpoint(websocket: WebSocket):
    """
    Receives compressed video frame chunks from the mobile transmitter
    and relays them efficiently to active dashboards.
    """
    await websocket.accept()
    print("🎥 Mobile camera node linked and transmitting...")
    
    try:
        while True:
            # Await base64 compressed JPEG string from the phone camera
            base64_frame = await websocket.receive_text()
            
            # Broadcast the video frame to all connected dashboards
            for dashboard in list(connected_dashboards):
                try:
                    await dashboard.send_json({
                        "type": "video_frame",
                        "image": base64_frame
                    })
                except Exception:
                    # Handle individual dead dashboard pipes silently
                    pass
    except WebSocketDisconnect:
        print("🛑 Mobile camera node offline.")
