
async function navegar(pagina) {
  const content = document.getElementById('content');
  if (!content) return;

  content.style.opacity = '0.5'; 

  try {
    // IMPORTANTE: Ahora buscamos el archivo .html en tu carpeta de GitHub
    const response = await fetch(`./${pagina}.html`);
    if (!response.ok) throw new Error('Página no encontrada');
    
    const html = await response.text();
    
    content.innerHTML = html;
    content.style.opacity = '1';
    
    // Si aún necesitas ejecutar scripts internos, mantienes la función
    ejecutarScriptsInyectados(content);
    
  } catch (error) {
    console.error('Error al navegar:', error);
    content.innerHTML = '<p>Error al cargar la página.</p>';
    content.style.opacity = '1';
  }
}

function ejecutarScriptsInyectados(contenedor) {
  if (!contenedor) return;
  const scripts = contenedor.querySelectorAll("script");
  
  scripts.forEach(oldScript => {
    try {
      const newScript = document.createElement("script");
      
      // Copiar atributos
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      document.body.appendChild(newScript);
      
      oldScript.parentNode.removeChild(oldScript);
    } catch (e) {
      console.warn("Error silenciado en inyección:", e);
    }
  });
}
