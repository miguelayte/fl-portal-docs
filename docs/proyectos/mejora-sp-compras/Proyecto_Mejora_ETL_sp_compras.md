# Proyecto de Mejora: Optimización del Proceso ETL "sp\_compras" 🚀

## Objetivo

El objetivo principal de este proyecto es **optimizar el tiempo de ejecución** del paso 7 (`step_jo_dwh_compras`) del job "0200\_job\_jo\_dwh\_comercial", reduciéndolo de un promedio de más de 1 hora a un tiempo significativamente menor, liberando recursos y mejorando la eficiencia general del Data Warehouse.

## Situación Actual 📉

Actualmente, el proceso ETL implementado en el `sp_compras` es responsable de cargar y transformar datos relacionados con compras. La ejecución de este stored procedure como parte del job "0200\_job\_jo\_dwh\_comercial" está tomando consistentemente **más de 1 hora** en completarse, como se observa en el historial de ejecución.

### Hallazgos Clave:

  * **Rendimiento Deficiente**: El paso `step_jo_dwh_compras` tiene una duración promedio de más de 1 hora, lo que representa un cuello de botella en el proceso diario del Data Warehouse.
  * **Tablas Destino en Desuso / Vacías**:
      * `dbo.GUIA`: Su última fecha de registro (`20240104`) indica que no ha sido actualizada en un tiempo considerable, sugiriendo que está en desuso.
      * `dbo.OC`: Su última fecha de emisión (`20241223`) también la marca como potencialmente en desuso.
      * `dbo.PRECOMPRA`: Esta tabla está **completamente vacía**, lo que sugiere que su proceso de carga no está funcionando o que ha sido descontinuada.
  * **Redundancia de `productos_compra`**: La tabla `dbo.productos_compra` es idéntica en estructura y contenido a `dbo.producto`. Esto implica una duplicación innecesaria de datos y un paso de ETL que no agrega valor.
  * **Proceso Redundante de Carga**: Las tablas `dbo.GUIA`, `dbo.OC`, y `dbo.PRECOMPRA` son pobladas actualmente por el `sp_compras`, pero también se ha identificado que son alimentadas por una integración con **SAP B1**. Esto indica una **duplicidad en los procesos de carga**, donde el `sp_compras` podría estar realizando un trabajo innecesario o desactualizado para estas entidades.
  * **Tablas Vigentes**: `dbo.modeloC` y `dbo.proveedorC` están activas y contienen datos recientes (`MAX(fechaingreso)` para `proveedorC` es `20250715`), lo que confirma su relevancia y correcto funcionamiento.

-----

## Situación Propuesta ✨

Se propone refactorizar el proceso ETL para el módulo de compras, eliminando las operaciones redundantes y desactualizadas, y centralizando la carga de datos en un nuevo procedimiento almacenado (`usp_etl_cargar_proveedores_modelos`) que se enfocará solo en las entidades vigentes y necesarias para el Data Warehouse (`dbo.proveedorC` y `dbo.modeloC`).

### Acciones Propuestas:

1.  **Creación de `usp_etl_cargar_proveedores_modelos`**:
      * Este nuevo SP se encargará exclusivamente de la extracción y consolidación de información de **proveedores y modelos** desde el servidor vinculado `SERVNPROD`.
      * Eliminará y recreará las tablas locales `dbo.proveedorC` y `dbo.modeloC` con los datos más recientes.
      * 2.  **Modificación del Job "0200\_job\_jo\_dwh\_comercial"**:
      * Se **eliminará la ejecución del `sp_compras`** del paso 7 del job "0200\_job\_jo\_dwh\_comercial".
      * Se **sustituirá** esta ejecución por la llamada al nuevo `usp_etl_cargar_proveedores_modelos`.
2.  **Depuración de `sp_compras`**:
      * El `sp_compras` será revisado para **eliminar las secciones de código** que cargan o manipulan las tablas `dbo.GUIA`, `dbo.OC`, `dbo.PRECOMPRA`, y `dbo.productos_compra`.
      * Considerar la **eliminación definitiva de `dbo.productos_compra`** si no se encuentra un uso distinto al de ser una copia de `dbo.producto`.
      * Validar la integración de **SAP B1** para asegurar que las tablas `dbo.GUIA`, `dbo.OC`, y `dbo.PRECOMPRA` se estén poblando correctamente y que no haya dependencias ocultas del `sp_compras`.
3.  **Monitoreo y Validación**:
      * Monitorear la duración del paso 7 del job después de la implementación para **verificar la reducción del tiempo de ejecución**.
      * Validar la integridad y actualidad de los datos en `dbo.proveedorC` y `dbo.modeloC`.

-----

## Impacto en los OKR 🎯

Esta mejora tendrá un impacto directo y positivo en los siguientes Objetivos y Resultados Clave (OKR):

  * **Objetivo**: **Mejorar la Eficiencia Operacional del Data Warehouse.**
      * **Resultado Clave (KR1)**: Reducir el tiempo de ejecución del job "0200\_job\_jo\_dwh\_comercial" en al menos un 50% para el `step_jo_dwh_compras` (paso 7). Actualmente, el tiempo promedio es de 1 hora; el objetivo es reducirlo a 7 segundos o menos.
      * **Resultado Clave (KR2)**: Disminuir el consumo de recursos (CPU, I/O) asociados a la ejecución del proceso ETL de compras en más del 90%. Esto se logrará al eliminar operaciones redundantes y el procesamiento de tablas en desuso.
  * **Objetivo**: **Asegurar la Confiabilidad y Calidad de los Datos del Data Warehouse.**
      * **Resultado Clave (KR1)**: Garantizar que las tablas `dbo.proveedorC` y `dbo.modeloC` se actualicen diariamente con la información más reciente y precisa de `SERVNPROD`.
      * **Resultado Clave (KR2)**: Eliminar la redundancia de datos y procesos, mejorando la consistencia y reduciendo el riesgo de errores en el pipeline de datos.
  * **Objetivo**: **Optimizar la Utilización de la Infraestructura de Base de Datos.**
      * **Resultado Clave (KR1)**: Liberar capacidad de procesamiento en el servidor de base de datos al reducir la carga de trabajo del proceso ETL de compras, permitiendo que otros procesos o consultas se ejecuten de manera más eficiente.
      * **Resultado Clave (KR2)**: Reducir el espacio de almacenamiento innecesario si se elimina la tabla `dbo.productos_compra`.

-----
