# Documentación del Proyecto de Mejora ETL

Este índice facilita la navegación a través de la documentación del proyecto de optimización del proceso ETL del SP "sp_compras".

---

## 📂 Archivos del Proyecto

* [**Proyecto de Mejora: Optimización del Proceso ETL "sp_compras"**](Proyecto_Mejora_ETL_sp_compras.md)
    * Objetivo del proyecto
    * Situación actual (problema, hallazgos clave)
    * Situación propuesta (acciones, nuevo SP)
    * Impacto en los OKR

---

## 🔍 Detalles Técnicos

* [**`sp_compras.sql`**](./documentos-tecnicos/sp_compras.md)
    * Código fuente original del stored procedure `sp_compras`.
* [**`descripcion.md`**](descripcion.md)
    * Descripción detallada del problema, historial de ejecución del job y hallazgos de la exploración de datos.
* [**`usp_etl_cargar_proveedores_modelos.sql`**](./documentos-tecnicos/usp_etl_cargar_proveedores_modelos.md)
    * Código fuente del nuevo stored procedure propuesto para cargar proveedores y modelos.

---

## 📈 Herramientas y Consultas

* [**Consulta de Historial de Ejecución de Job**](descripcion.md#consulta-para-determinar-historial-de-ejecución-del-paso-n-de-un-job)
    * SQL para monitorear la duración de los pasos de un job.

---