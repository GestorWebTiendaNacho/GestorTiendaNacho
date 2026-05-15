const URL_GAS_GLOBAL = "https://script.google.com/macros/s/AKfycbwbQwa7d-hOGJTxZJAk83TrC0cFy7Pede-qKbVfIqAffy4uBKOEq59fYf5Q1bkVklE/exec";

async function callGoogleScript(accion, datos = {}) {
    console.log(`[API] Llamando a: ${accion}`, datos);
    
    try {
        // Usamos la técnica de redirección para poder leer la respuesta en GitHub
        const response = await fetch(URL_GAS_GLOBAL, {
            method: 'POST',
            mode: 'cors', // Cambiamos a cors para poder procesar el JSON de vuelta
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: accion,
                payload: datos
            })
        });

        if (!response.ok) throw new Error('Error en la red');
        
        return await response.json();
    } catch (error) {
        console.error("Error en callGoogleScript:", error);
        throw error;
    }
}