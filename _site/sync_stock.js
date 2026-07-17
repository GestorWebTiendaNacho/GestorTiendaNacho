
const axios = require('axios'); 

const GAS_URL = process.env.GAS_WEBAPP_URL; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function ejecutarOperativoCompleto() {
  try {
    const resToken = await axios.post(GAS_URL, { action: "obtenerTokenParaCliente" });
    const token = resToken.data.reply;

    // 1. Descargar y actualizar la hoja
    const inventario = await descargarInventario(token);
    
    // 2. Balancear usando los datos recién obtenidos
    await balancearInventario(inventario, token);

    console.log("🎉 Operativo completo finalizado.");
  } catch (err) {
    console.error("CRÍTICO:", err.message);
  }
}


async function descargarInventario(token) {
  const listaDepositos = [{ id: "118831", tag: "cb" }, { id: "119039", tag: "tn" }, { id: "119040", tag: "ml" }];
  let inventarioMapeado = {};

  for (const depo of listaDepositos) {
    let pagina = 1, hayMas = true;
    while (hayMas) {
      try {
        const res = await axios.get(`https://rest.contabilium.com/api/inventarios/getStockByDeposito`, {
          headers: { "Authorization": `Bearer ${token}` },
          params: { id: depo.id, page: pagina, pageSize: 50 }
        });
        const items = res.data.Items || [];
        items.forEach(item => {
          const sku = item.Codigo || "SIN-SKU";
          if (!inventarioMapeado[sku]) inventarioMapeado[sku] = { id: item.IdConcepto || item.Id, sku, cb: { f: 0 }, tn: { f: 0 }, ml: { f: 0 } };
          inventarioMapeado[sku][depo.tag].f = Math.floor(parseFloat(item.StockActual) || 0);
        });
        if (items.length < 50) hayMas = false; else pagina++;
        await delay(1000);
      } catch (err) { /* Manejo de 429 simplificado */ await delay(5000); }
    }
  }

  // Preparamos para 'stockCrudo' (11 columnas)
  const dataParaSheet = Object.values(inventarioMapeado).map(p => [
    p.id, p.sku, p.cb.f, 0, p.cb.f, p.tn.f, 0, p.tn.f, p.ml.f, 0, p.ml.f
  ]);

  // Enviamos al GAS para que la hoja tenga los datos actuales
  await axios.post(GAS_URL, { 
    action: "guardarResultadosFinales", 
    data: { stockCrudo: dataParaSheet, estadosActualizados: [], instrucciones: [], reporteMovimientos: [] } 
  });
  
  return inventarioMapeado;
}

// 2. BALANCEO Y REPORTE FINAL
async function balancearInventario(inventarioMapeado, token) {
  const colaMovimientos = [];
  const resultadosFinales = { stockCrudo: [], 
    estadosActualizados: [], 
    instrucciones: [], 
    reporteMovimientos: [], 
    countProcesados: 0, 
    countFaltantes: 0  
  };

  Object.keys(inventarioMapeado).forEach(sku => {
    const p = inventarioMapeado[sku];
    const diff = p.cb.f - p.tn.f;
    const cant = Math.floor(Math.abs(diff) / 2);

    resultadosFinales.stockCrudo.push([p.id, p.sku, p.cb.f, 0, p.cb.f, p.tn.f, 0, p.tn.f, p.ml.f, 0, p.ml.f]);

    if (cant > 0 && (p.cb.f + p.tn.f) > 1) {
      colaMovimientos.push({ sku, origen: diff > 0 ? "118831" : "119039", destino: diff > 0 ? "119039" : "118831", cantidad: cant, index: colaMovimientos.length });
      resultadosFinales.estadosActualizados.push(["MODIFICADO"]);
      resultadosFinales.instrucciones.push([`Mover ${cant} de ${diff > 0 ? "CB a TN" : "TN a CB"}`]);
      
      const nuevoCB = diff > 0 ? (p.cb.f - cant) : (p.cb.f + cant);
      const nuevoTN = diff > 0 ? (p.tn.f + cant) : (p.tn.f - cant);
      resultadosFinales.reporteMovimientos.push([p.sku, nuevoCB, nuevoTN]);
    } else {
      resultadosFinales.estadosActualizados.push(["OK"]);
      resultadosFinales.instrucciones.push([""]);
      resultadosFinales.reporteMovimientos.push([p.sku, p.cb.f, p.tn.f]);
      resultadosFinales.countProcesados++;
    }
  });

  for (const mov of colaMovimientos) {
    try {
      await axios.post(`https://rest.contabilium.com/api/inventarios/movimientoInterno`, null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { idDepositoOrigen: mov.origen, idDepositoDestino: mov.destino, codigo: mov.sku, cantidad: mov.cantidad }
      });
    } catch (e) { resultadosFinales.estadosActualizados[mov.index] = ["ERROR"]; }
    await delay(1200);
  }

    await axios.post(GAS_URL, { action: "guardarResultadosFinales", data: resultadosFinales });
}

ejecutarOperativoCompleto();