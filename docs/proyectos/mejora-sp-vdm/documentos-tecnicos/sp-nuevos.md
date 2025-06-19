??? info "VDM_get_fechas"
    ```sql title="VDM_get_fechas.sql" linenums="1"
    /******************************************************************************************
    Nombre:       dbo.VDM_get_fechas
    Descripción:  Calcula y devuelve los rangos de fechas correspondientes al mes actual 
                (This Year - TY) y al mismo mes del año anterior (Last Year - LY), tanto 
                en formato DATE como en formato CHAR(8) 'yyyyMMdd'. 
                Es útil para reportes comparativos de ventas u otros indicadores temporales.

    Parámetros:
        @fec            (IN)  Fecha de referencia. Si es NULL, se toma el día anterior a la fecha actual.
        @FechaIniTY     (OUT) Primer día del mes de la fecha de referencia (TY).
        @FechaFinTY     (OUT) Último día del mes de la fecha de referencia (TY).
        @FechaIniSFTY   (OUT) Fecha inicial TY en formato 'yyyyMMdd'.
        @FechaFinSFTY   (OUT) Fecha final TY en formato 'yyyyMMdd'.
        @FechaIniLY     (OUT) Primer día del mismo mes del año anterior (LY).
        @FechaFinLY     (OUT) Último día del mismo mes del año anterior (LY).
        @FechaIniSFLY   (OUT) Fecha inicial LY en formato 'yyyyMMdd'.
        @FechaFinSFLY   (OUT) Fecha final LY en formato 'yyyyMMdd'.

    Autor:        [Tu Nombre o Equipo]
    Fecha:        [Fecha de creación o última modificación]
    ******************************************************************************************/

    ALTER PROCEDURE dbo.VDM_get_fechas
        @fec DATE = NULL,
        @FechaIniTY DATE OUTPUT,
        @FechaFinTY DATE OUTPUT,
        @FechaIniSFTY CHAR(8) OUTPUT,
        @FechaFinSFTY CHAR(8) OUTPUT,
        @FechaIniLY DATE OUTPUT,
        @FechaFinLY DATE OUTPUT,
        @FechaIniSFLY CHAR(8) OUTPUT,
        @FechaFinSFLY CHAR(8) OUTPUT
    AS
    BEGIN
        -- Si no se proporciona una fecha, se usa el día anterior a la fecha actual
        IF @fec IS NULL 
            SET @fec = DATEADD(DAY, -1, GETDATE());

        -- Calcular el primer y último día del mes de la fecha de referencia (This Year)
        SET @FechaIniTY   = DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec), 0);
        SET @FechaFinTY   = DATEADD(DAY, -1, DATEADD(MONTH, DATEDIFF(MONTH, 0, @fec) + 1, 0));

        -- Convertir fechas TY a formato 'yyyyMMdd'
        SET @FechaIniSFTY = FORMAT(@FechaIniTY, 'yyyyMMdd');
        SET @FechaFinSFTY = FORMAT(@FechaFinTY, 'yyyyMMdd');

        -- Calcular las mismas fechas pero del año anterior (Last Year)
        SET @FechaIniLY   = DATEADD(YEAR, -1, @FechaIniTY);
        SET @FechaFinLY   = DATEADD(YEAR, -1, @FechaFinTY);

        -- Convertir fechas LY a formato 'yyyyMMdd'
        SET @FechaIniSFLY = FORMAT(@FechaIniLY, 'yyyyMMdd');
        SET @FechaFinSFLY = FORMAT(@FechaFinLY, 'yyyyMMdd');
    END;
    ```