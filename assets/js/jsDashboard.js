document.addEventListener("DOMContentLoaded", () => {
  inicializarRadar();
  inicializarHistograma();
});

// ==========================================
// RENDER COMPONENTE: RADAR TÁCTICO DE ALERTAS
// ==========================================
function inicializarRadar() {
  const canvas = document.getElementById("radarCanvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const size = 112; // Sincronizado con Tailwind w-28
  canvas.width = size;
  canvas.height = size;
  
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - 5;
  let angle = 0;

  function drawRadar() {
    ctx.clearRect(0, 0, size, size);

    // Circunferencias de guía
    ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
    ctx.lineWidth = 1;
    
    for (let r = rMax; r > 0; r -= 18) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ejes transversales en cruz
    ctx.beginPath();
    ctx.moveTo(cx - rMax, cy); ctx.lineTo(cx + rMax, cy);
    ctx.moveTo(cx, cy - rMax); ctx.lineTo(cx, cy + rMax);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.1)";
    ctx.stroke();

    // Línea de barrido (Sweep line)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    
    // Gradiente de desvanecimiento de estela
    let sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rMax);
    sweepGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
    sweepGrad.addColorStop(1, "rgba(239, 68, 68, 0.4)");
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rMax, 0, 0.4); // Apertura del haz
    ctx.lineTo(0, 0);
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // Punto crítico parpadeante (Simulación de objetivo detectado)
    ctx.beginPath();
    ctx.arc(cx + 15, cy - 20, 3, 0, Math.PI * 2);
    let alpha = Math.abs(Math.sin(Date.now() * 0.005));
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ef4444";
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    angle += 0.025;
    requestAnimationFrame(drawRadar);
  }
  drawRadar();
}

// ==========================================
// RENDER COMPONENTE: HISTOGRAMA CYAN GLOW
// ==========================================
function inicializarHistograma() {
  const canvas = document.getElementById("histogramaCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Ajuste dinámico de dimensiones físicas
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 110;

  const sampleData = [35, 55, 40, 75, 45, 90, 60, 85, 50, 95];
  const barWidth = 16;
  const gap = 12;
  const paddingBottom = 15;
  const paddingTop = 10;

  function drawHistogram() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Línea base horizontal (Suelo métrico)
    ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - paddingBottom);
    ctx.lineTo(canvas.width, canvas.height - paddingBottom);
    ctx.stroke();

    // Dibujo secuencial de barras con efecto Neón
    sampleData.forEach((val, i) => {
      const x = 20 + i * (barWidth + gap);
      const maxH = canvas.height - paddingBottom - paddingTop;
      const h = (val / 100) * maxH;
      const y = canvas.height - paddingBottom - h;

      // Configurar sombra de neón (Glow)
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#00f0ff";
      
      // Cuerpo de la barra principal
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(x, y, barWidth, h);
      
      // Apagar sombra para textos para no perjudicar legibilidad
      ctx.shadowBlur = 0;

      // Etiquetas del eje X (SKU)
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "8px 'Share Tech Mono'";
      ctx.textAlign = "center";
      ctx.fillText(`U${i+1}`, x + barWidth/2, canvas.height - 4);
    });
  }
  
  drawHistogram();

  // Escuchar redimensionamiento de pantalla para no perder ratio
  window.addEventListener("resize", () => {
    if(canvas && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      drawHistogram();
    }
  });
}