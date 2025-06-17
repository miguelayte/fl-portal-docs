# Este script requiere tener instalado Node.js y Mermaid CLI (mmdc)
# pip install pyyaml
import re
import subprocess
from pathlib import Path

docs_path = Path("docs")
assets_path = docs_path / "assets"
assets_path.mkdir(exist_ok=True)

for md_file in docs_path.rglob("*.md"):
    with md_file.open(encoding="utf-8") as f:
        content = f.read()

    new_content = content
    matches = list(re.finditer(r"```mermaid(.*?)```", content, re.DOTALL))
    for idx, match in enumerate(matches):
        diagram = match.group(1).strip()
        # Genera un nombre de archivo único y descriptivo
        base_name = md_file.stem.replace(" ", "_")
        img_name = f"{base_name}_mermaid_{idx+1}.png"
        mmd_file = assets_path / f"{base_name}_mermaid_{idx+1}.mmd"
        img_file = assets_path / img_name

        # Guarda el diagrama Mermaid en un archivo temporal
        mmd_file.write_text(diagram, encoding="utf-8")
        # Llama a mmdc para generar la imagen
        try:
            result = subprocess.run(
                ["mmdc", "-i", str(mmd_file), "-o", str(img_file)],
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            print(f"Error generando {img_file}:")
            print("STDOUT:", e.stdout)
            print("STDERR:", e.stderr)
            raise

        # Reemplaza el bloque Mermaid por la imagen en el Markdown
        rel_img_path = f"../assets/{img_name}"
        new_content = new_content.replace(match.group(0), f"![Diagrama Mermaid]({rel_img_path})")

    # Sobrescribe el archivo Markdown solo si hubo cambios
    if matches:
        with md_file.open("w", encoding="utf-8") as f:
            f.write(new_content)