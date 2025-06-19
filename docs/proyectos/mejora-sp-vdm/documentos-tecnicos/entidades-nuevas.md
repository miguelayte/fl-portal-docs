??? info "Tabla de parámetros generales"
    ```sql title="tb_ParametrosGeneralesVentas.sql" linenums="1"
    -- 1. Tabla de parámetros generales
    CREATE TABLE dbo.tb_ParametrosGeneralesVentas (
        clave VARCHAR(50),
        descripcion VARCHAR(255),
        anio INT,  -- Año al que aplica el parámetro
        valorEntero INT NULL,
        valorDecimal DECIMAL(18, 4) NULL,
        valorTexto VARCHAR(255) NULL,
        valorFecha DATE NULL,
        activo BIT DEFAULT 1,
        PRIMARY KEY (clave, anio)
    );

    -- 2. Insertar parámetros de ejemplo para distintos años
    INSERT INTO dbo.tb_ParametrosGeneralesVentas (clave, descripcion, anio, valorDecimal)
    VALUES 
    ('PrecioMinTY', 'Precio mínimo para ventas TY', 2025, 10.01),
    ('PrecioMinLY', 'Precio mínimo para ventas LY', 2025, 8.00)

    ```

    ```sql title="Ejemplo de uso" linenums="1"
    -- 5. Ejemplo de consulta de parámetros para un año específico
    DECLARE @anio INT = 2025;
    DECLARE @PrecioMinTY DECIMAL(10,2);
    DECLARE @PrecioMinLY DECIMAL(10,2);

    -- Obtener valores desde la tabla de parámetros para el año especificado
    SELECT @PrecioMinTY = valorDecimal 
    FROM dbo.tb_ParametrosGeneralesVentas 
    WHERE clave = 'PrecioMinTY' AND anio = @anio;

    SELECT @PrecioMinLY = valorDecimal 
    FROM dbo.tb_ParametrosGeneralesVentas 
    WHERE clave = 'PrecioMinLY' AND anio = @anio;

    -- Consulta de ejemplo usando los parámetros
    SELECT *
    FROM VentasVersus2025 vv
    JOIN tb_canal tc ON tc.id_canal = 1 -- ejemplo
    WHERE vv.precio > @PrecioMinTY
      AND tc.id_canal IN (SELECT id_canal FROM dbo.tb_CanalesPermitidos);

    ```