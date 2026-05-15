
(function() {
    // Evitamos doble carga del enrutador
    if (window.jsHomeCargado) return;
    window.jsHomeCargado = true;


    const getBasePath = () => {
        const path = window.location.pathname;
        if (path.includes('GestorTiendaNacho')) return '/GestorTiendaNacho/';
        return '/';
    };


    window.navegar = async function(pagina) {
        const content = document.getElementById('content');
        if (!content) return;

        // Efecto visual de transición
        content.style.transition = 'opacity 0.2s ease';
        content.style.opacity = '0'; 

        try {

            const url = `${getBasePath()}pages/${pagina}.html?t=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Fallo al cargar ${url}`);
            
            const html = await response.text();
            
            // Inyectamos el HTML
            content.innerHTML = html;
            
            // Ejecutamos la lógica de scripts
            await ejecutarScriptsInyectados(content);
            
            content.style.opacity = '1';

        } catch (error) {
            console.error('❌ Error de navegación:', error);
            content.innerHTML = `
                <div class="text-center p-10">
                    <h2 class="text-red-500 font-bold">ERROR 404</h2>
                    <p class="text-slate-400">No se pudo encontrar la sección: ${pagina}</p>
                    <a href="${getBasePath()}" class="text-gold underline mt-4 block">Volver al inicio</a>
                </div>`;
            content.style.opacity = '1';
        }
    };

    /* Motor de inyección de scripts con soporte para carga asíncrona */
    async function ejecutarScriptsInyectados(contenedor) {
        const scripts = Array.from(contenedor.querySelectorAll("script"));
        
        // Eliminamos scripts previos inyectados en el body para evitar colisiones
        document.querySelectorAll(".script-inyectado").forEach(s => s.remove());

        for (const oldScript of scripts) {
            await new Promise((resolve) => {
                const newScript = document.createElement("script");
                newScript.className = "script-inyectado"; // Marca para limpieza futura

                // Copiamos atributos (src, type, etc.)
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });

                // Si el script tiene contenido interno
                if (oldScript.textContent) {
                    newScript.textContent = oldScript.textContent;
                }

                // Si es un script externo (tiene src), esperamos a que cargue
                if (newScript.src) {
                    newScript.onload = () => resolve();
                    newScript.onerror = () => {
                        console.warn(`⚠️ No se pudo cargar: ${newScript.src}`);
                        resolve();
                    };
                } else {
                    // Si es inline, se ejecuta al instante
                    resolve();
                }

                document.body.appendChild(newScript);
                oldScript.remove(); // Quitamos el original del contenedor
            });
        }
    }

    console.log("🚀 Enrutador dinámico (jsHome.js) listo.");
})();
