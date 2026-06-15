const motionText = document.getElementById("motion");
const objectTagText = document.getElementById("detected-object-tag");
const doorText = document.getElementById("door");
const alarmText = document.getElementById("alarm");
const alertsList = document.getElementById("alerts");
const connectionStatus = document.getElementById("connectionStatus");
const doorIcon = document.getElementById("door-icon");

const cardMotion = document.getElementById("card-motion");
const cardDoor = document.getElementById("card-door");
const cardAlarm = document.getElementById("card-alarm");

const systemArmed = document.getElementById("systemArmed");
const panicBtn = document.getElementById("panicBtn");

const liveVideoFeed = document.getElementById("liveVideoFeed");
const liveVideoFeedAlt = document.getElementById("liveVideoFeedAlt");

let currentTrackedObjectClass = "None";

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
        
        if (serverPayload.type === "video_frame") {
            if (liveVideoFeed) liveVideoFeed.src = serverPayload.image;
            if (liveVideoFeedAlt) liveVideoFeedAlt.src = serverPayload.image;
            return;
        }

        if (serverPayload.type === "telemetry") {
            // FIXED: Always capture and push real-time door component status transformations first
            doorText.textContent = serverPayload.door;
            if (serverPayload.door === "Open") {
                cardDoor.className = "card status-warning";
                doorIcon.className = "fa fa-door-open";
            } else {
                cardDoor.className = "card status-safe";
                doorIcon.className = "fa fa-door-closed";
            }

            // If the system toggle is switched off, strip motion alerts but keep door active
            if (!systemArmed.checked) {
                motionText.textContent = "Standby";
                objectTagText.textContent = "None";
                alarmText.textContent = "DISABLED";
                cardMotion.className = "card";
                cardAlarm.className = "card";
                return;
            }

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
    objectTagText.textContent = "None";
    doorText.textContent = "Standby";
    alarmText.textContent = "DISABLED";
    cardMotion.className = "card";
    cardDoor.className = "card";
    cardAlarm.className = "card";
}

async function setDoorState(targetState) {
    try {
        await fetch('/api/door', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: targetState })
        });
    } catch(err) { console.error(err); }
}

async function muteCurrentObject() {
    if (currentTrackedObjectClass && currentTrackedObjectClass !== "None") {
        try {
            await fetch('/api/mute-object', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ object_class: currentTrackedObjectClass })
            });
            appendLoggedAlert(`🔇 Locked filter for: ${currentTrackedObjectClass.toUpperCase()}`, "warning", "System");
        } catch(err) { console.error(err); }
    }
}

async function clearMuteRegistry() {
    try {
        await fetch('/api/clear-mutes', { method: 'POST' });
        appendLoggedAlert("🔄 Whitelist filters reset.", "system-log", "System");
    } catch(err) { console.error(err); }
}

window.setDoorState = setDoorState;
window.muteCurrentObject = muteCurrentObject;
window.clearMuteRegistry = clearMuteRegistry;

function processIncomingTelemetry(data) {
    const time = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    motionText.textContent = data.motion;
    currentTrackedObjectClass = data.detected_class || "None";
    objectTagText.textContent = currentTrackedObjectClass.toUpperCase();

    if (data.motion === "Detected") {
        cardMotion.className = "card status-danger";
        appendLoggedAlert(`📡 Tracked Object Viewbound: [${objectTagText.textContent}]`, "danger", time);
    } else {
        cardMotion.className = "card status-safe";
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
    liElement.className = priority === "danger" ? "alert-danger" : (priority === "warning" ? "alert-warning" : "system-log");
    liElement.innerHTML = `<span>${message}</span> <small>${timestamp}</small>`;
    alertsList.prepend(liElement);
    if(alertsList.children.length > 6) { alertsList.removeChild(alertsList.lastChild); }
}

panicBtn.addEventListener('click', () => {
    if(!systemArmed.checked) return;
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "trigger_panic" }));
    }
});

const menuItems = document.querySelectorAll(".sidebar ul li");
const pageViews = document.querySelectorAll(".page-view");
menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        const viewTarget = item.textContent.trim().toLowerCase();
        pageViews.forEach((view) => {
            view.style.display = view.id === `view-${viewTarget}` ? "block" : "none";
        });
    });
});

const refreshLogsBtn = document.getElementById("refreshLogsBtn");
const dbLogsList = document.getElementById("dbLogsList");
refreshLogsBtn.addEventListener("click", async () => {
    dbLogsList.innerHTML = "<li class='placeholder-text'>Querying storage records...</li>";
    try {
        const response = await fetch("/logs");
        const logs = await response.json();
        dbLogsList.innerHTML = ""; 
        if (logs.length === 0) {
            dbLogsList.innerHTML = "<li class='placeholder-text'>No database records found.</li>";
            return;
        }
        logs.reverse().slice(0, 20).forEach(entry => {
            let li = document.createElement("li");
            li.className = "db-log-item";
            li.innerHTML = `<span>🔒 Motion: <b>${entry.motion || 'Safe'}</b> (${entry.detected_class || 'None'}) | Door: <b>${entry.door || 'Closed'}</b> | Alarm: <b>${entry.alarm || 'OFF'}</b></span> <small>${entry.timestamp || 'Just Now'}</small>`;
            dbLogsList.appendChild(li);
        });
    } catch (error) { dbLogsList.innerHTML = "<li class='placeholder-text' style='color: #ef4444;'>Error loading database logs.</li>"; }
});

connectSecurityStream();
