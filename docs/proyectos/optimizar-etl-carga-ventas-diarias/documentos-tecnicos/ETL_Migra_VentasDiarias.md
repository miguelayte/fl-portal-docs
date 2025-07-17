# Documentación del Proceso ETL para Carga de Ventas Diarias

## 1. Diagrama de Flujo de Datos (DFD)

```mermaid
flowchart TD
    A[Inicio] --> B[Establecer fecha de proceso]
    B --> C{Obtener información del mes}
    C --> D[Eliminar datos existentes para el día]
    D --> E[Insertar datos de tipo venta y medio de pago]
    E --> F[Insertar registros únicos de tipo venta]
    F --> G[Eliminar detalles de ventas para el día]
    G --> H[Merge ventascabecera]
    H --> I[Crear tablas temporales]
    I --> J[Procesar documentos tipo 007]
    J --> K[Procesar otros documentos]
    K --> L[Fin]

    subgraph Procesamiento Principal
        B --> C
        C --> D
        D --> E
        E --> F
        F --> G
        G --> H
    end

    subgraph Procesamiento Detalles
        H --> I
        I --> J
        J --> K
    end
```

??? info "Explicación del DFD"
    ### Explicación del DFD

    El diagrama muestra el flujo secuencial del procedimiento de migración de ventas diarias:

    1. **Inicialización**: Establece la fecha de proceso (hoy o ayer si no se especifica) y obtiene los rangos del mes actual.

    2. **Limpieza inicial**: Elimina datos existentes para el día en las tablas de resumen (`tb_tipoventa_mediopago` y `tb_tipoventa_mediopago_unico`) y detalles de ventas.

    3. **Carga de datos maestros**: Inserta datos de tipos de venta y medios de pago desde la vista `view_tipoventa_mediopago_DWH` y luego filtra los registros únicos.

    4. **Procesamiento de cabeceras**: Realiza un MERGE complejo en la tabla `ventascabecera` que:
      - Actualiza registros existentes si hay cambios
      - Inserta nuevos registros
      - Elimina registros que ya no existen en el origen

    5. **Procesamiento de detalles**: 
      - Crea tablas temporales para mejorar el rendimiento
      - Procesa separadamente las notas de crédito (tipo 007) con valores negativos
      - Procesa el resto de documentos con valores positivos

    El flujo es principalmente secuencial con algunas operaciones en paralelo (como el procesamiento de los diferentes tipos de documentos).

## 2. Diagrama de Entidad-Relación (DER)

```mermaid
erDiagram
    VENTASCABECERA ||--o{ VENTASDETALLE : "1:N"
    VENTASCABECERA {
        string id PK
        string canalventa
        string correlativo
        string tipodocumento
        string serie
        string numero
        date fecha
        numeric valorventa
        numeric igv
        numeric total
        string periodo
    }
    
    VENTASDETALLE {
        string id FK
        string ccom_3a
        string ncom_3a
        string linea_3a
        numeric cant_3a
        numeric pvta1_3a
        numeric vvta1_3a
        numeric igv1_3a
        numeric tot1_3a
    }
    
    TB_TIPOVENTA_MEDIOPAGO {
        date fecha PK
        string tipodeventa
        string mediopago
        string tipodoc
        string serie
        string nrodoc
        numeric venta
        numeric igv
        numeric total
    }
    
    TB_TIPOVENTA_MEDIOPAGO_UNICO {
        date fecha PK
        string tipodoc
        string serie
        string nrodoc
        string mediopagoid
        string tipodeventa
    }
    
    FAG0300 ||--o{ FAP0300 : "1:N"
    FAG0300 {
        string transacabid PK
        date fcom_3
        string tidoc_3
        string ccom_3
        string ncom_3
    }
    
    FAP0300 {
        string transacabid FK
        string linea_3a
        numeric cant_3a
        numeric vvta1_3a
        numeric igv1_3a
    }
```

??? info "Explicación del DER"
    ### Explicación del DER

    El diagrama muestra las principales entidades involucradas en el proceso:

    1. **VENTASCABECERA**: Tabla principal que almacena los documentos de venta con sus atributos principales como tipo de documento, serie, número, fechas y montos totales. Tiene una relación 1:N con VENTASDETALLE.

    2. **VENTASDETALLE**: Contiene los ítems de cada documento de venta, con información detallada de productos, cantidades y precios. Se relaciona con VENTASCABECERA a través del campo ID.

    3. **TB_TIPOVENTA_MEDIOPAGO**: Tabla de resumen que relaciona tipos de venta con medios de pago, con información consolidada por día.

    4. **TB_TIPOVENTA_MEDIOPAGO_UNICO**: Versión filtrada de la anterior que contiene solo las combinaciones únicas de tipo de venta y medio de pago por documento.

    5. **FAG0300 y FAP0300**: Tablas origen en la base de datos de pasarela que contienen respectivamente las cabeceras y detalles de las transacciones. Mantienen una relación 1:N similar a las tablas de destino.

    El diagrama muestra cómo los datos fluyen desde las tablas origen (FAG0300/FAP0300) hacia las tablas de destino en el data warehouse, pasando por tablas de resumen intermedias.