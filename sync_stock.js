const axios = require('axios'); // Sintaxis CommonJS universalmente compatible

// Pescamos la variable con el nombre EXACTO que definimos en el archivo YAML
const GAS_URL = process.env.GAS_WEBAPP_URL; 

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro (Filtrado 6hs + Balanceo)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida en el entorno.");
    }

    // FASE 1: Descargar el token oficial y la "foto actual" de la hoja
    console.log("📡 Conectando con Google Sheets...");
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const resStockViejo = await axios.post(GAS_URL, { action: "obtenerStockActual" });

    if (resToken.data.status !== "success" || resStockViejo.data.status !== "success") {
      throw new Error("Fallo en la comunicación inicial con GAS. Revisa los logs de la Web App.");
    }

    const tokenContabilium = resToken.data.reply;
    const stockViejoMatriz = resStockViejo.data.reply; 
    
    // Mapeamos el stock viejo en un diccionario por SKU
    const mapaStockViejo = {};
    stockViejoMatriz.forEach(fila => {
      const sku = fila[1]; // Columna B
      if (sku) {
        mapaStockViejo[sku] = {
          cb_d: parseFloat(fila[4]) || 0, // Col E: cb disponible anterior
          tn_d: parseFloat(fila[7]) || 0  // Col H: tn disponible anterior
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

    // FASE 3: Filtrado por movimiento y división de Matrices (Pre-Balanceo vs Actualizados)
    const skusDescargados = Object.keys(inventarioMapeado);
    const stockCrudoAntesBalanceo = [];  
    const valoresActualizadosPost = [];   

    console.log("🧠 Filtrando productos con movimiento y aplicando balanceo...");

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const viejo = mapaStockViejo[sku];

      const huboMovimiento = !viejo || (p.cb.d !== viejo.cb_d || p.tn.d !== viejo.tn_d);

      if (huboMovimiento) {
        // 1. Matriz ANTES del Balanceo (11 columnas exactas para A:K)
        stockCrudoAntesBalanceo.push([
          p.id, p.sku, 
          p.cb.f, p.cb.r, p.cb.d, 
          p.tn.f, p.tn.r, p.tn.d, 
          p.ml.f, p.ml.r, p.ml.d
        ]);

        // 2. Valores Actualizados Post-Balanceo (3 columnas para M:O)
        // (Por ahora dejamos los valores crudos devueltos, luego agregamos la ecuación matemática)
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

    console.log("🎉 Proceso completado exitosamente:", resFinal.data.message);

  } catch (error) {
    console.error("❌ ERROR EN EL OPERATIVO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativo();