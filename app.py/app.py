from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from tinydb import TinyDB
from datetime import datetime
import asyncio


app = FastAPI()
db = TinyDB("db.json")

app.mount("/static", StaticFiles(directory="static"), name="static")

# System State Tracks
system_states = {
    "motion": "Safe",
    "detected_class": "None",
    "door": "Closed",
    "alarm": "OFF"
}

# Whitelist registry tracking muted/locked object tags
muted_objects = set()

active_dashboards = set()
active_cameras = set()

class DoorToggleRequest(BaseModel):
    state: str

class MuteObjectRequest(BaseModel):
    object_class: str

@app.get("/")
async def home():
    return FileResponse("static/index.html")

@app.get("/camera-stream")
async def camera_stream():
    return FileResponse("static/camera.html")

@app.get("/logs")
async def get_logs():
    return db.all()

@app.post("/api/door")
async def toggle_door(request: DoorToggleRequest):
    if request.state in ["Open", "Closed"]:
        system_states["door"] = request.state
        evaluate_alarm_logic()
        await broadcast_system_telemetry()
        return {"status": "success", "door": system_states["door"]}
    return {"status": "error"}

@app.post("/api/mute-object")
async def mute_object(request: MuteObjectRequest):
    obj_tag = request.object_class.strip().lower()
    if obj_tag and obj_tag != "none":
        muted_objects.add(obj_tag)
        return {"status": "success", "muted_list": list(muted_objects)}
    return {"status": "error", "message": "Invalid object tag"}

@app.post("/api/clear-mutes")
async def clear_mutes():
    muted_objects.clear()
    return {"status": "success"}

def evaluate_alarm_logic():
    if system_states["motion"] == "Detected" or system_states["door"] == "Open":
        system_states["alarm"] = "ON"
    else:
        system_states["alarm"] = "OFF"

async def broadcast_system_telemetry():
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    payload = {
        "type": "telemetry",
        "motion": system_states["motion"],
        "detected_class": system_states["detected_class"],
        "door": system_states["door"],
        "alarm": system_states["alarm"],
        "timestamp": timestamp
    }
    db.insert(payload)
    
    # Fix 1: Create a snapshot list of active dashboards to avoid runtime size modification errors
    for dashboard in list(active_dashboards):
        try:
            await dashboard.send_json(payload)
        except Exception:
            # Fix 2: Silently sweep away stale sockets if a send is attempted mid-closure
            active_dashboards.discard(dashboard)

@app.websocket("/ws")
async def sensor_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_dashboards.add(websocket)
    
    try:
        # Initial handshake sync
        timestamp = datetime.now().strftime("%I:%M:%S %p")
        await websocket.send_json({
            "type": "telemetry",
            **system_states,
            "timestamp": timestamp
        })
        
        while True:
            data = await websocket.receive_json()
            if data.get("action") == "trigger_panic":
                system_states["alarm"] = "ON"
                await broadcast_system_telemetry()
                await trigger_mobile_audio_siren()
                
    except WebSocketDisconnect:
        active_dashboards.discard(websocket)
    except Exception:
        active_dashboards.discard(websocket)

@app.websocket("/ws-camera")
async def camera_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_cameras.add(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Frame Forwarding Engine
            if "image" in data:
                # Fix 1 & 2: Use an isolated list copy and guard against half-closed sockets
                for dashboard in list(active_dashboards):
                    try:
                        await dashboard.send_json({"type": "video_frame", "image": data["image"]})
                    except Exception:
                        active_dashboards.discard(dashboard)
            
            # Vision Logic Processing Engine
            if "motion" in data:
                incoming_motion = data["motion"]
                incoming_class = data.get("object_class", "unknown").strip().lower()
                
                if incoming_motion == "Detected" and incoming_class in muted_objects:
                    if system_states["motion"] != "Safe":
                        system_states["motion"] = "Safe"
                        system_states["detected_class"] = f"{incoming_class} (Muted)"
                        system_states["alarm"] = "OFF"
                        await broadcast_system_telemetry()
                    continue

                system_states["motion"] = incoming_motion
                system_states["detected_class"] = incoming_class if incoming_motion == "Detected" else "None"
                evaluate_alarm_logic()
                await broadcast_system_telemetry()
                
    except WebSocketDisconnect:
        active_cameras.discard(websocket)
    except Exception:
        active_cameras.discard(websocket)

async def trigger_mobile_audio_siren():
    for camera in list(active_cameras):
        try:
            await camera.send_json({"command": "play_siren"})
        except Exception:
            active_cameras.discard(camera)
a
