document.addEventListener("DOMContentLoaded", () => {
    // 1. INICIALIZACIÓN DE LÍNEAS DE FONDO ESTILO CIRCUITO HUD
    initCircuitBackground();
    
    // 2. INICIALIZACIÓN DE MINI GRÁFICOS (SPARKELINES) EN LAS TARJETAS
    initSparklines();
    
    // 3. GENERACIÓN DEL GRÁFICO PRINCIPAL DE BARRAS DE NEÓN (CANTIDAD PROD. VENDIDOS)
    initMainBarChart();
});

/**
 * Genera líneas de conexión estáticas de 45° y 90° emulando un plano electrónico
 */
function initCircuitBackground() {
    const canvas = document.getElementById('connections');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawCircuitLines();
    }

    function drawCircuitLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
        ctx.lineWidth = 1.5;
        
        // Estructura de líneas fijas basadas en el diseño HUD
        const nodes = [
            {x: 250, y: 50, tx: 300, ty: 50},
            {x: 250, y: 150, tx: 280, ty: 180},
            {x: 500, y: 340, tx: 550, ty: 340},
            {x: 800, y: 200, tx: 850, ty: 150},
            {x: 100, y: 600, tx: 150, ty: 650}
        ];

        nodes.forEach(node => {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node.tx, node.ty);
            ctx.stroke();
            
            // Dibujar pequeños nodos de terminales circulares
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

/**
 * Dibuja telemetría matemática simplificada en los contenedores KPI superiores
 */
function initSparklines() {
    const canvases = document.querySelectorAll('.spark-canvas');
    
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const color = canvas.getAttribute('data-color') || '#00f0ff';
        
        // Ajustar resolución interna del elemento Canvas
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 25;

        // Dataset aleatorio controlado para emular fluctuación en tiempo real
        const points = Array.from({length: 15}, () => Math.floor(Math.random() * 18) + 4);
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        
        const step = canvas.width / (points.length - 1);
        
        points.forEach((p, i) => {
            const x = i * step;
            const y = canvas.height - p;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    });
}

/**
 * Inicializa el gráfico de barras "CANTIDAD DE PROD. VENDIDOS"
 */
function initMainBarChart() {
    const ctxBar = document.getElementById('hudBarChart');
    if (!ctxBar) return;

    // Inyección de degradados nativos del Canvas HTML5
    const ctx = ctxBar.getContext('2d');
    const gradientNeon = ctx.createLinearGradient(0, 0, 0, 100);
    gradientNeon.addColorStop(0, '#00f0ff');
    gradientNeon.addColorStop(1, 'rgba(168, 85, 247, 0.2)');

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['SKU-01', 'SKU-02', 'SKU-03', 'SKU-04', 'SKU-05', 'SKU-06', 'SKU-07', 'SKU-08', 'SKU-09', 'SKU-10'],
            datasets: [{
                label: 'UNIDADES',
                data: [340, 480, 410, 590, 680, 520, 910, 430, 840, 790],
                backgroundColor: gradientNeon,
                borderColor: '#00f0ff',
                borderWidth: 1,
                borderRadius: 2,
                barPercentage: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Share Tech Mono', size: 10 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                        drawTicks: false
                    },
                    border: { dash: [4, 4] },
                    min: 0,
                    max: 1000,
                    ticks: {
                        stepSize: 500,
                        color: '#64748b',
                        font: { family: 'Share Tech Mono', size: 10 }
                    }
                }
            }
        }
    });
}