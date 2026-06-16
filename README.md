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





# 🚀 Deployment Playbook

Follow these quick commands to spin up this infrastructure ecosystem on an unconfigured Linux machine (such as an AWS EC2 or DigitalOcean Ubuntu Droplet Instance):

```bash
# 1. Elevate process execution privileges to system superuser admin
sudo su

# 2. Update repository maps to acquire modern component indices
apt update -y

# 3. Provision environment base runtime hooks: python execution variables and venv module isolation layers
apt install python3-pip python3-venv -y

# 4. Construct structural storage sandbox directory space
mkdir fastapi-lab && cd fastapi-lab

# 5. Initialize active Python virtual isolated container ecosystem
python3 -m venv venv
source venv/bin/activate

# 6. Pull down optimized framework components and socket management drivers
pip install fastapi uvicorn tinydb jinja2 websockets





### 🏎️ Starting the App Core Server Host Engine

To host on a standard public address port without connection drops during heavy background asset packet processing, boot Uvicorn with **keepalive ping metadata arguments**:

```bash
uvicorn app:app --host 0.0.0.0 --port 80 --ws-ping-interval 20 --ws-ping-timeout 20


## 📱 Mobile Camera Streaming Sandbox Workaround

[ SECURITY SANDBOX BLOCK ]
Mobile Browser ──► http://<Server-IP>/camera-stream ──❌ CAMERA PERMISSION DENIED

                  [ CHROME FLAG INTERVENTION ]
Mobile Browser ──► chrome://flags (Safelist IP)      ──✅ LIVE STREAM ACTIVE







## 🛠️ Google Chrome Override Configurations Protocol Steps:

Open the Google Chrome app on your streaming mobile smartphone device.

In the top URL web-address text container box input parameters path, enter this exact command line and hit enter:

Plaintext
chrome://flags
Use the interface internal top-level container query element bar to hunt for this specific string identifier rule variable:

Plaintext
Insecure origins treated as secure
Modify the action field value selection from Disabled to Enabled.

Paste your exact cloud deployment target server web destination address path pattern directly into the configuration text block right below the choice bar:

Plaintext
[http://34.201.143.168](http://34.201.143.168)
Tap the blue Relaunch action notification button at the bottom of the display window layout interface space to cycle the internal web framework.

Return back to your remote camera streaming device node interface location target link:

Plaintext
[http://34.201.143.168/camera-stream](http://34.201.143.168/camera-stream)
Tap Allow when the system security modal overlays pop up requesting camera lens access permissions.

Your smartphone camera lens view matrix will immediately connect, push image packets to the network server backend, and live stream updates directly onto your master command administrative station panel canvas workspace!




## 📝 API Integration Endpoints Reference Matrix

| Access Method | Routing Path Endpoint Location | Authorization Access Tier | Structural Process Execution Action |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Guest / Operator | Delivers primary administration dashboard workspace client view index page |
| **GET** | `/camera-stream` | Active Remote Node | Spins up internal video pipeline client capture script engine page assets |
| **GET** | `/logs` | System Operator | Fetches a dataset payload dictionary listing the past 20 logged historical metrics traces |

