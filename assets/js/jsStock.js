(function() {
    if (window.jsStockCargado) {
        console.log("♻️ jsStock ya estaba en memoria. Reiniciando listeners...");
        return;
    }
    window.jsStockCargado = true;

    var CONFIG_UI = {
        colorGold: '#c2902e',
        colorBlue: '#00f2ff',
        colorRed: '#ff3131',
        bgDark: '#020617'
    };

    var intervalMonitor = null;

    $('.canvas-wrapper').addClass('active');

    /* MOTOR DE RENDERIZADO DE RELOJES */
    window.actualizarReloj = function(id, valor, titulo) {
        if (typeof RGraph === 'undefined') {
            console.warn("⚠️ RGraph no detectado.");
            return;
        }
        const canvas = document.getElementById(id);
        if (!canvas) return;

        if (valor > 0) canvas.style.display = 'block';
        
        canvas.width = 280;
        canvas.height = 280;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '9999';      
        canvas.style.backgroundColor = 'transparent';
          
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        RGraph.clear(canvas);
        RGraph.reset(canvas);
        
        const gauge = new RGraph.Gauge({
            id: id,
            min: 0,
            max: 100,
            value: valor,
            options: {
                marginLeft: 15, marginRight: 15, marginTop: 15, marginBottom: 15,
                titleTop: titulo,
                titleTopSize: 10,
                titleTopFont: 'Monospace',
                titleTopColor: '#94a3b8',
                titleTopPos: 0.25,
                titleBottom: Math.round(valor) + "%",
                titleBottomSize: 18,
                titleBottomFont: 'Impact',
                titleBottomColor: 'white',
                titleBottomPos: 0.7,
                labelsSpecific: ['0%', '25%', '50%', '75%', '100%'],
                colorsRanges: [[80, 90, '#ff3131'], [90, 100, '#00ff9d']],
                backgroundColor: 'rgba(0,0,0,0)',
                backgroundCanvas: 'rgba(0,0,0,0)', 
                faceColor: '#020617',
                variant: 'glass',
                centerpinColor: CONFIG_UI.colorGold,
                centerpinRadius: 8,
                needleSize: 65,
                needleColors: [CONFIG_UI.colorGold],
                borderOuter: 'rgba(0,0,0,0)', 
                borderInner: 'rgba(0,0,0,0)', 
                borderWidth: 0, 
                textColor: '#64748b',
                tickmarksLargeColor: CONFIG_UI.colorGold,
                tickmarksSmallColor: '#334155',
                adjustable: false,
                textAccessible: false
            }
        });
        gauge.draw();
    };

    /* LÓGICA DE CARGA INICIAL */
    // En SPA, a veces DOMContentLoaded ya pasó. Ejecutamos una verificación inmediata.
    function initPaginaStock() {
        if (document.getElementById('cvs_descarga')) {
            $('.logo-placeholder').show();
            $('#cvs_descarga, #cvs_impacto').hide();
            setTimeout(window.forzarRenderInicial, 500);
        }
    }

    // Ejecución inmediata e intento por evento
    initPaginaStock();
    document.addEventListener('DOMContentLoaded', initPaginaStock);

    window.forzarRenderInicial = function() {
        requestAnimationFrame(() => {
            window.actualizarReloj('cvs_descarga', 0, 'READY');
            window.actualizarReloj('cvs_impacto', 0, 'READY');
        });
    };

    /* MONITOR DE PROGRESO */
    function activarMonitorDeProgreso() {
        let simulacionCB = 0;
        let simulacionTN = 0;

        // Limpiamos cualquier intervalo previo para no duplicar procesos
        if(intervalMonitor) clearInterval(intervalMonitor);

        intervalMonitor = setInterval(async () => {
            try {
                const data = await callGoogleScript('get_progress');
                const progreso = data.reply; 
                
                if(!progreso) return;
                
                if (progreso.terminado) {
                    clearInterval(intervalMonitor);
                    window.actualizarReloj('cvs_impacto', 100, 'DONE');
                    setTimeout(() => finalizarVisualmente(progreso), 1000);
                    return;
                }

                if (progreso.fase === "DESCARGA") {
                    if (simulacionCB < 95) simulacionCB += 5;
                    window.actualizarReloj('cvs_descarga', simulacionCB, 'DESCARGANDO...');
                } else {
                    window.actualizarReloj('cvs_descarga', 100, 'DESCARGA OK');
                    if (simulacionTN < progreso.porcentaje) simulacionTN += 1;
                    window.actualizarReloj('cvs_impacto', simulacionTN, simulacionTN + '%');
                }

                document.getElementById('txt-procesados').textContent = progreso.procesados;
                document.getElementById('txt-faltantes').textContent = progreso.faltantes;
                document.getElementById('txt-time-real').textContent = progreso.tiempo;
                
            } catch (err) {
                console.warn("Sincronizando...");
            }
        }, 3000);
    }

    /*------- FUNCIÓN DE REPORTE FINAL -------*/
    function finalizarVisualmente(progreso) {
        log("✅ OPERATIVO FINALIZADO EXITOSAMENTE", "success");
        const modal = document.getElementById('modal-report');
        if (modal) {
            const total = (progreso.procesados || 0) + (progreso.faltantes || 0);
            document.getElementById('mdl-desc').textContent = total; 
            document.getElementById('mdl-proc').textContent = progreso.procesados; 
            document.getElementById('mdl-ign').textContent = progreso.faltantes;  
            document.getElementById('mdl-time').textContent = progreso.tiempo;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        resetUI();
    }

    function resetUI() {
        const btn = document.getElementById('btn-sync');
        const btnText = document.getElementById('btn-text');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
        }
        if (btnText) btnText.textContent = "EJECUTAR SINCRONIZACIÓN";
        $('#cvs_descarga, #cvs_impacto').fadeOut(400, function() {
            $('.logo-placeholder').fadeIn(400);
        });
    }

    window.cerrarModalReporte = function() {
        const modal = document.getElementById('modal-report');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        $('#cvs_descarga, #cvs_impacto').hide();
        $('.logo-placeholder').fadeIn();
        log(">>> SESIÓN FINALIZADA.", "info");
    };

    /* LOG DE TERMINAL */
    function log(mensaje, tipo = 'info') {
        const container = document.getElementById('log-container');
        if (!container) return;
        const entry = document.createElement('div');
        const ahora = new Date().toLocaleTimeString();
        let color = 'text-cyan-400';
        if (tipo === 'error') color = 'text-red-500';
        if (tipo === 'warn') color = 'text-amber-400';
        if (tipo === 'success') color = 'text-green-400';
        entry.className = `${color} mb-1 font-mono text-[11px] font-bold uppercase`;
        entry.innerHTML = `<span class="opacity-50">[${ahora}]</span> > ${mensaje}`;
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    }

    /*------- SINCRONIZACIÓN PRINCIPAL -------*/
    window.iniciarProceso = async function() {
        const btn = document.getElementById('btn-sync');
        if(btn) btn.disabled = true;
        
        log("🚀 INICIANDO SINCRONIZACIÓN GLOBAL...", "warn");
        
        $('.logo-placeholder').fadeOut(400, function() {
            $('#cvs_descarga').fadeIn(400);
            window.actualizarReloj('cvs_descarga', 0, 'CONECTANDO...');
        });

        try {
            await callGoogleScript('sync_stock');
            log("📡 ENLACE ESTABLECIDO CON GOOGLE CLOUD", "success");
            activarMonitorDeProgreso();
        } catch (err) {
            log("❌ ERROR CRÍTICO: " + err, "error");
            if(btn) btn.disabled = false;
        }
    };

    /*------- PROTOCOLO DE RESCATE -------*/
window.ejecutarProtocoloRescate = function() {
    if (typeof Swal === 'undefined') {
        alert("Protocolo de rescate activado. Revisar consola.");
        return;
    }
    
    Swal.fire({
        title: '⚠️ ¿ACTIVAR PROTOCOLO DE RESCATE?',
        text: "Se extraerá la base completa de Contabilium y se generará un Excel unificado.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'INICIAR EXTRACCIÓN',
        confirmButtonColor: '#ff3131',
        background: '#020617',
        color: '#fff'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const btn = document.getElementById('btn-panic');
            if(btn) btn.disabled = true;
            log("☢️ PROTOCOLO DE RESCATE INICIADO...", "error");
            log("⏳ La extracción puede tardar unos 3-4 minutos debido al volumen de datos...", "info");
            try {
                const data = await callGoogleScript('rescate_integral');
                
                // Extraemos la URL (recordá que en GAS pusimos: res = { url: ejecutarRescate() })
                const urlDescarga = data.reply.url;

                if(btn) btn.disabled = false;
                log("✅ EXTRACCIÓN EXITOSA", "success");

                // 1. Forzamos la descarga automática
                const tempLink = document.createElement('a');
                tempLink.href = urlDescarga;
                tempLink.target = '_blank';
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);

                // 2. Avisamos al usuario
                Swal.fire({
                    title: '¡RESCATE COMPLETADO!',
                    html: `El archivo se está descargando.<br><br><a href="${urlDescarga}" target="_blank" style="color:#c2902e; font-weight:bold;">[ SI NO DESCARGÓ, CLIC AQUÍ ]</a>`,
                    icon: 'success',
                    background: '#020617',
                    color: '#c2902e'
                });
            } catch (err) {
                if(btn) btn.disabled = false;
                log("❌ FALLO EN EL RESCATE: " + err, "error");
            }
        }
    });
};

    /*----- BACKUP CSV MASIVO -----------*/
window.crearBackupCSV = async function() {
    const btn = document.getElementById('btn-backup-emergencia');
    if(btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
    
    log(">>> 🚨 INICIANDO GENERACIÓN DE CSVs MASIVOS", "warn");
    
    try {
        const data = await callGoogleScript('descargar_stock_masivo');
        const urls = data.reply.urls; // Traemos el objeto con cb y tn

        if (data.status === "success" && urls) {
            log(`✅ CSVs GENERADOS. INICIANDO DESCARGA...`, "success");

            // Función interna para disparar descargas
            const dispararDescarga = (url) => {
                const a = document.createElement('a');
                a.href = url;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            // Disparamos ambas (el navegador puede pedir permiso para "múltiples descargas")
            dispararDescarga(urls.cb);
            
            // Pequeño delay para no saturar al navegador
            setTimeout(() => {
                dispararDescarga(urls.tn);
                log(`📦 ARCHIVOS CB Y TN ENVIADOS AL NAVEGADOR`, "success");
            }, 1000);

        } else {
            throw new Error(data.msj || "Error desconocido en el servidor");
        }

        setTimeout(() => {
            if(btn) { btn.disabled = false; btn.style.opacity = "1"; }
        }, 2000);

    } catch (err) {
        log("❌ FALLO CRÍTICO: " + err, "error");
        if(btn) { btn.disabled = false; btn.style.opacity = "1"; }
    }
};

})();