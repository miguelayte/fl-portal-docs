(function () {
  // Cargar pako si no está presente
  function loadPako(callback) {
    if (window.pako) {
      callback();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  function encodeMermaid(code) {
    var data = new TextEncoder().encode(code);
    var compressed = window.pako.deflate(data, { level: 9 });
    var binary = '';
    compressed.forEach(function (b) { binary += String.fromCharCode(b); });
    var base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return base64;
  }

  function addButtons() {
    // Busca todos los bloques <pre><code class="language-mermaid">
    document.querySelectorAll('pre code.language-mermaid').forEach(function (block) {
      var pre = block.parentElement;
      // Evita duplicar botones
      if (pre.previousSibling && pre.previousSibling.classList && pre.previousSibling.classList.contains('mermaid-live-btn')) return;

      var btn = document.createElement('button');
      btn.innerText = 'Abrir en Mermaid Live Editor';
      btn.className = 'md-button mermaid-live-btn';
      btn.style.margin = '8px 0';
      btn.onclick = function () {
        var code = block.innerText;
        var encoded = encodeMermaid(code);
        var url = 'https://mermaid.live/edit#pako:' + encoded;
        window.open(url, '_blank');
      };
      pre.parentElement.insertBefore(btn, pre);
    });

    // Si Mermaid ya reemplazó el bloque por un SVG, busca el SVG y el código fuente oculto
    document.querySelectorAll('.mermaid').forEach(function (svg) {
      // Busca el bloque de código anterior (fuente original)
      var pre = svg.previousElementSibling;
      if (!pre || !pre.classList.contains('mermaid-live-btn')) {
        var codeBlock = null;
        // Busca el bloque de código fuente en los hermanos anteriores
        var prev = svg.previousElementSibling;
        while (prev) {
          if (prev.tagName === 'PRE' && prev.querySelector('code.language-mermaid')) {
            codeBlock = prev.querySelector('code.language-mermaid');
            break;
          }
          prev = prev.previousElementSibling;
        }
        if (codeBlock && (!svg.previousSibling || !svg.previousSibling.classList || !svg.previousSibling.classList.contains('mermaid-live-btn'))) {
          var btn2 = document.createElement('button');
          btn2.innerText = 'Abrir en Mermaid Live Editor';
          btn2.className = 'md-button mermaid-live-btn';
          btn2.style.margin = '8px 0';
          btn2.onclick = function () {
            var code = codeBlock.innerText;
            var encoded = encodeMermaid(code);
            var url = 'https://mermaid.live/edit#pako:' + encoded;
            window.open(url, '_blank');
          };
          svg.parentElement.insertBefore(btn2, svg);
        }
      }
    });
  }

  function init() {
    loadPako(function () {
      // Espera un poco para asegurar que Mermaid haya renderizado
      setTimeout(addButtons, 500);
    });
  }

  // Ejecutar en carga y tras navegación (para MkDocs Material)
  document.addEventListener('DOMContentLoaded', init);
  if (window.document$) {
    window.document$.subscribe(init);
  }
})();