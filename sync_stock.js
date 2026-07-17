
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

ejecutarOperativoCompleto();

async function descargarInventario(token) {
  console.log("📥 Iniciando descarga masiva de inventario...");
  const listaDepositos = [
    { id: "118831", tag: "cb" }, 
    { id: "119039", tag: "tn" },
    { id: "119040", tag: "ml" }
  ];

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
          if (!inventarioMapeado[sku]) {
            inventarioMapeado[sku] = { id: item.IdConcepto || item.Id, sku, cb: { f: 0 }, tn: { f: 0 }, ml: { f: 0 } };
          }
          inventarioMapeado[sku][depo.tag].f = Math.floor(parseFloat(item.StockActual) || 0);
        });

        if (items.length < 50) hayMas = false; else pagina++;
        
        // PAUSA DE SEGURIDAD ENTRE PÁGINAS
        await delay(1500); 

      } catch (err) {
        if (err.response && err.response.status === 429) {
          const segundosEspera = (err.response.data?.retry_after || 30);
          console.warn(`⚠️ Límite excedido (429). Esperando ${segundosEspera} segundos...`);
          await delay(segundosEspera * 1000);
          // Reintentamos esta misma página sin avanzar
          continue; 
        } else {
          console.error(`❌ Error fatal en depo ${depo.id}:`, err.message);
          hayMas = false;
        }
      }
    }
  }
  return inventarioMapeado;
}
async function balancearInventario(inventarioMapeado, token) {
  console.log("⚖️ Iniciando balanceo sobre Stock Físico...");
  const colaMovimientos = [];

  Object.keys(inventarioMapeado).forEach(sku => {
    const p = inventarioMapeado[sku];
    const fisicoCB = p.cb.f;
    const fisicoTN = p.tn.f;

    // LOG FORENSE: Ver qué números está procesando realmente
    if (Math.abs(fisicoCB - fisicoTN) > 0) {
       console.log(`[DEBUG] SKU: ${sku} | CB: ${fisicoCB} | TN: ${fisicoTN} | DIF: ${fisicoCB - fisicoTN}`);
    }

    if ((fisicoCB + fisicoTN) <= 1) return;

    const diferencia = fisicoCB - fisicoTN;
    const cantidadAMover = Math.floor(Math.abs(diferencia) / 2);

    if (cantidadAMover > 0) {
      colaMovimientos.push({
        sku,
        origen: (diferencia > 0) ? "118831" : "119039",
        destino: (diferencia > 0) ? "119039" : "118831",
        cantidad: cantidadAMover
      });
    }
  });

  if (colaMovimientos.length === 0) {
    console.log("⚠️ No se encontraron discrepancias de stock físico (CB vs TN).");
  }

  for (const mov of colaMovimientos) {
    try {
      console.log(`🚀 Ejecutando: Mover ${mov.cantidad} de ${mov.sku} (Orig: ${mov.origen} -> Dest: ${mov.destino})`);
      await axios.post(`https://rest.contabilium.com/api/inventarios/movimientoInterno`, null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { idDepositoOrigen: mov.origen, idDepositoDestino: mov.destino, codigo: mov.sku, cantidad: mov.cantidad }
      });
    } catch (e) { console.error(`❌ Error en ${mov.sku}: ${e.response?.data || e.message}`); }
    await delay(1200);
  }
}