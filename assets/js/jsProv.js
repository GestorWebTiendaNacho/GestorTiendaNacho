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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 1.");

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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 2.");

window.actualizarInterfaz = function() {
    const el = document.getElementsByClassName("arrow-wrapper")[0];
    if (!el) return;
    const claseVieja = "speed-" + (typeof prevSpeed !== 'undefined' ? prevSpeed : 0);
    const claseNueva = "speed-" + speed;
    el.classList.remove(claseVieja);
    el.classList.add(claseNueva);
    window.prevSpeed = speed;
};
    console.log("✅ N.I.C.O. Terminal: Carga finalizada 3.");

window.changeActive = function() {
    let nombreClaseBusqueda = "speedometer-Scale-" + currentScale;
    const el = document.getElementsByClassName(nombreClaseBusqueda)[0];
    if (el) {
        el.classList.toggle("active");
    }
};
    console.log("✅ N.I.C.O. Terminal: Carga finalizada 4.");


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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 5.");

        function cambiarEstado(nuevoEstado) {
            if (ESTADOS[nuevoEstado] && nico.estadoActual !== nuevoEstado) {
                nico.estadoActual = nuevoEstado;
                nico.fps = (nuevoEstado === "RESPONDE") ? 12 : 9;
                nico.img.src = ESTADOS[nuevoEstado];
                nico.frame = 0;
            }
        }
            console.log("✅ N.I.C.O. Terminal: Carga finalizada 6.");

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
    console.log("✅ N.I.C.O. Terminal: Carga finalizada 7.");
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
     console.log("✅ N.I.C.O. Terminal: Carga finalizada 8.");

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
            console.log("✅ N.I.C.O. Terminal: Carga finalizada 9.");  

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
 console.log("✅ N.I.C.O. Terminal: Carga finalizada 10.");


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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 11.");


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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 12.");


//-------SECCION DE APERTURA DEL MODAL Y CARGA DE TABLAS------------------------------------
var MAPA_HOJAS = {
    'HISTORIAL': 'Historial_Compras',
    'PROVEEDORES': 'baseProveedores',
    'BASE PROVEEDORES': 'baseProveedores', 
    'BASEPROVEEDORES': 'baseProveedores', 
    'ESTADO': 'Estado_Pedidos',
    'PRODUCTOS': 'baseProductos',
    'RECEPCIÓN': 'Estado_Pedidos'
};

var ENCABEZADOS_SISTEMA = {
    'baseProveedores': ['ID','RAZÓN SOCIAL','CIUDAD','DOMICILIO','TELÉFONO','EMAIL','CODIGO PROV','PROVINCIA','ACCIONES'],
    'baseProductos': ['ID','NOMBRE PROD','CODIGO','COSTO INTERNO','STOCK ACTUAL','ID PROVEEDOR','NOMBRE PROVEEDOR','STOCK MINIMO', 'ACCIONES'],
    'Estado_Pedidos': ['ID_Pedido','Fecha_Pedido','Proveedor_Nombre','Estatus','Cantidad Productos','Total_General','Nueva_Fecha Reprogramada','OBSERVACIONES', 'ACCIONES'],
    'Historial_Compras': ['ID_Pedido','Fecha_Pedido','Nombre_Proveedor','Estatus','Unidades Adquiridas','Total Inversión','Fecha Recepción','Nivel Cumplimiento','Calidad/Precio','Días de Demora','OBSERVACIONES', 'ACCIONES']
};

async function cargarTablaGenerica(nombreHoja) {
    const contenedor = document.getElementById('modal-contenido');
    const nombreHojaReal = MAPA_HOJAS[nombreHoja] || nombreHoja;
    const columnasCabecera = ENCABEZADOS_SISTEMA[nombreHojaReal] || [];

    // Protocolo de carga visual N.I.C.O.
    contenedor.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 space-y-4">
        <div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-cyan-500 font-mono text-[12px] tracking-[0.4em] uppercase">Sincronizando: ${nombreHojaReal}</p>
    </div>`;

    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: nombreHoja });

        if (res && res.status === "success" && res.reply.success) {
            const data = res.reply;
            
            contenedor.innerHTML = `
                <div class="w-full flex justify-between items-end mb-6 px-4">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-cyan-500/40 font-mono italic">DATA_SOURCE: ${nombreHojaReal}</span>
                        <span class="text-[11px] text-cyan-500 font-black tracking-widest uppercase">TERMINAL DE CONTROL</span>
                    </div>
                    <div class="bg-slate-950/80 border border-cyan-900/40 px-4 py-2 rounded-sm">
                        <p class="text-[10px] text-slate-400 font-bold">ACTUALIZACIÓN: <span class="text-cyan-400 font-mono">${data.ultimaActualizacion || '---'}</span></p>
                    </div>
                </div>
                <div class="wrapper-tabla-final">
                    <table id="tabla-maestra-generica" class="tabla-premium">
                        <thead>
                            <tr>${columnasCabecera.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>`;

            renderTableNico('#tabla-maestra-generica', data.data, nombreHojaReal);

        } else {
            const errorMsg = res.reply?.error || res.message || "Error en enlace de datos";
            throw new Error(errorMsg);
        }
    } catch (err) {
        console.error("Error en carga genérica:", err);
        contenedor.innerHTML = `
            <div class="p-8 text-red-500 font-mono border border-red-900/30 text-center uppercase text-[10px]">
                Critical Error: ${err.message}
            </div>`;
    }
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 13.");


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

    const columnas = ENCABEZADOS_SISTEMA[nombreHojaReal];
    const indexAcciones = columnas.length - 1;

    const configDefs = columnas.map((titulo, i) => {
        if (i === indexAcciones) {
            return {
                targets: i,
                orderable: false,
                className: "text-center align-middle",
                render: function(val, type, row, meta) {
                    const filaIndex = meta.row + 2;
                    const rowJson = JSON.stringify(row).replace(/"/g, '&quot;');
                    if (nombreHojaReal === "Historial_Compras") return `<button onclick='verDetalleHistorial("${row[0]}")' class='btn-accion-nico'>DETALLE</button>`;
                    if (nombreHojaReal === "Estado_Pedidos") return `<button onclick='abrirRecepcion(${rowJson}, ${filaIndex})' class='btn-accion-nico'>GESTIONAR</button>`;
                    return `<button onclick='abrirEditorGenerico("${nombreHojaReal}", ${filaIndex}, "${rowJson}")' class='btn-accion-nico'>EDITAR</button>`;
                }
            };
        }
        return { targets: i, className: "p-3 dt-nowrap" };
    });

    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().destroy();
    }

    $(selector).DataTable({
        data: data,
        dom: 'rtip',
        language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
        pageLength: 15,
        scrollX: false, 
        autoWidth: false,
        
        columnDefs: configDefs,
        headerCallback: function(thead) {
            $(thead).find('th').addClass('text-cyan-500 font-black uppercase tracking-widest text-[11px] p-4');
        }
    });

    const contenedor = document.getElementById('contenedor-estilo-malevich');
    if (contenedor) {
        contenedor.style.overflowY = "auto";
        contenedor.style.width = "100%";
        contenedor.style.display = "block";
    }
}


console.log("✅ N.I.C.O. Terminal: Carga finalizada 14.");


function getTipoByHoja(hoja) {
    const nombres = {
        'baseProveedores': 'PROVEEDORES',
        'Historial_Compras': 'HISTORIAL',
        'baseProductos': 'PRODUCTOS',
        'Estado_Pedidos': 'ESTADO'
    };
    
    return nombres[hoja] || 'SISTEMA';
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 15.");

function escapingForOption(str) {
    if (!str) return "";
    return str.toString().replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 16.");


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
    

console.log("✅ N.I.C.O. Terminal: Carga finalizada 17.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 18.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 19.");



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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 20.");

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
console.log("✅ N.I.C.O. Terminal: Carga finalizada 21.");


function actualizarContadorVisual() {
    const contador = document.getElementById('contador-items');
    if (contador) {
        contador.innerHTML = `Items seleccionados: <span class="text-cyan-400 font-bold">${carritoPedidos.length}</span>`;
    }
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 22.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 23.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 25-fin.");



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
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 26.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 27.");


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
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 28.");


function calcularTotalConfirmacion() {
    const total = carritoPedidos.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const display = document.getElementById('total-pedido-confirmar');
    if (display) {
        display.innerText = "$" + total.toLocaleString('es-AR', {minimumFractionDigits: 2});
        display.classList.add('animate-pulse');
        setTimeout(() => display.classList.remove('animate-pulse'), 500);
    }
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 29.");


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

console.log("✅ N.I.C.O. Terminal: Carga finalizada 30.");



function volverAListaProductos() {
    cargarProductosPorProveedor();
}
console.log("✅ N.I.C.O. Terminal: Carga finalizada 31.");


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
        // Migración a callGoogleScript
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
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 32.");


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
                       data-sku="${item.sku}" data-original="${item.cantidadPedida}" value="${item.cantidadPedida}">
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 33.");


function recalcularPorcentajeDesdeItems() {
    const inputs = document.querySelectorAll('.input-recibido-item');
    let totalPedido = 0;
    let totalRecibido = 0;

    inputs.forEach(input => {
        totalPedido += parseFloat(input.dataset.original) || 0;
        totalRecibido += parseFloat(input.value) || 0;
    });

    if (totalPedido === 0) return;

    let porcentaje = Math.round((totalRecibido / totalPedido) * 100);
    if (porcentaje > 100) porcentaje = 100;

    const slider = document.getElementById('inputPorcentaje');
    if (slider) {
        slider.value = porcentaje;
        actualizarValorPorcentaje(porcentaje);
    }
}
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 34.");


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
    
console.log("✅ N.I.C.O. Terminal: Carga finalizada 35.");


async function verEstadoPedidos() {
    const modal = document.getElementById('modal-maestro');
    const contenedor = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');

    titulo.innerText = "GESTIÓN DE RECEPCIÓN";
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    contenedor.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
            <div class="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-cyan-500 animate-pulse font-mono text-xs uppercase tracking-widest">Sincronizando Registros de Recepción...</p>
        </div>`;

    try {
        // En este caso, el servidor devuelve HTML directamente
        const res = await callGoogleScript('obtenerTablaGenerica', { tipo: "RECEPCION" });
        
        if (res.status === "success") {
            const html = res.reply; // El HTML generado por obtenerTablaGenerica
            if (!html) {
                contenedor.innerHTML = "<p class='text-slate-500 p-4 text-center text-[10px]'>NO HAY DATOS EN RECEPCIÓN</p>";
                return;
            }
            contenedor.innerHTML = html;
            
            // Inyección de scripts si existen (DataTables, etc)
            if (html.indexOf('<script') !== -1 && typeof ejecutarScriptsInyectados === "function") {
                ejecutarScriptsInyectados(contenedor);
            }
        }
    } catch (err) {
        console.error("Error al refrescar tabla:", err);
        contenedor.innerHTML = `<div class="p-4 bg-red-900/20 border border-red-500/50 text-red-400 text-[10px] font-mono">ERROR DE ENLACE: ${err.message}</div>`;
    }
}

console.log("✅ N.I.C.O. Terminal: Carga finalizada 36.");

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

function verDetalleHistorial(idPedido) {
    const modal = document.getElementById('modalDetalleHistorial');
    const contenedor = document.getElementById('contenedorItemsHistorial');
    const subtitulo = document.getElementById('historialSubtitulo');
    
    subtitulo.innerText = `ID: ${idPedido}`;
    contenedor.innerHTML = `<div class="p-10 text-center text-cyan-500 text-[10px] animate-pulse">RECOMPILANDO DATOS...</div>`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    google.script.run
        .withSuccessHandler(res => {
            if (res.success) {
                //Construir Cabecera Única
                let html = `
                <div class="grid grid-cols-2 gap-4 p-4 mb-4 bg-slate-900/50 border border-slate-800 rounded-lg text-[11px]">
                    <div>
                        <p class="text-slate-500 uppercase text-[9px]">Proveedor</p>
                        <p class="text-cyan-400 font-bold">${res.info.proveedor}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-slate-500 uppercase text-[9px]">Fecha Registro</p>
                        <p class="text-slate-300">${res.info.fecha}</p>
                    </div>
                </div>`;

                // Construir Tabla de Ítems (Unidades e Inversión)
                html += `
                <table class="w-full text-[11px] border-collapse">
                    <thead>
                        <tr class="text-slate-500 border-b border-cyan-900/30 text-left">
                            <th class="p-2 font-bold uppercase text-[9px]">Línea / Ítem</th>
                            <th class="p-2 font-bold uppercase text-[9px] text-center">Unidades</th>
                            <th class="p-2 font-bold uppercase text-[9px] text-right">Inversión</th>
                        </tr>
                    </thead>
                    <tbody>`;

                res.items.forEach((item, index) => {
                    html += `
                    <tr class="border-b border-slate-800/50 hover:bg-white/5">
                        <td class="p-2 text-slate-500">Ítem #${index + 1}</td>
                        <td class="p-2 text-center text-white font-mono">${item.unidades}</td>
                        <td class="p-2 text-right text-cyan-400 font-bold">$${Number(item.inversion).toLocaleString()}</td>
                    </tr>`;
                });

                html += `</tbody></table>`;
                contenedor.innerHTML = html;
            } else {
                contenedor.innerHTML = `<p class="p-10 text-red-400 text-center uppercase text-xs">Error: No se pudieron recuperar los registros.</p>`;
            }
        })
        .obtenerItemHistorial(idPedido);
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

function abrirModalSemanal() {
    const modal = document.getElementById('modal-maestro');
    const titulo = document.getElementById('modal-titulo');
    const contenido = document.getElementById('modal-contenido');

    if (!modal) return;

    titulo.innerText = "PANEL DE CONTROL SEMANAL";
    contenido.innerHTML = `
        <div class="flex flex-col items-center py-20">
            <div class="custom-spinner mb-4"></div>
            <p class="text-[10px] text-cyan-500 animate-pulse uppercase tracking-widest">Iniciando Protocolo de Carga...</p>
        </div>`;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; 

    google.script.run
        .withSuccessHandler(response => {
            if (!response || !response.filas || response.filas.length === 0) {
                contenido.innerHTML = "<p class='text-center py-10 text-slate-500'>No hay datos en la Base de Datos</p>";
                return;
            }
            renderizarVistaMes(response); 
        })
        .withFailureHandler(err => {
            contenido.innerHTML = `<p class='text-red-500 p-5'>Error: ${err.message}</p>`;
        })
        .obtenerDatosReporteSemanal();
}

//RENDERIZAR VISTA MES
function renderizarVistaMes(response) {
    const { filas, semanasRelativas } = response;
    const contenedor = document.getElementById('modal-contenido');
    
    const hoy = new Date();
    const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const inicioAño = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const semanaHoy = Math.ceil((((d - inicioAño) / 86400000) + 1) / 7);

    let html = `
    <div class="flex flex-wrap gap-2 mb-4 px-2">
        <button onclick="navegar('-Proveedores')" class="btn-header btn-neon-purple">
            <i class="fi fi-sr-undo"></i> Regresar al Menú</button>
        <button onclick="ejecutarSincronizacionRelampago()" class="btn-header btn-neon-yellow">
            <i class="fi fi-ss-back-up"></i> SINCRONIZAR</button>
        <button onclick="descargarReporteExcel('SEMANAL')" class="btn-header btn-neon-green">
            <i class="fi fi-br-desktop-arrow-down"></i> DESCARGAR</button>
    </div>
    
    <div class="overflow-x-auto custom-scroll p-2">
        <table class="tabla-reportes" style="border-separate: separate; border-spacing: 4px 0;">
            <thead>
              <tr class="bg-transparent">
                  <th class="w-1/4 p-2 th-proveedor-estatico">PROVEEDOR</th>
                  ${[1, 2, 3, 4, 5].map((s, i) => {
                      const numSemanaCol = semanasRelativas[i];
                      const esSemanaActual = numSemanaCol === semanaHoy;
                      const claseColor = esSemanaActual ? 'btn-header-actual' : 'btn-header-tabla';
                      
                      return `
                      <th class="p-1">
                          <button onclick="verDetalleSemana(${numSemanaCol})" class="${claseColor} flex-col group w-full">
                              <span class="text-header-principal">Sem. ${numSemanaCol || s}</span>
                              ${esSemanaActual 
                                  ? `<span class="text-[8px] font-black text-green-500 animate-pulse mt-1">● ACTUAL</span>` 
                                  : `<span class="text-[16px] opacity-50 group-hover:opacity-100 mt-1"><i class="fi fi-rs-interactive"></i></span>`
                              }
                          </button>
                      </th>`;
                  }).join('')}
              </tr>
            </thead>
            <tbody>`;

    filas.forEach(fila => {
        const datosSemanas = [fila.s1, fila.s2, fila.s3, fila.s4, fila.s5];
        html += `
        <tr class="bg-slate-800/30 hover:bg-white/5 transition-colors">
            <td class="p-3 font-bold text-slate-300 border-l-2 border-cyan-500">${fila.nombre}</td>
            ${datosSemanas.map((estado, i) => {
                const numSemanaCol = semanasRelativas[i];
                if (numSemanaCol > semanaHoy || !estado || estado === "" || estado === null) {
                    return `<td class="p-3 text-center"></td>`;
                }
                return `<td class="p-3 text-center">${formatearEstado(estado)}</td>`;
            }).join('')}
        </tr>`;
    });

    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
}

function verDetalleSemana(numSemana) {
    mostrarCargando(true);
    navegacionSemanal.semanaActual = numSemana; 

    google.script.run.withSuccessHandler(data => {
        const titulo = document.getElementById('modal-titulo');
        titulo.innerText = `PLANIFICACIÓN SEMANAL: SELECCIONE UN DÍA`;
        
        const dias = [
            { corto: 'LUN', largo: 'LUNES' }, { corto: 'MAR', largo: 'MARTES' },
            { corto: 'MIE', largo: 'MIERCOLES' }, { corto: 'JUE', largo: 'JUEVES' },
            { corto: 'VIE', largo: 'VIERNES' }, { corto: 'SAB', largo: 'SABADO' }
        ];

        let html = `
            <div class="flex flex-wrap gap-2 mb-4 px-2">
              <button onclick="abrirModalSemanal()" class="btn-header btn-neon-purple">
                <i class="fi fi-sr-undo"></i> A vista Mensual</button>
              <button onclick="ejecutarSincronizacionRelampago()" class="btn-header btn-neon-yellow">
                <i class="fi fi-ss-back-up"></i> Sincronizar</button>
              <button onclick="descargarReporteExcel('DIARIA', ${numSemana})" class="btn-header btn-neon-green">
                <i class="fi fi-br-desktop-arrow-down"></i> DESCARGAR</button>
            </div>
        <div class="overflow-x-auto custom-scroll">
            <table class="tabla-reportes" style="border-separate: separate; border-spacing: 4px 0;">
              <thead>
                  <tr class="bg-transparent">
                      <th class="w-1/4 p-2 th-proveedor-estatico">PROVEEDOR</th>
                      ${dias.map(d => `
                      <th class="p-1"> 
                          <button onclick="verDetalleDia('${d.largo}', ${numSemana})" class="btn-header-tabla flex-col group w-full">
                              <span class="text-header-principal">${d.corto}</span>
                              <span class="text-[16px] opacity-50 group-hover:opacity-100 mt-1">
                                  <i class="fi fi-rs-interactive"></i>
                              </span>
                          </button>
                      </th>
                      `).join('')}
                  </tr>
              </thead>
              <tbody>`;
        
        if (data.length === 0) {
            html += `<tr><td colspan="7" class="p-10 text-center text-slate-500">No hay datos.</td></tr>`;
        } else {
            data.forEach(fila => {
                html += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-2 truncate text-slate-300 font-medium border-l-2 border-slate-700" title="${fila[1]}">${fila[1]}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[2])}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[3])}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[4])}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[5])}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[6])}</td>
                    <td class="p-2 text-center">${formatearEstado(fila[7])}</td>
                </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        document.getElementById('modal-contenido').innerHTML = html;
        mostrarCargando(false);
    }).procesarFiltradoHoja(numSemana, "SEMANA");
}

function verDetalleDia(nombreDia, numSemana) {
    mostrarCargando(true);
    google.script.run.withSuccessHandler(data => {
        const titulo = document.getElementById('modal-titulo');
        titulo.innerText = `DETALLE: ${nombreDia} - SEMANA ${numSemana}`;
        
        let html = `
        <div class="flex flex-wrap gap-3 mb-4 px-2">
            <button onclick="verDetalleSemana(${numSemana})" class="btn-header btn-neon-purple">
                <i class="fi fi-sr-undo"></i> A vista Semanal
            </button>
            <button onclick="ejecutarSincronizacionRelampago()" class="btn-header btn-neon-yellow">
                <i class="fi fi-ss-back-up"></i> Sincronizar
            </button>
            <button onclick="descargarReporteExcel('DIA_DETALLE', '${nombreDia}|${numSemana}')" class="btn-header btn-neon-green">
                <i class="fi fi-br-desktop-arrow-down"></i> Descargar
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="tabla-reportes">
                <thead>
                    <tr class="bg-transparent">
                      <th class="p-2 th-proveedor-estatico">Proveedor</th>
                      <th class="p-2 th-proveedor-estatico text-center">Estado</th>
                      <th class="p-2 th-proveedor-estatico text-center">Registro</th>
                      <th class="p-2 th-proveedor-estatico text-center">ID Pedido</th>
                      <th class="p-2 th-proveedor-estatico text-center">Acción</th>
                    </tr>
                </thead>
                <tbody>`;

        if (data.length === 0) {
            html += `<tr><td colspan="5" class="p-10 text-center">No hay registros para este día.</td></tr>`;
        } else {
            data.forEach(fila => {
                html += `
                <tr class="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td class="p-2 text-slate-300 font-bold">${fila.nombre}</td>
                    <td class="p-2 text-center">${formatearEstado(fila.estado)}</td>
                    <td class="p-2 text-center text-slate-400">${fila.fecha}</td>
                    <td class="p-2 text-center text-cyan-500 font-mono">${fila.idPedido}</td>
                    <td class="p-2 text-center">
                        <button onclick="abrirPDF('${fila.idPedido}')" class="bg-red-900/30 text-red-400 px-3 py-1 rounded-full border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">
                            PDF
                        </button>
                    </td>
                </tr>`;
            });
        }
        
        html += `</tbody></table>
        </div>
        <div id="visor-contenedor-fijo" class="hidden absolute inset-0 z-[100] bg-slate-900 flex flex-col">
              <div class="p-2 bg-slate-800 flex justify-between items-center">
                  <button onclick="cerrarVisorFijo()" class="btn-header btn-neon-red text-xs">CERRAR VISOR</button>
              </div>
              <embed id="pdf-embed" src="" type="application/pdf" class="w-full h-full">
          </div>`;
        document.getElementById('modal-contenido').innerHTML = html;
        mostrarCargando(false);
    }).procesarFiltradoHoja(nombreDia, "DIA");
}

// HELPERS JS
function formatearEstado(e) {
    if (!e) return "";
    
    let txt = e.toString().toUpperCase();
    if (txt.includes("SI") || txt.includes("✅")) {
        return `<span class="text-cyan-400 font-bold shadow-neon">✅ SI</span>`;
    }
    if (txt.includes("REPRO") || txt.includes("⚠️")) {
        return `<span class="text-yellow-500 font-bold">⚠️ REPRO</span>`;
    }
    if (txt.includes("NO") || txt.includes("❌")) {
        return `<span class="text-red-500/50">❌ NO</span>`;
    }
    return e;
}

function mostrarCargando(show) {
    const c = document.getElementById('modal-contenido');
    if (show) {
        c.setAttribute('data-old-content', c.innerHTML); 
        c.innerHTML = `
            <div id="spinner-container" class="flex flex-col items-center py-20">
                <div class="custom-spinner mb-4"></div>
                <p class="text-[10px] text-slate-500 tracking-widest uppercase animate-pulse">
                    Accediendo a la base de datos...
                </p>
            </div>`;
    } 
    else {
        const spinner = document.getElementById('spinner-container');
        if (spinner) {
            spinner.remove();
        }
    }
}

function guardarEstadoDia(dia, id, valor, semana) {
    google.script.run.withSuccessHandler(() => console.log("Estado OK")).guardarEstadoDia(dia, id, valor, semana);
}

function guardarFechaDia(dia, id, valor, semana) {
    google.script.run.guardarFechaDia(dia, id, valor, semana);
}

function abrirPDF(idPedido) {
    mostrarCargando(true);

    google.script.run
        .withSuccessHandler(base64 => {
            mostrarCargando(false);
            if (!base64) {
              Swal.fire({ title: 'ERROR EN LA BUSQUEDA', 
              text: 'No se encontró el archivo.', 
              icon: 'error', 
              timer: 1500, 
              showConfirmButton: false });
              return;
            }
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const urlBlob = URL.createObjectURL(blob);
            const visor = document.getElementById('visor-contenedor-fijo');
            const iframe = document.getElementById('pdf-embed'); 
            
            iframe.src = urlBlob;
            visor.classList.remove('hidden');
            visor.style.display = 'flex'; 
            visor.dataset.blobUrl = urlBlob; 
        })
        .withFailureHandler(() => mostrarCargando(false))
        .obtenerPdfBase64(idPedido);
}

function cerrarVisorFijo() {
    const visor = document.getElementById('visor-contenedor-fijo');
    const iframe = document.getElementById('pdf-embed');
    
    // Limpieza de memoria
    if (visor.dataset.blobUrl) {
        URL.revokeObjectURL(visor.dataset.blobUrl);
    }
    
    iframe.src = "";
    visor.classList.add('hidden');
    visor.style.display = 'none';
}

function ejecutarSincronizacionRelampago() {
    mostrarCargando(true);
    google.script.run.withSuccessHandler(() => abrirModalSemanal()).verificarReporteSemanal();
}

function descargarReporteExcel(vistaOrigen, parametroExtra = null) {
    const modalTitulo = document.getElementById('modal-titulo').innerText;
    const tabla = document.querySelector('#modal-contenido table');
    
    if (!tabla) {
        alert("No hay datos para descargar");
        return;
    }

    const filas = Array.from(tabla.querySelectorAll('tr'));
    const datos = filas.map(tr => {
        return Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText);
    });

    mostrarCargando(true);

    google.script.run
        .withSuccessHandler(res => {
            if (res && res.url) {
                const a = document.createElement('a');
                a.href = res.url;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            // --- LÓGICA DE RECUPERACIÓN DE VISTA ---
            if (vistaOrigen === 'MENSUAL') {
                navegar('-Proveedores');
            } else if (vistaOrigen === 'SEMANAL') {
                abrirModalSemanal();
            } else if (vistaOrigen === 'DIARIA') {
                verDetalleSemana(parametroExtra);
            } else if (vistaOrigen === 'DIA_DETALLE') {
                const partes = parametroExtra.split('|'); 
                verDetalleDia(partes[0], partes[1]);
            }
            
        })
        .withFailureHandler(err => {
            mostrarCargando(false);
            alert("Error: " + err.message);
        })
        .generarReporteExcel(datos, modalTitulo);
}


console.log("✅ N.I.C.O. Terminal: Carga finalizada sin errores críticos.");
