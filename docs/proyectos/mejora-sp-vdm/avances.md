### Requerimientos Funcionales

|**ID**| **Requerimiento**     | **Descripción**                                        | **Responsable** | **Estado** | **Notas adicionales**                            |
|----|-----------------------|--------------------------------------------------------|-----------------|------------|--------------------------------------------------|
|RF001| Tareas   Previas      | Crear portal de documentación                          | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> |                                                  |
|RF002| Análisis   preliminar | Mapeo de   Dependencias                                | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> |                                                  |
|RF003| Análisis   preliminar | Revisar   las tablas y contabilizarlas                 | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> |                                                  |
|RF004| Análisis   preliminar | Identificar   mejoras a aplicar                        | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> |                                                  |
|RF005| Mejoras   a aplicar   | Crear SP   que devuelva rango de fechas del mes actual | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> | Mejorar   tratamiento de fechas                  |
|RF006|                       | Crear   tabla de configuración de reportes de venta    | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
|RF007|                       | Crear   tabla de canales permitidos de venta           | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> | Evitar   el uso de valores "en duro" (hardcoded) |
|RF008| Incluir productos sin clasificación en vista `vw_Producto` | Reemplazar INNER JOIN por LEFT JOIN entre `producto` y `tb_clasificacion`. | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> | Asegura que los reportes incluyan productos sin clasificación para análisis completos. 
|RF009| Retirar `tb_xls_proy_24_all` de la vista `vw_proyecciones_TY`| Eliminar referencias a la tabla ya que no es necesaria para la lógica actual de la vista. | **TI** (Miguel Ayte) | <span class="estado-desarrollado">Desarrollado</span> | Validar que no existan dependencias externas. Ejecutar pruebas tras el cambio.|
|RF010| Captura de Datos | Corregir interfaz de usuario en SIP para carga de supervisores | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |
|RF011| Captura de Datos | Mejorar interfaz de usuario en SIP para actualización de proyecciones | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |
|RF012| Captura de Datos | Mejorar interfaz de creación de nuevas tiendas | **TI** (Daniela Renteria) | <span class="estado-pendiente">Pendiente</span> | Ver detalle |


??? info "RF010 Corregir interfaz de usuario en SIP para carga de supervisores"
    ### NOTAS PREVIAS:
    1. En `BD_PASSARELA` existen las tablas: `Tb_Supervisor` y `Supervisor`
    1. En el SIP existe una interfaz de actualización de asignación de tiendas a un supervisor (Unitario), pero no afecta a las tablas de supervisores del DWH
    2. En el SIP existe una interfaz de actualización de redistribución de tiendas a supervisores (Masivo), pero le falta validar la información cargada por plantilla contra una tabla maestra de supervisores.
    ### REQUERIMIENTO
    1. En `BD_PASSARELA`: Debe Implementarse una tabla de Maestra de Supervisores (Pueden utilizar la existente `Tb_Supervisor`)
    2. Evaluar la creación de una interfaz de usuario para el mantenimiento de `Tb_Supervisor` o de su afectación desde los sistemas de gestión del personal que maneja **GGHH**.
    3. Ambas interfaces de asignación de tiendas a supervisores:
       3.1 Deben incluir validación contra la tabla `Tb_Supervisor`
       3.2 Deben actualizar las tablas de `BD_PASSARELA`: `supervisor`
       3.3 Debe actualizar las tablas de `PASSARELADWH`: `supervisor`, `supervisor_unicos`, `dz_supervisor`, `dz_accesos`
    4. Evaluar la desactivación de la interfaz de usuario de asignación de tiendas a un supervisor (Unitario)

??? info "RF011 Mejorar interfaz de usuario en SIP para actualización de proyecciones"
    ### NOTAS PREVIAS:
    1. Se tiene interfaz de carga en el SIP
    2. El usuario registra monto de venta mímina como decimal muy pequeño tendiente a cero.
    3. `temp_comparables` es una tabla de `PASSARELADWH` que contiene los días comparables del mes actual
    ### REQUERIMIENTO:
    1. Corregir que afecte a `temp_comparables` de `PASSARELADWH`
    2. Corregir que afecte a columna `idfecha` por fecha equivalente del mismo mes del año base en `PASSARELADWH`
    3. Los montos de cuota deben ser cero para tiendas que no se espera ventas en fecha (instrucción al usuario) en `PASSARELADWH`

??? info "RF011 Mejorar interfaz de creación de nuevas tiendas"
    ### NOTAS PREVIAS:
    1. La creación de nuevas tiendas actualmente se ejecuta en SC
    2. La actualización se hace actualmente en el SIP pero no afecta a `PASSARELADWH`
    ### REQUERIMIENTO:
    1. La creación debe afectar también a la tabla `tiendas` en `PASSARELADWH`


