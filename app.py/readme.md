from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from tinydb import TinyDB
from datetime import datetime
import asyncio
import random

app = FastAPI()

db = TinyDB("db.json")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def home():
    return FileResponse("static/index.html")


@app.get("/sensor")
async def sensor_data():

    data = {
        "motion": random.choice(["Detected", "Safe"]),
        "door": random.choice(["Open", "Closed"]),
        "alarm": random.choice(["ON", "OFF"]),
        "time": str(datetime.now())
    }

    db.insert(data)

    return data


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    while True:

        data = {
            "motion": random.choice(["Detected", "Safe"]),
            "door": random.choice(["Open", "Closed"]),
            "alarm": random.choice(["ON", "OFF"])
        }

        await websocket.send_json(data)

        await asyncio.sleep(2)
