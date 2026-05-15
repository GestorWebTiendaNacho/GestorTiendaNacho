(function() {
    if (window.mainJsCargado) {
        console.log("⚓ main.js ya está operativo.");
        return;
    }
    window.mainJsCargado = true;

    const URL_GAS_GLOBAL = "https://script.google.com/macros/s/AKfycbwddi7u-GNrb6rVCObpU8xXGNCvETjy6lGnvhlQBBmo6lUu1-J6OiYAYDAgcErq6kg/exec";

    /**
     * Función global para comunicarse con Google Apps Script
     * @param {string} accion - El nombre de la acción a ejecutar (sync_stock, get_progress, etc)
     * @param {object} datos - Los parámetros necesarios para la acción
     */
    window.callGoogleScript = async function(accion, datos = {}) {
        console.log(`%c[API] Solicitando: ${accion}`, 'color: #c2902e; font-weight: bold;', datos);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 60 segundos de espera

        try {
            const response = await fetch(URL_GAS_GLOBAL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: accion,
                    payload: datos
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const resultado = await response.json();
            
            // Log de éxito discreto
            console.log(`%c[API] Respuesta de ${accion} recibida`, 'color: #00ff9d;');
            return resultado;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error(`%c[API] Tiempo de espera agotado para: ${accion}`, 'color: #ff3131;');
                throw new Error("La conexión con el servidor tardó demasiado tiempo.");
            }

            console.error(`%c[API] Error en callGoogleScript (${accion}):`, 'color: #ff3131;', error);
            throw error;
        }
    };

    window.formatearNumero = function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    console.log("✅ Motor de API (main.js) inicializado correctamente.");
})();