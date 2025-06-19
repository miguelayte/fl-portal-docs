??? info "fn_get_fechas_del_mes.sql"
    ```sql title="fn_get_fechas_del_mes" linenums="1"
    /*
        Nombre:      dbo.fn_get_fechas_del_mes
        Objetivo:    Retornar las fechas clave para el análisis de cualquier mes, 
                    tanto para el año actual como para el año anterior, en formato DATE y CHAR(8).
                    Esta función puede ser utilizada en cualquier procedimiento almacenado que requiera 
                    rangos de fechas mensuales de forma centralizada y consistente.

        Parámetros:
            @fec DATE  -- Fecha base de referencia (generalmente el día de proceso o corte)

        Retorna:
            fec           DATE     -- Fecha base de referencia
            FechaIniTY    DATE     -- Primer día del mes de la fecha base (Año Actual)
            FechaFinTY    DATE     -- Último día del mes de la fecha base (Año Actual)
            FechaIniSFTY  CHAR(8)  -- Primer día del mes en formato 'yyyyMMdd' (Año Actual)
            FechaFinSFTY  CHAR(8)  -- Último día del mes en formato 'yyyyMMdd' (Año Actual)
            FechaIniLY    DATE     -- Primer día del mes equivalente del año anterior
            FechaFinLY    DATE     -- Último día del mes equivalente del año anterior
            FechaIniSFLY  CHAR(8)  -- Primer día del mes en formato 'yyyyMMdd' (Año Anterior)
            FechaFinSFLY  CHAR(8)  -- Último día del mes en formato 'yyyyMMdd' (Año Anterior)

        Autor:      Miguel Ayte
        Fecha:      2025-06-18
    */

    CREATE FUNCTION dbo.fn_get_fechas_del_mes (@fec DATE)
    RETURNS TABLE
    AS
    RETURN
    SELECT
        @fec AS fec,
        DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec), 0) AS FechaIniTY,
        EOMONTH(@fec) AS FechaFinTY,
        FORMAT(DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec), 0), 'yyyyMMdd') AS FechaIniSFTY,
        FORMAT(EOMONTH(@fec), 'yyyyMMdd') AS FechaFinSFTY,
        DATEADD(YEAR, -1, DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec), 0)) AS FechaIniLY,
        DATEADD(YEAR, -1, EOMONTH(@fec)) AS FechaFinLY,
        FORMAT(DATEADD(YEAR, -1, DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec), 0)), 'yyyyMMdd') AS FechaIniSFLY,
        FORMAT(DATEADD(YEAR, -1, EOMONTH(@fec)), 'yyyyMMdd') as FechaFinSFLY
    ```