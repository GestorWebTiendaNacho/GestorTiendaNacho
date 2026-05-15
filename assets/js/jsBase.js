/*----funciones jsBase------*/

  console.log("🚀 Iniciando servicio: Optimizando reportes...");

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

function renderDepositosTable(h, d) {
    const container = $('#DepositosTableContainer');
    container.attr('style', 'display: block !important; opacity: 1 !important;');
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

    if (d && d.length > 0) {
      h.forEach((titulo, index) => {
        let uniqueValues = [...new Set(d.map(row => row[index]))].filter(v => v).sort();
        let selectHtml = `
          <div class="col-md-3">
            <label class="n-overtitle" style="font-size:0.65rem; color:var(--lex-gold); opacity: 0.8;">FILTRAR ${titulo}</label>
            <select class="form-select custom-filter" data-column="${index}">
              <option value="">TODOS</option>
              ${uniqueValues.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
          </div>`;
        $('#filterZone').append(selectHtml);
      });
    }

    const table = $('#tableDepositos').DataTable({
      data: d,
      columns: [
        { title: "ID" },
        { title: "SKU" },
        { title: "CANTIDAD" },
        { 
          title: "STATUS",
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
      table.search(this.value).draw();
    });

    // --- LÓGICA DE FILTROS POR COLUMNA ---
    $('.custom-filter').on('change', function() {
      const colIndex = $(this).data('column');
      const val = $(this).val();
      table.column(colIndex).search(val ? '^' + val + '$' : '', true, false).draw();
    });

    $('#btnExportContainer').empty();
    table.buttons().container().appendTo('#btnExportContainer');
}



function cargarDatos(nombreHoja) {
    console.log("📡 Conectando con servidor para hoja: " + nombreHoja);
    
    google.script.run
      .withSuccessHandler(function(res) {
        if (res.success) {
          console.log("✅ Datos recibidos:", res.data.length, "filas");
          renderDepositosTable(res.headers, res.data);
          Swal.close();
        } else {
          console.error("❌ Error en servidor:", res.error);
          Swal.fire('Error', res.error, 'error');
        }
      })
      .withFailureHandler(function(err) {
        console.error("🚫 Fallo crítico de red:", err);
        Swal.fire('Fallo de conexión', 'No se pudo contactar con el script del servidor.', 'error');
      })
      .getDatosDeposito(nombreHoja);
}
