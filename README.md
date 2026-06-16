# 🚨 Aegis Sec: Real-Time Cloud Security Hub & IoT Ecosystem

Aegis Sec is a resilient, modern, low-latency home security and surveillance dashboard ecosystem. Built on top of a highly optimized **FastAPI ASGI network layer**, the system processes asynchronous real-time video frames, parses telemetry logs, triggers panic actions, and interacts with edge IoT components (like ESP32 microcontrollers) using high-frequency **WebSocket channels**. 

The system includes a dark-themed monitoring interface and features a sandboxed mobile pipeline that repurposes standard mobile devices into active edge camera streams without needing expensive domain names or SSL setup.

---

## 🏗️ Core Architectural Overview

```text
 [ IoT Edge: ESP32 ] ────(WebSockets: Telemetry)───► [ FastAPI ASGI Engine ] ◄───(Chart.js / DOM Updates)─── [ Admin Desktop Web Dashboard ]
 [ Smartphone Camera ] ──(WebSockets: MJPEG Frames)─►        (app.py)        ├───(Persisted Log Registry)─── [ TinyDB Storage Engine ]
                                                             │               └───(API Parameter Control)──── [ HTTP POST Endpoints ]
                                                             ▼
                                                [ System Event Alerts Engine ] ───► (Twilio SMS & SMTP Mailing Channels)
fastapi-lab/
├── venv/                      # Isolated virtual environment binaries
├── app.py                     # Main ASGI routing engine, state machines, & WebSockets
├── storage.json               # Flat-file database generated at runtime by TinyDB
└── static/                    # Frontend presentation asset container
    ├── index.html             # Central Administration Hub Interface
    ├── camera.html            # Mobile Camera Stream Capture Interface
    ├── script.js              # State Engine, UI Drivers, & Resilient WS pipelines
    └── style.css              # Dark-theme presentation layout
