// Dom Element Declarations
const motionText = document.getElementById("motion");
const doorText = document.getElementById("door");
const alarmText = document.getElementById("alarm");
const alertsList = document.getElementById("alerts");
const connectionStatus = document.getElementById("connectionStatus");
const doorIcon = document.getElementById("door-icon");

// Target Card Elements
const cardMotion = document.getElementById("card-motion");
const cardDoor = document.getElementById("card-door");
const cardAlarm = document.getElementById("card-alarm");

// Inputs / Features Switches
const systemArmed = document.getElementById("systemArmed");
const panicBtn = document.getElementById("panicBtn");

// Dedicated Live Target Element Feed Image Hooks
const liveVideoFeed = document.getElementById("liveVideoFeed");
const liveVideoFeedAlt = document.getElementById("liveVideoFeedAlt");

// Instantiate Analytics Workspace Line Graph Layout
const ctx = document.getElementById('securityChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Threat Metric Fluctuations',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { min: 0, max: 1, ticks: { display: false }, grid: { color: '#334155' } },
            x: { grid: { color: '#334155' } }
        }
    }
});

// Setup Main Core Dynamic Connection Engine
let socket;
function connectSecurityStream() {
    const wsUri = `ws://${window.location.host}/ws`;
    socket = new WebSocket(wsUri);

    socket.onopen = () => {
        connectionStatus.textContent = "🟢 Secure Real-Time Link Connected";
        connectionStatus.className = "status-connected";
    };

    socket.onmessage = (event) => {
        const serverPayload = JSON.parse(event.data);
        
        // INTERCEPT POINT: Check if the incoming packet is a live video frame chunk
        if (serverPayload.type === "video_frame") {
            liveVideoFeed.src = serverPayload.image;
            liveVideoFeedAlt.src = serverPayload.image;
            return; // Halt logic bubble processing here
        }

        // If system is disabled locally drop telemetry processing updates
        if (!systemArmed.checked) {
            clearDashboardVisuals();
            return;
        }

        if (serverPayload.type === "telemetry") {
            processIncomingTelemetry(serverPayload);
        }
    };

    socket.onerror = () => { handleNetworkDisruption(); };
    socket.onclose = () => { handleNetworkDisruption(); };
}

function handleNetworkDisruption() {
    connectionStatus.textContent = "🔴 Connection Dropped. Retrying backup routing...";
    connectionStatus.className = "status-connecting";
    setTimeout(connectSecurityStream, 5000); 
}

function clearDashboardVisuals() {
    motionText.textContent = "Standby";
    doorText.textContent = "Standby";
    alarmText.textContent = "DISABLED";
    cardMotion.className = "card";
    cardDoor.className = "card";
    cardAlarm.className = "card";
}

function processIncomingTelemetry(data) {
    const time = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    motionText.textContent = data.motion;
    doorText.textContent = data.door;
    alarmText.textContent = data.alarm;

    if (data.motion === "Detected") {
        cardMotion.className = "card status-danger";
        appendLoggedAlert("🚨 Corridor Motion Sensor Intercepted", "danger", time);
    } else {
        cardMotion.className = "card status-safe";
    }

    if (data.door === "Open") {
        cardDoor.className = "card status-warning";
        doorIcon.className = "fa fa-door-open";
        appendLoggedAlert("⚠️ Main Perimeter Access Point Opened", "warning", time);
    } else {
        cardDoor.className = "card status-safe";
        doorIcon.className = "fa fa-door-closed";
    }

    if (data.alarm === "ON") {
        cardAlarm.className = "card status-danger";
    } else {
        cardAlarm.className = "card status-safe";
    }

    myChart.data.labels.push(time);
    myChart.data.datasets[0].data.push(data.alarm === "ON" ? 1 : 0);

    if (myChart.data.labels.length > 8) {
        myChart.data.labels.shift();
        myChart.data.datasets[0].data.shift();
    }
    myChart.update();
}

function appendLoggedAlert(message, priority, timestamp) {
    let liElement = document.createElement("li");
    liElement.className = priority === "danger" ? "alert-danger" : "alert-warning";
    liElement.innerHTML = `<span>${message}</span> <small>${timestamp}</small>`;
    alertsList.prepend(liElement);
    
    if(alertsList.children.length > 6) {
        alertsList.removeChild(alertsList.lastChild);
    }
}

panicBtn.addEventListener('click', () => {
    if(!systemArmed.checked) return;
    const clickTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    processIncomingTelemetry({ type: "telemetry", motion: "Detected", door: "Open", alarm: "ON", timestamp: clickTime });
    appendLoggedAlert("🔥 PANIC OVERRIDE MANUAL EVENT RECEIVED", "danger", clickTime);
});

// --- SIDEBAR TAB VIEW SWITCH ROUTING ENGINE ---
const menuItems = document.querySelectorAll(".sidebar ul li");
const pageViews = document.querySelectorAll(".page-view");

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const viewTarget = item.textContent.trim().toLowerCase();

        pageViews.forEach((view) => {
            if (view.id === `view-${viewTarget}`) {
                view.style.display = "block";
            } else {
                view.style.display = "none";
            }
        });
    });
});

// --- HISTORICAL SEARCH PARSER LOGIC FROM TINYDB ---
const refreshLogsBtn = document.getElementById("refreshLogsBtn");
const dbLogsList = document.getElementById("dbLogsList");

refreshLogsBtn.addEventListener("click", async () => {
    dbLogsList.innerHTML = "<li class='placeholder-text'>Querying storage records...</li>";
    try {
        const response = await fetch("/logs");
        const logs = await response.json();
        
        dbLogsList.innerHTML = ""; 
        
        if (logs.length === 0) {
            dbLogsList.innerHTML = "<li class='placeholder-text'>No entries found inside your db.json database yet.</li>";
            return;
        }

        // Limit rendering stack size down to the latest 20 updates for performance
        logs.reverse().slice(0, 20).forEach(entry => {
            let li = document.createElement("li");
            li.className = "db-log-item";
            li.innerHTML = `<span>🔒 Motion: <b>${entry.motion || 'Safe'}</b> | Door: <b>${entry.door || 'Closed'}</b> | Alarm: <b>${entry.alarm || 'OFF'}</b></span> <small>${entry.timestamp || 'Just Now'}</small>`;
            dbLogsList.appendChild(li);
        });
    } catch (error) {
        dbLogsList.innerHTML = "<li class='placeholder-text' style='color: #ef4444;'>Failed to pull archives from backend filesystem endpoint.</li>";
    }
});

// Fire connection pipeline
connectSecurityStream();
