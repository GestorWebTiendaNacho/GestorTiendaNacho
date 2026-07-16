const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro (Filtrado 6hs + Balanceo)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida en las variables de entorno de GitHub.");
    }

    // FASE 1: Descargar el token oficial y la "foto actual" de la hoja
    console.log("📡 Conectando con Google Sheets para fase inicial...");
    
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const resStockViejo = await axios.post(GAS_URL, { action: "obtenerStockActual" });

    // Verificación estructural minuciosa de las respuestas de GAS
    if (!resToken.data || resToken.data.status !== "success") {
      console.error("🚨 Respuesta inesperada de Token GAS:", resToken.data);
      throw new Error("Fallo al obtener el token desde Google Apps Script.");
    }
    if (!resStockViejo.data || resStockViejo.data.status !== "success") {
      console.error("🚨 Respuesta inesperada de Stock Viejo GAS:", resStockViejo.data);
      throw new Error("Fallo al obtener el stock actual desde Google Apps Script.");
    }

    const tokenContabilium = resToken.data.reply;
    const stockViejoMatriz = resStockViejo.data.reply || []; 
    
    console.log(`✅ Token recibido. Se recuperaron ${stockViejoMatriz.length} filas históricas de la hoja.`);

    const mapaStockViejo = {};
    stockViejoMatriz.forEach(fila => {
      const sku = fila[1]; 
      if (sku) {
        mapaStockViejo[sku] = {
          cb_d: parseFloat(fila[4]) || 0, 
          tn_d: parseFloat(fila[7]) || 0  
        };
      }
    });

    // FASE 2: Descarga Completa Multi-Depósito desde Contabilium
    const listaDepositos = [
      { id: "118831", tag: "cb" }, 
      { id: "119039", tag: "tn" },
      { id: "119040", tag: "ml" }
    ];

    let inventarioMapeado = {};
    const PAGE_SIZE = 50;

    for (const depo of listaDepositos) {
      let pagina = 0;
      let hayMas = true;
      console.log(`📡 Descargando depósito: ${depo.tag.toUpperCase()} de Contabilium...`);

      while (hayMas) {
        const url = `https://api.contabilium.com/v1/inventarios/getStockByDeposito`;
        const resCB = await axios.get(url, {
          headers: { "Authorization": `Bearer ${tokenContabilium}`, "Accept": "application/json" },
          params: { id: depo.id, page: pagina, pageSize: PAGE_SIZE }
        });

        const items = resCB.data.Items || [];

        if (items.length > 0) {
          items.forEach(item => {
            const sku = item.Codigo || "SIN-SKU";
            if (!inventarioMapeado[sku]) {
              inventarioMapeado[sku] = {
                id: item.IdConcepto || item.Id,
                sku: sku,
                cb: { f: 0, r: 0, d: 0 },
                tn: { f: 0, r: 0, d: 0 },
                ml: { f: 0, r: 0, d: 0 }
              };
            }
            inventarioMapeado[sku][depo.tag] = {
              f: item.StockActual || 0,
              r: item.StockReservado || 0,
              d: item.StockConReservas || 0 
            };
          });

          if (items.length < PAGE_SIZE) hayMas = false; else pagina++;
        } else {
          hayMas = false;
        }
      }
    }

    // FASE 3: Filtrado por movimiento y división de Matrices
    const skusDescargados = Object.keys(inventarioMapeado);
    const stockCrudoAntesBalanceo = [];  
    const valoresActualizadosPost = [];   

    console.log("🧠 Filtrando productos con movimiento...");

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const viejo = mapaStockViejo[sku];

      const huboMovimiento = !viejo || (p.cb.d !== viejo.cb_d || p.tn.d !== viejo.tn_d);

      if (huboMovimiento) {
        stockCrudoAntesBalanceo.push([
          p.id, p.sku, 
          p.cb.f, p.cb.r, p.cb.d, 
          p.tn.f, p.tn.r, p.tn.d, 
          p.ml.f, p.ml.r, p.ml.d
        ]);

        let nuevoStockCB = p.cb.d; 
        let nuevoStockTN = p.tn.d; 
        
        valoresActualizadosPost.push([
          p.sku,
          nuevoStockCB.toString(), 
          nuevoStockTN.toString()  
        ]);
      }
    });

    console.log(`📉 Items filtrados listos para impactar: ${stockCrudoAntesBalanceo.length}`);

    // FASE 4: Envío consolidado a Google Sheets
    console.log("📤 Enviando datos definitivos a Google Sheets...");
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,       
        reporteMovimientos: valoresActualizadosPost 
      }
    });

    console.log("🎉 Proceso completado exitosamente en Google Sheets:", resFinal.data.reply || resFinal.data);

  } catch (error) {
    console.error("❌ ERROR CRÍTICO DETECTADO EN EL OPERATIVO:");
    console.error("👉 Mensaje del error:", error.message);
    
    // Si la falla proviene de la respuesta de un servidor remoto (GAS o Contabilium)
    if (error.response) {
      console.error("📄 Código de Estado HTTP recibido:", error.response.status);
      console.error("📄 Contenido exacto devuelto por el servidor:", JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error("📡 No se recibió respuesta del servidor. Comprobá que la URL de tu Web App no esté caída.");
    }
    process.exit(1);
  }
}

ejecutarOperativo();