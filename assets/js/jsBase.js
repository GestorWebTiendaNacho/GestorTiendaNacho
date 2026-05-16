/*---- funciones jsBase Corregidas ------*/

console.log("🚀 Iniciando servicio: Optimizando reportes...");

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
        $('#panelStock').attr('style', 'display: block !important; opacity: 1 !important;');
        $('#btnBackContainer').addClass('active').show();
        
        var label = document.getElementById('labelDeposito');
        if(label) label.innerText = 'PANEL: ' + tituloPortal;
        
        cargarDatos(n);
    });
};

async function cargarDatos(nombreHoja) {
    console.log("📡 Conectando con servidor para hoja: " + nombreHoja);
    
    try {
        // Se envía el objeto que el doPost recibirá como 'data'
        const res = await callGoogleScript('get_datos_deposito', { nombreSheet: nombreHoja });
        
        console.log("🔍 Respuesta recibida:", res);

        if (res && res.status === "success") {
            const respuestaServidor = res.reply;
            
            // Validamos que la respuesta del servidor exista y sea exitosa
            if (respuestaServidor && respuestaServidor.success) {
                console.log("✅ Datos recibidos:", respuestaServidor.data.length, "filas");
                renderDepositosTable(respuestaServidor.headers, respuestaServidor.data);
                Swal.close();
            } else {
                // El error viene de la lógica interna de getDatosDeposito (ej. hoja no encontrada)
                const errorMsg = respuestaServidor?.error || "La hoja no contiene datos válidos.";
                console.error("❌ Error en lógica de servidor:", errorMsg);
                Swal.fire('Error de Datos', errorMsg, 'error');
            }
        } else {
            // El error viene del bloque catch del doPost o de la comunicación
            throw new Error(res.message || "Error en la estructura de comunicación");
        }
    } catch (err) {
        console.error("🚫 Fallo crítico:", err);
        Swal.fire('Fallo de conexión', 'No se pudo contactar con el servidor: ' + err.message, 'error');
    }
}

function renderDepositosTable(h, d) {
    const container = $('#DepositosTableContainer');
    container.attr('style', 'display: block !important; opacity: 1 !important;');
    
    // Destruir instancia previa para evitar errores de reinicialización
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

    // Filtros Select (Solo para STATUS - Índice 3)
    if (d && d.length > 0) {
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

    // Inicialización de DataTable
    tablaInstancia = $('#tableDepositos').DataTable({
      data: d,
      columns: [
        { title: h[0] }, 
        { title: h[1] }, 
        { title: h[2] }, 
        { 
          title: h[3], 
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

    $('#globalSearch').on('keyup', function() {
      tablaInstancia.search(this.value).draw();
    });

    $('.custom-filter').on('change', function() {
      const colIndex = $(this).data('column');
      const val = $(this).val();
      tablaInstancia.column(colIndex).search(val ? '^' + val + '$' : '', true, false).draw();
    });

    $('#btnExportContainer').empty();
    tablaInstancia.buttons().container().appendTo('#btnExportContainer');
}

window.regresarASeleccion = function() {
    $('#panelStock').fadeOut(300, function() {
        $('#modalBienvenida').fadeIn(300);
        $('#btnBackContainer').hide();
        if (tablaInstancia) {
            tablaInstancia.destroy();
            $('#tableDepositos').empty();
            tablaInstancia = null;
        }
    });
};
