/*---- funciones jsBase Corregidas ------*/

console.log("🚀 Iniciando servicio: Optimizando reportes...");

// Variable global para controlar la instancia de la tabla y evitar duplicidad
let tablaInstancia = null;

window.seleccionarDeposito = function(n) {
    let tituloPortal = '';
    switch(n) {
      case 'CB': tituloPortal = 'CONTABILIUM'; break;
      case 'TN': tituloPortal = 'TIENDA NUBE'; break;
      case 'NULOS': tituloPortal = 'REPORTES NULOS'; break;
    }

    Swal.fire({
      title: 'Sincronizando...',
      text: 'Accediendo a: ' + tituloPortal,
      icon: 'info',
      position: 'center',
      showConfirmButton: false,
      timer: 1500,
      background: '#0f172a',
      color: '#c2902e',
      didOpen: () => { Swal.showLoading(); }
    });

    $('#modalBienvenida').fadeOut(300, function() {
        // Mantenemos el estilo original de visibilidad
        $('#panelStock').attr('style', 'display: block !important; opacity: 1 !important;');
        $('#btnBackContainer').addClass('active').show();
        
        var label = document.getElementById('labelDeposito');
        if(label) label.innerText = 'PANEL: ' + tituloPortal;
        
        // Llamada a la carga de datos
        cargarDatos(n);
    });
};

async function cargarDatos(nombreHoja) {
    console.log("📡 Conectando con servidor para hoja: " + nombreHoja);
    
    try {
        // REEMPLAZO: google.script.run por callGoogleScript para entorno GitHub
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: nombreHoja });
        
        if (res.status === "success" && res.reply.success) {
          console.log("✅ Datos recibidos:", res.reply.data.length, "filas");
          renderDepositosTable(res.reply.headers, res.reply.data);
          Swal.close();
        } else {
          console.error("❌ Error en servidor:", res.reply ? res.reply.error : "Error desconocido");
          Swal.fire('Error', res.reply ? res.reply.error : "Error en servidor", 'error');
        }
    } catch (err) {
        console.error("🚫 Fallo crítico de red:", err);
        Swal.fire('Fallo de conexión', 'No se pudo contactar con el script del servidor.', 'error');
    }
}

function renderDepositosTable(h, d) {
    const container = $('#DepositosTableContainer');
    container.attr('style', 'display: block !important; opacity: 1 !important;');
    
    // IMPORTANTE: Destruir instancia previa si existe para evitar errores de re-inicialización
    if (tablaInstancia) {
        tablaInstancia.destroy();
        $('#tableDepositos').empty(); 
    }

    const htmlEstructura = `
      <div id="filterZone" class="row g-3 mb-4">
        <div class="col-md-12 mb-2">
            <div class="search-box-premium">
                <i class="bi bi-search search-icon"></i>
                <input type="text" id="globalSearch" class="form-control search-input" placeholder="BUSCAR POR SKU, ID O NOMBRE DEL PRODUCTO...">
            </div>
        </div>
      </div>
      <div class="table-responsive">
        <table id="tableDepositos" class="table table-borderless w-100"></table>
      </div>`;
    
    container.empty().html(htmlEstructura);

    // Renderizado de filtros select
    if (d && d.length > 0) {
      // Optimizamos: Solo generamos filtro select para la columna STATUS (Índice 3)
      // para evitar que el navegador se cuelgue procesando miles de SKUs en un select.
      [3].forEach((index) => {
        let uniqueValues = [...new Set(d.map(row => row[index]))].filter(v => v).sort();
        let selectHtml = `
          <div class="col-md-3">
            <label class="n-overtitle" style="font-size:0.65rem; color:var(--lex-gold); opacity: 0.8;">FILTRAR ${h[index]}</label>
            <select class="form-select custom-filter" data-column="${index}">
              <option value="">TODOS</option>
              ${uniqueValues.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
          </div>`;
        $('#filterZone').append(selectHtml);
      });
    }

    // Inicialización de DataTable con tus estilos originales
    tablaInstancia = $('#tableDepositos').DataTable({
      data: d,
      columns: [
        { title: h[0] }, // ID
        { title: h[1] }, // SKU
        { title: h[2] }, // CANTIDAD
        { 
          title: h[3], // STATUS
          render: function(data) {
            let val = data ? data.toString().toUpperCase() : "PENDIENTE";
            let color = (val === "OK" || val === "SINCRO") ? "#10b981" : "#ef4444";
            return `<span style="color: ${color}; font-weight: bold; font-size: 0.85rem;">${val}</span>`;
          }
        }
      ],
      dom: 'Brtip',
      buttons: [
        {
          extend: 'excelHtml5',
          text: '<i class="bi bi-file-earmark-spreadsheet"></i> EXPORTAR VISTA ACTUAL',
          className: 'btn-excel-neon',
          exportOptions: { modifier: { search: 'applied' } },
          title: 'Sincro_Stock_' + new Date().toLocaleDateString()
        }
      ],
      language: { "url": "https://cdn.datatables.net/plug-ins/1.10.21/i18n/Spanish.json" },
      pageLength: 20
    });

    // --- LÓGICA DE BÚSQUEDA GLOBAL ---
    $('#globalSearch').on('keyup', function() {
      tablaInstancia.search(this.value).draw();
    });

    // --- LÓGICA DE FILTROS POR COLUMNA ---
    $('.custom-filter').on('change', function() {
      const colIndex = $(this).data('column');
      const val = $(this).val();
      tablaInstancia.column(colIndex).search(val ? '^' + val + '$' : '', true, false).draw();
    });

    // Vinculación de botones al contenedor original
    $('#btnExportContainer').empty();
    tablaInstancia.buttons().container().appendTo('#btnExportContainer');
}

window.regresarASeleccion = function() {
    $('#panelStock').fadeOut(300, function() {
        $('#modalBienvenida').fadeIn(300);
        $('#btnBackContainer').hide();
        // Opcional: limpiar la tabla al salir para liberar memoria
        if (tablaInstancia) {
            tablaInstancia.destroy();
            $('#tableDepositos').empty();
            tablaInstancia = null;
        }
    });
};
