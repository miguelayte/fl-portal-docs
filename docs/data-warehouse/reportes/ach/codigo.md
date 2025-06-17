```sql title="job_email_ACH_2024.sql" linenums="1"
USE [passareladwh]
GO

ALTER PROCEDURE [dbo].[job_email_ACH_2024] AS
BEGIN
	SET XACT_ABORT ON
	
	/**************************/
	-- Tarea: Variables Globales
	/**************************/
	BEGIN
		DECLARE @fechhoy DATE = DATEADD(DAY, 0, GETDATE())
		SET @fechhoy='2025-06-08'
		
		DECLARE @fechhoyCopia       DATE = @fechhoy,
		        @fechhoyCopiaSF     VARCHAR(8) = FORMAT(@fechhoy, 'yyyyMMdd');
		
		DECLARE @fecha VARCHAR(200) = FORMAT(@fechhoy, 'yyyy-MM-dd')
		DECLARE @fecha2 VARCHAR(200) = FORMAT(@fechhoy, 'yyyyMMdd')
		
		SELECT @fechhoy [@fechhoy], @fechhoyCopia [@fechhoyCopia], @fechhoyCopiaSF [@fechhoyCopiaSF], @fecha [@fecha], @fecha2 [@fecha2];
		
		
		DECLARE @email VARCHAR(MAX) = N'',
		        @asunto VARCHAR(200) = ('ACH01 Avance de ventas mínimas hoy ' + @fecha + ' ...resúmen (SIN IGV)')
		
		DECLARE @tableHTML        VARCHAR(MAX),
		        @Body             VARCHAR(MAX),
		        @tableHTMLSup     VARCHAR(MAX)
		
		DECLARE @rownumber        INT = NULL,
		        @supervisor       VARCHAR(200) = NULL,
		        @montosup         NUMERIC(18, 2),
		        @cuotasup         NUMERIC(18, 2),
		        @cuotadetsup      NUMERIC(18, 2),
		        @avanceparsup     NUMERIC(8, 2),
		        @avanceaccsup     NUMERIC(8, 2);
		        
		---------------------------------------------------
		-- OPEN QUERY PARAMETERS
		---------------------------------------------------
		DECLARE @OpenQuery         VARCHAR(MAX)
			   ,@Script            VARCHAR(MAX)
			   ,@LinkedServer      VARCHAR(MAX)
			   ,@TempTableName     VARCHAR(100)

		SET @LinkedServer = 'SERVNPROD'
		        
	END
	
	
	/*******************************/
	-- Tarea: Obtener Datos - Datazen
	/*******************************/
	--- Creación de tablas temporales
	BEGIN
		IF OBJECT_ID('tempdb..#tmpSupervisor01') IS NOT NULL
		    DROP TABLE #tmpSupervisor01;
		IF OBJECT_ID('tempdb..#tmpVentas') IS NOT NULL
		    DROP TABLE #tmpVentas;
		IF OBJECT_ID('tempdb..#Reportev0') IS NOT NULL
		    DROP TABLE #Reportev0;
		IF OBJECT_ID('tempdb..#Reportev1') IS NOT NULL
		    DROP TABLE #Reportev1;
		IF OBJECT_ID('tempdb..#Reportev2') IS NOT NULL
		    DROP TABLE #Reportev2;
		IF OBJECT_ID('tempdb..#ReporteSupervisorAgrupado') IS NOT NULL
		    DROP TABLE #ReporteSupervisorAgrupado;
		IF OBJECT_ID('tempdb..#tipoventa_mediopago') IS NOT NULL
		    DROP TABLE #tipoventa_mediopago;
		IF OBJECT_ID('tempdb..#TProyecciones') IS NOT NULL
		    DROP TABLE #TProyecciones;

		CREATE TABLE #TProyecciones
		(
			canal             VARCHAR(200),
			subcanal          VARCHAR(200),
			medioventa        VARCHAR(200),
			Supervisor        VARCHAR(200),
			monto             DECIMAL(10, 2),
			fecha             VARCHAR(10),
			margen            DECIMAL(10, 4),
			utilidad          DECIMAL(10, 4),
			Par               INT,
			Acc               INT,
			id_medioventa     INT,
			email             VARCHAR(200)
		)

		CREATE TABLE #tmpVentas
		(
			[serienumero]     [nvarchar](13) NULL,
			[tienda]          [nvarchar](5) NULL,
			[vendedor]        [nvarchar](6) NULL,
			[fecha]           [nvarchar](20) NULL,
			[sku]             [nvarchar](11) NULL,
			[cantidad]        FLOAT NULL,
			[monto]           FLOAT NULL,
			[cantpar]         INT NULL,
			[cantacc]         INT NULL,
			[unegocioid]      INT NULL,
			[unegocio]        [nvarchar](50) NULL,
			[canal]           VARCHAR(50) NULL,
			[subcanal]        VARCHAR(100) NULL,
			[medioventa]      VARCHAR(100) NULL,
			[asesorventa]     VARCHAR(200) NULL,
			[costo]           FLOAT NULL,
			[utilidad]        AS (monto -costo),
			[margen]          AS ((monto -costo) / NULLIF(monto, 0))
		)		
		
		CREATE TABLE #Reportev0
		(
			[id_canal]     INT NULL,
			[venta]           FLOAT NULL,
			[costo]           [float] NULL,
			[cuota]           FLOAT NULL,
			[fecha]           [date] NOT NULL,
			[canal]           [varchar](50) NULL,
			[cantpar]         INT NULL,
			[cantacc]         INT NULL,
			[cuotapar]        INT NULL,
			[cuotaacc]        INT NULL,
			[ntran]           INT NULL,
			[utilidad]        AS (venta -costo),
			[margen]          AS ((venta -costo) / NULLIF(venta, 0))
		)	
		
		CREATE TABLE #Reportev1
		(
			[canal]          VARCHAR(200) NULL,
			[subcanal]       VARCHAR(200) NULL,
			[medioventa]     VARCHAR(200) NULL,
			[venta]          FLOAT NULL,
			[costo]          [float] NULL,
			[cuota]          FLOAT NULL,
			[fecha]          [date] NOT NULL,
			[cantpar]        INT NULL,
			[cantacc]        INT NULL,
			[cuotapar]       INT NULL,
			[cuotaacc]       INT NULL,
			[ntran]          INT NULL,
			[montoAcc]		 FLOAT NULL,
			[utilidad]        AS (venta -costo),
			[margen]          AS ((venta -costo) / NULLIF(venta, 0))
		)	
		
		CREATE TABLE #Reportev2
		(
			[canal]          VARCHAR(200) NULL,
			[subcanal]       VARCHAR(200) NULL,
			[medioventa]     VARCHAR(200) NULL,
			[venta]          FLOAT NULL,
			[costo]          FLOAT NULL,
			[cuota]          FLOAT NULL,
			[supervisor]     [nvarchar](255) NULL,
			[avance]         FLOAT NULL,
			[fecha]          [date] NOT NULL,
			[nomtiend]       [varchar](200) NULL,
			[cantpar]        INT NULL,
			[cantacc]        INT NULL,
			[cuotapar]       INT NULL,
			[cuotaacc]       INT NULL,
			[avancepar]      INT NULL,
			[avanceacc]      INT NULL,
			[ntran]          INT NULL,
			[utilidad]        AS (venta -costo),
			[margen]          AS ((venta -costo) / NULLIF(venta, 0)),
			[montoAcc]		 FLOAT NULL,
		)	
		
		CREATE TABLE #ReporteSupervisorAgrupado
		(
			[venta]          FLOAT NULL,
			[cuota]          FLOAT NULL,
			[avance]         FLOAT NULL,
			[fecha]          [date] NOT NULL,
			[supervisor]     [nvarchar](255) NULL,
			[cantpar]        INT NULL,
			[cantacc]        INT NULL,
			[cuotapar]       INT NULL,
			[cuotaacc]       INT NULL,
			[avancepar]      FLOAT NULL,
			[avanceacc]      FLOAT NULL
		)

		CREATE TABLE #Tipoventa_mediopago
		(
			[TIPODOC]         VARCHAR(3) NULL,
			[SERIE]           VARCHAR(4) NULL,
			[NRODOC]          VARCHAR(10) NULL,
			[MEDIOPAGOID]     VARCHAR(10) NOT NULL,
			[TIPODEVENTA]     VARCHAR(255) NULL,
			[Rank]            INT NULL
		)

		CREATE TABLE #tmpSupervisor01
		(
			canal          VARCHAR(200) null,
			subcanal       VARCHAR(200) null,
			medioventa     VARCHAR(200) null,
			supervisor     VARCHAR(200) null,
			email          VARCHAR(100) null
		)

	END
	
	INSERT INTO #TProyecciones
	(
		canal,
		subcanal,
		medioventa,
		Supervisor,
		monto,
		fecha,
		margen,
		utilidad,
		Par,
		Acc,
		id_medioventa,
		email
	)
    SELECT tc.canal,
			ts.subcanal,
			tm.medioventa,
-- 			p.Supervisor,
			s.nombre AS [Supervisor],
			p.monto,
			p.fecha,
			p.margen,
			p.utilidad,
			p.Par,
			p.Acc,
			p.id_medioventa,
			s.email
	 FROM   proyecciones              AS p
			INNER JOIN tb_medioventa  AS tm
				 ON  tm.id_medioventa = p.id_medioventa
			INNER JOIN tb_subcanal    AS ts
				 ON  ts.id_subcanal = tm.id_subcanal
			INNER JOIN tb_canal       AS tc
				 ON  tc.id_canal = ts.id_canal
			LEFT JOIN (SELECT DISTINCT SUBSTRING(s.canalventa,2,2) AS canalventa, s.nombre, s.email FROM supervisor s) AS s ON s.canalventa = p.canalventa
	 WHERE  p.fecha = @fechhoyCopiaSF
	 AND tc.id_canal IN (1,4)
	 AND s.email IS NOT NULL
	 AND tm.estado=1
	 
	 UNION ALL
	 
   SELECT tc.canal,
			ts.subcanal,
			tm.medioventa,
			p.Supervisor,
			p.monto,
			p.fecha,
			p.margen,
			p.utilidad,
			p.Par,
			p.Acc,
			p.id_medioventa,
			CASE 
			    WHEN p.Supervisor='Magda Vilchez' THEN 'magda.vilchez@footloose.pe'
			    WHEN p.Supervisor='Pia Praeli' THEN 'pia.praeli@footloose.pe'
				WHEN p.Supervisor='Luigi Lujan' THEN 'luigi.lujan@footloose.pe'
			    ELSE ''
			END AS email
	 FROM   proyecciones              AS p
			INNER JOIN tb_medioventa  AS tm
				 ON  tm.id_medioventa = p.id_medioventa
			INNER JOIN tb_subcanal    AS ts
				 ON  ts.id_subcanal = tm.id_subcanal
			INNER JOIN tb_canal       AS tc
				 ON  tc.id_canal = ts.id_canal
	 WHERE  p.fecha = @fechhoyCopiaSF
	 AND tc.id_canal IN (2,3,5)
	 AND tm.estado=1;

 	INSERT INTO #tmpSupervisor01
 	(
 		canal,
 		subcanal,
 		medioventa,
 		supervisor,
 		email
 	)
	SELECT DISTINCT
		t.canal,
		t.subcanal,
		t.medioventa,
		t.Supervisor,
		t.email
	FROM
		#TProyecciones AS t
	inner join supervisor_unicos as su on su.email=t.email	/*FIX (MA: 2024-05-21)*/
	where su.estado=1	/*FIX (MA: 2024-05-21)*/

	INSERT INTO #Tipoventa_mediopago
	SELECT m1.TIPODOC,
		   m1.SERIE,
		   m1.NRODOC,
		   m1.MEDIOPAGOID,
		   m1.TIPODEVENTA,
		   m1.[Rank]
	FROM   (
			   SELECT DISTINCT m.TIPODOC,
					  m.SERIE,
					  m.NRODOC,
					  m.MEDIOPAGOID,
					  m.TIPODEVENTA,
					  RANK() OVER(
						  PARTITION BY m.TIPODOC,
						  m.SERIE,
						  m.NRODOC,
						  m.TIPODEVENTA ORDER BY m.TIPODOC,
						  m.SERIE,
						  m.NRODOC,
						  m.MEDIOPAGOID,
						  m.TIPODEVENTA DESC
					  ) AS RANK
			   FROM   servnprod.bd_passarela.dbo.view_tipoventa_mediopago_DWH AS m WITH(NOLOCK)
			   WHERE  m.FECHA = @fechhoy
		   ) AS m1
	WHERE  m1.[Rank] = 1;

	
	/*
	* Proceso:		Venta
	* Evento:		Inserción de ventas a un temporal
	* Objetivo:	Manejar datos de Ventas del Día
	*/
select serienumero,tienda,sku, monto from #tmpVentas as v

	INSERT INTO #tmpVentas
	  (
	    serienumero,
	    tienda,
	    vendedor,
	    fecha,
	    sku,
	    cantidad,
	    monto,
	    cantpar,
	    cantacc,
	    unegocioid,
	    unegocio,
	    canal,
	    subcanal,
	    medioventa,
	    asesorventa,
	    costo
	  )
	SELECT (a.sfactu_3 + '' + a.nfactu_3) AS serienumero
	       ,
	       a.tienda_3                     AS tienda,
	       a.fichv_3                      AS vendedor,
	       dbo.fx_convertToFechahora(a.fcom_3,gloa_3) AS fecha,
	       linea_3a                       AS sku,
	       CASE WHEN a.tidoc_3 = '007' THEN -1 * cant_3a ELSE cant_3a END AS cantidad,
	       CAST(
	           (
	               CASE 
	                    WHEN a.tidoc_3 = '007' THEN -1 * b.vvta1_3a
	                    ELSE b.vvta1_3a
	               END
	           ) AS NUMERIC(18, 2)
	       )                              AS monto,
	       CASE 
	            WHEN t.aplicapercepcion = 'PARES' THEN CASE 
	                                                        WHEN a.tidoc_3 = '007' THEN -1 * cant_3a
	                                                        ELSE cant_3a
	                                                   END
	            ELSE 0
	       END                            AS cantpar,
	       CASE 
	            WHEN t.aplicapercepcion = 'ACCESORIOS' AND p.precio > 8 THEN CASE 
	                                                                              WHEN a.tidoc_3 = '007' THEN -1 *
	                                                                                   cant_3a
	                                                                              ELSE cant_3a
	                                                                         END
	            ELSE 0
	       END                            AS cantacc,
	       ff.unegocioid,
	       ff2.descripcion                AS unegocio,
		   ff2.descripcion AS canal,
		   CASE WHEN ff.unegocioid=1 THEN 'Clientes Tienda' ELSE ff4.subcanal END AS subcanal,
       ff.nomb_16f AS medioventa,
       va.nombre AS asesorventa,
       CASE WHEN a.tidoc_3 = '007' THEN -1 * cant_3a ELSE cant_3a END * p.preciocosto AS costo          	       
	FROM   servnprod.bd_passarela.dbo.fag0300 a --WITH(NOLOCK)
	       INNER JOIN servnprod.bd_passarela.dbo.fap0300 b --WITH(NOLOCK)
	            ON  a.transacabid = b.transacabid--a.ncom_3=b.ncom_3a AND a.ccom_3=b.ccom_3a AND a.periodo = b.periodo
	       LEFT JOIN vw_Producto p WITH(NOLOCK)
	            ON  p.[producto] = b.[linea_3a]
	       LEFT JOIN tipoarticulo t WITH(NOLOCK)
	            ON  t.[tipoarticulo] = p.[tipoarticulo]
	       LEFT JOIN servnprod.bd_passarela.dbo.fag1600_FACTU AS ff
	            ON  ff.tipov_16f = a.tipov_3 AND ISNULL(ff.tipov_16f,'')!=''
	       LEFT JOIN servnprod.bd_passarela.dbo.fag1602_FACTU AS ff2
	            ON  ff2.unegocioid = ff.unegocioid
	       LEFT JOIN servnprod.bd_passarela.dbo.fag1600_FACTU AS ff3
	            ON  ff3.tipov_16f = a.alicom_3 AND ISNULL(ff3.tipov_16f,'')!=''
            LEFT JOIN servnprod.bd_passarela.dbo.fag1604_FACTU AS ff4
                ON  ff4.id_subcanal = ff.id_subcanal
	       LEFT JOIN servnprod.bd_passarela.dbo.PERSONA AS va ON va.CODIGO = a.fichv_3
-- 		   LEFT JOIN #Tipoventa_mediopago AS c
-- 				ON  a.tidoc_3 = c.TIPODOC
-- 				AND a.sfactu_3 = c.SERIE
-- 				AND a.nfactu_3 = c.NRODOC	            
	WHERE  a.fcom_3 = @fechhoyCopia
	       --AND ISNULL(a.anticipo_3 ,0)!=2 /* MA: 2025-06-02  */
	       AND a.flag_3 = '1'
	       AND ff.unegocioid IN (1,2,3,4,5)
				AND NOT EXISTS
				(
						SELECT 1 AS Expr1
						FROM   dbo.tb_productos_excluidos AS tpe
						WHERE  (tpe.producto=b.[linea_3a])
				)
				AND NOT EXISTS
						(
								SELECT 1 AS Expr1
								FROM   dbo.tb_series_excluidas AS tse
								WHERE  (tse.serie=a.sfactu_3)
						)
	       AND NOT (b.tipimp_3a='9996' AND b.aigv_3a='12')
		   /* MA: 2025-06-02, se agrega bloque de filtro de manejo de anticipos
		   *  - Se consideran todas lastransacciones comunes
		   *  - Las de anticipo:
		   *  -   No se considera la factura de anticipo
		   *  -   Se considera la factura de cierre
		   *  -   No se considera la factura de consumo del anticipo siempre que tenga referencia
		   */
			AND case 
					when a.anticipo_3=1 then 0
					when a.anticipo_3=2 then 1
					when a.anticipo_3=3 then case when isnull(a.nfactur_3,'')!='' then 1 else 0 end 
					else 1
				end = 1
	;


	/*
	* Evento:		Inserta info a tabla de avance de ventas
	* Objetivo:	Manejar y mostrar los avances
	*/
	
	INSERT INTO #Reportev0
	  (
	    id_canal,
	    venta,
	    costo,
	    cuota,
	    fecha,
	    canal,
	    cantpar,
	    cantacc,
	    cuotapar,
	    cuotaacc,
	    ntran
	  )
	SELECT x.id_canal                   AS id_canal,
	       SUM(x.venta)                   AS venta,
	       SUM(x.costo)                   AS costo,
	       SUM(x.cuota)                   AS cuota,
	       x.fecha                        AS fecha,
	       x.canal                        AS canal,
	       SUM(x.cantpar)                 AS cantpar,
	       SUM(x.cantacc)                 AS cantacc,
	       SUM(x.cuotapar)                AS cuotapar,
	       SUM(x.cuotaacc)                AS cuotaacc,
	       COUNT(DISTINCT x.serienumero)  AS ntran
	FROM   (
	           SELECT 
	                  CASE 
	                      WHEN a.canal='Retail' THEN 1
	                      WHEN a.canal='Catálogo' THEN 2
	                      WHEN a.canal='E-Commerce' THEN 3
	                      WHEN a.canal='Ventas Asistidas' THEN 4
	                      WHEN a.canal='B2B' THEN 5
	                      ELSE 1
	                  END AS id_canal,
	                  a.monto  AS venta,
	                  a.costo  AS costo,
	                  '0'      AS cuota,
	                  c.Fecha,
	                  a.canal,
	                  a.cantpar,
	                  a.cantacc,
	                  0        AS cuotapar,
	                  0        AS cuotaacc,
	                  a.serienumero
	           FROM   #tmpVentas a
	                  INNER JOIN TiempoVersus c
	                       ON  a.fecha = c.Fecha
	           WHERE  1 = 1
	                  AND a.fecha BETWEEN @fechhoyCopia AND @fechhoyCopia
	           UNION ALL
	           SELECT 
	                  CASE 
	                       WHEN a.canalventa = 'C3' THEN 5
	                       WHEN a.canalventa = 'D6' THEN CASE 
	                                                          WHEN tt.id_grupo = 3 THEN 3
	                                                          WHEN tt.id_grupo = 2 THEN 2
	                                                          WHEN tt.id_grupo = 5 THEN 4
	                                                          ELSE 3
	                                                     END
	                       WHEN a.canalventa = '65' THEN 2
	                       WHEN a.canalventa != '65' AND tt.id_grupo = 2 THEN 2
	                       ELSE 1
	                  END         id_canal,
	                  0        AS venta,
	                  a.costo  AS costo,
	                  0        AS cuota,
	                  b.Fecha,
	                  CASE 
	                       WHEN a.canalventa = 'C3' THEN 'B2B'
	                       WHEN a.canalventa = 'D6' THEN CASE 
	                                                          WHEN tt.id_grupo = 3 THEN 'E-Commerce'
	                                                          WHEN tt.id_grupo = 2 THEN 'Catálogo'
	                                                          WHEN tt.id_grupo = 5 THEN 'Ventas Asistidas'
	                                                          ELSE 'E-Commerce'
	                                                     END
	                       WHEN a.canalventa = '65' THEN 'Catálogo'
	                       WHEN a.canalventa != '65' AND tt.id_grupo = 2 THEN 'Catálogo'
	                       ELSE 'Retail'
	                  END         canal,
	                  0        AS cantpar,
	                  0        AS cantacc,
	                  0        AS cuotapar,
	                  0        AS cuotaacc,
	                  NULL     AS serienumero
	           FROM   CostoSH a
	                  INNER JOIN TiempoVersus b
	                       ON  a.fechask = b.idFecha
	                  INNER JOIN tb_tipoventa AS tt
	                       ON  tt.id_tipoventa = a.id_tipoventa
	           WHERE  1 = 1
	                  AND a.fechask BETWEEN @fechhoyCopiaSF AND @fechhoyCopiaSF
	           --AND p.monto<>0
	           UNION ALL
			   SELECT tc.id_canal,
			          0             AS venta,
			          0             AS costo,
			          SUM(p.monto)  AS cuota,
			          p.fecha,
			          tc.canal,
			          0             AS cantpar,
			          0             AS cantacc,
					  SUM(p.Par)    AS cuotapar,
					  SUM(p.Acc)    AS cuotaacc,
			          NULL          AS serienumero
			   FROM   proyecciones  AS p
			          INNER JOIN tb_medioventa AS tm
			               ON  tm.id_medioventa = p.id_medioventa
			          INNER JOIN tb_subcanal AS ts
			               ON  ts.id_subcanal = tm.id_subcanal
			          INNER JOIN tb_canal AS tc
			               ON  tc.id_canal = ts.id_canal
			          INNER JOIN TiempoVersus AS tv
			               ON  tv.idFecha = p.fecha
			   WHERE  1 = 1
			          AND p.fecha BETWEEN @fechhoyCopiaSF AND @fechhoyCopiaSF
			   GROUP BY tc.id_canal, p.fecha, tc.canal
	) AS x
	GROUP BY x.id_canal, x.fecha, x.canal
	;
	
	/*
	* Evento:		Inserta info a tabla de avance de ventas
	* Objetivo:	Manejar y mostrar los avances
	*/
	
	INSERT INTO #Reportev1
	  (
	    canal,
	    subcanal,
	    medioventa,
	    venta,
	    costo,
	    cuota,
	    fecha,
	    cantpar,
	    cantacc,
	    cuotapar,
	    cuotaacc,
	    ntran,
		montoAcc
	  )
	SELECT x.canal       AS canal,
	       x.subcanal    AS subcanal,
	       x.medioventa  AS medioventa,
	       SUM(x.venta)                   AS venta,
	       SUM(x.costo)                   AS costo,
	       SUM(x.cuota)                   AS cuota,
	       x.fecha                        AS fecha,
	       SUM(x.cantpar)                 AS cantpar,
	       SUM(x.cantacc)                 AS cantacc,
	       SUM(x.cuotapar)                AS cuotapar,
	       SUM(x.cuotaacc)                AS cuotaacc,
	       COUNT(DISTINCT x.serienumero)  AS ntran,
		   SUM(x.montoAcc) AS montoAcc
	FROM   (
	           SELECT 
	                  a.canal,
	                  a.subcanal,
	                  CASE 
	                      WHEN a.canal='E-Commerce' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      WHEN a.canal='Catálogo' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      WHEN a.canal='Ventas Asistidas' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      ELSE a.tienda
	                  END AS medioventa,
	                  SUM(a.monto)   AS venta,
	                  SUM(a.costo)   AS costo,
	                  '0'       AS cuota,
	                  c.Fecha,
	                  SUM(a.cantpar) AS cantpar,
	                  SUM(a.cantacc) AS cantacc,
	                  0         AS cuotapar,
	                  0         AS cuotaacc,
	                  a.serienumero,
					  0 AS montoAcc
	           FROM   #tmpVentas a
	                  INNER JOIN tienda b
	                       ON  a.tienda = b.tienda
	                  INNER JOIN TiempoVersus c
	                       ON  a.fecha = c.Fecha
	           WHERE  1 = 1
	                  AND a.fecha BETWEEN @fechhoyCopia AND @fechhoyCopia
	           GROUP BY a.canal, a.subcanal, CASE 
	                      WHEN a.canal='E-Commerce' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      WHEN a.canal='Catálogo' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      WHEN a.canal='Ventas Asistidas' THEN CASE 
	                                                       WHEN a.tienda='D6' THEN a.medioventa
	                                                       ELSE a.tienda
	                                                   END
	                      ELSE a.tienda
	                  END, c.Fecha, a.serienumero
	           UNION ALL
	           SELECT
	                  tc.canal,
	                  ts.subcanal,
	                  tm.medioventa AS medioventa,
	                  0         AS venta,
	                  0         AS costo,
	                  SUM(a.monto)   AS cuota,
	                  c.Fecha   AS fecha,
	                  0         AS cantpar,
	                  0         AS cantacc,
	                  SUM(a.Par)     AS cuotapar,
	                  SUM(a.Acc)     AS cuotaacc,
	                  NULL      AS serienumero,
					  SUM(a.VtaAcc) AS montoAcc
	           FROM   proyecciones a
	                  INNER JOIN TiempoVersus c
	                       ON  a.fecha = c.idFecha
	                  INNER JOIN tb_medioventa AS tm ON tm.id_medioventa = a.id_medioventa
	                  INNER JOIN tb_subcanal AS ts
	                            ON ts.id_subcanal = tm.id_subcanal
	                  INNER JOIN tb_canal AS tc ON tc.id_canal = ts.id_canal
	           WHERE  1 = 1
	                  AND a.fecha BETWEEN @fechhoyCopiaSF AND @fechhoyCopiaSF
	           GROUP BY tc.canal, ts.subcanal, tm.medioventa, c.Fecha
 	       )  x
 	GROUP BY x.canal, x.subcanal, x.medioventa, x.fecha

	/*
	* Evento:		Formatear info de catalogo (26,65)
	* Objetivo:	Mostrar la data de la tienda correcta
	*/
	BEGIN
	IF OBJECT_ID('tempdb..#tmpX') IS NOT NULL
	    DROP TABLE #tmpX;
	CREATE TABLE #tmpX
	(
		canalventa     VARCHAR(5),
		tienda         VARCHAR(5),
		monto          NUMERIC(12, 4),
		fecha          VARCHAR(8)
	)
	
	INSERT INTO #tmpX
	  (
	    canalventa,
	    tienda,
	    monto,
	    fecha
	  )
	SELECT canalventa           AS canalventa,
	       LEFT(canalventa, 2)  AS tienda,
	       monto                AS monto,
	       fecha                AS fecha
	FROM   proyecciones         AS p
	WHERE  p.fecha = @fechhoyCopiaSF
	       AND p.canalventa IN ('65-c', '26-c') 
		
	END
	
	--UPDATE	b
	--SET		b.cuota = a.monto
	--FROM	#tmpX a
	--		INNER  JOIN Reportev1 b ON a.tienda=b.tienda
	
	/*
	* Evento:		Inserta info a tabla de avance de ventas
	* Objetivo:	Manejar y mostrar los avances
	*/
	
	INSERT INTO #Reportev2
	(
		canal,
		subcanal,
		medioventa,
		venta,
		costo,
		cuota,
		supervisor,
		avance,
		fecha,
		cantpar,
		cantacc,
		cuotapar,
		cuotaacc,
		avancepar,
		avanceacc,
		ntran,
		montoAcc
	)
	SELECT a.canal,
	       a.subcanal,
	       a.medioventa,
	       a.venta       AS venta,
	       a.costo       AS costo,
	       a.cuota       AS cuota,
	       c.supervisor  AS supervisor,
	       IIF(a.cuota < 5, 1.00, a.venta / a.cuota) AS avance,
-- 	       CASE 
-- 	            WHEN a.venta < 1 THEN 0
-- 	            ELSE (a.venta -a.costo * 1.18) / a.venta
-- 	       END           AS margen,
	       a.fecha       AS fecha,
	       a.cantpar,
	       a.cantacc,
	       a.cuotapar,
	       a.cuotaacc,
	       IIF(a.cuotapar < 1, 0.00, a.cantpar / a.cuotapar) AS avancepar,
	       IIF(a.cuotaacc < 1, 0.00, a.cantacc / a.cuotaacc) AS avanceacc,
	       a.ntran,
		   a.montoAcc
	FROM   #Reportev1 a
	       LEFT JOIN #tmpSupervisor01 c
	            ON  c.canal = a.canal
	            AND c.subcanal = a.subcanal
	            AND c.medioventa = a.medioventa
	WHERE  1 = 1

 	
	/*
	* Evento:		Inserta info a tabla de avance por supervisor
	* Objetivo:	Manejar y mostrar los avances por supervisor
	*/
	INSERT INTO #ReporteSupervisorAgrupado
	  (
	    venta,
	    cuota,
	    avance,
	    fecha,
	    supervisor,
	    cantpar,
	    cantacc,
	    cuotapar,
	    cuotaacc,
	    avancepar,
	    avanceacc
	  )
	SELECT SUM(x.venta)     AS venta,
	       SUM(x.cuota)     AS cuota,
	       CASE 
	            WHEN SUM(x.venta) < 20 THEN 0
	            ELSE CASE 
	                      WHEN SUM(x.cuota) < 20 THEN 0
	                      ELSE SUM(x.venta) / SUM(x.cuota)
	                 END
	       END              AS avance,
	       x.fecha          AS fecha,
	       x.supervisor     AS supervisor,
	       SUM(X.cantpar)   AS cantpar,
	       SUM(X.cantacc)   AS cantacc,
	       SUM(X.cuotapar)  AS cuotapar,
	       SUM(X.cuotaacc)  AS cuotaacc,
	       IIF(
	           SUM(X.cuotapar) < 20,
	           0.00,
	           SUM(X.cantpar) / SUM(X.cuotapar)
	       )                AS avancepar,
	       IIF(
	           SUM(X.cuotaacc) < 20,
	           0.00,
	           SUM(X.cantacc) / SUM(X.cuotaacc)
	       )                AS avanceacc
	FROM   (
	           SELECT venta,
	                  cuota,
	                  avance,
	                  supervisor,
	                  fecha,
	                  cantpar,
	                  cantacc,
	                  cuotapar,
	                  cuotaacc
	           FROM   #Reportev2
	           --WHERE  tienda NOT IN ('26-C', '65-C')
	       )                   x
	GROUP BY
	       supervisor,
	       fecha;
	
	DECLARE @ventas       NUMERIC(18, 2) = (
	            SELECT SUM(venta)
	            FROM   #Reportev2
	        ) --(SELECT SUM(venta) FROM Reportev2 WHERE fecha = @fecha)
	        ,
	        @cuota        NUMERIC(18, 2) = (
	            SELECT SUM(monto)
	            FROM   proyeccionesUN
	            WHERE  fecha = @fecha2
	        ),
	        @cantpar      INT = (
	            SELECT SUM(cantpar)
	            FROM   #Reportev2
	        ),
	        @cuotapar     INT = (
	            SELECT SUM(cuotapar)
	            FROM   #Reportev2
	        ),
	        @cantacc      INT = (
	            SELECT SUM(cantacc)
	            FROM   #Reportev2
	        ),
	        @cuotaacc     INT = (
	            SELECT SUM(cuotaacc)
	            FROM   #Reportev2
	        )

	SET @cuota = ISNULL(@cuota,0.00);
	SET @cuotapar = ISNULL(@cuotapar,0.00);
	SET @cuotaacc = ISNULL(@cuotaacc,0.00);
	
	DECLARE @avance        VARCHAR(200) = FORMAT(
	            CASE 
	                 WHEN @ventas < 100 THEN 0
	                 ELSE CASE 
	                           WHEN @cuota < 20 THEN 100
	                           ELSE @ventas * 100 / @cuota
	                      END
	            END,
	            'N0',
	            'es-pe'
	        ) 

	DECLARE @avancepar     VARCHAR(200) = FORMAT(
	            CASE 
	                 WHEN @cantpar < 1 THEN 0
	                 ELSE CASE 
	                           WHEN @cuotapar < 1 THEN 100
	                           ELSE @cantpar * 100 / @cuotapar
	                      END
	            END,
	            'N0',
	            'es-pe'
	        )
	
	DECLARE @avanceacc     VARCHAR(200) = FORMAT(
	            CASE 
	                 WHEN @cantacc < 1 THEN 0
	                 ELSE CASE 
	                           WHEN @cuotaacc < 1 THEN 100
	                           ELSE @cantacc * 100 / @cuotaacc
	                      END
	            END,
	            'N0',
	            'es-pe'
	        ) 
	
	/**********************************/
	-- Tarea: Eliminar tablas Temporales
	/**********************************/
	IF OBJECT_ID('tempdb..#TmpAvanceUN') IS NOT NULL
	    DROP TABLE #TmpAvanceUN;
	IF OBJECT_ID('tempdb..#TmpAvanceSupervisor') IS NOT NULL
	    DROP TABLE #TmpAvanceSupervisor;
	IF OBJECT_ID('tempdb..#TmpVentaCuota') IS NOT NULL
	    DROP TABLE #TmpVentaCuota;
	IF OBJECT_ID('tempdb..#TmpVentaCuotas') IS NOT NULL
	    DROP TABLE #TmpVentaCuotas;
	IF OBJECT_ID('tempdb..#tmpSupervisor') IS NOT NULL
	    DROP TABLE #tmpSupervisor;
	IF OBJECT_ID('tempdb..#TmpAvanceSupervisores') IS NOT NULL
	    DROP TABLE #TmpAvanceSupervisores;
	IF OBJECT_ID('tempdb..#tmpSupervisores') IS NOT NULL
	    DROP TABLE #tmpSupervisores;
	
	/******************************/
	-- Tarea: Creación de Temporales
	/******************************/
	CREATE TABLE #TmpAvanceUN
	(
		canal          VARCHAR(200),
		venta          FLOAT,
		cuota          FLOAT,
		avance         FLOAT,
		rownumber      TINYINT,
		bgcolor        VARCHAR(10),
		[costo]        FLOAT NULL,
		[utilidad]     AS (venta -costo),
		[margen]       AS ((venta -costo) / NULLIF(venta, 0)),
		[margen2]      VARCHAR(20)
	)
	CREATE TABLE #TmpAvanceSupervisor
	(
		supervisor      VARCHAR(MAX),
		venta           FLOAT,
		cuota           FLOAT,
		avance          FLOAT,
		[cantpar]       INT NULL,
		[cantacc]       INT NULL,
		[cuotapar]      INT NULL,
		[cuotaacc]      INT NULL,
		[avancepar]     FLOAT NULL,
		[avanceacc]     FLOAT NULL,
		rownumber       TINYINT,
		bgcolor         VARCHAR(10),
		[costo]        FLOAT NULL,
		[utilidad]     AS (venta -costo),
		[margen]       AS ((venta -costo) / NULLIF(venta, 0)),
		[margen2]      VARCHAR(20),
		[montoAcc]		 FLOAT NULL
	)
	CREATE TABLE #TmpVentaCuotas
	(
		canal           VARCHAR(200),
		subcanal        VARCHAR(200),
		medioventa      VARCHAR(200),
		total           FLOAT,
		cuota           FLOAT,
		avance          FLOAT,
		[cantpar]       INT NULL,
		[cantacc]       INT NULL,
		[cuotapar]      INT NULL,
		[cuotaacc]      INT NULL,
		[avancepar]     FLOAT NULL,
		[avanceacc]     FLOAT NULL,
		ntran           INT,
		[costo]         FLOAT NULL,
		[utilidad]      AS (total -costo),
		[margen]        AS ((total -costo) / NULLIF(total, 0))
	)

	CREATE TABLE #TmpVentaCuota
	(
		canal           VARCHAR(200),
		subcanal        VARCHAR(200),
		medioventa      VARCHAR(200),
		total           FLOAT,
		cuota           FLOAT,
		avance          FLOAT,
		[cantpar]       INT NULL,
		[cantacc]       INT NULL,
		[cuotapar]      INT NULL,
		[cuotaacc]      INT NULL,
		[avancepar]     FLOAT NULL,
		[avanceacc]     FLOAT NULL,
		hora            VARCHAR(8),
		NTRAN           INT,
		TRAF_TOTAL      INT,
		TKAVG           FLOAT,
		RATIO_CONV      FLOAT,
		bgcolor         VARCHAR(10),
		[costo]         FLOAT NULL,
		[utilidad]      AS (total -costo),
		[margen]        AS ((total -costo) / NULLIF(total, 0)),
		[margen2]       VARCHAR(20)
	)
	CREATE TABLE #tmpSupervisor
	(
		supervisor     VARCHAR(50),
		rownumber      TINYINT
	)
	CREATE TABLE #TmpAvanceSupervisores
	(
		supervisor     VARCHAR(50),
		email          VARCHAR(100),
		avance         NUMERIC(10, 6),
		rownumber      TINYINT
	)
	CREATE TABLE #tmpSupervisores
	(
		supervisor     VARCHAR(50),
		rownumber      TINYINT,
		email          VARCHAR(100)
	)
	
	
	/***********************************/
	-- Tarea: Avance Por Unidad de Negocio
	/***********************************/
	BEGIN
		INSERT INTO #TmpAvanceUN
		  (
		    canal,
		    venta,
		    cuota,
		    avance,
		    costo,
		    rownumber
		  )
		SELECT ISNULL(t2.canal, 'Retail') AS canal,
		       t2.venta,
		       t2.cuota,
		       t2.avance,
		       t2.costo,
		       ROW_NUMBER() OVER(ORDER BY t2.avance ASC) AS rownumber
		FROM   (
		           SELECT canal,
		                  IIF(venta < 20, 0, venta) AS venta,
		                  IIF(cuota < 20, 0, cuota) AS cuota,
		                  CASE 
		                       WHEN venta < 20 THEN 0
		                       ELSE CASE 
		                                 WHEN cuota < 20 THEN 100
		                                 ELSE venta * 100 / cuota
		                            END
		                  END  AS avance,
		                  costo
		           FROM   (
		                      SELECT r.canal,
		                             SUM(ISNULL(r.venta,0)) AS venta,
		                             SUM(ISNULL(r.cuota,0)) AS cuota,
		                             SUM(ISNULL(r.costo,0)) AS costo
		                      FROM   #Reportev0 AS r
		                      GROUP BY
		                             r.canal
		                  )    AS t1
		       ) AS t2
		GROUP BY
		       t2.canal,
		       t2.venta,
		       t2.cuota,
		       t2.avance,
		       t2.costo
		ORDER BY
		       3
		

		UPDATE t
		SET    t.bgcolor = CASE 
		                        WHEN avance < 90 THEN '#FFE5F4' /* ROJO */
		                        ELSE CASE 
		                                  WHEN avance < 100 THEN '#FFBF00' /* AMBAR */
		                                  ELSE '#00FF40' /* VERDE */
		                             END
		                   END
		FROM   #TmpAvanceUN AS t
		

		UPDATE t SET    bgcolor = '#F78181'
		FROM #TmpAvanceUN AS t
		WHERE t.margen < 0.30;

		UPDATE t SET t.margen2 = FORMAT(margen,'##.0%')
		FROM #TmpAvanceUN AS t
		                 
		
		SET @Body = '';
		
		SET @tableHTML = N'<html>'+
						 N'<head>'+
							 N'<style type="text/css">'+
								 N'.tg  {border-collapse:collapse;border-spacing:0;height:10px;}'+
								 --N'table, td, th {border: 1px solid #3f4449;}'+
								 --N'table th {background-color: #2C76DF;color: white;}'+
								 N'.tg td{font-family:Arial, sans-serif;font-size:14px;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#2C76DF;}'+
								 N'.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#2C76DF;}'+
								 N'.tg .tg-f7xs{font-weight:bold;background-color:#ed1c24;color:#ffffff;border-color:#ed1c24;text-align:center;vertical-align:top}'+
								 N'.tg .tg-d4sb{background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-f60r{background-color:#e26b0a;border-color:#e26b0a;text-align:center;vertical-align:top}'+
								 N'.tg .tg-ubmm{background-color:#ffc7ce;color:#9c0006;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-9m3w{font-weight:bold;background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-pksw{font-weight:bold;background-color:#f79646;color:#ffffff;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-pesd{border-color:#c0c0c0;vertical-align:top}'+
								 N'.tg .tg-fkia{font-weight:bold;background-color:#FFDD00;color:#000000;border-color:#FFDD00;text-align:center;vertical-align:top}'+
								 N'.tg .tg-fzdr{border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-o0c0{background-color:#ffeb9c;color:#cf7e00;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-rfq8{background-color:#c6efce;color:#226c49;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-7l0w{font-weight:bold;background-color:#e26b0a;color:#ffffff;border-color:#e26b0a;text-align:center;vertical-align:top}'+
								 N'.tg .tg-ecu-blue{font-weight:bold;background-color:#034ea2;color:#ffffff;border-color:#034ea2;text-align:center;vertical-align:top}'+
								 N'.tg .tg-grey{font-weight:bold;background-color:#3f4449;color:#ffffff;border-color:#034ea2;text-align:center;vertical-align:top}'+
							 N'</style>'+
						 N'</head>'+
						 N'<body>';
						 
		SET @tableHTML += 
		    N'<H1>El total de las ventas del presente dia es de ' + CAST(FORMAT(@ventas, 'N0', 'es-pe') AS VARCHAR) 
		    + IIF(
		        ISNULL(@avance, '100') = '100',
		        ' ',
		        '. Teniendo como avance de cuota ' + ISNULL(@avance, '') + '% '
		    ) + '</H1>' +
		    N'<H2>Resumen de Avance por Canal de Venta</H2>';
		
		
		SELECT @Body = @Body + '<table class="tg" style="undefined;table-layout: fixed; width: 800px">' +

					N'<colgroup>' +
		            N'<col style="width:200px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:80px">' +
					N'</colgroup>' +

		      N'<tr>'+
						N'<td  class="tg-grey" >Canal de Venta</td>' +
						N'<td  class="tg-grey" >Venta</td>' +
						N'<td  class="tg-grey" >VtaMín</td>' +
						N'<td  class="tg-grey" >%Avance</td>'+
						N'<td  class="tg-grey" >%Margen</td>'+
				  N'</tr>'

		SELECT @Body = @Body + (
		           SELECT [td/@bgcolor] = T1.[bgcolor],
		                  td = t1.[canal],
		                  '',
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[venta], 'N0', 'es-pe'),
		                  '',
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cuota], 'N0', 'es-pe'),
		                  '',
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[avance], 'N0', 'es-pe') + '%',
		                  '',
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = t1.[margen2],
		                  ''
		           FROM   #TmpAvanceUN AS t1 
		                  FOR XML PATH('tr') ---- instead of for xml raw(tr), element
		       ) + '</table>';
		
		-- 		 SET @tableHTML+= @Body+
		-- 						  N'</body></html>';
		
		SET @tableHTML += @Body;
		
	END

	/***********************************/
	-- Tarea: Avance General - Supervisor
	/***********************************/
	BEGIN
		INSERT INTO #TmpAvanceSupervisor
		  (
		    supervisor,
		    venta,
		    cuota,
		    avance,
		    cantpar,
		    cantacc,
		    cuotapar,
		    cuotaacc,
		    avancepar,
		    avanceacc,
		    rownumber,
		    costo,
			montoAcc
		  )
		SELECT t2.supervisor,
		       t2.venta,
		       t2.cuota,
		       t2.avance,
		       t2.cantpar,
		       t2.cantacc,
		       t2.cuotapar,
		       t2.cuotaacc,
		       t2.avancepar,
		       t2.avanceacc,
		       ROW_NUMBER() OVER(ORDER BY t2.avancepar ASC) AS rownumber,
		       t2.costo,
			   t2.montoAcc
		FROM   (
		           SELECT supervisor,
		                  IIF(venta < 20, 0, venta) AS venta,
		                  IIF(cuota < 20, 0, cuota) AS cuota,
						  montoAcc,
		                  CASE 
		                       WHEN venta < 20 THEN 0
		                       ELSE CASE 
		                                 WHEN cuota < 20 THEN 100
		                                 ELSE venta * 100 / cuota
		                            END
		                  END  AS avance,
		                  IIF(cantpar < 1, 0, cantpar) AS cantpar,
		                  IIF(cantacc < 1, 0, cantacc) AS cantacc,
		                  IIF(cuotapar < 1, 0, cuotapar) AS cuotapar,
		                  IIF(cuotaacc < 1, 0, cuotaacc) AS cuotaacc,
		                  CASE 
		                       WHEN cantpar < 1 THEN 0
		                       ELSE CASE 
		                                 WHEN cuotapar < 1 THEN 100
		                                 ELSE cantpar * 100 / cuotapar
		                            END
		                  END  AS avancepar,
		                  CASE 
		                       WHEN cantacc < 1 THEN 0
		                       ELSE CASE 
		                                 WHEN cuotaacc < 1 THEN 100
		                                 ELSE cantacc * 100 / cuotaacc
		                            END
		                  END  AS avanceacc,
		                  t1.costo
		           FROM   (
		                      SELECT supervisor,
		                             SUM(ISNULL(venta,0)) AS venta,
		                             SUM(ISNULL(cuota,0)) AS cuota,
		                             SUM(ISNULL(cantpar,0)) AS cantpar,
		                             SUM(ISNULL(cantacc,0)) AS cantacc,
		                             SUM(ISNULL(cuotapar,0)) AS cuotapar,
		                             SUM(ISNULL(cuotaacc,0)) AS cuotaacc,
		                             SUM(ISNULL(costo,0)) AS costo,
									 SUM(ISNULL(montoAcc,0)) AS montoAcc
		                      FROM   #Reportev2
		                             --WHERE  supervisor NOT IN ('Nuevo','Juan Diego La Rosa')
		                      WHERE  supervisor NOT IN ('Nuevo')
		                      GROUP BY
		                             supervisor
		                  )    AS t1
		       ) AS t2
		GROUP BY
		       t2.supervisor,
		       t2.venta,
		       t2.cuota,
		       t2.avance,
		       t2.cantpar,
		       t2.cuotapar,
		       t2.cantacc,
		       t2.cuotaacc,
		       t2.avancepar,
		       t2.avanceacc,
		       t2.costo,
			   t2.montoAcc
		ORDER BY
		       3

		UPDATE t
		SET    t.bgcolor = CASE 
		                        WHEN avance < 90 THEN '#FFE5F4' /* ROJO */
		                        ELSE CASE 
		                                  WHEN avance < 100 THEN '#FFBF00' /* AMBAR */
		                                  ELSE '#00FF40' /* VERDE */
		                             END
		                   END
		FROM   #TmpAvanceSupervisor AS t

		UPDATE t SET    bgcolor = '#F78181'
		FROM #TmpAvanceSupervisor AS t
		WHERE t.margen < 0.30;

		UPDATE t SET t.margen2 = FORMAT(margen,'##.0%')
		FROM #TmpAvanceSupervisor AS t
		
		SET @tableHTML +=
		    N'<H1>' + /*IIF(@avancepar = '100', ' ',*/
		        '. Teniendo como avance de calzados ' + @avancepar + '% '
		    /*)*/ + IIF(
		        @avanceacc = '100',
		        ' ',
		        ' y avance de accessorios ' + @avanceacc + '% '
		    ) + '</H1>' +
		    N'<H2>Resumen de Avance por Supervisor</H2>';
				
		SELECT @Body = '<table class="tg" style="undefined;table-layout: fixed; width: 800px">' +

					N'<colgroup>' +
								N'<col style="width:200px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
								N'<col style="width:60px">' +
					N'</colgroup>' +

					N'<tr>'+
							N'<td class="tg-grey" >Supervisor</td>' +
							N'<td class="tg-grey" >Venta - Soles</td>' +
							N'<td class="tg-grey" >VtaMín - Soles</td>' +
							N'<td class="tg-grey" >%Avance - Soles</td>' +
							N'<td class="tg-grey" >Venta - Pares</td>' +
							N'<td class="tg-grey" >VtaMín - Pares</td>' +
							N'<td class="tg-grey" >%Avance - Pares</td>' +
							N'<td class="tg-grey" >Acces</td>' +
							N'<td class="tg-grey" >AccVtaMín - Pares</td>' +
							N'<td class="tg-grey" >%Avance</td>' +
							N'<td class="tg-grey" >%Margen</td>' +
					N'</tr>'
		
		/*
			CREATE TABLE #TmpAvanceSupervisor
			(
				supervisor      VARCHAR(MAX),
				venta           FLOAT,
				cuota           FLOAT,
				avance          FLOAT,
				[cantpar]       INT NULL,
				[cantacc]       INT NULL,
				[cuotapar]      INT NULL,
				[cuotaacc]      INT NULL,
				[avancepar]     FLOAT NULL,
				[avanceacc]     FLOAT NULL,
				rownumber       TINYINT,
				bgcolor         VARCHAR(10),
				[costo]        FLOAT NULL,
				[utilidad]     AS (venta -costo),
				[margen]       AS ((venta -costo) / NULLIF(venta, 0)),
				[margen2]      VARCHAR(20)
			)
		*/
		SELECT @Body = @Body + (
		           SELECT 
						  --Supervisor
						  [td/@bgcolor] = T1.[bgcolor],
		                  td = t1.[supervisor],
		                  '',

						  --Venta - Soles
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[venta], 'N0', 'es-pe'),
		                  '',

						  --VtaMín - Soles
						  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cuota], 'N0', 'es-pe'),
		                  '',

						  --%Avance - Soles
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT( ROUND(((t1.[venta] / nullif(t1.[cuota],0)) * 100), 0), 'N0', 'es-pe') + '%',
		                  '',

						  --Venta - Pares
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cantpar], 'N0', 'es-pe'),
		                  '',				  

						  --VtaMín - Pares
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cuotapar], 'N0', 'es-pe'),
		                  '',	
						  
						  --%Avance - Pares
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(ROUND(t1.[avancepar], 0), 'N0', 'es-pe') + '%',
		                  '',

						  --Acces
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cantacc], 'N0', 'es-pe'),
		                  '',

						  --AccVtaMín - Pares
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[cuotaacc], 'N0', 'es-pe'),
		                  '',

						  --
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = FORMAT(t1.[avanceacc], 'N0', 'es-pe') + '%',
		                  '',
		                  [td/@align] = 'right',
		                  [td/@bgcolor] = T1.[bgcolor],
		                  td = t1.[margen2],
		                  ''
		           FROM   #TmpAvanceSupervisor AS t1 
		           WHERE t1.supervisor NOT IN ('Ruth Vásquez','W CierraPuertas','Jessica La Rosa','Antony Morales')
		           --WHERE t1.cuota>0
		                  FOR XML PATH('tr') ---- instead of for xml raw(tr), element
		       ) + '</table>';
		--SELECT * FROM #TmpAvanceSupervisor
		SET @tableHTML += @Body +
		    N'</body></html>';

		--------------------------
		-- Enviar Correo
		--------------------------
		--SET @email = N'Miguel Vergara <miguel.vergara@footloose.pe>;'
		--   +N'Raúl Vergara <raul.vergara@footloose.pe>;'
		--   +N'Valeria Vergara <valeria.vergara@footloose.pe>;'
		--   +N'John Valle <john.valle@footloose.pe>;'
		--   +N'Gabriela Ñahuis <gabriela.nahuis@footloose.pe>;'
		--   +N'Cesar Jimenez<cesar.jimenez@footloose.pe>;'
		--   +N'Erick Loarte<erick.loarte@footloose.pe>;'
		--   +N'Maria Sevillano<analista.comercial@footloose.pe>;'
		--   +N'Ruth Vasquez <ruth.vasquez@footloose.pe>;'
		--   +N'Muriel Catacora <muriel.catacora@footloose.pe>;'
		--   +N'Virginia Vergara <virginia.vergara@footloose.pe>;'
		--   +N'Irene Aquino <irene.aquino@footloose.pe>;'
		--   +N'Orlando Córdova <orlando.cordova@footloose.pe>;'
		--   +N'Anderson Naveda <anderson.naveda@footloose.pe>;'
		--   +N'Magda Vilchez <magda.vilchez@footloose.pe>;'
		--   +N'Isabel Yovera <isabel.yovera@footloose.pe>;'
		--   +N'Tesorería <tesoreria@footloose.pe>;'
		--   +N'Nillmer Capacyachi <nillmer.capacyachi@footloose.pe>;'
		--   +N'Alexander Ríos <alexander.rios@footloose.pe>;'
		--   +N'Jaritza Yanayaco <jaritza.yanayaco@footloose.pe>;'
		--   +N'Cristian Lachira <cristian.lachira@footloose.pe>;'
		--   +N'Elvis Orbezo <elvis.orbezo@footloose.pe>;'
		--   +N'Analista ECommerce <analista.ecommerce@footloose.pe>;'
		--   +N'Felipe Flores <felipe.flores@footloose.pe>;'   
		--   +N'Aldo Barco <aldo.barco@footloose.pe>;'   
		--   +N'Walter Rimac <walter.rimac@footloose.pe>;'   
		--   +N'Jannoh Aquije <jannoh.aquije@footloose.pe>;'

		--EXEC msdb.dbo.sp_send_dbmail 
		--     @profile_name='DBA_Passarela'
		--    ,@recipients= 'ach.info@footloose.pe' --@email
		--	--,@recipients= 'alertas.ti@footloose.pe'
		--    ,@subject=@asunto
		--    ,@body=@tableHTML
		--    ,@blind_copy_recipients='<rony.janampa@footloose.pe>;'
		--    ,@body_format='HTML';

		SELECT @tableHTML AS [@tableHTML];

	END

	/**********************************/
	-- Proceso: Avance de Venta - Tienda
	/**********************************/
	BEGIN
		SET @asunto = ('ACH02 Avance de ventas mínimas hoy ' + @fecha) + ' ...por tienda (SIN IGV)'
		INSERT INTO #TmpVentaCuotas
		  (
		    canal,
		    subcanal,
		    medioventa,
		    total,
		    cuota,
		    avance,
		    cantpar,
		    cantacc,
		    cuotapar,
		    cuotaacc,
		    avancepar,
		    avanceacc,
		    ntran,
		    costo
		  )
		SELECT x.canal,x.subcanal,x.medioventa,
		       SUM(x.total)     AS total,
		       SUM(x.cuota)     AS cuota,
		       CAST(
		           (
		               (
		                   CASE 
		                        WHEN SUM(x.total) = 0 THEN 0
		                        ELSE SUM(x.total) / (IIF(SUM(x.cuota) <= 1, SUM(x.total), SUM(x.cuota))) * 100
		                   END
		               )
		           )
		           AS NUMERIC(18, 2)
		       )                AS avance,
		       SUM(x.cantpar)   AS cantpar,
		       SUM(x.cantacc)   AS cantacc,
		       SUM(x.cuotapar)  AS cuotapar,
		       SUM(x.cuotaacc)  AS cuotaacc,
		       CAST(
		           CASE 
		                WHEN SUM(x.cantpar) < 1 THEN 0
		                ELSE CASE 
		                          WHEN SUM(x.cuotapar) < 1 THEN 100
		                          ELSE SUM(x.cantpar) * 100 / SUM(x.cuotapar)
		                     END
		           END AS DECIMAL(8, 2)
		       )                AS avancepar,
		       CAST(
		           CASE 
		                WHEN SUM(x.cantacc) < 1 THEN 0
		                ELSE CASE 
		                          WHEN SUM(x.cuotaacc) < 1 THEN 100
		                          ELSE SUM(x.cantacc) * 100 / SUM(x.cuotaacc)
		                     END
		           END AS DECIMAL(8, 2)
		       )                AS avancepar,
		       SUM(x.ntran)     AS ntran,
		       SUM(x.costo) AS costo
		FROM   (
		           SELECT v.canal,
		                  v.subcanal,
		                  v.medioventa,
		                  v.venta  AS total,
		                  0      AS cuota,
		                  v.cantpar,
		                  v.cantacc,
		                  0      AS cuotapar,
		                  0      AS cuotaacc,
		                  v.ntran,
		                  v.costo
		           FROM   #Reportev2 v
		                  INNER JOIN #tmpSupervisor01 su
		                       ON  su.canal = v.canal
		                       AND su.subcanal = v.subcanal
		                       AND su.medioventa = v.medioventa
		           WHERE  v.fecha = @fecha
		           
		           UNION ALL
		           
		           SELECT p.canal,
		                  p.subcanal,
		                  p.medioventa,
		                  0               AS total,
		                  monto           AS cuota,
		                  0               AS cantpar,
		                  0               AS cantacc,
		                  Par             AS cuotapar,
		                  Acc             AS cuotaacc,
		                  0               AS ntran,
		                  0 AS costo
		           FROM   #Tproyecciones  AS p
		           WHERE  fecha = @fecha2
		       )                   x
		GROUP BY
		       canal,subcanal,medioventa;
		
		---------------------------
		-- Obtener última trasacción - Tienda
		---------------------------
		INSERT INTO #TmpVentaCuota
		  (
		    canal,
		    subcanal,
		    medioventa,
		    total,
		    cuota,
		    avance,
		    cantpar,
		    cantacc,
		    cuotapar,
		    cuotaacc,
		    avancepar,
		    avanceacc,
		    hora,
		    NTRAN,
		    TRAF_TOTAL,
		    TKAVG,
		    RATIO_CONV,
		    costo
		  )
		SELECT ven.canal, ven.subcanal, ven.medioventa,
		       IIF(ISNULL(ven.total,0) < 20, 0, ven.total) AS total,
		       IIF(ISNULL(ven.cuota,0) < 20, 0, ven.cuota) AS cuota,
		       ISNULL(ven.avance,0)      AS avance,
		       IIF(ISNULL(ven.cantpar,0) < 1, 0, ven.cantpar) AS cantpar,
		       IIF(ISNULL(ven.cantacc,0) < 1, 0, ven.cantacc) AS cantacc,
		       IIF(ISNULL(ven.cuotapar,0) < 1, 0, ven.cuotapar) AS cuotapar,
		       IIF(ISNULL(ven.cuotaacc,0) < 1, 0, ven.cuotaacc) AS cuotaacc,
		       ISNULL(ven.avancepar,0)          AS avancepar,
		       ISNULL(ven.avanceacc,0)          AS avanceacc,
		       (
		           SELECT TOP 1      gloa_3
		           FROM   servnprod.bd_passarela.dbo.fag0300 fact WITH (NOLOCK)
		           WHERE  fact.tienda_3 = ven.medioventa
		                  AND fact.fcom_3 = @fecha
		           ORDER BY
		                  gloa_3     DESC
		       )                      AS hora,
		       CASE 
		            WHEN pf.NTRAN IS NULL THEN ven.[ntran]
		            ELSE pf.NTRAN
		       END                    AS NTRAN,
		       pf.TRAF_TOTAL,
		       pf.TKAVG,
		       pf.RATIO_CONV,
		       ven.costo
		FROM  #TmpVentaCuotas ven
		       LEFT JOIN poken_fecha  AS pf
		            ON  pf.tienda = ven.medioventa
		            AND pf.FECHA = @fechhoy
		--WHERE ti.tienda NOT IN ('D6','E9')	
		
		UPDATE #TmpVentaCuota
		SET    bgcolor = CASE 
		                      WHEN avancepar < 90 THEN '#FFE5F4' /*rojo*/
		                      ELSE CASE 
		                                WHEN avancepar < 100 THEN '#FFBF00' /*ambar*/
		                                ELSE '#00FF40' /*verde*/
		                           END
		                 END;
		                 
		UPDATE t SET    bgcolor = '#F78181'
		FROM #TmpVentaCuota AS t
		WHERE t.margen < 0.30;

		UPDATE t SET t.margen2 = FORMAT(margen,'##.0%')
		FROM #TmpVentaCuota AS t
		
		-- Tarea: Lista de Supervisores
		INSERT INTO #tmpSupervisor
		  (
		    supervisor,
		    rownumber
		  )
		SELECT DISTINCT supervisor,
		       rownumber
		FROM   #TmpAvanceSupervisor
		--WHERE supervisor NOT IN ('Juan Diego La Rosa')
		
		SET @rownumber = (
		        SELECT MIN(rownumber)
		        FROM   #tmpSupervisor
		    )

		---------------------------
		-- Presentación de correo - Avance Supervisor
		---------------------------
		SET @Body = '';
		
-- 		SET @tableHTML = 
-- 		    N'	<html>
-- 					<head>
-- 						<style type="text/css">
-- 							h1 {color:red;}
-- 							p {color:blue;}
-- 							table, td, th {border: 1px solid #2C76DF;}
-- 							table {border-collapse: collapse;}
-- 							table th {background-color: #2C76DF;color: white;}
-- 							tr:nth-child(even) {background-color: #f2f2f2}
-- 							table tr:nth-child(1) {text-align: left;}
-- 							tr td:nth-child(n+3) {text-align: right;}
-- 						</style>
-- 					</head>
-- 					<body>'

		SET @tableHTML = N'<html>'+
						 N'<head>'+
							 N'<style type="text/css">'+
								 N'.tg  {border-collapse:collapse;border-spacing:0;height:10px;}'+
								 --N'table, td, th {border: 1px solid #3f4449;}'+
								 --N'table th {background-color: #2C76DF;color: white;}'+
								 N'.tg td{font-family:Arial, sans-serif;font-size:14px;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#2C76DF;}'+
								 N'.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#2C76DF;}'+
								 N'.tg .tg-f7xs{font-weight:bold;background-color:#ed1c24;color:#ffffff;border-color:#ed1c24;text-align:center;vertical-align:top}'+
								 N'.tg .tg-d4sb{background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-f60r{background-color:#e26b0a;border-color:#e26b0a;text-align:center;vertical-align:top}'+
								 N'.tg .tg-ubmm{background-color:#ffc7ce;color:#9c0006;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-9m3w{font-weight:bold;background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-pksw{font-weight:bold;background-color:#f79646;color:#ffffff;border-color:#f79646;text-align:center;vertical-align:top}'+
								 N'.tg .tg-pesd{border-color:#c0c0c0;vertical-align:top}'+
								 N'.tg .tg-fkia{font-weight:bold;background-color:#FFDD00;color:#000000;border-color:#FFDD00;text-align:center;vertical-align:top}'+
								 N'.tg .tg-fzdr{border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-o0c0{background-color:#ffeb9c;color:#cf7e00;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-rfq8{background-color:#c6efce;color:#226c49;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
								 N'.tg .tg-7l0w{font-weight:bold;background-color:#e26b0a;color:#ffffff;border-color:#e26b0a;text-align:center;vertical-align:top}'+
								 N'.tg .tg-ecu-blue{font-weight:bold;background-color:#034ea2;color:#ffffff;border-color:#034ea2;text-align:center;vertical-align:top}'+
								 N'.tg .tg-grey{font-weight:bold;background-color:#3f4449;color:#ffffff;border-color:#034ea2;text-align:center;vertical-align:top}'+
							 N'</style>'+
						 N'</head>'+
						 N'<body>';

		SET @rownumber = (
			SELECT COUNT(DISTINCT supervisor)
			FROM   #TmpVentaCuota AS T1
		            INNER JOIN #tmpSupervisor01 AS s
		                ON  s.canal = T1.canal
		                    AND s.subcanal = T1.subcanal
		                    AND s.medioventa = T1.medioventa
		                        --ON  S.tienda = T1.tienda
		    WHERE  t1.[cuota] <> 0
		            AND NOT EXISTS (SELECT 1 FROM vw_tiendag AS vt WHERE vt.tiendag=T1.medioventa AND vt.estado='Cerr')
		)

		
		WHILE @rownumber > 0
		BEGIN
		    SELECT @supervisor = supervisor
		    FROM   #tmpSupervisor
		    WHERE  rownumber = @rownumber
		    

			IF NOT EXISTS(
				SELECT TOP 1 1 
				FROM   #TmpVentaCuota AS T1
		            INNER JOIN #tmpSupervisor01 AS s
		                ON  s.canal = T1.canal
		                    AND s.subcanal = T1.subcanal
		                    AND s.medioventa = T1.medioventa
		                        --ON  S.tienda = T1.tienda
				WHERE  S.supervisor = @supervisor AND t1.[cuota] <> 0
						--AND T1.cuota>0
						AND NOT EXISTS (SELECT 1 FROM vw_tiendag AS vt WHERE vt.tiendag=T1.medioventa AND vt.estado='Cerr')
			)
			BEGIN
				SET @rownumber = @rownumber - 1
				CONTINUE
			END

		    SET @montosup = (
		            SELECT SUM(total)
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su
		                        ON  su.canal = v.canal
		                        AND su.subcanal = v.subcanal
		                        AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )

		    SET @cuotasup = (
		            SELECT SUM(v.cuota)
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su
		                        ON  su.canal = v.canal
		                        AND su.subcanal = v.subcanal
		                        AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor)
		    
		    SET @avanceparsup = (
		            SELECT CASE 
		                        WHEN SUM(cantpar) < 1 THEN 0
		                        ELSE CASE 
		                                  WHEN ISNULL(SUM(cuotapar), 0) = 0 THEN 100
		                                  ELSE SUM(cantpar) * 100 / SUM(cuotapar)
		                             END
		                   END
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su
		                        ON  su.canal = v.canal
		                        AND su.subcanal = v.subcanal
		                        AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )
		    
		    SET @avanceaccsup = (
		            SELECT CASE 
		                        WHEN SUM(cantacc) < 1 THEN 0
		                        ELSE CASE 
		                                  WHEN ISNULL(SUM(cuotaacc), 0) = 0 THEN 100
		                                  ELSE SUM(cantacc) * 100 / SUM(cuotaacc)
		                             END
		                   END
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su
		                        ON  su.canal = v.canal
		                        AND su.subcanal = v.subcanal
		                        AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )

		    SET @cuotadetsup = CASE 
		                            WHEN ISNULL(@cuotasup, 0) < 20 THEN 100
		                            ELSE ((@montosup / @cuotasup) * 100)
		                       END 
		    
		    --SELECT @montosup [@montosup],@cuotasup [@cuotasup], @avanceparsup [@avanceparsup],@avanceaccsup [@avanceaccsup], @cuotadetsup [@cuotadetsup];
		    
		    IF (ISNULL(@montosup, 0)>0)
		    BEGIN
		        SET @tableHTML+=
		            --N'<H2>Avance de tiendas del Supervisor: '+@supervisor+ IIF(@cuotadetsup=100,'',' teniendo como avance: '+ cast(@cuotadetsup as varchar)+'%')+'</H2>'+
		            N'<H2>Avance de tiendas del Supervisor: '+@supervisor+' con venta de '+CAST(FORMAT(@montosup ,'N0' ,'es-pe') AS VARCHAR)
		           +IIF(
		                @avanceparsup=100
		               ,''
		               ,', teniendo como avance de calzados: '+CAST(FORMAT(@avanceparsup ,'N0' ,'es-pe') AS VARCHAR) 
		               +'%'+
		                ' y avance de accesorios: '+CAST(FORMAT(@avanceaccsup ,'N0' ,'es-pe') AS VARCHAR)+'%'
		            )+'</H2>' 
		        
		        SET @tableHTML+=
		            --N'<table position="" center="" border="1" cellpadding="0" cellspacing="0">'+
		            N'<table class="tg" style="undefined;table-layout: fixed; width: 1000px">'+

					N'<colgroup>' +
		            N'<col style="width:100px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:60px">' +
		            N'<col style="width:80px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:50px">' +
		            N'<col style="width:80px">' +
					N'</colgroup>' +

		            N'<tr>'+
		            N'<td class="tg-grey">Medio Venta</td>'+
		            N'<td class="tg-grey">Venta - Soles</td>'+
					N'<td class="tg-grey">VtaMín - Soles</td>'+
					N'<td class="tg-grey">%Avance - Soles</td>'+
		            N'<td class="tg-grey">Venta - Pares</td>'+
		            N'<td class="tg-grey">VtaMín - Pares</td>'+
		            N'<td class="tg-grey">%Avance - Pares</td>'+
		            N'<td class="tg-grey">Acces</td>'+
		            N'<td class="tg-grey">VtaMín</td>'+
		            N'<td class="tg-grey">%Avance</td>'+
		            N'<td class="tg-grey">%Margen</td>'+
		            N'<td class="tg-grey">Transac</td>'+
		            N'<td class="tg-grey">Personas</td>'+
		            N'<td class="tg-grey">TkProm</td>'+
		            N'<td class="tg-grey">RatConv</td>'+
		            N'<td class="tg-grey">Ultima transac.</td>'+
		            N'</tr>'+
		            CAST(
		                (
		                    SELECT [td/@align] = 'center'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = T1.[medioventa]
		                          ,N''

								  --Venta - Soles
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[total] ,'N0' ,'es-pe')
		                          ,''

								  --VtaMín - Soles
								  ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.cuota ,'N0' ,'es-pe')
		                          ,''

								  --%Avance - Soles
								  ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT( ROUND(((t1.[total] / nullif(t1.[cuota],0)) * 100), 0), 'N0', 'es-pe') + '%'
		                          ,''
								  
								  --Venta - Pares
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[cantpar] ,'N0' ,'es-pe')
		                          ,''

								  --VtaMín - Pares
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[cuotapar] ,'N0' ,'es-pe')
		                          ,''


		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = IIF(
		                               T1.[avancepar]=100
		                              ,'100%'
		                              ,FORMAT(T1.[avancepar] ,'N0' ,'es-pe')+'%'
		                           )
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[cantacc] ,'N0' ,'es-pe')
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[cuotaacc] ,'N0' ,'es-pe')
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = IIF(
		                               T1.[avanceacc]=100
		                              ,'100%'
		                              ,FORMAT(T1.[avanceacc] ,'N0' ,'es-pe')+'%'
		                           )
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = T1.[margen2]
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[NTRAN] ,'N0' ,'es-pe')
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[TRAF_TOTAL] ,'N0' ,'es-pe')
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[TKAVG] ,'N2' ,'es-pe')
		                          ,''
		                          ,[td/@align] = 'right'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = FORMAT(T1.[RATIO_CONV] ,'N2' ,'es-pe')+'%'
		                          ,''
		                          ,[td/@align] = 'center'
		                          ,[td/@bgcolor] = T1.[bgcolor]
		                          ,td = IIF(T1.hora IS NULL ,' ' ,RTRIM(T1.hora))
		                          ,''
		                    FROM   #TmpVentaCuota AS T1
		                           INNER JOIN #tmpSupervisor01 AS s
		                                ON  s.canal = T1.canal
		                                    AND s.subcanal = T1.subcanal
		                                    AND s.medioventa = T1.medioventa
		                                        --ON  S.tienda = T1.tienda
		                    WHERE  S.supervisor = @supervisor AND t1.[cuota] <> 0
		                           --AND T1.cuota>0
		                           AND NOT EXISTS (SELECT 1 FROM vw_tiendag AS vt WHERE vt.tiendag=T1.medioventa AND vt.estado='Cerr')
		                    ORDER BY
		                           T1.[avancepar] ASC
		                           FOR XML PATH('tr')
		                          ,TYPE
		                ) AS VARCHAR(MAX)
		            )+
		            N'			</table>'
		    END		    
			
		    SET @rownumber = @rownumber - 1
		END
		
		SET @tableHTML +=
		    N'		</body>
					</html>'

		---------------------------
		-- Enviar Correo
		---------------------------
-- 		SET @email = N'Miguel Vergara <miguel.vergara@footloose.pe>;'
-- 		   +N'Raúl Vergara <raul.vergara@footloose.pe>;'
-- 		   +N'Valeria Vergara <valeria.vergara@footloose.pe>;'
-- 		   +N'John Valle <john.valle@footloose.pe>;'
-- 		   +N'Gabriela Ñahuis <gabriela.nahuis@footloose.pe>;'
-- 		   +N'Cesar Jimenez<cesar.jimenez@footloose.pe>;'
-- 		   +N'Erick Loarte<erick.loarte@footloose.pe>;'
-- 		   +N'Maria Sevillano<analista.comercial@footloose.pe>;'
-- 		   +N'Ruth Vasquez <ruth.vasquez@footloose.pe>;'
-- 		   +N'Orlando Córdova <orlando.cordova@footloose.pe>;'
-- 		   +N'Anderson Naveda <anderson.naveda@footloose.pe>;'
-- 		   +N'Irene Aquino <irene.aquino@footloose.pe>;'
-- 		   +N'Magda Vilchez <magda.vilchez@footloose.pe>;'
-- 		   +N'Isabel Yovera <isabel.yovera@footloose.pe>;'
-- 		   +N'Tesorería <tesoreria@footloose.pe>;'
-- 		   +N'Alexander Ríos <alexander.rios@footloose.pe>;'
-- 		   +N'Jaritza Yanayaco <jaritza.yanayaco@footloose.pe>;'
-- 		   +N'Elvis Orbezo <elvis.orbezo@footloose.pe>;'
-- 		   +N'Analista ECommerce <analista.ecommerce@footloose.pe>;'
-- 		   +N'Felipe Flores <felipe.flores@footloose.pe>;'   
-- 		   +N'Aldo Barco <aldo.barco@footloose.pe>;'   
-- 		   +N'Walter Rimac <walter.rimac@footloose.pe>;'   
-- 		   +N'Jannoh Aquije <jannoh.aquije@footloose.pe>;'

		--EXEC msdb.dbo.sp_send_dbmail 
		--     @profile_name='DBA_Passarela'
		--    ,@recipients= 'ach.info@footloose.pe' --@email
		--	--,@recipients= 'alertas.ti@footloose.pe@footloose.pe' --@email
		--    ,@subject=@asunto
		--    ,@body=@tableHTML
		--    ,@blind_copy_recipients='<rony.janampa@footloose.pe>;'
		--    ,@body_format='HTML';
		    
		SELECT @tableHTML AS [@tableHTML];
	END
return
	/************************************/
	-- Tarea: Avance de Venta - Supervisor
	/************************************/
	BEGIN
		DECLARE @rownumbersup         INT = NULL,
		        @email_supervisor     VARCHAR(200) = NULL,
		        @rownumbermaxsup      INT = NULL
		
		INSERT INTO #TmpAvanceSupervisores
		  (
		    supervisor,
		    email,
		    avance,
		    rownumber
		  )
		SELECT t2.supervisor,
		       t2.email,
		       t2.avance,
		       ROW_NUMBER() OVER(ORDER BY avance ASC) AS rownumber
		FROM   (
		           SELECT t1.supervisor,
		                  t1.email,
		                  CASE 
		                       WHEN t1.venta < 20 THEN 0
		                       ELSE CASE 
		                                 WHEN t1.cuota < 5 THEN 100
		                                 ELSE t1.venta * 100 / t1.cuota
		                            END
		                  END  AS avance
		           FROM   (
		                      SELECT sup.supervisor,
		                             ISNULL(sup.email, '') AS email,
		                             SUM(ISNULL(rep.venta,0)) AS venta,
		                             SUM(ISNULL(rep.cuota,0)) AS cuota
		                      FROM   #Reportev2 rep
		                            INNER JOIN #tmpSupervisor01 sup ON sup.canal = rep.canal AND sup.subcanal = rep.subcanal AND sup.medioventa = rep.medioventa
		                      WHERE  ISNULL(sup.email, '') != ''
		                      GROUP BY
		                             sup.supervisor,
		                             sup.email
		                  )    AS t1
		       ) AS t2
		
		/*****************************/
		-- Tarea: Lista de Supervisores
		/*****************************/
		INSERT INTO #tmpSupervisores
		  (
		    supervisor,
		    rownumber,
		    email
		  )
		SELECT DISTINCT supervisor,
		       rownumber,
		       email
		FROM   #TmpAvanceSupervisores
		
		SET @rownumber = (
		        SELECT MIN(rownumber)
		        FROM   #tmpSupervisores
		    )
		
		SET @rownumbersup = (
		        SELECT MIN(rownumber)
		        FROM   #tmpSupervisores
		    )
		
		SET @rownumbermaxsup = (
		        SELECT MAX(rownumber)
		        FROM   #tmpSupervisores
		    )
		
		SET @rownumbersup = 0
		
		WHILE @rownumbersup <= @rownumbermaxsup
		BEGIN
		    SET @tableHTMLSup = 
		        N'	<html>
				<head>
					<style type="text/css">
						h1 {color:red;}
						p {color:blue;}
						table, td, th {border: 1px solid #2C76DF;}
						table {border-collapse: collapse;}
						table th {background-color: #2C76DF;color: white;}
						tr:nth-child(even) {background-color: #f2f2f2}
						table tr:nth-child(1) {text-align: left;}
						tr td:nth-child(n+3) {text-align: right;}
					</style>
				</head>
				<body>'
		    
		    /*************************************/
		    -- Tarea: Venta, Cuota, Avance - Tienda
		    /*************************************/
		    SET @rownumbersup = @rownumbersup + 1
		    SELECT @supervisor = supervisor,
		           @email_supervisor     = email
		    FROM   #tmpSupervisores
		    WHERE  rownumber             = @rownumbersup
		    
		    SET @montosup = (
		            SELECT ISNULL(SUM(total), '0')
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su ON su.canal = v.canal AND su.subcanal = v.subcanal AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )
		    
		    SET @cuotasup = (
		            SELECT ISNULL(SUM(cuota), '1')
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su ON su.canal = v.canal AND su.subcanal = v.subcanal AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )
		    
		    SET @cuotadetsup = CASE 
		                            WHEN @montosup < 20 THEN 0
		                            ELSE CASE 
		                                      WHEN @cuotasup < 5 THEN 100
		                                      ELSE (@montosup / @cuotasup) * 100
		                                 END
		                       END
		    
		    SET @avanceparsup = (
		            SELECT CASE 
		                        WHEN SUM(cantpar) < 1 THEN 0
		                        ELSE CASE 
		                                  WHEN ISNULL(SUM(cuotapar), 0) = 0 THEN 100
		                                  ELSE SUM(cantpar) * 100 / SUM(cuotapar)
		                             END
		                   END
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su ON su.canal = v.canal AND su.subcanal = v.subcanal AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )
		    
		    SET @avanceaccsup = (
		            SELECT CASE 
		                        WHEN SUM(cantacc) < 1 THEN 0
		                        ELSE CASE 
		                                  WHEN ISNULL(SUM(cuotaacc), 0) = 0 THEN 100
		                                  ELSE SUM(cantacc) * 100 / SUM(cuotaacc)
		                             END
		                   END
		            FROM   #TmpVentaCuota v
		                   INNER JOIN #tmpSupervisor01 su ON su.canal = v.canal AND su.subcanal = v.subcanal AND su.medioventa = v.medioventa
		            WHERE  su.supervisor = @supervisor
		        )
		    
		    SET @tableHTMLSup +=
		        --N'<H2>Avance de tiendas del Supervisor: '+@supervisor+ ' con venta de '+cast(@montosup AS VARCHAR)+IIF(@avanceparsup=100,'',', teniendo como avance de calzados: '+ cast(@avanceparsup as varchar)+'%' + ' y avance de accesorios: '+ cast(@avanceaccsup as varchar)+'%')+'</H2>'+
		        N'<H2>Avance de tiendas del Supervisor: ' + @supervisor + ' con venta de ' + CAST(@montosup AS VARCHAR) 
		        +
		        '</H2>' +
		        N'<table position="" center="" border="1" cellpadding="0" cellspacing="0">' +
		        N'<tr>' +
		        N'<td width=50px style="font-weight:bold; text-align:center; background-color:#E6E6FA">Medio Venta</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">Monto</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">Pares</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">VtaMín</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">%Avance</td>' +
		        N'<td width=50px style="font-weight:bold; text-align:right; background-color:#E6E6FA">Acces</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">VtaMín</td>' +
		        N'<td width=60px style="font-weight:bold; text-align:right; background-color:#E6E6FA">%Avance</td>' +
		        N'<td width=50px style="font-weight:bold; text-align:right; background-color:#E6E6FA">Transac</td>' +
		        N'<td width=50px style="font-weight:bold; text-align:right; background-color:#E6E6FA">Personas</td>' +
		        N'<td width=50px style="font-weight:bold; text-align:right; background-color:#E6E6FA">TkProm</td>' +
		        N'<td width=50px style="font-weight:bold; text-align:right; background-color:#E6E6FA">RatConv</td>' +
		        N'<td width=80px style="font-weight:bold; text-align:center; background-color:#E6E6FA">Ultima transac.</td>' 
		        +
		        N'</tr>' +
		        CAST(
		            (
		                SELECT [td/@align] = 'center',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = T1.[medioventa],
		                       N'',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[total], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[cantpar], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[cuotapar], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = IIF(
		                           T1.[avancepar] = 100,
		                           '-',
		                           FORMAT(T1.[avancepar], 'N0', 'es-pe') + '%'
		                       ),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[cantacc], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[cuotaacc], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = IIF(
		                           T1.[avanceacc] = 100,
		                           '-',
		                           FORMAT(T1.[avanceacc], 'N0', 'es-pe') + '%'
		                       ),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[NTRAN], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[TRAF_TOTAL], 'N0', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[TKAVG], 'N2', 'es-pe'),
		                       '',
		                       [td/@align] = 'right',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = FORMAT(T1.[RATIO_CONV], 'N2', 'es-pe') + '%',
		                       '',
		                       [td/@align] = 'center',
		                       [td/@bgcolor] = T1.[bgcolor],
		                       td = IIF(T1.hora IS NULL, ' ', RTRIM(T1.hora)),
		                       ''
		                FROM   #TmpVentaCuota AS T1
		                       INNER JOIN #tmpSupervisor01 AS S ON S.canal = T1.canal AND S.subcanal = T1.subcanal AND S.medioventa = T1.medioventa
		                WHERE  s.email = @email_supervisor
		                       AND s.supervisor = @supervisor
		                       AND T1.cuota>0
		                ORDER BY
		                       T1.[avancepar] ASC
		                       FOR XML PATH('tr'),
		                       TYPE
		            ) AS VARCHAR(MAX)
		        ) +
		        '	</table>'
		    
		    /***********/
		    /*Comentado*/
		    /***********/
		    
		    EXEC msdb.dbo.sp_send_dbmail
		         @profile_name = 'DBA_Passarela',
		         @recipients = @email_supervisor,
				 --@recipients= 'jordan.chuquimajo@footloose.pe',
		         @subject = @asunto,
		         @body = @tableHTMLSup,
		         @body_format = 'HTML';
		    
		    PRINT @tableHTMLSup
		    SET @tableHTMLSup = ''
		END
	END
	
	/**********************************/
	-- Tarea: Eliminar tablas Temporales
	/**********************************/
	IF OBJECT_ID('tempdb..#tmpVentas') IS NOT NULL
	    DROP TABLE #tmpVentas;
	IF OBJECT_ID('tempdb..#Reportev1') IS NOT NULL
	    DROP TABLE #Reportev1;
	IF OBJECT_ID('tempdb..#Reportev2') IS NOT NULL
	    DROP TABLE #Reportev2;
	IF OBJECT_ID('tempdb..#ReporteSupervisorAgrupado') IS NOT NULL
	    DROP TABLE #ReporteSupervisorAgrupado;
	IF OBJECT_ID('tempdb..#tmpX') IS NOT NULL
	    DROP TABLE #tmpX;
	
	IF OBJECT_ID('tempdb..#TmpAvanceSupervisor') IS NOT NULL
	    DROP TABLE #TmpAvanceSupervisor;
	IF OBJECT_ID('tempdb..#TmpVentaCuota') IS NOT NULL
	    DROP TABLE #TmpVentaCuota;
	IF OBJECT_ID('tempdb..#TmpVentaCuotas') IS NOT NULL
	    DROP TABLE #TmpVentaCuotas;
	IF OBJECT_ID('tempdb..#tmpSupervisor') IS NOT NULL
	    DROP TABLE #tmpSupervisor;
	IF OBJECT_ID('tempdb..#TmpAvanceSupervisores') IS NOT NULL
	    DROP TABLE #TmpAvanceSupervisores;
	IF OBJECT_ID('tempdb..#tmpSupervisores') IS NOT NULL
	    DROP TABLE #tmpSupervisores;
END

```
