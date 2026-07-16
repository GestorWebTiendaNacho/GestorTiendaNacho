const axios = require('axios');

// Pescamos la URL de la Web App que guardamos en los Secretos de GitHub
const GAS_URL = process.env.GAS_WEBAPP_URL;

async function ejecutarOperativo() {
  try {
    console.log("🚀 Iniciando Operativo Maestro en GitHub Actions...");

    // FASE 1: Obtener Token Activo de Contabilium desde GAS
    console.log("📡 Solicitando Token de Contabilium a Google Sheets...");
    const resToken = await axios.post(GAS_URL, {
      action: "obtenerTokenParaCliente"
    });

    if (resToken.data.status !== "success") {
      throw new Error("No se pudo obtener el token desde GAS: " + JSON.stringify(resToken.data));
    }

    const tokenContabilium = resToken.data.reply;
    console.log("✅ Token de Contabilium recibido con éxito.");

    // FASE 2: Simulación del Procesamiento Pesado
    // (Acá irá la conexión a Contabilium y el filtro de SKUs modificados)
    console.log("⏳ Procesando stock e identificando movimientos nocturnos...");
    
    // Arrays de ejemplo para probar que el puente funcione de punta a punta
    const stockCrudoDummy = [
      ["SKU-001", "Producto A", "10", "5", "15", "", "", "", "", "", "OK"],
      ["SKU-002", "Producto B", "20", "10", "30", "", "", "", "", "", "OK"]
    ];
    
    const reporteMovimientosDummy = [
      ["SKU-001", "5", "15"]
    ];

    // FASE 3: Enviar los resultados finales de vuelta a GAS
    console.log("📤 Enviando datos procesados de vuelta a Google Sheets...");
    const resFinal = await axios.post(GAS_URL, {
      action: "guardarResultadosFinales",
      data: {
        stockCrudo: stockCrudoDummy,
        reporteMovimientos: reporteMovimientosDummy
      }
    });

    console.log("🎉 Respuesta de GAS:", resFinal.data.message || resFinal.data);

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN EL OPERATIVO:", error.message);
    process.exit(1); // Forzamos fallo en GitHub Actions si algo sale mal
  }
}

ejecutarOperativo();