### Lista de Mejoras

| **Requerimiento**     | **Descripción**                                        | **Responsable** | **Estado** | **Notas adicionales**                            |
|-----------------------|--------------------------------------------------------|-----------------|------------|--------------------------------------------------|
| Tareas   Previas      | Crear portal de documentación                          | Miguel Ayte     | <span class="estado-completado">Completado</span> |                                                  |
| Análisis   preliminar | Mapeo de   Dependencias                                | Miguel Ayte     | <span class="estado-completado">Completado</span> |                                                  |
|                       | Revisar   las tablas y contabilizarlas                 | Miguel Ayte     | <span class="estado-completado">Completado</span> |                                                  |
|                       | Identificar   mejoras a aplicar                        | Miguel Ayte     | <span class="estado-completado">Completado</span> |                                                  |
| Mejoras   a aplicar   | Crear SP   que devuelva rango de fechas del mes actual | Miguel Ayte     | <span class="estado-completado">Completado</span> | Mejorar   tratamiento de fechas                  |
|                       | Crear   tabla de configuración de reportes de venta    | Miguel Ayte     | <span class="estado-completado">Completado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
|                       | Crear   tabla de canales permitidos de venta           | Miguel Ayte     | <span class="estado-completado">Completado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
| Incluir productos sin clasificación | Reemplazar INNER JOIN por LEFT JOIN entre `producto` y `tb_clasificacion`. | Miguel Ayte     | <span class="estado-completado">Completado</span> | Asegura que los reportes incluyan productos sin clasificación para análisis completos. 
| Retirar tb_xls_proy_24_all de la vista vw_proyecciones_TY| Eliminar referencias a la tabla ya que no es necesaria para la lógica actual de la vista. | Miguel Ayte | <span class="estado-completado">Completado</span> | Validar que no existan dependencias externas. Ejecutar pruebas tras el cambio.
                                   |