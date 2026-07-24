
console.log("🚨 [DIAGNÓSTICO 1] El archivo JavaScript se está leyendo correctamente.");
window.addEventListener('click', (e) => {
    console.log("💥 [DIAGNÓSTICO 2] ¡Clic global detectado en la página!");
    console.log("👉 Elemento exacto que recibió el impacto:", e.target);
    console.log("👉 Capas superiores (Path):", e.composedPath());
}, true);

// Verificar la existencia del Sidebar apenas el DOM responda
document.addEventListener('DOMContentLoaded', () => {
    const sb = document.getElementById('sidebarNav');
    console.log("🔍 [DIAGNÓSTICO 3] ¿Existe #sidebarNav?:", sb ? "SÍ ✅" : "NO ❌");
});


function initSidebarAccordion() {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) {
        console.warn("⚠️ [HUD] No se encontró el contenedor #sidebarNav en esta página.");
        return;
    }

    console.log("✅ [HUD] Inicializando acordeón único del Sidebar.");

    sidebarNav.addEventListener('click', (e) => {
        // Buscamos el botón interactivo del menú
        const toggleBtn = e.target.closest('.nav-item .nav-btn');
        if (!toggleBtn) return;

        const item = toggleBtn.closest('.nav-item');
        const hasSubmenu = item.querySelector('.submenu');

        // Si el botón no tiene submenú (es un link común), dejamos que prosiga normalmente
        if (!hasSubmenu) return;

        // Frenamos comportamiento nativo del botón/ancla
        e.preventDefault();

        const isOpen = item.classList.contains('is-open');
        const accordionItems = sidebarNav.querySelectorAll('.nav-item');

        // CERRAR LOS DEMÁS MENÚS ABIERTOS (Comportamiento acordeón)
        accordionItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.querySelector('.submenu')) {
                otherItem.classList.remove('is-open');
                const otherBtn = otherItem.querySelector('.nav-btn');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // TOGGLE: Abrir o cerrar el menú actual
        if (isOpen) {
            item.classList.remove('is-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
            item.classList.add('is-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
            
            // Disparador del SVG de líneas dinámicas con delay para esperar al render
            setTimeout(() => {
                if (typeof drawSubmenuLines === 'function') {
                    drawSubmenuLines(item);
                }
            }, 150);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarAccordion);
} else {
    initSidebarAccordion();
}

function initCircuitConnections() {
    const canvas = document.getElementById('connections');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrame;
    let tick = 0;

    const paths = [];

    function buildPaths() {
        paths.length = 0;
        const sidebar = document.getElementById('sidebarHud');
        if (!sidebar) return;

        const sidebarRect = sidebar.getBoundingClientRect();
        const originX = sidebarRect.right;
        const originY = sidebarRect.top + sidebarRect.height * 0.35;

        const targets = document.querySelectorAll('[data-connect]');
        targets.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            const targetX = rect.left;
            const targetY = rect.top + rect.height * 0.4;

            const midX = originX + (targetX - originX) * 0.35;
            paths.push({
                segments: [
                    { x: originX, y: originY + i * 8 },
                    { x: midX, y: originY + i * 8 },
                    { x: midX, y: targetY },
                    { x: targetX, y: targetY }
                ],
                color: i % 2 === 0 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 240, 255, 0.06)'
            });
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        tick += 0.015;

        paths.forEach((path, idx) => {
            const segs = path.segments;
            ctx.beginPath();
            ctx.moveTo(segs[0].x, segs[0].y);
            for (let i = 1; i < segs.length; i++) {
                ctx.lineTo(segs[i].x, segs[i].y);
            }
            ctx.strokeStyle = path.color;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Terminal node at origin
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(segs[0].x, segs[0].y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Animated pulse dot traveling along path
            const totalLen = calcPathLength(segs);
            const progress = ((tick * (0.3 + idx * 0.05)) % 1);
            const dot = pointOnPath(segs, progress);
            const alpha = 0.4 + Math.sin(tick * 3 + idx) * 0.3;

            ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Target node
            const last = segs[segs.length - 1];
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        animFrame = requestAnimationFrame(draw);
    }

    function calcPathLength(segs) {
        let len = 0;
        for (let i = 1; i < segs.length; i++) {
            len += Math.hypot(segs[i].x - segs[i - 1].x, segs[i].y - segs[i - 1].y);
        }
        return len;
    }

    function pointOnPath(segs, t) {
        const total = calcPathLength(segs);
        let traveled = t * total;
        for (let i = 1; i < segs.length; i++) {
            const segLen = Math.hypot(segs[i].x - segs[i - 1].x, segs[i].y - segs[i - 1].y);
            if (traveled <= segLen) {
                const ratio = traveled / segLen;
                return {
                    x: segs[i - 1].x + (segs[i].x - segs[i - 1].x) * ratio,
                    y: segs[i - 1].y + (segs[i].y - segs[i - 1].y) * ratio
                };
            }
            traveled -= segLen;
        }
        return segs[segs.length - 1];
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        buildPaths();
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    // Rebuild paths after layout settles
    setTimeout(buildPaths, 500);
}

function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const COUNT = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.3 + 0.05
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.04 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}

function initSparklines() {
    document.querySelectorAll('.spark-canvas').forEach(canvas => {
        const color = canvas.dataset.color || '#00f0ff';
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth || 200;
        canvas.height = 28;

        const ctx = canvas.getContext('2d');
        const points = Array.from({ length: 20 }, (_, i) =>
            8 + Math.sin(i * 0.6) * 6 + Math.random() * 4
        );

        const step = canvas.width / (points.length - 1);

        ctx.beginPath();
        points.forEach((p, i) => {
            const x = i * step;
            const y = canvas.height - p;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        fillGrad.addColorStop(0, hexToRgba(color, 0.15)); // Corregido: Ya no arrojará error de referencia
        fillGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        points.forEach((p, i) => {
            const x = i * step;
            const y = canvas.height - p;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
}

function hexToRgba(hex, alpha = 1) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initMainBarChart() {
    const canvas = document.getElementById('hudBarChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    const barGradient = ctx.createLinearGradient(0, 0, 0, 120);
    barGradient.addColorStop(0, '#00f0ff');
    barGradient.addColorStop(0.6, 'rgba(0, 180, 255, 0.6)');
    barGradient.addColorStop(1, 'rgba(168, 85, 247, 0.15)');

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['SKU-01', 'SKU-02', 'SKU-03', 'SKU-04', 'SKU-05', 'SKU-06', 'SKU-07', 'SKU-08', 'SKU-09', 'SKU-10'],
            datasets: [{
                label: 'UNIDADES',
                data: [340, 480, 410, 590, 680, 520, 910, 430, 840, 790],
                backgroundColor: barGradient,
                borderColor: '#00f0ff',
                borderWidth: 1,
                borderRadius: 3,
                barPercentage: 0.55,
                hoverBackgroundColor: '#00f0ff',
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1800,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(4, 11, 28, 0.9)',
                    borderColor: '#00f0ff',
                    borderWidth: 1,
                    titleFont: { family: 'Orbitron', size: 10 },
                    bodyFont: { family: 'Share Tech Mono', size: 11 },
                    titleColor: '#00f0ff',
                    bodyColor: '#ffffff',
                    padding: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Share Tech Mono', size: 9 },
                        maxRotation: 0
                    },
                    border: { color: 'rgba(0, 240, 255, 0.1)' }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                        drawTicks: false
                    },
                    border: { dash: [4, 4], color: 'rgba(0, 240, 255, 0.08)' },
                    min: 0,
                    max: 1000,
                    ticks: {
                        stepSize: 500,
                        color: '#64748b',
                        font: { family: 'Share Tech Mono', size: 9 },
                        callback: v => (v >= 1000 ? '1K' : v)
                    }
                }
            }
        }
    });
}

/* Sidebar navigation interactions */


function drawSubmenuLines(accordionItem) {
    const svg = accordionItem.querySelector('.submenu__lines');
    const innerContainer = accordionItem.querySelector('.submenu__inner');
    const subItems = accordionItem.querySelectorAll('.submenu__list > li');
    const subList = accordionItem.querySelector('.submenu__list');

    if (!svg || !innerContainer || !subItems.length || !subList) return;
    const totalHeight = subList.scrollHeight;
    if (totalHeight === 0) return;
    svg.setAttribute('viewBox', `0 0 22 ${totalHeight}`);
    const themeColor = window.getComputedStyle(accordionItem).color || '#00f0ff';
    const randomId = Math.random().toString(36).substr(2, 9);
    const filterId = `hudGlow-${randomId}`;
    const centers = Array.from(subItems).map(li => {
        return li.offsetTop + (li.offsetHeight / 2);
    });

    const lastCenter = centers[centers.length - 1];
    const trunkX = 5;
    const connectX = 12;

    let svgContent = `
        <defs>
            <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <line x1="${trunkX}" y1="0" x2="${trunkX}" y2="${lastCenter}" stroke="${themeColor}" stroke-width="1" opacity="0.3" />
    `;

    centers.forEach(y => {
        svgContent += `
            <line x1="${trunkX}" y1="${y}" x2="${connectX}" y2="${y}" stroke="${themeColor}" stroke-width="1" opacity="0.5" />
            <circle cx="${trunkX}" cy="${y}" r="2" fill="${themeColor}" filter="url(#${filterId})" />
            <circle cx="${connectX}" cy="${y}" r="1.5" fill="${themeColor}" />
        `;
    });

    svg.innerHTML = svgContent;
}

/* Live HUD clock in top bar */
function initHudClock() {
    const el = document.getElementById('hudClock');
    if (!el) return;

    function tick() {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: false 
        });
    }

    tick();
    setInterval(tick, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHudClock);
} else {
    initHudClock();
}

/* Table pagination active state */
function initPagination() {
    document.querySelectorAll('.hud-pagination .pag-btn').forEach(btn => {
        if (btn.textContent.trim().match(/^\d+$/)) {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hud-pagination .pag-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        }
    });
}

/*---SECCION CARDS KPIS---*/

//PROVEEDORES
async function cargarTopProveedorCard() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "obtenerTopProveedorDashboard"
      })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarTopProveedor(resultado.reply);
    } else {
      console.error("🚨 Error devuelto por GAS:", resultado.message);
    }
  } catch (error) {
    console.error("❌ Error de red al conectar con la API de GAS:", error);
  }
}

function renderizarTopProveedor(datos) {
  const contenedorValor = document.querySelector('.cyan-glow .card-value-container');
  
  if (!contenedorValor) {
    console.warn("⚠️ No se encontró el contenedor '.card-value-container' dentro de '.cyan-glow'.");
    return;
  }

  // Estructuramos el HTML interno: Posición y Unidades arriba (Grandes), Proveedor abajo (Chico)
  contenedorValor.style.display = "flex";
  contenedorValor.style.direction = "ltr"; 
  contenedorValor.style.flexDirection = "column";
  contenedorValor.style.gap = "4px";

  contenedorValor.innerHTML = `
    <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
      <span class="card-value" style="font-size: 1.5rem; font-weight: 600; color: #00f0ff; line-height: 1;">
        ${datos.posicion}
      </span>
      <span class="card-unit" style="font-size: 0.9rem; ont-weight: 600; color: #00f0ff; letter-spacing: 0.5px;">
        ${datos.proveedor}
      </span>
    </div>
    <div class="card-supplier-subtext" style="font-size: 0.85rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; margin-top: 2px;">
      
      ${datos.unidades.toLocaleString('es-AR')} UND.
    </div>
  `;
    const btnReporte = document.querySelector('.cyan-glow .hud-btn-action');
    if (btnReporte) {
        const btnNuevo = btnReporte.cloneNode(true);
        btnReporte.parentNode.replaceChild(btnNuevo, btnReporte);
        btnNuevo.addEventListener("click", abrirModalRankingProveedores);
    }
}

async function abrirModalRankingProveedores() {
  // Mostramos un loader intermitente estilo terminal mientras consulta a GAS
  Swal.fire({
    title: 'ACCEDIENDO AL SISTEMA...',
    html: '<div style="color: #00f0ff; font-family: monospace; letter-spacing: 2px;">CARGANDO MATRIZ DE PROVEEDORES...</div>',
    background: '#060d16',
    showConfirmButton: false,
    allowOutsideClick: false,
    willOpen: (modal) => {
      modal.style.zIndex = "999999";
      Swal.getPopup().style.border = "1px solid #00f0ff";
    }
  });

  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerRankingProveedores" })
    });

    const resultado = await respuesta.json();

    if (resultado.status !== "success") throw new Error(resultado.message);

    const matrizDatos = resultado.reply;
    if (matrizDatos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin registros', background: '#060d16', color: '#fff' });
      return;
    }

    // Extraemos la primera fila como encabezados y el resto como el cuerpo de la tabla
    const encabezados = matrizDatos[0];
    const filasData = matrizDatos.slice(1);

    // Construimos la tabla con estilos CSS inyectados directamente para el look Cyberpunk
    let tablaHTML = `
      <div style="overflow-x:auto; max-height: 400px; margin-top: 15px; border: 1px solid #1a2638;">
        <table id="tabla-ranking-export" style="width:100%; border-collapse:collapse; font-family:monospace; text-align:left; background-color:#08111c; color:#fff;">
          <thead>
            <tr style="background-color:#101f30; border-bottom:2px solid #00f0ff;">
              ${encabezados.map(h => `<th style="padding:12px; color:#00f0ff; font-weight:700; text-transform:uppercase;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filasData.map((fila, index) => `
              <tr style="border-bottom:1px solid #1a2638; background-color: ${index % 2 === 0 ? '#0b1623' : '#08111c'};">
                <td style="padding:10px; font-weight:bold; color:#00f0ff;">${fila[0]}</td>
                <td style="padding:10px; color:#e2e8f0;">${fila[1]}</td>
                <td style="padding:10px; color:#38bdf8; font-weight:bold;">${typeof fila[2] === 'number' ? fila[2].toLocaleString('es-AR') : fila[2]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Desplegamos el Swal definitivo
Swal.fire({
  title: '<span style="color:#ffffff; font-weight:800; letter-spacing:1px;">RANKING DE PROVEEDORES</span>',
  html: tablaHTML,
  background: 'transparent', // Permite que actúe el vidrio glassmorphic del CSS
  width: '750px',
  height: 'auto',
  showConfirmButton: true,
  showCancelButton: true,
  confirmButtonText: '<i class="fa-solid fa-file-excel"></i> EXPORTAR REPORTE',
  cancelButtonText: 'CERRAR REPORTE',
  customClass: {
    popup: 'swal-topprov',
    confirmButton: 'hud-btn-confirm-excel',
    cancelButton: 'hud-btn-cancel-custom'
  },
  buttonsStyling: false, 
  willOpen: (modal) => {
    modal.style.zIndex = "999999";
    
    const contenedorBackdrop = document.querySelector('.swal2-container');
    if (contenedorBackdrop) {
      contenedorBackdrop.style.backdropFilter = "blur(8px)";
      contenedorBackdrop.style.webkitBackdropFilter = "blur(8px)";
      contenedorBackdrop.style.backgroundColor = "rgba(2, 6, 12, 0.75)";
    }
  }
}).then((result) => {
  if (result.isConfirmed) {
    ejecutarDescargaLocalExcel(matrizDatos);
  }
});

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'ERROR DE ENLACE',
      text: err.toString(),
      background: '#060d16',
      color: '#fff',
      willOpen: (m) => m.style.zIndex = "999999"
    });
  }
}


function ejecutarDescargaLocalExcel(matriz) {
  let contenidoHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head>
    <body>
      <table border="1">
        ${matriz.map(fila => `
          <tr>${fila.map(celda => `<td>${celda}</td>`).join('')}</tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([contenidoHTML], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const linkDescarga = document.createElement("a");
  linkDescarga.href = url;
  linkDescarga.download = `Ranking_Proveedores_${new Date().toISOString().slice(0,10)}.xls`;
  
  document.body.appendChild(linkDescarga);
  linkDescarga.click();
  document.body.removeChild(linkDescarga);
  
  URL.revokeObjectURL(url);
  
  // Notificación HUD de éxito
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'REPORTE DESCARGADO',
    showConfirmButton: false,
    timer: 2500,
    background: '#060d16',
    color: '#00f0ff',
    willOpen: (m) => m.style.zIndex = "999999"
  });
}

async function cargarTopProductoCard() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "obtenerTopProductoDashboard"
      })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarTopProducto(resultado.reply);
    } else {
      console.error("🚨 Error devuelto por GAS (Card Producto):", resultado.message);
    }
  } catch (error) {
    console.error("❌ Error de red al conectar con la API de GAS (Card Producto):", error);
  }
}

//PRODUCTOS


function renderizarTopProducto(datos) {
  const contenedorValor = document.querySelector('.orange-glow .card-value-container');
  
  if (!contenedorValor) {
    console.warn("⚠️ No se encontró el contenedor '.card-value-container' dentro de '.orange-glow'.");
    return;
  }

  // Estructura idéntica de layouts reflexivos
  contenedorValor.style.display = "flex";
  contenedorValor.style.flexDirection = "column";
  contenedorValor.style.gap = "4px";

  contenedorValor.innerHTML = `
    <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
      <span class="card-value" style="font-size: 1.0rem; font-weight: 600; color: #ff9f00; line-height: 1;">
        ${datos.cantidad}
      </span>
      <span class="card-unit" style="font-size: 0.95rem; font-weight: 600; color: #ff9f00; letter-spacing: 0.5px;">
        ${datos.producto}
        
      </span>
    </div>
    <div class="card-product-subtext" style="font-size: 0.85rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; margin-top: 2px;">
      ${datos.unidades}
    </div>
  `;

  // Activación del botón para reportes extendidos de productos (Estructura lista)
  const btnReporte = document.querySelector('.orange-glow .hud-btn-action');
  if (btnReporte) {
    const btnNuevo = btnReporte.cloneNode(true);
    btnReporte.parentNode.replaceChild(btnNuevo, btnReporte);
    btnNuevo.addEventListener("click", abrirModalRankingProductos);
  }
}


async function abrirModalRankingProductos() {
  // Loader intermitente con look naranja
  Swal.fire({
    title: 'ACCEDIENDO AL SISTEMA...',
    html: '<div style="color: #ff9f00; font-family: monospace; letter-spacing: 2px;">CARGANDO MATRIZ DE VENTAS...</div>',
    background: '#060d16',
    showConfirmButton: false,
    allowOutsideClick: false,
    willOpen: (modal) => {
      modal.style.zIndex = "999999";
      Swal.getPopup().style.border = "1px solid #ff9f00";
    }
  });

  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerRankingProductos" })
    });

    const resultado = await respuesta.json();

    if (resultado.status !== "success") throw new Error(resultado.message);

    const matrizDatos = resultado.reply;
    if (matrizDatos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin registros', background: '#060d16', color: '#fff' });
      return;
    }

    // Tomamos la Fila 1 como los encabezados (O1:Q1) y el resto como el cuerpo de la tabla
    const encabezados = matrizDatos[0];
    const filasData = matrizDatos.slice(1);

    // Renderizado de tabla interna con acentos estéticos naranja
    let tablaHTML = `
      <div style="overflow-x:auto; max-height: 400px; margin-top: 15px; border: 1px solid #2d1f0b;">
        <table id="tabla-ventas-export" style="width:100%; border-collapse:collapse; font-family:monospace; text-align:left; background-color:#0c0a06; color:#fff;">
          <thead>
            <tr style="background-color:#1a1105;">
              ${encabezados.map(h => `<th style="padding:5px; font-weight:200; text-transform:uppercase; text-align:center;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filasData.map((fila, index) => `
              <tr style="border-bottom:1px solid #2d1f0b; background-color: ${index % 2 === 0 ? '#140f07' : '#0c0a06'};">
                <td style="padding:10px; font-weight:bold; color:#ff9f00;">${fila[0]}</td>
                <td style="padding:10px; color:#e2e8f0;">${fila[1]}</td>
                <td style="padding:10px; color:#ffa834; font-weight:bold;">${typeof fila[2] === 'number' ? fila[2].toLocaleString('es-AR') : fila[2]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Despliegue de SweetAlert2 Definitivo vinculando clases CSS externas
    Swal.fire({
      title: 'RANKING DE VENTAS',
      html: tablaHTML,
      width: 'auto',
      height: 'auto',
      background: 'transparent',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-file-excel"></i> EXPORTAR REPORTE',
      cancelButtonText: 'CERRAR REPORTE',
      customClass: {
        popup: 'swal-topventas',
        confirmButton: 'hud-btn-confirm-excel-orange',
        cancelButton: 'hud-btn-cancel-orange'
      },
      buttonsStyling: false,
      willOpen: (modal) => {
        modal.style.zIndex = "999999";
        
        const contenedorBackdrop = document.querySelector('.swal2-container');
        if (contenedorBackdrop) {
          contenedorBackdrop.style.backdropFilter = "blur(8px)";
          contenedorBackdrop.style.webkitBackdropFilter = "blur(8px)";
          contenedorBackdrop.style.backgroundColor = "rgba(2, 6, 12, 0.70)";
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        ejecutarDescargaLocalExcelProductos(matrizDatos);
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'ERROR DE ENLACE',
      text: err.toString(),
      background: '#060d16',
      color: '#fff',
      willOpen: (m) => m.style.zIndex = "999999"
    });
  }
}


function ejecutarDescargaLocalExcelProductos(matriz) {
  let contenidoHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head>
    <body>
      <table border="1">
        ${matriz.map(fila => `
          <tr>${fila.map(celda => `<td>${celda}</td>`).join('')}</tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([contenidoHTML], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const linkDescarga = document.createElement("a");
  linkDescarga.href = url;
  linkDescarga.download = `Ranking_Ventas_Productos_${new Date().toISOString().slice(0,10)}.xls`;
  
  document.body.appendChild(linkDescarga);
  linkDescarga.click();
  document.body.removeChild(linkDescarga);
  
  URL.revokeObjectURL(url);
  
  // Toast HUD de Éxito
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'REPORTE DE VENTAS DESCARGADO',
    showConfirmButton: false,
    timer: 2500,
    background: '#060d16',
    color: '#ff9f00',
    willOpen: (m) => m.style.zIndex = "999999"
  });
}

//PEDIDOS
async function cargarTopPedidosCard() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerCardPedidos" })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarTopPedidos(resultado.reply);
    }
  } catch (error) {
    console.error("❌ Error en Card Pedidos:", error);
  }
}


function renderizarTopPedidos(datos) {
  const contenedorValor = document.querySelector('.red-glow .card-value-container');
  if (!contenedorValor) return;

  /* Fila 0 = Títulos / Fila 1 = Valores del rango extraído
  const enc = matriz[0];
  const val = matriz[1];*/

  contenedorValor.style.display = "flex";
  contenedorValor.style.flexDirection = "column";
  contenedorValor.style.gap = "4px";

  // Volcado directo de datos respetando su formato de origen
  contenedorValor.innerHTML = `
    <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
      <span class="card-value" style="font-size: 1.0rem; font-weight: 600; color: #ff3c3c; line-height: 1;">
        ${datos.val1}
      </span>
      <span class="card-unit" style="font-size: 0.95rem; font-weight: 600; color: #ff3c3c; letter-spacing: 0.5px;">
        ${datos.val2}
      </span>
    </div>
    <div class="card-product-subtext" style="font-size: 0.85rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; margin-top: 2px;">
      ${datos.val3}
    </div>
  `;

  // Vinculamos el botón de acción al nuevo Modal Rojo
  const btnReporte = document.querySelector('.red-glow .hud-btn-action');
  if (btnReporte) {
    const btnNuevo = btnReporte.cloneNode(true);
    btnReporte.parentNode.replaceChild(btnNuevo, btnReporte);
    btnNuevo.addEventListener("click", abrirModalRankingPedidos);
  }
}


async function abrirModalRankingPedidos() {
  Swal.fire({
    title: 'ACCEDIENDO AL SISTEMA...',
    html: '<div style="color: #ff3c3c; font-family: monospace; letter-spacing: 2px;">CARGANDO MATRIZ DE PEDIDOS...</div>',
    background: '#060d16',
    showConfirmButton: false,
    allowOutsideClick: false,
    willOpen: (modal) => {
      modal.style.zIndex = "999999";
      Swal.getPopup().style.border = "1px solid #ff3c3c";
    }
  });

  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerRankingPedidos" })
    });

    const resultado = await respuesta.json();
    if (resultado.status !== "success") throw new Error(resultado.message);

    const matrizDatos = resultado.reply;
    if (matrizDatos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin registros', background: '#060d16', color: '#fff' });
      return;
    }

    const encabezados = matrizDatos[0];
    const filasData = matrizDatos.slice(1);

    // Tabla autogenerada por mapeo completo de columnas (Cero Hardcoding de celdas)
    let tablaHTML = `
      <div style="overflow-x:auto; max-height: 400px; margin-top: 15px; border: 1px solid #3c1414;">
        <table id="tabla-pedidos-export" style="width:100%; border-collapse:collapse; font-family:monospace; text-align:left; background-color:#0c0606; color:#fff;">
          <thead>
            <tr style="background-color:#1a0505;">
              ${encabezados.map(h => `<th style="padding:12px; font-weight:700; text-transform:uppercase;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filasData.map((fila, index) => `
              <tr style="border-bottom:1px solid #3c1414; background-color: ${index % 2 === 0 ? '#140707' : '#0c0606'};">
                ${fila.map((celda, cIdx) => `
                  <td style="padding:10px; ${cIdx === 0 ? 'color:#ff3c3c; font-weight:bold;' : 'color:#e2e8f0;'}">
                    ${celda}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: 'RANKING DE PEDIDOS',
      html: tablaHTML,
      width: 'auto',
      height: 'auto',
      background: 'transparent',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-file-excel"></i> EXPORTAR REPORTE',
      cancelButtonText: 'CERRAR REPORTE',
      customClass: {
        popup: 'swal-toppedidos',
        confirmButton: 'hud-btn-confirm-excel-red',
        cancelButton: 'hud-btn-cancel-red'
      },
      buttonsStyling: false,
      willOpen: (modal) => {
        modal.style.zIndex = "999999";
        const contenedorBackdrop = document.querySelector('.swal2-container');
        if (contenedorBackdrop) {
          contenedorBackdrop.style.backdropFilter = "blur(8px)";
          contenedorBackdrop.style.webkitBackdropFilter = "blur(8px)";
          contenedorBackdrop.style.backgroundColor = "rgba(2, 6, 12, 0.70)";
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        ejecutarDescargaLocalExcelPedidos(matrizDatos);
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'ERROR DE ENLACE',
      text: err.toString(),
      background: '#060d16',
      color: '#fff',
      willOpen: (m) => m.style.zIndex = "999999"
    });
  }
}


function ejecutarDescargaLocalExcelPedidos(matriz) {
  let contenidoHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head>
    <body>
      <table border="1">
        ${matriz.map(fila => `<tr>${fila.map(celda => `<td>${celda}</td>`).join('')}</tr>`).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([contenidoHTML], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const linkDescarga = document.createElement("a");
  linkDescarga.href = url;
  linkDescarga.download = `Ranking_Pedidos_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(linkDescarga);
  linkDescarga.click();
  document.body.removeChild(linkDescarga);
  URL.revokeObjectURL(url);

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'REPORTE DE PEDIDOS DESCARGADO',
    showConfirmButton: false,
    timer: 2500,
    background: '#060d16',
    color: '#ff3c3c',
    willOpen: (m) => m.style.zIndex = "999999"
  });
}


//MES
async function cargarEstadoMes() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerCardMensual" }) // Corregido: Apunta al objeto resumido
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarEstadoMes(resultado.reply);
    } else {
      console.error("🚨 Error devuelto por GAS (Card Mensual):", resultado.message);
    }
  } catch (error) {
    console.error("❌ Error en Card Estado Mes:", error);
  }
}


function renderizarEstadoMes(datos) {
  const contenedorValor = document.querySelector('.purple-glow .card-value-container');
  if (!contenedorValor) return;

  // Forzamos la conversión del decimal a Porcentaje (Ej: 0.754 -> 75,4%)
  let valorFormateado = datos.val1;
  const numeroEvaluar = Number(datos.val1);

  if (!isNaN(numeroEvaluar) && datos.val1 !== "") {
    valorFormateado = new Intl.NumberFormat('es-AR', {
      style: 'percent',
      minimumFractionDigits: 0, // No muestra decimales si es entero (Ej: 75%)
      maximumFractionDigits: 1  // Si tiene decimales, muestra máximo uno (Ej: 75,4%)
    }).format(numeroEvaluar);
  }

  contenedorValor.style.display = "flex";
  contenedorValor.style.flexDirection = "column";
  contenedorValor.style.gap = "4px";

  // Volcado en el contenedor con el porcentaje procesado
  contenedorValor.innerHTML = `
    <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
      <span class="card-value" style="font-size: 2.3rem; font-weight: 800; color: #c084fc; line-height: 1;">
        ${valorFormateado}
      </span>
      <span class="card-unit" style="font-size: 1.1rem; font-weight: 600; color: #ffffff; letter-spacing: 0.5px;">
        ${datos.val2}
      </span>
    </div>
  `;

  // Reenganche del botón de acción para el modal
  const btnReporte = document.querySelector('.purple-glow .hud-btn-action');
  if (btnReporte) {
    const btnNuevo = btnReporte.cloneNode(true);
    btnReporte.parentNode.replaceChild(btnNuevo, btnReporte);
    btnNuevo.addEventListener("click", abrirModalMensual);
  }
}


async function abrirModalMensual() {
  Swal.fire({
    title: 'ACCEDIENDO AL SISTEMA...',
    html: '<div style="color: #c084fc; font-family: monospace; letter-spacing: 2px;">CARGANDO ESTADO DEL MES...</div>',
    background: '#060d16',
    showConfirmButton: false,
    allowOutsideClick: false,
    willOpen: (modal) => {
      modal.style.zIndex = "999999";
      Swal.getPopup().style.border = "1px solid #c084fc";
    }
  });

  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerEstadoMes" }) // Llama a la matriz de filas
    });

    const resultado = await respuesta.json();
    if (resultado.status !== "success") throw new Error(resultado.message);

    const matrizDatos = resultado.reply;
    if (matrizDatos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin registros', background: '#060d16', color: '#fff' });
      return;
    }

    const encabezados = matrizDatos[0];
    const filasData = matrizDatos.slice(1);

    // Tabla autogenerada con bordes y fondos oscuros morados coordinados
    let tablaHTML = `
      <div style="overflow-x:auto; max-height: 400px; margin-top: 15px; border: 1px solid #2d0b3c;">
        <table id="tabla-mensual-export" style="width:100%; border-collapse:collapse; font-family:monospace; text-align:left; background-color:#09060c; color:#fff;">
          <thead>
            <tr style="background-color:#160524;">
              ${encabezados.map(h => `<th style="padding:12px; font-weight:700; text-transform:uppercase;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filasData.map((fila, index) => `
              <tr style="border-bottom:1px solid #2d0b3c; background-color: ${index % 2 === 0 ? '#14071e' : '#09060c'};">
                ${fila.map((celda, cIdx) => `
                  <td style="padding:10px; ${cIdx === 0 ? 'color:#c084fc; font-weight:bold;' : 'color:#e2e8f0;'}">
                    ${celda}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: 'ESTADO MENSUAL',
      html: tablaHTML,
      width: '800px', // Ancho fijo recomendado para contener 6 columnas cómodamente
      background: 'transparent',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-file-excel"></i> EXPORTAR REPORTE',
      cancelButtonText: 'CERRAR REPORTE',
      customClass: {
        popup: 'swal-estadomensual',
        confirmButton: 'hud-btn-confirm-excel-purple', // Corregido a nomenclatura purple
        cancelButton: 'hud-btn-cancel-purple'       // Corregido a nomenclatura purple
      },
      buttonsStyling: false,
      willOpen: (modal) => {
        modal.style.zIndex = "999999";
        const contenedorBackdrop = document.querySelector('.swal2-container');
        if (contenedorBackdrop) {
          contenedorBackdrop.style.backdropFilter = "blur(8px)";
          contenedorBackdrop.style.webkitBackdropFilter = "blur(8px)";
          contenedorBackdrop.style.backgroundColor = "rgba(2, 6, 12, 0.70)";
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        ejecutarDescargaLocalExcelMes(matrizDatos);
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'ERROR DE ENLACE',
      text: err.toString(),
      background: '#060d16',
      color: '#fff',
      willOpen: (m) => m.style.zIndex = "999999"
    });
  }
}


function ejecutarDescargaLocalExcelMes(matriz) {
  let contenidoHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head>
    <body>
      <table border="1">
        ${matriz.map(fila => `<tr>${fila.map(celda => `<td>${celda}</td>`).join('')}</tr>`).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([contenidoHTML], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const linkDescarga = document.createElement("a");
  linkDescarga.href = url;
  linkDescarga.download = `Estado_Mensual_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(linkDescarga);
  linkDescarga.click();
  document.body.removeChild(linkDescarga);
  URL.revokeObjectURL(url);

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'REPORTE MENSUAL DESCARGADO',
    showConfirmButton: false,
    timer: 2500,
    background: '#060d16',
    color: '#c084fc',
    willOpen: (m) => m.style.zIndex = "999999"
  });
}


// SECCION TABLA CRÍTICOS AHORA EN MODAL APARTE //
function abrirModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Al abrir el modal, cargamos automáticamente la tabla de críticos
        cargarTablaProductosCriticos();
    }
}

function cerrarModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

var listaProductosCriticos = [];

async function cargarTablaProductosCriticos() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerProductosCriticos" })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      listaProductosCriticos = resultado.reply;
      renderizarPaginaTablaCriticos();
    }
  } catch (error) {
    console.error("❌ Error de enlace en panel de críticos:", error);
  }
}

function renderizarPaginaTablaCriticos() {
  const tbody = document.querySelector('#modal-reportes-lex .hud-table tbody');
  const badgeTotal = document.querySelector('#modal-reportes-lex .total-products-badge .badge-value');
  if (!tbody) return;

  tbody.innerHTML = "";
  
  if (badgeTotal) badgeTotal.textContent = listaProductosCriticos.length;

  if (listaProductosCriticos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:#a0aec0; font-family:monospace; padding:20px;">SISTEMA SIN ALERTAS ACTIVAS</td></tr>`;
    return;
  }

  listaProductosCriticos.forEach(item => {
    let claseStock = '';
    if (item.stock < item.minimo) {
      claseStock = 'stock-critical';
    } else if (item.stock === item.minimo) {
      claseStock = 'stock-warning';
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.sku}</td>
      <td>${item.producto}</td>
      <td class="text-center ${claseStock}">${item.stock}</td>
      <td class="text-center">${item.minimo}</td>
      <td>${item.proveedor}</td>
      <td>${item.categoria}</td>
      <td>${item.promedio}</td>
      <td class="text-center">
        <button class="btn-table-action" data-sku="${item.sku}">
          PEDIR <i class="fa-solid fa-angles-right"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  asignarEventosAccionTabla();
}

function asignarEventosAccionTabla() {
  document.querySelectorAll('#modal-reportes-lex .btn-table-action').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });

  document.querySelectorAll('#modal-reportes-lex .btn-table-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const skuSeleccionado = e.currentTarget.getAttribute('data-sku');
      ejecutarAccionFilaProducto(skuSeleccionado);
    });
  });
}

function ejecutarAccionFilaProducto(sku) {
  console.log(`Abriendo traza de auditoría para el módulo de inventario. SKU objetivo: ${sku}`);
}

//  SECCION MINITABLA VENTAS //
async function cargarWidgetTopVendidos() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerTopVendidos" })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarMiniTablaWidget(resultado.reply);
    }
  } catch (error) {
    console.error("❌ Error al enlazar el Widget 1:", error);
    const contenedor = document.querySelector('[data-connect="widget1"] .card-value');
    if (contenedor) contenedor.textContent = "ERR_CONN";
  }
}

function renderizarMiniTablaWidget(payload) {
  const contenedorValue = document.querySelector('[data-connect="widget1"] .card-value');
  if (!contenedorValue) return;

  const encabezados = payload.headers;
  const filas = payload.items;

  if (filas.length === 0) {
    contenedorValue.innerHTML = `<span style="color: #a0aec0; font-size: 0.85em;">DATA EMPTY</span>`;
    return;
  }

  contenedorValue.style.color = "unset";
  contenedorValue.style.fontSize = "unset";

  let htmlTabla = `
    <div class="hud-mini-table-wrapper" style="width: 100%; margin: 10px 0 14px 0;">
      <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.8em; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255, 136, 0, 0.4); color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">
            <th style="padding: 4px 2px; font-weight: 600;">${encabezados[0]}</th>
            <th style="padding: 4px 2px; text-align: center; font-weight: 600;">${encabezados[1]}</th>
            <th style="padding: 4px 2px; text-align: right; font-weight: 600;">${encabezados[2]}</th>
          </tr>
        </thead>
        <tbody>
  `;

  filas.forEach(fila => {
    htmlTabla += `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;">
        <td style="padding: 6px 2px; color: #ff8800; font-weight: bold; white-space: nowrap; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
          ${fila.campo1}
        </td>
        <td style="padding: 6px 2px; text-align: center; color: #e4e8e3; font-weight: bold; white-space: nowrap; overflow: hidden; font-size: 0.8em; text-overflow: ellipsis; max-width: 75px;" title="${fila.campo2 || ''}">
          ${fila.campo2}
        </td>
        <td style="padding: 6px 2px; text-align: right; font-size: 0.8em; color: #ff8800;">
          ${typeof fila.campo3 === 'number' ? fila.campo3.toLocaleString() : fila.campo3}
        </td>
      </tr>
    `;
  });

  htmlTabla += `
        </tbody>
      </table>
    </div>
  `;

  contenedorValue.innerHTML = htmlTabla;
}

// SECCION MINI TABLA PEDIDOS //
async function cargarWidgetTopPedidos() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerTopPedidos" })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarMiniTablaWidget2(resultado.reply);
    }
  } catch (error) {
    console.error("❌ Error al enlazar el Widget 2:", error);
    const contenedor = document.querySelector('[data-connect="widget2"] .card-value');
    if (contenedor) contenedor.textContent = "ERR_CONN";
  }
}

function renderizarMiniTablaWidget2(payload) {
  const contenedorValue = document.querySelector('[data-connect="widget2"] .card-value');
  if (!contenedorValue) return;

  const encabezados = payload.headers;
  const filas = payload.items;

  if (filas.length === 0) {
    contenedorValue.innerHTML = `<span style="color: #a0aec0; font-size: 0.85em;">DATA EMPTY</span>`;
    return;
  }

  contenedorValue.style.color = "unset";
  contenedorValue.style.fontSize = "unset";

  let htmlTabla = `
    <div class="hud-mini-table-wrapper" style="width: 100%; margin: 10px 0 14px 0;">
      <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.8em; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255, 68, 68, 0.4); color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">
            <th style="padding: 4px 2px; font-weight: 600;">${encabezados[0]}</th>
            <th style="padding: 4px 2px; text-align: center; font-weight: 600;">${encabezados[1]}</th>
            <th style="padding: 4px 2px; text-align: right; font-weight: 600;">${encabezados[2]}</th>
          </tr>
        </thead>
        <tbody>
  `;

  filas.forEach(fila => {
    htmlTabla += `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;">
        <td style="padding: 6px 2px; color: #ff4444; font-weight: bold; white-space: nowrap; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
          ${fila.campo1}
        </td>
        <td style="padding: 6px 2px; text-align: center; color: #e4e8e3; font-weight: bold; white-space: nowrap; overflow: hidden; font-size: 0.8em; text-overflow: ellipsis; max-width: 75px;" title="${fila.campo2 || ''}">
          ${fila.campo2}
        </td>
        <td style="padding: 6px 2px; text-align: right; font-size: 0.8em; color: #ff4444;">
          ${typeof fila.campo3 === 'number' ? fila.campo3.toLocaleString() : fila.campo3}
        </td>
      </tr>
    `;
  });

  htmlTabla += `
        </tbody>
      </table>
    </div>
  `;
  contenedorValue.innerHTML = htmlTabla;
}


// SECCION MINI TABLE MENSUAL //
async function cargarWidgetMesActual() {
  try {
    const respuesta = await fetch(URL_GAS_GLOBAL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "obtenerDatosMesActual" })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      renderizarMiniTablaWidget3(resultado.reply);
    }
  } catch (error) {
    console.error("❌ Error al enlazar el Widget 3:", error);
    const contenedor = document.querySelector('[data-connect="widget3"] .card-value');
    if (contenedor) contenedor.textContent = "ERR_CONN";
  }
}

function renderizarMiniTablaWidget3(payload) {
  const contenedorValue = document.querySelector('[data-connect="widget3"] .card-value');
  if (!contenedorValue) return;

  const encabezados = payload.headers;
  const filas = payload.items;

  if (filas.length === 0) {
    contenedorValue.innerHTML = `<span style="color: #a0aec0; font-size: 0.85em;">DATA EMPTY</span>`;
    return;
  }

  contenedorValue.style.color = "unset";
  contenedorValue.style.fontSize = "unset";

  let htmlTabla = `
    <div class="hud-mini-table-wrapper" style="width: 100%; margin: 10px 0 14px 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.75em; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(189, 0, 255, 0.4); color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">
            <th style="padding: 4px 2px; font-weight: 600;">${encabezados[0]}</th>
            <th style="padding: 4px 2px; font-weight: 600;">${encabezados[1]}</th>
            <th style="padding: 4px 2px; text-align: center; font-weight: 600;">${encabezados[2]}</th>
            <th style="padding: 4px 2px; text-align: center; font-weight: 600;">${encabezados[3]}</th>
            <th style="padding: 4px 2px; text-align: center; font-weight: 600;">${encabezados[4]}</th>
            <th style="padding: 4px 2px; text-align: right; font-weight: 600;">${encabezados[5]}</th>
          </tr>
        </thead>
        <tbody>
  `;

  filas.forEach(fila => {
    htmlTabla += `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;">
        <td style="padding: 6px 2px; color: #bd00ff; font-size: 0.8em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55px;" title="${fila.campo1 || ''}">
          ${fila.campo1}
        </td>
        <td style="padding: 6px 2px; color: #e4e8e3; font-size: 0.8em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px;" title="${fila.campo2 || ''}">
          ${fila.campo2}
        </td>
        <td style="padding: 6px 2px; text-align: center; font-size: 0.8em; color: #4df53e; font-weight: bold;">
          ${fila.campo3}
        </td>
        <td style="padding: 6px 2px; text-align: center; font-size: 0.8em; color: #e4e8e3;">
          ${fila.campo4}
        </td>
        <td style="padding: 6px 2px; text-align: center; font-size: 0.8em; color: #e4e8e3;">
          ${fila.campo5}
        </td>
        <td style="padding: 6px 2px; text-align: right; color: #bd00ff; font-size: 0.8em; font-weight: bold;">
          ${typeof fila.campo6 === 'number' ? fila.campo6.toLocaleString() : fila.campo6}
        </td>
      </tr>
    `;
  });

  htmlTabla += `
        </tbody>
      </table>
    </div>
  `;
  contenedorValue.innerHTML = htmlTabla;
}

/*---Seccion COMPRAS --*/

var nombreArchivoCompras = "";
window.fechaLimiteCargada = null;

window.abrirModalCompras = function() {
    const modal = document.getElementById('modal-compras');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    actualizarFechaUltimaCarga();
};

window.cerrarModalCompras = function() {
    const modal = document.getElementById('modal-compras');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    nombreArchivoCompras = "";
    document.getElementById('input-archivo-compras').value = "";
    document.getElementById('label-archivo-compras').innerText = "Seleccionar Documento (.xlsx)";
    document.getElementById('btn-procesar-compras').disabled = true;
};

// CAPTURA Y VALIDACIÓN DEL ARCHIVO SELECCIONADO
if (!document.getElementById('swal-modal-fix')) {
    const style = document.createElement('style');
    style.id = 'swal-modal-fix';
    style.innerHTML = '.swal2-container { z-index: 999999 !important; }';
    document.head.appendChild(style);
}

var nombreArchivoCompras = ""; 

window.manejarSeleccionArchivoCompras = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        nombreArchivoCompras = file.name;
        document.getElementById('label-archivo-compras').innerText = `📄 Carga lista: ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' }); 
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const filasRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            window.filasConsolidadasFinales = filasRaw.filter(fila => fila && fila.length > 1).map(fila => {
                let dateObj = null;
                const valorFecha = fila[0];
                
                if (valorFecha !== undefined && valorFecha !== null) {
                    if (valorFecha instanceof Date) {
                        if (valorFecha.getUTCHours() === 0 && valorFecha.getUTCMinutes() === 0) {
                            dateObj = new Date(valorFecha.getUTCFullYear(), valorFecha.getUTCMonth(), valorFecha.getUTCDate(), 0, 0, 0, 0);
                        } else {
                            dateObj = new Date(valorFecha.getFullYear(), valorFecha.getMonth(), valorFecha.getDate(), 0, 0, 0, 0);
                        }
                    } 
                    // CORRECCIÓN AQUÍ: Procesamos correctamente el número serial de Excel
                    else if (!isNaN(valorFecha) && String(valorFecha).trim() !== "") {
                        const num = Number(valorFecha);
                        // Los días de Excel cuentan desde el 30/12/1899 debido a un bug histórico con el año bisiesto 1900
                        const fechaExcel = new Date((num - 25569) * 86400 * 1000);
                        dateObj = new Date(fechaExcel.getUTCFullYear(), fechaExcel.getUTCMonth(), fechaExcel.getUTCDate(), 0, 0, 0, 0);
                    } 
                    else {
                        const stringFecha = String(valorFecha).trim();
                        const partes = stringFecha.includes("-") ? stringFecha.split("-") : stringFecha.split("/");
                        
                        if (partes.length === 3) {
                            if (partes[0].length === 4) { // AAAA-MM-DD
                                dateObj = new Date(partes[0], partes[1] - 1, partes[2], 0, 0, 0, 0);
                            } else { // DD/MM/AAAA
                                dateObj = new Date(partes[2], partes[1] - 1, partes[0], 0, 0, 0, 0);
                            }
                        } else {
                            dateObj = new Date(stringFecha);
                            if (dateObj && !isNaN(dateObj)) dateObj.setHours(0, 0, 0, 0);
                        }
                    }
                }
                
                if (!dateObj || isNaN(dateObj.getTime())) {
                    dateObj = new Date(2000, 0, 1, 0, 0, 0, 0);
                }
                
                fila.dateObj = dateObj;
                return fila;
            });
            
            document.getElementById('btn-procesar-compras').disabled = false;
        };
        reader.readAsArrayBuffer(file);
    }
};

window.ejecutarProcesamientoCompras = async function() {
    const overlayCarga = document.getElementById('overlay-carga');
    const btnProcesar = document.getElementById('btn-procesar-compras');
    
    const datosOrigen = window.filasConsolidadasFinales || (typeof filasConsolidadasFinales !== 'undefined' ? filasConsolidadasFinales : null);

    if (!datosOrigen || !Array.isArray(datosOrigen)) {
        if (overlayCarga) overlayCarga.style.display = 'none';
        Swal.fire("Archivo no procesado", "No se encontraron datos en memoria. Selecciona el archivo de nuevo.", "warning");
        return;
    }
    
    if (overlayCarga) overlayCarga.style.display = 'flex';
    btnProcesar.disabled = true;

    try {
        const fechaSegura = (window.fechaLimiteCargada instanceof Date && !isNaN(window.fechaLimiteCargada)) 
                            ? window.fechaLimiteCargada 
                            : new Date(2000, 0, 1);
        fechaSegura.setHours(0, 0, 0, 0); 

        const filasFiltradas = datosOrigen.filter(item => {
            if (!item || !Array.isArray(item) || item.length === 0) return false;

            const primeraCelda = String(item[0] || "").toLowerCase().trim();
            if (primeraCelda === "fecha" || primeraCelda === "date" || primeraCelda.includes("encabezado")) {
                return false; 
            }

            if (!item.dateObj || isNaN(item.dateObj.getTime())) {
                return false;
            }

            return item.dateObj >= fechaSegura;
        });

        if (filasFiltradas.length === 0) {
            if (overlayCarga) overlayCarga.style.display = 'none';
            btnProcesar.disabled = false;
            Swal.fire("No hay datos nuevos", "No se encontraron registros que superen la fecha límite.", "info");
            return;
        }

        const agregador = {};
        filasFiltradas.forEach(fila => {
            const d = fila.dateObj;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const fechaKey = `${yyyy}${mm}${dd}`;
            
            const factura = String(fila[2] || "").trim();
            const codigo = String(fila[3] || "").trim();
            const nombre = String(fila[4] || "").trim();
            
            let celdaCantidad = fila[5];
            if (typeof celdaCantidad === 'string') {
                celdaCantidad = celdaCantidad.replace(/\./g, '').replace(',', '.');
            }
            const cantidad = parseFloat(celdaCantidad) || 0;

            const claveCompuesta = `${fechaKey}_${factura}_${codigo}`;

            if (!agregador[claveCompuesta]) {
                agregador[claveCompuesta] = {
                    dateObj: d,
                    factura: factura,
                    codigo: codigo,
                    nombre: nombre,
                    cantidad: 0
                };
            }
            agregador[claveCompuesta].cantidad += cantidad;
        });

        const filasConsolidadas = Object.values(agregador).filter(item => item.cantidad > 0);

        const mapaInvoices = {};
        const contadoresPorDia = {};

        filasConsolidadas.forEach(fila => {
            const factura = fila.factura || "SIN_FACTURA";
            const d = fila.dateObj;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const fechaKey = `${yyyy}${mm}${dd}`;
            const llaveAgrupacion = `${fechaKey}_${factura}`;
            
            if (!mapaInvoices[llaveAgrupacion]) {
                if (!contadoresPorDia[fechaKey]) {
                    contadoresPorDia[fechaKey] = 1;
                }
                const nroCorrelativo = String(contadoresPorDia[fechaKey]).padStart(4, '0');
                mapaInvoices[llaveAgrupacion] = `PED-${fechaKey}-${nroCorrelativo}`;
                contadoresPorDia[fechaKey]++;
            }
            
            fila.idPedidoGenerado = mapaInvoices[llaveAgrupacion];
        });

        const TAMANIO_BLOQUE = 2000;
        const totalFilas = filasConsolidadas.length;
        let baseRowGlobal = 0;

        for (let i = 0; i < totalFilas; i += TAMANIO_BLOQUE) {
            const bloque = filasConsolidadas.slice(i, i + TAMANIO_BLOQUE);
            
            const bloqueLimpio = bloque.map(fila => {
                const nuevaFila = Array(6).fill(""); 
                
                nuevaFila[0] = fila.idPedidoGenerado || "";
                
                if (fila.dateObj) {
                    const dia = String(fila.dateObj.getDate()).padStart(2, '0');
                    const mes = String(fila.dateObj.getMonth() + 1).padStart(2, '0');
                    const anio = fila.dateObj.getFullYear();
                    nuevaFila[1] = `${dia}/${mes}/${anio}`;
                }
                
                nuevaFila[2] = fila.factura;
                nuevaFila[3] = fila.codigo;
                nuevaFila[4] = fila.nombre;
                
                const partes = String(fila.cantidad).split('.');
                partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                nuevaFila[5] = partes.length > 1 ? partes.join(',') : partes[0];
                
                return nuevaFila;
            });

            const esPrimerBloque = (i === 0);
            const esUltimoBloque = (i + TAMANIO_BLOQUE >= totalFilas);

            const respuesta = await fetch(URL_GAS_GLOBAL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'procesarBloqueCompras',
                    data: {
                        valores: bloqueLimpio, 
                        esPrimerBloque: esPrimerBloque,
                        esUltimoBloque: esUltimoBloque,
                        indiceInicio: i,
                        baseRow: baseRowGlobal
                    }
                })
            });

            const resultado = await respuesta.json();
            if (resultado.status !== 'success') throw new Error(resultado.message);
            
            let respuestaInterna = resultado.reply;
            if (typeof respuestaInterna === 'string') {
                try { respuestaInterna = JSON.parse(respuestaInterna); } catch(e) {}
            }
            
            if (respuestaInterna && respuestaInterna.status === 'error') {
                throw new Error(respuestaInterna.message);
            }

            if (esPrimerBloque && respuestaInterna) {
                baseRowGlobal = respuestaInterna.baseRow !== undefined ? respuestaInterna.baseRow : 2;
            }
        }

        if (overlayCarga) overlayCarga.style.display = 'none';
        Swal.fire("Éxito", "Procesamiento completado. " + totalFilas + " registros consolidados e impactados.", "success");
        window.cerrarModalCompras();

    } catch (error) {
        if (overlayCarga) overlayCarga.style.display = 'none';
        Swal.fire("Error en la Operación", "El proceso falló: " + error.message, "error");
    } finally {
        btnProcesar.disabled = false;
    }
};

async function actualizarFechaUltimaCarga() {
    const elDisplay = document.getElementById('display-ultima-fecha');
    window.fechaLimiteCargada = new Date(2000, 0, 1);

    if (!elDisplay) return;

    try {
        elDisplay.innerText = "Consultando...";

        const respuesta = await fetch(URL_GAS_GLOBAL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'obtenerUltimaFecha' })
        });

        const resultado = await respuesta.json();
        const datos = (resultado.reply && resultado.reply.fecha) ? resultado.reply : resultado;

        if (datos && datos.status === 'success' && datos.fecha) {
            elDisplay.innerText = `Último registro en base: ${datos.fecha}`;
            const partes = datos.fecha.split("/");
            window.fechaLimiteCargada = new Date(partes[2], partes[1] - 1, partes[0]);
        } else {
            elDisplay.innerText = "Error al obtener fecha.";
        }
    } catch (err) {
        console.error("Error real detectado:", err); // Esto te mostrará en la consola del navegador si pasa algo más
        elDisplay.innerText = "Error de conexión.";
    }
}



// EJECUCIÓN DIRECTA //
cargarTopProveedorCard(); // Ejecución de Card 1
cargarTopProductoCard();  // Ejecución inmediata de Card 2
cargarTopPedidosCard();   // Ejecución inmediata de Card 3
cargarEstadoMes();   // Ejecución inmediata de Card 4
cargarTablaProductosCriticos(); //Carga de tabla central
cargarWidgetTopVendidos();
cargarWidgetTopPedidos();
cargarWidgetMesActual();


document.querySelectorAll('.card-inner-cyan, .card-inner-orange, .card-inner-red, .card-inner-purple').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty('--mx', `${x}%`);
    card.style.setProperty('--my', `${y}%`);
  });
});

function toggleHorizMenu(btn) {
    const currentDropdown = btn.nextElementSibling;
    
    document.querySelectorAll('.horiz-dropdown').forEach(dd => {
        if (dd !== currentDropdown) dd.classList.remove('is-active');
    });

    if (currentDropdown) {
        currentDropdown.classList.toggle('is-active');
    }
    const textoBoton = btn.textContent.toUpperCase().trim();
    if (textoBoton.includes("INSUMOS")) {
        cargarMenuDinamico("obtenerInsumos", "lista-insumos-dinamica");
    } else if (textoBoton.includes("HERRAMIENTAS")) {
        cargarMenuDinamico("obtenerHerramientas", "sm-herramientas");
    } else if (textoBoton.includes("TELAS")) {
        cargarMenuDinamico("obtenerTelas", "sm-telas", true);
    } else if (textoBoton.includes("HERRAJES")) {
        cargarMenuDinamico("obtenerHerrajes", "sm-herrajes");
    }
}

function toggleNestedMenu(event, btn) {
    event.stopPropagation(); 
    const nestedMenu = btn.nextElementSibling;
    if (nestedMenu) {
        nestedMenu.classList.toggle('hidden');
        if (!nestedMenu.classList.contains('hidden')) {
            cargarMenuDinamico("obtenerSimilcuero", "sm-simil-cuero");
        }
    }
}

// Cerrar menús si se hace click en cualquier otra parte de la pantalla
window.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-horiz-item')) {
        document.querySelectorAll('.horiz-dropdown').forEach(dd => dd.classList.remove('is-active'));
    }
});


function cargarMenuDinamico(actionName, containerId, esMenuTelas = false) {
    const listaContenedor = document.getElementById(containerId);
    if (!listaContenedor) return;

    // Estado de carga visual (Evita romper la estructura de TELAS)
    if (esMenuTelas) {
        listaContenedor.querySelectorAll('.item-dinamico-gas').forEach(el => el.remove());
        const liLoading = document.createElement("li");
        liLoading.className = "item-dinamico-gas";
        liLoading.innerHTML = "<a href='#'>Cargando...</a>";
        listaContenedor.appendChild(liLoading);
    } else {
        listaContenedor.innerHTML = "<li><a href='#'>Cargando...</a></li>";
    }

    // Petición única estructurada a la terminal LexTech de GAS
    fetch(URL_GAS_GLOBAL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: actionName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            renderizarMenuDinamico(data.reply, containerId, esMenuTelas);
        } else {
            console.error(`Error en backend (${actionName}):`, data.message);
        }
    })
    .catch(error => console.error(`Error de red en ${actionName}:`, error));
}

function renderizarMenuDinamico(elementos, containerId, esMenuTelas = false) {
    const listaContenedor = document.getElementById(containerId);
    if (!listaContenedor) return;

    if (esMenuTelas) {
        listaContenedor.querySelectorAll('.item-dinamico-gas').forEach(el => el.remove());
    } else {
        listaContenedor.innerHTML = "";
    }

    if (!elementos || elementos.length === 0) {
        const li = document.createElement("li");
        if (esMenuTelas) li.className = "item-dinamico-gas";
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = "No hay registros activos";
        li.appendChild(a);
        listaContenedor.appendChild(li);
        return;
    }

    elementos.forEach(item => {
        const li = document.createElement("li");
        if (esMenuTelas) li.className = "item-dinamico-gas";

        const a = document.createElement("a");
        a.href = "#";
        a.textContent = item;
        
        a.onclick = function(e) {
            e.preventDefault();
            
            listaContenedor.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            a.classList.add('active');
            
            let categoriaHoja = "";
            if (containerId === "lista-insumos-dinamica") categoriaHoja = "INSUMOS";
            else if (containerId === "sm-herramientas")  categoriaHoja = "HERRAMIENTAS";
            else if (containerId === "sm-telas")         categoriaHoja = "TELAS";
            else if (containerId === "sm-herrajes")      categoriaHoja = "HERRAJES";
            else if (containerId === "sm-simil-cuero")   categoriaHoja = "SIMILCUERO";
            
            if (categoriaHoja) {
                ejecutarConsultaCategoria(categoriaHoja, item);
            }
        };

        li.appendChild(a);
        listaContenedor.appendChild(li);
    });
}

function ejecutarConsultaCategoria(categoria, valor) {
    const overlayCarga = document.getElementById('overlay-carga');
    if (overlayCarga) {
        overlayCarga.style.display = 'flex'; 
    }

    fetch(URL_GAS_GLOBAL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            action: `consultar_${categoria}`, 
            data: { valor: valor } 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (overlayCarga) overlayCarga.style.display = 'none'; 
        
        if (data.status === "success") {
            mostrarModalProductos(categoria, valor, data.reply);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE CONEXIÓN',
                text: data.message,
                background: '#040b1c',
                color: '#cbd5e1',
                confirmButtonColor: '#ff007f'
            });
        }
    })
    .catch(error => {
        if (overlayCarga) overlayCarga.style.display = 'none';
        
        console.error("Error en consulta:", error);
        Swal.fire({
            icon: 'error',
            title: 'ERROR DE RED',
            text: 'No se pudo conectar con la base de datos central.',
            background: '#040b1c',
            color: '#cbd5e1',
            confirmButtonColor: '#ff007f'
        });
    });
}

function mostrarModalProductos(categoria, subcategoria, registros) {
    if (registros.length === 0) {
        Swal.fire({
            title: `CONSULTA: ${categoria} - ${subcategoria}`,
            text: "La consulta se ejecutó pero la planilla no retornó ningún producto para este criterio.",
            icon: "info"
        });
        return;
    }

    let htmlModal = `
    <div style="margin-bottom: 15px; display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid #00f2fe; padding: 8px 12px; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,242,254,0.1);">
        <span style="color: #00f2fe; margin-right: 10px; font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 1px;">⚡ FILTRAR TERMINAL:</span>
        <input type="text" id="swal-tabla-buscar" placeholder="Escribí cualquier coincidencia (SKU, Nombre, Proveedor...)" 
               style="background: transparent; border: none; color: #fff; width: 100%; outline: none; font-family: 'Share Tech Mono', monospace; font-size: 13px;">
    </div>

    <div style="overflow-x: auto; width: 100%; max-height: 55vh; border: 1px solid rgba(255,255,255,0.12); background: rgba(4, 11, 28, 0.4);">
        <table id="tabla-dinamica-hud" style="width: 100%; border-collapse: collapse; font-family: 'Share Tech Mono', monospace; text-align: left; font-size: 12px; color: #cbd5e1;">
            <thead>
                <tr style="background: rgba(0, 242, 254, 0.08); color: #fff; border-bottom: 2px solid #00f2fe;">
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">SKU</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">PRODUCTO</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10; text-align: right;">STOCK</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10; text-align: right;">MÍN</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">CATEGORÍA</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10; text-align: right;">PROM. VENTAS</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">ID PROV</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">PROVEEDOR</th>
                    <th style="padding: 12px 8px; position: sticky; top: 0; background: #040b1c; z-index: 10;">SUB CATEGORÍA</th>
                </tr>
            </thead>
            <tbody>
    `;

    registros.forEach(fila => {
        htmlModal += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);" onmouseover="this.style.background='rgba(0, 242, 254, 0.04)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
            <td style="padding: 10px 8px; color: #00f2fe; font-weight: bold;">${fila[0] || ''}</td>
            <td style="padding: 10px 8px; color: #fff;">${fila[1] || ''}</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: ${Number(fila[2]) <= Number(fila[3]) ? '#ff007f' : '#10b981'}">${fila[2] !== undefined ? fila[2] : ''}</td>
            <td style="padding: 10px 8px; text-align: right;">${fila[3] !== undefined ? fila[3] : ''}</td>
            <td style="padding: 10px 8px; color: #a1a1aa;">${fila[4] || ''}</td>
            <td style="padding: 10px 8px; text-align: right;">${fila[5] !== undefined ? fila[5] : ''}</td>
            <td style="padding: 10px 8px; color: #a1a1aa;">${fila[6] || ''}</td>
            <td style="padding: 10px 8px;">${fila[7] || ''}</td>
            <td style="padding: 10px 8px; color: #94a3b8;">${fila[8] || ''}</td>
        </tr>
        `;
    });

    htmlModal += `
            </tbody>
        </table>
    </div>
    `;

    Swal.fire({
        title: `<span style="font-family:'Orbitron',sans-serif; font-size:16px; letter-spacing:1px; color:#fff;">PANEL DE CONSULTA DE MATERIALES</span><br><span style="font-size:12px; color:#00f2fe; font-family:'Share Tech Mono';">${categoria} &gt; ${subcategoria}</span>`,
        html: htmlModal,
        width: '90%',
        background: '#040b1c',
        color: '#cbd5e1',
        confirmButtonText: 'CERRAR TERMINAL',
        confirmButtonColor: 'rgba(255,255,255,0.08)',
        customClass: {
            popup: 'hud-swal-border'
        },
        didOpen: () => {
            const container = Swal.getContainer();
            const popup = Swal.getPopup();

            if (container) {
                container.style.zIndex = '9999999'; 
                container.style.backdropFilter = 'blur(10px)';
                container.style.webkitBackdropFilter = 'blur(10px)';
                container.style.backgroundColor = 'rgba(4, 11, 28, 0.75)';
            }

            if (popup) {
                popup.style.border = '1px solid #00f2fe';
                popup.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.25)';
            }

            const inputBuscar = document.getElementById('swal-tabla-buscar');
            const filasTabla = popup.querySelectorAll('#tabla-dinamica-hud tbody tr');

            inputBuscar.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                filasTabla.forEach(row => {
                    const textoFila = row.textContent.toLowerCase();
                    row.style.display = textoFila.includes(term) ? '' : 'none';
                });
            });

            const headers = popup.querySelectorAll('#tabla-dinamica-hud thead th');
            const tbody = popup.querySelector('#tabla-dinamica-hud tbody');
            let columnaActiva = -1;
            let ordenAscendente = true;

            headers.forEach((th, index) => {
                th.style.cursor = 'pointer';
                th.style.userSelect = 'none';
                th.style.transition = 'color 0.2s';
                th.title = "Haga clic para ordenar columna";

                th.addEventListener('mouseenter', () => th.style.color = '#00f2fe');
                th.addEventListener('mouseleave', () => {
                    if (columnaActiva !== index) th.style.color = '#fff';
                });

                th.addEventListener('click', () => {
                    const filasArray = Array.from(tbody.querySelectorAll('tr'));

                    if (columnaActiva === index) {
                        ordenAscendente = !ordenAscendente;
                    } else {
                        columnaActiva = index;
                        ordenAscendente = true;
                    }

                    headers.forEach((h, idx) => {
                        h.innerHTML = h.innerHTML.replace(/ <span.*<\/span>/g, '');
                        if (idx !== index) h.style.color = '#fff';
                    });

                    th.style.color = '#00f2fe';
                    th.innerHTML += ` <span style="font-size:10px; color:#ff007f;">${ordenAscendente ? '▲' : '▼'}</span>`;

                    const esNumerico = [2, 3, 5].includes(index);

                    filasArray.sort((rowA, rowB) => {
                        const valA = rowA.children[index].textContent.trim();
                        const valB = rowB.children[index].textContent.trim();

                        if (esNumerico) {
                            const numA = parseFloat(valA) || 0;
                            const numB = parseFloat(valB) || 0;
                            return ordenAscendente ? numA - numB : numB - numA;
                        } else {
                            return ordenAscendente 
                                ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
                                : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                        }
                    });

                    filasArray.forEach(row => tbody.appendChild(row));
                });
            });
        }
    });
}

function initHeadbarAccordion() {
    const headbarNav = document.getElementById('headbarNav');
    if (!headbarNav) {
        console.warn("⚠️ [HUD] No se encontró el contenedor #headbarNav en esta interfaz.");
        return;
    }

    console.log("✅ [HUD] Inicializando acordeón independiente para Headbar Nav superior.");

    headbarNav.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.nav-item .nav-btn');
        if (!toggleBtn) return;
        const item = toggleBtn.closest('.nav-item');
        const hasSubmenu = item.querySelector('.submenu');
        if (!hasSubmenu) return;
        e.preventDefault();

        const isOpen = item.classList.contains('is-open');
        const accordionItems = headbarNav.querySelectorAll('.nav-item');
        accordionItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.querySelector('.submenu')) {
                otherItem.classList.remove('is-open');
                const otherBtn = otherItem.querySelector('.nav-btn');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            }
        });
        if (isOpen) {
            item.classList.remove('is-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
            item.classList.add('is-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
            setTimeout(() => {
                if (typeof drawSubmenuLines === 'function') {
                    drawSubmenuLines(item);
                }
            }, 150);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeadbarAccordion);
} else {
    initHeadbarAccordion();
}


/*-------------------SECCION DATOS SEMANALES------------------------------*/

var navegacionSemanal = {
    semanaActual: null,
    diaActual: null
};

var cacheTableroDeposito = {
    filas: [],
    semanasRelativas: []
};

const observadorInyeccion = new MutationObserver((mutations, observer) => {
    const contenedor = document.getElementById('contenido-reporte-lex');
    // Verificamos que exista el contenedor y que no haya sido inicializado todavía
    if (contenedor && !contenedor.dataset.inicializado) {
        contenedor.dataset.inicializado = "true";
        console.log("⚡ Contenedor inyectado detectado: Inicializando tablero semanal...");
        inicializarTableroSemanalDashboard();
        registrarEventosFiltrosGlobales();
    }
});

observadorInyeccion.observe(document.body, {
    childList: true,
    subtree: true
});

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById('contenido-reporte-lex');
    if (contenedor && !contenedor.dataset.inicializado) {
        contenedor.dataset.inicializado = "true";
        inicializarTableroSemanalDashboard();
        registrarEventosFiltrosGlobales();
    }
});

async function inicializarTableroSemanalDashboard() {
    console.log("🚩 INICIO: inicializarTableroSemanalDashboard");
    if (typeof mostrarCargandoLex === "function") mostrarCargandoLex(true);

    try {
        const mesSeleccionado = document.getElementById('filtro-mes-lex')?.value || '7';
        // const res = await callGoogleScript('obtenerDatosReporteSemanal', { mes: mesSeleccionado });
        const res = await callGoogleScript('obtenerDatosReporteSemanal');
        console.log("📦 Respuesta bruta recibida (Semanal):", res);
        
        let data = res?.reply?.reply || res?.reply || res;
        let filasRaw = data?.filas || (Array.isArray(data) ? data : []);
        let semanasRelativas = data?.semanasRelativas || [];

        if (filasRaw.length > 0 && (filasRaw[0]?.idprov === 'ID PROV' || filasRaw[0]?.[0] === 'ID PROV')) {
            filasRaw.shift();
        }

        const contenedor = document.getElementById('contenido-reporte-lex');
        if (filasRaw.length === 0) {
            if (contenedor) {
                contenedor.innerHTML = `<div class="text-slate-400 text-center py-10 font-mono text-xs uppercase tracking-wider">No hay datos disponibles para el reporte semanal.</div>`;
            }
            return;
        }

        if (typeof renderizarVistaMes === "function") {
            renderizarVistaMes({ filas: filasRaw, semanasRelativas: semanasRelativas });
        }

    } catch (err) {
        console.error("❌ ERROR CRÍTICO en inicializarTableroSemanalDashboard:", err);
        const contenedor = document.getElementById('contenido-reporte-lex');
        if (contenedor) {
            contenedor.innerHTML = `<div class="text-red-400 text-center py-10 font-mono text-xs uppercase tracking-wider">Error de conexión al cargar datos semanales.</div>`;
        }
    } finally {
        if (typeof mostrarCargandoLex === "function") mostrarCargandoLex(false);
    }
}

function renderizarVistaMes(data) {
    if (data) {
        cacheTableroDeposito.filas = data.filas || [];
        cacheTableroDeposito.semanasRelativas = data.semanasRelativas || [];
    }
    dibujarTableroCompleto();
}

function dibujarTableroCompleto() {
    const contenedor = document.getElementById('contenido-reporte-lex');
    if (!contenedor) return;

    const inputBuscador = document.getElementById('filtro-proveedor-lex');
    const filtroTexto = inputBuscador ? inputBuscador.value.trim().toLowerCase() : "";

    const semanas = cacheTableroDeposito.semanasRelativas;
    const filas = cacheTableroDeposito.filas;

    const proveedoresFiltrados = filas.filter(p => {
        const nombreProv = p.nombre ? String(p.nombre).trim().toLowerCase() : "";
        return normalizarTexto(nombreProv).includes(normalizarTexto(filtroTexto));
    });

    const kpiHtml = generarKpisDinamicos(proveedoresFiltrados, semanas.length);

    let tablaHtml = `
    <div class="lex-table-container">
        <table class="lex-table">
            <thead>
                <tr class="lex-tr-head bg-arena-dark">
                    <th class="lex-th sticky-arena">Proveedor</th>
    `;

    semanas.forEach((sem, idx) => {
        const esActual = esSemanaActual(sem);
        const thClass = esActual ? "lex-th text-center lex-th-highlight" : "lex-th text-center";
        
        const partes = sem.split(" ");
        const numeroSemana = partes[1] || (idx + 1);
        const fechaCorta = partes[2] ? partes[2].substring(0, 5) : "";

        tablaHtml += `
            <th class="${thClass}">
                Semana ${numeroSemana} ${esActual ? '<br><span class="text-[9px] text-blue-600 font-bold">(ACTUAL)</span>' : ''}
                <br>
                <span class="text-[10px] opacity-75 font-mono">${fechaCorta}</span>
            </th>
        `;
    });

    tablaHtml += `
                </tr>
            </thead>
            <tbody class="lex-tbody">
    `;

    if (proveedoresFiltrados.length === 0) {
        tablaHtml += `
            <tr class="lex-tr-row">
                <td colspan="${semanas.length + 1}" class="text-center py-10 text-slate-400 font-mono text-xs uppercase tracking-wider">
                    Sin proveedores coincidentes
                </td>
            </tr>
        `;
    } else {
        proveedoresFiltrados.forEach(prov => {
            const nombreLimpio = String(prov.nombre || '').trim();
            const idProv = prov.idprov;

            tablaHtml += `<tr class="lex-tr-row group">`;
            
            tablaHtml += `
                <td class="lex-td sticky-arena">
                    <span class="lex-prov-name">${nombreLimpio}</span>
                    <span class="lex-prov-id">ID_PROV: ${idProv}</span>
                </td>
            `;

            for (let i = 1; i <= semanas.length; i++) {
                const keySemana = `s${i}`;
                const valorEstado = prov[keySemana] !== undefined ? String(prov[keySemana]).trim() : '';

                const esCeldaActual = esSemanaActual(semanas[i - 1]);
                const tdClass = esCeldaActual ? "lex-td lex-td-highlight" : "lex-td text-center";

                tablaHtml += `<td class="${tdClass}">`;
                tablaHtml += obtenerHtmlEstadoCompacto(valorEstado, idProv, nombreLimpio, i);
                tablaHtml += `</td>`;
            }

            tablaHtml += `</tr>`;
        });
    }

    tablaHtml += `
            </tbody>
        </table>
    </div>
    `;

    contenedor.innerHTML = kpiHtml + tablaHtml;
    registrarEventosBuscador();
}

function obtenerHtmlEstadoCompacto(estado, idProv, nombreProv, numSemana) {
    if (!estado) {
        return `
            <button class="lex-btn-add" 
                    onclick="abrirModalNuevoPedido('${idProv}', '${escaparTexto(nombreProv)}', 'Semana ${numSemana}')"
                    aria-label="Agregar control para ${nombreProv}">
                +
            </button>
        `;
    }

    let bgColor = "#f1f5f9";      
    let borderColor = "#94a3b8";  
    let textColor = "#1e293b";    

    const estadoLower = estado.toLowerCase();

    if (estado.includes("🟢") || estadoLower.includes("ok")) {
        bgColor = "#ecfdf5";      
        borderColor = "#10b981";  
        textColor = "#064e3b";    
    } else if (estado.includes("🔴") || estadoLower.includes("pend")) {
        bgColor = "#fef2f2";      
        borderColor = "#ef4444";  
        textColor = "#7f1d1d";    
    } else if (estado.includes("⚠️") || estadoLower.includes("falta") || estadoLower.includes("pendiente")) {
        bgColor = "#fffbeb";      
        borderColor = "#f59e0b";  
        textColor = "#78350f";    
    }

    return `
        <div class="lex-card-pedido cursor-pointer" 
             onclick="abrirDetalleEstatus('${idProv}', 's${numSemana}')" 
             style="
                background-color: ${bgColor} !important; 
                border-left: 4px solid ${borderColor} !important; 
                color: ${textColor} !important; 
                padding: 4px 6px; 
                border-radius: 4px; 
                box-sizing: border-box;
                box-shadow: 0 1px 2px rgba(0,0,0,0.08); 
                transition: transform 0.1s ease-in-out; 
                text-align: center; 
                margin: 0 auto 2px auto; 
                min-width: 70px; 
                max-width: 95px;
                display: block;
             "
             onmouseover="this.style.transform='scale(1.02)'"
             onmouseout="this.style.transform='scale(1)'">
            <p class="lex-card-body" style="font-size: 9px; font-weight: 700; margin: 0; line-height: 1.15; color: ${textColor}; white-space: normal; word-break: break-word; text-align: center;">
                ${estado}
            </p>
        </div>
    `;
}

function generarKpisDinamicos(proveedores, cantSemanas) {
    let totales = 0;
    let listos = 0;
    let pendientes = 0;

    proveedores.forEach(p => {
        for (let i = 1; i <= cantSemanas; i++) {
            const estado = String(p[`s${i}`] || '').trim();
            if (estado) {
                totales++;
                if (estado.includes("🟢") || estado.toLowerCase().includes("ok")) {
                    listos++;
                } else if (estado.includes("🔴") || estado.includes("⚠️") || estado.toLowerCase().includes("falta") || estado.toLowerCase().includes("pend")) {
                    pendientes++;
                }
            }
        }
    });

    return `
    <div class="lex-kpi-container mb-5" style="display: flex; gap: 16px; margin-bottom: 20px;">
        <div class="lex-kpi-card bg-arpillera" style="flex: 1; padding: 12px 16px; border-radius: 8px; border-left: 5px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Proveedores</div>
            <div style="font-size: 24px; font-weight: 800; color: #1e293b; margin-top: 2px;">${totales}</div>
        </div>
        <div class="lex-kpi-card bg-arpillera" style="flex: 1; padding: 12px 16px; border-radius: 8px; border-left: 5px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Listos / OK</div>
            <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-top: 2px;">${listos}</div>
        </div>
        <div class="lex-kpi-card bg-arpillera" style="flex: 1; padding: 12px 16px; border-radius: 8px; border-left: 5px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Pendientes / Faltantes</div>
            <div style="font-size: 24px; font-weight: 800; color: #ef4444; margin-top: 2px;">${pendientes}</div>
        </div>
    </div>
    `;
}

function esSemanaActual(semanaStr) {
    if (!semanaStr) return false;
    const partes = semanaStr.split(" ");
    if (partes.length < 3) return false;
    
    const fechaStr = partes[2]; 
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    const lunesSemana = new Date(anio, mes - 1, dia);
    lunesSemana.setHours(0,0,0,0);

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const diaHoy = hoy.getDay();
    const diff = hoy.getDate() - diaHoy + (diaHoy === 0 ? -6 : 1);
    const lunesHoy = new Date(hoy.setDate(diff));
    lunesHoy.setHours(0,0,0,0);

    return lunesSemana.getTime() === lunesHoy.getTime();
}

function registrarEventosBuscador() {
    const inputBuscador = document.getElementById('filtro-proveedor-lex');
    if (inputBuscador && !inputBuscador.dataset.listenerSet) {
        inputBuscador.dataset.listenerSet = "true";
        inputBuscador.addEventListener('input', () => dibujarTableroCompleto());
    }
}

function registrarEventosFiltrosGlobales() {
    const selectMes = document.getElementById('filtro-mes-lex');
    if (selectMes && !selectMes.dataset.listenerSet) {
        selectMes.dataset.listenerSet = "true";
        selectMes.addEventListener('change', () => {
            console.log("Cambió el mes del filtro, recargando tablero...");
            inicializarTableroSemanalDashboard();
        });
    }
}

function normalizarTexto(txt) {
    return String(txt).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escaparTexto(txt) {
    return String(txt).replace(/'/g, "\\'").replace(/"/g, '\\"');
}


// Funciones de APERTURA DE PEDIDOS y DETALLES DE ESTATUS
function abrirModalNuevoPedido(idProv, nombreProv, semana) {
    console.log(`🆕 Abrir modal de nuevo control para ${nombreProv} en la ${semana}`);
    // Vinculá acá tu modal de carga existente
}

function abrirDetalleEstatus(idProv, claveSemana) {
    console.log(`🔍 Detalle de estatus para el proveedor ID: ${idProv} en ${claveSemana}`);
    // Vinculá acá la visualización detallada
}









/*---funciones pedidos manuales---*/
window.abrirModalPedidosManual = async function() {
    console.log("Cargando entorno de Pedidos Manuales...");
    const modal = document.getElementById('modal-pedidos');
    const contenido = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');
    
    if (!modal || !contenido || !titulo) return;
    
    contenido.innerHTML = "";
    window.carritoPedidos = []; 
    titulo.innerText = "SISTEMA DE PEDIDOS (MANUAL)";
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    
    // Loader integrado HUD
    contenido.innerHTML = `
        <div class="p-12 text-center flex flex-col items-center justify-center">
            <h3 class="mb-4 font-bold tracking-[3px] text-[11px] text-white" style="font-family: 'Share Tech Mono', monospace;">
                ESTABLECIENDO ENLACE CON MATRIZ MAESTRA...
            </h3>
            <div class="w-9 h-9 border-2 rounded-full animate-spin" 
                 style="border-color: rgba(0, 242, 254, 0.15); border-top-color: #00f2fe; box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);"></div>
        </div>`;

    try {
        const res = await callGoogleScript('obtenerListaProveedoresUnicos', {});
        console.log("📦 [Debug NICO] Respuesta completa de la API:", res);

        let lista = null;
        if (Array.isArray(res)) {
            lista = res;
        } else if (res && typeof res === 'object') {
            lista = res.data || res.reply || res.proveedores || res.lista;
            if (lista && typeof lista === 'object' && !Array.isArray(lista)) {
                lista = lista.data || lista.proveedores || Object.values(lista);
            }
        }

        if (Array.isArray(lista)) {
            let options = lista.map(p => {
                const nombre = p ? String(p).trim() : "";
                const nombreEscapado = nombre.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                return `<option value="${nombreEscapado}" style="background:#040b1c; color:#fff;">${nombreEscapado}</option>`;
            }).join('');

            contenido.innerHTML = `
                <div class="p-8 text-center max-w-xl mx-auto rounded border" 
                     style="background: rgba(0,0,0,0.2); border-color: rgba(0,242,254,0.15); box-shadow: inset 0 0 20px rgba(0,242,254,0.05); margin-top: 10vh;">
                    
                    <div class="flex justify-center gap-3 mb-6" style="font-family: 'Orbitron', sans-serif;">
                        <button id="btn-modo-prov" onclick="cambiarModoPedido('proveedor')" 
                            class="px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-cyan-950/40 text-[#00f2fe] border-[#00f2fe]/40 shadow-[0_0_10px_rgba(0,242,254,0.1)]">
                            POR PROVEEDOR
                        </button>
                        <button id="btn-modo-prod" onclick="cambiarModoPedido('producto')" 
                            class="px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700">
                            POR PRODUCTOS
                        </button>
                    </div>

                    <h3 id="pedido-seccion-titulo" class="mb-5 font-bold uppercase tracking-[4px] text-[11px]" 
                        style="color: #00f2fe; font-family: 'Orbitron', sans-serif;">
                        SELECCIONAR PROVEEDOR
                    </h3>
                    
                    <div class="flex flex-col items-center gap-5">

                        <nav id="nav-categorias-productos" class="hud-horizontal-nav hidden w-full justify-center">
                            <div class="nav-horiz-item theme-cyan">
                                <button class="nav-horiz-btn" onclick="toggleHorizMenu(this)">
                                    <span class="btn-text">INSUMOS</span>
                                    <span class="btn-chevron">▼</span>
                                </button>
                                <div class="horiz-dropdown">
                                    <ul id="lista-insumos-dinamica" class="horiz-submenu-list"></ul>
                                </div>
                            </div>

                            <div class="nav-horiz-item theme-orange">
                                <button class="nav-horiz-btn" onclick="toggleHorizMenu(this)">
                                    <span class="btn-text">HERRAMIENTAS</span>
                                    <span class="btn-chevron">▼</span>
                                </button>
                                <div class="horiz-dropdown">
                                    <ul class="horiz-submenu-list" id="sm-herramientas"></ul>
                                </div>
                            </div>

                            <div class="nav-horiz-item theme-pink">
                                <button class="nav-horiz-btn" onclick="toggleHorizMenu(this)">
                                    <span class="btn-text">TELAS</span>
                                    <span class="btn-chevron">▼</span>
                                </button>
                                <div class="horiz-dropdown">
                                    <ul class="horiz-submenu-list" id="sm-telas">
                                        <li class="nested-horiz-item">
                                            <button class="nested-horiz-btn" onclick="toggleNestedMenu(event, this)">
                                                <span>▶ SIMIL CUERO</span>
                                            </button>
                                            <ul class="nested-submenu-list hidden" id="sm-simil-cuero"></ul>
                                        </li>
                                        <li class="dropdown-divider"></li>
                                    </ul>
                                </div>
                            </div>

                            <div class="nav-horiz-item theme-purple">
                                <button class="nav-horiz-btn" onclick="toggleHorizMenu(this)">
                                    <span class="btn-text">HERRAJES</span>
                                    <span class="btn-chevron">▼</span>
                                </button>
                                <div class="horiz-dropdown">
                                    <ul class="horiz-submenu-list" id="sm-herrajes"></ul>
                                </div>
                            </div>
                        </nav>

                        <div id="wrapper-proveedor" class="flex flex-col items-center gap-5 w-full">
                            <select id="prov-seleccionado" class="text-white p-3 rounded w-72 outline-none text-xs tracking-wider transition-all"
                                    style="background: #040b1c; border: 1px solid rgba(0, 242, 254, 0.4); font-family: 'Share Tech Mono', monospace; box-shadow: 0 0 10px rgba(0,242,254,0.05);">
                                <option value="" style="background:#040b1c; color: rgba(255,255,255,0.3);">-- SELECCIONAR PROVEEDOR --</option>
                                ${options}
                            </select>
                            <button onclick="cargarProductosPorProveedor()" class="h-10 px-8 text-slate-950 font-black text-[10px] tracking-widest rounded transition-all duration-200 active:scale-95"
                                    style="background: #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.3); font-family: 'Orbitron', sans-serif;">
                                INICIALIZAR CATÁLOGO
                            </button>
                        </div>

                    </div>
                </div>`;
        } else {
            throw new Error("Formato de lista de proveedores no reconocido por la terminal.");
        }
    } catch (err) {
        console.error("❌ Error al pedir proveedores:", err);
        contenido.innerHTML = `
            <div class="p-6 border border-red-900/40 bg-red-950/10 rounded max-w-md mx-auto text-center font-mono" style="margin-top: 10vh;">
                <p class="text-red-400 text-[11px] tracking-widest font-bold">⚠️ CRITICAL_SYNC_FAILURE</p>
                <span class="text-slate-400 text-[10px] block mt-2 normal-case font-sans">${err.message}</span>
            </div>`;
    }
};

// FUNCIÓN PARA INTERCAMBIAR ENTRE ENTORNOS DE TRABAJO (Añadir globalmente)
window.cambiarModoPedido = function(modo) {
    const btnProv = document.getElementById('btn-modo-prov');
    const btnProd = document.getElementById('btn-modo-prod');
    const navCategorias = document.getElementById('nav-categorias-productos');
    const wrapperProveedor = document.getElementById('wrapper-proveedor');
    const seccionTitulo = document.getElementById('pedido-seccion-titulo');

    if (!btnProv || !btnProd || !navCategorias || !wrapperProveedor || !seccionTitulo) return;

    if (modo === 'proveedor') {
        seccionTitulo.innerText = "SELECCIONAR PROVEEDOR";
        wrapperProveedor.classList.remove('hidden');
        navCategorias.classList.add('hidden');
        navCategorias.classList.remove('flex');

        // Clases de Botón Activo para Proveedor
        btnProv.className = "px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-cyan-950/40 text-[#00f2fe] border-[#00f2fe]/40 shadow-[0_0_10px_rgba(0,242,254,0.1)]";
        // Clases de Botón Inactivo para Productos
        btnProd.className = "px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700";
    } else if (modo === 'producto') {
        seccionTitulo.innerText = "SELECCIONAR POR CATEGORÍA DE PRODUCTO";
        wrapperProveedor.classList.add('hidden');
        navCategorias.classList.remove('hidden');
        navCategorias.classList.add('flex');

        // Clases de Botón Activo para Productos
        btnProd.className = "px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-cyan-950/40 text-[#00f2fe] border-[#00f2fe]/40 shadow-[0_0_10px_rgba(0,242,254,0.1)]";
        // Clases de Botón Inactivo para Proveedor
        btnProv.className = "px-4 py-2 text-[10px] font-bold tracking-widest rounded border transition-all duration-200 bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700";
    }
};

async function cargarProductosPorProveedor() {
    const selector = document.getElementById('prov-seleccionado');
    const prov = selector ? selector.value.trim() : "";
    const contenedor = document.getElementById('modal-contenido');
    if (!contenedor) return;

    if (!prov) {
        if (window.Swal) {
            Swal.fire({
                title: 'AVISO DEL SISTEMA',
                text: 'Por favor, selecciona un canal de proveedor válido.',
                icon: 'info',
                background: '#040b1c',
                color: '#cbd5e1',
                confirmButtonColor: 'rgba(0,242,254,0.2)'
            });
        } else {
            alert("AVISO: Selecciona un proveedor");
        }
        return;
    }

    const overlay = document.getElementById('overlay-carga');
    if (overlay) {
        overlay.style.zIndex = "45000"; 
        overlay.style.display = 'flex';
    }

    try {
        const res = await callGoogleScript('obtenerTablaFiltrada', { 
            nombreHoja: 'baseProductos', 
            proveedorFiltro: prov 
        });
        
        if (!res) throw new Error("La consulta central retornó un canal vacío.");
        
        const listaBruta = (res.reply && res.reply.data) ? res.reply.data : (res.data || []);
        // Conservamos tu filtro de rotación real de salidas en los últimos 90 días
        const lista = listaBruta.filter(prod => parseInt(prod.ventas90Dias || 0) > 0);
        window.productosDelProveedorActual = lista; 

        if (lista.length > 0) {
            window.carritoPedidos = window.carritoPedidos || [];
            const todosMarcados = lista.every(p => window.carritoPedidos.some(item => String(item.id).trim() === String(p.id).trim()));
            
            let tablaHtml = `
                <div class="mb-4 p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-20 backdrop-blur shadow-xl"
                     style="background: rgba(4, 11, 28, 0.9); border-color: rgba(0, 242, 254, 0.25); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <div id="contador-items" class="text-[11px] text-slate-400 font-mono tracking-wider">
                        ITEMS INDEXADOS: <span class="text-[#00f2fe] font-bold bg-black/40 px-2 py-0.5 rounded border border-slate-800">${window.carritoPedidos.length}</span>
                    </div>
                    <div class="relative w-full sm:w-72">
                        <input type="text" id="buscador-productos" onkeyup="filtrarProductosMain()" 
                               placeholder="🔍 FILTRAR EN CONEXIÓN ACTIVA..." 
                               class="w-full bg-black/40 border p-2 pl-3 text-[11px] text-white rounded font-mono focus:border-[#00f2fe] outline-none placeholder-slate-600 transition-colors"
                               style="border-color: rgba(255,255,255,0.12);">
                    </div>
                    <button onclick="revisarPedido()" 
                            class="text-slate-950 hover:text-white text-[10px] font-black tracking-widest px-6 py-2 rounded transition-all uppercase duration-200 active:scale-95 w-full sm:w-auto"
                            style="background: #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.2); font-family: 'Orbitron', sans-serif;">
                        REVISAR ORDEN →
                    </button>
                </div>

                <div class="overflow-x-auto border rounded-lg mb-2" style="border-color: rgba(255,255,255,0.08); background: rgba(0,0,0,0.15);">
                    <table id="tabla-maestra-pedidos" class="w-full text-left border-collapse" style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #cbd5e1;">
                        <thead>
                            <tr style="background: rgba(0, 242, 254, 0.06); color: #fff; border-bottom: 2px solid #00f2fe;">
                                <th class="p-3 text-center w-[50px]">
                                    <input type="checkbox" id="master-check-productos" ${todosMarcados ? 'checked' : ''}
                                           onclick="toggleTodosProductos(this)"
                                           class="w-4 h-4 accent-[#00f2fe] cursor-pointer rounded bg-slate-900 border-slate-700">
                                </th>
                                <th class="p-3 w-[70px]">ID</th>
                                <th class="p-3">DESCRIPCIÓN DEL MATERIAL</th>
                                <th class="p-3 w-[110px]">SKU</th>
                                <th class="p-3 w-[90px] text-right">STOCK</th>
                                <th class="p-3 w-[100px] text-center" style="background: rgba(0,242,254,0.03); color: #00f2fe;">ROTACIÓN 90D</th>
                                <th class="p-3 w-[110px] text-right">VALOR UNIT.</th>
                                <th class="p-3 w-[90px] text-right">MÍNIMO</th>
                            </tr>
                        </thead>
                        <tbody id="body-pedidos" class="divide-y divide-slate-900/40">`;

            lista.forEach(prod => {
                const idStr = String(prod.id || "").trim();
                const nombreLimpio = String(prod.nombre || "").replace(/'/g, "").replace(/"/g, "");
                const skuLimpio = String(prod.sku || "").trim();
                const precioNum = parseFloat(prod.precio || 0);
                const stockNum = parseInt(prod.stock || 0);
                const stockMinNum = parseInt(prod.stockMinimo || 0);
                const ventas90Num = parseInt(prod.ventas90Dias || 0); 
                const alertarStock = stockNum <= stockMinNum;
                const yaSeleccionado = window.carritoPedidos.some(item => String(item.id).trim() === idStr);
                const checkedAttr = yaSeleccionado ? "checked" : "";
                
                // Mapeo dinámico de funciones de escape locales
                const fnEscapar = typeof escapingForOption === "function" ? escapingForOption : (s) => s.replace(/'/g, "\\'");

                tablaHtml += `
                    <tr style="background: rgba(0,0,0,0.15); border-bottom: 1px solid rgba(255,255,255,0.05);" 
                        class="transition-colors duration-150 ${yaSeleccionado ? 'hud-row-active' : ''}"
                        onmouseover="this.style.background='rgba(0, 242, 254, 0.03)'" 
                        onmouseout="this.style.background='${yaSeleccionado ? 'rgba(0, 242, 254, 0.05)' : 'rgba(0,0,0,0.15)'}'">
                        <td class="p-3 text-center">
                            <input type="checkbox" ${checkedAttr} data-id="${idStr}" class="row-checkbox w-4 h-4 accent-[#00f2fe] cursor-pointer" 
                                   onclick="toggleSeleccion(this, '${idStr}', '${nombreLimpio}', '${precioNum}', '${skuLimpio}', '${stockNum}', '${fnEscapar(prov)}', '${stockMinNum}')">
                        </td>
                        <td class="p-3 text-slate-500 font-bold">${idStr}</td>
                        <td class="p-3 text-white font-sans text-[12px] font-medium">${prod.nombre || "MATERIAL SIN IDENTIFICAR"}</td>
                        <td class="p-3 text-[#00f2fe] font-bold">${skuLimpio || "---"}</td>
                        <td class="p-3 text-right font-bold ${alertarStock ? 'text-[#ff007f]' : 'text-slate-300'}" style="${alertarStock ? 'text-shadow: 0 0 8px rgba(255,0,127,0.3);' : ''}">
                            ${stockNum}
                        </td>
                        <td class="p-3 text-center font-bold text-emerald-400" style="background: rgba(16, 185, 129, 0.02);">
                            ${ventas90Num} <span style="font-size: 9px; color: #52525b; font-weight: normal;">u.</span>
                        </td>
                        <td class="p-3 text-right font-bold text-emerald-400">$ ${precioNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td class="p-3 text-right text-slate-500">${stockMinNum}</td>
                    </tr>`;
            });
            
            tablaHtml += `</tbody></table></div>`;
            contenedor.innerHTML = tablaHtml;

            // Inyección de estilos CSS embebidos para el renglón activo en concordancia con Tailwind
            if(!document.getElementById('hud-table-styles')) {
                const style = document.createElement('style');
                style.id = 'hud-table-styles';
                style.innerHTML = `
                    .hud-row-active { background: rgba(0, 242, 254, 0.06) !important; border-left: 2px solid #00f2fe; }
                    .dataTables_wrapper .dataTables_paginate .paginate_button.current { background: rgba(0, 242, 254, 0.15) !important; color:#00f2fe !important; border: 1px solid #00f2fe !important; font-family:'Share Tech Mono'; font-size:11px; }
                    .dataTables_wrapper .dataTables_info { color: #71717a !important; font-family:'Share Tech Mono'; font-size:11px; padding-top: 10px; }
                `;
                document.head.appendChild(style);
            }

            // Inicializador de DataTables con acoplamiento HUD
            if (window.jQuery && $.fn.DataTable) {
                setTimeout(() => {
                    if ($.fn.DataTable.isDataTable('#tabla-maestra-pedidos')) {
                        $('#tabla-maestra-pedidos').DataTable().destroy();
                    }
                    $('#tabla-maestra-pedidos').DataTable({
                        "language": { "url": 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
                        "pageLength": 12,
                        "dom": 'rtip', 
                        "order": [[5, "desc"]], 
                        "autoWidth": false,
                        "columnDefs": [
                            { "targets": [0], "orderable": false }
                        ]
                    });
                }, 40);
            }

        } else {
            contenedor.innerHTML = `
                <div class="p-12 text-center border rounded-lg max-w-2xl mx-auto" style="border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.02); margin-top: 5vh;">
                    <p class="uppercase font-mono font-bold text-[11px] tracking-[3px]" style="color: #f59e0b;">SITUACIÓN: SIN ALERTAS CRÍTICAS</p>
                    <p class="text-slate-400 text-[11px] mt-2 font-sans">No se detectaron artículos del canal "${prov}" con salidas registradas en la ventana de los últimos 90 días.</p>
                </div>`;
        }
    } catch (err) {
        console.error("❌ Error en compilación de catálogo dirigido:", err);
        contenedor.innerHTML = `
            <div class="p-8 text-center border rounded-lg max-w-xl mx-auto font-mono text-[11px]" style="border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.03); margin-top:5vh;">
                <span class="text-red-400 font-bold block">CRITICAL_RENDER_ERROR</span>
                <span class="text-slate-400 block mt-2 font-sans normal-case">${err.message}</span>
            </div>`;
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
}

function toggleSeleccion(checkbox, id, nombre, precio, sku, stock, proveedor, stockMinimo) {
    window.carritoPedidos = window.carritoPedidos || [];
    const idFiltro = String(id).trim();
    const trPadre = checkbox.closest('tr');

    if (checkbox.checked) {
        if (!window.carritoPedidos.some(p => String(p.id).trim() === idFiltro)) {
            const stockAct = parseInt(stock || 0);
            const stockMin = parseInt(stockMinimo || 0);
            const cantidadSugerida = (stockMin - stockAct) > 0 ? (stockMin - stockAct) : 1;

            window.carritoPedidos.push({ 
                id: idFiltro, 
                nombre: nombre, 
                sku: sku, 
                precio: parseFloat(precio || 0), 
                stock: stockAct, 
                stockMinimo: stockMin, 
                proveedor: proveedor, 
                cantidad: cantidadSugerida
            });
        }
        if (trPadre) {
            trPadre.style.background = 'rgba(0, 242, 254, 0.06)';
            trPadre.classList.add('hud-row-active');
        }
    } else {
        window.carritoPedidos = window.carritoPedidos.filter(p => String(p.id).trim() !== idFiltro);
        if (trPadre) {
            trPadre.style.background = 'rgba(0,0,0,0.15)';
            trPadre.classList.remove('hud-row-active');
        }
    }
    actualizarContadorVisual();
}

function toggleTodosProductos(masterCheck) {
    if (!window.productosDelProveedorActual || window.productosDelProveedorActual.length === 0) return;
    window.carritoPedidos = window.carritoPedidos || [];
    
    const selector = document.getElementById('prov-seleccionado');
    const prov = selector ? selector.value.trim() : "";
    const checkboxesVisibles = document.querySelectorAll('.row-checkbox');

    if (masterCheck.checked) {
        window.productosDelProveedorActual.forEach(prod => {
            const idStr = String(prod.id || "").trim();
            const yaExiste = window.carritoPedidos.some(item => String(item.id).trim() === idStr);
            
            if (!yaExiste) {
                const stockAct = parseInt(prod.stock || 0);
                const stockMin = parseInt(prod.stockMinimo || 0);
                const cantidadSugerida = (stockMin - stockAct) > 0 ? (stockMin - stockAct) : 1;

                window.carritoPedidos.push({
                    id: idStr,
                    nombre: String(prod.nombre || "").replace(/'/g, "").replace(/"/g, ""),
                    precio: parseFloat(prod.precio || 0),
                    sku: String(prod.sku || "").trim(),
                    stock: stockAct,
                    proveedor: prov,
                    stockMinimo: stockMin,
                    amount: cantidadSugerida
                });
            }
        });

        checkboxesVisibles.forEach(cb => {
            cb.checked = true;
            const tr = cb.closest('tr');
            if (tr) {
                tr.style.background = 'rgba(0, 242, 254, 0.06)';
                tr.classList.add('hud-row-active');
            }
        });
    } else {
        window.productosDelProveedorActual.forEach(prod => {
            const idStr = String(prod.id || "").trim();
            window.carritoPedidos = window.carritoPedidos.filter(item => String(item.id).trim() !== idStr);
        });

        checkboxesVisibles.forEach(cb => {
            cb.checked = false;
            const tr = cb.closest('tr');
            if (tr) {
                tr.style.background = 'rgba(0,0,0,0.15)';
                tr.classList.remove('hud-row-active');
            }
        });
    }
    actualizarContadorVisual();
}

function actualizarContadorVisual() {
    const contador = document.getElementById('contador-items');
    if (contador) {
        const totalItems = window.carritoPedidos ? window.carritoPedidos.length : 0;
        contador.innerHTML = `ITEMS INDEXADOS: <span style="color: #00f2fe; font-weight: bold; background: rgba(0,0,0,0.4); padding: 2px 8px; border: 1px solid rgba(0,242,254,0.25); border-radius: 3px;">${totalItems}</span>`;
    }
}

function filtrarProductosMain() {
    const input = document.getElementById("buscador-productos");
    if (!input) return;
    const filtroText = input.value;
    
    if (window.jQuery && $.fn.DataTable && $.fn.DataTable.isDataTable('#tabla-maestra-pedidos')) {
        $('#tabla-maestra-pedidos').DataTable().search(filtroText).draw();
    } else {
        const tabla = document.getElementById("tabla-maestra-pedidos");
        if (!tabla) return;
        const tbody = tabla.getElementsByTagName("tbody")[0];
        if (!tbody) return;
        
        const filas = tbody.getElementsByTagName("tr");
        const normalizado = filtroText.toUpperCase();

        for (let i = 0; i < filas.length; i++) {
            let visible = false;
            const celdas = filas[i].getElementsByTagName("td");
            // Empezamos la iteración desde el índice 1 para omitir la celda del checkbox
            for (let j = 1; j < celdas.length; j++) {
                const textValue = celdas[j].textContent || celdas[j].innerText;
                if (textValue.toUpperCase().indexOf(normalizado) > -1) {
                    visible = true;
                    break;
                }
            }
            filas[i].style.display = visible ? "" : "none";
        }
    }
}

function cerrarModal_Pedidos() {
    const modal = document.getElementById('modal-pedidos');
    const contenido = document.getElementById('modal-contenido');
    const paginaDashboard = document.getElementById('page-dashboard') || document.getElementById('dashboard');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
    if (contenido) contenido.innerHTML = "";

    if (typeof navegar === "function") {
        navegar('dashboard'); 
    } else if (paginaDashboard) {
        paginaDashboard.style.display = 'flex';
    }
}

    /*---Seccion Ventas--*/

var nombreArchivoVentas = "";

// 1. ABRIR PANEL MODAL
window.abrirModalVenta = function() {
    const modal = document.getElementById('modal-ventas');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

// CERRAR PANEL MODAL Y REINICIAR ESTADOS DE SEGURIDAD
window.cerrarModalVenta = function() {
    const modal = document.getElementById('modal-ventas');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    // Hard Reset para evitar fugas de memoria o reprocesos accidentales
    archivoVentasBase64 = null;
    nombreArchivoVentas = "";
    document.getElementById('input-archivo-ventas').value = "";
    document.getElementById('label-archivo-ventas').innerText = "Seleccionar Documento (.xlsx)";
    document.getElementById('btn-procesar-ventas').disabled = true;
};

// CAPTURA Y CONVERSIÓN DEL ARCHIVO LOCAL A BASE64
window.manejarSeleccionArchivoVentas = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        document.getElementById('label-archivo-ventas').innerText = `📄 Carga lista: ${file.name}`;
        document.getElementById('btn-procesar-ventas').disabled = false;
    }
};

window.ejecutarProcesamientoVentas = function() {
    const inputArchivo = document.getElementById('input-archivo-ventas'); 
    const archivoBlob = inputArchivo && inputArchivo.files[0] ? inputArchivo.files[0] : null;

    if (!archivoBlob) {
        console.error("🚨 No se encontró el archivo físico.");
        return;
    }
    
    const btnProcesar = document.getElementById('btn-procesar-ventas');
    if (btnProcesar) btnProcesar.disabled = true; 

    const overlayCarga = document.getElementById('overlay-carga');
    if (overlayCarga) overlayCarga.style.display = 'flex';

    const textoOverlay = document.getElementById('texto-overlay-carga'); 
    if (textoOverlay) textoOverlay.innerText = "Verificando últimas actualizaciones...";

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const nombreHoja = workbook.SheetNames[0];
            const hoja = workbook.Sheets[nombreHoja];
            const rawFilas = XLSX.utils.sheet_to_json(hoja, { header: 1 });
            
            const filasCrudas = rawFilas.slice(1); 
            const totalFilasExcel = filasCrudas.length;

            const hoy = new Date();
            const hace180Dias = new Date();
            hace180Dias.setDate(hoy.getDate() - 180);

            const acumuladorMensual = {};
            const acumuladorPromedios = {};
            let maxFechaObj = null;
            let maxFechaRaw = "";

            // 1. Clasificación y Agrupación en el Cliente
            for (let i = 0; i < totalFilasExcel; i++) {
                const fila = filasCrudas[i];
                if (!fila || fila[0] === "" || fila[0] === undefined) continue;

                const fechaObj = parsearFechaCliente(fila[0]);
                if (!fechaObj) continue;
                if (fechaObj < hace180Dias || fechaObj > hoy) continue; 

                if (!maxFechaObj || fechaObj > maxFechaObj) {
                    maxFechaObj = fechaObj;
                    maxFechaRaw = fila[0];
                }

                const sku = fila[3] !== undefined ? String(fila[3]).trim() : "";
                if (!sku) continue; 

                const nombre = fila[4] !== undefined ? String(fila[4]).trim() : "";
                const cantidad = Math.abs(parseFloat(fila[5]) || 0);

                // Agrupación Mensual (FECHA | SKU | NOMBRE PROD | CANTIDAD)
                const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                const anio = fechaObj.getFullYear();
                const nombreMes = meses[fechaObj.getMonth()];

                const fechaMesString = `${nombreMes}-${anio}`;
                const keyMensual = `${nombreMes}-${anio}_${sku}`;

                if (!acumuladorMensual[keyMensual]) {
                    acumuladorMensual[keyMensual] = {
                        fecha: fechaMesString,
                        sku: sku,
                        nombre: nombre,
                        cantidad: 0
                    };
                }
                acumuladorMensual[keyMensual].cantidad += cantidad;

                // Agrupación para Promedios (SKU | NOMBRE PROD)
                if (!acumuladorPromedios[sku]) {
                    acumuladorPromedios[sku] = {
                        nombre: nombre,
                        totalCantidad: 0
                    };
                }
                acumuladorPromedios[sku].totalCantidad += cantidad;
            }

            if (!maxFechaObj) {
                throw new Error("No se encontraron registros de ventas en el rango de los últimos 180 días.");
            }

            // Formatear fecha máxima del Excel
            let ultimaActualizacionString = "";
            if (maxFechaRaw instanceof Date) {
                const pad = (num) => String(num).padStart(2, '0');
                ultimaActualizacionString = `${pad(maxFechaRaw.getDate())}/${pad(maxFechaRaw.getMonth() + 1)}/${maxFechaRaw.getFullYear()} ${pad(maxFechaRaw.getHours())}:${pad(maxFechaRaw.getMinutes())}`;
            } else {
                ultimaActualizacionString = String(maxFechaRaw).trim();
            }

            // 2. Control de duplicados (Comparar con última fecha del servidor)
            let ultimaFechaServidor = "";
            try {
                const resFecha = await fetch(URL_GAS_GLOBAL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'obtenerUltimaFecha' })
                });
                if (resFecha.ok) {
                    const textRes = await resFecha.text();
                    try {
                        const jsonRes = JSON.parse(textRes);
                        ultimaFechaServidor = jsonRes.data || jsonRes.result || textRes;
                    } catch {
                        ultimaFechaServidor = textRes;
                    }
                }
            } catch (e) {
                console.warn("⚠️ No se pudo verificar la última actualización previa:", e);
            }

            if (ultimaFechaServidor) {
                const ultimaFechaServidorObj = parsearFechaCliente(ultimaFechaServidor);
                if (ultimaFechaServidorObj && maxFechaObj && maxFechaObj <= ultimaFechaServidorObj) {
                    if (overlayCarga) overlayCarga.style.display = 'none';
                    Swal.fire({
                        title: '📅 DATOS AL DÍA',
                        text: `El reporte no contiene ventas nuevas. La última actualización ya registrada es del ${ultimaActualizacionString}.`,
                        icon: 'info',
                        background: '#0f172a',
                        color: '#fff',
                        confirmButtonColor: '#c2902e'
                    });
                    if (btnProcesar) btnProcesar.disabled = false;
                    return;
                }
            }

            // 3. Estructurar matrices finales
            const filasMensuales = Object.values(acumuladorMensual).map(item => [
                item.fecha,
                item.sku,
                item.nombre,
                Number(item.cantidad.toFixed(2))
            ]);

            const filasPromedios = [];
            for (const sku in acumuladorPromedios) {
                const item = acumuladorPromedios[sku];
                const promedioCalculado = item.totalCantidad / 180;
                const promedioDiario = (promedioCalculado >= 0.6 ? 1 : 0).toFixed(2);
                filasPromedios.push([
                    sku,
                    item.nombre,
                    Number(promedioDiario)
                ]);
            }

            if (textoOverlay) textoOverlay.innerText = "Subiendo datos finales a Google Sheets...";

            // 4. Enviar un único Payload con toda la información
            const respuesta = await fetch(URL_GAS_GLOBAL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'procesarBloqueVentas',
                    data: {
                        valoresMensuales: filasMensuales,
                        valoresPromedios: filasPromedios,
                        ultimaActualizacion: ultimaActualizacionString
                    }
                })
            });

            if (!respuesta.ok) throw new Error("Error en la conexión con el servidor GAS.");

            if (overlayCarga) overlayCarga.style.display = 'none';

            Swal.fire({
                title: '🚀 PROCESAMIENTO COMPLETADO',
                text: `Se cargaron ${filasMensuales.length} registros mensuales y se actualizaron los promedios de los últimos 180 días para ${filasPromedios.length} SKUs.`,
                icon: 'success',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#c2902e'
            });

            window.cerrarModalVenta();

        } catch (err) {
            console.error("🚨 Error:", err);
            if (overlayCarga) overlayCarga.style.display = 'none';
            Swal.fire({
                title: '❌ ERROR DE PROCESAMIENTO',
                text: err.message || 'Ocurrió un problema.',
                icon: 'error',
                background: '#0f172a',
                color: '#fff'
            });
            if (btnProcesar) btnProcesar.disabled = false;
        } finally {
            if (inputArchivo) inputArchivo.value = "";
        }
    };
    reader.readAsArrayBuffer(archivoBlob);
};

function parsearFechaCliente(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return valor;
    
    if (typeof valor === 'number') {
        return new Date((valor - 25569) * 86400 * 1000);
    }

    const texto = String(valor).trim();
    const partes = texto.split(" ");
    const fechaParte = partes[0];
    const horaParte = partes[1] || "00:00:00";
    
    const hms = horaParte.split(":");
    const horas = parseInt(hms[0], 10) || 0;
    const minutos = parseInt(hms[1], 10) || 0;
    const segundos = parseInt(hms[2], 10) || 0;

    const dmy = fechaParte.split("/");
    if (dmy.length === 3) {
        const dia = parseInt(dmy[0], 10);
        const mes = parseInt(dmy[1], 10) - 1;
        const anio = parseInt(dmy[2], 10);
        return new Date(anio, mes, dia, horas, minutos, segundos);
    }

    const dmyHyphen = fechaParte.split("-");
    if (dmyHyphen.length === 3) {
        if (dmyHyphen[0].length === 4) { // yyyy-mm-dd
            const anio = parseInt(dmyHyphen[0], 10);
            const mes = parseInt(dmyHyphen[1], 10) - 1;
            const dia = parseInt(dmyHyphen[2], 10);
            return new Date(anio, mes, dia, horas, minutos, segundos);
        } else { // dd-mm-yyyy
            const dia = parseInt(dmyHyphen[0], 10);
            const mes = parseInt(dmyHyphen[1], 10) - 1;
            const anio = parseInt(dmyHyphen[2], 10);
            return new Date(anio, mes, dia, horas, minutos, segundos);
        }
    }

    const d = new Date(texto);
    return isNaN(d.getTime()) ? null : d;
}

function formatearFechaAString(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear();
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
}