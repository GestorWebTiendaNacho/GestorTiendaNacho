
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

/*document.addEventListener('DOMContentLoaded', () => {

    const sidebarNav = document.getElementById('sidebarNav');
    
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.nav-item[data-accordion] .nav-btn');
            
            console.log("🎯 Clic detectado en Sidebar. Elemento real:", e.target);
            
            if (!toggleBtn) return;
            e.preventDefault();

            const item = toggleBtn.closest('.nav-item[data-accordion]');
            if (!item) return;

            const isOpen = item.classList.contains('is-open');
            const accordionItems = document.querySelectorAll('.nav-item[data-accordion]');

            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
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
                }, 250);
            }
        }, true); // Fase de captura para máxima prioridad
        
        console.log("✅ [HUD] Escuchador del Sidebar registrado con éxito.");
    } else {
        console.error("❌ [HUD Error] No se encontró el contenedor #sidebarNav en el DOM.");
    }
    try { initCircuitConnections(); } catch (err) { console.error("Fallo en initCircuitConnections:", err); }
    try { initParticles(); } catch (err) { console.error("Fallo en initParticles:", err); }
    try { initSparklines(); } catch (err) { console.error("Fallo en initSparklines:", err); }
    try { initMainBarChart(); } catch (err) { console.error("Fallo en initMainBarChart:", err); }
    try { initNavigation(); } catch (err) { console.error("Fallo en initNavigation:", err); }
    try { initHudClock(); } catch (err) { console.error("Fallo en initHudClock:", err); }
    try { initPagination(); } catch (err) { console.error("Fallo en initPagination:", err); }
});*/

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

    // Corregido: Obtenemos el alto real del listado interno estático, evitando el contenedor animado
    const totalHeight = subList.scrollHeight;
    if (totalHeight === 0) return;

    // Sincronizamos dimensiones con tu CSS (22px de ancho asignado)
    svg.setAttribute('viewBox', `0 0 22 ${totalHeight}`);

    // Extraemos el color dinámico del tema asignado en el CSS (.theme-cyan, .theme-orange, etc.)
    const themeColor = window.getComputedStyle(accordionItem).color || '#00f0ff';
    
    // Generamos un ID único para que el filtro de brillo no colisione con otros submenús
    const randomId = Math.random().toString(36).substr(2, 9);
    const filterId = `hudGlow-${randomId}`;

    // Mapeo exacto de los centros de los subbotones
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

    tick(); // Primera carga instantánea
    setInterval(tick, 1000); // Actualización cada 1 segundo
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
/**
 * Modifica el DOM de la Card 2 aplicando jerarquía de tamaños en color Naranja
 * @param {Object} datos - Objeto con posicion, producto y unidades
 */
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

/**
 * Función reservada para el modal extendido de productos
 */
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

/**
 * Genera la descarga local compatible con Excel para la matriz de Productos
 * @param {Array} matriz 
 */
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

/**
 * Renderiza el cuerpo de la Card sin aplicar parametrizaciones de formato
 */
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

/**
 * Despliega la terminal de reportes con matriz dinámica de 4 columnas (AE:AH)
 */
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

/**
 * Motor de descarga local nativo para la matriz de Pedidos
 */
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


// SECCION TABLA CENTRAL //
var listaProductosCriticos = [];
var paginaActualTabla = 1;
var filasPorPagina = 17;


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
      paginaActualTabla = 1;
      renderizarPaginaTabla();
      renderizarPaginador();
    }
  } catch (error) {
    console.error("❌ Error de enlace en panel de tabla central:", error);
  }
}


function renderizarPaginaTabla() {
  const tbody = document.querySelector('.table-panel .hud-table tbody');
  const badgeTotal = document.querySelector('.total-products-badge .badge-value');
  if (!tbody) return;

  tbody.innerHTML = "";
  
  if (badgeTotal) badgeTotal.textContent = listaProductosCriticos.length;

  const inicio = (paginaActualTabla - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const paginaItems = listaProductosCriticos.slice(inicio, fin);

  if (paginaItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:#a0aec0; font-family:monospace; padding:20px;">SISTEMA SIN ALERTAS ACTIVAS</td></tr>`;
    return;
  }

  paginaItems.forEach(item => {
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


function renderizarPaginador() {
  const contenedorPaginacion = document.querySelector('.table-panel .hud-pagination');
  if (!contenedorPaginacion) return;

  const totalPaginas = Math.ceil(listaProductosCriticos.length / filasPorPagina) || 1;
  contenedorPaginacion.innerHTML = "";

  const btnAnt = document.createElement('button');
  btnAnt.className = `pag-btn ${paginaActualTabla === 1 ? 'disabled' : ''}`;
  btnAnt.innerHTML = `<i class="fa-solid fa-angles-left"></i>`;
  btnAnt.addEventListener('click', () => { if (paginaActualTabla > 1) { paginaActualTabla--; actualizarInterfazTabla(); } });
  contenedorPaginacion.appendChild(btnAnt);

  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || (i >= paginaActualTabla - 1 && i <= paginaActualTabla + 1)) {
      const btnPag = document.createElement('button');
      btnPag.className = `pag-btn ${paginaActualTabla === i ? 'active' : ''}`;
      btnPag.textContent = i;
      btnPag.addEventListener('click', () => { paginaActualTabla = i; actualizarInterfazTabla(); });
      contenedorPaginacion.appendChild(btnPag);
    }
  }

  const btnSig = document.createElement('button');
  btnSig.className = `pag-btn ${paginaActualTabla === totalPaginas ? 'disabled' : ''}`;
  btnSig.innerHTML = `<i class="fa-solid fa-angles-right"></i>`;
  btnSig.addEventListener('click', () => { if (paginaActualTabla < totalPaginas) { paginaActualTabla++; actualizarInterfazTabla(); } });
  contenedorPaginacion.appendChild(btnSig);
}

function actualizarInterfazTabla() {
  renderizarPaginaTabla();
  renderizarPaginador();
}

function asignarEventosAccionTabla() {
  document.querySelectorAll('.btn-table-action').forEach(btn => {
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

let nombreArchivoCompras = "";

window.abrirModalCompras = function() {
    const modal = document.getElementById('modal-compras');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.cerrarModalCompras = function() {
    const modal = document.getElementById('modal-compras');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
    archivoVentasBase64 = null;
    nombreArchivoCompras = "";
    document.getElementById('input-archivo-compras').value = "";
    document.getElementById('label-archivo-compras').innerText = "Seleccionar Documento (.xlsx)";
    document.getElementById('btn-procesar-compras').disabled = true;
};

// CAPTURA Y CONVERSIÓN DEL ARCHIVO LOCAL A BASE64
window.manejarSeleccionArchivoCompras = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        document.getElementById('label-archivo-compras').innerText = `📄 Carga lista: ${file.name}`;
        document.getElementById('btn-procesar-compras').disabled = false;
    }
};

window.ejecutarProcesamientoCompras = function() {
    const inputArchivo = document.getElementById('input-archivo-compras'); 
    const archivoBlob = inputArchivo && inputArchivo.files[0] ? inputArchivo.files[0] : null;

    if (!archivoBlob) {
        console.error("🚨 No se encontró el archivo físico.");
        return;
    }
    
    const btnProcesar = document.getElementById('btn-procesar-compras');
    if (btnProcesar) btnProcesar.disabled = true; 

    const overlayCarga = document.getElementById('overlay-carga');
    if (overlayCarga) overlayCarga.style.display = 'flex';

    const textoOverlay = document.getElementById('texto-overlay-carga');
    if (textoOverlay) textoOverlay.innerText = "Subiendo bloques de datos crudos...";

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const nombreHoja = workbook.SheetNames[0];
            const hoja = workbook.Sheets[nombreHoja];
            
            // Convertimos la hoja a una matriz de datos pura
            const rawFilas = XLSX.utils.sheet_to_json(hoja, { header: 1 });
            const filasProcesadas = rawFilas.slice(1)
                .filter(fila => fila && fila[0] !== "" && fila[0] !== undefined)
                .map(fila => [
                    fila[0],                                 // Columna A: Fecha compra
                    fila[3] !== undefined ? fila[3] : "",    // Columna B: SKU
                    fila[4] !== undefined ? fila[4] : "",    // Columna C: Nombre
                    Math.abs(parseFloat(fila[5]) || 0)       // Columna D: Cantidad (Absoluto)
                ]);

            const totalFilas = filasProcesadas.length;
            const TAMANIO_BLOQUE = 5000;

            console.log(`[LexTech-Client] Total de filas útiles detectadas: ${totalFilas}. Iniciando envío...`);

            // ── PASO 1: SUBIDA DE BLOQUES (DATOS CRUDOS) ──
            for (let i = 0; i < totalFilas; i += TAMANIO_BLOQUE) {
                const bloque = filasProcesadas.slice(i, i + TAMANIO_BLOQUE);
                const esPrimerBloque = (i === 0);
                
                if (textoOverlay) {
                    textoOverlay.innerText = `Subiendo filas: ${i} de ${totalFilas}...`;
                }

                const respuesta = await fetch(URL_GAS_GLOBAL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'procesarBloqueComprass',
                        data: {
                            valores: bloque,
                            esPrimerBloque: esPrimerBloque,
                            indiceInicio: i
                        }
                    })
                });

                if (!respuesta.ok) {
                    throw new Error(`Error en el servidor en el bloque que inicia en la fila ${i}`);
                }
            }

            // ── PASO 2: DISPARO EXCLUSIVO DEL CÁLCULO DE PROMEDIOS ──
            console.log("[LexTech-Client] Todos los bloques fueron subidos. Iniciando consolidación de promedios...");
            if (textoOverlay) {
                textoOverlay.innerText = "Calculando promedios de los últimos 90 días... (No cierres la página)";
            }

            const respuestaConsolidacion = await fetch(URL_GAS_GLOBAL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    action: 'generarResumenPromedios90Dias' // Ejecuta la función del Paso 2 directamente
                })
            });

            if (!respuestaConsolidacion.ok) {
                throw new Error("El historial se subió, pero falló el cálculo estadístico de los 90 días.");
            }

            // Intentamos leer la respuesta del servidor para ver cuántos SKUs procesó
            let mensajeServidor = `Se cargaron con éxito las ${totalFilas} filas filtradas.`;
            try {
                const textoRespuesta = await respuestaConsolidacion.text();
                if (textoRespuesta) mensajeServidor += `\n\n${textoRespuesta}`;
            } catch (e) {
                console.warn("No se pudo leer el texto de respuesta del servidor", e);
            }

            // Apagamos el overlay de carga ya que todo terminó
            if (overlayCarga) overlayCarga.style.display = 'none';

            // Alerta de Éxito Absoluto
            Swal.fire({
                title: '🚀 PROCESAMIENTO COMPLETADO',
                text: mensajeServidor,
                icon: 'success',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#c2902e'
            });

            window.cerrarModalCompras();

        } catch (err) {
            console.error("🚨 Error procesando bloques:", err);
            if (overlayCarga) overlayCarga.style.display = 'none';
            
            Swal.fire({
                title: '❌ ERROR DE PROCESAMIENTO',
                text: err.message || 'Ocurrió un problema al fragmentar los datos.',
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
    Swal.fire({
        title: 'PROCESANDO CONSULTA',
        html: `Consultando <span style="color:#00f2fe">${valor}</span> en base <span style="color:#ff007f">${categoria}</span>...`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Petición ajustada a la arquitectura estricta de tu doPost
    fetch(URL_GAS_GLOBAL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            action: `consultar_${categoria}`, 
            data: { valor: valor } // ✨ CORREGIDO: Envuelto en 'data' para que GAS lo capture
        })
    })
    .then(response => response.json())
    .then(data => {
        Swal.close(); 
        
        if (data.status === "success") {
            mostrarModalProductos(categoria, valor, data.reply);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE CONEXIÓN',
                text: data.message
            });
        }
    })
    .catch(error => {
        Swal.close();
        console.error("Error en consulta:", error);
        Swal.fire({
            icon: 'error',
            title: 'ERROR DE RED',
            text: 'No se pudo conectar con la base de datos central.'
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