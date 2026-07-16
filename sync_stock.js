
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro (Filtrado 6hs + Balanceo)...");

    if (!GAS_URL) {
      throw new Error("La URL de la Web App de Google (GAS_WEBAPP_URL) no está definida en las variables de entorno de GitHub.");
    }

    console.log("📡 Conectando con Google Sheets para fase inicial...");
    
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const resStockViejo = await axios.post(GAS_URL, { action: "obtenerStockActual" });

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
      console.log(`📡 Descargando depósito: ${depo.tag.toUpperCase()} de Contabilium...`);

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
              params: { 
                id: depo.id, 
                page: pagina, 
                pageSize: PAGE_SIZE 
              }
            });
            break; 
          } catch (err) {
            if (err.response && err.response.status === 429) {
              intentos++;
              const segundosEspera = (err.response.data?.retry_after || 30) + (intentos * 5);
              console.warn(`⚠️ [429 Rate Limited] Cloudflare detectó tráfico denso de GitHub. Intento ${intentos}/${maxIntentos}. Esperando ${segundosEspera} segundos...`);
              await delay(segundosEspera * 1000);
            } else {
              throw err; 
            }
          }
        }

        if (!resCB) {
          throw new Error(`Imposible evadir el Rate Limiting (429) en el depósito ${depo.tag} (Pág. ${pagina}) tras ${maxIntentos} intentos.`);
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
    
    // Inicializamos las estructuras de datos con el tamaño exacto que espera GAS
    const stockCrudoAntesBalanceo = [];  // Matriz de 11 columnas (A:K)
    const estadosProceso = [];           // Matriz de 1 columna (L)
    const valoresActualizadosPost = [];   // Matriz de 3 columnas (N:P)
    const colaMovimientos = [];

    console.log("🧠 Analizando equilibrio y productos con movimiento...");

    skusDescargados.forEach(sku => {
      const p = inventarioMapeado[sku];
      const viejo = mapaStockViejo[sku];

      const huboMovimiento = !viejo || (p.cb.d !== viejo.cb_d || p.tn.d !== viejo.tn_d);

      if (huboMovimiento) {
        const dispCB = p.cb.d;
        const dispTN = p.tn.d;
        const diff = dispCB - dispTN;

        let instruccion = "";
        let estadoFila = "PROCESADO ✅"; 
        let nuevoStockCB = dispCB;
        let nuevoStockTN = dispTN;

        if (diff > 1) {
          const cantidad = Math.floor(diff / 2);
          if (cantidad > 0) {
            instruccion = `MOVER ${cantidad} CB A TN`;
            estadoFila = "PENDIENTE ⏳";
            nuevoStockCB = dispCB - cantidad;
            nuevoStockTN = dispTN + cantidad;

            colaMovimientos.push({
              sku: p.sku,
              origen: "118831", 
              destino: "119039", 
              cantidad: cantidad,
              indexFila: stockCrudoAntesBalanceo.length 
            });
          }
        } else if (diff < -1) {
          const cantidad = Math.floor(Math.abs(diff) / 2);
          if (cantidad > 0) {
            instruccion = `MOVER ${cantidad} TN A CB`;
            estadoFila = "PENDIENTE ⏳";
            nuevoStockCB = dispCB + cantidad;
            nuevoStockTN = dispTN - cantidad;

            colaMovimientos.push({
              sku: p.sku,
              origen: "119039", 
              destino: "118831", 
              cantidad: cantidad,
              indexFila: stockCrudoAntesBalanceo.length
            });
          }
        }

        // 1. Cargamos el Stock Crudo: Estrictamente 11 columnas (A a K)
        stockCrudoAntesBalanceo.push([
          p.id, p.sku, 
          p.cb.f, p.cb.r, p.cb.d, 
          p.tn.f, p.tn.r, p.tn.d, 
          p.ml.f, p.ml.r, p.ml.d
        ]);

        // 2. Cargamos el Estado Inicial de la Fila: Estrictamente 1 columna (L)
        estadosProceso.push([
          estadoFila
        ]);

        // 3. Cargamos la proyección Post-Balanceo: Estrictamente 3 columnas (N a P)
        valoresActualizadosPost.push([
          p.sku,
          nuevoStockCB.toString(), 
          nuevoStockTN.toString()  
        ]);
      }
    });

    console.log(`📉 Items filtrados detectados: ${stockCrudoAntesBalanceo.length}`);
    console.log(`📦 Movimientos de balanceo pendientes de ejecución: ${colaMovimientos.length}`);

    if (colaMovimientos.length > 0) {
      console.log("🚀 Iniciando posting de movimientos de equilibrio en la API de Contabilium...");
      
      for (const mov of colaMovimientos) {
        const url = `https://rest.contabilium.com/api/inventarios/movimientoInterno`;
        let resMov = null;
        let intentos = 0;
        const maxIntentos = 4;

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
              console.warn(`⚠️ [429 API Balanceo] Límite de tasa en movimiento para SKU ${mov.sku}. Esperando ${segundosEspera}s para reintentar...`);
              await delay(segundosEspera * 1000);
            } else {
              console.error(`❌ Error en llamada API de balanceo para SKU ${mov.sku}:`, err.message);
              break; 
            }
          }
        }

        // Actualizamos dinámicamente el estado en la columna de Estados (L) utilizando el index trackeado
        if (resMov && (resMov.status === 200 || resMov.status === 201)) {
          console.log(`✅ Éxito: ${mov.sku} (${mov.cantidad} unidades balanceadas)`);
          estadosProceso[mov.indexFila][0] = "PROCESADO ✅";
        } else {
          console.error(`❌ Falló definitivamente el balanceo del SKU ${mov.sku}`);
          estadosProceso[mov.indexFila][0] = "ERROR API ❌";
        }

        await delay(1200);
      }
    }

    console.log("📤 Enviando resultados consolidados a Google Sheets...");
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoAntesBalanceo,         // 11 columnas -> va a A:K
        estadosActualizados: estadosProceso,         // 1 columna  -> va a L:L
        reporteMovimientos: valoresActualizadosPost  // 3 columnas -> va a N:P
      }
    });

    console.log("🎉 Proceso completado exitosamente en Google Sheets:", resFinal.data.reply || resFinal.data);

  } catch (error) {
    console.error("❌ ERROR CRÍTICO DETECTADO EN EL OPERATIVO:");
    console.error("👉 Mensaje del error:", error.message);
    
    if (error.response) {
      console.error("📄 Código de Estado HTTP recibido:", error.response.status);
      console.error("📄 Contenido exacto devuelto por el servidor:", JSON.stringify(error.response.data));
    }
    process.exit(1);
  }
}

ejecutarOperativo();