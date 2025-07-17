# OPTIMIZACION DEL PROCESO ETL DEL SP "SP_COMPRAS"

## Problema
Se tiene que la ejecución del paso 7 del job "0200_job_jo_dwh_comercial" está demandando tiempos en promedio mayores a **1 hora**:

|ID|JobName	|step_id	|step_name	|RunDateTime	|Duration	|ExecutionStatus|
|--|---------|---------|-----------|-------------|---------|---------------|
|06|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-16 02:14:56.000	|01:03:14	|Succeeded|
|05|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-15 02:15:42.000	|01:00:03	|Succeeded|
|04|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-14 02:14:12.000	|00:57:22	|Succeeded|
|03|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-13 02:14:12.000	|00:57:55	|Succeeded|
|02|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-12 02:15:40.000	|01:01:43	|Succeeded|
|01|0200_job_jo_dwh_comercial	|7	|step_jo_dwh_compras	|2025-07-11 02:15:55.000	|00:55:58	|Succeeded|

??? info "Consulta para determinar historial de ejecución del paso n de un job"
    ```sql title="Consulta para determinar historial de ejecución del paso n de un job"
    USE msdb;
    GO

    SELECT TOP 10
        j.name AS JobName,
        s.step_id,
        s.step_name,
        CONVERT(DATETIME, 
            STUFF(STUFF(CAST(h.run_date AS CHAR(8)), 5, 0, '-'), 8, 0, '-') + ' ' +
            STUFF(STUFF(RIGHT('000000' + CAST(h.run_time AS VARCHAR(6)), 6), 3, 0, ':'), 6, 0, ':')
        ) AS RunDateTime,
        RIGHT('00' + CAST(h.run_duration / 10000 AS VARCHAR), 2) + ':' +
        RIGHT('00' + CAST((h.run_duration % 10000) / 100 AS VARCHAR), 2) + ':' +
        RIGHT('00' + CAST(h.run_duration % 100 AS VARCHAR), 2) AS Duration,
        CASE h.run_status
            WHEN 0 THEN 'Failed'
            WHEN 1 THEN 'Succeeded'
            WHEN 2 THEN 'Retry'
            WHEN 3 THEN 'Canceled'
            WHEN 4 THEN 'In Progress'
            ELSE 'Unknown'
        END AS ExecutionStatus
    FROM dbo.sysjobhistory h
    JOIN dbo.sysjobs j ON h.job_id = j.job_id
    JOIN dbo.sysjobsteps s ON j.job_id = s.job_id AND h.step_id = s.step_id
    WHERE j.name = '0200_job_jo_dwh_comercial'
      AND s.step_id = 7
      AND s.step_name = 'step_jo_dwh_compras'
    ORDER BY RunDateTime DESC;
    ```

Para optimizar el proceso ETL del SP `sp_compras`, primero debemos identificar claramente las **entidades origen** (de dónde provienen los datos) y las **entidades destino** (dónde se cargan o transforman los datos).

***

## Entidades Origen 📥

Las entidades origen son principalmente tablas de la base de datos `SERVNPROD.bd_passarela` y, en algunos casos, datos preexistentes en las tablas destino que se utilizan para cálculos o comparaciones.

* **`SERVNPROD.bd_passarela.dbo.tb_dwh_oc`**: Utilizada para cargar datos en la tabla `OC`.
* **`SERVNPROD.bd_passarela.dbo.TRANSACCIONDETALLE`**: Una fuente clave para `PRECOMPRA` y `GUIA`, contiene detalles de transacciones.
* **`SERVNPROD.bd_passarela.dbo.TRANSACCIONCABECERA`**: Contiene información de cabecera de las transacciones, esencial para `PRECOMPRA` y `GUIA`.
* **`SERVNPROD.bd_passarela.dbo.FORMAPAGO`**: Usada para obtener detalles de las condiciones de pago en `PRECOMPRA`.
* **`SERVNPROD.bd_passarela.dbo.PRODUCTO`**: Proporciona información de productos (SKU, nombre) para `PRECOMPRA` y `GUIA`.
* **`SERVNPROD.bd_passarela.dbo.ALMACEN`**: Utilizada para obtener nombres de almacenes en `PRECOMPRA` y `GUIA`.
* **`SERVNPROD.bd_passarela.dbo.PERSONA`**: Contiene datos de proveedores (`PRECOMPRA` y `GUIA`) y proveedores completos (`proveedorC`).
* **`SERVNPROD.bd_passarela.dbo.PERSONATIPOPERSONA`**: Usada para filtrar y obtener personas de tipo proveedor en la carga de `proveedorC`.
* **`SERVNPROD.bd_passarela.dbo.PERSONATIPODOCUMENTO`**: Proporciona números de documento para los proveedores en `proveedorC`.
* **`SERVNPROD.bd_passarela.dbo.COMPRASGUIAS`**: Se utiliza para vincular guías a compras en la sección de migración de guías.
* **`SERVNPROD.bd_passarela.dbo.Modelo`**: Fuente para la tabla `modeloC`.
* **`dbo.GUIA`**: Utilizada como origen para la sección de duplicados y para actualizar el estado en `OC`.
* **`dbo.OC`**: Utilizada como origen para actualizar su propio estado.
* **`dbo.producto`**: Usada como origen para `productos_compra`.

***

## Entidades Destino 🎯

Las entidades destino son las tablas donde el SP carga, inserta, actualiza o elimina datos.

* **`dbo.productos_compra`**: Se trunca y se vuelve a poblar con datos de la tabla `producto`.
* **`dbo.OC`**: Los registros se eliminan para años específicos y luego se insertan nuevos datos desde `SERVNPROD.bd_passarela.dbo.tb_dwh_oc`. También se actualiza su campo `ESTADO` basándose en datos de `GUIA`.
* **`dbo.PRECOMPRA`**: Los registros se eliminan para el año en curso y luego se insertan nuevos datos obtenidos a través de `OPENQUERY` desde el servidor vinculado `SERVNPROD`.
* **`dbo.GUIA`**: Los registros se eliminan para el año en curso, luego se insertan datos de guías de ingreso después de un proceso de unión y agrupación. También se actualizan los registros duplicados estableciendo su cantidad a cero.
* **`dbo.proveedorC`**: Es truncada y luego poblada con información detallada de proveedores obtenida a través de `OPENQUERY` desde el servidor vinculado `SERVNPROD`.
* **`dbo.modeloC`**: Es truncada y luego poblada con datos de modelos desde `servnprod.bd_passarela.dbo.Modelo`.

## Hallazgos:
Se tienen los siguientes hallazgos:

- La entidad **`dbo.productos_compra`** es exactamente igual que la entidad **`dbo.producto`**, tanto en estructura (Columnas y Tipo) como en número de filas.

??? info "Listar comparación de estructuras de dos tablas"
    ```sql
    WITH columnas AS (
        SELECT 
            TABLE_NAME,
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME IN ('producto', 'productos_compra')
    )
    SELECT 
        COALESCE(p.COLUMN_NAME, pc.COLUMN_NAME) AS COLUMN_NAME,
        p.DATA_TYPE AS PRODUCTO_DATA_TYPE,
        pc.DATA_TYPE AS PRODUCTOS_COMPRA_DATA_TYPE,
        p.CHARACTER_MAXIMUM_LENGTH AS PRODUCTO_LENGTH,
        pc.CHARACTER_MAXIMUM_LENGTH AS PRODUCTOS_COMPRA_LENGTH,
        p.NUMERIC_PRECISION AS PRODUCTO_PRECISION,
        pc.NUMERIC_PRECISION AS PRODUCTOS_COMPRA_PRECISION,
        p.NUMERIC_SCALE AS PRODUCTO_SCALE,
        pc.NUMERIC_SCALE AS PRODUCTOS_COMPRA_SCALE
    FROM 
        columnas p
    FULL OUTER JOIN columnas pc
        ON p.COLUMN_NAME = pc.COLUMN_NAME
        AND p.TABLE_NAME = 'producto'
        AND pc.TABLE_NAME = 'productos_compra'
    WHERE 
        p.TABLE_NAME = 'producto' OR pc.TABLE_NAME = 'productos_compra'
    ORDER BY COLUMN_NAME;
    ```

??? info "Listar comparación de estructuras de dos tablas (Solo aquellas que tengan diferencias)"
    ```sql
    WITH columnas AS (
        SELECT 
            TABLE_NAME,
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME IN ('producto', 'productos_compra')
    ),
    comparacion AS (
        SELECT 
            COALESCE(p.COLUMN_NAME, pc.COLUMN_NAME) AS COLUMN_NAME,
            p.DATA_TYPE AS PRODUCTO_DATA_TYPE,
            pc.DATA_TYPE AS PRODUCTOS_COMPRA_DATA_TYPE,
            p.CHARACTER_MAXIMUM_LENGTH AS PRODUCTO_LENGTH,
            pc.CHARACTER_MAXIMUM_LENGTH AS PRODUCTOS_COMPRA_LENGTH,
            p.NUMERIC_PRECISION AS PRODUCTO_PRECISION,
            pc.NUMERIC_PRECISION AS PRODUCTOS_COMPRA_PRECISION,
            p.NUMERIC_SCALE AS PRODUCTO_SCALE,
            pc.NUMERIC_SCALE AS PRODUCTOS_COMPRA_SCALE
        FROM 
            columnas p
        FULL OUTER JOIN columnas pc
            ON p.COLUMN_NAME = pc.COLUMN_NAME
            AND p.TABLE_NAME = 'producto'
            AND pc.TABLE_NAME = 'productos_compra'
        WHERE 
            p.TABLE_NAME = 'producto' OR pc.TABLE_NAME = 'productos_compra'
    )
    SELECT *
    FROM comparacion
    WHERE 
        PRODUCTO_DATA_TYPE IS NULL OR PRODUCTOS_COMPRA_DATA_TYPE IS NULL OR
        PRODUCTO_DATA_TYPE <> PRODUCTOS_COMPRA_DATA_TYPE OR
        PRODUCTO_LENGTH <> PRODUCTOS_COMPRA_LENGTH OR
        PRODUCTO_PRECISION <> PRODUCTOS_COMPRA_PRECISION OR
        PRODUCTO_SCALE <> PRODUCTOS_COMPRA_SCALE
    ORDER BY COLUMN_NAME;
    ```


- Informe de Hallazgos de Exploración de Datos 📊

|ID| Tabla Destino  | Estado Actual     | Comentario                                   |
|--|----------------|-------------------|----------------------------------------------|
|01| `modeloC`      | **Vigente** | 81,600 registros.                            |
|02| `dbo.GUIA`     | **En desuso** | Última `fecharegistro`: 20240104.            |
|03| `dbo.OC`       | **En desuso** | Última `fechaemision`: 20241223.             |
|04| `dbo.PRECOMPRA`| **Vacío / En desuso** | No contiene registros.                     |
|05| `dbo.proveedorC`| **Vigente** | Última `fechaingreso`: 20250715.             |

---

**Análisis de los Hallazgos:**

* Las tablas `dbo.GUIA`, `dbo.OC`, y `dbo.PRECOMPRA` parecen estar **en desuso** o no se están actualizando con los datos más recientes. Esto es crítico para un proceso ETL, ya que indica que estas tablas no están cumpliendo su propósito de almacenar información actualizada.
* La tabla `dbo.PRECOMPRA` está **completamente vacía**, lo que sugiere un problema en el proceso de carga o que su uso ha sido descontinuado por completo.
* `modeloC` y `proveedorC` están **vigentes** y contienen datos recientes, lo que indica que sus procesos de carga funcionan correctamente.

Estos hallazgos son importantes para la optimización del proceso ETL, ya que un proceso ineficiente o con tablas en desuso puede consumir recursos innecesarios.

## Mejora propuesta
Crear un nuevo procedimiento almacenado que incluya solo las tablas **vigentes**, dado que las tablas destino `dbo.GUIA`, `dbo.OC`, y `dbo.PRECOMPRA` son pobladas mediante integración con **SAP B1**.
Este es el código del nuevo SP:
