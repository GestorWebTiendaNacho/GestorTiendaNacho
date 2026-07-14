console.log("🚀 N.I.C.O. Terminal: Iniciando carga de scripts...");
//-------------------jsProv------------------//
var _ENCABEZADOS_PROVEEDORES = ['ID','RAZÓN SOCIAL','CIUDAD','DOMICILIO','TELÉFONO','EMAIL','CODIGO PROV','PROVINCIA','ACCIONES'];
var _tablaProveedoresInstance = null;
window.estadoEdicion = { esNuevo: false, fila: null };
window.carritoPedidos = window.carritoPedidos || [];
window.calidadSeleccionada = window.calidadSeleccionada || 0;

var speed = typeof speed !== 'undefined' ? speed : 0;
var prevSpeed = typeof prevSpeed !== 'undefined' ? prevSpeed : 0;
var currentScale = typeof currentScale !== 'undefined' ? currentScale : 1;

window.estadoEdicion = window.estadoEdicion || { hoja: "", fila: null };


document.addEventListener("click", (e) => {
    const miniCircle = e.target.closest(".nm-mini-circle");
    if (miniCircle) {
        const targetWithClick = miniCircle.querySelector("[onclick]");
        if (targetWithClick && e.target !== targetWithClick) {
            e.preventDefault();
            e.stopPropagation();
            targetWithClick.click();
        }
        return; 
    }

    const circleOuter = e.target.closest(".nm-circle-outer");
    if (circleOuter) {
        const hasMini = circleOuter.querySelectorAll(".nm-mini-circle").length > 0;
        if (hasMini) {
            circleOuter.classList.toggle("expanded");
            return;
        }

        const targetWithClick = circleOuter.querySelector("[onclick]");
        if (targetWithClick && e.target !== targetWithClick) {
            e.preventDefault();
            e.stopPropagation();
            
            circleOuter.classList.remove("explode");
            void circleOuter.offsetWidth;
            circleOuter.classList.add("explode");

            setTimeout(() => {
                targetWithClick.click();
            }, 150);
            return;
        }
        return;
    }

    document.querySelectorAll(".nm-circle-outer.expanded").forEach(openCircle => {
        if (!openCircle.contains(e.target)) {
            openCircle.classList.remove("expanded");
        }
    });
}, true);

window.abrirModal = function(tipo) {
    console.log("Abriendo modal maestro para:", tipo);
    const modal = document.getElementById('modal-maestro');
    const contenido = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');
    
    if (!modal || !contenido || !titulo) return;
    
    contenido.innerHTML = "";
    titulo.innerText = tipo.toUpperCase();
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (typeof cargarTablaGenerica === "function") {
        cargarTablaGenerica(tipo); 
    } else {
        console.error("La función cargarTablaGenerica no está definida.");
    }
};


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
    
    if (!contenedor) {
        console.error("Error crítico de UI: No se encontró el nodo '#modal-contenido'.");
        return;
    }

    contenedor.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 w-full">
        <div class="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p class="text-cyan-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
            Sincronizando: ${nombreHojaReal} ...
        </p>
    </div>`;

    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: nombreHoja });

        if (res && res.status === "success" && res.reply && res.reply.success) {
            const data = res.reply;
            
            contenedor.innerHTML = `
                <div class="w-full flex justify-between items-end mb-4 px-4 pt-2">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-cyan-500/40 font-mono italic tracking-widest">FS_STREAM: ${nombreHojaReal}.DAT</span>
                        <span class="text-[14px] text-white font-black tracking-tighter uppercase">ARCHIVO MAESTRO CENTRAL</span>
                    </div>
                    <div class="text-[9px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 border border-slate-800/60 rounded">
                        ÚLTIMA SYNC: <span class="text-cyan-400 font-bold">${data.ultimaActualizacion || 'ONLINE'}</span>
                    </div>
                </div>
                <div class="wrapper-tabla-final overflow-x-auto border border-slate-800 bg-slate-950/60 rounded-lg mx-4 mb-4">
                    <table id="tabla-maestra-generica" class="tabla-premium w-full text-left border-collapse">
                        </table>
                </div>`;

            if (typeof renderTableNico === "function") {
                renderTableNico('#tabla-maestra-generica', data.data, nombreHojaReal);
            } else {
                throw new Error("El motor core de renderizado 'renderTableNico' no está disponible.");
            }
        } else {
            throw new Error(res?.reply?.error || "El puente devolvió un estado inválido o vacío.");
        }
    } catch (err) {
        contenedor.innerHTML = `
        <div class="p-10 text-red-500 font-mono text-center text-[10px] flex flex-col items-center justify-center gap-2">
            <i class="fas fa-exclamation-triangle text-xl text-red-500/70 animate-bounce"></i>
            <span class="uppercase font-bold tracking-widest text-red-400">Falla de Enlace en Nodo Central</span>
            <span class="text-slate-400 bg-red-950/30 px-4 py-2 border border-red-900/40 rounded mt-2 font-sans">${err.message}</span>
        </div>`;
    }
}

/**
 * Renderiza DataTables
 * @param {Array} headers  */

/**
 * * @param {string} selector 
 * @param {Array} data -
 * @param {string} nombreHojaReal */

function renderTableNico(selector, data, nombreHojaReal) {
    if (!$.fn.DataTable) {
        console.error("Falta la biblioteca DataTables en el ecosistema.");
        return;
    }

    const columnasCabecera = ENCABEZADOS_SISTEMA[nombreHojaReal] || [];
    if (columnasCabecera.length === 0) {
        console.error(`Estructura inválida: No se definieron encabezados para la hoja: ${nombreHojaReal}`);
        return;
    }

    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().clear().destroy();
        $(selector).empty(); 
    }
    
    let theadHtml = `
        <thead>
            <tr>${columnasCabecera.map(h => `<th class="p-4 text-left uppercase tracking-widest text-[10px]">${h}</th>`).join('')}</tr>
        </thead>
        <tbody></tbody>`;
    $(selector).html(theadHtml);

    const indexAcciones = columnasCabecera.length - 1;
    const configDefs = columnasCabecera.map((titulo, i) => {
        
        if (i === indexAcciones) {
            return {
                targets: i,
                orderable: false,
                searchable: false,
                className: "text-center align-middle py-2 px-4 w-[120px]",
                render: function(val, type, row, meta) {
                    const filaIndex = meta.row + 2;
                    
                    const rowJson = JSON.stringify(row).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    
                    if (nombreHojaReal === "Historial_Compras") {
                        return `
                            <button onclick='verDetalleHistorial("${row[0]}")' 
                                    class='btn-accion-nico px-3 py-1 text-[9px] font-black tracking-widest bg-green-600/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 transition-all rounded-md shadow-[0_0_10px_rgba(34,197,94,0.1)] active:scale-95'
                                    aria-label='Ver expediente de compra ${row[0]}'>
                                DETALLE
                            </button>`;
                    }
                    
                    if (nombreHojaReal === "Estado_Pedidos") {
                        return `
                            <button onclick='abrirRecepcion(${rowJson}, ${filaIndex})' 
                                    class='btn-accion-nico px-3 py-1 text-[9px] font-black tracking-widest bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all rounded-md shadow-[0_0_10px_rgba(6,182,212,0.1)] active:scale-95'
                                    aria-label='Gestionar pedido fila ${filaIndex}'>
                                GESTIONAR
                            </button>`;
                    }
                    
                    return `
                        <button onclick='abrirEditorGenerico("${nombreHojaReal}", ${filaIndex}, "${rowJson}")' 
                                class='btn-accion-nico px-3 py-1 text-[9px] font-black tracking-widest bg-amber-600/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all rounded-md shadow-[0_0_10px_rgba(245,158,11,0.1)] active:scale-95'
                                aria-label='Editar fila ${filaIndex}'>
                            EDITAR
                        </button>`;
                }
            };
        }
        
        return { 
            targets: i, 
            className: "p-3 dt-nowrap font-mono text-[10px] text-slate-300 border-b border-slate-900/60 align-middle",
            defaultContent: "<span class='text-slate-700 font-sans'>---</span>"
        };
    });

    const tableInstance = $(selector).DataTable({
        data: data || [],
        dom: 'rtip', 
        language: { 
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' 
        },
        pageLength: 15,
        scrollX: true,
        autoWidth: false,
        columnDefs: configDefs,
        headerCallback: function(thead) {
            $(thead).find('th').addClass('text-cyan-500 font-black uppercase tracking-widest text-[10px] p-4 bg-slate-950/80 border-b border-slate-800');
        },
        drawCallback: function() {
            console.log(`%c✅ Terminal N.I.C.O: Stream de '${nombreHojaReal}' renderizado con éxito.`, 'color: #06b6d4; font-weight: bold;');
        }
    });

    window.filtrarTabla = function() {
        const inputFiltro = document.getElementById('filtro-tabla-global');
        if (inputFiltro && tableInstance) {
            tableInstance.search(inputFiltro.value).draw();
        }
    };
}

/**
 * * @param {string} hoja -
 * @returns {string} 
 */
function getTipoByHoja(hoja) {
    const nombres = {
        'baseProveedores': 'PROVEEDORES',
        'Historial_Compras': 'HISTORIAL',
        'baseProductos': 'PRODUCTOS',
        'Estado_Pedidos': 'ESTADO'
    };
    
    return nombres[hoja] || 'SISTEMA';
}

/**
 * * @param {any} str - 
 * @returns {string} */

function escapingForOption(str) {
    if (str === null || str === undefined) return "";
    return str.toString()
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

/* ---SECCION DE EDICION DE TABLA PROVEEDORES--- */


function _escapeHtmlProveedor(str) {
    if (str === null || str === undefined) return "";
    return str.toString()
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

function abrirModuloProveedores() {
    const modal = document.getElementById('modal-proveedores');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        cargarTablaProveedores();
    }
}

function cerrarModuloProveedores() {
    const modal = document.getElementById('modal-proveedores');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
    }
}

async function cargarTablaProveedores() {
    const contenedor = document.getElementById('modal-proveedores-contenido');
    if (!contenedor) return;

    const overlay = document.getElementById('overlay-carga');
    if (overlay) {
        overlay.style.zIndex = "45000";
        overlay.style.display = 'flex';
    }

    contenedor.innerHTML = '';

    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: 'PROVEEDORES' });

        if (res && res.status === "success" && res.reply && res.reply.success) {
            const data = res.reply;
            
            contenedor.innerHTML = `
                <div class="w-full flex justify-between items-end mb-4 px-4 pt-2">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-blue-500/40 font-mono italic tracking-widest">FS_STREAM: BASE PROVEEDORES</span>
                        <span class="text-[14px] text-white font-black tracking-tighter uppercase">ARCHIVO MAESTRO DE PROVEEDORES</span>
                    </div>
                    <div class="text-[9px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 border border-slate-800/60 rounded">
                        ÚLTIMA SYNC: <span class="text-blue-400 font-bold">${data.ultimaActualizacion || 'ONLINE'}</span>
                    </div>
                </div>
                <div class="wrapper-tabla-final overflow-x-auto border border-slate-800 bg-slate-950/60 rounded-lg mx-4 mb-4">
                    <table id="tabla-proveedores-dedicada" class="tabla-premium w-full text-left border-collapse"></table>
                </div>`;

            _renderizarTablaInternaProveedores(data.data);

        } else {
            throw new Error(res?.reply?.error || "El puente devolvió un estado inválido o vacío.");
        }
    } catch (err) {
        contenedor.innerHTML = `
        <div class="p-10 text-red-500 font-mono text-center text-[10px] flex flex-col items-center justify-center gap-2">
            <i class="fas fa-exclamation-triangle text-xl text-red-500/70 animate-bounce"></i>
            <span class="uppercase font-bold tracking-widest text-red-400">Falla de Enlace en Nodo Proveedores</span>
            <span class="text-slate-400 bg-red-950/30 px-4 py-2 border border-red-900/40 rounded mt-2 font-sans">${err.message}</span>
        </div>`;
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
}

function _renderizarTablaInternaProveedores(dataset) {
    const selector = '#tabla-proveedores-dedicada';

    if (!$.fn.DataTable) {
        console.error("Critical: DataTables library is missing from the environment.");
        return;
    }

    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().clear().destroy();
        $(selector).empty(); 
    }
    
    let theadHtml = `
        <thead>
            <tr>${_ENCABEZADOS_PROVEEDORES.map(h => `<th class="text-blue-500 font-black uppercase tracking-widest text-[10px] p-4 bg-slate-950/80 border-b border-slate-800">${h}</th>`).join('')}</tr>
        </thead>
        <tbody></tbody>`;
    $(selector).html(theadHtml);

    const indexAcciones = _ENCABEZADOS_PROVEEDORES.length - 1;
    const columnDefs = _ENCABEZADOS_PROVEEDORES.map((titulo, i) => {
        if (i === indexAcciones) {
            return {
                targets: i,
                orderable: false,
                searchable: false,
                className: "text-center align-middle py-2 px-4 w-[120px]",
                render: function(val, type, row, meta) {
                    const filaIndex = meta.row + 2;
                    const rowJson = JSON.stringify(row).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    return `
                        <button onclick='abrirEditorProveedor(${filaIndex}, ${rowJson})' 
                                class='px-3 py-1 text-[9px] font-black tracking-widest bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-slate-950 transition-all rounded-md shadow-[0_0_10px_rgba(59,130,246,0.1)] active:scale-95'>
                            EDITAR
                        </button>`;
                }
            };
        }
        return { 
            targets: i, 
            className: "p-3 dt-nowrap font-mono text-[10px] text-slate-300 border-b border-slate-900/60 align-middle",
            defaultContent: "<span class='text-slate-700 font-sans'>---</span>"
        };
    });

    window._tablaProveedoresInstance = $(selector).DataTable({
        data: dataset || [],
        dom: 'rtip', 
        language: { 
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' 
        },
        pageLength: 15,
        scrollX: true,
        autoWidth: false,
        columnDefs: columnDefs,
        drawCallback: function() {
            console.log(`%c⚡ Vista de proveedores renderizada de manera autónoma.`, 'color: #31b58d; font-weight: bold;');
        }
    });
}

function filtrarTablaProveedores() {
    const inputFiltro = document.getElementById('filtro-proveedores-buscar');
    if (inputFiltro && window._tablaProveedoresInstance) {
        window._tablaProveedoresInstance.search(inputFiltro.value).draw();
    }
}

function abrirEditorProveedor(numFila, datosRaw) {
    window.estadoEdicion = window.estadoEdicion || {};
    window.estadoEdicion.hoja = 'baseProveedores';
    window.estadoEdicion.fila = numFila;
    
    let datos = [];
    try {
        datos = (typeof datosRaw === 'string') ? JSON.parse(datosRaw) : (datosRaw || []);
    } catch (e) {
        console.error("❌ Error de contingencia: Falla al deserializar fila de proveedor:", e);
        return;
    }

    // Descartamos la columna "ACCIONES" del loop
    const encabezadosForm = _ENCABEZADOS_PROVEEDORES.filter(h => h.toUpperCase() !== 'ACCIONES');

    let htmlForm = `
    <div class="bg-slate-900/90 p-6 rounded-lg border border-blue-500/35 shadow-[0_0_50px_rgba(59,130,246,0.15)] max-w-4xl mx-auto my-4 backdrop-blur-md">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <h3 class="text-blue-400 text-xs font-black uppercase tracking-[3px] flex items-center gap-2">
                <span class="w-1.5 h-3.5 bg-blue-500 inline-block animate-pulse"></span>
                MODIFICAR REGISTRO: <span class="text-white font-sans font-bold">PROVEEDOR</span>
            </h3>
            <span class="text-slate-500 font-mono text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                GAS_ROW: #${numFila}
            </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" id="inputs-proveedores-dinamicos">`;

    encabezadosForm.forEach((nombreColumna, i) => {
        const valor = (datos[i] !== undefined && datos[i] !== null) ? datos[i] : "";
        const nombreLower = nombreColumna.toLowerCase().trim();
        
        // Reglas de protección de escritura locales
        const esBloqueado = ["id", "codigo prov", "codigo"].some(term => nombreLower === term || nombreLower.startsWith("id_"));
        const inputAttr = esBloqueado ? `readonly tabindex="-1"` : "";
        const labelClass = esBloqueado ? "text-blue-600/60 font-mono italic" : "text-slate-400";

        htmlForm += `
        <div class="flex flex-col space-y-1.5">
            <label class="text-[9px] uppercase font-bold tracking-wider ${labelClass}">
                ${nombreColumna} ${esBloqueado ? '<i class="fas fa-lock text-[8px] ml-1 opacity-60"></i>' : ''}
            </label>
            <input type="text" 
                   value="${_escapeHtmlProveedor(valor)}" 
                   ${inputAttr}
                   class="input-edicion-proveedor w-full bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 rounded-md transition-all duration-200
                   ${esBloqueado ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-slate-900 text-blue-500/70 font-mono' : 'hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none'}"
                   data-columna="${nombreColumna}">
        </div>`;
    });

    htmlForm += `
        </div>
        <div class="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <button onclick="cargarTablaProveedores()" 
                    class="text-slate-500 text-[10px] font-black hover:text-red-400 transition-colors tracking-widest uppercase py-2 px-4">
                ABORTAR
            </button>
            <button onclick="ejecutarGuardadoProveedor()" 
                    class="bg-blue-600 hover:bg-blue-500 text-slate-950 hover:text-white px-6 py-2.5 rounded-md text-[10px] font-black shadow-lg shadow-blue-950/40 transition-all duration-200 active:scale-95 tracking-widest uppercase">
                GUARDAR CAMBIOS
            </button>
        </div>
    </div>`;

    const contenedor = document.getElementById('modal-proveedores-contenido');
    if (contenedor) contenedor.innerHTML = htmlForm;
}


async function ejecutarGuardadoProveedor() {
    const inputs = document.querySelectorAll('.input-edicion-proveedor');
    if (!inputs || inputs.length === 0) return;

    const nuevosDatos = Array.from(inputs).map(input => input.value);
    const modalContenido = document.getElementById('modal-proveedores-contenido');
    if (!modalContenido) return;
    
    const contenidoOriginal = modalContenido.innerHTML;
    
    modalContenido.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 w-full space-y-4">
        <div class="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="text-blue-500 font-mono text-[10px] uppercase tracking-[0.25em] animate-pulse">
            Escribiendo registro en baseProveedores...
        </p>
    </div>`;

    try {
        const res = await callGoogleScript('guardarCambioServidor', {
            nombreSheet: 'baseProveedores',
            numFila: window.estadoEdicion.fila,
            valores: nuevosDatos
        });

        if (res && res.status === "success" && res.reply && res.reply.success) {
            console.log(`%c✅ Catálogos: Registro de proveedor guardado con éxito y aislado de fallos.`, 'color: #3b82f6; font-weight: bold;');
            cargarTablaProveedores(); 
        } else {
            const mensajeError = res?.reply?.mensaje || res?.reply?.error || "Respuesta vacía del servidor.";
            throw new Error(mensajeError);
        }
    } catch (err) {
        console.error("❌ Fallo crítico de escritura encapsulado:", err);
        alert("ERROR CRÍTICO EN NODO PROVEEDORES: " + err.message);
        
        // Restauración local segura del formulario ante fallos de red
        modalContenido.innerHTML = contenidoOriginal;
        const reInputs = modalContenido.querySelectorAll('.input-edicion-proveedor');
        if (reInputs && reInputs.length === nuevosDatos.length) {
            reInputs.forEach((inp, idx) => { inp.value = nuevosDatos[idx]; });
        }
    }
}





//---- FUNCIONES DEL MODAL DE PEDIDOS ----
/** @param {string} tipo - */




/*------ ARMADO Y CONFIRMACION DEL PEDIDO ----*/

async function revisarPedido() {
    window.carritoPedidos = window.carritoPedidos || [];
    
    if (window.carritoPedidos.length === 0) {
        if (window.Swal) {
            Swal.fire({ 
                title: 'CARRITO VACÍO', 
                text: "Debes seleccionar al menos un producto para confeccionar una orden.", 
                icon: 'info', 
                background: '#0f172a', 
                color: '#f1f5f9',
                confirmButtonColor: '#0ea5e9'
            });
        } else {
            alert("CARRITO VACÍO: Selecciona productos primero.");
        }
        return;
    }

    const contenido = document.getElementById('modal-contenido');
    const titulo = document.getElementById('modal-titulo');
    if (!contenido || !titulo) return;
    
    let proveedoresHTML = "";
    try {
        const listaProv = (typeof listaProveedoresCache !== 'undefined' && listaProveedoresCache.length > 0) 
                        ? listaProveedoresCache 
                        : await obtenerProveedoresParaSelector();
        
        const provOriginal = window.carritoPedidos[0].proveedor;
        
        proveedoresHTML = listaProv.map(p => 
            `<option value="${escapingForOption(p)}" ${p === provOriginal ? 'selected' : ''}>${p}</option>`
        ).join('');
    } catch (e) { 
        console.error("❌ N.I.C.O. Error al compilar selector final de proveedores:", e); 
    }

    const ahora = new Date();
    const idPedido = "PED-" + ahora.getFullYear() + 
                     (ahora.getMonth() + 1).toString().padStart(2, '0') + 
                     ahora.getDate().toString().padStart(2, '0') + "-" + 
                     ahora.getHours().toString().padStart(2, '0') + 
                     ahora.getMinutes().toString().padStart(2, '0');

    titulo.innerHTML = `CONFECCIÓN DE PEDIDO: <span class="text-white font-mono">${idPedido}</span>`;

    let html = `
        <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-800 mb-4 w-full shadow-2xl mx-1">
            <div class="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs items-center">
                <div>
                    <span class="text-slate-500 uppercase text-[9px] font-bold tracking-wider">ID OPERACIÓN:</span><br>
                    <span class="text-cyan-400 font-mono font-bold tracking-tight">${idPedido}</span>
                </div>
                
                <div class="col-span-2">
                    <label class="text-cyan-500 block mb-1 uppercase text-[9px] font-black tracking-wider">Remitir Pedido a:</label>
                    <select id="cambiar-proveedor-final" onchange="actualizarProveedorCarrito(this.value)"
                            class="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-md p-2 font-mono text-[11px] font-bold focus:border-cyan-500 outline-none transition-all">
                        ${proveedoresHTML || `<option value="${escapingForOption(window.carritoPedidos[0].proveedor)}">${window.carritoPedidos[0].proveedor}</option>`}
                    </select>
                </div>

                <div>
                    <label class="text-cyan-500 block mb-1 uppercase text-[9px] font-black tracking-wider">Plazo Entrega:</label>
                    <div class="flex items-center gap-2">
                        <input type="number" id="tiempo-estimated" min="1" value="3" 
                               class="w-16 bg-slate-950 border border-slate-800 text-cyan-400 rounded-md p-1.5 text-center font-mono font-bold outline-none focus:border-cyan-500">
                        <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">DÍAS</span>
                    </div>
                </div>

                <div class="col-span-2 flex gap-3 justify-end mt-2 md:mt-0">
                    <button onclick="volverAListaProductos()" 
                            class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-md font-black text-[10px] uppercase tracking-widest transition-all border border-slate-700/60 active:scale-95">
                        ← EDITAR LISTA
                    </button>
                    <button onclick="prepararEnvioPedido('${idPedido}')" 
                            class="bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-white px-5 py-2 rounded-md font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-950/40 transition-all active:scale-95">
                        CONFIRMAR Y ENVIAR
                    </button>
                </div>
            </div>
        </div>

        <div class="border border-slate-900 rounded-xl overflow-y-auto max-h-[380px] md:max-h-[45vh] mx-1 bg-slate-950/20 custom-scroll relative">
            <table class="w-full text-left border-collapse table-fixed"> 
                <thead class="sticky top-0 bg-slate-950 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    <tr class="text-cyan-500 border-b border-slate-800 text-[9px] font-black uppercase tracking-wider">
                        <th class="p-3 w-1/4 bg-slate-950">Item / Detalle</th> 
                        <th class="p-3 text-center w-[12%] bg-slate-950">Stock Act.</th> 
                        <th class="p-3 text-center w-[12%] bg-slate-950">Stock Mín.</th> 
                        <th class="p-3 text-center w-[16%] bg-slate-950">Cantidad</th> 
                        <th class="p-3 text-right w-[15%] bg-slate-950">Costo Unit.</th> 
                        <th class="p-3 text-right w-[15%] bg-slate-950">Subtotal</th> 
                        <th class="p-3 text-center w-[6%] text-red-500 bg-slate-950"></th> 
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-900/50 font-mono text-[11px]">`;

    window.carritoPedidos.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        const alertaStock = parseInt(item.stock || 0) <= parseInt(item.stockMinimo || 0);
        
        html += `
            <tr class="border-b border-slate-900 text-xs hover:bg-cyan-500/5 transition-colors duration-150">
                <td class="p-3 font-sans">
                    <div class="text-slate-200 font-bold truncate text-[11px]">${item.nombre}</div>
                    <div class="text-[9px] text-cyan-700 font-mono tracking-tighter mt-0.5">${item.sku}</div>
                </td>
                <td class="p-3 text-center">
                    <span class="${alertaStock ? 'text-red-400 font-black px-1.5 py-0.5 rounded bg-red-950/20 animate-pulse border border-red-900/30' : 'text-slate-400'}">${item.stock}</span>
                </td>
                <td class="p-3 text-center text-slate-500">
                    ${item.stockMinimo}
                </td>
                <td class="p-3 text-center flex justify-center items-center min-h-[50px]">
                    <input type="number" min="1" value="${item.cantidad}" 
                           onchange="actualizarCantidadCarrito(${index}, this.value)"
                           class="w-20 bg-slate-950 border border-slate-800 text-cyan-400 text-center rounded-md p-1 outline-none font-bold focus:border-cyan-500">
                </td>
                <td class="p-3 text-right text-slate-400">
                    $${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td class="p-3 text-right text-slate-200 font-bold" id="subtotal-${index}">
                    $${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td class="p-3 text-center">
                    <button onclick="eliminarDelPedido(${index})" class="text-slate-600 hover:text-red-400 transition-all transform hover:scale-110 p-1">
                        <i class="fi fi-rr-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>
        
        <div class="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center w-full shadow-2xl mx-1">
            <div>
                <span class="text-slate-500 text-[9px] uppercase tracking-widest font-black block">Inversión Bruta Estimada</span>
                <div id="total-pedido-confirmar" class="text-2xl text-cyan-400 font-black leading-none mt-1.5 tracking-tight">$ 0,00</div>
            </div>
            <div class="text-right text-[9px] text-slate-600 font-mono uppercase tracking-wider leading-relaxed hidden sm:block">
                Status: Awaiting Operator Signature<br>
                N.I.C.O. V2.0 - COMPILER SECURE
            </div>
        </div>`;

    contenido.innerHTML = html;
    calcularTotalConfirmacion();
}

// --- FUNCIÓN DE ELIMINACIÓN ---
/** @param {number} index */

function eliminarDelPedido(index) {
    if (!window.Swal) {
        if (confirm("¿Quitar este producto del pedido?")) {
            ejecutarBajaItemCarrito(index);
        }
        return;
    }

    Swal.fire({
        title: '¿QUITAR PRODUCTO?',
        text: "Se eliminará este ítem de la lista de confección actual.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#1e293b',
        confirmButtonText: 'SÍ, RETIRAR',
        cancelButtonText: 'ABORTAR',
        background: '#0f172a',
        color: '#f1f5f9',
        customClass: {
        container: 'swal-pedido-container',
        popup: 'swal-pedido'
}
    }).then((result) => {
        if (result.isConfirmed) {
            ejecutarBajaItemCarrito(index);
        }
    });
}
function ejecutarBajaItemCarrito(index) {
    window.carritoPedidos.splice(index, 1);
    if (window.carritoPedidos.length === 0) {
        volverAListaProductos();
    } else {
        revisarPedido();
    }
    if (typeof actualizarContadorVisual === "function") actualizarContadorVisual();
}


/** @param {string} idPedido  */

function prepararEnvioPedido(idPedido) {
    const inputDias = document.getElementById('tiempo-estimated');
    const dias = inputDias ? parseInt(inputDias.value) : 0;
    
    if (isNaN(dias) || dias <= 0) {
        if (window.Swal) {
            Swal.fire('ATENCIÓN LOGÍSTICA', 'Por favor, ingresa una estimación de días válida y mayor a cero.', 'warning');
        } else {
            alert("ATENCIÓN: Ingresa una estimación de días válida.");
        }
        return;
    }
    
    ejecutarGeneracionPedido(idPedido, dias);
}

async function obtenerProveedoresParaSelector() {
    try {
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: 'baseProveedores' });
        if (res && res.status === "success" && res.reply && res.reply.data) {
            const lista = res.reply.data.map(fila => fila[1]).filter(p => p && p.trim() !== "");
            return [...new Set(lista)].sort();
        }
        throw new Error("Estructura de datos vacía");
    } catch (e) {
        console.warn("⚠️ Fallback activado para selector de proveedores:", e);
        return window.carritoPedidos && window.carritoPedidos.length > 0 
            ? [window.carritoPedidos[0].proveedor] 
            : [];
    }
}

function actualizarCantidadCarrito(index, valor) {
    const cant = Math.max(1, parseInt(valor) || 1);
    if (window.carritoPedidos && window.carritoPedidos[index]) {
        window.carritoPedidos[index].cantidad = cant;
        const subtotal = window.carritoPedidos[index].precio * cant;
        const celdaSubtotal = document.getElementById(`subtotal-${index}`);
        if (celdaSubtotal) {
            celdaSubtotal.innerText = "$" + subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 });
        }
        calcularTotalConfirmacion();
    }
}

function calcularTotalConfirmacion() {
    if (!window.carritoPedidos) return;
    const total = window.carritoPedidos.reduce((acc, item) => acc + (item.precio * (item.cantidad || 1)), 0);
    const display = document.getElementById('total-pedido-confirmar');
    if (display) {
        display.innerText = "$ " + total.toLocaleString('es-AR', { minimumFractionDigits: 2 });
    }
}


async function ejecutarGeneracionPedido(idPedido, dias) {
    // 1. Localizamos el overlay nativo del sistema
    const overlayCarga = document.getElementById('overlay-carga');
    
    // 2. Encendemos el spinner global antes de iniciar cualquier petición
    if (overlayCarga) overlayCarga.style.display = 'flex';

    try {
        const proveedorFinalInput = document.getElementById('cambiar-proveedor-final');
        const proveedorFinal = proveedorFinalInput ? proveedorFinalInput.value : window.carritoPedidos[0].proveedor;

        const payload = {
            idPedido: idPedido,
            diasEntrega: dias,
            items: window.carritoPedidos,
            proveedorFinal: proveedorFinal,
            fechaActualizacion: new Date().toLocaleString('es-AR')
        };

        // Despacho asíncrono al servidor central
        const res = await callGoogleScript('procesarPedidoFinal', payload);

        if (res && res.status === "success") {
            // 3. Apagamos el overlay inmediatamente al recibir respuesta positiva
            if (overlayCarga) overlayCarga.style.display = 'none';

            // Desplegamos confirmación visual final
            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: '¡ORDEN CONFIRMADA!',
                    html: `
                        <div class="text-slate-300 text-xs mb-4 font-sans">
                            La operación de compra <b class="text-cyan-400 font-mono">${idPedido}</b> ha sido impactada con éxito.
                        </div>
                        ${res.url ? `
                        <a href="${res.url}" target="_blank" 
                           class="inline-block bg-cyan-600 text-slate-950 hover:text-white px-5 py-2.5 rounded-md font-black text-[10px] tracking-widest uppercase transition-all shadow-md shadow-cyan-950/50 hover:bg-cyan-500">
                            DESCARGAR PDF DE ORDEN
                        </a>` : ''}`,
                    background: '#0f172a',
                    color: '#f1f5f9',
                    confirmButtonColor: '#0ea5e9',
                    confirmButtonText: 'ENTENDIDO'
                });
            }

            // Purgado completo y restauración limpia de las vistas del sistema
            window.carritoPedidos = [];
            if (typeof actualizarContadorVisual === "function") actualizarContadorVisual();
            
            // Resolución del modal y redirección controlada por interfaz nativa
            if (typeof cerrarModal_Pedidos === "function") {
                cerrarModal_Pedidos();
            } else {
                const modal = document.getElementById('modal-pedidos');
                if (modal) modal.classList.add('hidden');
                const pagPrincipal = document.getElementById('page-principal-depos');
                if (pagPrincipal) pagPrincipal.style.display = 'flex';
            }
            
        } else {
            throw new Error(res?.message || "La pasarela de Google Apps Script rechazó el paquete de datos.");
        }

    } catch (err) {
        console.error("❌ Fallo crítico en la persistencia del pedido:", err);
        
        // 4. Apagamos el overlay de carga de forma segura en caso de excepción de red
        if (overlayCarga) overlayCarga.style.display = 'none';

        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'FALLA DE COMUNICACIÓN',
                text: 'No se pudo guardar el registro en las celdas maestras: ' + err.message,
                background: '#0f172a',
                color: '#f1f5f9',
                confirmButtonColor: '#ef4444'
            });
        } else {
            alert('❌ FALLA DE COMUNICACIÓN: ' + err.message);
        }
    }
}

function volverAListaProductos() {
    if (!document.getElementById('prov-seleccionado') && window.carritoPedidos && window.carritoPedidos.length > 0) {
        const provActivo = window.carritoPedidos[0].proveedor;
        const fakeInput = document.createElement('input');
        fakeInput.id = 'prov-seleccionado';
        fakeInput.value = provActivo;
        fakeInput.type = 'hidden';
        document.body.appendChild(fakeInput);
        
        cargarProductosPorProveedor();
        
        fakeInput.remove();
    } else {
        abrirModal_Pedidos('PEDIDOS');
    }
}

function actualizarProveedorCarrito(nuevoProveedor) {
    if (window.carritoPedidos && window.carritoPedidos.length > 0) {
        window.carritoPedidos.forEach(item => {
            item.proveedor = nuevoProveedor;
        });
        
        console.log(`%c 🛰️ N.I.C.O. Logística > Mutación de Destino: ${nuevoProveedor}`, "color: #00f2ff; font-weight: bold;");
        
        const titulo = document.getElementById('modal-titulo');
        if (titulo) {
            const baseTitulo = titulo.innerText.split('|')[0].trim();
            titulo.innerHTML = `${baseTitulo} | <span class="text-cyan-400 font-sans font-bold">DEST: ${nuevoProveedor}</span>`;
        }
    }
}

/*----------- FUNCIONES DEL PEDIDOS AUTO ASISTIDOS-----------*/
window.speed = window.speed || 0;
window.prevSpeed = window.prevSpeed || 0;
window.currentScale = window.currentScale || 0;

window.speedIncrase = function() {
    if (window.speed < 180) {
        window.speed += 15;
    } else {
        window.speed = 0;
        window.currentScale = 0;
    }
    window.actualizarInterfaz();
    window.currentScale++;
    window.changeActive();
};

window.actualizarInterfaz = function() {
    const el = document.getElementsByClassName("arrow-wrapper")[0];
    if (!el) return;
    const claseVieja = "speed-" + window.prevSpeed;
    const claseNueva = "speed-" + window.speed;
    el.classList.remove(claseVieja);
    el.classList.add(claseNueva);
    window.prevSpeed = window.speed;
};

window.changeActive = function() {
    const nombreClaseBusqueda = "speedometer-Scale-" + window.currentScale;
    const el = document.getElementsByClassName(nombreClaseBusqueda)[0];
    if (el) el.classList.toggle("active");
};

// ------- NICO CONTROLLER --------//
window.abrirModalPedidos_Autoasist = function() {
    const modal = document.getElementById('modal-pedidos-autoasistidos');
    console.log("%c 🚀 N.I.C.O. > Módulo Autoasistido Inicializado.", "color: #0ea5e9; font-weight: bold;");

    if (modal) {
        modal.style.display = 'flex';
        if (window.NicoController) window.NicoController.rearrancar();
    }
};

window.cerrarModalPedidos_Autoasist = function() {
    const modal = document.getElementById('modal-pedidos-autoasistidos');
    if (modal) {
        modal.style.display = 'none';
        if (window.NicoController) window.NicoController.detener();
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) chatMessages.innerHTML = '';
        
        const tablaCuerpo = document.getElementById('tabla-informes-cuerpo');
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = `
                <tr id="fila-espera-nico" class="border-b border-slate-900/50 hover:bg-slate-900/20 transition-colors">
                    <td class="p-3 font-mono text-slate-500 text-center py-10" colspan="5">
                        <span class="inline-block animate-pulse mr-2">📡</span> Aguardando procesamiento de órdenes o dictados de voz...
                    </td>
                </tr>`;
        }
        
        const userInput = document.getElementById('user-input');
        if (userInput) userInput.value = '';
        
        if (typeof APAGAR_VISUAL_MIC === "function") APAGAR_VISUAL_MIC();
    }
};

// ---------- CONTROLADOR DE NICO Y ANIMACIONES ---------------- //
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

        var animationFrameId = null;
        var estaActivo = false;

        function iniciar() {
            const currentCanvas = document.getElementById("canvas-nico");
            if (!currentCanvas) return;

            estaActivo = true;
            nico.estadoActual = "SALUDANDO";
            nico.img.crossOrigin = "Anonymous";
            nico.img.src = ESTADOS.SALUDANDO;
            nico.frame = 0;
            
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(draw);
            
            setTimeout(() => {
                if (nico.estadoActual === "SALUDANDO" && estaActivo) {
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

        function detenerLoop() {
            estaActivo = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        function draw(timestamp) {
            if (!estaActivo) return;

            const currentCanvas = document.getElementById("canvas-nico");
            if (!currentCanvas) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }
            
            const currentCtx = currentCanvas.getContext("2d");
            if (!nico.img.complete) {
                animationFrameId = requestAnimationFrame(draw);
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
            animationFrameId = requestAnimationFrame(draw);
        }

        return { 
            cambiarA: cambiarEstado,
            rearrancar: iniciar,
            detener: detenerLoop
        };
    })();
}

// ------------------- LOGICA DEL CHAT ----------------------------
window.avatarPensar = () => window.NicoController && NicoController.cambiarA("PENSANDO");
window.avatarIdle   = () => window.NicoController && NicoController.cambiarA("ESPERANDO");
window.avatarHablar = () => window.NicoController && NicoController.cambiarA("RESPONDE");

// Variables globales de grabación
var mediaRecorder = null;
var chunksAudio = [];
var estaGrabando = false;

// 1. MANEJO DEL MICRÓFONO MULTINAVEGADOR (BRAVE, CHROME, LINUX)
async function alternarMicrofono() {
    if (estaGrabando) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        estaGrabando = false;
        APAGAR_VISUAL_MIC();
    } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Tu navegador no soporta la captura nativa de audio.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksAudio = [];
            
            const opcionesMime = MediaRecorder.isTypeSupported("audio/webm") 
                ? { mimeType: "audio/webm" } 
                : { mimeType: "audio/ogg" };

            mediaRecorder = new MediaRecorder(stream, opcionesMime);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksAudio.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                mostrarRespuestaEnChat("🤖 NICO: Reconociendo el comando...");
                
                const blobAudio = new Blob(chunksAudio, { type: opcionesMime.mimeType });
                const lectorSencillo = new FileReader();
                lectorSencillo.readAsDataURL(blobAudio);
                lectorSencillo.onloadend = async () => {
                    const datosBase64Completo = lectorSencillo.result;
                    const stringBase64Crudo = datosBase64Completo.split(',')[1];
                    await enviarAudioAServidorGAS(stringBase64Crudo);
                };
            };

            mediaRecorder.start();
            estaGrabando = true;
            ENCENDER_VISUAL_MIC();

        } catch (err) {
            console.error("Error de hardware:", err);
            mostrarRespuestaEnChat("❌ Error: Acceso denegado al micrófono. Revisa los permisos.");
            APAGAR_VISUAL_MIC();
        }
    }
}

// 2. ENVÍO DEL BUFFER DE AUDIO A GOOGLE APPS SCRIPT
async function enviarAudioAServidorGAS(base64Audio) {
    if (typeof window.avatarPensar === "function") window.avatarPensar();
    
    try {
        const urlDestino = window.URL_GLOBAL_GAS || window.URL_GAS_GLOBAL;
        if (!urlDestino) throw new Error("URL de servidor Apps Script no definida.");

        const response = await fetch(urlDestino, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: "procesarAudioNico",
                params: { audioBase64: base64Audio }
            })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const dataRespuesta = await response.json();
        
        if (dataRespuesta.status === "success") {
            if (typeof window.avatarHablar === "function") window.avatarHablar();
            if (dataRespuesta.transcripcion) mostrarMensajeUsuario(dataRespuesta.transcripcion);
            if (dataRespuesta.reply) mostrarRespuestaEnChat(dataRespuesta.reply);
            if (dataRespuesta.productos) renderizarTablaInformesNico(dataRespuesta.productos);

            if (dataRespuesta.swal && typeof Swal !== "undefined") {
                Swal.fire({
                    title: dataRespuesta.swal.title,
                    html: dataRespuesta.swal.html,
                    icon: dataRespuesta.swal.icon || 'info',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    confirmButtonColor: '#0e7490',
                    confirmButtonText: 'Entendido'
                });
            }
        } else {
            mostrarRespuestaEnChat("❌ Error en el motor de voz: " + (dataRespuesta.message || "Falla de procesamiento."));
        }

    } catch (err) {
        console.error("ErrorBox enviando flujo de audio:", err);
        mostrarRespuestaEnChat("❌ Error de enlace: No se pudo conectar con el servidor central.");
    } finally {
        setTimeout(() => {
            if (typeof window.avatarIdle === "function") window.avatarIdle();
        }, 3000);
    }
}

// 3. ENVÍO DE TEXTO MANUAL ESTÁNDAR
async function enviarPrompt() {
    const userInput = document.getElementById("user-input");
    if (!userInput) return;
    const promptText = userInput.value.trim();
    if (!promptText) return;

    mostrarMensajeUsuario(promptText);
    userInput.value = "";
    if (typeof window.avatarPensar === "function") window.avatarPensar();

    try {
        const urlDestino = window.URL_GLOBAL_GAS || window.URL_GAS_GLOBAL;
        const response = await fetch(urlDestino, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: "procesarPromptNico",
                params: { prompt: promptText }
            })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const dataRespuesta = await response.json();
        
        if (dataRespuesta.status === "success") {
            if (typeof window.avatarHablar === "function") window.avatarHablar();
            if (dataRespuesta.reply) mostrarRespuestaEnChat(dataRespuesta.reply);
            if (dataRespuesta.productos) renderizarTablaInformesNico(dataRespuesta.productos);
            if (dataRespuesta.swal && typeof Swal !== "undefined") Swal.fire(dataRespuesta.swal);
        } else {
            mostrarRespuestaEnChat("❌ Error interno: " + (dataRespuesta.message || "Falla."));
        }
    } catch (err) {
        console.error("Error enviando prompt:", err);
        mostrarRespuestaEnChat("❌ Error de comunicación.");
    } finally {
        setTimeout(() => {
            if (typeof window.avatarIdle === "function") window.avatarIdle();
        }, 3000);
    }
}

// 4. ESCUCHADORES DE EVENTOS Y EFECTOS VISUALES DINÁMICOS
function ENCENDER_VISUAL_MIC() {
    const prenderMicBtn = document.getElementById("btn-nico-voz");
    if (prenderMicBtn) {
        prenderMicBtn.classList.remove('text-slate-500');
        prenderMicBtn.classList.add('text-red-500', 'animate-pulse');
    }
    if (typeof window.avatarPensar === "function") window.avatarPensar();
}

function APAGAR_VISUAL_MIC() {
    const prenderMicBtn = document.getElementById("btn-nico-voz");
    if (prenderMicBtn) {
        prenderMicBtn.classList.remove('text-red-500', 'animate-pulse');
        prenderMicBtn.classList.add('text-slate-500');
    }
}

// Inicializador seguro de eventos del DOM
document.addEventListener("DOMContentLoaded", () => {
    const prenderMicBtn = document.getElementById("btn-nico-voz");
    if (prenderMicBtn) prenderMicBtn.addEventListener('click', alternarMicrofono);

    const userInput = document.getElementById("user-input");
    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarPrompt();
            }
        });
    }
});

// Atajo de teclado (Alt + S)
window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.altKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        alternarMicrofono();
    }
});

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

function renderizarTablaInformesNico(productosFiltrados) {
    const tbody = document.getElementById('tabla-informes-cuerpo');
    if (!tbody) return;

    if (!productosFiltrados || productosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr class="border-b border-slate-900/50">
                <td class="p-3 font-mono text-amber-500 text-center py-10" colspan="5">
                    <i class="fi fi-rr-exclamation mr-2"></i> N.I.C.O. no encontró coincidencias para este reporte.
                </td>
            </tr>`;
        return;
    }

    let html = "";
    productosFiltrados.forEach(prod => {
        const nombreLimpio = String(prod.nombre || prod.detalle || "").replace(/'/g, "").replace(/"/g, "");
        const alertarStock = parseInt(prod.stock || 0) <= parseInt(prod.stockMinimo || 0);
        const yaSeleccionado = window.carritoPedidos && window.carritoPedidos.some(p => p.sku === prod.sku);

        html += `
            <tr class="border-b border-slate-900/40 hover:bg-slate-900/40 transition-colors duration-200" data-sku="${prod.sku}">
                <td class="p-3 text-center">
                    <input type="checkbox" 
                           id="chk-central-${prod.sku}"
                           class="w-4 h-4 accent-cyan-500 cursor-pointer" 
                           ${yaSeleccionado ? 'checked' : ''}
                           onclick="toggleSeleccion(this, '${prod.id || prod.sku}', '${nombreLimpio}', '${prod.precio || 0}', '${prod.sku}', '${prod.stock || 0}', '${prod.proveedor || 'General'}', '${prod.stockMinimo || 0}')">
                </td>
                <td class="p-3 font-mono text-cyan-500 font-bold text-xs">${prod.sku}</td>
                <td class="p-3">
                    <b class="text-slate-200">${prod.nombre || prod.detalle}</b>
                </td>
                <td class="p-3 text-right font-mono">
                    <span class="${alertarStock ? 'text-red-500 font-bold animate-pulse' : 'text-slate-400'}">${prod.stock || 0}</span>
                    <span class="text-slate-600 text-xs"> / ${prod.stockMinimo || 0}</span>
                </td>
                <td class="p-3 text-xs">
                    <span class="text-slate-400 block font-semibold uppercase">${prod.proveedor || 'Sin Asignar'}</span>
                    <span class="${alertarStock ? 'text-red-400/80 text-[10px]' : 'text-emerald-500/80 text-[10px]'} font-mono">
                        ${alertarStock ? 'CRÍTICO: REPONER' : 'STOCK SEGURO'}
                    </span>
                </td>
            </tr>`;
    });

    tbody.innerHTML = html;
}

function seleccionarSkusPorVoz(skusASeleccionar) {
    if (!skusASeleccionar || skusASeleccionar.length === 0) return;
    let itemsProcesados = 0;

    skusASeleccionar.forEach(sku => {
        const checkbox = document.getElementById(`chk-central-${sku.trim().toUpperCase()}`);
        // OPTIMIZACIÓN: Cambiado por .click() nativo para asegurar propagación cruzada en Linux/Brave
        if (checkbox && !checkbox.checked) {
            checkbox.click(); 
            itemsProcesados++;
        }
    });

    if (itemsProcesados > 0 && typeof Swal !== "undefined") {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            background: '#0f172a',
            color: '#34d399'
        });
        Toast.fire({
            icon: 'success',
            title: `N.I.C.O: ${itemsProcesados} ítems procesados e integrados.`
        });
    } else {
        console.warn("⚠️ N.I.C.O: Los identificadores dictados se encuentran fuera de la grilla visual indexada.");
    }
}

// Lógica de ordenamiento de columnas por cabecera
document.addEventListener("DOMContentLoaded", () => {
    const tabla = document.querySelector(".tabla-nico"); 
    if (!tabla) return;

    tabla.querySelectorAll("th").forEach((headerCell, index) => {
        if (index === 0) return; 
        headerCell.style.cursor = "pointer";
        
        headerCell.addEventListener("click", () => {
            const tbody = tabla.querySelector("tbody");
            if (!tbody) return;
            
            const rows = Array.from(tbody.querySelectorAll("tr"));
            if (rows.length === 0 || rows[0].querySelector("td").getAttribute("colspan")) return;

            const isAscending = !headerCell.classList.contains("sort-asc");
            tabla.querySelectorAll("th").forEach(th => th.classList.remove("sort-asc", "sort-desc"));
            
            const sortedRows = rows.sort((a, b) => {
                const cellA = a.children[index]?.textContent.trim() || "";
                const cellB = b.children[index]?.textContent.trim() || "";
                
                const numA = parseFloat(cellA.replace(/[^0-9.-]+/g, ""));
                const numB = parseFloat(cellB.replace(/[^0-9.-]+/g, ""));
                
                if (!isNaN(numA) && !isNaN(numB)) {
                    return isAscending ? numA - numB : numB - numA;
                }
                return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            });
            
            tbody.append(...sortedRows);
            headerCell.classList.toggle("sort-asc", isAscending);
            headerCell.classList.toggle("sort-desc", !isAscending);
        });
    });
});



/*----------------------------------- FUNCIONES DEL MODAL RECEPCIÓN---------------------------------*/
/**
 * @param {Array} datos 
 * @param {number|string} fila  */

var CONFIG_RECEPCION = {
    HOJA_GAS: 'Estado_Pedidos',
    ENCABEZADOS: ['ID PEDIDO', 'FECHA PEDIDO', 'PROVEEDOR', 'ESTATUS', 'SKU', 'PRODUCTO', 'COSTO UNIT.', 'NUEVA FECHA', 'OBSERVACIONES', 'ACCIONES']
};

function asegurarDataTable() {
    return new Promise((resolve) => {
        if (typeof $.fn.dataTable !== 'undefined' || typeof DataTable !== 'undefined') {
            return resolve(true);
        }

        console.warn("⚠️ DataTables no detectado. Intentando carga de rescate...");
        
        const script = document.createElement('script');
        script.src = "https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js";
        script.onload = () => {
            console.log("✅ Biblioteca DataTable recuperada con éxito.");
            resolve(true);
        };
        script.onerror = () => {
            console.error("❌ Bloqueo total: El CDN fue bloqueado por la red o un AdBlocker.");
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

window.verEstadoPedidos = async function() {
    const modal = document.getElementById('modalRecepcion');
    const workspace = document.getElementById('workspaceRecepcion');
    const vistaDetalle = document.getElementById('vistaDetallePedido');
    const footer = document.getElementById('section-footer');
    const tituloPantalla = document.getElementById('recepcionTitulo');

    if (!modal) {
        console.error("❌ Error: No existe el contenedor 'modalRecepcion'.");
        return;
    }

    if (!workspace) {
        console.error("❌ Error de Nodo: No se encontró el espacio de trabajo activo.");
        return;
    }

    const overlay = document.getElementById('overlay-carga');
    if (overlay) {
        overlay.style.zIndex = "45000"; 
        overlay.style.display = 'flex';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.setProperty('display', 'flex', 'important');
    document.body.style.overflow = 'hidden';

    if (tituloPantalla) tituloPantalla.innerText = "SISTEMA DE CONTROL DE RECEPCIÓN";
    
    workspace.style.display = 'block';
    workspace.innerHTML = '';
    
    if (vistaDetalle) vistaDetalle.style.display = 'none';
    if (footer) footer.style.display = 'none';

    try {
        const dataTableListo = await asegurarDataTable();
        if (!dataTableListo) {
            throw new Error("Biblioteca DataTable ausente. Es muy probable que un AdBlocker o las directivas de seguridad de su red corporativa estén bloqueando el componente de tablas.");
        }

        const res = await callGoogleScript('obtenerPedidosRecepcion');
        
        if (res && res.status === "success" && res.reply && res.reply.success) {
            const dataServidor = res.reply.data || [];
            
            workspace.innerHTML = `
                <div class="w-full flex justify-between items-end mb-4 px-4 pt-2 animate-fadeIn font-mono">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-cyan-500/40 font-mono italic tracking-widest">STREAM: ESTADO PEDIDOS</span>
                        <span class="text-[14px] text-white font-black tracking-tighter uppercase">ORDENES DE COMPRA EN TRÁNSITO</span>
                    </div>
                    <div class="text-[9px] text-slate-500 bg-slate-900/80 px-3 py-1.5 border border-slate-800/60 rounded">
                        ÚLTIMA SYNC: <span class="text-cyan-400 font-bold">${res.reply.ultimaActualizacion || 'ONLINE'}</span>
                    </div>
                </div>
                <div class="wrapper-tabla-final overflow-x-auto border border-slate-800 bg-slate-950/60 rounded-lg mx-4 mb-4 shadow-2xl">
                    <table id="tabla-recepcion-exclusiva" class="tabla-premium w-full text-left border-collapse"></table>
                </div>`;

            renderTablaRecepcion('#tabla-recepcion-exclusiva', dataServidor);

        } else {
            throw new Error(res?.reply?.error || "El puente de datos retornó un estado vacío.");
        }
    } catch (err) {
        workspace.innerHTML = `
        <div class="p-10 text-red-500 font-mono text-center text-[10px] flex flex-col items-center justify-center gap-2 border border-red-900/30 bg-red-950/10 rounded-lg mx-4">
            <i class="fas fa-exclamation-triangle text-xl text-red-500/70 animate-bounce"></i>
            <span class="uppercase font-bold tracking-widest text-red-400">Falla de Enlace Remoto</span>
            <span class="text-slate-400 bg-red-950/40 px-4 py-2 border border-red-900/40 rounded mt-2 font-sans">${err.message}</span>
        </div>`;
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
};

function renderTablaRecepcion(selector, data) {
    if (!$.fn.DataTable) {
        console.error("Falta la biblioteca DataTables en el ecosistema.");
        return;
    }

    const cabecera = CONFIG_RECEPCION.ENCABEZADOS;

    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().clear().destroy();
        $(selector).empty(); 
    }
    
    let theadHtml = `
        <thead>
            <tr>${cabecera.map(h => `<th class="p-4 text-left uppercase tracking-widest text-[10px]">${h}</th>`).join('')}</tr>
        </thead>
        <tbody></tbody>`;
    $(selector).html(theadHtml);

    const indexAcciones = cabecera.length - 1;
    
    const configDefs = cabecera.map((titulo, i) => {
        if (i === indexAcciones) {
            return {
                targets: i,
                orderable: false,
                searchable: false,
                className: "text-center align-middle py-2 px-4 w-[120px]",
                render: function(val, type, row, meta) {
                    const filaIndex = meta.row + 2; 
                    const rowJson = JSON.stringify(row).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    
                    return `
                        <button onclick='abrirRecepcion(${rowJson}, ${filaIndex})' 
                                class='btn-accion-nico px-3 py-1 text-[9px] font-black tracking-widest bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all rounded-md shadow-[0_0_10px_rgba(6,182,212,0.1)] active:scale-95'
                                aria-label='Gestionar pedido fila ${filaIndex}'>
                            <i class="fi fi-bs-comment-alt-check"></i>
                        </button>`;
                }
            };
        }
        
        return { 
            targets: i, 
            className: "p-3 dt-nowrap font-mono text-[10px] text-slate-300 border-b border-slate-900/60 align-middle",
            defaultContent: "<span class='text-slate-700 font-sans'>---</span>"
        };
    });

    $(selector).DataTable({
        data: data || [],
        dom: 'rtip', 
        language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
        pageLength: 15,
        scrollX: true,
        autoWidth: false,
        columnDefs: configDefs,
        headerCallback: function(thead) {
            $(thead).find('th').addClass('text-cyan-500 font-black uppercase tracking-widest text-[10px] p-4 bg-slate-950/80 border-b border-slate-800');
        }
    });
}

async function abrirRecepcion(datos, fila) {
    if (!datos || datos.length === 0) {
        console.error("❌ Error: No se suministraron datos válidos.");
        return;
    }

    const idPedido = String(datos[0]).trim();
    
    const workspace = document.getElementById('workspaceRecepcion');
    const vistaDetalle = document.getElementById('vistaDetallePedido');
    const footer = document.getElementById('section-footer');
    const tituloPantalla = document.getElementById('recepcionTitulo');

    if (workspace) workspace.style.display = 'none';
    if (vistaDetalle) vistaDetalle.style.display = 'block';
    if (footer) footer.style.display = 'flex';
    
    if (tituloPantalla) tituloPantalla.innerText = `GESTIÓN DE ORDEN: ${idPedido}`;

    document.getElementById('recepcionID').value = idPedido;
    document.getElementById('recepcionFila').value = fila;

    const resumen = document.getElementById('recepcion-resumen-pedido');
    if (resumen) {
        resumen.innerHTML = `
        <div class="flex justify-between items-center w-full bg-slate-900/40 p-3 rounded border border-slate-800/80 font-mono">
            <div>
                <h2 class="text-cyan-400 font-bold text-xs uppercase tracking-widest">ID ORDEN: ${idPedido}</h2>
                <p class="text-[10px] text-slate-400 uppercase font-bold mt-0.5">${datos[2] || 'PROVEEDOR INDEFINIDO'}</p>
            </div>
            <div class="text-right">
                <p class="text-emerald-400 font-bold text-xs">SKU INTERNO: ${datos[4] || '---'}</p>
                <p class="text-[9px] text-slate-500 uppercase">F. PEDIDO: ${datos[1] ? datos[1].split('T')[0] : '---'}</p>
            </div>
        </div>`;
    }

    const contenedorItems = document.getElementById('contenedorItemsRecepcion');
    if (contenedorItems) {
        contenedorItems.innerHTML = `<div class="py-12 text-center text-cyan-500 text-[10px] font-mono animate-pulse tracking-widest">SOLICITANDO DESGLOSE DE PRODUCTOS...</div>`;
    }

    cambiarModoGestion('RECIBIDO'); 

    try {
        const res = await callGoogleScript('obtenerItemsPedido', { idPedido: idPedido });
        
        if (res.status === "success" && res.reply && res.reply.success) {
            renderizarItemsDesgloseEspecial(res.reply.items, 'contenedorItemsRecepcion');
            if (tituloPantalla) tituloPantalla.focus();
        } else {
            throw new Error(res.message || res.reply?.error || "Falla de comunicación interna.");
        }
    } catch (err) {
        console.error("❌ Error al desglosar ítems:", err);
        if (contenedorItems) {
            contenedorItems.innerHTML = `<div class="text-red-500 text-[10px] p-4 text-center font-mono border border-red-900/30 bg-red-950/10 rounded">ERROR AL CARGAR SUB-ITEMS: ${err.message}</div>`;
        }
    }
}

function renderizarItemsDesgloseEspecial(items, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (!items || items.length === 0) {
        contenedor.innerHTML = `<div class="text-amber-500 text-[10px] p-4 text-center font-mono">LA ORDEN NO CONTIENE ÍTEMS INDEXADOS.</div>`;
        return;
    }

    let html = `
    <div class="overflow-x-auto max-h-[200px] overflow-y-auto custom-scrollbar border border-slate-800 rounded">
        <table class="w-full text-[11px] border-collapse">
            <thead class="sticky top-0 bg-[#0c1324] z-30 shadow-md">
                <tr class="text-left text-slate-500 border-b border-cyan-900/30">
                    <th class="p-3 uppercase tracking-wider text-[9px] font-bold">SKU / Producto</th>
                    <th class="p-3 text-center uppercase tracking-wider text-[9px] font-bold">Pedida</th>
                    <th class="p-3 text-right uppercase tracking-wider text-[9px] font-bold">A Recibir</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60">`;

    items.forEach(item => {
        html += `
        <tr class="hover:bg-cyan-500/5 transition-colors duration-150">
            <td class="p-3">
                <div class="font-mono text-cyan-400 font-bold">${item.sku || 'N/A'}</div>
                <div class="text-[10px] text-slate-400 uppercase leading-tight mt-0.5">${item.nombre || ''}</div>
            </td>
            <td class="p-3 text-center text-white font-mono font-bold text-xs">${item.cantidadPedida || 0}</td>
            <td class="p-3 text-right">
                <input type="number" 
                       class="input-recibido-item w-20 bg-slate-950 border border-slate-800 rounded p-1 text-right text-cyan-400 font-bold outline-none focus:border-cyan-500 transition-colors text-xs" 
                       data-sku="${item.sku || ''}" 
                       data-original="${item.cantidadPedida || 0}" 
                       data-nombre="${item.nombre || ''}" 
                       data-precio="${item.precio || 0}"
                       value="${item.cantidadPedida || 0}"          
                       min="0"
                       oninput="recalcularPorcentajeDesdeItems()">
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
    
    recalcularPorcentajeDesdeItems();
}
 
function recalcularPorcentajeDesdeItems() {
    const inputs = document.querySelectorAll('.input-recibido-item');
    let totalPedido = 0;
    let totalRecibido = 0;

    inputs.forEach(input => {
        const pedido = parseFloat(input.getAttribute('data-original')) || 0;
        const recibido = parseFloat(input.value) || 0;
        
        totalPedido += pedido;
        totalRecibido += recibido;
    });

    if (totalPedido === 0) return;

    let porcentaje = Math.round((totalRecibido / totalPedido) * 100);
    porcentaje = Math.max(0, Math.min(porcentaje, 100));

    const slider = document.getElementById('inputPorcentaje');
    const display = document.getElementById('valorPorcentaje');
    
    if (slider) slider.value = porcentaje;
    if (display) display.innerText = porcentaje + "%";
}

async function confirmarGestionFinal() {
    const btn = document.getElementById('btnConfirmarGestion');
    const listaInputs = document.querySelectorAll('.input-recibido-item');
    const accionActual = document.getElementById('accionActual').value;
    const inputObsValue = document.getElementById('inputObservaciones').value.trim();

    if (accionActual === 'CANCELADO' && !inputObsValue) {
        Swal.fire({ title: 'MOTIVO REQUERIDO', text: 'Es obligatorio registrar el motivo del colapso del pedido.', icon: 'warning', background: '#0f172a', color: '#fff' });
        return;
    }

    let itemsRecibidos = [];
    listaInputs.forEach(input => {
        itemsRecibidos.push({
            sku: input.getAttribute('data-sku') || "",
            nombre: input.getAttribute('data-nombre') || "",
            precio: parseFloat(input.getAttribute('data-precio')) || 0,
            cantidadRecibida: parseFloat(input.value) || 0,
            cantidadPedida: parseFloat(input.getAttribute('data-original')) || 0 
        });
    });

    const configPayload = {
        idPedido: document.getElementById('recepcionID').value,
        filaEstado: document.getElementById('recepcionFila').value,
        accion: accionActual,
        porcentaje: document.getElementById('inputPorcentaje').value,
        calidad: window.calidadSeleccionada || 0,
        observaciones: inputObsValue,
        esCausaProveedor: document.getElementById('inputCausa')?.value === 'proveedor',
        nuevaFecha: document.getElementById('inputNuevaFecha')?.value || ""
    };

    if (itemsRecibidos.length === 0) {
        configPayload.itemsRecibidos = [{ sku: "N/A", nombre: "PROCESO EXTRAPOLADO", cantidadRecibida: 0 }];
    } else {
        configPayload.itemsRecibidos = itemsRecibidos;
    }

    if (accionActual === 'REPROGRAMADO' && !configPayload.nuevaFecha) {
        Swal.fire({ title: 'FECHA FALTANTE', text: 'Indique la nueva fecha programada en el calendario.', icon: 'warning', background: '#0f172a', color: '#fff' });
        return;
    }

    if (btn) {
        btn.innerHTML = "SINCRONIZANDO CON N.I.C.O... <i class='fas fa-spinner animate-spin ml-2'></i>";
        btn.disabled = true;
    }

    try {
        const res = await callGoogleScript('gestionarEstadoPedidoServidor', configPayload);
        
        if (res.status === "success" && res.reply && res.reply.success) {
            cerrarModalRecepcion();
            Swal.fire({ title: 'IMPACTO EXITOSO', text: 'Los registros e historiales han sido actualizados.', icon: 'success', timer: 1500, showConfirmButton: false });
            verEstadoPedidos();
        } else {
            throw new Error(res.message || res.reply?.error || "Error indeterminado en el servidor.");
        }
    } catch (err) {
        Swal.fire({ title: 'FALLA DE ESCRITURA', text: err.message, icon: 'error', background: '#0f172a', color: '#fff' });
        if (btn) {
            btn.innerHTML = "CONFIRMAR GESTIÓN <i class='fi fi-sc-check-double'></i>"; 
            btn.disabled = false;
        }
    }
}

window.setCalidad = function(valor) {
    window.calidadSeleccionada = valor;
    const inputCalidad = document.getElementById('inputCalidad');
    if (inputCalidad) inputCalidad.value = valor;
    
    const estrellas = document.querySelectorAll('.btn-star');
    estrellas.forEach((estrella, index) => {
        if (index < valor) {
            estrella.style.color = "#eee346"; 
            estrella.style.textShadow = "0 0 8px rgba(238, 227, 70, 0.6)";
        } else {
            estrella.style.color = "#475569"; 
            estrella.style.textShadow = "none";
        }
    });
};

function cambiarModoGestion(modo) {
    document.getElementById('accionActual').value = modo;

    const secRecibido = document.getElementById('section-RECIBIDO');
    const wrapperReprog = document.getElementById('wrapper-reprogramacion');
    const wrapperCausa = document.getElementById('wrapper-causa-cancelacion');
    const btnFinal = document.getElementById('btnConfirmarGestion');
    const inputObs = document.getElementById('inputObservaciones');

    if (!btnFinal || !inputObs) return;

    const estilosActivos = {
        'RECIBIDO': ['bg-emerald-950/40', 'text-emerald-400', 'border-emerald-500/50', 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'],
        'REPROGRAMADO': ['bg-amber-950/40', 'text-amber-400', 'border-amber-500/50', 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'],
        'CANCELADO': ['bg-red-950/40', 'text-red-400', 'border-red-500/50', 'shadow-[0_0_15px_rgba(239,68,68,0.15)]']
    };

    const estilosInactivos = ['bg-slate-900/30', 'text-slate-500', 'border-slate-800/80', 'hover:text-slate-400'];

    const todasLasClases = [
        ...estilosInactivos,
        ...estilosActivos['RECIBIDO'],
        ...estilosActivos['REPROGRAMADO'],
        ...estilosActivos['CANCELADO'],
        'border-cyan-500', 'text-cyan-400', 'border-transparent' // Antiguos residuos
    ];

    ['RECIBIDO', 'REPROGRAMADO', 'CANCELADO'].forEach(m => {
        const targetTab = document.getElementById(`tab-${m}`);
        if (targetTab) {
            targetTab.classList.remove(...todasLasClases);
            targetTab.classList.add(...estilosInactivos);
        }
    });
    
    const tabActiva = document.getElementById(`tab-${modo}`);
    if (tabActiva && estilosActivos[modo]) {
        tabActiva.classList.remove(...estilosInactivos);
        tabActiva.classList.add(...estilosActivos[modo]);
    }

    btnFinal.classList.remove('bg-emerald-600', 'bg-amber-600', 'bg-red-600');

    switch (modo) {
        case 'RECIBIDO':
            if (secRecibido) secRecibido.style.display = 'block';
            if (wrapperReprog) wrapperReprog.classList.add('hidden');
            if (wrapperCausa) wrapperCausa.classList.add('hidden'); 
            
            btnFinal.innerText = "PROCESAR RECEPCIÓN FÍSICA";
            btnFinal.classList.add('bg-emerald-600');
            inputObs.placeholder = "Notas generales del estado de arribo del material (opcional)...";
            break;

        case 'REPROGRAMADO':
            if (secRecibido) secRecibido.style.display = 'none';
            if (wrapperReprog) wrapperReprog.classList.remove('hidden'); 
            if (wrapperCausa) wrapperCausa.classList.add('hidden'); 
            
            btnFinal.innerText = "CONFIRMAR NUEVA FECHA";
            btnFinal.classList.add('bg-amber-600');
            inputObs.placeholder = "Indique detalles de la justificación del transportista o proveedor...";
            if (typeof solicitarFechaReprogramacion === "function") solicitarFechaReprogramacion();
            break;

        case 'CANCELADO':
            if (secRecibido) secRecibido.style.display = 'none';
            if (wrapperReprog) wrapperReprog.classList.add('hidden');
            if (wrapperCausa) wrapperCausa.classList.remove('hidden'); 
            
            btnFinal.innerText = "CONFIRMAR ANULACIÓN TOTAL";
            btnFinal.classList.add('bg-red-600');
            inputObs.placeholder = "INGRESE EL MOTIVO DE LA CANCELACIÓN OBLIGATORIAMENTE...";
            inputObs.focus(); 
            break;
    }
}

async function solicitarFechaReprogramacion() {
    const { value: fecha } = await Swal.fire({
        title: 'REPROGRAMAR ARRIBO',
        input: 'date',
        inputLabel: 'Nueva fecha estimada de llegada a depósito:',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'FIJAR FECHA',
        showCancelButton: true,
        cancelButtonText: 'CANCELAR',
        returnFocus: false,
        customClass: {
                container: 'swal-pedido-container',
                popup: 'swal-pedido'
            },
        didOpen: () => {
            const container = Swal.getContainer();
            if (container) container.style.zIndex = '35000';
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

        const obs = document.getElementById('inputObservaciones');
        if (obs) obs.value = `REPROGRAMADO DE FORMA OFICIAL PARA EL: ${fecha.split('-').reverse().join('/')}`;
    }
}

function cerrarModalRecepcion() {
    const modal = document.getElementById('modalRecepcion');
    if (!modal) return;

    modal.classList.remove('flex');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    document.getElementById('formRecepcion').reset();
    window.calidadSeleccionada = 0;
    setCalidad(0);
    
    const displayFecha = document.getElementById('display-fecha-reprogramada');
    if (displayFecha) displayFecha.innerText = "Sin seleccionar";
    
    const inputF = document.getElementById('inputNuevaFecha');
    if (inputF) inputF.remove();
}



/*--------------SECCION HISTORIAL-----------------------*/

/** @param {string|number} idPedido - Identificador único de la orden.  */

async function verDetalleHistorial(idPedido) {
    const modalDetalle = document.getElementById('modalDetalleHistorial');
    const infoGeneral = document.getElementById('infoGeneralHistorial');
    const contenedorItems = document.getElementById('contenedorItemsHistorial');
    const obsBox = document.getElementById('obsHistorial');
    const subtitulo = document.getElementById('historialSubtitulo');
    
    if (!modalDetalle || !contenedorItems || !infoGeneral || !obsBox) {
        console.error("❌ N.I.C.O. DOM Error: Cimientos del modal de detalles ausentes en el HTML.");
        return;
    }

    if (!idPedido || idPedido === "undefined" || idPedido === "null") {
        console.error(`❌ Falla de Invocación Local: Se intentó auditar un ID inválido. Recibido: [${idPedido}]`);
        return;
    }

    if (subtitulo) subtitulo.innerText = `ID: ${idPedido}`;
    infoGeneral.innerHTML = '';
    obsBox.innerText = "Cargando observaciones...";
    
    contenedorItems.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 bg-slate-950">
            <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-cyan-500 font-mono text-[9px] uppercase tracking-widest italic animate-pulse">Filtrando y recuperando ítems del expediente...</p>
        </div>`;
    
    modalDetalle.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        const res = await callGoogleScript('obtenerItemHistorial', { idPedido: idPedido });
        
        if (res.status === "success" && res.reply && res.reply.success) {
            const data = res.reply;
            
            if (!data.info) throw new Error("El servidor central no retornó el bloque informativo (info).");

            infoGeneral.innerHTML = `
                <div class="flex flex-col">
                    <span class="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Proveedor / Origen</span>
                    <span class="text-slate-200 text-xs font-semibold uppercase mt-0.5">${data.info.proveedor || 'SIN PROVEEDOR'}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Línea de Tiempo</span>
                    <span class="text-slate-400 font-mono text-[11px] mt-0.5">
                        ${data.info.fechaPedido || '---'} <span class="text-cyan-600 font-sans">➔</span> ${data.info.fechaRecepcion || '---'}
                    </span>
                </div>
                <div class="flex flex-col md:items-center">
                    <div class="w-full md:w-auto">
                        <span class="text-slate-500 text-[8px] uppercase tracking-wider font-bold block">Estatus Final</span>
                        <span class="inline-block px-2 py-0.5 mt-1 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                            ${data.info.estatus || 'FINALIZADO'}
                        </span>
                    </div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Auditoría de Calidad</span>
                    <div class="text-amber-400 font-mono text-[11px] mt-0.5 font-bold space-x-1.5">
                        <span>${generarEstrellasVisuales(data.info.calidad)}</span>
                        <span class="text-slate-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[10px] font-normal">${data.info.cumplimiento || '100%'}</span>
                    </div>
                </div>
            `;

            if (data.items && data.items.length > 0 && ('precio' in data.items[0] || 'precioUnitario' in data.items[0])) {
                contenedorItems.innerHTML = renderizarTablaItemsHistorial(data.items, idPedido);
            } else {
                contenedorItems.innerHTML = renderizarTablaInversionPlana(data.items || [], idPedido);
            }

            obsBox.innerHTML = data.info.observaciones 
                ? `"${data.info.observaciones}"` 
                : `"Sin novedades registradas en la recepción del expediente."`;

        } else {
            throw new Error((res.reply && res.reply.error) || "El registro no devolvió una estructura mapeable.");
        }
    } catch (err) {
        console.error(`❌ Error en Módulo Historial [ID: ${idPedido}]:`, err);
        contenedorItems.innerHTML = `
            <div class="p-8 text-center bg-red-950/20 border border-red-900/30 rounded font-mono">
                <div class="text-red-500 text-lg mb-1">⚠️</div>
                <p class="text-red-400 uppercase text-[10px] font-bold tracking-wide">Falla de Indexación Crítica</p>
                <p class="text-slate-400 text-[11px] mt-1 normal-case">${err.message}</p>
            </div>`;
        obsBox.innerText = "Imposible recuperar notas debido a un colapso en la consulta.";
    }
}

function cerrarModalHistorial() {
    const modalDetalle = document.getElementById('modalDetalleHistorial');
    if (!modalDetalle) return;
    
    // Ocultamos el detalle limpio
    modalDetalle.style.display = 'none';
    
    // Bloqueamos el overflow en el body porque el listado general todavía sigue abierto de fondo
    document.body.style.overflow = 'hidden'; 
}

function renderizarTablaInversionPlana(items, idPedido) {
    if (items.length === 0) return `<p class="text-[10px] text-slate-500 font-mono text-center py-4">S/D ÍTEMS</p>`;

    let html = `
    <div class="overflow-hidden rounded-lg border border-slate-800 max-h-[280px] overflow-y-auto custom-scroll">
        <table class="w-full text-[11px] border-collapse">
            <thead class="sticky top-0 bg-[#0f172a] z-10 shadow">
                <tr class="bg-slate-900/90 text-slate-500 text-left border-b border-slate-800">
                    <th class="p-2.5 uppercase text-[8px] font-black tracking-wider">Descripción del Ítem</th>
                    <th class="p-2.5 uppercase text-[8px] font-black tracking-wider text-right">Inversión Final</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40 bg-slate-950/20">`;

    let totalInversion = 0;
    items.forEach((item) => {
        const inversionItem = parseFloat(item.inversion) || 0;
        totalInversion += inversionItem;
        html += `
        <tr class="hover:bg-cyan-500/5 transition-colors duration-100">
            <td class="p-2.5 text-slate-300 flex items-center gap-2">
                <span class="text-cyan-700 font-mono text-xs">▸</span>
                <span class="uppercase">${item.producto || 'Ítem Desconocido'}</span>
            </td>
            <td class="p-2.5 text-right text-white font-mono font-bold">$${inversionItem.toLocaleString()}</td>
        </tr>`;
    });

    html += `
            </tbody>
            <tfoot class="sticky bottom-0 bg-slate-900 z-10 border-t border-cyan-500/20">
                <tr class="bg-cyan-950/20">
                    <td class="p-2.5 text-cyan-500 font-bold uppercase text-[9px] tracking-widest">Total Invertido</td>
                    <td class="p-2.5 text-right text-cyan-400 font-bold font-mono text-xs">$${totalInversion.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    </div>
    
    <div class="mt-3 flex justify-end">
        <button type="button" id="btnVerPdfHistorial" onclick="verPdfPedido('${idPedido}')" 
            class="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 font-mono text-[10px] uppercase tracking-wider rounded border border-cyan-800/50 transition-all active:scale-95 flex items-center gap-1.5">
            <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            Ver Detalle (PDF)
        </button>
    </div>`;
    
    return html;
}

function renderizarTablaItemsHistorial(items, idPedido) {
    let html = `
    <div class="overflow-hidden rounded-lg border border-slate-800 max-h-[280px] overflow-y-auto custom-scroll">
        <table class="w-full text-left text-[11px] border-collapse">
            <thead class="sticky top-0 bg-[#0f172a] z-10 shadow">
                <tr class="bg-slate-900/90 text-slate-500 border-b border-slate-800 text-[8px] font-black tracking-wider">
                    <th class="p-2.5 uppercase">PRODUCTO</th>
                    <th class="p-2.5 uppercase text-center">CANT.</th>
                    <th class="p-2.5 uppercase text-right">PRECIO UNIT.</th>
                    <th class="p-2.5 uppercase text-right">SUBTOTAL</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40 bg-slate-950/20">`;

    let totalCalculado = 0;
    items.forEach(item => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        const subtotal = cantidad * precio;
        totalCalculado += subtotal;

        html += `
        <tr class="hover:bg-cyan-500/5 transition-colors duration-100">
            <td class="p-2.5 text-slate-300 uppercase font-medium">${item.nombre || item.producto}</td>
            <td class="p-2.5 text-center text-white font-mono font-bold">${cantidad}</td>
            <td class="p-2.5 text-right text-slate-400 font-mono">$${precio.toLocaleString()}</td>
            <td class="p-2.5 text-right text-cyan-400 font-bold font-mono">$${subtotal.toLocaleString()}</td>
        </tr>`;
    });

    html += `
            </tbody>
            <tfoot class="sticky bottom-0 bg-slate-900 z-10 border-t border-cyan-500/20">
                <tr class="bg-cyan-950/20 font-bold">
                    <td colspan="3" class="p-2.5 text-cyan-500 uppercase text-[9px] tracking-widest">Total Líquido Calculado</td>
                    <td class="p-2.5 text-right text-cyan-400 font-mono text-xs">$${totalCalculado.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    </div>
    
    <div class="mt-3 flex justify-end">
        <button type="button" id="btnVerPdfHistorial" onclick="verPdfPedido('${idPedido}')" 
            class="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 font-mono text-[10px] uppercase tracking-wider rounded border border-cyan-800/50 transition-all active:scale-95 flex items-center gap-1.5">
            <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            Ver Detalle (PDF)
        </button>
    </div>`;
    
    return html;
}

function generarEstrellasVisuales(valor) {
    const num = parseInt(valor) || 0;
    if (num === 0) return '⭐ 0/5';
    return '★'.repeat(num) + '☆'.repeat(5 - num); // Sintaxis optimizada nativa de JS
}

/** 
 * @param {string|number} idPedido 
 */

async function verPdfPedido(idPedido) {
    console.log("🚀 [N.I.C.O. Trace] Botón presionado con éxito. idPedido recibido:", idPedido);

    try {
        if (typeof Swal === 'undefined') {
            console.error("❌ Error Estructural: SweetAlert2 no está cargado en el DOM.");
            alert(`La función se ejecutó para el pedido ${idPedido}, pero falta la librería SweetAlert2.`);
            return;
        }

        if (!idPedido || idPedido === "undefined" || idPedido === "null") {
            Swal.fire({
                icon: 'warning',
                title: 'ID INVÁLIDO',
                text: 'No se puede consultar un comprobante sin un identificador válido.',
                confirmButtonColor: '#00f0ff',
                background: '#0f172a',
                color: '#f8fafc',
                customClass: {
                        container: 'swal-pedido-container',
                        popup: 'swal-pedido'
                    }
            });
            return;
        }

        // 1. Despliegue del Loader
        Swal.fire({
            title: 'Buscando Comprobante',
            text: `Rastreando archivos del pedido #${idPedido} en Google Drive...`,
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#f8fafc',
            customClass: {
                        container: 'swal-pedido-container',
                        popup: 'swal-pedido'
                    },
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 2. Envío y rastreo de traza de red
        console.log("⏳ [N.I.C.O. Trace] Despachando petición al servidor central...");
        const res = await callGoogleScript('obtenerArchivoPedido', { idPedido: idPedido });
        console.log("✅ [N.I.C.O. Trace] Respuesta cruda del servidor recibida:", res);
        
        if (res && res.status === "success" && res.reply) {
            const archivoData = res.reply;

            if (archivoData.success && archivoData.url) {
                Swal.close(); // Cerramos el loader previo

                // CASO A: Es un PDF -> Lo abrimos en un visor interno integrado
                if (archivoData.tipo === 'pdf') {
                    Swal.fire({
                        title: `<span class="text-cyan-500 font-mono text-xs uppercase tracking-wider">${archivoData.nombre}</span>`,
                        html: `<iframe src="${archivoData.url}" style="border:0; width:100%; height:550px; border-radius:4px;" allowfullscreen></iframe>`,
                        width: '850px',
                        confirmButtonText: 'CERRAR VISOR',
                        confirmButtonColor: '#1e293b',
                        background: '#0f172a',
                        color: '#f8fafc',
                        customClass: {
                        container: 'swal-pedido-container',
                        popup: 'swal-pedido'
                    }
                    });
                } 
                // CASO B: Es un CSV convertido a HTML
                else if (archivoData.tipo === 'csv') {
                    Swal.fire({
                        title: `<span class="text-cyan-500 font-mono text-xs uppercase tracking-wider">VISTA PREVIA: ${archivoData.nombre}</span>`,
                        html: `<div class="custom-scroll border border-slate-800 rounded bg-slate-950 p-2 overflow-auto max-h-[400px] text-left">${archivoData.contenido}</div>`,
                        width: '750px',
                        confirmButtonText: 'CERRAR VISTA',
                        confirmButtonColor: '#1e293b',
                        background: '#0f172a',
                        color: '#f8fafc',
                        customClass: {
                        container: 'swal-pedido-container',
                        popup: 'swal-pedido'
                    }
                    });
                }
            } else {
                throw new Error(archivoData.error || "El servidor no localizó un archivo físico para esta orden.");
            }
        } else {
            throw new Error("La respuesta estructural del servidor central es inválida o está malformada.");
        }

    } catch (error) {
        console.error("❌ Falla capturada en el flujo de verPdfPedido:", error);
        
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-500 font-mono text-sm">IMPOSIBLE ABRIR VISOR</span>',
            text: error.message || 'Error desconocido al procesar el archivo.',
            confirmButtonText: 'ENTENDIDO',
            confirmButtonColor: '#ef4444',
            background: '#0f172a',
            color: '#f8fafc',
            customClass: {
                container: 'swal-pedido-container',
                popup: 'swal-pedido'
            }
        });
    }
}

async function abrirHistorialGeneral() {
    const modalGeneral = document.getElementById('modalHistorialGeneral');
    const contenedorLista = document.getElementById('contenedorListaGeneralHistorial');

    if (!modalGeneral || !contenedorLista) {
        console.error("❌ N.I.C.O. DOM Error: Elementos del Historial General no encontrados.");
        return;
    }

    const overlay = document.getElementById('overlay-carga');
    if (overlay) {
        overlay.style.zIndex = "45000";
        overlay.style.display = 'flex';
    }

    contenedorLista.innerHTML = '';

    modalGeneral.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        const res = await callGoogleScript('obtenerHistorialGeneral');
        
        if (res.status === "success" && res.reply && res.reply.success) {
            const pedidos = res.reply.pedidos || [];
            
            // Renderizar la tabla de historial nativa
            contenedorLista.innerHTML = renderizarTablaHistorialGeneral(pedidos);
        } else {
            throw new Error((res.reply && res.reply.error) || "Error al leer los registros del servidor.");
        }
    } catch (err) {
        console.error("❌ Error en Historial General:", err);
        contenedorLista.innerHTML = `
            <div class="p-10 text-center bg-red-950/10 border border-red-900/30 rounded-xl mt-2">
                <div class="text-red-500 text-xl mb-2">⚠️</div>
                <p class="text-red-400 uppercase text-[10px] font-mono tracking-wide">Falla de Sincronización: ${err.message}</p>
            </div>`;
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
}


function cerrarModalHistorialGeneral() {
    const modalGeneral = document.getElementById('modalHistorialGeneral');
    if (!modalGeneral) return;
    modalGeneral.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * @param {Array} pedidos - Lista de objetos de pedidos devuelta por GAS.
 */
function renderizarTablaHistorialGeneral(pedidos) {
    if (!pedidos || pedidos.length === 0) {
        return `<p class="text-[11px] text-slate-500 font-mono text-center py-8 bg-slate-950/20 border border-slate-900 rounded-lg">No se encontraron expedientes registrados en el sistema.</p>`;
    }

    let html = `
    <div class="overflow-hidden rounded-lg border border-slate-800 max-h-[400px] overflow-y-auto custom-scroll">
        <table class="w-full text-[11px] border-collapse">
            <thead class="sticky top-0 bg-[#0f172a] z-10 shadow">
                <tr class="bg-slate-900/90 text-slate-500 text-left border-b border-slate-800">
                    <th class="p-3 uppercase text-[8px] font-black tracking-wider">ID Pedido</th>
                    <th class="p-3 uppercase text-[8px] font-black tracking-wider">Fecha</th>
                    <th class="p-3 uppercase text-[8px] font-black tracking-wider">Proveedor</th>
                    <th class="p-3 uppercase text-[8px] font-black tracking-wider text-right">Estatus</th>
                    <th class="p-3 uppercase text-[8px] font-black tracking-wider text-center">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40 bg-slate-950/20">`;

    pedidos.forEach((p) => {
        const idReal = p.idPedido || p.id || 'S/D';
        
        html += `
        <tr class="hover:bg-purple-500/5 transition-colors duration-100 text-slate-300">
            <td class="p-3 font-mono font-bold text-purple-400">${idReal}</td>
            <td class="p-3 text-slate-400 font-mono">${p.fechaPedido || p.fecha || '---'}</td>
            <td class="p-3 uppercase font-medium">${p.proveedor || 'SIN PROVEEDOR'}</td>
            <td class="p-3 text-right">
                <span class="inline-block px-2 py-0.5 text-[9px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    ${p.estatus || 'FINALIZADO'}
                </span>
            </td>
            <td class="p-3 text-center">
                <button type="button" onclick="verDetalleHistorial('${idReal}')"
                    class="px-2.5 py-1 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-400 font-mono text-[9px] uppercase tracking-wider rounded border border-cyan-800/50 transition-all active:scale-95">
                    Auditar
                </button>
            </td>
        </tr>`;
    });

    html += `
            </tbody>
        </table>
    </div>`;

    return html;
}



/*-------------------SECCION DATOS SEMANALES------------------------------*/
/*--var navegacionSemanal = {
    semanaActual: null,
    diaActual: null
};

function abrirModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Previene scroll de fondo
    }
}

function cerrarModalReportes() {
    const modal = document.getElementById('modal-reportes-lex');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const contenido = document.getElementById('contenido-reporte-lex');
        if (contenido) contenido.innerHTML = ''; 
    }
}

window.abrirModalSemanal = async function() {
    console.log("🚩 INICIO: abrirModalSemanal");
    if (typeof abrirModalReportes === "function") abrirModalReportes(); 
    if (typeof mostrarCargandoLex === "function") mostrarCargandoLex(true);

    try {
        const res = await callGoogleScript('obtenerDatosReporteSemanal');
        console.log("📦 Respuesta bruta recibida (Mes):", res);
        
        let data = res?.reply?.reply || res?.reply || res;
        console.log("🔍 Data real extraída (Mes):", data);

        let filasRaw = data?.filas || (Array.isArray(data) ? data : []);
        let semanasRelativas = data?.semanasRelativas || [];

        if (filasRaw.length > 0 && (filasRaw[0]?.idprov === 'ID PROV' || filasRaw[0]?.[0] === 'ID PROV')) {
            filasRaw.shift();
        }

        console.log("📊 Filas listas para renderizar (Mes):", filasRaw.length);

        const contenedor = document.getElementById('contenido-reporte-lex');
        if (filasRaw.length === 0) {
            if (contenedor) {
                contenedor.innerHTML = `<div class="text-slate-400 text-center py-10 font-mono text-xs uppercase tracking-wider">No hay datos disponibles para el reporte mensual.</div>`;
            }
            return;
        }

        if (typeof renderizarVistaMes === "function") {
            renderizarVistaMes({ filas: filasRaw, semanasRelativas: semanasRelativas });
        }

    } catch (err) {
        console.error("❌ ERROR CRÍTICO en abrirModalSemanal:", err);
    } finally {
        if (typeof mostrarCargandoLex === "function") mostrarCargandoLex(false);
    }
};

function renderizarVistaMes(response) {
    const data = response?.reply?.filas ? response.reply : response;
    const { filas, semanasRelativas } = data;
    
    const contenedor = document.getElementById('contenido-reporte-lex');
    const titulo = document.getElementById('reportesTitulo');
    
    if (titulo) titulo.innerText = "REPORTE MENSUAL DE ENTREGAS";

    const semanaHoy = getWeekNumber(new Date());
    const semanasHead = (semanasRelativas || []).filter(s => s !== "" && s !== null && s !== undefined);

    const semanasNumeros = semanasHead.map((s, i) => {
        if (/^\d{1,2}$/.test(String(s).trim())) {
            return parseInt(s);
        } else {
            const fechaSemana = new Date(s);
            if (!isNaN(fechaSemana.getTime())) {
                return getWeekNumber(fechaSemana);
            } else {
                const match = s.toString().match(/\d+/);
                return match ? parseInt(match[0]) : (i + 1);
            }
        }
    });

    let html = `
    <div class="lex-report-toolbar p-3 bg-slate-900/40 rounded-lg mb-4 flex gap-4 items-center border border-slate-800/40">
        <button onclick="ejecutarSincronizacionRelampago()" class="lex-btn-nav lex-btn-nav-header px-3 py-1.5 bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 rounded text-[10px] font-bold hover:bg-cyan-900/40 transition-all">
            <i class="fas fa-sync-alt mr-1"></i> REFRESCAR HOJA
        </button>
        <span class="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
            Ecosistema: Semana Actual <b class="text-emerald-400 ml-1 font-bold">${semanaHoy}</b>
        </span>
    </div>

    <div class="overflow-x-auto custom-scroll border border-slate-800/60 rounded-lg">
        <table class="lex-table-report w-full text-left border-collapse text-[11px]">
            <thead>
                <tr class="bg-slate-900 border-b border-slate-800">
                    <th class="p-2.5 text-amber-500 font-bold uppercase tracking-wider min-w-[250px]">Proveedor / Cuenta</th>
                    ${semanasNumeros.map(numSemanaColumna => {
                        const esActual = (numSemanaColumna === semanaHoy);
                        const claseSemana = esActual ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950/40 text-slate-400 border-slate-800';

                        return `
                        <th class="p-1 text-center min-w-[90px]">
                            <button onclick="verDetalleSemana(${numSemanaColumna})" 
                                    class="w-full py-1.5 px-2 rounded border flex flex-col items-center justify-center transition-all hover:border-cyan-500/50 group ${claseSemana}">
                                <span class="text-[7px] text-slate-500 uppercase tracking-tight group-hover:text-cyan-400 transition-colors"><i class="fi fi-br-referral-link-arrow"></i></span>
                                <span class="text-[10px] font-mono font-bold mt-0.5">SEM ${numSemanaColumna}</span>
                            </button>
                        </th>`;
                    }).join('')}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60 bg-slate-950/20">
                ${filas.map(f => {
                    const idprov = f?.idprov || f?.[0] || '';
                    const nombre = f?.nombre || f?.[1] || 'SIN NOMBRE';
                    if (!nombre || nombre === 'NOMBRE PROVEEDOR' || idprov === 'ID PROV') return '';

                    return `
                    <tr class="hover:bg-slate-900/30 transition-colors">
                        <td class="p-2.5 lex-td-prov border-r border-slate-900/40">
                            <div class="inline-block px-1.5 py-0.5 text-[8px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800 mb-1">ID: ${idprov}</div>
                            <div class="lex-nombre-prov font-bold text-slate-300 uppercase tracking-wide">${nombre}</div>
                        </td>
                        ${semanasNumeros.map((numSemanaColumna, idx) => {
                            const val = f[`s${idx + 1}`] !== undefined ? f[`s${idx + 1}`] : f[idx + 2];
                            const esFuturo = numSemanaColumna > semanaHoy;
                            return `<td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(val, esFuturo)}</td>`;
                        }).join('')}
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;

    if (contenedor) contenedor.innerHTML = html;
}

async function verDetalleSemana(numSemana) {
    if (!numSemana) return;
    mostrarCargandoLex(true);
    
    try {
        const res = await callGoogleScript('procesarFiltradoHoja', { 
            param: parseInt(numSemana), 
            tipo: "SEMANA" 
        });
        console.log("📦 Respuesta bruta recibida (Semana):", res);

        let data = res?.reply?.reply || res?.reply || res?.filas || res;
        if (!Array.isArray(data)) data = [];

        renderizarVistaSemanal(data, numSemana); 
        
    } catch (e) {
        console.error("❌ Error en verDetalleSemana:", e);
    } finally {
        mostrarCargandoLex(false);
    }
}

function renderizarVistaSemanal(data, numSemana) {
    const contenedor = document.getElementById('contenido-reporte-lex');
    const titulo = document.getElementById('reportesTitulo');
    
    if (titulo) titulo.innerText = `PLANIFICACIÓN SEMANAL: SEMANA ${numSemana}`;
    
    const dias = [
        { corto: 'LUN', largo: 'LUNES' },
        { corto: 'MAR', largo: 'MARTES' },
        { corto: 'MIE', largo: 'MIERCOLES' },
        { corto: 'JUE', largo: 'JUEVES' },
        { corto: 'VIE', largo: 'VIERNES' },
        { corto: 'SAB', largo: 'SABADO' }
    ];
    
    let html = `
    <div class="lex-report-toolbar mb-4 flex gap-2">
        <button onclick="abrirModalSemanal()" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 rounded hover:bg-emerald-900/30 transition-all">← VOLVER AL MES</button>
        <button onclick="ejecutarSincronizacionRelampago()" class="px-3 py-1.5 text-[10px] font-bold bg-cyan-950/30 text-cyan-400 border border-cyan-800/40 rounded hover:bg-cyan-900/30 transition-all">
            <i class="fas fa-sync-alt mr-1"></i> REFRESCAR
        </button>
    </div>
    <div class="overflow-x-auto custom-scroll border border-slate-800/60 rounded-lg">
        <table class="lex-table-report w-full text-left border-collapse text-[11px]">
            <thead>
                <tr class="bg-slate-900 border-b border-slate-800">
                    <th class="p-2.5 text-amber-500 font-bold uppercase tracking-wider min-w-[200px]">Proveedor / Cuenta</th>
                    ${dias.map(d => `
                        <th class="p-1 text-center min-w-[80px]">
                            <button onclick="verDetalleDia('${d.largo}', ${numSemana})" class="w-full py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono font-bold text-[10px] hover:border-amber-400 transition-colors">
                                ${d.corto}
                            </button>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60 bg-slate-950/20">`;
    
    if (!data || data.length === 0) {
        html += `<tr><td colspan="7" class="p-10 text-center text-slate-500 font-mono text-xs">No hay datos disponibles para esta semana.</td></tr>`;
    } else {
        const filasFiltradas = data.filter(f => {
            const id = f?.idProveedor || f?.idprov || f?.[0] || '';
            return id !== 'ID PROV' && id !== '';
        });

        filasFiltradas.forEach(f => {
            const idprov = f?.idProveedor || f?.idprov || f?.[0] || '';
            const nombre = f?.nombreProveedor || f?.nombre || f?.[1] || 'SIN NOMBRE';
            const s1 = f?.s1 !== undefined ? f.s1 : f?.[2] || 'NO';
            const s2 = f?.s2 !== undefined ? f.s2 : f?.[3] || 'NO';
            const s3 = f?.s3 !== undefined ? f.s3 : f?.[4] || 'NO';
            const s4 = f?.s4 !== undefined ? f.s4 : f?.[5] || 'NO';
            const s5 = f?.s5 !== undefined ? f.s5 : f?.[6] || 'NO';
            const s6 = f?.s6 !== undefined ? f.s6 : f?.[7] || 'NO';
            
            html += `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="p-2.5 border-r border-slate-900/40">
                    <div class="inline-block px-1.5 py-0.5 text-[8px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800 mb-1">ID: ${idprov}</div>
                    <div class="lex-nombre-prov font-bold text-slate-300 uppercase tracking-wide">${nombre}</div>
                </td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s1, false)}</td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s2, false)}</td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s3, false)}</td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s4, false)}</td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s5, false)}</td>
                <td class="p-2 text-center align-middle border-r border-slate-900/20">${formatearEstado(s6, false)}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table></div>`;
    if (contenedor) contenedor.innerHTML = html;
}

async function verDetalleDia(nombreDia, numSemana) {
    mostrarCargandoLex(true);
    
    if (typeof navegacionSemanal !== 'undefined') {
        navegacionSemanal.diaActual = nombreDia;
    }
    
    const contenedor = document.getElementById('contenido-reporte-lex');
    const titulo = document.getElementById('reportesTitulo');

    try {
        const res = await callGoogleScript('procesarFiltradoHoja', { 
            param: nombreDia, 
            tipo: "DIA" 
        });
        
        let data = res?.reply?.reply || res?.reply || res?.filas || res;
        if (!Array.isArray(data)) data = [];

        if (data.length > 0 && (data[0]?.idProveedor === 'ID PROV' || data[0]?.[0] === 'ID PROV')) {
            data.shift();
        }
        
        if (titulo) titulo.innerText = `DETALLE: ${nombreDia} - SEMANA ${numSemana}`;

        let html = `
        <div class="lex-report-toolbar mb-4 flex gap-2">
            <button onclick="verDetalleSemana(${numSemana})" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 rounded hover:bg-emerald-900/30 transition-all">← VOLVER A SEMANA</button>
            <button onclick="abrirModalSemanal()" class="px-3 py-1.5 text-[10px] font-bold bg-amber-950/30 text-amber-400 border border-amber-800/40 rounded hover:bg-amber-900/30 transition-all">INICIO MES</button>
        </div>
        <div class="overflow-x-auto custom-scroll border border-slate-800/60 rounded-lg">
            <table class="lex-table-report w-full text-left border-collapse text-[11px]">
                <thead>
                    <tr class="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px]">
                        <th class="p-2.5">PROVEEDOR</th>
                        <th class="p-2.5 text-center">ESTADO</th>
                        <th class="p-2.5 text-center">FECHA REGISTRO</th>
                        <th class="p-2.5 text-center">ID PEDIDO</th>
                        <th class="p-2.5">OBSERVACIONES</th>
                        <th class="p-2.5 text-center">ACCIONES</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-900/60 bg-slate-950/20">`;

        if (data.length === 0) {
            html += `<tr><td colspan="6" class="p-10 text-center text-slate-500 font-mono text-xs">No hay pedidos registrados para este día.</td></tr>`;
        } else {
            data.forEach(item => {
                const idProv = item?.idProveedor || item?.idprov || item?.[0] || '';
                const nombre = item?.nombreProveedor || item?.nombre || item?.[1] || 'SIN NOMBRE';
                const estado = item?.estado || item?.[2] || 'NO';
                const fechaReg = item?.fechaRegistro || item?.fecha || item?.[3] || ''; 
                const idPedido = item?.idPedido || item?.[4] || '';
                const observaciones = item?.observaciones || item?.[5] || '';
                const fechaReprog = item?.nuevaFechaReprog || item?.fechaReprog || item?.[6] || '';

                let infoFechaHtml = `<div class="font-mono text-slate-300">${fechaReg || '---'}</div>`;
                if (fechaReprog && estado.toString().toUpperCase().includes("REPRO")) {
                    infoFechaHtml += `<div class="text-[9px] text-amber-400 font-mono mt-0.5"><i class="fas fa-calendar-alt mr-1"></i>Reprog: ${fechaReprog}</div>`;
                }

                html += `
                <tr class="hover:bg-slate-900/30 transition-colors">
                    <td class="p-2.5 align-middle">
                        <div class="inline-block px-1.5 py-0.5 text-[8px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800 mb-1">ID: ${idProv}</div>
                        <div class="font-bold text-slate-300 uppercase tracking-wide">${nombre}</div>
                    </td>
                    <td class="p-2 text-center align-middle">${formatearEstado(estado)}</td>
                    <td class="p-2 text-center align-middle">${infoFechaHtml}</td>
                    <td class="p-2 text-center align-middle text-slate-400 font-mono font-bold text-xs">#${idPedido}</td>
                    <td class="p-2 align-middle max-width-[200px] text-slate-400 text-[10px] leading-relaxed white-space-normal break-words">
                        ${observaciones || '<span class="text-slate-600 italic">Sin observaciones</span>'}
                    </td>
                    <td class="p-2 text-center align-middle">
                        <button onclick="verPedidoDirecto('${idPedido}')" class="px-2 py-1 text-[10px] font-bold bg-purple-950/40 text-purple-400 border border-purple-800/50 rounded hover:bg-purple-900/40 transition-colors">
                            <i class="fas fa-search mr-1"></i> Ver
                        </button>
                    </td>
                </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        if (contenedor) contenedor.innerHTML = html;

    } catch (e) {
        console.error("❌ Error en verDetalleDia:", e);
        if (contenedor) contenedor.innerHTML = `<div class="text-red-400 font-mono text-xs p-5">Error al traer detalle diario: ${e.message}</div>`;
    } finally {
        mostrarCargandoLex(false);
    }
}

function getWeekNumber(d) {
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function formatearEstado(e, esFuturo = false) {
    const txt = e ? e.toString().toUpperCase().trim() : "";
    const esNo = !txt || txt === "NO" || txt === "❌ NO";

    if (esNo && esFuturo) return ""; 

    const estiloBase = "display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: monospace; letter-spacing: 0.5px; border: 1px solid;";

    if (esNo) {
        return `<span style="${estiloBase} background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 8px rgba(239, 68, 68, 0.2);">❌ NO</span>`;
    }
    if (txt.includes("SI") || txt.includes("✅") || txt.includes("OK")) {
        return `<span style="${estiloBase} background: rgba(34, 197, 94, 0.1); color: #4ade80; border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 8px rgba(34, 197, 94, 0.2);">✅ OK</span>`;
    }
    if (txt.includes("REPRO") || txt.includes("⚠️")) {
        return `<span style="${estiloBase} background: rgba(234, 179, 8, 0.1); color: #facc15; border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 8px rgba(234, 179, 8, 0.2);">⚠️ REPROG</span>`;
    }

    return `<span style="${estiloBase} background: #334155; color: #cbd5e1; border-color: #475569;">${txt}</span>`;
}

function mostrarCargandoLex(show) {
    const contenedorPadre = document.getElementById('modal-reportes-lex') || document.getElementById('contenido-reporte-lex');
    if (!contenedorPadre) return;
    
    if (show) {
        if (document.getElementById('lex-loader-overlay')) return;

        const loader = document.createElement('div');
        loader.id = "lex-loader-overlay";
        loader.className = "absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-50 rounded-lg animate-fade-in";
        loader.innerHTML = `
            <div class="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span class="text-amber-500 font-mono text-[9px] tracking-[2px] uppercase animate-pulse">ACCEDIENDO AL ARCHIVO MAESTRO...</span>`;
        contenedorPadre.appendChild(loader);
    } else {
        const loader = document.getElementById('lex-loader-overlay');
        if (loader) loader.remove();
    }
}

async function abrirArchivoPedido(idPedido) {
    mostrarCargandoLex(true);
    try {
        const res = await callGoogleScript('obtenerArchivoPedido', { idPedido: idPedido });
        const data = res?.reply || res;

        if (!data) {
            alert(`SISTEMA: No se encontró ningún documento asociado al pedido #${idPedido}`);
            return;
        }

        const visor = document.getElementById('visor-pdf-lex');
        const iframe = document.getElementById('pdf-frame-lex');
        if (!visor || !iframe) return;
        
        iframe.style.display = 'none';
        let visorCSV = document.getElementById('visor-csv-container');
        if (!visorCSV) {
            visorCSV = document.createElement('div');
            visorCSV.id = 'visor-csv-container';
            visor.appendChild(visorCSV);
        }
        visorCSV.innerHTML = '';
        visorCSV.style.display = 'none';

        if (data.tipo === 'pdf') {
            const blob = base64ToBlob(data.contenido, 'application/pdf');
            const url = URL.createObjectURL(blob);
            iframe.src = url;
            iframe.style.display = 'block';
            visor.dataset.currentBlob = url;
        } else if (data.tipo === 'csv') {
            visorCSV.innerHTML = `
                <div class="p-4 text-slate-300">
                    <h3 class="text-amber-500 font-bold font-mono text-xs mb-3 uppercase tracking-wider">VISTA PREVIA CSV: ${data.nombre}</h3>
                    <div class="lex-csv-wrapper overflow-auto border border-slate-800 rounded bg-slate-950 p-2">${data.contenido}</div>
                </div>`;
            visorCSV.style.display = 'block';
        }

        visor.style.display = 'flex';
    } catch (e) {
        console.error("❌ Fallo crítico en canal de visualización:", e);
        alert("Error de comunicación con el archivo.");
    } finally {
        mostrarCargandoLex(false);
    }
}

function cerrarVisorLex() {
    const visor = document.getElementById('visor-pdf-lex');
    const iframe = document.getElementById('pdf-frame-lex');
    if (!visor || !iframe) return;
    
    if (visor.dataset.currentBlob) {
        URL.revokeObjectURL(visor.dataset.currentBlob);
        delete visor.dataset.currentBlob;
    }
    iframe.src = "";
    visor.style.display = 'none';
}

async function exportarVistaActualALex() {
    const contenedor = document.getElementById('contenido-reporte-lex') || document.querySelector('.tab-pane.active') || document.body;
    const tabla = contenedor?.querySelector('table');
    
    if (!tabla) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No se detectó ninguna tabla activa en pantalla para exportar.',
            background: '#1e293b', color: '#cbd5e1'
        });
        return;
    }

    mostrarCargandoLex(true);

    try {
        const filas = [];
        const headers = [];
        let colAccionesIdx = -1;
        
        tabla.querySelectorAll('thead th').forEach((th, index) => {
            const textoHeader = th.innerText.trim();
            if (['ACCIONES', 'ACCION'].includes(textoHeader.toUpperCase())) {
                colAccionesIdx = index; 
            } else {
                headers.push(textoHeader);
            }
        });
        filas.push(headers);

        tabla.querySelectorAll('tbody tr').forEach(tr => {
            const fila = [];
            tr.querySelectorAll('td').forEach((td, index) => {
                if (index === colAccionesIdx) return;
                const badge = td.querySelector('span');
                let textoCelda = badge ? badge.innerText.trim() : td.innerText.trim();
                fila.push(textoCelda.replace(/\n|\r/g, " "));
            });
            if (fila.length > 0) filas.push(fila);
        });

        const elTitulo = document.getElementById('titulo-reporte-lex') || document.querySelector('.active h2') || document.querySelector('.active h3');
        let nombreArchivo = elTitulo ? elTitulo.innerText.trim() : 'Reporte_Pedidos_Vista_Actual';
        nombreArchivo = nombreArchivo.toLowerCase().replace(/[^a-z0-9áéíóúñ_-]/gi, '_');

        const contenidoCSV = "\uFEFF" + filas.map(f => 
            f.map(celda => `"${celda.replace(/"/g, '""')}"`).join(";")
        ).join("\n");

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const urlDescarga = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = urlDescarga;
        link.download = `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`; 
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlDescarga);

    } catch (e) {
        console.error("❌ Falló el wrapper de exportación CSV:", e);
        Swal.fire({
            icon: 'error', title: 'Error de Exportación', text: 'Ocurrió un inconveniente al empaquetar los datos.', background: '#1e293b', color: '#cbd5e1'
        });
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
        if (res?.status === "success") {
            await abrirModalSemanal();
        }
    } catch (err) {
        console.error("❌ Falla en Sync:", err);
    } finally {
        mostrarCargandoLex(false);
    }
}

window.verPedidoDirecto = async function(idPedido) {
    if (!idPedido || idPedido.trim() === "") {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'ID de pedido no válido.', background: '#1e293b', color: '#cbd5e1' });
        return;
    }

    Swal.fire({
        title: 'Buscando registro...',
        html: `Consultando orden <b style="color:#00f0ff">#${idPedido}</b> en el ecosistema...`,
        background: '#1e293b', color: '#cbd5e1',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await callGoogleScript('obtenerDetallePedidoUnico', idPedido);
        const laRespuestaReal = response?.reply || response;

        if (!laRespuestaReal || laRespuestaReal.status === 'error') {
            Swal.fire({
                icon: 'info', title: 'Información del Sistema', text: laRespuestaReal?.message || 'No se localizó el pedido.', background: '#1e293b', color: '#cbd5e1', confirmButtonColor: '#475569'
            });
            return;
        }

        const resData = laRespuestaReal.data || laRespuestaReal;
        const proveedor = resData.proveedor || '---';
        const productos = resData.productos || '---';
        const estado = resData.estado || '---';
        const fechaRegistro = resData.fechaRegistro || '---';
        const observaciones = resData.observaciones || 'Sin comentarios registrados.';
        const nuevaFechaReprog = resData.nuevaFechaReprog || '';
        const origenHoja = laRespuestaReal.origen || 'Ecosistema';

        let colorEstado = '#34d399'; 
        if (estado.toUpperCase().includes('REPRO')) colorEstado = '#eab308';
        if (estado.toUpperCase().includes('PEND')) colorEstado = '#38bdf8';

        Swal.fire({
            title: `<span style="font-size:11px; color:#64748b; letter-spacing:1.5px; font-weight:bold;">DETALLE DE PEDIDO • ${origenHoja.toUpperCase()}</span><br>
                    <span style="color:#00f0ff; font-family:monospace; font-size:22px;">#${idPedido}</span>`,
            html: `
                <div style="text-align: left; background: rgba(15, 23, 42, 0.7); padding: 16px; border-radius: 8px; border: 1px solid #334155; font-size: 13px; line-height: 1.6; margin-top:10px;">
                    <div style="margin-bottom: 10px;">
                        <span style="color: #64748b; font-weight: bold; display:inline-block; width:120px;">PROVEEDOR:</span>
                        <span style="color: #f8fafc; font-weight:600; text-transform:uppercase;">${proveedor}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: #64748b; font-weight: bold; display:block; margin-bottom: 4px;">PRODUCTOS / DETALLE:</span>
                        <div style="background: rgba(15, 23, 42, 0.9); padding: 8px 12px; border-radius: 4px; color: #cbd5e1; border-left: 3px solid #00f0ff; font-size: 12.5px;">
                            ${productos}
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: #64748b; font-weight: bold; display:inline-block; width:120px;">ESTADO:</span>
                        <span style="background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius:4px; color:${colorEstado}; font-weight: bold; font-size: 11px; font-family:monospace;">
                            ${estado}
                        </span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: #64748b; font-weight: bold; display:inline-block; width:120px;">REGISTRO:</span>
                        <span style="color: #cbd5e1; font-family:monospace;">${fechaRegistro}</span>
                    </div>
                    ${nuevaFechaReprog && !["---", ""].includes(nuevaFechaReprog) ? `
                    <div style="margin-bottom: 10px; border-left: 3px solid #eab308; padding-left: 8px; background: rgba(234, 179, 8, 0.05); padding-top: 4px; padding-bottom: 4px;">
                        <span style="color: #eab308; font-weight: bold; display:inline-block; width:110px;">REPROGRAMADO:</span>
                        <span style="color: #fef08a; font-weight: bold; font-family:monospace;">${nuevaFechaReprog}</span>
                    </div>` : ''}
                    <hr style="border:0; border-top: 1px dashed #334155; margin: 14px 0;">
                    <div>
                        <span style="color: #64748b; font-weight: bold; display:block; margin-bottom: 4px;">OBSERVACIONES:</span>
                        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; color: #94a3b8; font-style: italic; min-height: 40px; word-break: break-word; border: 1px solid rgba(255,255,255,0.01);">
                            ${observaciones}
                        </div>
                    </div>
                </div>`,
            background: '#1e293b', color: '#cbd5e1',
            confirmButtonText: 'ENTENDIDO', confirmButtonColor: '#475569',
            customClass: {
                container: 'swal-pedido-container', // <- ¡Esto destruye el bug de capas!
                popup: 'swal-pedido'
            }
        });
    } catch (error) {
        console.error("❌ Error en renderizado frontend:", error);
        Swal.fire({
            icon: 'error', title: 'Error de Renderizado', text: 'No se pudo procesar adecuadamente la estructura del pedido.', background: '#1e293b', color: '#cbd5e1'
        });
    }
};--*/

console.log("✅ N.I.C.O. Terminal: Carga finalizada sin errores críticos.");



