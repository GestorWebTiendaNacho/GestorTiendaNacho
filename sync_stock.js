
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativoCompleto() {
  try {
    console.log("🚀 Iniciando Operativo Maestro de Alineación Total (Sin filtro de 6 horas - Barrido Completo)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida.");
    }

    // 1. OBTENCIÓN DE CONFIGURACIÓN Y TOKEN DE GAS
    console.log("📥 Solicitando token de acceso a GAS...");
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });

    if (!resToken.data || resToken.data.status !== "success") {
      throw new Error("Fallo al conectar con GAS para obtener el Token de Contabilium.");
    }

    const tokenContabilium = resToken.data.reply;

    const listaDepositos = [
      { id: "118831", tag: "cb" }, 
      { id: "119039", tag: "tn" },
      { id: "119040", tag: "ml" }
    ];

    let inventarioMapeado = {};
    const PAGE_SIZE = 45; 

    // 2. DESCARGA COMPLETA DE TODOS LOS DEPÓSITOS (SIN EXCEPCIÓN)
    for (const depo of listaDepositos) {
      console.log(`📥 Descargando stock completo del depósito: ${depo.tag.toUpperCase()}...`);
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
              console.log(`⏳ Límite de tasa alcanzado. Esperando ${segundosEspera} segundos...`);
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
            
            // Sanitizado matemático estricto: eliminamos los decimales conflictivos de raíz
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
            await delay(1200); 
          }
        } else {
          hayMas = false;
        }
      }
      await delay(2000);
    }

    const skusDescargados = Object.keys(inventarioMapeado);
    console.log(`📊 Total de SKUs únicos detectados en Contabilium: ${skusDescargados.length}`);

    const stockCrudoAntesBalanceo = [];
    const estadosProceso = [];
    const instruccionesMovimiento = [];
    const valoresActualizadosPost = [];
    const colaMovimientos = [];

    // 3. ANÁLISIS Y BALANCEO DE TODOS LOS PRODUCTOS
    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const dispCB = p.cb.d;
      const dispTN = p.tn.d;

      // SUMA TOTAL: Calculamos la disponibilidad real combinada
      const totalStock = dispCB + dispTN;

      // FILTRO DE SEGURIDAD ESTRICTO:
      // Solo se saltea el producto si la suma de ambos depósitos es menor o igual a 1.
      // Si uno está en 0 y el otro en 1000, pasa perfectamente.
      if (totalStock <= 1) return;

      // DISTRIBUCIÓN MATEMÁTICA IDEAL (ENTEROS)
      const targetTN = Math.ceil(totalStock / 2);  // Si es impar, TN se lleva el entero superior
      const targetCB = Math.floor(totalStock / 2); // Si es impar, CB se lleva el entero inferior
      
      const cantidadAMover = targetTN - dispTN;

      // Si el stock actual en cada depósito ya coincide con el ideal, no se genera movimiento
      if (cantidadAMover === 0) return;

      let instruccion = "";
      let estadoFila = "PENDIENTE ⏳";
      let nuevoStockCB = dispCB;
      let nuevoStockTN = dispTN;

      if (cantidadAMover > 0) {
        instruccion = `MOVER ${cantidadAMover} CB A TN`;
        nuevoStockCB = dispCB - cantidadAMover;
        nuevoStockTN = dispTN + cantidadAMover;

        colaMovimientos.push({
          sku: p.sku,
          origen: "118831", // CB
          destino: "119039", // TN
          cantidad: cantidadAMover,
          indexFila: stockCrudoAntesBalanceo.length 
        });
      } else if (cantidadAMover < 0) {
        const cantReal = Math.abs(cantidadAMover);
        instruccion = `MOVER ${cantReal} TN A CB`;
        nuevoStockCB = dispCB + cantReal;
        nuevoStockTN = dispTN - cantReal;

        colaMovimientos.push({
          sku: p.sku,
          origen: "119039", // TN
          destino: "118831", // CB
          cantidad: cantReal,
          indexFila: stockCrudoAntesBalanceo.length
        });
      }

      // Estructuramos la fila de stock actual (antes de impactar el cambio)
      stockCrudoAntesBalanceo.push([
        p.id, p.sku, 
        p.cb.f, p.cb.r, dispCB, 
        p.tn.f, p.tn.r, dispTN, 
        p.ml.f, p.ml.r, p.ml.d
      ]);

      estadosProceso.push([estadoFila]);
      instruccionesMovimiento.push([instruccion]);
      
      // Estructuramos lo que se guardará en la solapa "Reporte de Movimientos" (Valores Enteros)
      valoresActualizadosPost.push([
        p.sku,
        nuevoStockCB.toString(), 
        nuevoStockTN.toString()  
      ]);
    });

    if (stockCrudoAntesBalanceo.length === 0) {
      console.log("☀️ ¡Espectacular! Todo el universo de productos está perfectamente equilibrado en partes iguales. Nada que mover.");
      // Limpiamos los estados anteriores de la Sheet enviando arreglos vacíos
      await axios.post(GAS_URL, {
        action: "guardarResultadosFinales",
        data: { stockCrudo: [], estadosActualizados: [], instrucciones: [], reporteMovimientos: [] }
      });
      return;
    }

    console.log(`📦 Se detectaron ${colaMovimientos.length} desbalanceos. Procesando movimientos en la API...`);
    
    // 4. EJECUCIÓN DE MOVIMIENTOS EN CONTABILIUM
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
            console.log(`⏳ Esperando ${segundosEspera}s por límite en movimiento de ${mov.sku}...`);
            await delay(segundosEspera * 1000);
          } else {
            console.error(`❌ Error de API en movimiento para SKU ${mov.sku}:`, err.message);
            break; 
          }
        }
      }

      if (resMov && (resMov.status === 200 || resMov.status === 201)) {
        estadosProceso[mov.indexFila][0] = "PROCESADO ✅";
      } else {
        estadosProceso[mov.indexFila][0] = "ERROR API ❌";
      }

      // Un breve delay para no agotar los límites de tasa de Contabilium al escribir de forma continua
      await delay(1200); 
    }

    // 5. ENVÍO DE DATOS FINALES A GOOGLE SHEETS
    console.log("📤 Guardando reportes y estados actualizados en Google Sheets...");
    await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,
        estadosActualizados: estadosProceso,
        instrucciones: instruccionesMovimiento, 
        reporteMovimientos: valoresActualizadosPost
      }
    });

    console.log("🎉 ¡Operativo de alineación total finalizado exitosamente!");

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN OPERATIVO COMPLETO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativoCompleto();