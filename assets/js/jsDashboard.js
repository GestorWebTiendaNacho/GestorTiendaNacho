/* CHART */
const ctxChart = document.getElementById('chart');

new Chart(ctxChart, {
  type: 'line',
  data: {
    labels: ['Lun','Mar','Mié','Jue','Vie','Sab','Dom'],
    datasets: [{
      label: 'Actividad',
      data: [12, 19, 10, 22, 18, 25, 30],
      borderColor: '#00f0ff',
      backgroundColor: 'rgba(0,240,255,0.1)',
      tension: 0.4
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#aaa' } },
      y: { ticks: { color: '#aaa' } }
    }
  }
});


/* LINES ANIMATION */
const canvas = document.getElementById('connections');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];

for (let i = 0; i < 20; i++) {
  points.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5
  });
}

function animate() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  points.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    points.forEach(p2 => {
      const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

      if (dist < 150) {
        ctx.strokeStyle = 'rgba(0,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  });

  requestAnimationFrame(animate);
}

animate();
