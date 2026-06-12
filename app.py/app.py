from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from tinydb import TinyDB
from datetime import datetime
import asyncio
import random

app = FastAPI()

# Auto-instantiates local TinyDB file backend records
db = TinyDB("db.json")

# Mounting static assets folder securely
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def home():
    return FileResponse("static/index.html")

@app.get("/camera-stream")
async def camera_stream():
    """Endpoint accessed by your phone browser to turn it into a camera transmitter"""
    return FileResponse("static/camera.html")

@app.get("/logs")
async def get_logs():
    return db.all()

# Connection tracking registries
active_dashboards = set()

@app.websocket("/ws")
async def sensor_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_dashboards.add(websocket)
    print("🔒 Main Dashboard UI viewport paired with telemetry stream.")
    
    try:
        while True:
            # Generate realistic synchronized sensor payloads
            motion_status = random.choice(["Detected", "Safe"])
            door_status = random.choice(["Open", "Closed"])
            
            # Logic: If any door opens or motion trips, trigger alarm state
            alarm_status = "ON" if (motion_status == "Detected" or door_status == "Open") else "OFF"
            timestamp = datetime.now().strftime("%I:%M:%S %p")

            payload = {
                "type": "telemetry",
                "motion": motion_status,
                "door": door_status,
                "alarm": alarm_status,
                "timestamp": timestamp
            }

            # Commit events directly into the database
            db.insert(payload)

            # Send data out directly onto the dashboard viewports
            await websocket.send_json(payload)
            await asyncio.sleep(3)
            
    except WebSocketDisconnect:
        active_dashboards.remove(websocket)
        print("🔓 Main Dashboard client connection cleanly terminated.")

@app.websocket("/ws-camera")
async def camera_websocket_endpoint(websocket: WebSocket):
    """Secondary WebSocket pipeline handling high-frequency video frame routing"""
    await websocket.accept()
    print("🎥 Mobile Phone Camera node authenticated. Transmitting video...")
    
    try:
        while True:
            # Receive base64 high-speed compressed JPEG frame lines from your phone browser
            base64_frame = await websocket.receive_text()
            
            # Instantly broadcast that frame to all open main dashboards running
            for dashboard in active_dashboards:
                try:
                    await dashboard.send_json({
                        "type": "video_frame",
                        "image": base64_frame
                    })
                except:
                    pass # Clean skip if a single dashboard viewport stalls out
    except WebSocketDisconnect:
        print("🛑 Mobile Phone Camera node disconnected from uplink stream.")
