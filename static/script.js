const socket = new WebSocket("ws://localhost:8000/ws");

const motion = document.getElementById("motion");
const door = document.getElementById("door");
const alarm = document.getElementById("alarm");
const alerts = document.getElementById("alerts");

let chartData = [];

const ctx = document.getElementById('securityChart');

const myChart = new Chart(ctx,{
type:'line',
data:{
labels:[],
datasets:[{
label:'Security Events',
data:[],
borderWidth:3
}]
}
});

socket.onmessage=(event)=>{

const data=JSON.parse(event.data);

motion.innerHTML=data.motion;
door.innerHTML=data.door;
alarm.innerHTML=data.alarm;

let time=new Date().toLocaleTimeString();

myChart.data.labels.push(time);

myChart.data.datasets[0].data.push(
data.motion=="Detected"?1:0
);

if(myChart.data.labels.length>10){

myChart.data.labels.shift();
myChart.data.datasets[0].data.shift();

}

myChart.update();

if(data.motion=="Detected"){

let li=document.createElement("li");

li.innerHTML=
"🚨 Motion Detected at "+time;

alerts.prepend(li);

}
}
