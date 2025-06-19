```sql title="job_email_ACH_2024.sql" linenums="1"
USE [passareladwh]
GO
/****** Object:  StoredProcedure [dbo].[job_email_VDM_6]    Script Date: 11/06/2025 09:39:32 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		<Miguel Ayte>
-- Create date: <2020-08-12>
-- Description:	<Informe de ventas del día, en función a Costos SAP>
-- Change01:	<2023-12-28 Ventas y Costos Sin IGV>
-- =============================================

ALTER PROCEDURE [dbo].[job_email_VDM_6] AS
BEGIN
	SET NOCOUNT ON
  BEGIN /* Variables Fecha */
    DECLARE @fec DATE = DATEADD(DAY, -1, GETDATE())
		-- set @fec='2025-06-01';

    DECLARE @FechaIniTY DATE = (SELECT
                DATEADD(MONTH, DATEDIFF(MONTH, '19000101', @fec), '19000101'))
           ,@FechaFinTY DATE = (SELECT
                DATEADD(MONTH, DATEDIFF(MONTH, '18991231', @fec), '18991231'))
    DECLARE @FechaIniSFTY CHAR(8) = FORMAT(@FechaIniTY, 'yyyyMMdd')
           ,@FechaFinSFTY CHAR(8) = FORMAT(@FechaFinTY, 'yyyyMMdd')
    DECLARE @FechaIniLY DATE = (SELECT
                DATEADD(MONTH, DATEDIFF(MONTH, '19000101', DATEADD(YEAR, -1, @fec)), '19000101'))
           ,@FechaFinLY DATE = (SELECT
                DATEADD(MONTH, DATEDIFF(MONTH, '18991231', DATEADD(YEAR, -1, @fec)), '18991231'))
    DECLARE @FechaIniSFLY CHAR(8) = FORMAT(@FechaIniLY, 'yyyyMMdd')
           ,@FechaFinSFLY CHAR(8) = FORMAT(@FechaFinLY, 'yyyyMMdd')

		SELECT @fec [@fec]
					,@FechaIniTY [@FechaIniTY]
					,@FechaFinTY [@FechaFinTY]
					,@FechaIniLY [@FechaIniLY]
					,@FechaFinLY [@FechaFinLY];
  END
  
  BEGIN /* Variables de Detalle*/
		DECLARE @Fecha            DATE
		       ,@dia              INT
		       ,@NDiaSemana       VARCHAR(20)
		       ,@UndParTY         INT
		       ,@UndAccTY         INT
		       ,@VtaParTY         DECIMAL(10 ,2)
		       ,@VtaAccTY         DECIMAL(10 ,2)
		       ,@UndParLY         INT
		       ,@UndAccLY         INT
		       ,@VtaParLY         DECIMAL(10 ,2)
		       ,@VtaAccLY         DECIMAL(10 ,2)
		       ,@CtoParTY         DECIMAL(10 ,2)
		       ,@CtoAccTY         DECIMAL(10 ,2)
		       ,@CtoParLY         DECIMAL(10 ,2)
		       ,@CtoAccLY         DECIMAL(10 ,2)
		       ,@unidadTY         INT
		       ,@ventaTY          DECIMAL(10 ,2)
		       ,@unidadLY         DECIMAL(10 ,2)
		       ,@ventaLY          DECIMAL(10 ,2)
		       ,@costoTY          DECIMAL(10 ,2)
		       ,@costoLY          DECIMAL(10 ,2)
		       ,@CtaUndParTY      INT
		       ,@CtaVtaParTY      DECIMAL(10 ,2)
		       ,@CtaUndAccTY      INT
		       ,@CtaVtaAccTY      DECIMAL(10 ,2)
		       ,@CtaUndTY         INT
		       ,@CtaVtaTY         DECIMAL(10 ,2)
		       ,@UtilTY           DECIMAL(10 ,2)
		       ,@UtilLY           DECIMAL(10 ,2)
		       ,@MargenTY         DECIMAL(9 ,3)
		       ,@MargenLY         DECIMAL(9 ,3)
		       ,@DifParTYvsLY     DECIMAL(9 ,3)
		       ,@DifVtaTYvsLY     DECIMAL(9 ,3)
		       ,@DifMrgTYvsLY     DECIMAL(9 ,3)
		       ,@AvaUndParTY      DECIMAL(9 ,3)
		       ,@AvaVtaParTY      DECIMAL(9 ,3)
		       ,@AvaUndAccTY      DECIMAL(9 ,3)
		       ,@AvaVtaAccTY      DECIMAL(9 ,3)
		       ,@AvaUndTY         DECIMAL(9 ,3)
		       ,@AvaVtaTY         DECIMAL(9 ,3)

			   ,@VtaMinTY         DECIMAL(10 ,2)
			   ,@CVtaMinTY		  DECIMAL(9 ,3)
			   ,@VarVtaMinTY      DECIMAL(10 ,2)   
			   ,@CtaVtaTYMin      DECIMAL(10 ,2)   
  END
	
	BEGIN /* Variables HTML */
			DECLARE @email VARCHAR(MAX) = N'';

			DECLARE @asunto VARCHAR(100) = ''
											,@tableHTML NVARCHAR(MAX) = ''

			DECLARE @hTML_Rpt_Diario             NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AccPeq      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AccGra      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_Pares       NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_Unids       NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_Monto       NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_Util        NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_Margen      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AccPTY      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AccGTY      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_ParCTY      NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_UnidadesDif NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_MontoDif NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_UtilDif     NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_MontoCta NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AvanceCta NVARCHAR(MAX)=''
							/*Cuota Unidades Inicio*/
							,@hTML_Rpt_Diario_White       NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_CuotaPar NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_CuotaAcc NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AvanceCtaPar NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_AvanceCtaAcc NVARCHAR(MAX)=''

							,@hTML_Rpt_Diario_VtaMin NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_CVtaMin NVARCHAR(MAX)=''
							,@hTML_Rpt_Diario_VarVtaMin NVARCHAR(MAX)=''
			
			DECLARE @v_VtaTY DECIMAL(10, 2) = 0
											,@v_VarVenTY DECIMAL(19, 4) = 0 --Cambio de longitud por error de Arimetic de 7 a 19
											,@v_VtaLY DECIMAL(10, 2) = 0 
	END
	
	
	BEGIN
		--Eliminar Tabla Temporal
		IF OBJECT_ID('tempdb..#TVentas1') IS NOT NULL DROP TABLE #TVentas1 ;
		
		CREATE TABLE #TVentas1
		(
			Fecha            DATE
		   ,dia              INT
		   ,NDiaSemana       VARCHAR(20)
		   ,canal            VARCHAR(50)
		   ,tipoarticulo     VARCHAR(50)
		   ,unidadTY         INT
		   ,ventaTY          DECIMAL(10 ,2)
		   ,unidadLY         INT
		   ,ventaLY          DECIMAL(10 ,2)
		   ,costoTY          DECIMAL(10 ,2)
		   ,costoLY          DECIMAL(10 ,2)
		)
		
		INSERT INTO #TVentas1
		(
			Fecha,
			dia,
			NDiaSemana,
			canal,
			tipoarticulo,
			unidadTY,
			ventaTY,
			unidadLY,
			ventaLY,
			costoTY,
			costoLY
		)
		
		SELECT t1.Fecha
		      ,t1.Dia
		      ,t1.NDiaSemana
		      ,t1.canal
		      ,t1.tipoarticulo
		      ,SUM(t1.unidadTY) AS unidadTY
		      ,SUM(t1.ventaTY) AS ventaTY
		      ,SUM(t1.unidadLY) AS unidadLY
		      ,SUM(t1.ventaLY) AS ventaLY
		      ,SUM(ISNULL(t1.costoTY, 0)) AS costoTY
		      ,SUM(t1.costoLY) AS costoLY
		FROM   (
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			--CONCAT(vp.id_compradora,'-',c.rubro) AS rubro,
			tc.canal,
			t.aplicapercepcion AS tipoarticulo,
			--vv.cantidad as unidadTY,
			CASE 
			     WHEN vv.precio>10.01 THEN ISNULL(vv.cantidad ,0)
			     ELSE 0
			END AS unidadTY,
			vv.subtotal as ventaTY,				-- vv.totaldetalle as ventaTY
			0 AS unidadLY,
			0.00 AS ventaLY,
			vv.SAPcostodetalle AS costoTY,	-- Cast(vv.SAPcostodetalle*1.18 AS DECIMAL(10,2)) AS costoTY
			0.00 AS costoLY
		FROM
			TiempoVersus AS tv
		INNER JOIN VentasVersus2025 AS vv ON tv.idFecha=vv.idFecha
		INNER JOIN vw_Producto AS vp ON vp.producto = vv.producto
		LEFT JOIN tipoarticulo AS t ON t.tipoarticulo = vp.tipoarticulo
		--INNER JOIN compradora AS c ON c.id_compradora = vp.id_compradora
		LEFT JOIN tb_medioventa AS tm ON tm.id_medioventa = vv.id_medioventa
		LEFT JOIN tb_subcanal AS ts	ON ts.id_subcanal = tm.id_subcanal
		LEFT JOIN tb_canal AS tc ON tc.id_canal = ts.id_canal
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec
		AND tc.id_canal IN (1,2,3,4,5)
		--AND NOT (vv.tipimp_3a='9996' AND vv.aigv_3a='12')
		UNION ALL
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			--CONCAT(vp.id_compradora,'-',c.rubro) AS rubro,
			tc.canal,
			t.aplicapercepcion AS tipoarticulo,
			0 AS unidadTY,
			0.00 AS ventaTY,
			--vv.cantidad AS unidadLY,
			CASE 
			     WHEN vv.precio>=8 THEN ISNULL(vv.cantidad ,0)
			     ELSE 0
			END AS unidadLY,
			vv.subtotal as ventalY,				-- vv.totaldetalle as ventaly
			0.00 AS costoTY,
			vv.SAPcostodetalle AS costoLY	-- 0.00 AS costoLY
		FROM
			TiempoVersus AS tv
		INNER JOIN VentasVersus2024 AS vv ON tv.idFecha=vv.idFecha
		INNER JOIN vw_Producto AS vp ON vp.producto = vv.producto
		LEFT JOIN tipoarticulo AS t ON t.tipoarticulo = vp.tipoarticulo
		--INNER JOIN compradora AS c ON c.id_compradora = vp.id_compradora
		LEFT JOIN tb_medioventa AS tm ON tm.id_medioventa = vv.id_medioventa
		LEFT JOIN tb_subcanal AS ts	ON ts.id_subcanal = tm.id_subcanal
		LEFT JOIN tb_canal AS tc ON tc.id_canal = ts.id_canal
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec
		AND tc.id_canal IN (1,2,3,4,5)
		--AND NOT (vv.tipimp_3a='9996' AND vv.aigv_3a='12')
		) AS t1
		GROUP BY t1.Fecha, t1.Dia, t1.NDiaSemana, t1.canal, t1.tipoarticulo
		ORDER BY t1.Fecha, t1.Dia, t1.canal, t1.tipoarticulo

		IF OBJECT_ID('tempdb..#TVentas2') IS NOT NULL DROP TABLE #TVentas2 ;

		CREATE TABLE #TVentas2
		(
			Fecha          DATE
		   ,dia            INT
		   ,NDiaSemana     VARCHAR(20)
		   ,canal          VARCHAR(50)
		   ,UndParTY       INT
		   ,UndAccTY       INT
		   ,VtaParTY       DECIMAL(10 ,2)
		   ,VtaAccTY       DECIMAL(10 ,2)
		   ,UndParLY       INT
		   ,UndAccLY       INT
		   ,VtaParLY       DECIMAL(10 ,2)
		   ,VtaAccLY       DECIMAL(10 ,2)
		   ,CtoParTY       DECIMAL(10 ,2)
		   ,CtoAccTY       DECIMAL(10 ,2)
		   ,CtoParLY       DECIMAL(10 ,2)
		   ,CtoAccLY       DECIMAL(10 ,2)
		   ,unidadTY       AS (UndParTY+UndAccTY)
		   ,ventaTY        AS (VtaParTY+VtaAccTY)
		   ,unidadLY       AS (UndParLY+UndAccLY)
		   ,ventaLY        AS (VtaParLY+VtaAccLY)
		   ,costoTY        AS (CtoParTY+CtoAccTY)
		   ,costoLY        AS (CtoParLY+CtoAccLY)
		   
		   ,UtilTY         AS ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))
		   ,UtilLY         AS ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))
		   ,MargenTY       AS (CASE WHEN (VtaParTY+VtaAccTY)=0 THEN 0.00 ELSE ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/(VtaParTY+VtaAccTY) END)
		   ,MargenLY       AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))/(VtaParLY+VtaAccLY) END)
		   
		  ,DifParTYvsLY   AS (CASE WHEN (UndParLY)=0 THEN 0.00 ELSE ((CAST(UndParTY AS DECIMAL(10,2))/CAST(UndParLY AS DECIMAL(10,2)))-1) END)
			,DifVtaTYvsLY   AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE (((VtaParTY+VtaAccTY)-(VtaParLY+VtaAccLY))/(VtaParLY+VtaAccLY)) END)
		  ,DifMrgTYvsLY   AS (CASE WHEN ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))=0 THEN 0.00 ELSE ((((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY)))-1) END)
		   
		)

		INSERT INTO #TVentas2
		(
			Fecha,
			dia,
			NDiaSemana,
			canal,
			UndParTY,
			UndAccTY,
			VtaParTY,
			VtaAccTY,
			UndParLY,
			UndAccLY,
			VtaParLY,
			VtaAccLY,
			CtoParTY,
			CtoAccTY,
			CtoParLY,
			CtoAccLY
		)

		SELECT 
			Fecha,
			dia,
			NDiaSemana,
			canal,
		
			SUM(isnull([PARES],0)) as 'UndParTY',
			SUM(isnull([ACCESORIOS],0)) as 'UndAccTY',
			SUM(isnull([PARES1],0)) as 'VtaParTY',
			SUM(isnull([ACCESORIOS1],0)) as 'VtaAccTY',

			SUM(isnull([PARES2],0)) as 'UndParLY',
			SUM(isnull([ACCESORIOS2],0)) as 'UndAccLY',
			SUM(isnull([PARES3],0)) as 'VtaParLY',
			SUM(isnull([ACCESORIOS3],0)) as 'VtaAccLY',

			SUM(isnull([PARES4],0)) as 'CtoParTY',
			SUM(isnull([ACCESORIOS4],0)) as 'CtoAccLY',
			SUM(isnull([PARES5],0)) as 'CtoParLY',
			SUM(isnull([ACCESORIOS5],0)) as 'CtoAccLY'
		FROM (
		SELECT
			t.Fecha,
			t.dia,
			t.NDiaSemana,
			t.canal,
			t.tipoarticulo,
			t.tipoarticulo+'1' As tipoarticulo1,
			t.tipoarticulo+'2' As tipoarticulo2,
			t.tipoarticulo+'3' As tipoarticulo3,
			t.tipoarticulo+'4' As tipoarticulo4,
			t.tipoarticulo+'5' As tipoarticulo5,
			t.unidadTY,
			t.ventaTY,
			t.unidadLY,
			t.ventaLY,
			t.costoTY,
			t.costoLY
		FROM
			#TVentas1 AS t
		) AS Points
	
		-- unidadTY
		PIVOT
		(
			SUM(unidadTY)
			FOR tipoarticulo IN ([PARES],[ACCESORIOS])
		) AS pv1
		-- ventaTY
		PIVOT
		(
			SUM(ventaTY)
			FOR tipoarticulo1 IN ([PARES1],[ACCESORIOS1])
		) AS pv2
		-- unidadLY
		PIVOT
		(
			SUM(unidadLY)
			FOR tipoarticulo2 IN ([PARES2],[ACCESORIOS2])
		) AS pv3
		-- ventaLY
		PIVOT
		(
			SUM(ventaLY)
			FOR tipoarticulo3 IN ([PARES3],[ACCESORIOS3])
		) AS pv4
		-- costoTY
		PIVOT
		(
			SUM(costoTY)
			FOR tipoarticulo4 IN ([PARES4],[ACCESORIOS4])
		) AS pv5
		-- costoLY
		PIVOT
		(
			SUM(costoLY)
			FOR tipoarticulo5 IN ([PARES5],[ACCESORIOS5])
		) AS pv6
		GROUP BY 
			Fecha,
			dia,
			NDiaSemana,
			canal

		--
		-- Bloque #01

		IF OBJECT_ID('tempdb..#TVentasB1') IS NOT NULL DROP TABLE #TVentasB1 ;
		CREATE TABLE #TVentasB1
		(
			Fecha          DATE
		   ,dia            INT
		   ,NDiaSemana     VARCHAR(20)
		   ,UndParTY       INT
		   ,UndAccTY       INT
		   ,VtaParTY       DECIMAL(10 ,2)
		   ,VtaAccTY       DECIMAL(10 ,2)
		   ,UndParLY       INT
		   ,UndAccLY       INT
		   ,VtaParLY       DECIMAL(10 ,2)
		   ,VtaAccLY       DECIMAL(10 ,2)
		   ,CtoParTY       DECIMAL(10 ,2)
		   ,CtoAccTY       DECIMAL(10 ,2)
		   ,CtoParLY       DECIMAL(10 ,2)
		   ,CtoAccLY       DECIMAL(10 ,2)
		   ,unidadTY       INT
		   ,ventaTY        DECIMAL(10 ,2)
		   ,unidadLY       INT
		   ,ventaLY        DECIMAL(10 ,2)
		   ,costoTY        DECIMAL(10 ,2)
		   ,costoLY        DECIMAL(10 ,2)

		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)

		   ,UtilTY         AS ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))
		   ,UtilLY         AS ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))
		   ,MargenTY       AS (CASE WHEN (VtaParTY+VtaAccTY)=0 THEN 0.00 ELSE ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/(VtaParTY+VtaAccTY) END)
		   ,MargenLY       AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))/(VtaParLY+VtaAccLY) END)
		   ,DifParTYvsLY   AS (CASE WHEN (UndParLY)=0 THEN 0.00 ELSE ((CAST(UndParTY AS DECIMAL(10,2))/CAST(UndParLY AS DECIMAL(10,2)))-1) END)
		   ,DifVtaTYvsLY   AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE (((VtaParTY+VtaAccTY)-(VtaParLY+VtaAccLY))/(VtaParLY+VtaAccLY)) END)
		   ,DifMrgTYvsLY   AS (CASE WHEN ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))=0 THEN 0.00 ELSE ((((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY)))-1) END)

		   ,AvaUndParTY     AS (CASE WHEN (CtaUndParTY)=0 THEN 0.00 ELSE (CAST(UndParTY AS DECIMAL(10,2))/CAST(CtaUndParTY AS DECIMAL(10,2))) END)
		   ,AvaVtaParTY     AS (CASE WHEN (CtaVtaParTY)=0 THEN 0.00 ELSE (VtaParTY/CtaVtaParTY) END)
		   ,AvaUndAccTY     AS (CASE WHEN (CtaUndAccTY)=0 THEN 0.00 ELSE (CAST(UndAccTY AS DECIMAL(10,2))/CAST(CtaUndAccTY AS DECIMAL(10,2))) END)
		   ,AvaVtaAccTY     AS (CASE WHEN (CtaVtaAccTY)=0 THEN 0.00 ELSE (VtaAccTY/CtaVtaAccTY) END)
		   ,AvaUndTY        AS (CASE WHEN (CtaUndTY)=0 THEN 0.00 ELSE (CAST(unidadTY AS DECIMAL(10,2))/CAST(CtaUndTY AS DECIMAL(10,2))) END)
		   ,AvaVtaTY        AS (CASE WHEN (CtaVtaTY)=0 THEN 0.00 ELSE (ventaTY/CtaVtaTY) END)
		)
	
		IF OBJECT_ID('tempdb..#TProyeccion') IS NOT NULL DROP TABLE #TProyeccion ;
		CREATE TABLE #TProyeccion
		(
			Fecha           DATE
		   ,dia             INT
		   ,NDiaSemana      VARCHAR(20)
		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)
		)

		INSERT INTO #TProyeccion
		(
			Fecha,
			dia,
			NDiaSemana,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			SUM(vpv.Par) AS CtaUndParTY,
			SUM(vpv.VtaPar_TY) AS CtaVtaParTY,
			SUM(vpv.Acc) AS CtaUndAccTY,
			SUM(vpv.VtaAcc_TY) AS CtaVtaAccTY,
			SUM(vpv.Par)+SUM(vpv.Acc) AS CtaUndTY,
			--SUM(IIF(vpv.monto = 0, 1, vpv.monto)) AS CtaVtaTY
			SUM(vpv.monto) AS CtaVtaTY
		FROM
			TiempoVersus AS tv
		INNER JOIN vw_proyecciones_TY AS vpv ON vpv.Fecha = tv.FechaSK
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec
		GROUP BY tv.Fecha, tv.Dia, tv.NDiaSemana
		
		--SELECT * FROM #TProyeccion
		--SELECT * FROM #TVentas1
		--return
		INSERT INTO #TVentasB1
		(
			Fecha,
			dia,
			NDiaSemana,
			UndParTY,
			UndAccTY,
			VtaParTY,
			VtaAccTY,
			UndParLY,
			UndAccLY,
			VtaParLY,
			VtaAccLY,
			CtoParTY,
			CtoAccTY,
			CtoParLY,
			CtoAccLY,
			unidadTY,
			ventaTY,
			unidadLY,
			ventaLY,
			costoTY,
			costoLY,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT tv.Fecha
		      ,tv.dia
		      ,tv.NDiaSemana
		      ,SUM(t.UndParTY)         AS UndParTY
		      ,SUM(t.UndAccTY)         AS UndAccTY
		      ,SUM(t.VtaParTY)         AS VtaParTY
		      ,SUM(t.VtaAccTY)         AS VtaAccTY
		      ,SUM(t.UndParLY)         AS UndParLY
		      ,SUM(t.UndAccLY)         AS UndAccLY
		      ,SUM(t.VtaParLY)         AS VtaParLY
		      ,SUM(t.VtaAccLY)         AS VtaAccLY
		      ,SUM(t.CtoParTY)         AS CtoParTY
		      ,SUM(t.CtoAccTY)         AS CtoAccTY
		      ,SUM(t.CtoParLY)         AS CtoParLY
		      ,SUM(t.CtoAccLY)         AS CtoAccLY
		      ,SUM(t.unidadTY)         AS unidadTY
		      ,SUM(t.ventaTY)          AS ventaTY
		      ,SUM(t.unidadLY)         AS unidadLY
		      ,SUM(t.ventaLY)          AS ventaLY
		      ,SUM(t.costoTY)          AS costoTY
		      ,SUM(t.costoLY)          AS costoLY
		      ,t2.CtaUndParTY
		      ,t2.CtaVtaParTY
		      ,t2.CtaUndAccTY
		      ,t2.CtaVtaAccTY
		      ,t2.CtaUndTY
		      ,t2.CtaVtaTY
		FROM   TiempoVersus            AS tv
		       LEFT JOIN #TVentas2     AS t
		            ON  t.Fecha = tv.Fecha
		       LEFT JOIN #TProyeccion  AS t2
		            ON  t2.Fecha = t.Fecha
		WHERE  tv.Fecha BETWEEN @FechaIniTY AND @fec
		GROUP BY
		       tv.Fecha
		      ,tv.Dia
		      ,tv.NDiaSemana
		      ,t2.CtaUndParTY
		      ,t2.CtaVtaParTY
		      ,t2.CtaUndAccTY
		      ,t2.CtaVtaAccTY
		      ,t2.CtaUndTY
		      ,t2.CtaVtaTY

		--SELECT * FROM #TVentasB1
		--RETURN
				
		DECLARE db_cursor CURSOR FOR
		SELECT
			tb.Fecha,
			tb.dia,
			tb.NDiaSemana,
			tb.UndParTY,
			IIF(tb.UndAccTY = 0, 1, tb.UndAccTY) AS UndAccTY,
			tb.VtaParTY,
			IIF(tb.VtaAccTY = 0, 1, tb.VtaAccTY) AS VtaAccTY,
			IIF(tb.UndParLY = 0, 1, tb.UndParLY) AS UndParLY,
			IIF(tb.UndAccLY = 0, 1, tb.UndAccLY) AS UndAccLY,
			tb.VtaParLY,
			IIF(tb.VtaAccLY = 0, 1, tb.VtaAccLY) AS VtaAccLY,
			tb.CtoParTY,
			IIF(tb.CtoAccTY = 0, 1, tb.CtoAccTY) AS CtoAccTY,
			IIF(tb.CtoParLY = 0, 1, tb.CtoParLY) AS CtoParLY,
			IIF(tb.CtoAccLY = 0, 1, tb.CtoAccLY) AS CtoAccLY,
			IIF(tb.unidadTY = 0, 1, tb.unidadTY) AS unidadTY,
			tb.ventaTY,
			tb.unidadLY,
			IIF(tb.ventaLY = 0, 1, tb.ventaLY) AS ventaLY,
			IIF(tb.costoTY = 0, 1, tb.costoTY) AS costoTY,
			IIF(tb.costoLY = 0, 1, tb.costoLY) AS costoLY,
			IIF(tb.CtaUndParTY = 0, 1, tb.CtaUndParTY) AS CtaUndParTY,
			IIF(tb.CtaVtaParTY = 0, 1, tb.CtaVtaParTY) AS CtaVtaParTY,
			IIF(tb.CtaUndAccTY = 0, 1, tb.CtaUndAccTY) AS CtaUndAccTY,
			IIF(tb.CtaVtaAccTY = 0, 1, tb.CtaVtaAccTY) AS CtaVtaAccTY,
			IIF(tb.CtaUndTY = 0, 1, tb.CtaUndTY) AS CtaUndTY,
			IIF(tb.CtaVtaTY = 0, 1, tb.CtaVtaTY) AS CtaVtaTY,
			IIF(tb.UtilTY = 0, 1, tb.UtilTY) AS UtilTY,
			IIF(tb.UtilLY = 0, 1, tb.UtilLY) AS UtilLY,
			IIF(tb.MargenTY= 0, 1, tb.MargenTY) AS MargenTY,
			IIF(tb.MargenLY = 0, 1, tb.MargenLY) AS MargenLY,
			IIF(tb.DifParTYvsLY = 0, 1, tb.DifParTYvsLY) AS DifParTYvsLY,
			IIF(tb.DifVtaTYvsLY = 0, 1, tb.DifVtaTYvsLY) AS DifVtaTYvsLY,
			IIF(tb.DifMrgTYvsLY = 0, 1, tb.DifMrgTYvsLY) AS DifMrgTYvsLY,
			IIF(tb.AvaUndParTY = 0, 1, tb.AvaUndParTY) AS AvaUndParTY,
			IIF(tb.AvaVtaParTY = 0, 1, tb.AvaVtaParTY) AS AvaVtaParTY,
			IIF(tb.AvaUndAccTY = 0, 1, tb.AvaUndAccTY) AS AvaUndAccTY,
			IIF(tb.AvaVtaAccTY = 0, 1, tb.AvaVtaAccTY) AS AvaVtaAccTY,
			IIF(tb.AvaUndTY = 0, 1, tb.AvaUndTY) AS AvaUndTY,
			IIF(tb.AvaVtaTY = 0, 1, tb.AvaVtaTY) AS AvaVtaTY
		FROM
			#TVentasB1 AS tb
		
		OPEN db_cursor
		FETCH NEXT FROM db_cursor INTO
			@Fecha,
			@dia,
			@NDiaSemana,
			@UndParTY,
			@UndAccTY,
			@VtaParTY,
			@VtaAccTY,
			@UndParLY,
			@UndAccLY,
			@VtaParLY,
			@VtaAccLY,
			@CtoParTY,
			@CtoAccTY,
			@CtoParLY,
			@CtoAccLY,
			@unidadTY,
			@ventaTY,
			@unidadLY,
			@ventaLY,
			@costoTY,
			@costoLY,
			@CtaUndParTY,
			@CtaVtaParTY,
			@CtaUndAccTY,
			@CtaVtaAccTY,
			@CtaUndTY,
			@CtaVtaTY,
			@UtilTY,
			@UtilLY,
			@MargenTY,
			@MargenLY,
			@DifParTYvsLY,
			@DifVtaTYvsLY,
			@DifMrgTYvsLY,
			@AvaUndParTY,
			@AvaVtaParTY,
			@AvaUndAccTY,
			@AvaVtaAccTY,
			@AvaUndTY,
			@AvaVtaTY
		
		WHILE @@FETCH_STATUS = 0
		BEGIN

			SET @hTML_Rpt_Diario += '<tr>'
			SET @hTML_Rpt_Diario += '	<td class="tg-pesd2">' + LEFT(@NDiaSemana, 2) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(@Dia AS VARCHAR) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-d4sb2">' + CAST(FORMAT(@ventaTY, '###,###,###') AS VARCHAR) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@UtilTY, '###,###,###') AS VARCHAR) + ' </td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@CtaVtaTY, '###,###,###') AS VARCHAR) + ' </td>'
			PRINT @CtaVtaTY;
			SET @hTML_Rpt_Diario += '	<td class="' +

			CASE
				WHEN (((@ventaTY / @CtaVtaTY) * 100) >= 95) THEN 'tg-rfq82'
				WHEN ((@ventaTY / @CtaVtaTY) * 100) >= 80  THEN 'tg-o0c02'
				ELSE 'tg-ubmm2'
			END	
			+ '">' + + CAST(ROUND(CAST((@ventaTY / @CtaVtaTY) * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@ventaTY - @CtaVtaTY, '###,###,###') AS VARCHAR) + ' </td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(ROUND(CAST(@MargenTY * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR) + '%' + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(ROUND(CAST(@DifParTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

			SET @hTML_Rpt_Diario += '	<td class="' +
			CASE
				WHEN (@DifVtaTYvsLY >= 0.2058) THEN 'tg-rfq82'
				WHEN (@DifVtaTYvsLY >= 0 AND
					@DifVtaTYvsLY < 0.2058) THEN 'tg-o0c02'
				WHEN @DifVtaTYvsLY < 0 THEN 'tg-ubmm2'
			END	
			+ '">' + CAST(ROUND(CAST(@DifVtaTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(ROUND(CAST(@DifMrgTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2"></td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-d4sb2">' + CAST(FORMAT(@CtaUndParTY, '###,###,###') AS VARCHAR) + ' </td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-d4sb2">' + CAST(ROUND(CAST(@AvaUndParTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-fzdr2">' + CAST(FORMAT(@UndAccTY, '###,###,###') AS VARCHAR) + '</td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-d4sb2">' + CAST(FORMAT(@CtaUndAccTY, '###,###,###') AS VARCHAR) + ' </td>'
			SET @hTML_Rpt_Diario += '	<td class="tg-d4sb2">' + CAST(ROUND(CAST(@AvaUndAccTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'

			SET @hTML_Rpt_Diario += '</tr>'
    	
			-- Siguiente registro
			FETCH NEXT FROM db_cursor INTO
			       @Fecha
			      ,@dia
			      ,@NDiaSemana
			      ,@UndParTY
			      ,@UndAccTY
			      ,@VtaParTY
			      ,@VtaAccTY
			      ,@UndParLY
			      ,@UndAccLY
			      ,@VtaParLY
			      ,@VtaAccLY
			      ,@CtoParTY
			      ,@CtoAccTY
			      ,@CtoParLY
			      ,@CtoAccLY
			      ,@unidadTY
			      ,@ventaTY
			      ,@unidadLY
			      ,@ventaLY
			      ,@costoTY
			      ,@costoLY
			      ,@CtaUndParTY
			      ,@CtaVtaParTY
			      ,@CtaUndAccTY
			      ,@CtaVtaAccTY
			      ,@CtaUndTY
			      ,@CtaVtaTY
			      ,@UtilTY
			      ,@UtilLY
			      ,@MargenTY
			      ,@MargenLY
			      ,@DifParTYvsLY
			      ,@DifVtaTYvsLY
			      ,@DifMrgTYvsLY
			      ,@AvaUndParTY
			      ,@AvaVtaParTY
			      ,@AvaUndAccTY
			      ,@AvaVtaAccTY
			      ,@AvaUndTY
			      ,@AvaVtaTY
		END
		CLOSE db_cursor
		DEALLOCATE db_cursor

		--
		-- Impresión de FOOTER
				
    SET @hTML_Rpt_Diario_AccPeq = ''
    SET @hTML_Rpt_Diario_AccGra = ''
    SET @hTML_Rpt_Diario_Pares = ''
    SET @hTML_Rpt_Diario_Unids = ''
    SET @hTML_Rpt_Diario_Monto = ''
    SET @hTML_Rpt_Diario_Util = ''
    SET @hTML_Rpt_Diario_Margen = ''
    SET @hTML_Rpt_Diario_AccPTY = ''
    SET @hTML_Rpt_Diario_AccGTY = ''
    SET @hTML_Rpt_Diario_ParCTY = ''
    SET @hTML_Rpt_Diario_UnidadesDif = ''
    SET @hTML_Rpt_Diario_MontoDif = ''
    SET @hTML_Rpt_Diario_UtilDif = ''
    SET @hTML_Rpt_Diario_MontoCta = ''
    SET @hTML_Rpt_Diario_AvanceCta = ''
    SET @hTML_Rpt_Diario_White = ''

    SET @hTML_Rpt_Diario_CuotaPar = ''
    SET @hTML_Rpt_Diario_CuotaAcc = ''
    SET @hTML_Rpt_Diario_AvanceCtaPar = ''
    SET @hTML_Rpt_Diario_AvanceCtaAcc = ''

	SET @hTML_Rpt_Diario_VtaMin = ''
	SET @hTML_Rpt_Diario_CVtaMin = ''
	SET @hTML_Rpt_Diario_VarVtaMin = ''

    SET @hTML_Rpt_Diario += '
									<tr>
										<td class="tg-pesd2"></td>
										<td class="tg-x0282">Total</td>
								'
    SELECT
      @hTML_Rpt_Diario_Unids = '<td class="tg-x0282">' + Unids + '</td>'
     ,@hTML_Rpt_Diario_Monto = '<td class="tg-pksw2">' + Monto + '</td>'
     ,@hTML_Rpt_Diario_Util = '<td class="tg-x0282">' + Util + '</td>'
	 ,@hTML_Rpt_Diario_VtaMin = '<td class="tg-x0282">' + VtaMin + '</td>'
	 ,@hTML_Rpt_Diario_CVtaMin = '<td class="'
      +
      CASE
		WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 95 THEN 'tg-rfq82'
		WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 80 THEN 'tg-o0c02'
		ELSE 'tg-ubmm2'
	END
      + '">' + CVtaMin + '</td>'
	 ,@hTML_Rpt_Diario_VarVtaMin = '<td class="tg-x0282">' + VarVtaMin + '</td>'
     ,@hTML_Rpt_Diario_Margen = '<td class="tg-x0282">' + Margen + '</td>'
      --,@hTML_Rpt_Diario_UnidadesDif='<td class="tg-x028">'+UnidadesDif+'</td>'
     ,@hTML_Rpt_Diario_UnidadesDif = '<td class="tg-x0282">' + UnidParCTY + '</td>'
     ,@hTML_Rpt_Diario_MontoDif = '<td class="'
      +
      CASE
        WHEN (MontoDifx >= 0.2058) THEN 'tg-rfq82'
        WHEN (MontoDifx >= 0 AND
          MontoDifx < 0.2058) THEN 'tg-o0c02'
        WHEN MontoDifx < 0 THEN 'tg-ubmm2'
      END
      + '">' + MontoDif + '</td>'
     ,@hTML_Rpt_Diario_UtilDif = '<td class="tg-x0282">' + UtilDif + '</td>'
      --,@hTML_Rpt_Diario_MontoCta='<td class="tg-7l0w">'+MontoCta+'</td>'
      --,@hTML_Rpt_Diario_AvanceCta='<td class="tg-7l0w">'+AvanceCta+'</td>'

     ,@hTML_Rpt_Diario_White = '<td class="tg-fzdr2"></td>'

     ,@hTML_Rpt_Diario_Pares = '<td class="tg-x0282">' + Pares + '</td>'
     ,@hTML_Rpt_Diario_CuotaPar = '<td class="tg-7l0w2">' + CuotaPar + '</td>'
     ,@hTML_Rpt_Diario_AvanceCtaPar = '<td class="tg-7l0w2">' + AvanceCtaPar + '</td>'

     ,@hTML_Rpt_Diario_AccGra = '<td class="tg-x0282">' + Accesorios + '</td>'
     ,@hTML_Rpt_Diario_CuotaAcc = '<td class="tg-7l0w2">' + CuotaAcc + '</td>'
     ,@hTML_Rpt_Diario_AvanceCtaAcc = '<td class="tg-7l0w2">' + AvanceCtaAcc + '</td>'
    FROM (SELECT
       CAST(FORMAT(Accesorios, '###,###,###') AS VARCHAR(100)) AS Accesorios
       ,CAST(FORMAT(Pares, '###,###,###') AS VARCHAR(100)) AS Pares
       ,CAST(FORMAT(Unids, '###,###,###') AS VARCHAR(100)) AS Unids
       ,CAST(FORMAT(Monto, '###,###,###') AS VARCHAR(100)) AS Monto
       ,CAST(FORMAT(Util, '###,###,###') AS VARCHAR(100)) AS Util
	   ,CAST(FORMAT(VtaMin, '###,###,###') AS VARCHAR(100)) AS VtaMin
	   ,CAST(ROUND(CAST(CVtaMin * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS CVtaMin
	   ,CAST(FORMAT(VarVtaMin, '###,###,###') AS VARCHAR(100)) AS VarVtaMin
       ,CAST(ROUND(CAST(Margen * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS Margen

--        ,CAST(ROUND(CAST(UnidAccPTY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidAccPTY
--        ,CAST(ROUND(CAST(UnidAccGTY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidAccGTY
       ,CAST(ROUND(CAST(UnidParCTY * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS UnidParCTY

       ,CAST(ROUND(CAST(UnidadesDif * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS UnidadesDif
       ,CAST(ROUND(CAST(MontoDif * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS MontoDif
       ,MontoDif AS MontoDifx
       ,CAST(ROUND(CAST(UtilDif * 100 AS NUMERIC(18, 2)), 2) AS VARCHAR(100)) + '%' AS UtilDif
       ,CAST(FORMAT(MontoCta, '###,###,###') AS VARCHAR(100)) AS MontoCta
       ,CAST(ROUND(CAST(AvanceCta * 100 AS NUMERIC(18, 1)), 1) AS VARCHAR(100)) + '%' AS AvanceCta

       ,CAST(FORMAT(CuotaPar, '###,###,###') AS VARCHAR(100)) AS CuotaPar
       ,CAST(FORMAT(CuotaAcc, '###,###,###') AS VARCHAR(100)) AS CuotaAcc
       ,CAST(ROUND(CAST(AvanceCtaPar * 100 AS NUMERIC(18, 0)), 0) AS VARCHAR(100)) + '%' AS AvanceCtaPar
       ,CAST(ROUND(CAST(AvanceCtaAcc * 100 AS NUMERIC(18, 0)), 0) AS VARCHAR(100)) + '%' AS AvanceCtaAcc
      FROM (SELECT
         SUM(a.UndAccTY) AS Accesorios
         ,SUM(a.UndParTY) AS Pares
         ,SUM(a.unidadTY) AS Unids
         ,SUM(a.ventaTY) AS Monto
         ,SUM(a.UtilTY) AS Util
		 ,SUM(a.CtaVtaTY) AS VtaMin
		 ,CASE WHEN SUM(a.CtaVtaTY)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / IIF(SUM(a.CtaVtaTY) = 0, 1, SUM(a.CtaVtaTY) )) END AS CVtaMin
		 ,(SUM(a.ventaTY) - SUM(a.CtaVtaTY)) AS VarVtaMin
         --,(SUM(a.UtilTY) / SUM(a.ventaTY)) AS Margen
         ,CASE WHEN SUM(a.ventaTY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / IIF(SUM(a.ventaTY) = 0, 1, SUM(a.ventaTY))) END AS Margen

         ,CAST(CAST(SUM(a.UndAccTY) AS NUMERIC(10, 2)) / CAST(IIF(SUM(a.UndAccLY) = 0, 1, SUM(a.UndAccLY) ) AS NUMERIC(10, 2)) - 1 AS NUMERIC(18, 4)) AS UnidAccGTY
         ,CAST(CAST(SUM(a.UndParTY) AS NUMERIC(10, 2)) / CAST(IIF(SUM(a.UndParLY) = 0, 1, SUM(a.UndParLY)) AS NUMERIC(10, 2)) - 1 AS NUMERIC(18, 4)) AS UnidParCTY

         ,CAST(CAST(SUM(a.unidadTY) AS NUMERIC(10, 2)) / CAST(IIF(SUM(a.unidadLY) = 0, 1, SUM(a.unidadLY)) AS NUMERIC(10, 2)) - 1 AS NUMERIC(18, 4)) AS UnidadesDif
         ,(SUM(a.ventaTY) / IIF(SUM(a.ventaLY) = 0, 1, SUM(a.ventaLY)) ) - 1 AS MontoDif
         ,(SUM(a.UtilTY) / IIF(SUM(a.UtilLY) = 0, 1, SUM(a.UtilLY)) ) - 1 AS UtilDif
         ,SUM(a.CtaVtaTY) AS MontoCta
         ,SUM(a.ventaTY) / SUM(a.CtaVtaTY) AS AvanceCta

         ,SUM(a.CtaUndParTY) AS CuotaPar
         ,SUM(a.CtaUndAccTY) AS CuotaAcc
         ,CAST(IIF(SUM(CAST(a.CtaUndParTY AS FLOAT)) = 0, 0, SUM(CAST(a.UndParTY AS FLOAT)) / SUM(CAST(a.CtaUndParTY AS FLOAT))) AS NUMERIC(10, 4)) AS AvanceCtaPar
         ,CAST(IIF(SUM(CAST(a.CtaUndAccTY AS FLOAT)) = 0, 0, (SUM(CAST(a.UndAccTY AS FLOAT))) / SUM(CAST(a.CtaUndAccTY AS FLOAT))) AS NUMERIC(10, 4)) AS AvanceCtaAcc
      FROM #TVentasB1 AS a) AS A) AS A
	  
	  --select * from #TVentasB1
	  --return
			-- cr: info footer
			SET @hTML_Rpt_Diario += CONCAT(
			--@hTML_Rpt_Diario_Unids
			@hTML_Rpt_Diario_Pares
			, @hTML_Rpt_Diario_Monto
			, @hTML_Rpt_Diario_Util
			, @hTML_Rpt_Diario_VtaMin
			, @hTML_Rpt_Diario_CVtaMin
			, @hTML_Rpt_Diario_VarVtaMin
			, @hTML_Rpt_Diario_Margen
			, @hTML_Rpt_Diario_UnidadesDif
			, @hTML_Rpt_Diario_MontoDif
			, @hTML_Rpt_Diario_UtilDif
			--,@hTML_Rpt_Diario_MontoCta
			--,@hTML_Rpt_Diario_AvanceCta
			, @hTML_Rpt_Diario_White
			, @hTML_Rpt_Diario_Pares
			, @hTML_Rpt_Diario_CuotaPar
			, @hTML_Rpt_Diario_AvanceCtaPar
			, @hTML_Rpt_Diario_AccGra
			, @hTML_Rpt_Diario_CuotaAcc
			, @hTML_Rpt_Diario_AvanceCtaAcc
			) + '</tr>'
		
			SET @asunto = 'VDM01 Venta diaria del mes, al ' + FORMAT(@fec, 'dd-MM-yyyy') + ' (SIN IGV)'
			SET @tableHTML = ''

			SET @v_VtaTY = (SELECT tb.ventaTY
											FROM   #TVentasB1 AS tb
											WHERE  tb.dia = DAY(@fec))
			SET @v_VarVenTY = (SELECT tb.DifVtaTYvsLY
												 FROM   #TVentasB1 AS tb
												 WHERE  tb.dia = DAY(@fec))
			SET @v_VtaLY = (SELECT tb.ventaLY
											FROM   #TVentasB1 AS tb
											WHERE  tb.dia = DAY(@fec))

			SET @v_VtaTY = ISNULL(@v_VtaTY, 0)
			SET @v_VarVenTY = ISNULL(@v_VarVenTY, 0)
			SET @v_VtaLY = ISNULL(@v_VtaLY, 0)

			SELECT
				'TOTAL EMPRESA' AS [bloque]
			 ,@fec [@fec]
			 ,@v_VtaTY [@v_VtaTY]
			 ,@v_VarVenTY [@v_VarVenTY]
			 ,@v_VtaLY [@v_VtaLY];
			
			SET @tableHTML = N'<html>'+
										 N'<head>'+
											 N'<style type="text/css">'+
												 N'.tg  {border-collapse:collapse;border-spacing:0;height:10px;}'+
												 N'.tg td{font-family:Arial, sans-serif;font-size:14px;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}'+
												 N'.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:2px 0px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}'+
												 N'.tg .tg-f7xs{font-weight:bold;background-color:#fe0000;color:#ffffff;border-color:#fe0000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-x028{font-weight:bold;background-color:#000000;color:#ffffff;border-color:#000000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-d4sb{background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-f60r{background-color:#e26b0a;border-color:#e26b0a;text-align:center;vertical-align:top}'+
												 N'.tg .tg-ubmm{background-color:#ffc7ce;color:#9c0006;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-9m3w{font-weight:bold;background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-pksw{font-weight:bold;background-color:#f79646;color:#ffffff;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-pesd{border-color:#c0c0c0;vertical-align:top}'+
												 N'.tg .tg-fkia{font-weight:bold;background-color:#632523;color:#ffffff;border-color:#680100;text-align:center;vertical-align:top}'+
												 N'.tg .tg-fzdr{border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-o0c0{background-color:#ffeb9c;color:#cf7e00;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-rfq8{background-color:#c6efce;color:#226c49;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-7l0w{font-weight:bold;background-color:#e26b0a;color:#ffffff;border-color:#e26b0a;text-align:center;vertical-align:top}'+

												  N'.tg .tg-f7xs2{font-size:10px;padding:2px;font-weight:bold;background-color:#fe0000;color:#ffffff;border-color:#fe0000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-x0282{font-size:10px;padding:2px;font-weight:bold;background-color:#000000;color:#ffffff;border-color:#000000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-x0282n{font-size:10px;padding:2px;font-weight:bold;background-color:#faff00;color:#ff0000;border-color:#000000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-x0282nn{font-size:14px;padding:2px;font-weight:bold;background-color:#faff00;color:#ff0000;border-color:#000000;text-align:center;vertical-align:top}'+
												 N'.tg .tg-d4sb2{font-size:10px;padding:2px;background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-f60r2{font-size:10px;padding:2px;background-color:#e26b0a;border-color:#e26b0a;text-align:center;vertical-align:top}'+
												 N'.tg .tg-ubmm2{font-size:10px;padding:2px;background-color:#ffc7ce;color:#9c0006;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-9m3w2{font-size:10px;padding:2px;font-weight:bold;background-color:#f79646;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-pksw2{font-size:10px;padding:2px;font-weight:bold;background-color:#f79646;color:#ffffff;border-color:#f79646;text-align:center;vertical-align:top}'+
												 N'.tg .tg-pesd2{font-size:10px;padding:2px;border-color:#c0c0c0;vertical-align:top}'+
												 N'.tg .tg-fkia2{font-size:10px;padding:2px;font-weight:bold;background-color:#632523;color:#ffffff;border-color:#680100;text-align:center;vertical-align:top}'+
												 N'.tg .tg-fzdr2{font-size:10px;padding:2px;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-o0c02{font-size:10px;padding:2px;background-color:#ffeb9c;color:#cf7e00;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-rfq82{font-size:10px;padding:2px;background-color:#c6efce;color:#226c49;border-color:#c0c0c0;text-align:center;vertical-align:top}'+
												 N'.tg .tg-7l0w2{font-size:10px;padding:2px;font-weight:bold;background-color:#e26b0a;color:#ffffff;border-color:#e26b0a;text-align:center;vertical-align:top}'+
											 N'</style>'+
										 N'</head>'+
										 N'<body>';
									 
			SET @tableHTML = @tableHTML +
			N'<div><b>Buenos días.</b></div>' +
			N'<br>' +
			N'<div><b>VENTAS TOTAL EMPRESA AL '+ FORMAT(@fec, 'dd-MM-yyyy') + ' (S/) :</b></div><br>' +
			N'<div>La venta total es de ' + CAST(FORMAT(@v_VtaTY, '###,###,###') AS VARCHAR(20)) + '; ' +
			CASE 
					WHEN @v_VtaLY>0 THEN '<b>' + (CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '</b>  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20)))
					ELSE ' Sin ventas registradas en año pasado'
			END +' .<div><br>' +
			--(CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20))) + ' .<div><br>' +
			--N'<div><b style="color:#FF0000";>Año Base: 2024</b><div><br>'+
			N'<div><div><br>'+ 
			--N'<div><b>Nomenclatura:</b><br>'+ 
			--N'<b>AccSec:</b> Accesorios Secundarios o Menores<br><b>AccPri:</b> Accesorios Principales o Mayores<br><b>Pares:</b> Calzados<div><br>'+ 
			N'<table class="tg" style="undefined;table-layout: auto; width: 100%;">' +

			N'<colgroup>' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +

			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +

			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +

			--N'<col style="width: 61px">'+ 
			--N'<col style="width: 68px">'+ 

			N'<col style="width: auto;">' +

			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'<col style="width: auto;">' +
			N'</colgroup>' +

			N'<tr>' +
			N'<th class="tg-pesd2"></th>' +
			N'<th class="tg-pesd2"></th>' +
			N'<th class="tg-fkia" colspan="7">2025</th>' +
			N'<th class="tg-f7xs" colspan="3">DIFERENCIA</th>' +
			--N'<th class="tg-9m3w" colspan="2">VENTA S/.</th>'+
			N'<th class="tg-fzdr" colspan="1">  </th>' +
			N'<th class="tg-7l0w" colspan="6">VENTA UNIDADES</th>' +
			N'</tr>' +
			N'<tr>' +
			N'<td class="tg-pesd2"></td>' +
			N'<td class="tg-x0282">Dia</td>' +
			--N'<td class="tg-x028">AccSec</td>'+ 
			--N'<td class="tg-x028">AccPri</td>'+ 
			N'<td class="tg-x0282">Pares</td>' +
			N'<td class="tg-x0282">Monto</td>' +
			N'<td class="tg-x0282">U.B.</td>' +
			N'<td class="tg-x0282n">Vta Mínima</td>' +
			N'<td class="tg-x0282n">% Cumpl</td>' +
			N'<td class="tg-x0282n">Var</td>' +
			N'<td class="tg-x0282">Margen</td>' +

			--N'<td class="tg-x028">AccSec</td>'+ 
			--N'<td class="tg-x028">AccPri</td>'+ 
			N'<td class="tg-x0282">Pares</td>' +
			--N'<td class="tg-x028">Unidades</td>'+ 

			N'<td class="tg-x0282">Monto</td>' +
			N'<td class="tg-x0282">U.B.</td>' +
			--N'<td class="tg-x028">Mínimo</td>'+ 
			--N'<td class="tg-x028">Avance</td>'+ 
			N'<td class="tg-fzdr2"></td>' +
			N'<td class="tg-x0282">Pares</td>' +
			N'<td class="tg-x0282">Mínimo</td>' +
			N'<td class="tg-x0282">Avance</td>' +
			N'<td class="tg-x0282">Acces</td>' +
			N'<td class="tg-x0282">Mínimo</td>' +
			N'<td class="tg-x0282">Avance</td>' +
			N'</tr>' + @hTML_Rpt_Diario +
			N'</table>';
		--	</body>
		--</html>';


		BEGIN	/* Tabla Temporal de detalle para Bloque 2 */

			IF OBJECT_ID('tempdb..#TVentasB2') IS NOT NULL DROP TABLE #TVentasB2 ;
			CREATE TABLE #TVentasB2
			(
				Fecha          DATE
				 ,dia            INT
				 ,NDiaSemana     VARCHAR(20)
				 ,UndParTY       INT
				 ,UndAccTY       INT
				 ,VtaParTY       DECIMAL(10 ,2)
				 ,VtaAccTY       DECIMAL(10 ,2)
				 ,UndParLY       INT
				 ,UndAccLY       INT
				 ,VtaParLY       DECIMAL(10 ,2)
				 ,VtaAccLY       DECIMAL(10 ,2)
				 ,CtoParTY       DECIMAL(10 ,2)
				 ,CtoAccTY       DECIMAL(10 ,2)
				 ,CtoParLY       DECIMAL(10 ,2)
				 ,CtoAccLY       DECIMAL(10 ,2)
				 ,unidadTY       INT
				 ,ventaTY        DECIMAL(10 ,2)
				 ,unidadLY       INT
				 ,ventaLY        DECIMAL(10 ,2)
				 ,costoTY        DECIMAL(10 ,2)
				 ,costoLY        DECIMAL(10 ,2)
				 ,CtaVtaTYM      DECIMAL(10 ,2)

				 ,UtilTY         AS ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))
				 ,UtilLY         AS ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))
				 ,MargenTY       AS (CASE WHEN (VtaParTY+VtaAccTY)=0 THEN 0.00 ELSE ((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/(VtaParTY+VtaAccTY) END)
				 ,MargenLY       AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))/(VtaParLY+VtaAccLY) END)
				 ,DifParTYvsLY   AS (CASE WHEN (UndParLY)=0 THEN 0.00 ELSE ((CAST(UndParTY AS DECIMAL(10,2))/CAST(UndParLY AS DECIMAL(10,2)))-1) END)
				 ,DifVtaTYvsLY   AS (CASE WHEN (VtaParLY+VtaAccLY)=0 THEN 0.00 ELSE (((VtaParTY+VtaAccTY)-(VtaParLY+VtaAccLY))/(VtaParLY+VtaAccLY)) END)
				 ,DifMrgTYvsLY   AS (CASE WHEN ((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY))=0 THEN 0.00 ELSE ((((VtaParTY+VtaAccTY)-(CtoParTY+CtoAccTY))/((VtaParLY+VtaAccLY)-(CtoParLY+CtoAccLY)))-1) END)

			)
	
		END


		--
		-- Bloque 2.1 RETAIL
		BEGIN
			DECLARE @hTML_Rpt_Diario_21 NVARCHAR(MAX) = '';

			IF OBJECT_ID('tempdb..#TProyeccionRetail') IS NOT NULL DROP TABLE #TProyeccionRetail;
		CREATE TABLE #TProyeccionRetail
		(
			Fecha           DATE
		   ,dia             INT
		   ,NDiaSemana      VARCHAR(20)
		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)
		)
			INSERT INTO #TProyeccionRetail
		(
			Fecha,
			dia,
			NDiaSemana,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			SUM(vpv.Par) AS CtaUndParTY,
			SUM(vpv.VtaPar_TY) AS CtaVtaParTY,
			SUM(vpv.Acc) AS CtaUndAccTY,
			SUM(vpv.VtaAcc_TY) AS CtaVtaAccTY,
			SUM(vpv.Par)+SUM(vpv.Acc) AS CtaUndTY,
			SUM(vpv.monto) AS CtaVtaTY
		FROM
			TiempoVersus AS tv
		LEFT JOIN vw_proyecciones_TY AS vpv ON vpv.Fecha = tv.FechaSK
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec AND vpv.canal = 'Retail'
		GROUP BY tv.Fecha, tv.Dia, tv.NDiaSemana

			TRUNCATE TABLE #TVentasB2;
			
			INSERT INTO #TVentasB2
			(
				Fecha,
				dia,
				NDiaSemana,
				UndParTY,
				UndAccTY,
				VtaParTY,
				VtaAccTY,
				UndParLY,
				UndAccLY,
				VtaParLY,
				VtaAccLY,
				CtoParTY,
				CtoAccTY,
				CtoParLY,
				CtoAccLY,
				unidadTY,
				ventaTY,
				unidadLY,
				ventaLY,
				costoTY,
				costoLY,
				CtaVtaTYM
			)
			SELECT tv.Fecha
						,tv.dia
						,tv.NDiaSemana
						,SUM(t.UndParTY)         AS UndParTY
						,SUM(t.UndAccTY)         AS UndAccTY
						,SUM(t.VtaParTY)         AS VtaParTY
						,SUM(t.VtaAccTY)         AS VtaAccTY
						,SUM(t.UndParLY)         AS UndParLY
						,SUM(t.UndAccLY)         AS UndAccLY
						,SUM(t.VtaParLY)         AS VtaParLY
						,SUM(t.VtaAccLY)         AS VtaAccLY
						,SUM(t.CtoParTY)         AS CtoParTY
						,SUM(t.CtoAccTY)         AS CtoAccTY
						,SUM(t.CtoParLY)         AS CtoParLY
						,SUM(t.CtoAccLY)         AS CtoAccLY
						,SUM(t.unidadTY)         AS unidadTY
						,SUM(t.ventaTY)          AS ventaTY
						,SUM(t.unidadLY)         AS unidadLY
						,SUM(t.ventaLY)          AS ventaLY
						,SUM(t.costoTY)          AS costoTY
						,SUM(t.costoLY)          AS costoLY
						,SUM(tr.CtaVtaTY) 		AS CtaVtaTYM
			FROM   TiempoVersus            AS tv
						 LEFT JOIN #TVentas2     AS t
									ON  t.Fecha = tv.Fecha
						LEFT JOIN #TProyeccionRetail  AS tr
		            ON  tr.Fecha = t.Fecha
			WHERE  tv.Fecha BETWEEN @FechaIniTY AND @fec
			AND t.canal='Retail'
			GROUP BY
						 tv.Fecha
						,tv.Dia
						,tv.NDiaSemana
			
			select * from #TVentasB2
			SELECT * FROM #TVentas2
			SELECT * FROM #TProyeccionRetail
			--return

			DECLARE db_cursor CURSOR FOR
			SELECT
				tb.Fecha,
				tb.dia,
				tb.NDiaSemana,
				tb.UndParTY,
				tb.UndAccTY,
				tb.VtaParTY,
				tb.VtaAccTY,
				tb.UndParLY,
				tb.UndAccLY,
				tb.VtaParLY,
				tb.VtaAccLY,
				tb.CtoParTY,
				tb.CtoAccTY,
				tb.CtoParLY,
				tb.CtoAccLY,
				tb.unidadTY,
				tb.ventaTY,
				tb.unidadLY,
				tb.ventaLY,
				tb.costoTY,
				tb.costoLY,
				tb.CtaVtaTYM,
				tb.UtilTY,
				tb.UtilLY,
				tb.MargenTY,
				tb.MargenLY,
				tb.DifParTYvsLY,
				tb.DifVtaTYvsLY,
				tb.DifMrgTYvsLY
			FROM
				#TVentasB2 AS tb
		
			OPEN db_cursor
			FETCH NEXT FROM db_cursor INTO
				@Fecha,
				@dia,
				@NDiaSemana,
				@UndParTY,
				@UndAccTY,
				@VtaParTY,
				@VtaAccTY,
				@UndParLY,
				@UndAccLY,
				@VtaParLY,
				@VtaAccLY,
				@CtoParTY,
				@CtoAccTY,
				@CtoParLY,
				@CtoAccLY,
				@unidadTY,
				@ventaTY,
				@unidadLY,
				@ventaLY,
				@costoTY,
				@costoLY,
				@CtaVtaTYMin,
				@UtilTY,
				@UtilLY,
				@MargenTY,
				@MargenLY,
				@DifParTYvsLY,
				@DifVtaTYvsLY,
				@DifMrgTYvsLY
		
			WHILE @@FETCH_STATUS = 0
			BEGIN
    	
				SET @hTML_Rpt_Diario_21 += '<tr>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-pesd">' + LEFT(@NDiaSemana, 2) + '</td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(@Dia AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-d4sb">' + CAST(FORMAT(@ventaTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UtilTY, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="' +
				CASE
					WHEN @CtaVtaTYMin = 0 THEN 'tg-ubmm'
					WHEN (((@ventaTY / @CtaVtaTYMin) * 100) >= 95) THEN 'tg-rfq8'
					WHEN ((@ventaTY / @CtaVtaTYMin) * 100) >= 80  THEN 'tg-o0c0'
					ELSE 'tg-ubmm'
				END	
				+ '">' + + CAST(ROUND(CAST((CASE WHEN @CtaVtaTYMin = 0 THEN 0.00 ELSE (@ventaTY / @CtaVtaTYMin) * 100 END) AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
			SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@ventaTY - @CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@MargenTY * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifParTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_21 += '	<td class="' +
				CASE
					WHEN (@DifVtaTYvsLY >= 0.2058) THEN 'tg-rfq8'
					WHEN (@DifVtaTYvsLY >= 0 AND
						@DifVtaTYvsLY < 0.2058) THEN 'tg-o0c0'
					WHEN @DifVtaTYvsLY < 0 THEN 'tg-ubmm'
				END
				+ '">' + CAST(ROUND(CAST(@DifVtaTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifMrgTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr"></td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndParTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndParTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndAccTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndAccTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_21 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndAccTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_21 += '</tr>'
    	
				-- Siguiente registro
				FETCH NEXT FROM db_cursor INTO
					@Fecha,
					@dia,
					@NDiaSemana,
					@UndParTY,
					@UndAccTY,
					@VtaParTY,
					@VtaAccTY,
					@UndParLY,
					@UndAccLY,
					@VtaParLY,
					@VtaAccLY,
					@CtoParTY,
					@CtoAccTY,
					@CtoParLY,
					@CtoAccLY,
					@unidadTY,
					@ventaTY,
					@unidadLY,
					@ventaLY,
					@costoTY,
					@costoLY,
					@CtaVtaTYMin,
					@UtilTY,
					@UtilLY,
					@MargenTY,
					@MargenLY,
					@DifParTYvsLY,
					@DifVtaTYvsLY,
					@DifMrgTYvsLY
			END
			CLOSE db_cursor
			DEALLOCATE db_cursor

			--
			-- Impresión de FOOTER
				
			SET @hTML_Rpt_Diario_AccPeq = ''
			SET @hTML_Rpt_Diario_AccGra = ''
			SET @hTML_Rpt_Diario_Pares = ''
			SET @hTML_Rpt_Diario_Unids = ''
			SET @hTML_Rpt_Diario_Monto = ''
			SET @hTML_Rpt_Diario_Util = ''
			SET @hTML_Rpt_Diario_VtaMin = ''
			SET @hTML_Rpt_Diario_CVtaMIN = ''
			SET @hTML_Rpt_Diario_VarVtaMin = ''
			SET @hTML_Rpt_Diario_Margen = ''
			SET @hTML_Rpt_Diario_AccPTY = ''
			SET @hTML_Rpt_Diario_AccGTY = ''
			SET @hTML_Rpt_Diario_ParCTY = ''
			SET @hTML_Rpt_Diario_UnidadesDif = ''
			SET @hTML_Rpt_Diario_MontoDif = ''
			SET @hTML_Rpt_Diario_UtilDif = ''
			SET @hTML_Rpt_Diario_MontoCta = ''
			SET @hTML_Rpt_Diario_AvanceCta = ''
			SET @hTML_Rpt_Diario_White = ''

			SET @hTML_Rpt_Diario_CuotaPar = ''
			SET @hTML_Rpt_Diario_CuotaAcc = ''
			SET @hTML_Rpt_Diario_AvanceCtaPar = ''
			SET @hTML_Rpt_Diario_AvanceCtaAcc = ''

			SET @hTML_Rpt_Diario_21 += '
										<tr>
											<td class="tg-pesd"></td>
											<td class="tg-x028">Total</td>
										'
			SELECT
				@hTML_Rpt_Diario_Pares = '<td class="tg-x028">' + Pares + '</td>'
			 ,@hTML_Rpt_Diario_Monto = '<td class="tg-pksw">' + Monto + '</td>'
			 ,@hTML_Rpt_Diario_Util = '<td class="tg-x028">' + Util + '</td>'
			 ,@hTML_Rpt_Diario_VtaMin = '<td class="tg-x028">' + VtaMin + '</td>'
			 ,@hTML_Rpt_Diario_CVtaMin = '<td class="'
				+
			CASE
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 95 THEN 'tg-rfq8'
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 80 THEN 'tg-o0c0'
				ELSE 'tg-ubmm'
			END
			+ '">' + CVtaMin + '</td>'
			,@hTML_Rpt_Diario_VarVtaMin = '<td class="tg-x028">' + VarVtaMin + '</td>'
			 ,@hTML_Rpt_Diario_Margen = '<td class="tg-x028">' + Margen + '</td>'
				--,@hTML_Rpt_Diario_UnidadesDif='<td class="tg-x028">'+UnidadesDif+'</td>'
			 ,@hTML_Rpt_Diario_UnidadesDif = '<td class="tg-x028">' + UnidParDif + '</td>'
			 ,@hTML_Rpt_Diario_MontoDif = '<td class="'
				+
				CASE
					WHEN (MontoDifx >= 0.2058) THEN 'tg-rfq8'
					WHEN (MontoDifx >= 0 AND
						MontoDifx < 0.2058) THEN 'tg-o0c0'
					WHEN MontoDifx < 0 THEN 'tg-ubmm'
				END
				+ '">' + MontoDif + '</td>'
			 ,@hTML_Rpt_Diario_UtilDif = '<td class="tg-x028">' + UtilDif + '</td>'
				--,@hTML_Rpt_Diario_MontoCta='<td class="tg-7l0w">'+MontoCta+'</td>'
				--,@hTML_Rpt_Diario_AvanceCta='<td class="tg-7l0w">'+AvanceCta+'</td>'

			 --,@hTML_Rpt_Diario_White = '<td class="tg-fzdr"></td>'
			FROM (SELECT
				 CAST(FORMAT(Pares, '###,###,###') AS VARCHAR(100)) AS Pares
				 ,CAST(FORMAT(Monto, '###,###,###') AS VARCHAR(100)) AS Monto
				 ,CAST(FORMAT(Util, '###,###,###') AS VARCHAR(100)) AS Util
				 ,CAST(FORMAT(VtaMin, '###,###,###') AS VARCHAR(100)) AS VtaMin
				,CAST(ROUND(CAST(CVtaMin * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS CVtaMin
				,CAST(FORMAT(VarVtaMin, '###,###,###') AS VARCHAR(100)) AS VarVtaMin
				 ,CAST(ROUND(CAST(Margen * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR(100)) + '%' AS Margen

				 ,CAST(ROUND(CAST(UnidParDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidParDif

				 ,CAST(ROUND(CAST(UnidadesDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidadesDif
				 ,CAST(ROUND(CAST(MontoDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS MontoDif
				 ,MontoDif AS MontoDifx
				 ,CAST(ROUND(CAST(UtilDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UtilDif
				FROM (SELECT
					 SUM(a.UndParTY) AS Pares
					 ,SUM(a.ventaTY) AS Monto
					 ,SUM(a.UtilTY) AS Util
					 ,SUM(a.CtaVtaTYM) AS VtaMin
					 ,CASE WHEN SUM(a.CtaVtaTYM)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.CtaVtaTYM)) END AS CVtaMin
					 ,(SUM(a.ventaTY) - SUM(a.CtaVtaTYM)) AS VarVtaMin
					 --,(SUM(a.UtilTY) / SUM(a.ventaTY)) AS Margen
					 ,CASE WHEN SUM(a.ventaTY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.ventaTY)) END AS Margen

					 ,CASE WHEN CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndAccTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidAccDif
					 ,CASE WHEN CAST(SUM(a.UndParLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndParTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndParLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidParDif

					 ,CASE WHEN CAST(SUM(a.unidadLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.unidadTY) AS NUMERIC(10, 2)) / CAST(SUM(a.unidadLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidadesDif
					 ,CASE WHEN SUM(a.ventaLY)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.ventaLY)) - 1 END AS MontoDif
					 ,CASE WHEN SUM(a.UtilLY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.UtilLY)) - 1 END AS UtilDif
				FROM #TVentasB2 AS a) AS A) AS A

				SET @hTML_Rpt_Diario_21 += CONCAT(
				--@hTML_Rpt_Diario_Unids
				@hTML_Rpt_Diario_Pares
				, @hTML_Rpt_Diario_Monto
				, @hTML_Rpt_Diario_Util
				, @hTML_Rpt_Diario_VtaMin
				, @hTML_Rpt_Diario_CVtaMin
				, @hTML_Rpt_Diario_VarVtaMin
				, @hTML_Rpt_Diario_Margen
				, @hTML_Rpt_Diario_UnidadesDif
				, @hTML_Rpt_Diario_MontoDif
				, @hTML_Rpt_Diario_UtilDif
				--,@hTML_Rpt_Diario_MontoCta
				--,@hTML_Rpt_Diario_AvanceCta
-- 				, @hTML_Rpt_Diario_White
-- 				, @hTML_Rpt_Diario_Pares
-- 				, @hTML_Rpt_Diario_CuotaPar
-- 				, @hTML_Rpt_Diario_AvanceCtaPar
-- 				, @hTML_Rpt_Diario_AccGra
-- 				, @hTML_Rpt_Diario_CuotaAcc
-- 				, @hTML_Rpt_Diario_AvanceCtaAcc
				) + '</tr>'
		
				--SET @tableHTML = ''

				SET @v_VtaTY = (SELECT tb.ventaTY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))
				SET @v_VarVenTY = (SELECT tb.DifVtaTYvsLY
													 FROM   #TVentasB2 AS tb
													 WHERE  tb.dia = DAY(@fec))
				SET @v_VtaLY = (SELECT tb.ventaLY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))

				SET @v_VtaTY = ISNULL(@v_VtaTY, 0)
				SET @v_VarVenTY = ISNULL(@v_VarVenTY, 0)
				SET @v_VtaLY = ISNULL(@v_VtaLY, 0)

				SELECT
					'VENTA DEPORTIVO' AS [bloque]
				 ,@fec [@fec]
				 ,@v_VtaTY [@v_VtaTY]
				 ,@v_VarVenTY [@v_VarVenTY]
				 ,@v_VtaLY [@v_VtaLY];
									 
				SET @tableHTML = @tableHTML +
				N'<br><br><br>' +
				N'<div><b>VENTA CANAL RETAIL: </b></div><br>' +
				N'<div>La venta total es de ' + CAST(FORMAT(@v_VtaTY, '###,###,###') AS VARCHAR(20)) + '; ' + 
				CASE 
						WHEN @v_VtaLY>0 THEN '<b>' + (CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '</b>  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20)))
						ELSE ' Sin ventas registradas en año pasado'
				END + ' .<div><br>' +
				N'<br>' +
				N'<table class="tg" style="undefined;table-layout: fixed; width: 751px">' +

				N'<colgroup>' +
				N'<col style="width: 40px">' +
				N'<col style="width: 40px">' +

				N'<col style="width: 60px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 84px">' +

				N'<col style="width: 80px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 61px">' +

				--N'<col style="width: 61px">'+ 
				--N'<col style="width: 68px">'+ 

				N'<col style="width: 68px">' +

				N'<col style="width: 70px">' +
				N'<col style="width: 70px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 50px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 60px">' +
				N'</colgroup>' +

				N'<tr>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-fkia" colspan="7">2025</th>' +
				N'<th class="tg-f7xs" colspan="3">DIFERENCIA</th>' +
				--N'<th class="tg-9m3w" colspan="2">VENTA S/.</th>'+
-- 				N'<th class="tg-fzdr" colspan="1">  </th>' +
-- 				N'<th class="tg-7l0w" colspan="6">VENTA UNIDADES</th>' +
				N'</tr>' +
				N'<tr>' +
				N'<td class="tg-pesd"></td>' +
				N'<td class="tg-x028">Dia</td>' +
				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				N'<td class="tg-x0282nn">Vta.Mínima</td>' +
				N'<td class="tg-x0282nn">% Cumpl</td>' +
				N'<td class="tg-x0282nn">Var</td>' +
				N'<td class="tg-x028">Margen</td>' +

				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				--N'<td class="tg-x028">Unidades</td>'+ 

				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				--N'<td class="tg-x028">Mínimo</td>'+ 
				--N'<td class="tg-x028">Avance</td>'+ 
-- 				N'<td class="tg-fzdr"></td>' +
-- 				N'<td class="tg-x028">Pares</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
-- 				N'<td class="tg-x028">Acces</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
				N'</tr>' + @hTML_Rpt_Diario_21 +
				N'</table>';
			--	</body>
			--</html>';
			
		END

		--
		-- Bloque 2.2 CATALOGO
		BEGIN
			DECLARE @hTML_Rpt_Diario_22 NVARCHAR(MAX) = '';

			IF OBJECT_ID('tempdb..#TProyeccionCatalogo') IS NOT NULL DROP TABLE #TProyeccionCatalogo;
		CREATE TABLE #TProyeccionCatalogo
		(
			Fecha           DATE
		   ,dia             INT
		   ,NDiaSemana      VARCHAR(20)
		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)
		)
			INSERT INTO #TProyeccionCatalogo
		(
			Fecha,
			dia,
			NDiaSemana,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			SUM(vpv.Par) AS CtaUndParTY,
			SUM(vpv.VtaPar_TY) AS CtaVtaParTY,
			SUM(vpv.Acc) AS CtaUndAccTY,
			SUM(vpv.VtaAcc_TY) AS CtaVtaAccTY,
			SUM(vpv.Par)+SUM(vpv.Acc) AS CtaUndTY,
			SUM(vpv.monto) AS CtaVtaTY
		FROM
			TiempoVersus AS tv
		INNER JOIN vw_proyecciones_TY AS vpv ON vpv.Fecha = tv.FechaSK
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec AND vpv.canal = 'Catálogo'
		GROUP BY tv.Fecha, tv.Dia, tv.NDiaSemana

			TRUNCATE TABLE #TVentasB2;

			INSERT INTO #TVentasB2
			(
				Fecha,
				dia,
				NDiaSemana,
				UndParTY,
				UndAccTY,
				VtaParTY,
				VtaAccTY,
				UndParLY,
				UndAccLY,
				VtaParLY,
				VtaAccLY,
				CtoParTY,
				CtoAccTY,
				CtoParLY,
				CtoAccLY,
				unidadTY,
				ventaTY,
				unidadLY,
				ventaLY,
				costoTY,
				costoLY,
				CtaVtaTYM
			)
			SELECT tv.Fecha
						,tv.dia
						,tv.NDiaSemana
						,SUM(t.UndParTY)         AS UndParTY
						,SUM(t.UndAccTY)         AS UndAccTY
						,SUM(t.VtaParTY)         AS VtaParTY
						,SUM(t.VtaAccTY)         AS VtaAccTY
						,SUM(t.UndParLY)         AS UndParLY
						,SUM(t.UndAccLY)         AS UndAccLY
						,SUM(t.VtaParLY)         AS VtaParLY
						,SUM(t.VtaAccLY)         AS VtaAccLY
						,SUM(t.CtoParTY)         AS CtoParTY
						,SUM(t.CtoAccTY)         AS CtoAccTY
						,SUM(t.CtoParLY)         AS CtoParLY
						,SUM(t.CtoAccLY)         AS CtoAccLY
						,SUM(t.unidadTY)         AS unidadTY
						,SUM(t.ventaTY)          AS ventaTY
						,SUM(t.unidadLY)         AS unidadLY
						,SUM(t.ventaLY)          AS ventaLY
						,SUM(t.costoTY)          AS costoTY
						,SUM(t.costoLY)          AS costoLY
						,SUM(tr.CtaVtaTY) 		AS CtaVtaTYM
			FROM   TiempoVersus            AS tv
						 LEFT JOIN #TVentas2     AS t
									ON  t.Fecha = tv.Fecha
						LEFT JOIN #TProyeccionCatalogo  AS tr
		            ON  tr.Fecha = t.Fecha
			WHERE  tv.Fecha BETWEEN @FechaIniTY AND @fec
			AND t.canal='Catálogo'
			GROUP BY
						 tv.Fecha
						,tv.Dia
						,tv.NDiaSemana


		select * from #TVentas1
		select * from #TProyeccionCatalogo
		select * from #TVentasB2
		
			DECLARE db_cursor CURSOR FOR
			SELECT
				tb.Fecha,
				tb.dia,
				tb.NDiaSemana,
				tb.UndParTY,
				tb.UndAccTY,
				tb.VtaParTY,
				tb.VtaAccTY,
				tb.UndParLY,
				tb.UndAccLY,
				tb.VtaParLY,
				tb.VtaAccLY,
				tb.CtoParTY,
				tb.CtoAccTY,
				tb.CtoParLY,
				tb.CtoAccLY,
				tb.unidadTY,
				tb.ventaTY,
				tb.unidadLY,
				tb.ventaLY,
				tb.costoTY,
				tb.costoLY,
				CtaVtaTYM,
				tb.UtilTY,
				tb.UtilLY,
				tb.MargenTY,
				tb.MargenLY,
				tb.DifParTYvsLY,
				tb.DifVtaTYvsLY,
				tb.DifMrgTYvsLY
			FROM
				#TVentasB2 AS tb
		
			OPEN db_cursor
			FETCH NEXT FROM db_cursor INTO
				@Fecha,
				@dia,
				@NDiaSemana,
				@UndParTY,
				@UndAccTY,
				@VtaParTY,
				@VtaAccTY,
				@UndParLY,
				@UndAccLY,
				@VtaParLY,
				@VtaAccLY,
				@CtoParTY,
				@CtoAccTY,
				@CtoParLY,
				@CtoAccLY,
				@unidadTY,
				@ventaTY,
				@unidadLY,
				@ventaLY,
				@costoTY,
				@costoLY,
				@CtaVtaTYMin,
				@UtilTY,
				@UtilLY,
				@MargenTY,
				@MargenLY,
				@DifParTYvsLY,
				@DifVtaTYvsLY,
				@DifMrgTYvsLY
		
			WHILE @@FETCH_STATUS = 0
			BEGIN
    	
				SET @hTML_Rpt_Diario_22 += '<tr>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-pesd">' + LEFT(@NDiaSemana, 2) + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(@Dia AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-d4sb">' + CAST(FORMAT(@ventaTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UtilTY, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="' +
				/* MA: 2025-06-02 => Si no se tiene @CtaVtaTYMin o es menor que 1:  */
				CASE
					WHEN @CtaVtaTYMin < 1 THEN 'tg-ubmm'
					WHEN @CtaVtaTYMin > 1 and (((@ventaTY / @CtaVtaTYMin) * 100) >= 100) THEN 'tg-rfq8'
					WHEN @CtaVtaTYMin > 1 and ((@ventaTY / @CtaVtaTYMin) * 100) >= 80  THEN 'tg-o0c0'
					ELSE 'tg-ubmm'
				END	
					+ '">' + + CAST(ROUND(CAST((CASE WHEN @CtaVtaTYMin < 1 THEN 0.00 ELSE (@ventaTY / @CtaVtaTYMin) * 100 END) AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@ventaTY - @CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@MargenTY * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifParTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_22 += '	<td class="' +
				CASE
					WHEN (@DifVtaTYvsLY >= 0.2058) THEN 'tg-rfq8'
					WHEN (@DifVtaTYvsLY >= 0 AND
						@DifVtaTYvsLY < 0.2058) THEN 'tg-o0c0'
					WHEN @DifVtaTYvsLY < 0 THEN 'tg-ubmm'
				END
				+ '">' + CAST(ROUND(CAST(@DifVtaTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifMrgTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr"></td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndParTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndParTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndAccTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndAccTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_22 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndAccTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_22 += '</tr>'
    	
				-- Siguiente registro
				FETCH NEXT FROM db_cursor INTO
					@Fecha,
					@dia,
					@NDiaSemana,
					@UndParTY,
					@UndAccTY,
					@VtaParTY,
					@VtaAccTY,
					@UndParLY,
					@UndAccLY,
					@VtaParLY,
					@VtaAccLY,
					@CtoParTY,
					@CtoAccTY,
					@CtoParLY,
					@CtoAccLY,
					@unidadTY,
					@ventaTY,
					@unidadLY,
					@ventaLY,
					@costoTY,
					@costoLY,
					@CtaVtaTYMin,
					@UtilTY,
					@UtilLY,
					@MargenTY,
					@MargenLY,
					@DifParTYvsLY,
					@DifVtaTYvsLY,
					@DifMrgTYvsLY
			END
			CLOSE db_cursor
			DEALLOCATE db_cursor

			--
			-- Impresión de FOOTER
			SET @hTML_Rpt_Diario_AccPeq = ''
			SET @hTML_Rpt_Diario_AccGra = ''
			SET @hTML_Rpt_Diario_Pares = ''
			SET @hTML_Rpt_Diario_Unids = ''
			SET @hTML_Rpt_Diario_Monto = ''
			SET @hTML_Rpt_Diario_Util = ''
			SET @hTML_Rpt_Diario_VtaMin = ''
			SET @hTML_Rpt_Diario_CVtaMin = ''
			SET @hTML_Rpt_Diario_VarVtaMin = ''
			SET @hTML_Rpt_Diario_Margen = ''
			SET @hTML_Rpt_Diario_AccPTY = ''
			SET @hTML_Rpt_Diario_AccGTY = ''
			SET @hTML_Rpt_Diario_ParCTY = ''
			SET @hTML_Rpt_Diario_UnidadesDif = ''
			SET @hTML_Rpt_Diario_MontoDif = ''
			SET @hTML_Rpt_Diario_UtilDif = ''
			SET @hTML_Rpt_Diario_MontoCta = ''
			SET @hTML_Rpt_Diario_AvanceCta = ''
			SET @hTML_Rpt_Diario_White = ''

			SET @hTML_Rpt_Diario_CuotaPar = ''
			SET @hTML_Rpt_Diario_CuotaAcc = ''
			SET @hTML_Rpt_Diario_AvanceCtaPar = ''
			SET @hTML_Rpt_Diario_AvanceCtaAcc = ''

			SET @hTML_Rpt_Diario_22 += '
										<tr>
											<td class="tg-pesd"></td>
											<td class="tg-x028">Total</td>
										'
			SELECT
				@hTML_Rpt_Diario_Pares = '<td class="tg-x028">' + Pares + '</td>'
			 ,@hTML_Rpt_Diario_Monto = '<td class="tg-pksw">' + Monto + '</td>'
			 ,@hTML_Rpt_Diario_Util = '<td class="tg-x028">' + Util + '</td>'
			 ,@hTML_Rpt_Diario_VtaMin = '<td class="tg-x028">' + VtaMin + '</td>'
			 ,@hTML_Rpt_Diario_CVtaMin = '<td class="'
				+
			CASE
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 95 THEN 'tg-rfq8'
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 80 THEN 'tg-o0c0'
				ELSE 'tg-ubmm'
			END
				+ '">' + CVtaMin + '</td>'
			,@hTML_Rpt_Diario_VarVtaMin = '<td class="tg-x028">' + VarVtaMin + '</td>'
			 ,@hTML_Rpt_Diario_Margen = '<td class="tg-x028">' + Margen + '</td>'
				--,@hTML_Rpt_Diario_UnidadesDif='<td class="tg-x028">'+UnidadesDif+'</td>'
			 ,@hTML_Rpt_Diario_UnidadesDif = '<td class="tg-x028">' + UnidParDif + '</td>'
			 ,@hTML_Rpt_Diario_MontoDif = '<td class="'
				+
				CASE
					WHEN (MontoDifx >= 0.2058) THEN 'tg-rfq8'
					WHEN (MontoDifx >= 0 AND
						MontoDifx < 0.2058) THEN 'tg-o0c0'
					WHEN MontoDifx < 0 THEN 'tg-ubmm'
				END
				+ '">' + MontoDif + '</td>'
			 ,@hTML_Rpt_Diario_UtilDif = '<td class="tg-x028">' + UtilDif + '</td>'
				--,@hTML_Rpt_Diario_MontoCta='<td class="tg-7l0w">'+MontoCta+'</td>'
				--,@hTML_Rpt_Diario_AvanceCta='<td class="tg-7l0w">'+AvanceCta+'</td>'

			 --,@hTML_Rpt_Diario_White = '<td class="tg-fzdr"></td>'
			FROM (SELECT
				 CAST(FORMAT(Pares, '###,###,###') AS VARCHAR(100)) AS Pares
				 ,CAST(FORMAT(Monto, '###,###,###') AS VARCHAR(100)) AS Monto
				 ,CAST(FORMAT(Util, '###,###,###') AS VARCHAR(100)) AS Util
				 ,CAST(FORMAT(VtaMin, '###,###,###') AS VARCHAR(100)) AS VtaMin
				,CAST(ROUND(CAST(CVtaMin * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS CVtaMin
				,CAST(FORMAT(VarVtaMin, '###,###,###') AS VARCHAR(100)) AS VarVtaMin
				 ,CAST(ROUND(CAST(Margen * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR(100)) + '%' AS Margen

				 ,CAST(ROUND(CAST(UnidParDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidParDif

				 ,CAST(ROUND(CAST(UnidadesDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidadesDif
				 ,CAST(ROUND(CAST(MontoDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS MontoDif
				 ,MontoDif AS MontoDifx
				 ,CAST(ROUND(CAST(UtilDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UtilDif
				FROM (SELECT
					 SUM(a.UndParTY) AS Pares
					 ,SUM(a.ventaTY) AS Monto
					 ,SUM(a.UtilTY) AS Util
					 ,SUM(a.CtaVtaTYM) AS VtaMin
					 ,CASE WHEN SUM(a.CtaVtaTYM)<1 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.CtaVtaTYM)) END AS CVtaMin
					 ,(SUM(a.ventaTY) - SUM(a.CtaVtaTYM)) AS VarVtaMin

					 --,(SUM(a.UtilTY) / SUM(a.ventaTY)) AS Margen
					 ,CASE WHEN SUM(a.ventaTY) = 0 THEN 0.00 ELSE SUM(a.UtilTY) / SUM(a.ventaTY) END AS Margen


					 ,CASE WHEN CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndAccTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidAccDif
					 ,CASE WHEN CAST(SUM(a.UndParLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndParTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndParLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidParDif

					 ,CASE WHEN CAST(SUM(a.unidadLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.unidadTY) AS NUMERIC(10, 2)) / CAST(SUM(a.unidadLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidadesDif
					 ,CASE WHEN SUM(a.ventaLY)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.ventaLY)) - 1 END AS MontoDif
					 ,CASE WHEN SUM(a.UtilLY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.UtilLY)) - 1 END AS UtilDif
				FROM #TVentasB2 AS a) AS A) AS A

				SET @hTML_Rpt_Diario_22 += CONCAT(
				--@hTML_Rpt_Diario_Unids
				@hTML_Rpt_Diario_Pares
				, @hTML_Rpt_Diario_Monto
				, @hTML_Rpt_Diario_Util
				, @hTML_Rpt_Diario_VtaMin
				, @hTML_Rpt_Diario_CVtaMin
				, @hTML_Rpt_Diario_VarVtaMin
				, @hTML_Rpt_Diario_Margen
				, @hTML_Rpt_Diario_UnidadesDif
				, @hTML_Rpt_Diario_MontoDif
				, @hTML_Rpt_Diario_UtilDif
				--,@hTML_Rpt_Diario_MontoCta
				--,@hTML_Rpt_Diario_AvanceCta
-- 				, @hTML_Rpt_Diario_White
-- 				, @hTML_Rpt_Diario_Pares
-- 				, @hTML_Rpt_Diario_CuotaPar
-- 				, @hTML_Rpt_Diario_AvanceCtaPar
-- 				, @hTML_Rpt_Diario_AccGra
-- 				, @hTML_Rpt_Diario_CuotaAcc
-- 				, @hTML_Rpt_Diario_AvanceCtaAcc
				) + '</tr>'
		
				--SET @tableHTML = ''

				SET @v_VtaTY = (SELECT tb.ventaTY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))
				SET @v_VarVenTY = (SELECT tb.DifVtaTYvsLY
													 FROM   #TVentasB2 AS tb
													 WHERE  tb.dia = DAY(@fec))
				SET @v_VtaLY = (SELECT tb.ventaLY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))

				SET @v_VtaTY = ISNULL(@v_VtaTY, 0)
				SET @v_VarVenTY = ISNULL(@v_VarVenTY, 0)
				SET @v_VtaLY = ISNULL(@v_VtaLY, 0)

				SELECT
					'VENTA CANAL CATALOGO' AS [bloque]
				 ,@fec [@fec]
				 ,@v_VtaTY [@v_VtaTY]
				 ,@v_VarVenTY [@v_VarVenTY]
				 ,@v_VtaLY [@v_VtaLY];
									 
				SET @tableHTML = @tableHTML +
				N'<br><br><br>' +
				N'<div><b>VENTA CANAL CATALOGO: </b></div><br>' +
				N'<div>La venta total es de ' + CAST(FORMAT(@v_VtaTY, '###,###,###') AS VARCHAR(20)) + '; ' + 
				CASE 
						WHEN @v_VtaLY>0 THEN '<b>' + (CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '</b>  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20)))
						ELSE ' Sin ventas registradas en año pasado'
				END + ' .<div><br>' +
				N'<br>' +
				N'<table class="tg" style="undefined;table-layout: fixed; width: 751px">' +

				N'<colgroup>' +
				N'<col style="width: 40px">' +
				N'<col style="width: 48px">' +

				N'<col style="width: 48px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 80px">' +
				N'<col style="width: 90px">' +

				N'<col style="width: 80px">' +
				N'<col style="width: 70px">' +
				N'<col style="width: 61px">' +

				--N'<col style="width: 61px">'+ 
				--N'<col style="width: 68px">'+ 

				N'<col style="width: 70px">' +

				N'<col style="width: 70px">' +
				N'<col style="width: 70px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 50px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 60px">' +
				N'</colgroup>' +

				N'<tr>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-fkia" colspan="7">2025</th>' +
				N'<th class="tg-f7xs" colspan="3">DIFERENCIA</th>' +
				--N'<th class="tg-9m3w" colspan="2">VENTA S/.</th>'+
-- 				N'<th class="tg-fzdr" colspan="1">  </th>' +
-- 				N'<th class="tg-7l0w" colspan="6">VENTA UNIDADES</th>' +
				N'</tr>' +
				N'<tr>' +
				N'<td class="tg-pesd"></td>' +
				N'<td class="tg-x028">Dia</td>' +
				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				N'<td class="tg-x0282nn">Vta Mínima</td>' +
				N'<td class="tg-x0282nn">% Cumpl</td>' +
				N'<td class="tg-x0282nn">Var</td>' +
				N'<td class="tg-x028">Margen</td>' +

				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				--N'<td class="tg-x028">Unidades</td>'+ 

				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				--N'<td class="tg-x028">Mínimo</td>'+ 
				--N'<td class="tg-x028">Avance</td>'+ 
-- 				N'<td class="tg-fzdr"></td>' +
-- 				N'<td class="tg-x028">Pares</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
-- 				N'<td class="tg-x028">Acces</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
				N'</tr>' + @hTML_Rpt_Diario_22 +
				N'</table>';
			--	</body>
			--</html>';
			
		END

		--
		-- Bloque 2.3 Canal E-Commerce
		IF 1=1
		BEGIN
			DECLARE @hTML_Rpt_Diario_23 NVARCHAR(MAX) = '';
			
			IF OBJECT_ID('tempdb..#TProyeccionEcommerce') IS NOT NULL DROP TABLE #TProyeccionEcommerce;
		CREATE TABLE #TProyeccionEcommerce
		(
			Fecha           DATE
		   ,dia             INT
		   ,NDiaSemana      VARCHAR(20)
		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)
		)
			INSERT INTO #TProyeccionEcommerce
		(
			Fecha,
			dia,
			NDiaSemana,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			SUM(vpv.Par) AS CtaUndParTY,
			SUM(vpv.VtaPar_TY) AS CtaVtaParTY,
			SUM(vpv.Acc) AS CtaUndAccTY,
			SUM(vpv.VtaAcc_TY) AS CtaVtaAccTY,
			SUM(vpv.Par)+SUM(vpv.Acc) AS CtaUndTY,
			SUM(vpv.monto) AS CtaVtaTY
		FROM
			TiempoVersus AS tv
		INNER JOIN vw_proyecciones_TY AS vpv ON vpv.Fecha = tv.FechaSK
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec AND vpv.canal = 'E-commerce'
		GROUP BY tv.Fecha, tv.Dia, tv.NDiaSemana

			TRUNCATE TABLE #TVentasB2;

			INSERT INTO #TVentasB2
			(
				Fecha,
				dia,
				NDiaSemana,
				UndParTY,
				UndAccTY,
				VtaParTY,
				VtaAccTY,
				UndParLY,
				UndAccLY,
				VtaParLY,
				VtaAccLY,
				CtoParTY,
				CtoAccTY,
				CtoParLY,
				CtoAccLY,
				unidadTY,
				ventaTY,
				unidadLY,
				ventaLY,
				costoTY,
				costoLY,
				CtaVtaTYM
			)
			SELECT tv.Fecha
						,tv.dia
						,tv.NDiaSemana
						,SUM(t.UndParTY)         AS UndParTY
						,SUM(t.UndAccTY)         AS UndAccTY
						,SUM(t.VtaParTY)         AS VtaParTY
						,SUM(t.VtaAccTY)         AS VtaAccTY
						,SUM(t.UndParLY)         AS UndParLY
						,SUM(t.UndAccLY)         AS UndAccLY
						,SUM(t.VtaParLY)         AS VtaParLY
						,SUM(t.VtaAccLY)         AS VtaAccLY
						,SUM(t.CtoParTY)         AS CtoParTY
						,SUM(t.CtoAccTY)         AS CtoAccTY
						,SUM(t.CtoParLY)         AS CtoParLY
						,SUM(t.CtoAccLY)         AS CtoAccLY
						,SUM(t.unidadTY)         AS unidadTY
						,SUM(t.ventaTY)          AS ventaTY
						,SUM(t.unidadLY)         AS unidadLY
						,SUM(t.ventaLY)          AS ventaLY
						,SUM(t.costoTY)          AS costoTY
						,SUM(t.costoLY)          AS costoLY
						,SUM(ISNULL(tr.CtaVtaTY, 1)) 		AS CtaVtaTYM
			FROM   TiempoVersus            AS tv
						 LEFT JOIN #TVentas2     AS t
									ON  t.Fecha = tv.Fecha
						LEFT JOIN #TProyeccionEcommerce  AS tr
		            ON  tr.Fecha = t.Fecha
			WHERE  tv.Fecha BETWEEN @FechaIniTY AND @fec
			AND t.canal='E-commerce'
			GROUP BY
						 tv.Fecha
						,tv.Dia
						,tv.NDiaSemana

			select * from #TVentasB2
							
			DECLARE db_cursor CURSOR FOR
			SELECT
				tb.Fecha,
				tb.dia,
				tb.NDiaSemana,
				tb.UndParTY,
				tb.UndAccTY,
				tb.VtaParTY,
				tb.VtaAccTY,
				tb.UndParLY,
				tb.UndAccLY,
				tb.VtaParLY,
				tb.VtaAccLY,
				tb.CtoParTY,
				tb.CtoAccTY,
				tb.CtoParLY,
				tb.CtoAccLY,
				tb.unidadTY,
				tb.ventaTY,
				tb.unidadLY,
				tb.ventaLY,
				tb.costoTY,
				tb.costoLY,
				tb.CtaVtaTYM,
				tb.UtilTY,
				tb.UtilLY,
				tb.MargenTY,
				tb.MargenLY,
				tb.DifParTYvsLY,
				tb.DifVtaTYvsLY,
				tb.DifMrgTYvsLY
			FROM
				#TVentasB2 AS tb
		
			OPEN db_cursor
			FETCH NEXT FROM db_cursor INTO
				@Fecha,
				@dia,
				@NDiaSemana,
				@UndParTY,
				@UndAccTY,
				@VtaParTY,
				@VtaAccTY,
				@UndParLY,
				@UndAccLY,
				@VtaParLY,
				@VtaAccLY,
				@CtoParTY,
				@CtoAccTY,
				@CtoParLY,
				@CtoAccLY,
				@unidadTY,
				@ventaTY,
				@unidadLY,
				@ventaLY,
				@costoTY,
				@costoLY,
				@CtaVtaTYMin,
				@UtilTY,
				@UtilLY,
				@MargenTY,
				@MargenLY,
				@DifParTYvsLY,
				@DifVtaTYvsLY,
				@DifMrgTYvsLY
		
			WHILE @@FETCH_STATUS = 0
			BEGIN
    	
				SET @hTML_Rpt_Diario_23 += '<tr>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-pesd">' + LEFT(@NDiaSemana, 2) + '</td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(@Dia AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-d4sb">' + CAST(FORMAT(@ventaTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UtilTY, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(FORMAT(@CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="' +
				/* MA: 2025-06-02 => Si no se tiene @CtaVtaTYMin o es menor que 1:  */
				CASE
					WHEN @CtaVtaTYMin < 1 THEN 'tg-ubmm'
					WHEN @CtaVtaTYMin > 1 and (((@ventaTY / @CtaVtaTYMin) * 100) >= 100) THEN 'tg-rfq8'
					WHEN @CtaVtaTYMin > 1 and ((@ventaTY / @CtaVtaTYMin) * 100) >= 80  THEN 'tg-o0c0'
					ELSE 'tg-ubmm'
				END	
			+ '">' + + CAST(ROUND(CAST((CASE WHEN @CtaVtaTYMin < 1 THEN 0.00 ELSE (@ventaTY / @CtaVtaTYMin) * 100 END) AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(FORMAT(@ventaTY - @CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				
				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@MargenTY * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR) + '%' + '</td>'
				--SELECT @hTML_Rpt_Diario_23 [PRUEBA3]

				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifParTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_23 += '	<td class="' +
				CASE
					WHEN (@DifVtaTYvsLY >= 0.2058) THEN 'tg-rfq8'
					WHEN (@DifVtaTYvsLY >= 0 AND
						@DifVtaTYvsLY < 0.2058) THEN 'tg-o0c0'
					WHEN @DifVtaTYvsLY < 0 THEN 'tg-ubmm'
				END
				+ '">' + CAST(ROUND(CAST(@DifVtaTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_23 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifMrgTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'


				SET @hTML_Rpt_Diario_23 += '</tr>'
    	
				-- Siguiente registro
				FETCH NEXT FROM db_cursor INTO
					@Fecha,
					@dia,
					@NDiaSemana,
					@UndParTY,
					@UndAccTY,
					@VtaParTY,
					@VtaAccTY,
					@UndParLY,
					@UndAccLY,
					@VtaParLY,
					@VtaAccLY,
					@CtoParTY,
					@CtoAccTY,
					@CtoParLY,
					@CtoAccLY,
					@unidadTY,
					@ventaTY,
					@unidadLY,
					@ventaLY,
					@costoTY,
					@costoLY,
					@CtaVtaTYMin,
					@UtilTY,
					@UtilLY,
					@MargenTY,
					@MargenLY,
					@DifParTYvsLY,
					@DifVtaTYvsLY,
					@DifMrgTYvsLY
			END
			CLOSE db_cursor
			DEALLOCATE db_cursor

			--SELECT @hTML_Rpt_Diario_23 [PRINT_DIARIO]
			--RETURN
			--
			-- Impresión de FOOTER
				
			SET @hTML_Rpt_Diario_AccPeq = ''
			SET @hTML_Rpt_Diario_AccGra = ''
			SET @hTML_Rpt_Diario_Pares = ''
			SET @hTML_Rpt_Diario_Unids = ''
			SET @hTML_Rpt_Diario_Monto = ''
			SET @hTML_Rpt_Diario_Util = ''
			SET @hTML_Rpt_Diario_VtaMin = ''
			SET @hTML_Rpt_Diario_CVtaMin = ''
			SET @hTML_Rpt_Diario_VarVtaMin = ''
			SET @hTML_Rpt_Diario_Margen = ''
			SET @hTML_Rpt_Diario_AccPTY = ''
			SET @hTML_Rpt_Diario_AccGTY = ''
			SET @hTML_Rpt_Diario_ParCTY = ''
			SET @hTML_Rpt_Diario_UnidadesDif = ''
			SET @hTML_Rpt_Diario_MontoDif = ''
			SET @hTML_Rpt_Diario_UtilDif = ''
			SET @hTML_Rpt_Diario_MontoCta = ''
			SET @hTML_Rpt_Diario_AvanceCta = ''
			SET @hTML_Rpt_Diario_White = ''

			SET @hTML_Rpt_Diario_CuotaPar = ''
			SET @hTML_Rpt_Diario_CuotaAcc = ''
			SET @hTML_Rpt_Diario_AvanceCtaPar = ''
			SET @hTML_Rpt_Diario_AvanceCtaAcc = ''


			

			SET @hTML_Rpt_Diario_23 += '
										<tr>
											<td class="tg-pesd"></td>
											<td class="tg-x028">Total</td>
										'
			SELECT
				@hTML_Rpt_Diario_Pares = '<td class="tg-x028">' + Pares + '</td>'
			 ,@hTML_Rpt_Diario_Monto = '<td class="tg-pksw">' + Monto + '</td>'
			 ,@hTML_Rpt_Diario_Util = '<td class="tg-x028">' + Util + '</td>'
			 ,@hTML_Rpt_Diario_VtaMin = '<td class="tg-x028">' + VtaMin + '</td>'
			 ,@hTML_Rpt_Diario_CVtaMin = '<td class="'
				+
			CASE
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 95 THEN 'tg-rfq8'
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 80 THEN 'tg-o0c0'
				WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 60 THEN 'tg-d4sb'
				ELSE 'tg-ubmm'
			END
				+ '">' + CVtaMin + '</td>'
			,@hTML_Rpt_Diario_VarVtaMin = '<td class="tg-x028">' + VarVtaMin + '</td>'
			 ,@hTML_Rpt_Diario_Margen = '<td class="tg-x028">' + Margen + '</td>'
				--,@hTML_Rpt_Diario_UnidadesDif='<td class="tg-x028">'+UnidadesDif+'</td>'
			 ,@hTML_Rpt_Diario_UnidadesDif = '<td class="tg-x028">' + UnidParDif + '</td>'
			 ,@hTML_Rpt_Diario_MontoDif = '<td class="'
				+
				CASE
					WHEN (MontoDifx >= 0.2058) THEN 'tg-rfq8'
					WHEN (MontoDifx >= 0 AND
						MontoDifx < 0.2058) THEN 'tg-o0c0'
					WHEN MontoDifx < 0 THEN 'tg-ubmm'
				END
				+ '">' + MontoDif + '</td>'
			 ,@hTML_Rpt_Diario_UtilDif = '<td class="tg-x028">' + UtilDif + '</td>'
				--,@hTML_Rpt_Diario_MontoCta='<td class="tg-7l0w">'+MontoCta+'</td>'
				--,@hTML_Rpt_Diario_AvanceCta='<td class="tg-7l0w">'+AvanceCta+'</td>'

			 --,@hTML_Rpt_Diario_White = '<td class="tg-fzdr"></td>'
			FROM (SELECT
				 CAST(FORMAT(Pares, '###,###,###') AS VARCHAR(100)) AS Pares
				 ,CAST(FORMAT(Monto, '###,###,###') AS VARCHAR(100)) AS Monto
				 ,CAST(FORMAT(Util, '###,###,###') AS VARCHAR(100)) AS Util
				 ,CAST(FORMAT(VtaMin, '###,###,###') AS VARCHAR(100)) AS VtaMin
				,CAST(ROUND(CAST(CVtaMin * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS CVtaMin
				,CAST(FORMAT(VarVtaMin, '###,###,###') AS VARCHAR(100)) AS VarVtaMin
				 ,CAST(ROUND(CAST(Margen * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR(100)) + '%' AS Margen

				 ,CAST(ROUND(CAST(UnidParDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidParDif

				 ,CAST(ROUND(CAST(UnidadesDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidadesDif
				 ,CAST(ROUND(CAST(MontoDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS MontoDif
				 ,MontoDif AS MontoDifx
				 ,CAST(ROUND(CAST(UtilDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UtilDif
				FROM (SELECT
					 SUM(a.UndParTY) AS Pares
					 ,SUM(a.ventaTY) AS Monto
					 ,SUM(a.UtilTY) AS Util
					 ,SUM(a.CtaVtaTYM) AS VtaMin
					 ,CASE WHEN SUM(a.CtaVtaTYM)<1 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.CtaVtaTYM)) END AS CVtaMin  /* MA: 2025-06-02 => Si no se tiene @CtaVtaTYMin o es menor que 1:  */
					 ,(SUM(a.ventaTY) - SUM(a.CtaVtaTYM)) AS VarVtaMin
					 --,(SUM(a.UtilTY) / SUM(a.ventaTY)) AS Margen
					 ,CASE WHEN SUM(a.ventaTY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.ventaTY)) END AS Margen

					 ,CASE WHEN CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndAccTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidAccDif
					 ,CASE WHEN CAST(SUM(a.UndParLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndParTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndParLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidParDif

					 ,CASE WHEN CAST(SUM(a.unidadLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.unidadTY) AS NUMERIC(10, 2)) / CAST(SUM(a.unidadLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidadesDif
					 ,CASE WHEN SUM(a.ventaLY)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.ventaLY)) - 1 END AS MontoDif
					 ,CASE WHEN SUM(a.UtilLY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.UtilLY)) - 1 END AS UtilDif
				FROM #TVentasB2 AS a) AS A) AS A

				SET @hTML_Rpt_Diario_23 += CONCAT(
				--@hTML_Rpt_Diario_Unids
				@hTML_Rpt_Diario_Pares
				, @hTML_Rpt_Diario_Monto
				, @hTML_Rpt_Diario_Util
				, @hTML_Rpt_Diario_VtaMin
				, @hTML_Rpt_Diario_CVtaMin
				, @hTML_Rpt_Diario_VarVtaMin
				, @hTML_Rpt_Diario_Margen
				, @hTML_Rpt_Diario_UnidadesDif
				, @hTML_Rpt_Diario_MontoDif
				, @hTML_Rpt_Diario_UtilDif
				--,@hTML_Rpt_Diario_MontoCta
				--,@hTML_Rpt_Diario_AvanceCta
-- 				, @hTML_Rpt_Diario_White
-- 				, @hTML_Rpt_Diario_Pares
-- 				, @hTML_Rpt_Diario_CuotaPar
-- 				, @hTML_Rpt_Diario_AvanceCtaPar
-- 				, @hTML_Rpt_Diario_AccGra
-- 				, @hTML_Rpt_Diario_CuotaAcc
-- 				, @hTML_Rpt_Diario_AvanceCtaAcc
				) + '</tr>'
		
				--SET @tableHTML = ''

				SET @v_VtaTY = (SELECT tb.ventaTY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))
				SET @v_VarVenTY = (SELECT tb.DifVtaTYvsLY
													 FROM   #TVentasB2 AS tb
													 WHERE  tb.dia = DAY(@fec))
				SET @v_VtaLY = (SELECT tb.ventaLY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))

				SET @v_VtaTY = ISNULL(@v_VtaTY, 0)
				SET @v_VarVenTY = ISNULL(@v_VarVenTY, 0)
				SET @v_VtaLY = ISNULL(@v_VtaLY, 0)

				SELECT
					'VENTA E-COMMERCE' AS [bloque]
				 ,@fec [@fec]
				 ,@v_VtaTY [@v_VtaTY]
				 ,@v_VarVenTY [@v_VarVenTY]
				 ,@v_VtaLY [@v_VtaLY];

									 
				SET @tableHTML = @tableHTML +
				N'<br><br><br>' +
				N'<div><b>VENTA CANAL E-COMMERCE: </b></div><br>' +
				N'<div>La venta total es de ' + CAST(FORMAT(@v_VtaTY, '###,###,###') AS VARCHAR(20)) + '; ' + 
				CASE 
						WHEN @v_VtaLY>0 THEN '<b>' + (CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '</b>  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20)))
						ELSE ' Sin ventas registradas en año pasado'
				END + ' .<div><br>' +
				N'<br>' +
				N'<table class="tg" style="undefined;table-layout: fixed; width: 751px">' +

				N'<colgroup>' +
				N'<col style="width: 40px">' +
				N'<col style="width: 48px">' +

				N'<col style="width: 48px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 80px">' +
				N'<col style="width: 80px">' +

				N'<col style="width: 70px">' +
				N'<col style="width: 80px">' +
				N'<col style="width: 70px">' +

				--N'<col style="width: 61px">'+ 
				--N'<col style="width: 68px">'+ 

				N'<col style="width: 68px">' +

				N'<col style="width: 80px">' +
				N'<col style="width: 80px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 50px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 60px">' +
				N'</colgroup>' +

				N'<tr>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-fkia" colspan="7">2025</th>' +
				N'<th class="tg-f7xs" colspan="3">DIFERENCIA</th>' +
				--N'<th class="tg-9m3w" colspan="2">VENTA S/.</th>'+
-- 				N'<th class="tg-fzdr" colspan="1">  </th>' +
-- 				N'<th class="tg-7l0w" colspan="6">VENTA UNIDADES</th>' +
				N'</tr>' +
				N'<tr>' +
				N'<td class="tg-pesd"></td>' +
				N'<td class="tg-x028">Dia</td>' +
				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				N'<td class="tg-x0282nn">Vta Mínima</td>' +
				N'<td class="tg-x0282nn">% Cumpl</td>' +
				N'<td class="tg-x0282nn">Var</td>' +
				N'<td class="tg-x028">Margen</td>' +

				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				--N'<td class="tg-x028">Unidades</td>'+ 

				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				--N'<td class="tg-x028">Mínimo</td>'+ 
				--N'<td class="tg-x028">Avance</td>'+ 
-- 				N'<td class="tg-fzdr"></td>' +
-- 				N'<td class="tg-x028">Pares</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
-- 				N'<td class="tg-x028">Acces</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
				N'</tr>' + @hTML_Rpt_Diario_23 +
				N'</table>';
			--	</body>
			--</html>';
			
		END
		

		--
		-- Bloque 2.4 Canal VENTAS ASISTIDAS
		IF 1=1
		BEGIN
			DECLARE @hTML_Rpt_Diario_24 NVARCHAR(MAX) = '';
			
			IF OBJECT_ID('tempdb..#TProyeccionVAsistidas') IS NOT NULL DROP TABLE #TProyeccionVAsistidas;
		CREATE TABLE #TProyeccionVAsistidas
		(
			Fecha           DATE
		   ,dia             INT
		   ,NDiaSemana      VARCHAR(20)
		   ,CtaUndParTY     INT
		   ,CtaVtaParTY     DECIMAL(10 ,2)
		   ,CtaUndAccTY     INT
		   ,CtaVtaAccTY     DECIMAL(10 ,2)
		   ,CtaUndTY        INT
		   ,CtaVtaTY        DECIMAL(10 ,2)
		)
			INSERT INTO #TProyeccionVAsistidas
		(
			Fecha,
			dia,
			NDiaSemana,
			CtaUndParTY,
			CtaVtaParTY,
			CtaUndAccTY,
			CtaVtaAccTY,
			CtaUndTY,
			CtaVtaTY
		)
		SELECT
			tv.Fecha,
			tv.Dia,
			tv.NDiaSemana,
			SUM(vpv.Par) AS CtaUndParTY,
			SUM(vpv.VtaPar_TY) AS CtaVtaParTY,
			SUM(vpv.Acc) AS CtaUndAccTY,
			SUM(vpv.VtaAcc_TY) AS CtaVtaAccTY,
			SUM(vpv.Par)+SUM(vpv.Acc) AS CtaUndTY,
			SUM(vpv.monto) AS CtaVtaTY
		FROM
			TiempoVersus AS tv
		INNER JOIN vw_proyecciones_TY AS vpv ON vpv.Fecha = tv.FechaSK
		WHERE tv.Fecha BETWEEN @FechaIniTY AND @fec AND vpv.canal = 'Ventas Asistidas'
		GROUP BY tv.Fecha, tv.Dia, tv.NDiaSemana

			TRUNCATE TABLE #TVentasB2;

			INSERT INTO #TVentasB2
			(
				Fecha,
				dia,
				NDiaSemana,
				UndParTY,
				UndAccTY,
				VtaParTY,
				VtaAccTY,
				UndParLY,
				UndAccLY,
				VtaParLY,
				VtaAccLY,
				CtoParTY,
				CtoAccTY,
				CtoParLY,
				CtoAccLY,
				unidadTY,
				ventaTY,
				unidadLY,
				ventaLY,
				costoTY,
				costoLY,
				CtaVtaTYM
			)
			SELECT tv.Fecha
						,tv.dia
						,tv.NDiaSemana
						,SUM(t.UndParTY)         AS UndParTY
						,SUM(t.UndAccTY)         AS UndAccTY
						,SUM(t.VtaParTY)         AS VtaParTY
						,SUM(t.VtaAccTY)         AS VtaAccTY
						,SUM(t.UndParLY)         AS UndParLY
						,SUM(t.UndAccLY)         AS UndAccLY
						,SUM(t.VtaParLY)         AS VtaParLY
						,SUM(t.VtaAccLY)         AS VtaAccLY
						,SUM(t.CtoParTY)         AS CtoParTY
						,SUM(t.CtoAccTY)         AS CtoAccTY
						,SUM(t.CtoParLY)         AS CtoParLY
						,SUM(t.CtoAccLY)         AS CtoAccLY
						,SUM(t.unidadTY)         AS unidadTY
						,SUM(t.ventaTY)          AS ventaTY
						,SUM(t.unidadLY)         AS unidadLY
						,SUM(t.ventaLY)          AS ventaLY
						,SUM(t.costoTY)          AS costoTY
						,SUM(t.costoLY)          AS costoLY
						,SUM(tr.CtaVtaTY) 		AS CtaVtaTYM
			FROM   TiempoVersus            AS tv
						 LEFT JOIN #TVentas2     AS t
									ON  t.Fecha = tv.Fecha
						LEFT JOIN #TProyeccionVAsistidas  AS tr
		            ON  tr.Fecha = t.Fecha
			WHERE  tv.Fecha BETWEEN @FechaIniTY AND @fec
			AND t.canal='Ventas Asistidas'
			GROUP BY
						 tv.Fecha
						,tv.Dia
						,tv.NDiaSemana
							
			DECLARE db_cursor CURSOR FOR
			SELECT
				tb.Fecha,
				tb.dia,
				tb.NDiaSemana,
				tb.UndParTY,
				tb.UndAccTY,
				tb.VtaParTY,
				tb.VtaAccTY,
				tb.UndParLY,
				tb.UndAccLY,
				tb.VtaParLY,
				tb.VtaAccLY,
				tb.CtoParTY,
				tb.CtoAccTY,
				tb.CtoParLY,
				tb.CtoAccLY,
				tb.unidadTY,
				tb.ventaTY,
				tb.unidadLY,
				tb.ventaLY,
				tb.costoTY,
				tb.costoLY,
				tb.CtaVtaTYM,
				tb.UtilTY,
				tb.UtilLY,
				tb.MargenTY,
				tb.MargenLY,
				tb.DifParTYvsLY,
				tb.DifVtaTYvsLY,
				tb.DifMrgTYvsLY
			FROM
				#TVentasB2 AS tb
		
			OPEN db_cursor
			FETCH NEXT FROM db_cursor INTO
				@Fecha,
				@dia,
				@NDiaSemana,
				@UndParTY,
				@UndAccTY,
				@VtaParTY,
				@VtaAccTY,
				@UndParLY,
				@UndAccLY,
				@VtaParLY,
				@VtaAccLY,
				@CtoParTY,
				@CtoAccTY,
				@CtoParLY,
				@CtoAccLY,
				@unidadTY,
				@ventaTY,
				@unidadLY,
				@ventaLY,
				@costoTY,
				@costoLY,
				@CtaVtaTYMin,
				@UtilTY,
				@UtilLY,
				@MargenTY,
				@MargenLY,
				@DifParTYvsLY,
				@DifVtaTYvsLY,
				@DifMrgTYvsLY
		
			WHILE @@FETCH_STATUS = 0
			BEGIN
    	
				SET @hTML_Rpt_Diario_24 += '<tr>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-pesd">' + LEFT(@NDiaSemana, 2) + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(@Dia AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-d4sb">' + CAST(FORMAT(@ventaTY, '###,###,###') AS VARCHAR) + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UtilTY, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="' +
				CASE
					WHEN @CtaVtaTYMin = 0 THEN 'tg-ubmm'
					WHEN (((@ventaTY / @CtaVtaTYMin) * 100) >= 100) THEN 'tg-rfq8'
					WHEN ((@ventaTY / @CtaVtaTYMin) * 100) >= 80  THEN 'tg-o0c0'
					ELSE 'tg-ubmm'
				END	
			+ '">' + + CAST(ROUND(CAST((CASE WHEN @CtaVtaTYMin = 0 THEN 0.00 ELSE (@ventaTY / @CtaVtaTYMin) * 100 END) AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@ventaTY - @CtaVtaTYMin, '###,###,###') AS VARCHAR) + ' </td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@MargenTY * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR) + '%' + '</td>'
				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifParTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_24 += '	<td class="' +
				CASE
					WHEN (@DifVtaTYvsLY >= 0.2058) THEN 'tg-rfq8'
					WHEN (@DifVtaTYvsLY >= 0 AND
						@DifVtaTYvsLY < 0.2058) THEN 'tg-o0c0'
					WHEN @DifVtaTYvsLY < 0 THEN 'tg-ubmm'
				END
				+ '">' + CAST(ROUND(CAST(@DifVtaTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(ROUND(CAST(@DifMrgTYvsLY * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr"></td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndParTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndParTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndParTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-fzdr">' + CAST(FORMAT(@UndAccTY, '###,###,###') AS VARCHAR) + '</td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-d4sb">' + CAST(FORMAT(@CtaUndAccTY, '###,###,###') AS VARCHAR) + ' </td>'
-- 				SET @hTML_Rpt_Diario_24 += '	<td class="tg-d4sb">' + CAST(ROUND(CAST(@AvaUndAccTY * 100 AS NUMERIC(10, 0)), 0) AS VARCHAR) + '%' + '</td>'

				SET @hTML_Rpt_Diario_24 += '</tr>'
    	
				-- Siguiente registro
				FETCH NEXT FROM db_cursor INTO
					@Fecha,
					@dia,
					@NDiaSemana,
					@UndParTY,
					@UndAccTY,
					@VtaParTY,
					@VtaAccTY,
					@UndParLY,
					@UndAccLY,
					@VtaParLY,
					@VtaAccLY,
					@CtoParTY,
					@CtoAccTY,
					@CtoParLY,
					@CtoAccLY,
					@unidadTY,
					@ventaTY,
					@unidadLY,
					@ventaLY,
					@costoTY,
					@costoLY,
					@CtaVtaTYMin,
					@UtilTY,
					@UtilLY,
					@MargenTY,
					@MargenLY,
					@DifParTYvsLY,
					@DifVtaTYvsLY,
					@DifMrgTYvsLY
			END
			CLOSE db_cursor
			DEALLOCATE db_cursor

			--
			-- Impresión de FOOTER
				
			SET @hTML_Rpt_Diario_AccPeq = ''
			SET @hTML_Rpt_Diario_AccGra = ''
			SET @hTML_Rpt_Diario_Pares = ''
			SET @hTML_Rpt_Diario_Unids = ''
			SET @hTML_Rpt_Diario_Monto = ''
			SET @hTML_Rpt_Diario_Util = ''
			SET @hTML_Rpt_Diario_VtaMin = ''
			SET @hTML_Rpt_Diario_CVtaMin = ''
			SET @hTML_Rpt_Diario_VarVtaMin = ''
			SET @hTML_Rpt_Diario_Margen = ''
			SET @hTML_Rpt_Diario_AccPTY = ''
			SET @hTML_Rpt_Diario_AccGTY = ''
			SET @hTML_Rpt_Diario_ParCTY = ''
			SET @hTML_Rpt_Diario_UnidadesDif = ''
			SET @hTML_Rpt_Diario_MontoDif = ''
			SET @hTML_Rpt_Diario_UtilDif = ''
			SET @hTML_Rpt_Diario_MontoCta = ''
			SET @hTML_Rpt_Diario_AvanceCta = ''
			SET @hTML_Rpt_Diario_White = ''

			SET @hTML_Rpt_Diario_CuotaPar = ''
			SET @hTML_Rpt_Diario_CuotaAcc = ''
			SET @hTML_Rpt_Diario_AvanceCtaPar = ''
			SET @hTML_Rpt_Diario_AvanceCtaAcc = ''

			SET @hTML_Rpt_Diario_24 += '
										<tr>
											<td class="tg-pesd"></td>
											<td class="tg-x028">Total</td>
										'
			SELECT
				@hTML_Rpt_Diario_Pares = '<td class="tg-x028">' + Pares + '</td>'
			 ,@hTML_Rpt_Diario_Monto = '<td class="tg-pksw">' + Monto + '</td>'
			 ,@hTML_Rpt_Diario_Util = '<td class="tg-x028">' + Util + '</td>'
			 ,@hTML_Rpt_Diario_VtaMin = '<td class="tg-x028">' + VtaMin + '</td>'
			 ,@hTML_Rpt_Diario_CVtaMin = '<td class="'
				+
				CASE
					WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 95 THEN 'tg-rfq8'
					WHEN CAST(SUBSTRING(CVtaMin, 1, LEN(CVtaMin) - 1) AS DECIMAL(5,2)) >= 80 THEN 'tg-o0c0'
					ELSE 'tg-ubmm'
				END
				+ '">' + CVtaMin + '</td>'
			,@hTML_Rpt_Diario_VarVtaMin = '<td class="tg-x028">' + VarVtaMin + '</td>'
			 ,@hTML_Rpt_Diario_Margen = '<td class="tg-x028">' + Margen + '</td>'
				--,@hTML_Rpt_Diario_UnidadesDif='<td class="tg-x028">'+UnidadesDif+'</td>'
			 ,@hTML_Rpt_Diario_UnidadesDif = '<td class="tg-x028">' + UnidParDif + '</td>'
			 ,@hTML_Rpt_Diario_MontoDif = '<td class="'
				+
				CASE
					WHEN (MontoDifx >= 0.2058) THEN 'tg-rfq8'
					WHEN (MontoDifx >= 0 AND
						MontoDifx < 0.2058) THEN 'tg-o0c0'
					WHEN MontoDifx < 0 THEN 'tg-ubmm'
				END
				+ '">' + MontoDif + '</td>'
			 ,@hTML_Rpt_Diario_UtilDif = '<td class="tg-x028">' + UtilDif + '</td>'
				--,@hTML_Rpt_Diario_MontoCta='<td class="tg-7l0w">'+MontoCta+'</td>'
				--,@hTML_Rpt_Diario_AvanceCta='<td class="tg-7l0w">'+AvanceCta+'</td>'

			 --,@hTML_Rpt_Diario_White = '<td class="tg-fzdr"></td>'
			FROM (SELECT
				 CAST(FORMAT(Pares, '###,###,###') AS VARCHAR(100)) AS Pares
				 ,CAST(FORMAT(Monto, '###,###,###') AS VARCHAR(100)) AS Monto
				 ,CAST(FORMAT(Util, '###,###,###') AS VARCHAR(100)) AS Util
				 ,CAST(FORMAT(VtaMin, '###,###,###') AS VARCHAR(100)) AS VtaMin
				,CAST(ROUND(CAST(CVtaMin * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS CVtaMin
				,CAST(FORMAT(VarVtaMin, '###,###,###') AS VARCHAR(100)) AS VarVtaMin
				 ,CAST(ROUND(CAST(Margen * 100 AS NUMERIC(10, 1)), 1) AS VARCHAR(100)) + '%' AS Margen

				 ,CAST(ROUND(CAST(UnidParDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidParDif

				 ,CAST(ROUND(CAST(UnidadesDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UnidadesDif
				 ,CAST(ROUND(CAST(MontoDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS MontoDif
				 ,MontoDif AS MontoDifx
				 ,CAST(ROUND(CAST(UtilDif * 100 AS NUMERIC(10, 2)), 2) AS VARCHAR(100)) + '%' AS UtilDif
				FROM (SELECT
					 SUM(a.UndParTY) AS Pares
					 ,SUM(a.ventaTY) AS Monto
					 ,SUM(a.UtilTY) AS Util
					 ,SUM(a.CtaVtaTYM) AS VtaMin
					 ,CASE WHEN SUM(a.CtaVtaTYM)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.CtaVtaTYM)) END AS CVtaMin
					 ,(SUM(a.ventaTY) - SUM(a.CtaVtaTYM)) AS VarVtaMin
					 --,(SUM(a.UtilTY) / SUM(a.ventaTY)) AS Margen
					 ,CASE WHEN SUM(a.ventaTY) = 0 THEN 0.00 ELSE SUM(a.UtilTY) / SUM(a.ventaTY) END AS Margen

					 ,CASE WHEN CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndAccTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndAccLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidAccDif
					 ,CASE WHEN CAST(SUM(a.UndParLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.UndParTY) AS NUMERIC(10, 2)) / CAST(SUM(a.UndParLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidParDif

					 ,CASE WHEN CAST(SUM(a.unidadLY) AS NUMERIC(10, 2))=0 THEN 0.00 ELSE CAST(CAST(SUM(a.unidadTY) AS NUMERIC(10, 2)) / CAST(SUM(a.unidadLY) AS NUMERIC(10, 2)) - 1 AS NUMERIC(7, 4)) END AS UnidadesDif
					 ,CASE WHEN SUM(a.ventaLY)=0 THEN 0.00 ELSE (SUM(a.ventaTY) / SUM(a.ventaLY)) - 1 END AS MontoDif
					 ,CASE WHEN SUM(a.UtilLY)=0 THEN 0.00 ELSE (SUM(a.UtilTY) / SUM(a.UtilLY)) - 1 END AS UtilDif
				FROM #TVentasB2 AS a) AS A) AS A

				SET @hTML_Rpt_Diario_24 += CONCAT(
				--@hTML_Rpt_Diario_Unids
				@hTML_Rpt_Diario_Pares
				, @hTML_Rpt_Diario_Monto
				, @hTML_Rpt_Diario_Util
				, @hTML_Rpt_Diario_VtaMin
				, @hTML_Rpt_Diario_CVtaMin
				, @hTML_Rpt_Diario_VarVtaMin
				, @hTML_Rpt_Diario_Margen
				, @hTML_Rpt_Diario_UnidadesDif
				, @hTML_Rpt_Diario_MontoDif
				, @hTML_Rpt_Diario_UtilDif
				--,@hTML_Rpt_Diario_MontoCta
				--,@hTML_Rpt_Diario_AvanceCta
-- 				, @hTML_Rpt_Diario_White
-- 				, @hTML_Rpt_Diario_Pares
-- 				, @hTML_Rpt_Diario_CuotaPar
-- 				, @hTML_Rpt_Diario_AvanceCtaPar
-- 				, @hTML_Rpt_Diario_AccGra
-- 				, @hTML_Rpt_Diario_CuotaAcc
-- 				, @hTML_Rpt_Diario_AvanceCtaAcc
				) + '</tr>'
		
				--SET @tableHTML = ''

				SET @v_VtaTY = (SELECT tb.ventaTY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))
				SET @v_VarVenTY = (SELECT tb.DifVtaTYvsLY
													 FROM   #TVentasB2 AS tb
													 WHERE  tb.dia = DAY(@fec))
				SET @v_VtaLY = (SELECT tb.ventaLY
												FROM   #TVentasB2 AS tb
												WHERE  tb.dia = DAY(@fec))

				SET @v_VtaTY = ISNULL(@v_VtaTY, 0)
				SET @v_VarVenTY = ISNULL(@v_VarVenTY, 0)
				SET @v_VtaLY = ISNULL(@v_VtaLY, 0)

				SELECT
					'VENTAS ASISTIDAS' AS [bloque]
				 ,@fec [@fec]
				 ,@v_VtaTY [@v_VtaTY]
				 ,@v_VarVenTY [@v_VarVenTY]
				 ,@v_VtaLY [@v_VtaLY];

					
				
				SET @tableHTML = @tableHTML +
				N'<br><br><br>' +
				N'<div><b>VENTA VENTAS ASISTIDAS: </b></div><br>' +
				N'<div>La venta total es de ' + CAST(FORMAT(@v_VtaTY, '###,###,###') AS VARCHAR(20)) + '; ' + 
				CASE 
						WHEN @v_VtaLY>0 THEN '<b>' + (CAST(ROUND(CAST(@v_VarVenTY * 100 AS NUMERIC(7, 2)), 2) AS VARCHAR(100)) + '%') + '</b>  de diferencia con el año pasado  que  fue de ' + (CAST(FORMAT(@v_VtaLY, '###,###,###') AS VARCHAR(20)))
						ELSE ' Sin ventas registradas en año pasado'
				END + ' .<div><br>' +
				N'<br>' +
				N'<table class="tg" style="undefined;table-layout: fixed; width: 767px">' +

				N'<colgroup>' +
				N'<col style="width: 40px">' +
				N'<col style="width: 48px">' +

				N'<col style="width: 50px">' +
				N'<col style="width: 84px">' +
				N'<col style="width: 80px">' +
				N'<col style="width: 90px">' +

				N'<col style="width: 80px">' +
				N'<col style="width: 70px">' +
				N'<col style="width: 61px">' +

				--N'<col style="width: 61px">'+ 
				--N'<col style="width: 68px">'+ 

				N'<col style="width: 70px">' +

				N'<col style="width: 70px">' +
				N'<col style="width: 70px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 50px">' +
				N'<col style="width: 60px">' +
				N'<col style="width: 60px">' +
				N'</colgroup>' +

				N'<tr>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-pesd"></th>' +
				N'<th class="tg-fkia" colspan="7">2025</th>' +
				N'<th class="tg-f7xs" colspan="3">DIFERENCIA</th>' +
				--N'<th class="tg-9m3w" colspan="2">VENTA S/.</th>'+
-- 				N'<th class="tg-fzdr" colspan="1">  </th>' +
-- 				N'<th class="tg-7l0w" colspan="6">VENTA UNIDADES</th>' +
				N'</tr>' +
				N'<tr>' +
				N'<td class="tg-pesd"></td>' +
				N'<td class="tg-x028">Dia</td>' +
				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				N'<td class="tg-x0282nn">Vta Mínima</td>' +
				N'<td class="tg-x0282nn">% Cumpl</td>' +
				N'<td class="tg-x0282nn">Var</td>' +
				N'<td class="tg-x028">Margen</td>' +

				--N'<td class="tg-x028">AccSec</td>'+ 
				--N'<td class="tg-x028">AccPri</td>'+ 
				N'<td class="tg-x028">Pares</td>' +
				--N'<td class="tg-x028">Unidades</td>'+ 

				N'<td class="tg-x028">Monto</td>' +
				N'<td class="tg-x028">U.B.</td>' +
				--N'<td class="tg-x028">Mínimo</td>'+ 
				--N'<td class="tg-x028">Avance</td>'+ 
-- 				N'<td class="tg-fzdr"></td>' +
-- 				N'<td class="tg-x028">Pares</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
-- 				N'<td class="tg-x028">Acces</td>' +
-- 				N'<td class="tg-x028">Mínimo</td>' +
-- 				N'<td class="tg-x028">Avance</td>' +
				N'</tr>' + @hTML_Rpt_Diario_24 +
				N'</table>';
			--	</body>
			--</html>';
			
		END
		--
		--
		 --PRINT 'EJECUTADO HASTA AQUI';
 		--SELECT @tableHTML [@tableHTML];	
 		--RETURN
		---
		--- Enviar Correo
		BEGIN
		    EXEC msdb.dbo.sp_send_dbmail @profile_name='DBA_Passarela'
		        --,@recipients='johnny.marin@footloose.pe' --@email
				,@recipients='vdm.info@footloose.pe'
		        ,@subject=@asunto
		        ,@body=@tableHTML
				,@blind_copy_recipients= N'Miguel Ayte <miguel.ayte@footloose.pe>'
		        ,@body_format='HTML';
		END

	END
	
	
END
```