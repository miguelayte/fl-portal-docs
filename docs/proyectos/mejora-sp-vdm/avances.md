### Lista de Mejoras

| **Requerimiento**     | **Descripción**                                        | **Responsable** | **Estado** | **Notas adicionales**                            |
|-----------------------|--------------------------------------------------------|-----------------|------------|--------------------------------------------------|
| Tareas   Previas      | Crear portal de documentación                          | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> |                                                  |
| Análisis   preliminar | Mapeo de   Dependencias                                | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> |                                                  |
|                       | Revisar   las tablas y contabilizarlas                 | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> |                                                  |
|                       | Identificar   mejoras a aplicar                        | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> |                                                  |
| Mejoras   a aplicar   | Crear SP   que devuelva rango de fechas del mes actual | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> | Mejorar   tratamiento de fechas                  |
|                       | Crear   tabla de configuración de reportes de venta    | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
|                       | Crear   tabla de canales permitidos de venta           | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
| Incluir productos sin clasificación | Reemplazar INNER JOIN por LEFT JOIN entre `producto` y `tb_clasificacion`. | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> | Asegura que los reportes incluyan productos sin clasificación para análisis completos. 
| Retirar tb_xls_proy_24_all de la vista vw_proyecciones_TY| Eliminar referencias a la tabla ya que no es necesaria para la lógica actual de la vista. | **TI** (Miguel Ayte) | <span class="estado-completado">Completado</span> | Validar que no existan dependencias externas. Ejecutar pruebas tras el cambio.
                                   |
| Captura de Datos | Corregir interfaz de usuario en SIP para carga de supervisores | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |
| Captura de Datos | Mejorar interfaz de usuario en SIP para actualización de proyecciones | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |
| Captura de Datos | Mejorar interfaz de creación de nuevas tiendas | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |


??? info "Corregir interfaz de usuario en SIP para carga de supervisores"
    ### NOTAS PREVIAS:
    1. En el SIP existe una interfaz de actualización de asignación de tiendas a un supervisor (Unitario), pero no afecta a las tablas de supervisores del DWH
    2. En el SIP existe una interfaz de actualización de redistribución de tiendas a supervisores (Masivo), pero al parecer no funciona. No muestra error, pero tampoco afecta a las tablas esperadas en DWH
    ### REQUERIMIENTO
    1. Debe actualizar las tablas de BD_PASSARELA: "supervisores"
    2. Debe actualizar las tablas de PASSARELADWH: "supervisores", "supervisores_unicos","dz_supervisores","dz_accesos"

??? info "Mejorar interfaz de usuario en SIP para actualización de proyecciones"
    ### NOTAS PREVIAS:
    1. Se tiene interfaz de carga en el SIP
    2. El usuario registra monto de venta mímina como decimal muy pequeño tendiente a cero.
    ### REQUERIMIENTO:
    1. Corregir que afecte a temp_comparables de PASSARELADWH
    2. Corregir que afecte a columna "idfecha" por fecha equivalente del mismo mes del año base en PASSARELADWH
    3. Los montos de cuota deben ser cero para tiendas que no se espera ventas en fecha (instrucción al usuario) en PASSARELADWH

??? info "Mejorar interfaz de creación de nuevas tiendas"
    ### NOTAS PREVIAS:
    1. La creación de nuevas tiendas actualmente se ejecuta en SC
    2. La actualización se hace actualmente en el SIP pero no afecta a PASSARELADWH
    ### REQUERIMIENTO:
    1. La creación debe afectar también a la tabla "tiendas" en PASSARELADWH


