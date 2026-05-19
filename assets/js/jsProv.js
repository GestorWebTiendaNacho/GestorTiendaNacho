console.log("🚀 N.I.C.O. Terminal: Iniciando carga de scripts...");
//-------------------jsProv---

function cerrarModalYRegresar() {
    // 1. Localizamos los elementos del DOM
    const modal = document.getElementById('modal-maestro');
    const contenido = document.getElementById('modal-contenido');

    // 2. Ocultamos el modal con las clases que ya manejas
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // 3. Limpiamos el contenido para liberar memoria y evitar "parpadeos" al reabrir
    if (contenido) {
        contenido.innerHTML = "";
    }

    // 4. Ejecutamos la navegación global a proveedores
    // Esta instrucción asume que tu función navegar() ya está disponible globalmente
    if (typeof navegar === "function") {
        navegar('proveedores');
    } else {
        console.warn("La función 'navegar' no está definida.");
    }
}


window.estadoEdicion = { esNuevo: false, fila: null }; // Sin 'let' para evitar el error de redodeclaración
window.carritoPedidos = window.carritoPedidos || [];
window.calidadSeleccionada = window.calidadSeleccionada || 0;

var speed = typeof speed !== 'undefined' ? speed : 0;
var prevSpeed = typeof prevSpeed !== 'undefined' ? prevSpeed : 0;
var currentScale = typeof currentScale !== 'undefined' ? currentScale : 1;

window.estadoEdicion = window.estadoEdicion || { hoja: "", fila: null };


//----------------------------SECCION NICO Y SIDEBAR-------------

function toggleMenu() {
  const menu = document.getElementById('mainMenu');
  if (menu) {
    menu.classList.toggle('active');
  } else {
    console.warn("NICO: No se encontró #mainMenu para toggle");
  }
};

window.speedIncrase = function() {
    if (typeof speed === 'undefined') window.speed = 0;
    if (speed < 180) {
        speed = speed + 15;
    } else {
        speed = 0;
        currentScale = 0;
    }
    window.actualizarInterfaz();
    if (typeof currentScale !== 'undefined') currentScale++;
    window.changeActive();
};

window.actualizarInterfaz = function() {
    const el = document.getElementsByClassName("arrow-wrapper")[0];
    if (!el) return;
    const claseVieja = "speed-" + (typeof prevSpeed !== 'undefined' ? prevSpeed : 0);
    const claseNueva = "speed-" + speed;
    el.classList.remove(claseVieja);
    el.classList.add(claseNueva);
    window.prevSpeed = speed;
};

window.changeActive = function() {
    let nombreClaseBusqueda = "speedometer-Scale-" + currentScale;
    const el = document.getElementsByClassName(nombreClaseBusqueda)[0];
    if (el) {
        el.classList.toggle("active");
    }
};


// ----------------------------- NICO CONTROLLER -----------------
if (!window.NicoController) {
    window.NicoController = (function() {
        const ESTADOS = {
            SALUDANDO: "https://lh3.googleusercontent.com/d/1mkCllM3of8cBljHNcE0O-PnxChIdlck6",
            PENSANDO:  "https://lh3.googleusercontent.com/d/1Fraz2E6WH19fo2rfhaoqMt0hkbkZILX8",
            ESPERANDO: "https://lh3.googleusercontent.com/d/1lYxZJVhxkfteppRdVvFcLddPWu6IJkIe",
            RESPONDE:  "https://lh3.googleusercontent.com/d/1N8CNvmkgBbunVbPG758xeHrTuo7aw7q4"
        };

        const nico = {
            img: new Image(),
            estadoActual: "SALUDANDO",
            frame: 0,
            fps: 9,
            lastUpdate: 0,
            distanciaSalto: 178,
            anchoRecorte: 80,
            altoCuadro: 300,
            yInicial: -128,
            totalFrames: 8,
            tamanoVisual: 180
        };

        function iniciar() {
            const currentCanvas = document.getElementById("canvas-nico");
            if (!currentCanvas) return;

            nico.estadoActual = "SALUDANDO";
            nico.img.crossOrigin = "Anonymous";
            nico.img.src = ESTADOS.SALUDANDO;
            nico.frame = 0;
            
            requestAnimationFrame(draw);
            
            setTimeout(() => {
                if (nico.estadoActual === "SALUDANDO") {
                    cambiarEstado("ESPERANDO");
                }
            }, 4500);
            
        }

        function cambiarEstado(nuevoEstado) {
            if (ESTADOS[nuevoEstado] && nico.estadoActual !== nuevoEstado) {
                nico.estadoActual = nuevoEstado;
                nico.fps = (nuevoEstado === "RESPONDE") ? 12 : 9;
                nico.img.src = ESTADOS[nuevoEstado];
                nico.frame = 0;
            }
        }

        function draw(timestamp) {
            const currentCanvas = document.getElementById("canvas-nico");
            if (!currentCanvas) return;
            
            const currentCtx = currentCanvas.getContext("2d");
            if (!nico.img.complete) {
                requestAnimationFrame(draw);
                return;
            }

            currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
            const col = nico.frame % nico.totalFrames;
            const sx = col * nico.distanciaSalto;

            currentCtx.drawImage(
                nico.img,
                sx, nico.yInicial, 
                nico.anchoRecorte, nico.altoCuadro,
                (currentCanvas.width / 2) - (nico.tamanoVisual / 2),
                currentCanvas.height - nico.tamanoVisual,
                nico.tamanoVisual, nico.tamanoVisual
            );

            if (timestamp - nico.lastUpdate > (1000 / nico.fps)) {
                nico.frame = (nico.frame + 1) % nico.totalFrames;
                nico.lastUpdate = timestamp;
            }
            requestAnimationFrame(draw);
        }

        iniciar();

        return { 
            cambiarA: cambiarEstado,
            rearrancar: iniciar 
        };
    })();
} else {

    NicoController.rearrancar();
}

// ------------------- LOGICA DEL CHAT ----------------------------
window.avatarPensar = () => window.NicoController && NicoController.cambiarA("PENSANDO");
window.avatarIdle   = () => window.NicoController && NicoController.cambiarA("ESPERANDO");
window.avatarHablar = () => window.NicoController && NicoController.cambiarA("RESPONDE");

/*const btnVoz = document.getElementById('btn-nico-voz');*/

/*btnVoz.onclick = () => {
    const input = document.getElementById("user-input");
    input.value = "";
    input.placeholder = "ESCUCHANDO... (Usa Super+S o habla)";
    input.focus();

    window.avatarIdle();
    btnVoz.classList.replace('text-slate-500', 'text-red-500');

    input.onblur = () => {
        if(input.value.length > 2) {
           enviarPrompt();
           btnVoz.classList.replace('text-red-500', 'text-slate-500');
           input.placeholder = "Comando de sistema...";
        }
    };
};*/



function enviarPrompt() {
    const inputElement = document.getElementById("user-input");
    if (!inputElement) return;
    const userInput = inputElement.value;
    if (!userInput) return;

    mostrarMensajeUsuario(userInput); 
    inputElement.value = "";
    window.avatarPensar();

    google.script.run
    .withSuccessHandler((respuesta) => {
        window.avatarHablar();
        if (typeof mostrarRespuestaEnChat === "function") {
            mostrarRespuestaEnChat(respuesta);
        }
        setTimeout(() => window.avatarIdle(), 4000);
    })
    .withFailureHandler((err) => {
        window.avatarIdle();
        console.error("Error en Nico:", err);
    })
    .procesarPrompt(userInput);
}

function mostrarMensajeUsuario(texto) {
    const chatContainer = document.getElementById("chat-messages");
    if (!chatContainer) return;
    const div = document.createElement("div");
    div.className = "flex flex-col items-end message-fade mb-4 transition-all duration-500";
    div.innerHTML = `
        <span class="text-[8px] text-slate-500 mb-1 font-bold tracking-widest uppercase">USUARIO >></span>
        <div class="contenido-mensaje bg-cyan-900/40 border border-cyan-700/50 p-3 rounded-xl rounded-tr-none text-[11px] text-cyan-100 max-w-[90%] shadow-lg backdrop-blur-sm">
            ${texto}
        </div>
    `;
    chatContainer.appendChild(div);
    ejecutarScrollYLimpieza();
}

function mostrarRespuestaEnChat(texto) {
    const chatContainer = document.getElementById("chat-messages");
    if (!chatContainer) return;
    const div = document.createElement("div");
    div.className = "flex flex-col items-start message-fade mb-4";
    div.innerHTML = `
        <span class="text-[8px] text-cyan-500 mb-1 font-bold tracking-widest uppercase">N.I.C.O. >></span>
        <div class="cuerpo-respuesta bg-slate-800/80 border border-slate-700 p-3 rounded-xl rounded-tl-none text-[11px] text-slate-300 max-w-[90%] shadow-lg backdrop-blur-sm">
            ${texto}
        </div>
    `;
    chatContainer.appendChild(div);
    ejecutarScrollYLimpieza();
    if (typeof ejecutarScriptsInyectados === "function") {
        ejecutarScriptsInyectados(div);
    }
}


 function ejecutarScrollYLimpieza() {
    const chatContainer = document.getElementById("chat-messages");
    if (!chatContainer) return;
    const mensajes = chatContainer.getElementsByClassName("message-fade");
    if (mensajes.length > 6) {
        const primerMensaje = mensajes[0];
        primerMensaje.classList.add("mensaje-saliente");
        setTimeout(() => primerMensaje.remove(), 500);
    }
    setTimeout(() => {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }, 50);
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-nico');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;

    const isHidden = sidebar.classList.contains('-translate-x-[120%]');
    if (isHidden) {
        sidebar.classList.remove('-translate-x-[120%]');
        sidebar.classList.add('translate-x-0');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-[120%]');
        if (overlay) overlay.classList.add('hidden');
    }
}


//-------SECCION DE APERTURA DEL MODAL Y CARGA DE TABLAS------------------------------------
var MAPA_HOJAS = {
    'HISTORIAL': 'Historial_Compras',
    'PROVEEDORES': 'baseProveedores',
    'BASE PROVEEDORES': 'baseProveedores', 
    'BASEPROVEEDORES': 'baseProveedores', 
    'ESTADO': 'Estado_Pedidos',
    'PRODUCTOS': 'baseProductos',
    'RECEPCIÓN': 'Estado_Pedidos',
    'RECEPCION': 'Estado_Pedidos'
};

var ENCABEZADOS_SISTEMA = {
    'baseProveedores': ['ID','RAZÓN SOCIAL','CIUDAD','DOMICILIO','TELÉFONO','EMAIL','CODIGO PROV','PROVINCIA','ACCIONES'],
    'baseProductos': ['ID','NOMBRE PROD','CODIGO','COSTO INTERNO','STOCK ACTUAL','ID PROVEEDOR','NOMBRE PROVEEDOR','STOCK MINIMO', 'ACCIONES'],
    'Estado_Pedidos': ['ID_Pedido','Fecha_Pedido','Proveedor_Nombre','Estatus','Cantidad Productos','Total_General','Nueva_Fecha Reprogramada','OBSERVACIONES', 'ACCIONES'],
    'Historial_Compras': ['ID PEDIDO', 'FECHA PEDIDO', 'PROVEEDOR', 'ESTATUS', 'DETALLE', 'INVERSIÓN', 'FECHA RECEPCIÓN', '% CUMP.', 'CALIDAD', 'DEMORA', 'OBS', 'ACCIONES']
};

async function cargarTablaGenerica(nombreHoja) {
    const contenedor = document.getElementById('modal-contenido');
    const nombreHojaReal = MAPA_HOJAS[nombreHoja] || nombreHoja;
    
    // Loading State
    contenedor.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64">
        <div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p class="text-cyan-500 font-mono text-[10px] uppercase tracking-[0.3em]">Sincronizando: ${nombreHojaReal}</p>
    </div>`;

    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: nombreHoja });

        if (res && res.status === "success" && res.reply.success) {
            const data = res.reply;
            
            contenedor.innerHTML = `
                <div class="w-full flex justify-between items-end mb-4 px-4">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-cyan-500/40 font-mono italic">FS_STREAM: ${nombreHojaReal}</span>
                        <span class="text-[14px] text-white font-black tracking-tighter uppercase">ARCHIVO MAESTRO</span>
                    </div>
                    <div class="text-[9px] text-slate-500 font-mono">
                        ÚLTIMA SYNC: <span class="text-cyan-400">${data.ultimaActualizacion}</span>
                    </div>
                </div>
                <div class="wrapper-tabla-final overflow-hidden border border-slate-800 rounded-lg">
                    <table id="tabla-maestra-generica" class="tabla-premium w-full">
                        </table>
                </div>`;

            renderTableNico('#tabla-maestra-generica', data.data, nombreHojaReal);
        } else {
            throw new Error(res.reply?.error || "Falla en el enlace");
        }
    } catch (err) {
        contenedor.innerHTML = `<div class="p-10 text-red-500 font-mono text-center text-[10px]">ERROR DE ACCESO: ${err.message}</div>`;
    }
}



async function abrirModal(tipo) {
    console.log("N.I.C.O. Dashboard - Iniciando modal:", tipo);
    const modal = document.getElementById('modal-maestro');
    const contenido = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');
    
    if (!modal || !contenido || !titulo) return;
    
    contenido.innerHTML = "";
    titulo.innerText = tipo;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (tipo === 'PEDIDOS') {
        contenido.innerHTML = `
            <div class="p-6 text-center">
                <h3 class="text-cyan-400 mb-4 font-bold uppercase tracking-widest text-[10px]">Identificar Proveedor para Pedido</h3>
                <div id="selector-proveedor-container" class="flex flex-col items-center gap-4">
                    <div class="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            </div>`;

        try {
            const res = await callGoogleScript('get_datos_deposito', { nombreSheet: 'baseProveedores' });
            
            if (res.status === "success") {
                const filas = res.reply.data;
                const listaUnicos = [...new Set(filas.map(f => f[1]))].sort();
                
                const container = document.getElementById('selector-proveedor-container');
                let options = listaUnicos.map(p => `<option value="${escapingForOption(p)}">${p}</option>`).join('');

                container.innerHTML = `
                    <select id="prov-seleccionado" class="bg-slate-900 border border-cyan-500/50 text-white p-2 rounded w-64 focus:border-cyan-400 outline-none text-xs font-mono">
                        <option value="">-- SELECCIONAR PROVEEDOR --</option>
                        ${options}
                    </select>
                    <div class="flex gap-3 mt-4">
                        <button onclick="cargarProductosPorProveedor()" class="btn-accion-nico h-10 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-[10px] tracking-widest">
                            SINCRONIZAR CATÁLOGO
                        </button>
                    </div>`;
            }
        } catch (err) {
            console.error("Error cargando proveedores:", err);
        }
    } else {
        cargarTablaGenerica(tipo); 
    }
}

/**
 * Renderiza DataTables
 * @param {string} selector - El ID de la tabla (ej: '#tabla-maestra-generica')
 * @param {Array} headers - Array de strings con los títulos
 * @param {Array} data - Array de arrays con los registros
 */

function renderTableNico(selector, data, nombreHojaReal) {
    if (!$.fn.DataTable) return;

    // Obtener configuración de columnas
    const columnasCabecera = ENCABEZADOS_SISTEMA[nombreHojaReal] || [];
    if (columnasCabecera.length === 0) {
        console.error("No se definieron encabezados para:", nombreHojaReal);
        return;
    }

    // 1. Limpieza y Reconstrucción del DOM
    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().destroy();
    }
    
    // Forzamos el THEAD para que coincida con los encabezados del sistema
    let theadHtml = `<thead><tr>${columnasCabecera.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody></tbody>`;
    $(selector).html(theadHtml);

    // 2. Configuración de Columnas
    const indexAcciones = columnasCabecera.length - 1;
    const configDefs = columnasCabecera.map((titulo, i) => {
        if (i === indexAcciones) {
            return {
                targets: i,
                orderable: false,
                className: "text-center align-middle",
                render: function(val, type, row, meta) {
                    const filaIndex = meta.row + 2;
                    const rowJson = JSON.stringify(row).replace(/"/g, '&quot;');
                    
                    if (nombreHojaReal === "Historial_Compras") {
                        return `<button onclick='verDetalleHistorial("${row[0]}")' class='btn-accion-nico bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600 hover:text-white'>DETALLE</button>`;
                    }
                    if (nombreHojaReal === "Estado_Pedidos") {
                        return `<button onclick='abrirRecepcion(${rowJson}, ${filaIndex})' class='btn-accion-nico'>GESTIONAR</button>`;
                    }
                    return `<button onclick='abrirEditorGenerico("${nombreHojaReal}", ${filaIndex}, "${rowJson}")' class='btn-accion-nico'>EDITAR</button>`;
                }
            };
        }
        return { 
            targets: i, 
            className: "p-3 dt-nowrap font-mono text-[10px]",
            defaultContent: "---" // CRÍTICO: Evita el error "Unknown Parameter"
        };
    });

    // 3. Inicialización
    $(selector).DataTable({
        data: data || [],
        dom: 'rtip',
        language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
        pageLength: 15,
        scrollX: true,
        autoWidth: false,
        columnDefs: configDefs,
        headerCallback: function(thead) {
            $(thead).find('th').addClass('text-cyan-500 font-black uppercase tracking-widest text-[10px] p-4 bg-slate-900/50');
        },
        drawCallback: function() {
            console.log(`✅ Terminal N.I.C.O: Tabla ${nombreHojaReal} lista.`);
        }
    });
}




function getTipoByHoja(hoja) {
    const nombres = {
        'baseProveedores': 'PROVEEDORES',
        'Historial_Compras': 'HISTORIAL',
        'baseProductos': 'PRODUCTOS',
        'Estado_Pedidos': 'ESTADO'
    };
    
    return nombres[hoja] || 'SISTEMA';
}


function escapingForOption(str) {
    if (!str) return "";
    return str.toString().replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}



function cerrarModal() {
    const modal = document.getElementById('modal-maestro');
    const contenido = document.getElementById('modal-contenido');
    if (modal) {
	modal.classList.add('hidden');
	modal.classList.remove('flex');
    }
    if (contenido) {
	contenido.innerHTML = "";
    }
}
    



/* ---SECCION DE EDICION DE TABLA PROVEEDORES--- */
function abrirEditorGenerico(nombreHoja, numFila, datosRaw, encabezadosRaw, prov) {
    estadoEdicion.hoja = nombreHoja;
    estadoEdicion.fila = numFila;
    
    let datos = [];
    let encabezados = [];
    
    try {
        // AJUSTE: Ahora los datos pueden venir como objeto (desde DataTables) o como string
        datos = (typeof datosRaw === 'string') ? JSON.parse(datosRaw) : (datosRaw || []);
        encabezados = (typeof encabezadosRaw === 'string') ? JSON.parse(encabezadosRaw) : (encabezadosRaw || []);
    } catch (e) {
        console.error("❌ N.I.C.O. Error en parseo de editor:", e);
        return;
    }

    // AJUSTE: Título dinámico más limpio
    const tituloDisplay = prov || nombreHoja;
    
    // Construcción del formulario
    let htmlForm = `
    <div class="bg-slate-800 p-6 rounded border border-cyan-500/30 shadow-2xl">
        <h3 class="text-cyan-400 mb-6 text-xs font-bold uppercase tracking-widest flex justify-between">
            <span>MODIFICAR REGISTRO: <span class="text-white">${tituloDisplay}</span></span>
            <span class="text-slate-500 font-mono italic">FILA #${numFila}</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="inputs-dinamicos">`;

    encabezados.forEach((nombreColumna, i) => {
        const valor = datos[i] !== undefined ? datos[i] : ""; // Evita que aparezca 'undefined' en los inputs
        const nombreLower = nombreColumna.toLowerCase().trim();
        
        // Bloqueo de campos críticos (ID, Códigos, etc.)
        const esBloqueado = ["id", "codigo", "sku", "proveedor"].includes(nombreLower);
        
        const inputAttr = esBloqueado ? `readonly tabindex="-1"` : "";
        const labelClass = esBloqueado ? "text-cyan-600/50" : "text-slate-500";

        htmlForm += `
        <div class="space-y-1">
            <label class="text-[9px] uppercase font-semibold ${labelClass}">${nombreColumna}</label>
            <input type="text" 
                   value="${valor}" 
                   ${inputAttr}
                   class="input-edicion w-full bg-slate-950 border border-slate-700 p-2 text-xs text-white rounded focus:border-cyan-500 outline-none transition-all ${esBloqueado ? 'opacity-50 cursor-not-allowed bg-slate-900' : 'hover:border-slate-600'}">
        </div>`;
    });

    htmlForm += `
        </div>
        <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-700/50">
            <button onclick="cerrarModal()" class="text-slate-500 text-[10px] font-bold hover:text-white transition-colors tracking-widest">CANCELAR</button>
            <button onclick="ejecutarGuardado()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded text-[10px] font-bold shadow-lg shadow-cyan-900/20 transition-transform active:scale-95 tracking-widest">
                CONFIRMAR CAMBIOS
            </button>
        </div>
    </div>`;

    const contenedor = document.getElementById('modal-contenido');
    if (contenedor) {
        contenedor.innerHTML = htmlForm;
    }
}



async function ejecutarGuardado() {
    const inputs = document.querySelectorAll('.input-edicion');
    const nuevosDatos = Array.from(inputs).map(input => input.value);
    const modalContenido = document.getElementById('modal-contenido');
    
    // Guardamos el estado previo por si hay que volver atrás ante un error
    const contenidoOriginal = modalContenido.innerHTML;
    
    // UI: Loader con estética Terminal N.I.C.O.
    modalContenido.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full py-10 space-y-4">
        <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-cyan-500 font-bold animate-pulse text-[10px] uppercase tracking-widest">
            Sincronizando con Base de Datos...
        </p>
    </div>`;

    try {
        // --- MIGRACIÓN A FETCH API ---
        // Llamamos a 'guardarCambioServidor' a través de nuestro puente callGoogleScript
        const res = await callGoogleScript('guardarCambioServidor', {
            nombreSheet: estadoEdicion.hoja,
            numFila: estadoEdicion.fila,
            valores: nuevosDatos
        });

        // Verificamos la respuesta (res.reply es lo que devuelve la función de GAS)
        if (res && res.status === "success" && res.reply.success) {
            console.log("✅ Cambio impactado con éxito.");
            
            // Refrescamos el modal con la tabla actualizada
            abrirModal(getTipoByHoja(estadoEdicion.hoja));
            
        } else {
            const mensajeError = res.reply ? res.reply.mensaje : "Error desconocido";
            throw new Error(mensajeError);
        }

    } catch (err) {
        console.error("❌ Fallo en el guardado:", err);
        
        alert("Fallo de conexión o servidor: " + err.message);
        modalContenido.innerHTML = contenidoOriginal;
    }
}




//---- FUNCIONES DEL MODAL DE PEDIDOS ----
async function cargarProductosPorProveedor() {
    const selector = document.getElementById('prov-seleccionado');
    const prov = selector ? selector.value.trim() : "";
    const contenedor = document.getElementById('modal-contenido');

    if (!prov) return Swal.fire('AVISO', 'Selecciona un proveedor', 'info');

    // Estado de carga visual N.I.C.O.
    contenedor.innerHTML = `
        <div class="flex flex-col items-center py-20">
            <div class="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-[12px] text-cyan-500 uppercase tracking-widest animate-pulse">Sincronizando Catálogo...</p>
        </div>`;

    try {
        const res = await callGoogleScript('obtenerTablaFiltrada', { 
            nombreHoja: 'baseProductos', 
            proveedorFiltro: prov 
        });

        console.log("Respuesta completa del servidor:", res);

        if (!res || res.status !== "success") {
            throw new Error(res ? res.message : "Sin respuesta del servidor");
        }

        const lista = (res.reply && res.reply.data) ? res.reply.data : (res.data || []);

        if (lista.length > 0) {
            let tablaHtml = `
                <div class="mb-4 p-3 bg-slate-900 border border-slate-700 rounded-lg flex justify-between items-center sticky top-0 z-10 shadow-xl">
                    <div id="contador-items" class="text-[11px] text-slate-400 uppercase">
                        Items seleccionados: <span class="text-cyan-400 font-bold">${window.carritoPedidos ? window.carritoPedidos.length : 0}</span>
                    </div>
                    <button onclick="revisarPedido()" class="bg-cyan-600 hover:bg-cyan-500 text-white text-[12px] font-bold px-4 py-2 rounded transition-colors uppercase">
                        REVISAR PEDIDO →
                    </button>
                </div>
                <div class="overflow-x-auto border border-cyan-900/20 rounded">
                    <table id="tabla-maestra-pedidos" class="tabla-premium">
                        <thead>
                            <tr class="bg-slate-950 text-cyan-500 uppercase">
                                <th class="p-3 text-center">SEL.</th>
                                <th class="p-3">ID</th>
                                <th class="p-3">PRODUCTO</th>
                                <th class="p-3">CÓDIGO</th>
                                <th class="p-3">STOCK</th>
                                <th class="p-3">COSTO</th>
                                <th class="p-3">STOCK MÍN.</th>
                            </tr>
                        </thead>
                        <tbody id="body-pedidos" class="divide-y divide-cyan-900/10 text-slate-300">`;

            lista.forEach(prod => {
                const nombreLimpio = String(prod.nombre || "").replace(/'/g, "").replace(/"/g, "");
                const alertarStock = parseInt(prod.stock) <= parseInt(prod.stockMinimo);
                
                // Generamos las celdas exactas para que coincidan con el thead (7 columnas ahora)
                tablaHtml += `
                    <tr class="hover:bg-cyan-500/5 transition-colors">
                        <td class="p-3 text-center">
                            <input type="checkbox" class="w-4 h-4 accent-cyan-500 cursor-pointer" 
                                onclick="toggleSeleccion(this, '${prod.id}', '${nombreLimpio}', '${prod.precio}', '${prod.sku}', '${prod.stock}', '${prov}', '${prod.stockMinimo}')">
                        </td>
                        <td class="p-3 text-slate-500">${prod.id}</td>
                        <td class="p-3">
                            <b class="text-slate-200">${prod.nombre}</b>
                        </td>
                        <td class="p-3 text-cyan-700 font-bold">${prod.sku}</td>
                        <td class="p-3 ${alertarStock ? 'text-red-500 font-bold animate-pulse' : 'text-slate-400'}">
                            ${prod.stock}
                        </td>
                        <td class="p-3 text-slate-300">$ ${prod.precio}</td>
                        <td class="p-3 text-slate-500 text-center">${prod.stockMinimo}</td>
                    </tr>`;
            });

            tablaHtml += `</tbody></table></div>`;
            contenedor.innerHTML = tablaHtml;

            // Inicialización de DataTables
            if (window.jQuery && $.fn.DataTable) {
                setTimeout(() => {
                    if ($.fn.DataTable.isDataTable('#tabla-maestra-pedidos')) {
                        $('#tabla-maestra-pedidos').DataTable().destroy();
                    }
                    $('#tabla-maestra-pedidos').DataTable({
                        "language": { "url": 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
                        "pageLength": 10,
                        "dom": 'rtip',
                        "order": [[2, "asc"]]
                    });
                }, 50);
            }

        } else {
            contenedor.innerHTML = `
                <div class="p-10 text-center">
                    <p class="text-amber-500 uppercase font-bold italic text-xs tracking-widest">Catálogo Vacío</p>
                    <p class="text-slate-500 text-[10px] mt-2">No se encontraron productos para "${prov}"</p>
                </div>`;
        }

    } catch (err) {
        console.error("Error en proceso:", err);
        contenedor.innerHTML = `
            <div class="p-10 text-red-500 text-xs text-center uppercase font-mono border border-red-900/20 bg-red-900/5">
                Error de sincronización:<br>${err.message}
            </div>`;
    }
}


function toggleSeleccion(checkbox, id, nombre, precio, sku, stock, proveedor, stockMinimo) {
    if (checkbox.checked) {
        if (!carritoPedidos.find(p => p.id === id)) {
            carritoPedidos.push({ id, nombre, sku, precio: parseFloat(precio), stock, stockMinimo, proveedor, cantidad: 1 });
        }
    } else {
        carritoPedidos = carritoPedidos.filter(p => p.id !== id);
    }
    actualizarContadorVisual();
}


function actualizarContadorVisual() {
    const contador = document.getElementById('contador-items');
    if (contador) {
        contador.innerHTML = `Items seleccionados: <span class="text-cyan-400 font-bold">${carritoPedidos.length}</span>`;
    }
}



function filtrarProductosMain() {
    const input = document.getElementById("buscador-productos");
    if (!input) return;
    const filter = input.value.toUpperCase();
    
    // AJUSTE: Ahora busca la tabla del modal o la maestra según cuál esté presente
    const tabla = document.getElementById("tabla-pedidos-filtrada") || document.getElementById("tabla-maestra-pedidos");
    if (!tabla) return;

    const tbody = tabla.getElementsByTagName("tbody")[0];
    const filas = tbody.getElementsByTagName("tr");

    for (let i = 0; i < filas.length; i++) {
        let visible = false;
        const celdas = filas[i].getElementsByTagName("td");
        
        // Empezamos en j=1 para no filtrar por el checkbox de la columna SEL
        for (let j = 1; j < celdas.length; j++) {
            const txtValue = celdas[j].textContent || celdas[j].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                visible = true;
                break;
            }
        }
        filas[i].style.display = visible ? "" : "none";
    }
}



/*------ ARMADO Y CONFIRMACION DEL PEDIDO ----*/

async function revisarPedido() {
    if (carritoPedidos.length === 0) {
        Swal.fire({ title: 'CARRITO VACÍO', text: "Selecciona productos primero.", icon: 'info', background: '#0f172a', color: '#fff' });
        return;
    }

    const contenido = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');
    
    // 1. Obtener proveedores
    let proveedoresHTML = "";
    try {
        const listaProv = (typeof listaProveedoresCache !== 'undefined' && listaProveedoresCache.length > 0) 
                        ? listaProveedoresCache 
                        : await obtenerProveedoresParaSelector();
        
        const provOriginal = carritoPedidos[0].proveedor;
        
        proveedoresHTML = listaProv.map(p => 
            `<option value="${p}" ${p === provOriginal ? 'selected' : ''}>${p}</option>`
        ).join('');
    } catch (e) { console.error("Error al cargar proveedores", e); }

    const ahora = new Date();
    const idPedido = "PED-" + ahora.getFullYear() + (ahora.getMonth() + 1).toString().padStart(2, '0') + ahora.getDate() + "-" + ahora.getHours() + ahora.getMinutes();

    titulo.innerText = "CONFECCIÓN DE PEDIDO: " + idPedido;

    let html = `
        <div class="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/20 mb-4 w-full shadow-inner">
            <div class="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs items-center">
                <div>
                    <span class="text-slate-500 uppercase text-[9px]">ID OPERACIÓN:</span><br>
                    <span class="text-cyan-400 font-mono font-bold">${idPedido}</span>
                </div>
                
                <div class="col-span-2">
                    <label class="text-cyan-500 block mb-1 uppercase text-[10px] font-black tracking-tighter">Remitir Pedido a:</label>
                    <select id="cambiar-proveedor-final" onchange="actualizarProveedorCarrito(this.value)"
                            class="w-full bg-slate-950 border border-cyan-500/30 text-white rounded p-1.5 font-bold focus:border-cyan-400 outline-none transition-all">
                        ${proveedoresHTML || `<option>${carritoPedidos[0].proveedor}</option>`}
                    </select>
                </div>

                <div>
                    <label class="text-cyan-500 block mb-1 uppercase text-[10px]">Plazo Entrega:</label>
                    <div class="flex items-center gap-1">
                        <input type="number" id="tiempo-estimado" min="1" value="3" 
                               class="w-full bg-slate-800 border border-slate-700 text-white rounded p-1 text-center font-bold outline-none focus:ring-1 focus:ring-cyan-500">
                        <span class="text-[9px] text-slate-500">DÍAS</span>
                    </div>
                </div>

                <div class="col-span-2 flex gap-2 justify-end">
                    <button onclick="volverAListaProductos()" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold text-[9px] uppercase tracking-widest transition-all">← EDITAR</button>
                    <button onclick="prepararEnvioPedido('${idPedido}')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-green-900/30 transition-all">ENVIAR ORDEN</button>
                </div>
            </div>
        </div>

        <div class="wrapper-tabla-final border border-slate-800 rounded-lg overflow-hidden">
            <table class="w-full text-left border-collapse table-fixed"> 
                <thead>
                    <tr class="bg-slate-950 sticky top-0 border-b border-slate-700 text-cyan-500 text-[10px] uppercase z-10">
                        <th class="p-3 w-1/4">Item / Detalle</th> 
                        <th class="p-3 text-center w-[12%]">Stock Act.</th> 
                        <th class="p-3 text-center w-[12%]">Stock Mín.</th> 
                        <th class="p-3 text-center w-[15%]">Cantidad</th> 
                        <th class="p-3 text-right w-[15%]">Costo Unit.</th> 
                        <th class="p-3 text-right w-[15%]">Subtotal</th> 
                        <th class="p-3 text-center w-[6%] text-red-500 font-black">X</th> 
                    </tr>
                </thead>
                <tbody class="bg-slate-900/20">`;

    carritoPedidos.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        const alertaStock = parseInt(item.stock) <= parseInt(item.stockMinimo);
        
        html += `
            <tr class="border-b border-slate-800 text-xs hover:bg-cyan-500/5 transition-colors">
                <td class="p-3">
                    <div class="text-slate-200 font-bold truncate">${item.nombre}</div>
                    <div class="text-[9px] text-cyan-700 font-mono tracking-tighter">${item.sku}</div>
                </td>
                <td class="p-3 text-center font-mono">
                    <div class="${alertaStock ? 'text-red-500 font-black animate-pulse' : 'text-slate-400'}">${item.stock}</div>
                </td>
                <td class="p-3 text-center text-slate-500 font-mono">
                    ${item.stockMinimo}
                </td>
                <td class="p-3">
                    <input type="number" min="1" value="${item.cantidad}" 
                           onchange="actualizarCantidadCarrito(${index}, this.value)"
                           class="w-full bg-slate-950 border border-slate-800 text-cyan-400 text-center rounded p-1 outline-none font-bold focus:border-cyan-500">
                </td>
                <td class="p-3 text-right text-slate-400 font-mono">
                    $${item.precio.toLocaleString('es-AR')}
                </td>
                <td class="p-3 text-right text-white font-bold font-mono" id="subtotal-${index}">
                    $${subtotal.toLocaleString('es-AR')}
                </td>
                <td class="p-3 text-center">
                    <button onclick="eliminarDelPedido(${index})" class="text-slate-700 hover:text-red-500 transition-transform hover:scale-110">
                         <i class="fi fi-ss-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>
        <div class="mt-4 p-4 bg-slate-950/80 border border-cyan-900/30 rounded-lg flex justify-between items-center w-full shadow-2xl">
            <div>
                <span class="text-slate-500 text-[9px] uppercase tracking-widest font-bold">Inversión Estimada</span>
                <div id="total-pedido-confirmar" class="text-2xl text-cyan-400 font-black leading-none mt-1 tracking-tighter">$0</div>
            </div>
            <div class="text-right text-[9px] text-slate-700 font-mono uppercase">
                Status: Awaiting confirmation<br>
                N.I.C.O. V2.0 - LEXTECH INTERFACE
            </div>
        </div>`;

    contenido.innerHTML = html;
    calcularTotalConfirmacion();
}




// --- FUNCIÓN DE ELIMINACIÓN ---
function eliminarDelPedido(index) {
    Swal.fire({
        title: '¿QUITAR PRODUCTO?',
        text: "Se eliminará este item de la lista de confección.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#334155',
        confirmButtonText: 'SÍ, ELIMINAR',
        background: '#0f172a',
        color: '#f1f5f9'
    }).then((result) => {
        if (result.isConfirmed) {
            carritoPedidos.splice(index, 1);
            // Si el carrito queda vacío, cerramos el modal o volvemos atrás
            if (carritoPedidos.length === 0) {
                volverAListaProductos();
            } else {
                revisarPedido(); // Refrescamos la tabla de revisión
            }
            actualizarContadorVisual();
        }
    });
}
    


function prepararEnvioPedido(idPedido) {
    const inputDias = document.getElementById('tiempo-estimado');
    const dias = inputDias ? parseInt(inputDias.value) : 0;
    if (isNaN(dias) || dias <= 0) {
        Swal.fire('ATENCIÓN', 'Por favor, ingresa una estimación de días válida.', 'warning');
        return;
    }
    
    ejecutarGeneracionPedido(idPedido, dias);
}

async function obtenerProveedoresParaSelector() {
    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: 'baseProveedores' });
        // Asumiendo que la columna 1 es el nombre del proveedor
        const lista = res.reply.data.map(fila => fila[1]);
        return [...new Set(lista)]; // Eliminamos duplicados
    } catch (e) {
        return [carritoPedidos[0].proveedor]; // Fallback al original
    }
}



function actualizarCantidadCarrito(index, valor) {
    const cant = Math.max(1, parseInt(valor) || 1);
    if (carritoPedidos[index]) {
        carritoPedidos[index].cantidad = cant;
        const subtotal = carritoPedidos[index].precio * cant;
        const celdaSubtotal = document.getElementById(`subtotal-${index}`);
        if (celdaSubtotal) {
            // Usamos formato moneda local
            celdaSubtotal.innerText = "$" + subtotal.toLocaleString('es-AR');
        }
        calcularTotalConfirmacion();
    }
}
    


function calcularTotalConfirmacion() {
    const total = carritoPedidos.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const display = document.getElementById('total-pedido-confirmar');
    if (display) {
        display.innerText = "$" + total.toLocaleString('es-AR', {minimumFractionDigits: 2});
        display.classList.add('animate-pulse');
        setTimeout(() => display.classList.remove('animate-pulse'), 500);
    }
}



async function ejecutarGeneracionPedido(idPedido, dias) {
    // 1. Mostrar bloqueo de pantalla N.I.C.O.
    Swal.fire({
        title: 'PROCESANDO ORDEN',
        html: '<div class="text-cyan-500 font-mono text-[10px]">Sincronizando con Google Cloud & Actualizando J2...</div>',
        background: '#0f172a',
        color: '#fff',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // 2. Preparar el paquete de datos
        const payload = {
            idPedido: idPedido,
            diasEntrega: dias,
            items: carritoPedidos,
            proveedorFinal: document.getElementById('cambiar-proveedor-final').value,
            fechaActualizacion: new Date().toLocaleString('es-AR') // Esto irá a J2
        };

        // 3. Llamada al servidor usando tu puente unificado
        const res = await callGoogleScript('procesarPedidoFinal', payload);

        if (res && res.status === "success") {
            Swal.fire({
                icon: 'success',
                title: '¡ORDEN CONFIRMADA!',
                html: `
                    <div class="text-slate-300 text-sm mb-4">La operación <b>${idPedido}</b> ha sido registrada.</div>
                    <a href="${res.url || '#'}" target="_blank" 
                       class="inline-block bg-cyan-600 text-white px-6 py-2 rounded font-bold text-xs hover:bg-cyan-500 transition-all">
                       DESCARGAR PDF DE ORDEN
                    </a>`,
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#0ea5e9'
            });

            // Limpieza y cierre
            carritoPedidos = [];
            if (typeof actualizarContadorVisual === "function") actualizarContadorVisual();
            document.getElementById('modal-maestro').classList.add('hidden');
            
        } else {
            throw new Error(res.message || "Error desconocido en el servidor");
        }

    } catch (err) {
        console.error("Falla en generación:", err);
        Swal.fire({
            icon: 'error',
            title: 'FALLA DE COMUNICACIÓN',
            text: 'No se pudo registrar el pedido: ' + err.message,
            background: '#0f172a',
            color: '#fff'
        });
    }
}




function volverAListaProductos() {
    cargarProductosPorProveedor();
}


function actualizarProveedorCarrito(nuevoProveedor) {
    if (carritoPedidos.length > 0) {
        // Actualizamos el proveedor en todos los items del carrito
        carritoPedidos.forEach(item => {
            item.proveedor = nuevoProveedor;
        });
        
        // Opcional: Podrías disparar una pequeña notificación visual en la consola N.I.C.O.
        console.log(`%c N.I.C.O. > Destinatario re-asignado: ${nuevoProveedor}`, "color: #00f2ff");
        
        // Si quieres que el título del modal cambie dinámicamente:
        const titulo = document.getElementById('modal-titulo');
        if(titulo) titulo.innerText = titulo.innerText.split('|')[0] + " | DEST: " + nuevoProveedor;
    }
}

/*----------------------------------- FUNCIONES DEL MODAL RECEPCIÓN---------------------------------*/
async function abrirRecepcion(datos, fila) {
    const idPedido = String(datos[0]).trim();
    const modal = document.getElementById('modalRecepcion');
    
    document.getElementById('recepcionID').value = idPedido;
    document.getElementById('recepcionFila').value = fila;

    const modalInterno = document.querySelector('#modalRecepcion > div');
    if (modalInterno) modalInterno.className = "modal-recep-content"; 

    document.getElementById('resumenPedido').innerHTML = `
    <div class="flex justify-between items-center w-full">
        <div>
            <h2 class="text-cyan-400 font-bold text-xs uppercase tracking-widest">ORDEN: ${idPedido}</h2>
            <p class="text-[10px] text-slate-500 uppercase">${datos[2]}</p>
        </div>
        <div class="text-right">
            <p class="text-cyan-500 font-bold text-xs">$${Number(datos[5]).toLocaleString()}</p>
            <p class="text-[9px] text-orange-500 uppercase">Arribo: ${datos[6] || '---'}</p>
        </div>
    </div>`;

    const contenedor = document.getElementById('contenedorItemsRecepcion');
    contenedor.innerHTML = `<div class="py-20 text-center text-cyan-500 text-[10px] animate-pulse">SOLICITANDO DESGLOSE A N.I.C.O...</div>`;

    modal.style.setProperty('display', 'flex', 'important');
    document.body.style.overflow = 'hidden';

    cambiarModoGestion('RECIBIDO'); 

    try {
        const res = await callGoogleScript('obtenerItemsPedido', { idPedido: idPedido });
        
        if (res.status === "success" && res.reply.success) {
            renderizarItemsDesgloseEspecial(res.reply.items, 'contenedorItemsRecepcion');
            const titulo = document.getElementById('recepcionTitulo');
            if(titulo) titulo.focus();
        } else {
            throw new Error(res.message || res.reply.error);
        }
    } catch (err) {
        console.error("Error al cargar items:", err);
        contenedor.innerHTML = `<div class="text-red-500 text-[10px] p-4 text-center">ERROR AL CARGAR ITEMS: ${err.message}</div>`;
    }
}
    


function renderizarItemsDesgloseEspecial(items, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    let html = `
    <table class="w-full text-[11px] border-collapse mb-4">
        <thead class="sticky top-0 bg-[#0f172a] z-30 shadow-md">
            <tr class="text-left text-slate-500 border-b border-cyan-900/50">
                <th class="p-3 uppercase">SKU / Producto</th>
                <th class="p-3 text-center uppercase">Pedida</th>
                <th class="p-3 text-right uppercase">Recibida</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">`;

    items.forEach(item => {
        html += `
        <tr class="hover:bg-cyan-500/5">
            <td class="p-3">
                <div class="font-mono text-cyan-400">${item.sku || 'N/A'}</div>
                <div class="text-[10px] text-slate-400 uppercase leading-tight">${item.nombre}</div>
            </td>
            <td class="p-3 text-center text-white font-mono font-bold">${item.cantidadPedida}</td>
            <td class="p-3 text-right">
                <input type="number" class="input-recibido-item w-20 bg-slate-950 border border-slate-700 rounded p-1 text-right text-cyan-400 font-bold outline-none" 
                        data-sku="${item.sku}" 
                        data-original="${item.cantidadPedida}" 
                        value="${item.cantidadPedida}"
                        oninput="recalcularPorcentajeDesdeItems()">
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
    
    // Ejecutamos el cálculo una vez al cargar para que empiece en 100% (o lo que corresponda)
    recalcularPorcentajeDesdeItems();
}
    


function recalcularPorcentajeDesdeItems() {
    const inputs = document.querySelectorAll('.input-recibido-item');
    let totalPedido = 0;
    let totalRecibido = 0;

    inputs.forEach(input => {
        // Obtenemos los valores de los atributos data-original y el value actual
        const pedido = parseFloat(input.getAttribute('data-original')) || 0;
        const recibido = parseFloat(input.value) || 0;
        
        totalPedido += pedido;
        totalRecibido += recibido;
    });

    if (totalPedido === 0) return;

    // Cálculo del porcentaje
    let porcentaje = Math.round((totalRecibido / totalPedido) * 100);
    
    // Limitar a 100 para evitar que pedidos excedentes rompan la métrica
    if (porcentaje > 100) porcentaje = 100;

    // Actualizar el Slider y el Texto visualmente
    const slider = document.getElementById('inputPorcentaje');
    const display = document.getElementById('valorPorcentaje');
    
    if (slider) slider.value = porcentaje;
    if (display) display.innerText = porcentaje + "%";
}
    


async function confirmarGestionFinal() {
    const btn = document.getElementById('btnConfirmarGestion');
    
    const listaInputs = document.querySelectorAll('.input-recibido-item');
    let itemsRecibidos = [];
    listaInputs.forEach(input => {
        itemsRecibidos.push({
            sku: input.getAttribute('data-sku') || "",
            cantidadRecibida: parseFloat(input.value) || 0,
            cantidadPedida: parseFloat(input.dataset.original) || 0
        });
    });

    const config = {
        idPedido: document.getElementById('recepcionID').value,
        filaEstado: document.getElementById('recepcionFila').value,
        accion: document.getElementById('accionActual').value,
        porcentaje: document.getElementById('inputPorcentaje').value,
        calidad: typeof calidadSeleccionada !== 'undefined' ? calidadSeleccionada : 0,
        observaciones: document.getElementById('inputObservaciones').value.trim(),
        esCausaProveedor: document.getElementById('inputCausa') ? document.getElementById('inputCausa').value === 'proveedor' : false,
        nuevaFecha: document.getElementById('inputNuevaFecha') ? document.getElementById('inputNuevaFecha').value : "",
        itemsRecibidos: itemsRecibidos 
    };

    if (config.accion === 'REPROGRAMADO' && !config.nuevaFecha) {
        Swal.fire({ title: 'FECHA REQUERIDA', text: 'Indique la nueva fecha.', icon: 'warning' });
        return;
    }

    btn.innerText = "PROCESANDO...";
    btn.disabled = true;

    try {
        const res = await callGoogleScript('gestionarEstadoPedidoServidor', config);
        
        if (res.status === "success" && res.reply.success) {
            cerrarModalRecepcion();
            Swal.fire({ title: 'ÉXITO', text: 'Pedido impactado.', icon: 'success', timer: 1500, showConfirmButton: false })
            .then(() => verEstadoPedidos());
        } else {
            throw new Error(res.message || res.reply.error);
        }
    } catch (err) {
        Swal.fire({ title: 'ERROR', text: err.message, icon: 'error' });
        btn.innerText = "CONFIRMAR"; 
        btn.disabled = false;
    }
}
    

function setCalidad(valor) {
    calidadSeleccionada = valor;
    document.getElementById('inputCalidad').value = valor;
    
    // Feedback visual: iluminar estrellas
    const estrellas = document.querySelectorAll('.btn-star');
    estrellas.forEach((estrella, index) => {
        if (index < valor) {
            estrella.style.color = "#eee346"; // Cian activo
            estrella.style.textShadow = "0 0 10px #a41721";
        } else {
            estrella.style.color = "#2499d8"; // Apagado
            estrella.style.textShadow = "none";
        }
    });
}

async function verEstadoPedidos() {
    const modal = document.getElementById('modal-maestro');
    const contenedor = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');

    titulo.innerText = "GESTIÓN DE RECEPCIÓN";
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Loader N.I.C.O.
    contenedor.innerHTML = `<div class="flex flex-col items-center justify-center py-20">
        <div class="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-cyan-500 animate-pulse font-mono text-xs uppercase tracking-widest">Sincronizando Recepciones...</p>
    </div>`;

    try {
        const res = await callGoogleScript('obtenerTablaGenerica', { tipo: 'RECEPCION' });
        
        if (res.status === "success" && res.reply.success) {
            const data = res.reply;
            
            // Construimos la estructura de la tabla (igual que en cargarTablaGenerica)
            const nombreHojaReal = 'Estado_Pedidos';
            const columnasCabecera = ENCABEZADOS_SISTEMA[nombreHojaReal] || [];

            contenedor.innerHTML = `
                <div class="wrapper-tabla-final px-4">
                    <table id="tabla-maestra-generica" class="tabla-premium w-full">
                        <thead>
                            <tr>${columnasCabecera.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>`;

            // Llamamos al render de DataTables
            renderTableNico('#tabla-maestra-generica', data.data, nombreHojaReal);
            
        } else {
            throw new Error(res.reply.error || "Error desconocido");
        }
    } catch (err) {
        contenedor.innerHTML = `<div class="p-4 text-red-400 text-xs font-mono">ERROR: ${err.message}</div>`;
    }
}


function cambiarModoGestion(modo) {
    document.getElementById('accionActual').value = modo;

    const secRecibido = document.getElementById('section-RECIBIDO');
    const btnFinal = document.getElementById('btnConfirmarGestion');
    const inputObs = document.getElementById('inputObservaciones');
    const wrapperCausa = document.getElementById('wrapper-causa-cancelacion');
    const footer = document.querySelector('.sect-footer');

    switch (modo) {
        case 'RECIBIDO':
            if (secRecibido) secRecibido.style.display = 'block';
            if (wrapperCausa) wrapperCausa.classList.add('hidden'); 
            
            btnFinal.innerText = "PROCESAR RECEPCIÓN";
            btnFinal.style.background = "#22c55e"; 
            btnFinal.style.borderColor = "#16a34a";
            inputObs.placeholder = "Notas de la recepción (opcional)...";
            break;

        case 'REPROGRAMADO':
            if (secRecibido) secRecibido.style.display = 'none';
            if (wrapperCausa) wrapperCausa.classList.add('hidden'); 
            
            btnFinal.innerText = "CONFIRMAR REPROGRAMACIÓN";
            btnFinal.style.background = "#eab308";
            btnFinal.style.borderColor = "#ca8a04";
            inputObs.value = ""; 
            inputObs.placeholder = "Esperando selección de fecha...";
            solicitarFechaReprogramacion();
            break;

        case 'CANCELADO':
            if (secRecibido) secRecibido.style.display = 'none';
            if (wrapperCausa) wrapperCausa.classList.remove('hidden'); 
            
            btnFinal.innerText = "CONFIRMAR ANULACIÓN";
            btnFinal.style.background = "#ef4444"; 
            btnFinal.style.borderColor = "#dc2626";
            inputObs.placeholder = "MOTIVO DE CANCELACIÓN OBLIGATORIO...";
            inputObs.focus(); 
            break;
    }
    if (footer) {
        footer.style.pointerEvents = 'none';
    }
        console.log("🛠️ N.I.C.O. Terminal: Modo cambiado a " + modo);
}

function cerrarModalRecepcion() {
    const modal = document.getElementById('modalRecepcion');
    const titulo = document.getElementById('recepcionTitulo');
    const tabsModo = document.querySelector('.modal-body-recep .flex.gap-4');
    const footerAction = document.getElementById('section-footer');
    const obs = document.getElementById('inputObservaciones');

    if (titulo) titulo.innerText = "GESTIÓN DE RECEPCIÓN";
    if (tabsModo) tabsModo.classList.remove('hidden');
    if (footerAction) footerAction.style.display = 'flex';
    if (obs) {
        obs.disabled = false;
        obs.value = "";
    }

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    const mainContent = document.getElementById('content');
    if (mainContent) mainContent.removeAttribute('inert');
}

async function solicitarFechaReprogramacion() {
    const mainContent = document.getElementById('content');
    if (mainContent) mainContent.removeAttribute('aria-hidden');

    const { value: fecha, dismiss } = await Swal.fire({
        title: 'REPROGRAMAR ARRIBO',
        input: 'date',
        inputLabel: '¿Cuándo llegará el pedido?',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#eab308',
        showCancelButton: true,
        cancelButtonText: 'VOLVER',
        returnFocus: false,
        
         didOpen: () => {
            const container = Swal.getContainer();
            if (container) {
                container.style.zIndex = '30000'; 
            }
        }
    });

    if (fecha) {
        let inputF = document.getElementById('inputNuevaFecha');
        if (!inputF) {
            inputF = document.createElement('input');
            inputF.type = 'hidden';
            inputF.id = 'inputNuevaFecha';
            document.getElementById('formRecepcion').appendChild(inputF);
        }
        inputF.value = fecha;

        const display = document.getElementById('display-fecha-reprogramada');
        if (display) display.innerText = fecha.split('-').reverse().join('/');

        document.getElementById('inputObservaciones').value = `REPROGRAMADO PARA EL: ${fecha}`;
        console.log("✅ Fecha asignada:", fecha);
    }
}



/*--------------SECCION HISTORIAL-----------------------*/

async function verDetalleHistorial(idPedido) {
    const modal = document.getElementById('modalDetalleHistorial');
    const contenedor = document.getElementById('contenedorItemsHistorial');
    const subtitulo = document.getElementById('historialSubtitulo');
    
    // Preparar UI
    subtitulo.innerText = `EXPEDIENTE: ${idPedido}`;
    contenedor.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-cyan-500 font-mono text-[9px] uppercase tracking-widest italic">Accediendo al archivo central...</p>
        </div>`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        const res = await callGoogleScript('obtenerItemHistorial', { idPedido: idPedido });
        
        if (res.status === "success" && res.reply.success) {
            const data = res.reply;
            
            // 1. Construir Cabecera de Datos Maestros
            let html = `
            <div class="grid grid-cols-2 gap-3 p-4 mb-4 bg-slate-950/50 border border-slate-800 rounded-lg text-[10px]">
                <div class="space-y-2">
                    <div>
                        <p class="text-slate-500 uppercase text-[8px] font-bold">Proveedor / Origen</p>
                        <p class="text-cyan-400 font-bold uppercase">${data.info.proveedor}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 uppercase text-[8px] font-bold">Estatus Final</p>
                        <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">${data.info.estatus}</span>
                    </div>
                </div>
                <div class="space-y-2 text-right">
                    <div>
                        <p class="text-slate-500 uppercase text-[8px] font-bold">Registro / Cierre</p>
                        <p class="text-slate-300 font-mono">${data.info.fechaPedido} <span class="text-slate-600">>></span> ${data.info.fechaRecepcion}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 uppercase text-[8px] font-bold">Performance</p>
                        <p class="text-yellow-500">${data.info.calidad} <span class="text-slate-400 ml-2 font-mono">${data.info.cumplimiento}</span></p>
                    </div>
                </div>
                <div class="col-span-2 pt-2 border-t border-slate-800/50">
                    <p class="text-slate-500 uppercase text-[8px] font-bold">Observaciones de Gestión</p>
                    <p class="text-slate-400 italic">"${data.info.observaciones}"</p>
                </div>
            </div>`;

            // 2. Tabla de Desglose de Inversión
            html += `
            <div class="overflow-hidden rounded border border-slate-800">
                <table class="w-full text-[11px] border-collapse">
                    <thead>
                        <tr class="bg-slate-900/80 text-slate-500 text-left border-b border-slate-800">
                            <th class="p-2 uppercase text-[8px] font-black">Descripción del Ítem</th>
                            <th class="p-2 uppercase text-[8px] font-black text-right">Inversión Final</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/30">`;

            let totalInversion = 0;
            data.items.forEach((item) => {
                totalInversion += item.inversion;
                html += `
                <tr class="hover:bg-cyan-500/5 transition-colors">
                    <td class="p-2 text-slate-300">
                        <span class="text-cyan-900 mr-2 font-mono">▸</span>${item.producto}
                    </td>
                    <td class="p-2 text-right text-white font-mono">$${item.inversion.toLocaleString()}</td>
                </tr>`;
            });

            html += `
                    </tbody>
                    <tfoot>
                        <tr class="bg-cyan-500/5 border-t border-cyan-500/20">
                            <td class="p-2 text-cyan-500 font-bold uppercase text-[9px]">Total Invertido</td>
                            <td class="p-2 text-right text-cyan-400 font-bold font-mono">$${totalInversion.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;

            contenedor.innerHTML = html;

        } else {
            throw new Error(res.reply.error || "No se pudo recuperar la información.");
        }
    } catch (err) {
        console.error("Error Historial:", err);
        contenedor.innerHTML = `
            <div class="p-10 text-center">
                <div class="text-red-500 mb-2">⚠️</div>
                <p class="text-red-400 uppercase text-[10px] font-mono">${err.message}</p>
            </div>`;
    }
}

function cerrarModalHistorial() {
    document.getElementById('modalDetalleHistorial').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function renderizarTablaItemsHistorial(items) {
    let html = `<table class="w-full text-left text-[11px] border-collapse">
        <thead>
            <tr class="bg-slate-900 border-b border-slate-800">
                <th class="p-2 text-cyan-500 font-bold">PRODUCTO</th>
                <th class="p-2 text-cyan-500 font-bold text-center">CANT.</th>
                <th class="p-2 text-cyan-500 font-bold text-right">PRECIO UNIT.</th>
                <th class="p-2 text-cyan-500 font-bold text-right">SUBTOTAL</th>
            </tr>
        </thead>
        <tbody>`;

    items.forEach(item => {
        const subtotal = (item.cantidad * item.precio) || 0;
        html += `
        <tr class="border-b border-slate-900 hover:bg-white/5">
            <td class="p-2 text-slate-300">${item.nombre}</td>
            <td class="p-2 text-center text-white font-mono">${item.cantidad}</td>
            <td class="p-2 text-right text-slate-400">$${Number(item.precio).toLocaleString()}</td>
            <td class="p-2 text-right text-cyan-400 font-bold">$${subtotal.toLocaleString()}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    document.getElementById('contenedorItemsHistorial').innerHTML = html;
}



/*-------------------SECCION DATOS SEMANALES------------------------------*/

let navegacionSemanal = {
    semanaActual: null,
    diaActual: null
};

function abrirModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    console.log("🚀 Módulo de Reportes Semanales cargado correctamente."); //Acá

    if (modal) modal.style.display = 'flex';
}

function cerrarModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('contenido-reporte-lex').innerHTML = ''; 
    }
}

async function abrirModalSemanal() {
    console.log("🚩 INICIO: abrirModalSemanal");
    mostrarCargandoLex(true);
    abrirModalReportes(); 

    try {
        const res = await callGoogleScript('obtenerDatosReporteSemanal');
        console.log("📦 Respuesta bruta recibida:", res);
        
        // EL TRUCO ESTÁ AQUÍ:
        // Tu log muestra que los datos están en res.reply.reply
        let data = res.reply;
        if (data && data.reply) {
            data = data.reply; // Bajamos un nivel más
        }
        
        console.log("🔍 Data real extraída:", data);

        const filasRaw = data.filas || [];
        const semanasRelativas = data.semanasRelativas || [];

        // Quitamos la fila de encabezados si existe
        if (filasRaw.length > 0 && filasRaw[0].idprov === 'ID PROV') {
            filasRaw.shift();
        }

        console.log("📊 Filas listas para renderizar:", filasRaw.length);

        if (filasRaw.length === 0) {
            console.warn("⚠️ AVISO: GAS no devolvió filas.");
            document.getElementById('contenido-reporte-lex').innerHTML = 
                `<div style="color:white; text-align:center; padding:20px;">No hay datos disponibles.</div>`;
            return;
        }

        // Llamamos al render con el objeto limpio
        renderizarVistaMes({ filas: filasRaw, semanasRelativas: semanasRelativas });

    } catch (err) {
        console.error("❌ ERROR CRÍTICO:", err);
    } finally {
        mostrarCargandoLex(false);
    }
}

function renderizarVistaMes(response) {
    const { filas, semanasRelativas } = response;
    const contenedor = document.getElementById('contenido-reporte-lex');
    
    // Limpiamos las semanas para el encabezado (quitamos la primera si está vacía)
    const semanasHead = semanasRelativas.filter(s => s !== "");

    let html = `
    <div class="lex-report-toolbar" style="margin-bottom:15px;">
        <button onclick="ejecutarSincronizacionRelampago()" class="lex-btn-nav" style="color:#eab308; border-color:#eab308;">
            <i class="fas fa-sync-alt"></i> REFRESCAR DATOS
        </button>
    </div>
    <div style="overflow-x:auto;" class="custom-scroll">
        <table class="lex-table-report">
            <thead>
                <tr>
                    <th style="text-align:left; min-width:200px;">PROVEEDOR</th>
                    ${semanasHead.map((s, index) => {
                        // Intentamos que el título sea amigable si es una fecha
                        const d = new Date(s);
                        const titulo = isNaN(d) ? s : `SEM ${index + 1}`; 
                        return `<th style="text-align:center">${titulo}</th>`;
                    }).join('')}
                </tr>
            </thead>
            <tbody>
                ${filas.map(f => `
                    <tr>
                        <td style="border-left: 3px solid var(--lex-gold); padding-left:10px;">
                            <div style="font-size:10px; color:#64748b;">ID: ${f.idprov}</div>
                            <div style="font-weight:bold; color:#fff;">${f.nombre}</div>
                        </td>
                        <td style="text-align:center">${formatearEstado(f.s1)}</td>
                        <td style="text-align:center">${formatearEstado(f.s2)}</td>
                        <td style="text-align:center">${formatearEstado(f.s3)}</td>
                        <td style="text-align:center">${formatearEstado(f.s4)}</td>
                        <td style="text-align:center">${formatearEstado(f.s5)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;

    contenedor.innerHTML = html;
}


async function verDetalleSemana(numSemana) {
    mostrarCargandoLex(true);
    navegacionSemanal.semanaActual = numSemana;
    const contenedor = document.getElementById('contenido-reporte-lex');
    const titulo = document.getElementById('reportesTitulo');

    try {
        const res = await callGoogleScript('procesarFiltradoHoja', { param: numSemana, tipo: "SEMANA" });
        const data = (res && res.reply) ? res.reply : res;        
        
        titulo.innerText = `PLANIFICACIÓN: SEMANA ${numSemana}`;
        const dias = [
            { corto: 'LUN', largo: 'LUNES' }, { corto: 'MAR', largo: 'MARTES' },
            { corto: 'MIE', largo: 'MIERCOLES' }, { corto: 'JUE', largo: 'JUEVES' },
            { corto: 'VIE', largo: 'VIERNES' }, { corto: 'SAB', largo: 'SABADO' }
        ];

        let html = `
            <div class="lex-report-toolbar" style="margin-bottom:15px;">
              <button onclick="abrirModalSemanal()" class="lex-btn-nav">← VOLVER AL MES</button>
            </div>
            <div class="overflow-x-auto custom-scroll">
            <table class="lex-table-report">
              <thead>
                  <tr>
                      <th style="width:250px">PROVEEDOR</th>
                      ${dias.map(d => `
                      <th style="text-align:center"> 
                          <button onclick="verDetalleDia('${d.largo}', ${numSemana})" class="lex-btn-nav" style="width:100%; font-size:10px;">
                              ${d.corto} <i class="fas fa-eye" style="display:block; margin-top:4px"></i>
                          </button>
                      </th>
                      `).join('')}
                  </tr>
              </thead>
              <tbody>`;
        
        if (!data || data.length === 0) {
            html += `<tr><td colspan="7" style="padding:50px; text-align:center; color:#64748b;">No hay registros para filtrar.</td></tr>`;
        } else {
            data.forEach(fila => {
                html += `
                <tr>
                    <td style="font-weight:bold; color:#fff;">${fila[1]}</td>
                    <td style="text-align:center">${formatearEstado(fila[2])}</td>
                    <td style="text-align:center">${formatearEstado(fila[3])}</td>
                    <td style="text-align:center">${formatearEstado(fila[4])}</td>
                    <td style="text-align:center">${formatearEstado(fila[5])}</td>
                    <td style="text-align:center">${formatearEstado(fila[6])}</td>
                    <td style="text-align:center">${formatearEstado(fila[7])}</td>
                </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        contenedor.innerHTML = html;

    } catch (e) {
        console.error("Error en verDetalleSemana:", e);
        contenedor.innerHTML = `<div style="color:red; padding:20px;">Error: ${e.message}</div>`;
    } finally {
        mostrarCargandoLex(false);
    }
}

// HELPERS DE FORMATO
function formatearEstado(e) {
    if (!e || e === "" || e === "NO") return `<span class="status-lex status-lex-error" style="opacity:0.4">NO</span>`;
    let txt = e.toString().toUpperCase();
    if (txt.includes("SI") || txt.includes("✅")) return `<span class="status-lex status-lex-ok">RECIBIDO</span>`;
    if (txt.includes("REPRO") || txt.includes("⚠️")) return `<span class="status-lex status-lex-warn">REPROG.</span>`;
    return `<span class="status-lex" style="background:#475569">${txt}</span>`;
}

function mostrarCargandoLex(show) {
    const contenedor = document.getElementById('contenido-reporte-lex');
    if (show) {
        const loader = document.createElement('div');
        loader.id = "lex-loader-overlay";
        loader.innerHTML = `
            <div style="position:absolute; inset:0; background:rgba(15,23,42,0.8); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:1000;">
                <div class="lex-spinner"></div>
                <span style="color:#c2902e; font-size:9px; margin-top:15px; letter-spacing:2px;">ACCEDIENDO AL ARCHIVO MAESTRO...</span>
            </div>`;
        contenedor.appendChild(loader);
    } else {
        const loader = document.getElementById('lex-loader-overlay');
        if (loader) loader.remove();
    }
}

async function abrirArchivoPedido(idPedido) {
    mostrarCargandoLex(true);

    try {
        // Llamada a la nueva función unificada del servidor
        const res = await callGoogleScript('obtenerArchivoPedido', { idPedido: idPedido });
        const data = (res && res.reply) ? res.reply : res;

        if (!data) {
            alert("SISTEMA: No se encontró ningún documento (PDF/CSV) asociado al pedido " + idPedido);
            mostrarCargandoLex(false);
            return;
        }

        const visor = document.getElementById('visor-pdf-lex');
        const iframe = document.getElementById('pdf-frame-lex');
        
        // Limpieza previa del visor
        iframe.style.display = 'none';
        const visorContenidoExtra = document.getElementById('visor-csv-container') || document.createElement('div');
        visorContenidoExtra.id = 'visor-csv-container';
        visorContenidoExtra.innerHTML = '';
        if (!document.getElementById('visor-csv-container')) visor.appendChild(visorContenidoExtra);

        if (data.tipo === 'pdf') {
            // Lógica para PDF
            const blob = base64ToBlob(data.contenido, 'application/pdf');
            const url = URL.createObjectURL(blob);
            iframe.src = url;
            iframe.style.display = 'block';
            visor.dataset.currentBlob = url;
        } 
        else if (data.tipo === 'csv') {
            // Lógica para CSV (inyectamos la tabla HTML que generó el servidor)
            visorContenidoExtra.innerHTML = `
                <div style="padding:20px; color:#cbd5e1;">
                    <h3 style="color:#c2902e; margin-bottom:15px; font-size:12px;">VISTA PREVIA CSV: ${data.nombre}</h3>
                    <div class="lex-csv-wrapper">${data.contenido}</div>
                </div>`;
            visorContenidoExtra.style.display = 'block';
        }

        visor.style.display = 'flex';

    } catch (e) {
        console.error("Error al abrir archivo:", e);
        alert("Error de comunicación con el archivo.");
    } finally {
        mostrarCargandoLex(false);
    }
}

function cerrarVisorLex() {
    const visor = document.getElementById('visor-pdf-lex');
    const iframe = document.getElementById('pdf-frame-lex');
    if (visor.dataset.currentBlob) URL.revokeObjectURL(visor.dataset.currentBlob);
    iframe.src = "";
    visor.style.display = 'none';
}

async function exportarVistaActualALex() {
    const contenedor = document.getElementById('contenido-reporte-lex');
    const tabla = contenedor.querySelector('table');
    
    if (!tabla) {
        alert("SISTEMA: No hay datos en pantalla para exportar.");
        return;
    }

    mostrarCargandoLex(true);

    try {
        const filas = [];
        const headers = [];
        
        // 1. Capturamos los encabezados
        tabla.querySelectorAll('thead th').forEach(th => headers.push(th.innerText.trim()));
        filas.push(headers);

        // 2. Capturamos los datos de las celdas
        tabla.querySelectorAll('tbody tr').forEach(tr => {
            const fila = [];
            tr.querySelectorAll('td').forEach(td => {
                // Si la celda tiene un badge, tomamos su texto, si no, el texto de la celda
                const badge = td.querySelector('span');
                fila.push(badge ? badge.innerText.trim() : td.innerText.trim());
            });
            filas.push(fila);
        });

        const tituloReporte = document.getElementById('titulo-reporte-lex').innerText;

        // 3. Enviamos al servidor
        const res = await callGoogleScript('generarReporteExcel', { 
            datos: filas, 
            titulo: tituloReporte 
        });

        if (res.reply && res.reply.url) {
            // Descarga directa
            const link = document.createElement('a');
            link.href = res.reply.url;
            link.download = ""; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (e) {
        console.error("Error en exportación:", e);
        alert("Falla en el protocolo de exportación.");
    } finally {
        mostrarCargandoLex(false);
    }
}

function base64ToBlob(base64, type) {
    const bin = atob(base64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: type });
}


async function ejecutarSincronizacionRelampago() {
    mostrarCargandoLex(true);
    try {
        const res = await callGoogleScript('verificarReporteSemanal');
        if (res.status === "success") {
            // Como es solo lectura, volvemos al panel principal para ver los cambios globales
            await abrirModalSemanal();
        }
    } catch (err) {
        console.error("Falla en Sync:", err);
    } finally {
        mostrarCargandoLex(false);
    }
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada sin errores críticos.");
