
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro de Alineación Total (Sin filtro de 6 horas)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida.");
    }

    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    
    if (!resToken.data || resToken.data.status !== "success") {
      throw new Error("Fallo al conectar con GAS para obtener el Token de Contabilium.");
    }

    const tokenContabilium = resToken.data.reply;

    const listaDepositos = [
      { id: "118831", tag: "cb" }, // Depósito Principal (Contabilium)
      { id: "119039", tag: "tn" }, // Depósito Tiendanube
      { id: "119040", tag: "ml" }  // Depósito MercadoLibre
    ];

    let inventarioMapeado = {};
    const PAGE_SIZE = 45; 

    // 1. DESCARGA COMPLETA DE TODOS LOS DEPOSITOS
    for (const depo of listaDepositos) {
      let pagina = 1; 
      let hayMas = true;
      console.log(`📥 Descargando stock completo del depósito: ${depo.tag.toUpperCase()}...`);

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
              console.log(`⏳ Rate limit (429) detectado. Esperando ${segundosEspera} segundos...`);
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
            
            // Forzamos un entero absoluto usando Math.floor por si viene algún decimal fantasma de la API
            inventarioMapeado[sku][depo.tag] = {
              f: Math.floor(parseFloat(item.StockActual) || 0),
              r: Math.floor(parseFloat(item.StockReservado) || 0),
              d: Math.floor(parseFloat(item.StockConReservas) || 0) 
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
    console.log(`📊 Total de SKUs únicos detectados en Contabilium: ${skusDescargados.length}`);
    
    const stockCrudoAntesBalanceo = [];   // Columnas A:K (11 col)
    const estadosProceso = [];            // Columna L (1 col)
    const instruccionesMovimiento = [];   // Columna M (1 col)
    const valoresActualizadosPost = [];    // Columnas N:P (3 col)
    const colaMovimientos = [];

    // 2. PROCESO DE EVALUACIÓN Y BALANCEO SIN FILTRO DE TIEMPO
    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      
      const dispCB = p.cb.d;
      const dispTN = p.tn.d;

      // VERIFICACIÓN CRÍTICA: Se saltea si ambos depósitos están en cero o negativo (evitamos romper stock)
      if (dispCB <= 1 || dispTN <= 1) return;
      
      const totalStock = dispCB + dispTN;
      if (totalStock <= 1) return; 

      // DISTRIBUCIÓN MATEMÁTICA IDEAL
      const targetTN = Math.ceil(totalStock / 2);  // Impar: el mayor va a TN
      const targetCB = Math.floor(totalStock / 2); // Impar: el menor va a CB
      
      const cantidadAMover = targetTN - dispTN;

      // Si ya están balanceados de forma óptima, no tocamos nada
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
        // Sobra stock en TN: Mover de TN a CB
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

      // Estructuramos datos para enviar a Google Sheets
      stockCrudoAntesBalanceo.push([
        p.id, p.sku, 
        p.cb.f, p.cb.r, dispCB, 
        p.tn.f, p.tn.r, dispTN, 
        p.ml.f, p.ml.r, p.ml.d
      ]);

      estadosProceso.push([estadoFila]);
      instruccionesMovimiento.push([instruccion]);
      valoresActualizadosPost.push([
        p.sku,
        nuevoStockCB.toString(), 
        nuevoStockTN.toString()  
      ]);
    });

    if (stockCrudoAntesBalanceo.length === 0) {
      console.log("☀️ ¡Espectacular! Todo el universo de productos está perfectamente equilibrado.");
      await axios.post(GAS_URL, {
        action: "guardarResultadosFinales",
        data: { stockCrudo: [], estadosActualizados: [], instrucciones: [], reporteMovimientos: [] }
      });
      return;
    }

    console.log(`📦 Procesando de manera efectiva ${colaMovimientos.length} movimientos de balanceo requeridos...`);
    
    // 3. EJECUCIÓN DE MOVIMIENTOS INTERNOS
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
            console.log(`⏳ Rate limit en movimiento para SKU ${mov.sku}. Reintentando en ${segundosEspera}s...`);
            await delay(segundosEspera * 1000);
          } else {
            console.error(`❌ Error al mover SKU ${mov.sku}:`, err.message);
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
    
    await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,
        estadosActualizados: estadosProceso,
        instrucciones: instruccionesMovimiento, 
        reporteMovimientos: valoresActualizadosPost
      }
    });

    console.log("🎉 ¡Operativo de Alineación General finalizado con éxito!");

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN EL OPERATIVO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativo();