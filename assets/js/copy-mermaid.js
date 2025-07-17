document.addEventListener('DOMContentLoaded', function() {
    // 1. Configuración inicial de Mermaid
    const mermaidConfig = {
        startOnLoad: false, // Desactivamos el auto-renderizado
        theme: 'default',
        securityLevel: 'loose',
        er: {
            diagramPadding: 20,
            layoutDirection: 'TB'
        },
        flowchart: {
            useMaxWidth: true
        }
    };

    // 2. Inicialización segura de Mermaid
    if (typeof mermaid !== 'undefined') {
        try {
            mermaid.initialize(mermaidConfig);
            initMermaidDiagrams();
        } catch (e) {
            console.error('Error al inicializar Mermaid:', e);
        }
    } else {
        console.error('Mermaid no está cargado correctamente');
    }

    // 3. Función principal para procesar diagramas
    function initMermaidDiagrams() {
        // Seleccionamos todos los contenedores posibles
        const mermaidContainers = document.querySelectorAll(
            'pre.mermaid, .mermaid-container, div.mermaid, [class*="mermaid"]'
        );

        mermaidContainers.forEach(container => {
            // Si ya fue procesado, lo saltamos
            if (container.dataset.mermaidProcessed === 'true') return;

            // Marcamos como procesado para evitar duplicados
            container.dataset.mermaidProcessed = 'true';
            
            try {
                // Obtenemos el código fuente del diagrama
                const codeBlock = container.tagName === 'PRE' ? 
                    container.querySelector('code') || container : 
                    container;
                
                const mermaidCode = codeBlock.textContent.trim();

                // Verificamos que haya código válido
                if (!mermaidCode || mermaidCode.startsWith('Syntax error')) {
                    showMermaidError(container, new Error('Código Mermaid vacío o inválido'));
                    return;
                }

                // Renderizamos el diagrama
                mermaid.mermaidAPI.render(
                    'mermaid-diagram-' + Math.random().toString(36).substr(2, 9),
                    mermaidCode,
                    (svgCode) => {
                        // Reemplazamos el contenido con el SVG renderizado
                        container.innerHTML = svgCode;
                        addMermaidButtons(container, mermaidCode);
                    },
                    (errorContainer) => {
                        // Manejo de errores durante el renderizado
                        showMermaidError(container, new Error('Error al renderizar diagrama'));
                    }
                );
            } catch (error) {
                showMermaidError(container, error);
            }
        });
    }

    // 4. Función para mostrar errores
    function showMermaidError(container, error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        
        // Obtenemos el código fuente del diagrama
        const codeContent = container.textContent.trim();
        const shortError = error.message.split('\n')[0];
        
        errorDiv.innerHTML = `
            <div class="mermaid-error-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#d32f2f">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                Error en el diagrama Mermaid
            </div>
            <div class="mermaid-error-message">${shortError}</div>
            ${codeContent ? `<pre class="mermaid-error-code">${codeContent}</pre>` : ''}
            <button class="mermaid-retry-btn">Reintentar</button>
        `;
        
        // Reemplazamos el contenedor original
        container.replaceWith(errorDiv);
        
        // Añadimos funcionalidad al botón de reintento
        errorDiv.querySelector('.mermaid-retry-btn').addEventListener('click', () => {
            errorDiv.replaceWith(container);
            container.dataset.mermaidProcessed = 'false';
            initMermaidDiagrams();
        });
    }

    // 5. Función para añadir botones a diagramas válidos
    function addMermaidButtons(container, originalCode) {
        // Creamos el contenedor de botones
        const btnContainer = document.createElement('div');
        btnContainer.className = 'mermaid-btn-container';
        
        // Botón de Copiar
        const copyBtn = createButton(
            'Copiar', 
            'copy-mermaid-btn', 
            '#1976d2', 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
        );
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(originalCode);
                showButtonFeedback(copyBtn, '¡Copiado!', '#388e3c');
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
        
        // Botón de Descargar
        const downloadBtn = createButton(
            'Descargar', 
            'download-mermaid-btn', 
            '#7b1fa2', 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
        );
        
        downloadBtn.addEventListener('click', () => {
            const svg = container.querySelector('svg');
            if (svg) {
                downloadSVG(svg, 'diagrama-mermaid');
                showButtonFeedback(downloadBtn, '¡Descargado!', '#388e3c');
            }
        });
        
        // Botón de Ver
        const viewBtn = createButton(
            'Ver', 
            'view-mermaid-btn', 
            '#d32f2f', 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        );
        
        viewBtn.addEventListener('click', () => {
            const svg = container.querySelector('svg');
            if (svg) {
                openSVGInNewWindow(svg);
                showButtonFeedback(viewBtn, '¡Abierto!', '#388e3c');
            }
        });
        
        // Añadimos los botones al contenedor
        btnContainer.appendChild(copyBtn);
        btnContainer.appendChild(downloadBtn);
        btnContainer.appendChild(viewBtn);
        
        // Insertamos los botones en el diagrama
        container.style.position = 'relative';
        container.insertBefore(btnContainer, container.firstChild);
    }

    // 6. Funciones auxiliares
    function createButton(text, className, color, icon) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.innerHTML = `${icon}${text}`;
        btn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            margin: 0 3px;
            border: none;
            border-radius: 4px;
            background: ${color};
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        return btn;
    }

    function showButtonFeedback(btn, text, color) {
        const originalHTML = btn.innerHTML;
        const originalColor = btn.style.background;
        
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>${text}`;
        btn.style.background = color;
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = originalColor;
        }, 2000);
    }

    function downloadSVG(svgElement, filename) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgElement);
        
        // Convertir SVG a canvas y luego a PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const pngData = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${filename}.png`;
            downloadLink.href = pngData;
            downloadLink.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    }

    function openSVGInNewWindow(svgElement) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgElement);
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Diagrama Mermaid</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        background-color: #f5f5f5; 
                    }
                    .diagram-container { 
                        max-width: 90vw; 
                        max-height: 90vh; 
                        overflow: auto; 
                        background: white; 
                        padding: 20px; 
                        box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                    }
                    svg { 
                        display: block; 
                        max-width: 100%; 
                    }
                </style>
            </head>
            <body>
                <div class="diagram-container">
                    ${svgStr}
                </div>
            </body>
            </html>
        `);
        newWindow.document.close();
    }

    // 7. Observador de mutaciones para contenido dinámico
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                initMermaidDiagrams();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 8. Inicialización final
    initMermaidDiagrams();
});