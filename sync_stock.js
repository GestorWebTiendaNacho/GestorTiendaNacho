
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro Ultra-Optimizado (Silencioso)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida.");
    }

    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const resStockViejo = await axios.post(GAS_URL, { action: "obtenerStockActual" });

    if (!resToken.data || resToken.data.status !== "success" || !resStockViejo.data || resStockViejo.data.status !== "success") {
      throw new Error("Fallo al conectar con GAS para obtener Token o Stock Inicial.");
    }

    const tokenContabilium = resToken.data.reply;
    const stockViejoMatriz = resStockViejo.data.reply || []; 

    // Mapeamos el stock anterior guardado en la hoja (hace 6 horas)
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

    const listaDepositos = [
      { id: "118831", tag: "cb" }, 
      { id: "119039", tag: "tn" },
      { id: "119040", tag: "ml" }
    ];

    let inventarioMapeado = {};
    const PAGE_SIZE = 45; 

    for (const depo of listaDepositos) {
      let pagina = 1; 
      let hayMas = true;

      while (hayMas) {
        const url = `https://rest.contabilium.com/api/inventarios/getStockByDeposito`;
        let resCB = null;
        let intentos = 0;
        const maxIntentos = 4;

        while (intentos < maxIntentos) {
          try {
            resCB = await axios.get(url, {
              headers: { 
                "Authorization": `Bearer ${tokenContabilium}`, 
                "Accept": "application/json" 
              },
              params: { id: depo.id, page: pagina, pageSize: PAGE_SIZE }
            });
            break; 
          } catch (err) {
            if (err.response && err.response.status === 429) {
              intentos++;
              const segundosEspera = (err.response.data?.retry_after || 30) + (intentos * 5);
              await delay(segundosEspera * 1000);
            } else {
              throw err; 
            }
          }
        }

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

          if (items.length < PAGE_SIZE) {
            hayMas = false;
          } else {
            pagina++;
            await delay(1500); 
          }
        } else {
          hayMas = false;
        }
      }
      await delay(2000);
    }

    const skusDescargados = Object.keys(inventarioMapeado);
    
    // Arrays destinados a impactar en la planilla
    const stockCrudoAntesBalanceo = [];   // Columnas A:K (11 col)
    const estadosProceso = [];            // Columna L (1 col)
    const instruccionesMovimiento = [];   // Columna M (1 col) <-- NUEVO!
    const valoresActualizadosPost = [];    // Columnas N:P (3 col)
    const colaMovimientos = [];

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const dispCB = p.cb.d;
      const dispTN = p.tn.d;

      // 1. VERIFICACIÓN: ¿Tuvo movimiento en las últimas 6 horas? (Compara vs histórico de la hoja)
      const viejo = mapaStockViejo[sku];
      const huboMovimiento = !viejo || (dispCB !== viejo.cb_d || dispTN !== viejo.tn_d);
      if (!huboMovimiento) return; // Si no se movió en 6hs, lo salteamos completamente

      // 2. VERIFICACIÓN: Si el stock disponible en ambos depósitos es <= 1, lo salteamos
      if (dispCB <= 1 && dispTN <= 1) return;
      
      const totalStock = dispCB + dispTN;
      if (totalStock <= 1) return; // Filtro de seguridad extra

      // 3. PRIORIDAD TN: Distribución matemática ideal
      const targetTN = Math.ceil(totalStock / 2);  // Prioridad: se queda con el entero mayor
      const targetCB = Math.floor(totalStock / 2); // Se queda con el entero menor
      
      const cantidadAMover = targetTN - dispTN; 

      // Si ya están perfectamente balanceados con prioridad para TN, no hacemos nada
      if (cantidadAMover === 0) return;

      let instruccion = "";
      let estadoFila = "PENDIENTE ⏳";
      let nuevoStockCB = dispCB;
      let nuevoStockTN = dispTN;

      if (cantidadAMover > 0) {
        // Falta stock en TN: Mover de CB a TN
        instruccion = `MOVER ${cantidadAMover} CB A TN`;
        nuevoStockCB = dispCB - cantidadAMover;
        nuevoStockTN = dispTN + cantidadAMover;

        colaMovimientos.push({
          sku: p.sku,
          origen: "118831", 
          destino: "119039", 
          cantidad: cantidadAMover,
          indexFila: stockCrudoAntesBalanceo.length 
        });
      } else if (cantidadAMover < 0) {
        // Sobra stock en TN (y falta en CB): Mover de TN a CB
        const cantReal = Math.abs(cantidadAMover);
        instruccion = `MOVER ${cantReal} TN A CB`;
        nuevoStockCB = dispCB + cantReal;
        nuevoStockTN = dispTN - cantReal;

        colaMovimientos.push({
          sku: p.sku,
          origen: "119039", 
          destino: "118831", 
          cantidad: cantReal,
          indexFila: stockCrudoAntesBalanceo.length
        });
      }

      // Estructuramos los datos para guardarlos en las variables
      stockCrudoAntesBalanceo.push([
        p.id, p.sku, 
        p.cb.f, p.cb.r, p.cb.d, 
        p.tn.f, p.tn.r, p.tn.d, 
        p.ml.f, p.ml.r, p.ml.d
      ]);

      estadosProceso.push([
        estadoFila
      ]);

      instruccionesMovimiento.push([
        instruccion
      ]);

      valoresActualizadosPost.push([
        p.sku,
        nuevoStockCB.toString(), 
        nuevoStockTN.toString()  
      ]);
    });

    if (stockCrudoAntesBalanceo.length === 0) {
      console.log("☀️ Todo equilibrado o sin movimientos recientes. Nada que balancear.");
      await axios.post(GAS_URL, {
        action: "guardarResultadosFinales",
        data: { stockCrudo: [], estadosActualizados: [], instrucciones: [], reporteMovimientos: [] }
      });
      return;
    }

    console.log(`📦 Procesando ${colaMovimientos.length} movimientos de balanceo en la API de Contabilium...`);
    
    // Proceso de movimientos silencioso (No imprime logs individuales de éxito)
    for (const mov of colaMovimientos) {
      const url = `https://rest.contabilium.com/api/inventarios/movimientoInterno`;
      let resMov = null;
      let intentos = 0;
      const maxIntentos = 3;

      while (intentos < maxIntentos) {
        try {
          resMov = await axios.post(url, null, {
            headers: { 
              "Authorization": `Bearer ${tokenContabilium}`, 
              "Accept": "application/json" 
            },
            params: { 
              idDepositoOrigen: mov.origen, 
              idDepositoDestino: mov.destino, 
              codigo: mov.sku,
              cantidad: mov.cantidad
            }
          });
          break; 
        } catch (err) {
          if (err.response && err.response.status === 429) {
            intentos++;
            const segundosEspera = (err.response.data?.retry_after || 15) + (intentos * 5);
            await delay(segundosEspera * 1000);
          } else {
            break; 
          }
        }
      }

      if (resMov && (resMov.status === 200 || resMov.status === 201)) {
        estadosProceso[mov.indexFila][0] = "PROCESADO ✅";
      } else {
        estadosProceso[mov.indexFila][0] = "ERROR API ❌";
      }

      await delay(1200); // Delay preventivo anti-bloqueos
    }

    console.log("📤 Enviando datos resumidos y consolidados a Google Sheets...");
    
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,
        estadosActualizados: estadosProceso,
        instrucciones: instruccionesMovimiento, // Columna M
        reporteMovimientos: valoresActualizadosPost
      }
    });

    console.log("🎉 ¡Operativo finalizado de forma ultra-rápida y limpia!");

  } catch (error) {
    console.error("❌ ERROR CRÍTICO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativo();