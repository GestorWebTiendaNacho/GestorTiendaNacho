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
      const result = await Swal.fire({
        title: '🚨 PROTOCOLO DE EMERGENCIA',
        text: 'Se disparará la descarga del stock masivo y se generarán dos archivos en formato .csv (CB y TN). ¿Deseas continuar con el proceso?',
        icon: 'warning',
        background: '#0f172a', 
        color: '#ffffff',      
        showCancelButton: true,
        confirmButtonColor: '#c2902e',   
        cancelButtonColor: '#475569',   
        confirmButtonText: 'SÍ, INICIAR',
        cancelButtonText: 'CANCELAR',
        heightAuto: false                
    });

    if (!result.isConfirmed) {
        if (typeof log === "function") {
            log("🚫 Descarga de emergencia cancelada por el usuario.", "info");
        }
        return;
    }
    const btn = document.getElementById('btn-backup-emergencia');
    if(btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
    
    log(">>> 🚨 INICIANDO PROTOCOLO DE EMERGENCIA", "warn");
    
    try {
        const data = await callGoogleScript('descargar_stock_masivo');
        
        if (data.status === "success" && data.reply && data.reply.urls) {
            const urls = data.reply.urls;
            log(`✅ PROCESO EXITOSO. PREPARANDO ARCHIVOS...`, "success");
            const ejecutarDescargaReal = (url, nombre) => {
                if (!url || !url.includes('drive.google.com')) {
                    log(`❌ ERROR EN ${nombre}: ${url}`, "error");
                    return;
                }
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank'; 
                document.body.appendChild(a);
                a.click();
                setTimeout(() => document.body.removeChild(a), 1000);
            };

            // --- SISTEMA DE COLA CON DELAY ---
            //Primera descarga (Depósito CB)
            log("💾 Descargando Stock CB...", "info");
            ejecutarDescargaReal(urls.cb, "STOCK CB");

            // Segunda descarga (Depósito TN) con un delay de 3 segundos
            setTimeout(() => {
                log("💾 Descargando Stock TN...", "info");
                ejecutarDescargaReal(urls.tn, "STOCK TN");
                log(`📦 PROCESO FINALIZADO. Revisa tu carpeta de descargas.`, "success");
            }, 3000);

        } else {
            const msj = data.reply ? data.reply.msj : "Error desconocido";
            log(`❌ ERROR: ${msj}`, "error");
        }

    } catch (err) {
        log("❌ FALLO CRÍTICO: " + err, "error");
    } finally {
        if(btn) { 
            btn.disabled = false; 
            btn.style.opacity = "1"; 
        }
    }
};

})();
function abrirModalSincronizacion() {
        document.getElementById('modal-sync-canvases').classList.remove('hidden');
        document.getElementById('modal-sync-canvases').classList.add('flex');
    }
function cerrarModalSincronizacion() {
        document.getElementById('modal-sync-canvases').classList.remove('flex');
        document.getElementById('modal-sync-canvases').classList.add('hidden');
    }


    /*---Seccion Ventas--*/
let archivoVentasBase64 = null;
let nombreArchivoVentas = "";

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

    // Capturamos tu contenedor del loader personalizado
    const overlayCarga = document.getElementById('overlay-carga');
    
    // Encendemos tu loader en pantalla completa inmediatamente al iniciar el proceso
    if (overlayCarga) overlayCarga.style.display = 'flex';

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const nombreHoja = workbook.SheetNames[0];
            const hoja = workbook.Sheets[nombreHoja];
            
            // Convertimos la hoja a una matriz de datos pura
            const rawFilas = XLSX.utils.sheet_to_json(hoja, { header: 1 });
            
            // --- GENERACIÓN DE LA MARCA DE TIEMPO (TIMESTAMP) FIJA ---
            const ahora = new Date();
            const dd = String(ahora.getDate()).padStart(2, '0');
            const mm = String(ahora.getMonth() + 1).padStart(2, '0');
            const hh = String(ahora.getHours()).padStart(2, '0');
            const min = String(ahora.getMinutes()).padStart(2, '0');
            
            // Construcción exacta del formato pedido: ACT: dd/mm hh:mm
            const marcaImpacto = `ACT: ${dd}/${mm} ${hh}:${min}`;
            
            // --- FILTRADO Y EXTRACCIÓN DE LAS COLUMNAS ---
            // Removemos la cabecera con slice(1) e inyectamos la marca temporal en la última posición
            const filasProcesadas = rawFilas.slice(1)
                .filter(fila => fila && fila[0] !== "" && fila[0] !== undefined)
                .map(fila => [
                    fila[0],                                 // Columna A: Fecha venta
                    fila[3] !== undefined ? fila[3] : "",    // Columna D: SKU
                    fila[4] !== undefined ? fila[4] : "",    // Columna E: NOMBRE
                    Math.abs(parseFloat(fila[5]) || 0),      // Columna F: Cantidad (Absoluto)
                    marcaImpacto                             // Reemplaza fila[6] por la marca estática calculada
                ]);

            const totalFilas = filasProcesadas.length;
            
            // Definimos bloques estables de 5000 registros para optimizar la red
            const TAMANIO_BLOQUE = 5000;

            console.log(`[LexTech-Client] Total de filas útiles detectadas: ${totalFilas}. Iniciando envío por bloques de 5 columnas...`);

            // Bucle asincrónico secuencial por bloques
            for (let i = 0; i < totalFilas; i += TAMANIO_BLOQUE) {
                const bloque = filasProcesadas.slice(i, i + TAMANIO_BLOQUE);
                const esPrimerBloque = (i === 0);
                
                // Petición POST utilizando tu constante global centralizada y tu estructura de payload exacta
                const respuesta = await fetch(URL_GAS_GLOBAL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'procesarBloqueVentas',
                        data: {
                            valores: bloque,
                            esPrimerBloque: esPrimerBloque
                        }
                    })
                });

                if (!respuesta.ok) {
                    throw new Error(`Error en el servidor en el bloque que inicia en la fila ${i}`);
                }
            }

            // --- ÉXITO: Apagamos tu loader antes de mostrar el SweetAlert de éxito ---
            if (overlayCarga) overlayCarga.style.display = 'none';

            Swal.fire({
                title: '🚀 PROCESAMIENTO COMPLETADO',
                text: `Se cargaron con éxito las ${totalFilas} filas filtradas en Historial_Ventas.`,
                icon: 'success',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#c2902e'
            });

            window.cerrarModalVenta();

        } catch (err) {
            console.error("🚨 Error procesando bloques:", err);
            
            // --- ERROR: Apagamos tu loader antes de mostrar el SweetAlert de error ---
            if (overlayCarga) overlayCarga.style.display = 'none';
            
            Swal.fire({
                title: '❌ ERROR DE PROCESAMIENTO',
                text: err.message || 'Ocurrió un problema al fragmentar los datos.',
                icon: 'error',
                background: '#0f172a',
                color: '#fff'
            });
            
            // Re-habilitamos el botón para permitirle al usuario reintentar
            if (btnProcesar) btnProcesar.disabled = false;
        } finally {
            // Limpieza preventiva del valor del input para permitir subir el mismo archivo consecutivamente si se desea
            if (inputArchivo) inputArchivo.value = "";
        }
    };

    reader.readAsArrayBuffer(archivoBlob);
};

