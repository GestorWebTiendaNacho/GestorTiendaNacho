
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativoCompleto() {
  try {
    console.log("🚀 Iniciando Operativo Maestro (BARRIDO TOTAL - Balanceo por Diferencia)...");

    if (!GAS_URL) throw new Error("GAS_WEBAPP_URL no definido.");

    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    if (!resToken.data || resToken.data.status !== "success") throw new Error("Fallo al obtener Token.");
    const tokenContabilium = resToken.data.reply;

    const listaDepositos = [
      { id: "118831", tag: "cb" }, 
      { id: "119039", tag: "tn" },
      { id: "119040", tag: "ml" }
    ];

    let inventarioMapeado = {};
    const PAGE_SIZE = 45; 

    // DESCARGA TOTAL
    for (const depo of listaDepositos) {
      let pagina = 1; 
      let hayMas = true;
      console.log(`📥 Descargando: ${depo.tag.toUpperCase()}...`);

      while (hayMas) {
        const resCB = await axios.get(`https://rest.contabilium.com/api/inventarios/getStockByDeposito`, {
          headers: { "Authorization": `Bearer ${tokenContabilium}`, "Accept": "application/json" },
          params: { id: depo.id, page: pagina, pageSize: PAGE_SIZE }
        });

        const items = resCB.data.Items || [];
        items.forEach(item => {
          const sku = item.Codigo || "SIN-SKU";
          if (!inventarioMapeado[sku]) {
            inventarioMapeado[sku] = { id: item.IdConcepto || item.Id, sku: sku, cb: { d: 0 }, tn: { d: 0 }, ml: { d: 0 } };
          }
          // Sanitizado absoluto a entero
          inventarioMapeado[sku][depo.tag].d = Math.floor(parseFloat(item.StockConReservas) || 0);
        });

        if (items.length < PAGE_SIZE) hayMas = false;
        else { pagina++; await delay(1000); }
      }
      await delay(1500);
    }

    const stockCrudoAntesBalanceo = [];
    const estadosProceso = [];
    const instruccionesMovimiento = [];
    const reporteMovimientos = [];
    const colaMovimientos = [];

    // PROCESAMIENTO
    Object.keys(inventarioMapeado).forEach(sku => {
      const p = inventarioMapeado[sku];
      const dispCB = p.cb.d;
      const dispTN = p.tn.d;
      const totalStock = dispCB + dispTN;

      // SOLO SALTEAMOS SI EL TOTAL ES MENOR O IGUAL A 1
      if (totalStock <= 1) return;

      const diferencia = dispCB - dispTN;
      const cantidadAMover = Math.floor(Math.abs(diferencia) / 2);

      if (cantidadAMover === 0) return;

      let instruccion = "";
      let origen = "";
      let destino = "";

      if (diferencia > 0) {
        instruccion = `MOVER ${cantidadAMover} CB A TN`;
        origen = "118831"; destino = "119039";
      } else {
        instruccion = `MOVER ${cantidadAMover} TN A CB`;
        origen = "119039"; destino = "118831";
      }

      colaMovimientos.push({ sku, origen, destino, cantidad: cantidadAMover, indexFila: stockCrudoAntesBalanceo.length });
      stockCrudoAntesBalanceo.push([p.id, p.sku, 0, 0, dispCB, 0, 0, dispTN, 0, 0, p.ml.d]);
      estadosProceso.push(["PENDIENTE ⏳"]);
      instruccionesMovimiento.push([instruccion]);
      reporteMovimientos.push([sku, "Procesando..."]);
    });

    // EJECUCIÓN
    console.log(`📦 Procesando ${colaMovimientos.length} movimientos...`);
    for (const mov of colaMovimientos) {
      try {
        await axios.post(`https://rest.contabilium.com/api/inventarios/movimientoInterno`, null, {
          headers: { "Authorization": `Bearer ${tokenContabilium}` },
          params: { idDepositoOrigen: mov.origen, idDepositoDestino: mov.destino, codigo: mov.sku, cantidad: mov.cantidad }
        });
        estadosProceso[mov.indexFila][0] = "PROCESADO ✅";
      } catch (e) {
        estadosProceso[mov.indexFila][0] = "ERROR ❌";
      }
      await delay(1200);
    }

    // ENVÍO FINAL
    await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: { stockCrudo: stockCrudoAntesBalanceo, estadosActualizados: estadosProceso, instrucciones: instruccionesMovimiento, reporteMovimientos }
    });

    console.log("🎉 ¡Finalizado!");

  } catch (error) {
    console.error("CRÍTICO:", error.message);
    process.exit(1);
  }
}

ejecutarOperativoCompleto();