
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
          cb_d: parseInt(fila[4], 10) || 0, // Forzado a entero
          tn_d: parseInt(fila[7], 10) || 0  // Forzado a entero
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
            // Forzamos la entrada de datos a enteros puros
            inventarioMapeado[sku][depo.tag] = {
              f: parseInt(item.StockActual, 10) || 0,
              r: parseInt(item.StockReservado, 10) || 0,
              d: parseInt(item.StockConReservas, 10) || 0 
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
    const instruccionesMovimiento = [];   // Columna M (1 col)
    const valoresActualizadosPost = [];    // Columnas N:P (3 col)
    const colaMovimientos = [];

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      
      // Sanitizado inicial: nos aseguramos de usar enteros puros redondeados hacia abajo
      const dispCB = Math.floor(p.cb.d);
      const dispTN = Math.floor(p.tn.d);

      // 1. VERIFICACIÓN: ¿Tuvo movimiento en las últimas 6 horas?
      const viejo = mapaStockViejo[sku];
      const huboMovimiento = !viejo || (dispCB !== viejo.cb_d || dispTN !== viejo.tn_d);
      if (!huboMovimiento) return; 

      // 2. VERIFICACIÓN CRÍTICA: Si cualquiera de los dos depósitos tiene stock <= 1, se saltea
      if (dispCB <= 1 || dispTN <= 1) return;
      
      const totalStock = dispCB + dispTN;
      if (totalStock <= 1) return; 

      // 3. PRIORIDAD TN: Distribución matemática ideal usando enteros
      const targetTN = Math.ceil(totalStock / 2);  // Si es impar, el entero mayor va a TN
      const targetCB = Math.floor(totalStock / 2); // El entero menor va a CB
      
      // Calculamos la diferencia y forzamos a entero puro
      const cantidadAMoverRaw = targetTN - dispTN; 
      const cantidadAMover = Math.round(cantidadAMoverRaw);

      // Si ya están perfectamente balanceados con prioridad para TN, no hacemos nada
      if (cantidadAMover === 0) return;

      let instruccion = "";
      let estadoFila = "PENDIENTE ⏳";
      let nuevoStockCB = dispCB;
      let nuevoStockTN = dispTN;

      if (cantidadAMover > 0) {
        // Falta stock en TN: Mover de CB a TN (cantidad es un entero positivo)
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
        // Sobra stock en TN: Mover de TN a CB (cantReal es un entero positivo)
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

      // Estructuramos los datos limpios para guardarlos en las variables
      stockCrudoAntesBalanceo.push([
        p.id, p.sku, 
        p.cb.f, p.cb.r, dispCB, 
        p.tn.f, p.tn.r, dispTN, 
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
    
    // Proceso de movimientos silencioso
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
              cantidad: mov.cantidad // Se envía un entero verificado
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

      await delay(1200); 
    }

    console.log("📤 Enviando datos resumidos y consolidados a Google Sheets...");
    
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,
        estadosActualizados: estadosProceso,
        instrucciones: instruccionesMovimiento, 
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