??? info "usp_etl_migrar_ventas_diarias"
    ```sql title="usp_etl_migrar_ventas_diarias.sql" linenums="1"
    /*
        Nombre:      dbo.usp_etl_migrar_ventas_diarias
        Objetivo:    Migrar, actualizar y consolidar la información de ventas del día en las tablas del Data Warehouse.
                    El procedimiento realiza la limpieza, inserción y actualización de datos de ventas, 
                    así como el procesamiento de detalles y cabeceras de documentos, utilizando tablas temporales 
                    para mejorar el rendimiento y asegurar la integridad de la información diaria.

        Autor:       Miguel Ayte
        Fecha:       2025-06-23

        Descripción general del proceso:
            - Inicializa la fecha de proceso y obtiene los rangos del mes.
            - Elimina datos existentes del día en tablas de resumen.
            - Inserta y consolida datos de tipo de venta y medio de pago.
            - Elimina y actualiza cabeceras y detalles de ventas usando MERGE y tablas temporales locales.
            - Procesa documentos tipo 007 (notas de crédito) y otros documentos, asegurando la correcta migración y consistencia de los datos.
    */
    -- EXECUTE [dbo].[usp_etl_migrar_ventas_diarias] '2025-04-01'
    ALTER PROCEDURE [dbo].[usp_etl_migrar_ventas_diarias] (@hoy DATE = NULL)
    AS
    BEGIN
        SET NOCOUNT ON

        -- Establecer fecha de ayer si es nula
        IF @hoy IS NULL SET @hoy = DATEADD(dd,DATEDIFF(dd,0,GETDATE()),-1)

        -- Obtener información del mes
        DECLARE @año INT, @mes CHAR(4), @PrimerDia DATE, @UltimoDia DATE
        
        SELECT 
            @año = YEAR(t.fec), 
            @mes = FORMAT(t.fec, 'MM'),
            @PrimerDia = t.FechaIniTY,
            @UltimoDia = FechaFinTY
        FROM dbo.fn_get_fechas_del_mes (@hoy) AS t

        -- Eliminar datos existentes para el día
        DELETE FROM tb_tipoventa_mediopago WHERE FECHA = @hoy
        DELETE FROM tb_tipoventa_mediopago_unico WHERE FECHA = @hoy
        
        -- Insertar datos de tipo venta y medio de pago
        INSERT INTO tb_tipoventa_mediopago
        SELECT 
            vtm.periodo, vtm.MES, vtm.TIPVENTAID, vtm.TIPODEVENTA, vtm.MEDIOPAGOID, 
            vtm.MEDIOPAGO, vtm.TIPODOC, vtm.SERIE, vtm.NRODOC, vtm.SERIENC, 
            vtm.NRODOCNC, vtm.CLIENTE, vtm.FECHA, vtm.DSCTO, vtm.VENTA, vtm.IGV, 
            vtm.TOTAL, vtm.CODPERSONAL, vtm.TIENDA, vtm.DOCIDEN, vtm.CODMOTIVO, 
            vtm.MOTIVOTRAN, vtm.MOTIVONC, vtm.PERCEPCION, vtm.TOTALCONPERCEP, 
            vtm.banco, vtm.n
        FROM servnprod.bd_passarela.dbo.view_tipoventa_mediopago_DWH AS vtm
        WHERE vtm.FECHA = @hoy
        
        -- Insertar registros únicos de tipo venta y medio de pago
        INSERT INTO tb_tipoventa_mediopago_unico
        SELECT 
            m1.TIPODOC, m1.SERIE, m1.NRODOC, m1.MEDIOPAGOID, m1.TIPODEVENTA, 
            m1.FECHA, m1.[Rank]
        FROM (
            SELECT DISTINCT 
                m.TIPODOC, m.SERIE, m.NRODOC, m.MEDIOPAGOID, m.TIPODEVENTA, 
                m.FECHA,
                RANK() OVER(
                    PARTITION BY m.TIPODOC, m.SERIE, m.NRODOC, m.TIPODEVENTA 
                    ORDER BY m.TIPODOC, m.SERIE, m.NRODOC, m.MEDIOPAGOID, m.TIPODEVENTA DESC
                ) AS RANK
            FROM dbo.tb_tipoventa_mediopago AS m
            WHERE m.FECHA = @hoy
        ) AS m1
        WHERE m1.[Rank] = 1

        -- Eliminar detalles de ventas para el día
        DELETE vd
        FROM ventasdetalle AS vd
        INNER JOIN ventascabecera AS vc ON vc.id = vd.id
        WHERE vc.fecha = @hoy

        -- MERGE para actualizar ventascabecera
        MERGE ventascabecera AS TARGET
        USING (
            SELECT 
                canalventa, correlativo, tipodocumento, serie, numero, tipodocref, 
                serieref, numeroref, cliente, hora, fecha, mediopago, valorventa, 
                igv, total, vendedor, tienda, vale, montopercepcion, 
                CAST(dd.totpecepcion AS NUMERIC(18,2)) AS totpecepcion, estado,
                periodo, n, rucdni, email, autoriza, clientename, 
                CAST(dd.pedidoweb AS VARCHAR(30)) AS pedidoweb,
                dd.id_tipoventa, dd.alicom_3,
                donacion, anticipo, gratuita, dsctoglobal, iigv_3, numcaja, 
                motivref, icbper_3
            FROM (
                SELECT 
                    CAST(ccom_3 AS NVARCHAR(3)) AS canalventa,
                    CAST(ncom_3 AS NVARCHAR(8)) AS correlativo,
                    CAST(tidoc_3 AS NVARCHAR(3)) AS tipodocumento,
                    CAST(sfactu_3 AS NVARCHAR(4)) AS serie,
                    CAST(nfactu_3 AS NVARCHAR(8)) AS numero,
                    CAST(tidocr_3 AS NVARCHAR(3)) AS tipodocref,
                    CAST(sfactur_3 AS NVARCHAR(4)) AS serieref,
                    CAST(nfactur_3 AS NVARCHAR(8)) AS numeroref,
                    CAST(ruc_3 AS NVARCHAR(15)) AS cliente,
                    CAST(gloa_3 AS NVARCHAR(200)) AS hora,
                    CAST(fcom_3 AS DATETIME) AS fecha,
                    CAST(condp_3 AS NVARCHAR(2)) AS mediopago,
                    CAST(vuelt2_3 AS NUMERIC(18, 2)) AS donacion,
                    CAST(anticipo_3 AS NUMERIC(18, 2)) AS anticipo,
                    CAST(gratuita AS NUMERIC(18, 2)) AS gratuita,
                    CAST(dscto1_3 AS NUMERIC(18, 2)) AS dsctoglobal,
                    CAST(iigv_3 AS NUMERIC(18, 2)) AS iigv_3,
                    CAST(numcaja AS NVARCHAR(2)) AS numcaja,
                    b.nomb_28 AS motivref,
                    CAST(icbper_3 AS NUMERIC(12, 2)) AS icbper_3,
                    IIF(tidoc_3 = '007', -1 * CAST(vvta1_3 AS NUMERIC(18, 2)), CAST(vvta1_3 AS NUMERIC(18, 2))) AS valorventa,
                    IIF(tidoc_3 = '007', -1 * CAST(igv1_3 AS NUMERIC(18, 2)), CAST(igv1_3 AS NUMERIC(18, 2))) AS igv,
                    IIF(tidoc_3 = '007', -1 * CAST(tot1_3 AS NUMERIC(18, 2)), CAST(tot1_3 AS NUMERIC(18, 2))) AS total,
                    IIF(CAST(fichv_3 AS NVARCHAR(6)) = '', '000000', REPLACE(REPLACE(CAST(fichv_3 AS NVARCHAR(6)), '*', '0'), '.', '0')) AS vendedor,
                    CAST(tienda_3 AS NVARCHAR(2)) AS tienda,
                    CAST(nvale_3 AS NVARCHAR(17)) AS vale,
                    IIF(tidoc_3 = '007', -1 * CAST(monper_3 AS NUMERIC(18, 2)), CAST(monper_3 AS NUMERIC(18, 2))) AS montopercepcion,
                    IIF(tidoc_3 = '007', -1 * CAST(totper_3 AS NUMERIC(18, 2)), CAST(totper_3 AS NUMERIC(18, 2))) AS totpecepcion,
                    CAST(flag_3 AS NUMERIC(1, 0)) AS estado,
                    IIF(CAST(ruc_3 AS NVARCHAR(15)) = '', '0', CAST(ruc_3 AS NVARCHAR(15))) AS ruc,
                    CAST(FORMAT(t1.fcom_3,'yyyy') AS VARCHAR(4)) AS periodo,
                    CONCAT(CAST(FORMAT(t1.fcom_3,'yyyy') AS VARCHAR(4)), CAST(ccom_3 AS NVARCHAR(3)), CAST(ncom_3 AS NVARCHAR(8))) AS n,
                    T1.ruc_3 AS rucdni,
                    T1.xmlfull AS email,
                    CASE WHEN CHARINDEX('@', T1.xmlfull) > 0 THEN 
                        CASE WHEN T1.meses_3 = 1 THEN 'SI' ELSE 'NO' END
                    ELSE NULL END AS autoriza,
                    T1.nomb_3 AS clientename,
                    T1.pedidoweb,
                    CASE 
                        WHEN T1.tipov_3 = '00' THEN 
                            CASE WHEN CAST(tienda_3 AS NVARCHAR(2)) = 'D6' THEN '27' ELSE '11' END
                        ELSE T1.tipov_3
                    END AS id_tipoventa,
                    T1.alicom_3
                FROM servnprod.bd_passarela.dbo.fag0300 AS T1 WITH (NOLOCK)
                INNER JOIN servnprod.bd_passarela.dbo.fag2800_FACTU b WITH (NOLOCK)
                    ON T1.motiv_28 = b.motiv_28
                WHERE fcom_3 = @hoy
            ) AS dd
        ) AS SOURCE
        ON (TARGET.canalventa = SOURCE.canalventa
            AND TARGET.correlativo = SOURCE.correlativo
            AND TARGET.periodo = SOURCE.periodo)
        WHEN MATCHED AND (
            TARGET.tipodocumento <> SOURCE.tipodocumento OR
            TARGET.serie <> SOURCE.serie OR
            TARGET.numero <> SOURCE.numero OR
            TARGET.tipodocref <> SOURCE.tipodocref OR
            TARGET.serieref <> SOURCE.serieref OR
            TARGET.numeroref <> SOURCE.numeroref OR
            TARGET.clientepordefinir <> SOURCE.cliente OR
            TARGET.hora <> SOURCE.hora OR
            TARGET.fecha <> SOURCE.fecha OR
            TARGET.mediopago <> SOURCE.mediopago OR
            TARGET.valorventa <> SOURCE.valorventa OR
            TARGET.igv <> SOURCE.igv OR
            TARGET.total <> SOURCE.total OR
            TARGET.vendedor <> SOURCE.vendedor OR
            TARGET.tienda <> SOURCE.tienda OR
            TARGET.vale <> SOURCE.vale OR
            TARGET.montopercepcion <> SOURCE.montopercepcion OR
            TARGET.totalpercepcion <> SOURCE.totpecepcion OR
            TARGET.flag <> SOURCE.estado OR
            TARGET.cliente <> SOURCE.cliente OR
            TARGET.id <> SOURCE.n OR
            TARGET.rucdni <> SOURCE.rucdni OR
            TARGET.email <> SOURCE.email OR
            TARGET.autoriza <> SOURCE.autoriza OR
            TARGET.clientename <> SOURCE.clientename OR
            TARGET.pedidoweb <> SOURCE.pedidoweb OR
            TARGET.id_tipoventa <> SOURCE.id_tipoventa OR
            TARGET.Donacion <> SOURCE.Donacion OR
            TARGET.anticipo <> SOURCE.anticipo OR
            TARGET.GRATUITA <> SOURCE.GRATUITA OR
            TARGET.dsctoglobal <> SOURCE.dsctoglobal OR
            TARGET.iigv_3 <> SOURCE.iigv_3 OR
            TARGET.numcaja <> SOURCE.numcaja OR
            TARGET.motivref <> SOURCE.motivref OR
            TARGET.icbper_3 <> SOURCE.icbper_3
        ) THEN
            UPDATE SET
                TARGET.tipodocumento = SOURCE.tipodocumento,
                TARGET.serie = SOURCE.serie,
                TARGET.numero = SOURCE.numero,
                TARGET.tipodocref = SOURCE.tipodocref,
                TARGET.serieref = SOURCE.serieref,
                TARGET.numeroref = SOURCE.numeroref,
                TARGET.clientepordefinir = SOURCE.cliente,
                TARGET.hora = SOURCE.hora,
                TARGET.fecha = SOURCE.fecha,
                TARGET.mediopago = SOURCE.mediopago,
                TARGET.valorventa = SOURCE.valorventa,
                TARGET.igv = SOURCE.igv,
                TARGET.total = SOURCE.total,
                TARGET.vendedor = SOURCE.vendedor,
                TARGET.tienda = SOURCE.tienda,
                TARGET.vale = SOURCE.vale,
                TARGET.montopercepcion = SOURCE.montopercepcion,
                TARGET.totalpercepcion = SOURCE.totpecepcion,
                TARGET.flag = SOURCE.estado,
                TARGET.cliente = SOURCE.cliente,
                TARGET.id = SOURCE.n,
                TARGET.rucdni = SOURCE.rucdni,
                TARGET.email = SOURCE.email,
                TARGET.autoriza = SOURCE.autoriza,
                TARGET.clientename = SOURCE.clientename,
                TARGET.pedidoweb = SOURCE.pedidoweb,
                TARGET.id_tipoventa = SOURCE.id_tipoventa,
                TARGET.alicom_3 = SOURCE.alicom_3,
                TARGET.Donacion = SOURCE.Donacion,
                TARGET.anticipo = SOURCE.anticipo,
                TARGET.GRATUITA = SOURCE.GRATUITA,
                TARGET.dsctoglobal = SOURCE.dsctoglobal,
                TARGET.iigv_3 = SOURCE.iigv_3,
                TARGET.numcaja = SOURCE.numcaja,
                TARGET.motivref = SOURCE.motivref,
                TARGET.icbper_3 = SOURCE.icbper_3
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                canalventa, correlativo, tipodocumento, serie, numero, tipodocref,
                serieref, numeroref, clientepordefinir, hora, fecha, mediopago,
                valorventa, igv, total, vendedor, tienda, vale, montopercepcion,
                totalpercepcion, flag, cliente, periodo, id, rucdni, email, autoriza,
                clientename, pedidoweb, id_tipoventa, alicom_3, Donacion, anticipo,
                GRATUITA, dsctoglobal, iigv_3, numcaja, motivref, icbper_3
            )
            VALUES (
                SOURCE.canalventa, SOURCE.correlativo, SOURCE.tipodocumento,
                SOURCE.serie, SOURCE.numero, SOURCE.tipodocref, SOURCE.serieref,
                SOURCE.numeroref, SOURCE.cliente, SOURCE.hora, SOURCE.fecha,
                SOURCE.mediopago, SOURCE.valorventa, SOURCE.igv, SOURCE.total,
                SOURCE.vendedor, SOURCE.tienda, SOURCE.vale, SOURCE.montopercepcion,
                SOURCE.totpecepcion, SOURCE.estado, SOURCE.cliente, SOURCE.periodo,
                SOURCE.n, SOURCE.rucdni, SOURCE.email, SOURCE.autoriza,
                SOURCE.clientename, SOURCE.pedidoweb, SOURCE.id_tipoventa,
                SOURCE.alicom_3, SOURCE.Donacion, SOURCE.anticipo, SOURCE.gratuita,
                SOURCE.dsctoglobal, SOURCE.iigv_3, SOURCE.numcaja, SOURCE.motivref,
                SOURCE.icbper_3
            )
        WHEN NOT MATCHED BY SOURCE AND CAST(TARGET.[fecha] AS DATE) = @hoy THEN
            DELETE;

        -- Procesar detalles de ventas
        -- Usar tabla temporal para mejorar rendimiento
        -- Crear tabla temporal #tmpvta si no existe
        IF OBJECT_ID('tempdb..#tmpvta') IS NOT NULL DROP TABLE #tmpvta;
        CREATE TABLE #tmpvta (
            [ccom_3a]    CHAR (3)        NULL,
            [ncom_3a]    CHAR (8)        NULL,
            [tidoc_3]    CHAR (3)        NULL,
            [linea_3a]   CHAR (11)       NULL,
            [cant_3a]    NUMERIC (10, 2) NULL,
            [pvta1_3a]   NUMERIC (20, 2) NULL,
            [dsct1_3a]   NVARCHAR (40)   NULL,
            [vvta1_3a]   NUMERIC (20, 2) NULL,
            [igv1_3a]    NUMERIC (20, 2) NULL,
            [tot1_3a]    NUMERIC (20, 2) NULL,
            [flag_3a]    NUMERIC (1)     NULL,
            [porper_3a]  NUMERIC (4, 1)  NULL,
            [monper_3a]  NUMERIC (20, 2) NULL,
            [totper_3a]  NUMERIC (20, 2) NULL,
            [periodo]    CHAR (4)        NULL,
            [tipimp_3a]  CHAR (4)        NULL,
            [aigv_3a]    CHAR (2)        NULL,
            [id_mkt_cab] INT             NULL,
            [marca_reg]  CHAR (1)        NULL
        );

        -- Crear tabla temporal #VentasCabeceraTmp si no existe
        IF OBJECT_ID('tempdb..#VentasCabeceraTmp') IS NOT NULL DROP TABLE #VentasCabeceraTmp;
        CREATE TABLE #VentasCabeceraTmp (
            [canalventa]  CHAR (3) NULL,
            [correlativo] CHAR (8) NULL,
            [fecha]       CHAR (2) NULL,
            [periodo]     CHAR (4) NULL
        );    

        INSERT INTO #tmpvta
        SELECT 
            b.ccom_3a, b.ncom_3a, a.tidoc_3, b.linea_3a, cant_3a, pvta1_3a,
            dsct1_3a, vvta1_3a, igv1_3a, tot1_3a, flag_3a, porper_3a, monper_3a,
            totper_3a, b.periodo, b.tipimp_3a, b.aigv_3a, b.id_mkt_cab, b.marca_reg
        FROM servnprod.bd_passarela.dbo.fag0300 a WITH (NOLOCK)
        INNER JOIN servnprod.bd_passarela.dbo.fap0300 b WITH (NOLOCK)
            ON a.transacabid = b.transacabid
        WHERE a.fcom_3 = @hoy

        -- Procesar documentos tipo 007 (notas de crédito)
        TRUNCATE TABLE #VentasCabeceraTmp
        
        INSERT INTO #VentasCabeceraTmp
        SELECT 
            b.canalventa, b.correlativo, FORMAT(b.fecha, 'MM'), FORMAT(b.fecha, 'yyyy')
        FROM ventascabecera b
        WHERE b.periodo = @año AND b.fecha = @hoy AND b.tipodocumento = '007'
        
        INSERT INTO ventasdetalle
        SELECT 
            a.ccom_3a, a.ncom_3a, a.linea_3a, -1*CAST(a.cant_3a AS NUMERIC), a.pvta1_3a,
            a.dsct1_3a, (-1*CAST(a.vvta1_3a AS NUMERIC(18,2))), (-1*CAST(a.igv1_3a AS NUMERIC(18,2))),
            (-1*CAST(a.tot1_3a AS NUMERIC(18,2))), a.flag_3a, a.porper_3a,
            (-1*CAST(a.monper_3a AS NUMERIC(18,2))), (-1*CAST(a.totper_3a AS NUMERIC(18,2))),
            0, b.periodo, 
            CONCAT(CAST(b.periodo AS VARCHAR(4)), CAST(a.ccom_3a AS NVARCHAR(3)), CAST(a.ncom_3a AS NVARCHAR(8))),
            b.fecha, a.tipimp_3a, a.aigv_3a, a.id_mkt_cab, a.marca_reg
        FROM #VentasCabeceraTmp b
        INNER JOIN tmpvta a
            ON b.canalventa = a.ccom_3a AND b.correlativo = a.ncom_3a AND a.periodo = b.periodo

        -- Procesar otros documentos (no 007)
        TRUNCATE TABLE #VentasCabeceraTmp
        
        INSERT INTO #VentasCabeceraTmp
        SELECT 
            b.canalventa, b.correlativo, FORMAT(b.fecha, 'MM'), FORMAT(b.fecha, 'yyyy')
        FROM ventascabecera b
        WHERE b.periodo = @año AND b.fecha = @hoy AND b.tipodocumento <> '007'
        
        INSERT INTO ventasdetalle
        SELECT 
            a.ccom_3a, a.ncom_3a, a.linea_3a, a.cant_3a, a.pvta1_3a, a.dsct1_3a,
            CAST(a.vvta1_3a AS NUMERIC(18,2)), CAST(a.igv1_3a AS NUMERIC(18,2)),
            CAST(a.tot1_3a AS NUMERIC(18,2)), a.flag_3a, a.porper_3a,
            CAST(a.monper_3a AS NUMERIC(18,2)), CAST(a.totper_3a AS NUMERIC(18,2)),
            0, b.periodo,
            CONCAT(CAST(b.periodo AS VARCHAR(4)), CAST(a.ccom_3a AS NVARCHAR(3)), CAST(a.ncom_3a AS NVARCHAR(8))),
            b.fecha, a.tipimp_3a, a.aigv_3a, a.id_mkt_cab, a.marca_reg
        FROM VentasCabeceraTmp b WITH (NOLOCK)
        INNER JOIN tmpvta a
            ON b.canalventa = a.ccom_3a AND b.correlativo = a.ncom_3a AND a.periodo = b.periodo
    END
    ```    