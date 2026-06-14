
document.addEventListener('DOMContentLoaded', () => {
    // Core Visual & Interactive initializers
    initCircuitConnections();
    initParticles();
    initSparklines();
    initMainBarChart();
    initNavigation();
    initHudClock();
    initPagination();
});

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
function initNavigation() {
    const accordionItems = document.querySelectorAll('[data-accordion]');
    if (!accordionItems.length) return;

    accordionItems.forEach(item => {
        const submenu = item.querySelector('.submenu');
        if (submenu && !item.classList.contains('is-open')) {
            submenu.style.maxHeight = '0px';
            submenu.style.display = 'block';
        }
    });

    function closeAccordionItem(item) {
        item.classList.remove('is-open');
        const submenu = item.querySelector('.submenu');
        const toggle = item.querySelector('[data-toggle]');
        if (submenu) {
            submenu.style.maxHeight = '0px';
        }
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    function openAccordionItem(item) {
        item.classList.add('is-open');
        const submenu = item.querySelector('.submenu');
        const toggle = item.querySelector('[data-toggle]');
        
        if (submenu) {
            submenu.style.maxHeight = 'none';
            const height = submenu.scrollHeight;
            submenu.style.maxHeight = '0px';
            
            submenu.offsetHeight; 

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    submenu.style.maxHeight = height + 'px';
                    drawConnectorLines(item);
                });
            });
        }
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    accordionItems.forEach(item => {
        const toggle = item.querySelector('[data-toggle]');
        if (!toggle) return;
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = item.classList.contains('is-open');
            accordionItems.forEach(other => {
                if (other !== item) closeAccordionItem(other);
            });
            
            if (isOpen) {
                closeAccordionItem(item);
            } else {
                openAccordionItem(item);
            }
        });
    });

    function drawConnectorLines(accordionItem) {
        const svg = accordionItem.querySelector('.submenu__lines');
        const subItems = accordionItem.querySelectorAll('.submenu__list > li');
        if (!svg || !subItems.length) return;
        
        const inner = accordionItem.querySelector('.submenu__inner');
        const svgHeight = inner.offsetHeight;
        const color = getComputedStyle(accordionItem).color;
        
        const rawId = svg.id || 'default';
        const filterId = 'nodeGlow-' + rawId.replace('lines-', '');
        const nodeX = 8; 
        const branchEnd = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sub-indent'), 10) || 18;
        
        svg.setAttribute('viewBox', `0 0 ${branchEnd + 4} ${svgHeight}`);
        svg.style.height = svgHeight + 'px';
        
        const centers = Array.from(subItems).map(li => li.offsetTop + li.offsetHeight / 2);
        const lastCenter = centers[centers.length - 1];
        
        let paths = `<line x1="${nodeX}" y1="0" x2="${nodeX}" y2="${lastCenter}" stroke="${color}" stroke-width="1" opacity="0.65"/>`;
        centers.forEach(cy => {
            const elbowX = nodeX + 6;
            paths += `<polyline points="${nodeX},${cy} ${elbowX},${cy} ${branchEnd},${cy}" fill="none" stroke="${color}" stroke-width="1" opacity="0.65"/>`;
            paths += `<circle cx="${nodeX}" cy="${cy}" r="2.5" fill="${color}" opacity="0.9" filter="url(#${filterId})"/>`;
            paths += `<circle cx="${branchEnd}" cy="${cy}" r="1.5" fill="${color}" opacity="0.75"/>`;
        });
        
        const glowDef = `<defs><filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter></defs>`;
        svg.innerHTML = glowDef + paths;
    }
}

/* Live HUD clock in top bar */
function initHudClock() {
    const el = document.getElementById('hudClock');
    if (!el) return;

    function tick() {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
    }
    tick();
    setInterval(tick, 1000);
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
