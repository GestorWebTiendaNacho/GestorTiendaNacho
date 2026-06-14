/* LINEAS FUTURISTAS */
const canvas = document.getElementById("lines");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let dots = [];

for(let i=0;i<40;i++){
dots.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:Math.random(),
vy:Math.random()
});
}

function animate(){
ctx.clearRect(0,0,canvas.width,canvas.height);

dots.forEach(d=>{
d.x+=d.vx;
d.y+=d.vy;

```
ctx.fillStyle="cyan";
ctx.fillRect(d.x,d.y,2,2);
```

});

requestAnimationFrame(animate);
}

animate();

/* GRAFICA SIMPLE */
const chart = document.getElementById("chart");
const c = chart.getContext("2d");

chart.width = 400;
chart.height = 200;

let data = [200,400,300,600,500];

function drawChart(){
c.clearRect(0,0,400,200);

data.forEach((v,i)=>{
c.fillStyle="cyan";
c.fillRect(i*70+20,200-v/3,40,v/3);
});
}

drawChart();
