const axios = require('axios');

// Pescamos la URL de la Web App que guardamos en los Secretos de GitHub
const GAS_URL = process.env.GAS_WEBAPP_URL;

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro (Filtrado 6hs + Balanceo)...");

    // FASE 1: Descargar el token oficial y la "foto actual" de la hoja
    console.log("📡 Conectando con Google Sheets...");
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const resStockViejo = await axios.post(GAS_URL, { action: "obtenerStockActual" });

    if (resToken.data.status !== "success" || resStockViejo.data.status !== "success") {
      throw new Error("Fallo en la comunicación inicial con GAS.");
    }

    const tokenContabilium = resToken.data.reply;
    const stockViejoMatriz = resStockViejo.data.reply; 
    
    // Mapeamos el stock viejo en un diccionario por SKU para detectar movimientos de las últimas 6 horas
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
              d: item.StockConReservas || 0 // Stock Disponible
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
    const stockCrudoAntesBalanceo = [];  // Irá a A2:K
    const valoresActualizadosPost = [];   // Irá a M2:O

    console.log("🧠 Filtrando productos con movimiento y aplicando balanceo...");

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const viejo = mapaStockViejo[sku];

      // Detectamos si el producto se movió (si no existe en la hoja, asumimos que es nuevo/movido)
      const huboMovimiento = !viejo || (p.cb.d !== viejo.cb_d || p.tn.d !== viejo.tn_d);

      if (huboMovimiento) {
        // 1. Matriz ANTES del Balanceo (11 columnas para A:K)
        stockCrudoAntesBalanceo.push([
          p.id, p.sku, 
          p.cb.f, p.cb.r, p.cb.d, 
          p.tn.f, p.tn.r, p.tn.d, 
          p.ml.f, p.ml.r, p.ml.d
        ]);

        // 2. APLICAR LÓGICA DE BALANCEO AQUÍ
        // (Simulación de ejemplo: aquí calculás tus nuevos stocks balanceados)
        let nuevoStockCB = p.cb.d; 
        let nuevoStockTN = p.tn.d; 
        
        // 3. Matriz de VALORES ACTUALIZADOS (3 columnas para M:O)
        valoresActualizadosPost.push([
          p.sku,
          nuevoStockCB.toString(), // Col N: Stock balanceado/actualizado para CB
          nuevoStockTN.toString()  // Col O: Stock balanceado/actualizado para TN
        ]);
      }
    });

    console.log(`📉 Items filtrados listos para impactar: ${stockCrudoAntesBalanceo.length}`);

    // FASE 4: Envío consolidado a Google Sheets
    console.log("📤 Enviando datos definitivos a Google Sheets...");
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,       // Va directo a A2:K
        reporteMovimientos: valoresActualizadosPost // Va directo a M2:O
      }
    });

    console.log("🎉 Proceso completado exitosamente:", resFinal.data.message);

  } catch (error) {
    console.error("❌ ERROR EN EL OPERATIVO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativo();