# Análisis del Procedimiento Almacenado

## 1. Diagrama de Flujo de Datos

```mermaid
flowchart TD
    A[Inicio] --> B[Declarar variables de fecha]
    B --> C[Eliminar datos existentes en tb_tipoventa_mediopago]
    C --> D[Eliminar datos existentes en tb_tipoventa_mediopago_unico]
    D --> E[Insertar datos desde view_tipoventa_mediopago_DWH]
    E --> F[Insertar datos en tb_tipoventa_mediopago_unico con ranking]
    F --> G[Eliminar datos de ventasdetalle del mes]
    G --> H[Crear tabla temporal #Duplicados]
    H --> I[Merge datos en ventascabecera]
    I --> J[Truncar y llenar tabla tmpvta]
    J --> K[Procesar ventas con documento 007]
    K --> L[Procesar ventas con documentos distintos a 007]
    L --> M[Fin]
    
    subgraph Procesamiento Principal
    B --> C --> D --> E --> F --> G --> H --> I --> J --> K --> L
    end
    
    subgraph Merge ventascabecera
    I --> I1[Comparar datos fuente con destino]
    I1 --> I2[Actualizar registros existentes]
    I2 --> I3[Insertar nuevos registros]
    I3 --> I4[Eliminar registros obsoletos]
    end
```

## 2. Diagrama de Entidad-Relación

```mermaid
erDiagram
    VENTASCABECERA ||--o{ VENTASDETALLE : contiene
    VENTASCABECERA {
        string canalventa PK
        string correlativo PK
        string periodo PK
        string tipodocumento
        string serie
        string numero
        datetime fecha
        numeric valorventa
        numeric igv
        numeric total
        string vendedor
        string tienda
        string cliente
        string rucdni
        string email
    }
    
    VENTASDETALLE {
        string canalventa PK
        string correlativo PK
        string producto PK
        string periodo PK
        numeric cantidad
        numeric precioventa
        numeric subtotal
        numeric igv
        numeric total
        string mes
    }
    
    TB_TIPOVENTA_MEDIOPAGO {
        datetime FECHA PK
        string TIPVENTAID
        string TIPODEVENTA
        string MEDIOPAGOID
        string MEDIOPAGO
        string TIPODOC
        string SERIE
        string NRODOC
        numeric VENTA
        numeric IGV
        numeric TOTAL
    }
    
    TB_TIPOVENTA_MEDIOPAGO_UNICO {
        string TIPODOC PK
        string SERIE PK
        string NRODOC PK
        string MEDIOPAGOID
        string TIPODEVENTA
        datetime FECHA
        numeric Rank
    }
    
    TMPVTA {
        string ccom_3a
        string ncom_3a
        string tidoc_3
        string linea_3a
        numeric cant_3a
        numeric pvta1_3a
        numeric vvta1_3a
        numeric igv1_3a
        numeric tot1_3a
    }
    
    VENTASCABECERATMP {
        string canalventa
        string correlativo
        string fecha
        string periodo
    }
    
    FAG0300 {
        string ccom_3
        string ncom_3
        string tidoc_3
        datetime fcom_3
        numeric vvta1_3
        numeric igv1_3
        numeric tot1_3
    }
    
    FAP0300 {
        string ccom_3a
        string ncom_3a
        string linea_3a
        numeric cant_3a
        numeric pvta1_3a
        numeric vvta1_3a
        numeric igv1_3a
        numeric tot1_3a
    }
    
    VIEW_TIPOVENTA_MEDIOPAGO_DWH {
        datetime FECHA
        string TIPODOC
        string SERIE
        string NRODOC
        string MEDIOPAGO
        numeric TOTAL
    }
```
??? info "Notas importantes sobre el diagrama"
    ## Explicación de los diagramas

    ### Diagrama de Flujo de Datos:
    1. Comienza declarando variables de fecha para el procesamiento
    2. Limpia tablas de destino (tb_tipoventa_mediopago y tb_tipoventa_mediopago_unico)
    3. Inserta datos desde la vista view_tipoventa_mediopago_DWH
    4. Crea registros únicos en tb_tipoventa_mediopago_unico usando RANK()
    5. Elimina datos antiguos de ventasdetalle
    6. Crea tabla temporal #Duplicados para filtrar registros problemáticos
    7. Realiza operación MERGE en ventascabecera (actualiza/inserta/elimina)
    8. Procesa datos de ventas (normales y anulaciones - documento 007)

    ### Diagrama Entidad-Relación:
    - Muestra las principales tablas involucradas:
    - Tablas destino: VENTASCABECERA, VENTASDETALLE, TB_TIPOVENTA_MEDIOPAGO
    - Tablas temporales: TMPVTA, VENTASCABECERATMP
    - Tablas origen: FAG0300 (cabeceras), FAP0300 (detalles), VIEW_TIPOVENTA_MEDIOPAGO_DWH
    - Destaca las relaciones principales y los campos clave
    - Incluye los campos más relevantes para entender el flujo de datos

    El procedimiento maneja principalmente datos de ventas POS (Point of Sale) con información de cabecera, detalle, medios de pago y tipos de venta.