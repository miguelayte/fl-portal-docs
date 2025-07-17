```sql title="usp_etl_cargar_proveedores_modelos.sql"
/*
    Nombre:      usp_etl_cargar_proveedores_modelos
    Objetivo:    Extraer y consolidar información de proveedores y modelos desde el servidor vinculado SERVNPROD,
                almacenando los datos en tablas locales para su posterior análisis y explotación en el Data Warehouse.
                El procedimiento elimina y recrea las tablas locales dbo.proveedorC y dbo.modeloC con los datos más recientes.

    Autor:       Miguel Ayte

    Ejemplo de uso:
        EXEC dbo.usp_etl_cargar_proveedores_modelos;

    Descripción:
        - Obtiene información completa de proveedores (ID, código, razón social, documento, dirección, contacto, tipo de persona) desde SERVNPROD.
        - Elimina y recrea la tabla dbo.proveedorC con los datos extraídos.
        - Obtiene información de modelos (prefijo, nombre, proveedor) desde SERVNPROD.
        - Elimina y recrea la tabla dbo.modeloC con los datos extraídos.
*/
CREATE PROCEDURE [dbo].[usp_etl_cargar_proveedores_modelos]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LinkedServer NVARCHAR(128) = 'SERVNPROD';
    DECLARE @OpenQuery NVARCHAR(MAX), @Script NVARCHAR(MAX);

    /*******************************************
    * PROVEEDORES COMPLETOS
    *******************************************/
    IF OBJECT_ID('dbo.proveedorC', 'U') IS NOT NULL
        DROP TABLE dbo.proveedorC;

    SET @Script = '
        SELECT
            A.persona AS ID,
            A.CODIGO,
            RTRIM(B.PATERNO) + '' '' + RTRIM(B.MATERNO) + '' '' + RTRIM(B.NOMBRE) AS RAZONSOCIAL,
            B.TIPODOCUMENTO,
            ISNULL(C.NUMERODOCUMENTO, '''') AS NUMERODOCUMENTO,
            (SELECT TOP 1 d.DIRECCION
            FROM PERSONADIRECCION d
            WHERE d.persona = CAST(B.cvid AS VARCHAR) + CAST(B.PERSONA AS VARCHAR)
            ORDER BY TIPODIRECCION ASC) AS DIRECCION,
            B.EMAIL,
            B.TELEFONO,
            B.CELULAR,
            B.FECHAINGRESO,
            B.PERSONATIPOPERSONA
        FROM PERSONATIPOPERSONA A WITH(NOLOCK)
        INNER JOIN PERSONA B WITH(NOLOCK)
            ON A.personaidx = B.PERSONA AND A.personacvidx = B.cvid
        LEFT JOIN PERSONATIPODOCUMENTO C WITH(NOLOCK)
            ON A.persona = C.persona AND A.personatipo = C.personatipo
        WHERE A.PERSONATIPO = 100915
        ORDER BY A.CODIGO ASC
    ';

    SET @OpenQuery = 'SELECT * INTO dbo.proveedorC FROM OPENQUERY([' + @LinkedServer + '], ''' + REPLACE(@Script, '''', '''''') + ''')';
    EXEC(@OpenQuery);

    /*******************************************
    * MODELOS
    *******************************************/
    IF OBJECT_ID('dbo.modeloC', 'U') IS NOT NULL
        DROP TABLE dbo.modeloC;

    SELECT
        Prefijo,
        CASE
            WHEN ISNULL(CHARINDEX('(', NOMBRE, 0), 0) > 0
                THEN RTRIM(LTRIM(SUBSTRING(NOMBRE, 1, ISNULL(CHARINDEX('(', NOMBRE, 0), 0) - 1)))
            ELSE UPPER(RTRIM(LTRIM(NOMBRE)))
        END AS Nombre,
        Proveedor
    INTO dbo.modeloC
    FROM servnprod.bd_passarela.dbo.Modelo WITH(NOLOCK);

END
```
