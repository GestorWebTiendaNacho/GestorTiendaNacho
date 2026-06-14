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

/*----NUEVOS CODIGOS DE PRUEBA PARA NUEVA SECCIÓN DE PRUEBA----*/

        class TiltEffect {
            constructor() {
                this.cards = document.querySelectorAll('[data-tilt]');
                this.init();
            }

            init() {
                this.cards.forEach(card => {
                    card.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
                    card.addEventListener('mousemove', this.handleMouseMove.bind(this));
                    card.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
                });
            }

            handleMouseEnter(e) {
                e.target.style.transition = 'none';
            }

            handleMouseMove(e) {
                const card = e.target;
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                const rotateX = (mouseY / (rect.height / 2)) * -15;
                const rotateY = (mouseX / (rect.width / 2)) * 15;
                
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateZ(20px)
                `;
                
                const glowX = ((mouseX + rect.width / 2) / rect.width) * 100;
                const glowY = ((mouseY + rect.height / 2) / rect.height) * 100;
                
                card.style.background = `
                    radial-gradient(
                        circle at ${glowX}% ${glowY}%, 
                        rgba(255, 255, 255, 0.1) 0%, 
                        transparent 50%
                    ),
                    linear-gradient(135deg, #1a1f26, #0f1419)
                `;
            }

            handleMouseLeave(e) {
                const card = e.target;
                card.style.transition = 'all 0.3s ease';
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
                card.style.background = 'linear-gradient(135deg, #1a1f26, #0f1419)';
            }
        }

        class PulseEffect {
            constructor() {
                this.cards = document.querySelectorAll('.card');
                this.init();
            }

            init() {
                this.cards.forEach((card, index) => {
                    setTimeout(() => {
                        this.addPulse(card);
                    }, index * 100);
                });
            }

            addPulse(card) {
                card.addEventListener('click', () => {
                    card.style.animation = 'pulse 0.6s ease';
                    setTimeout(() => {
                        card.style.animation = '';
                    }, 600);
                });
            }
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('DOMContentLoaded', () => {
            new TiltEffect();
            new PulseEffect();
            
            const cards = document.querySelectorAll('.card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });

        class ParticleEffect {
            constructor() {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.particles = [];
                this.init();
            }

            init() {
                this.canvas.style.position = 'fixed';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.width = '100%';
                this.canvas.style.height = '100%';
                this.canvas.style.pointerEvents = 'none';
                this.canvas.style.zIndex = '-1';
                this.canvas.style.opacity = '0.3';
                
                document.body.appendChild(this.canvas);
                
                this.resize();
                this.createParticles();
                this.animate();
                
                window.addEventListener('resize', this.resize.bind(this));
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            createParticles() {
                for (let i = 0; i < 50; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 2 + 1
                    });
                }
            }

            animate() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.fill();
                });
                
                requestAnimationFrame(this.animate.bind(this));
            }
        }

        setTimeout(() => {
            new ParticleEffect();
        }, 1000);
