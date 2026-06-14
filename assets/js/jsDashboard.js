(() => {
  // Inicialización diferida segura para evitar colisiones con index.html
  setTimeout(() => {
    initMenuInteractions();
    initRadar();
    initHistogram();
  }, 50);

  // CONTROL INTERACTIVO DE SUBMENÚS (COLLAPSE/EXPAND TÁCTICO)
  function initMenuInteractions() {
    const toggleButtons = document.querySelectorAll('.toggle-menu-btn');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const parentGroup = button.closest('.nav-group');
        
        if (!parentGroup) return;

        // Comprobamos si ya está expandido
        const isExpanded = parentGroup.classList.contains('expanded');

        // Cierra los demás menús abiertos para mantener limpieza táctica de interfaz
        document.querySelectorAll('.nav-group').forEach(group => {
          group.classList.remove('expanded');
        });

        // Si no estaba expandido, lo abrimos
        if (!isExpanded) {
          parentGroup.classList.add('expanded');
        }
      });
    });
  }

  // MOTOR SCANNER RADAR CIAN (SISTEMA DE BÚSQUEDA)
  function initRadar() {
    const canvas = document.getElementById("cyberInjectedRadar");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 96;
    canvas.width = size; canvas.height = size;
    const cx = size / 2, cy = size / 2, rMax = size / 2 - 4;
    let angle = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);
      
      // Anillos del radar estáticos
      ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
      ctx.lineWidth = 1;
      for(let r = rMax; r > 0; r -= 16) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      
      // Retícula de cuadrícula integrada
      ctx.beginPath();
      ctx.moveTo(cx - rMax, cy); ctx.lineTo(cx + rMax, cy);
      ctx.moveTo(cx, cy - rMax); ctx.lineTo(cx, cy + rMax);
      ctx.stroke();

      // Vector de Barrido de Energía Giratorio
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angle);
      let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rMax);
      grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0, 240, 255, 0.45)");
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rMax, 0, 0.6); ctx.lineTo(0, 0);
      ctx.fillStyle = grad; ctx.fill();
      ctx.restore();

      // Nodos/Targets Críticos Detectados (Puntos Rojos Parpadeantes)
      ctx.beginPath(); ctx.arc(cx + 18, cy - 16, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${Math.abs(Math.sin(Date.now() * 0.005))})`;
      ctx.fill();

      angle += 0.025;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ENGIN HISTOGRAMA MULTI-CROMÁTICO (VALORES DIFERENCIADOS)
  function initHistogram() {
    const canvas = document.getElementById("cyberInjectedHistogram");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Configuración inicial de dimensiones fluidas respecto al contorno
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 100;

    const dataPoints = [35, 52, 42, 78, 58, 92, 68, 96, 48, 88];
    // Paleta cromática futurista secuencial para diferenciar barras
    const barColors = [
      '#00f0ff', '#1e40af', '#3b82f6', '#f59e0b', '#ffb020', 
      '#ef4444', '#b91c1c', '#a855f7', '#ec4899', '#10b981'
    ];
    const barW = 14, gap = 12, offsetBottom = 16;

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Eje de referencia de datos
      ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, canvas.height - offsetBottom); ctx.lineTo(canvas.width, canvas.height - offsetBottom);
      ctx.stroke();

      dataPoints.forEach((val, i) => {
        const x = 16 + i * (barW + gap);
        const h = (val / 100) * (canvas.height - offsetBottom - 12);
        const y = canvas.height - offsetBottom - h;
        const currentBarColor = barColors[i % barColors.length];

        // Capa de Brillo Neón Independiente por Barra
        ctx.save();
        ctx.shadowBlur = 8; 
        ctx.shadowColor = currentBarColor;
        ctx.fillStyle = currentBarColor;
        
        // Renderizado geométrico de la barra de energía
        ctx.fillRect(x, y, barW, h);
        ctx.restore();

        // Tipografías de identificación de los ejes (SKU/ID)
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "8px 'Share Tech Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`P${i+1}`, x + barW / 2, canvas.height - 4);
      });
    }

    render();
    
    // Auto-ajuste de resolución dinámica en caso de redimensionamiento de ventana
    window.addEventListener("resize", () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        render();
      }
    });
  }
})();
document.querySelectorAll('.btn-nav, .card-action-btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.filter = "brightness(1.2)";
  });
  el.addEventListener('mouseleave', () => {
    el.style.filter = "brightness(1)";
  });
});