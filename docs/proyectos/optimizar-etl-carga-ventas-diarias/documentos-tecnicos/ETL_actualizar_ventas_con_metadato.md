# Diagramas y Documentación para el Procedimiento Almacenado de Ventas

## 1. Diagrama de Flujo de Datos (DFD) en Mermaid

```mermaid
flowchart TD
    A[Inicio] --> B[Obtener Parámetros Configurables]
    B --> C{Parámetros válidos?}
    C -->|No| D[Error: Parámetros no configurados]
    C -->|Sí| E[Establecer Fechas de Proceso]
    E --> F[Eliminar Datos Existentes del Día]
    F --> G[Insertar Datos de Tipo Venta y Medio Pago]
    G --> H[Actualizar Metadatos con Hash]
    H --> I[Actualizar Ventas Existentes]
    I --> J[Insertar Nuevas Ventas]
    J --> K[Eliminar Ventas Inexistentes]
    K --> L[Procesar Detalles de Ventas]
    L --> M[Resetear Banderas de Actualización]
    M --> N[Registrar Ejecución Exitosa]
    D --> O[Registrar Error]
    O --> P[Fin con Error]
    N --> Q[Fin Exitoso]
```

### Explicación del DFD:

Este diagrama representa el flujo secuencial del procedimiento almacenado `usp_actualizar_ventas_con_meta`. El proceso:

1. **Inicia** obteniendo parámetros configurables de la tabla `tb_ParametrosGeneralesVentas`, que determinan el comportamiento del proceso (días de recovery, meses de actualización, campos para hash).

2. **Valida** estos parámetros antes de continuar, registrando un error si faltan configuraciones esenciales.

3. **Establece** el rango de fechas para el procesamiento basado en los parámetros obtenidos.

4. **Prepara el terreno** eliminando datos existentes para el día en tablas de resumen.

5. **Carga datos frescos** de ventas con su tipo y medio de pago desde la vista `view_tipoventa_mediopago_DWH`.

6. **Actualiza metadatos** usando un hash dinámico para identificar cambios en los registros fuente.

7. **Sincroniza** las ventas existentes con los datos fuente, actualizando solo los campos de negocio.

8. **Inserta** nuevas ventas que no existían previamente en la base de datos.

9. **Elimina** registros que ya no existen en la fuente.

10. **Procesa detalles** de ventas con lógica especial para notas de crédito (valores negativos).

11. **Finaliza** limpiando banderas y registrando el resultado del proceso.

El flujo maneja adecuadamente errores mediante transacciones y registro detallado de fallos.

## 2. Diagrama de Entidad-Relación (DER) en Mermaid

```mermaid
erDiagram
    ventascabecera ||--o{ ventasdetalle : "1 a muchos"
    ventascabecera ||--|| ventascabecera_meta : "1 a 1"
    ventascabecera {
        string id PK
        string canalventa
        string correlativo
        date fecha
        numeric total
        string tipodocumento
        string numero
        string serie
    }
    ventasdetalle {
        string id FK
        string linea
        numeric cantidad
        numeric precio
        numeric descuento
    }
    ventascabecera_meta {
        string canalventa PK
        string correlativo PK
        int periodo PK
        binary hash_datos
        datetime fecha_ultima_actualizacion_dwh
        int version_actual
        bit flag_actualizado
    }
    tb_tipoventa_mediopago {
        date FECHA
        string TIPODEVENTA
        string MEDIOPAGO
        string TIPODOC
        string SERIE
        string NRODOC
    }
    tb_tipoventa_mediopago_unico {
        date FECHA
        string TIPODOC
        string SERIE
        string NRODOC
        string MEDIOPAGOID
        string TIPODEVENTA
    }
    tb_ParametrosGeneralesVentas {
        string clave PK
        int anio PK
        int valorEntero
        string valorTexto
        bit activo
    }
    fag0300 ||--o{ fap0300 : "1 a muchos"
    fag0300 {
        string ccom_3 PK
        string ncom_3 PK
        date fcom_3
        string tidoc_3
        string nfactu_3
    }
    fap0300 {
        string ccom_3a PK,FK
        string ncom_3a PK,FK
        string linea_3a PK
        numeric cant_3a
        numeric pvta1_3a
    }
```

### Explicación del DER:

El diagrama muestra las principales entidades involucradas:

1. **ventascabecera**: Tabla principal de ventas con información de cabecera.
2. **ventasdetalle**: Contiene los ítems de cada venta, relacionada con ventascabecera.
3. **ventascabecera_meta**: Almacena metadatos técnicos para control de cambios.
4. **Tablas de tipo venta/medio pago**: Almacenan información adicional de clasificación.
5. **tb_ParametrosGeneralesVentas**: Configuración del proceso ETL.
6. **Tablas fuente (fag0300/fap0300)**: Estructuras origen de los datos.

Las relaciones clave son:
- Ventas cabecera-detalle (1 a muchos)
- Ventas cabecera-metadatos (1 a 1)
- Documentos fuente cabecera-detalle (1 a muchos)

## Nombre Técnico Sugerido para el Documento:

**"ETL_Ventas_ProcedimientoAlmacenado_ActualizacionConMeta.md"**

Justificación:
- **ETL_Ventas**: Indica que es un proceso de extracción, transformación y carga de datos de ventas.
- **ProcedimientoAlmacenado**: Especifica el tipo de artefacto documentado.
- **ActualizacionConMeta**: Destaca la característica distintiva de usar metadatos/hash para control de cambios.

Este nombre sigue convenciones técnicas claras, es autoexplicativo y facilita la búsqueda en el portal de documentación.