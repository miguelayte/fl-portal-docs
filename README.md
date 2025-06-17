# fl-portal-docs


1. Exportar con mmdc (Mermaid CLI)
Instala Node.js si no lo tienes:
Descargar Node.js

Instala Mermaid CLI globalmente:
> npm install -g @mermaid-js/mermaid-cli

2. Enlaza la imagen en tu Markdown
Reemplaza el bloque Mermaid en tu archivo .md por una referencia a la imagen:

> ![Diagrama ER](../assets/diagrama.png)

Luego ejecútalo desde la terminal con:

> python export_mermaid_images.py

Este script buscará en tu carpeta docs los archivos Markdown, generará las imágenes y modificará los archivos .md según lo explicado antes.
No olvides instalar las dependencias necesarias y tener mmdc disponible en tu sistema.
