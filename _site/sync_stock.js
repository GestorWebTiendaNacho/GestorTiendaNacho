
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
  console.log("📥 Iniciando descarga de inventario...");
  const listaDepositos = [
    { id: "118831", tag: "cb" }, 
    { id: "119039", tag: "tn" },
    { id: "119040", tag: "ml" }
  ];

  let inventarioMapeado = {};

  for (const depo of listaDepositos) {
    let pagina = 1, hayMas = true;
    while (hayMas) {
      const res = await axios.get(`https://rest.contabilium.com/api/inventarios/getStockByDeposito`, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { id: depo.id, page: pagina, pageSize: 50 }
      });
      const items = res.data.Items || [];
      items.forEach(item => {
        const sku = item.Codigo || "SIN-SKU";
        if (!inventarioMapeado[sku]) {
          inventarioMapeado[sku] = { id: item.IdConcepto || item.Id, sku, cb: { f: 0, r: 0, d: 0 }, tn: { f: 0, r: 0, d: 0 }, ml: { f: 0, r: 0, d: 0 } };
        }
        // Asignamos según el tag
        inventarioMapeado[sku][depo.tag] = {
          f: Math.floor(parseFloat(item.StockActual) || 0),
          r: Math.floor(parseFloat(item.StockReservado) || 0),
          d: Math.floor(parseFloat(item.StockConReservas) || 0)
        };
      });
      if (items.length < 50) hayMas = false; else pagina++;
    }
  }

  // Preparar para Sheet: ID, SKU, Fisico CB, Res CB, Disp CB, Fisico TN, Res TN, Disp TN, Fisico ML, Res ML, Disp ML
  const dataParaSheet = Object.values(inventarioMapeado).map(p => [
    p.id, p.sku, p.cb.f, p.cb.r, p.cb.d, p.tn.f, p.tn.r, p.tn.d, p.ml.f, p.ml.r, p.ml.d
  ]);

  await axios.post(GAS_URL, { action: "guardarInventarioCompleto", data: dataParaSheet });
  console.log("✅ Inventario descargado y enviado a la Sheet.");
  return inventarioMapeado; // Retornamos para usar en la siguiente función
}
async function balancearInventario(inventarioMapeado, token) {
  console.log("⚖️ Iniciando balanceo sobre Stock Físico...");
  const colaMovimientos = [];

  Object.keys(inventarioMapeado).forEach(sku => {
    const p = inventarioMapeado[sku];
    const fisicoCB = p.cb.f;
    const fisicoTN = p.tn.f;

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

  // Ejecución de movimientos
  for (const mov of colaMovimientos) {
    try {
      await axios.post(`https://rest.contabilium.com/api/inventarios/movimientoInterno`, null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { idDepositoOrigen: mov.origen, idDepositoDestino: mov.destino, codigo: mov.sku, cantidad: mov.cantidad }
      });
      console.log(`✅ Movido ${mov.cantidad} de ${mov.sku}`);
    } catch (e) { console.error(`❌ Error en ${mov.sku}: ${e.message}`); }
    await delay(1200);
  }
}