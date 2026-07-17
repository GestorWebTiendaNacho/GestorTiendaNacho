(function() {
    if (window.jsStockCargado) {
        console.log("♻️ jsStock ya estaba en memoria. Reiniciando listeners...");
        return;
    }
    window.jsStockCargado = true;
    let archivoVentasBase64 = null;
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
        if(intervalMonitor) clearInterval(intervalMonitor);

        intervalMonitor = setInterval(async () => {
            try {
                const data = await callGoogleScript('get_progress');
                const p = data.reply; // {procesados, faltantes, tiempo, porcentaje, terminado, fase}
                
                if(!p) return;
                
                // Actualizar relojes
                window.actualizarReloj('cvs_descarga', p.fase === "DESCARGA" ? 50 : 100, p.fase);
                window.actualizarReloj('cvs_impacto', p.porcentaje, p.porcentaje + '%');

                // Actualizar stats (IDs de tu HTML)
                document.getElementById('txt-procesados').textContent = p.procesados;
                document.getElementById('txt-faltantes').textContent = p.faltantes;
                document.getElementById('txt-time-real').textContent = p.tiempo;
                
                // Si terminó, detenemos el polling
                if (p.terminado) {
                    clearInterval(intervalMonitor);
                    window.actualizarReloj('cvs_impacto', 100, 'DONE');
                    setTimeout(() => finalizarVisualmente(p), 1000);
                }
            } catch (err) {
                console.warn("Esperando respuesta del servidor...");
            }
        }, 4000); // Poll cada 4 segundos para no saturar la API de GAS
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
        
        // Limpieza visual inicial
        $('.logo-placeholder').fadeOut(400, () => {
            $('#cvs_descarga, #cvs_impacto').fadeIn(400);
            window.actualizarReloj('cvs_descarga', 0, 'CONECTANDO...');
        });

        try {
            // 1. Disparamos el proceso en el servidor (GAS -> GitHub)
            const res = await callGoogleScript('sync_stock');
            log("📡 " + res.reply.msj, "success");
            
            // 2. Iniciamos el monitoreo constante de la hoja
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

