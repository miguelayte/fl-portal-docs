File: `sp_compras.sql`
```
/******Comentado la tabla Factura por que por el momento no se usa   jose Date: 31/05/2017 11:16:41 a.m. ******/ 
-- exec [dbo].[sp_compras]
ALTER PROCEDURE [dbo].[sp_compras]
AS
BEGIN                        
	DECLARE @PERIODOS VARCHAR(20);
	---
	--- Solo a inicio de año
	/*
	 DELETE FROM dbo.OC  WHERE LEFT(FECHAEMISION,4) IN ('2023','2024')    
	 DELETE FROM DBO.PRECOMPRA                          
	 DELETE dbo.GUIA where periodo IN ('2023','2024')
	 */
	 ---
	 ---Solo el año en curso
	 --DELETE FROM dbo.OC  WHERE LEFT(FECHAEMISION,4) IN ('2024')    
	 DELETE FROM DBO.PRECOMPRA                          
	 DELETE dbo.GUIA where periodo IN ('2025')                                                   

 -- drop table GuiaLog                    
       
/************************************/
	---PRODUCTOS 
/************************************/
                        
	 DROP TABLE productos_compra
	 SELECT * INTO productos_compra from producto 
		      
/************************************/
	---OC 
/************************************/
BEGIN
	SET @periodos='2024';
	
	DELETE FROM dbo.OC WHERE LEFT(FECHAEMISION,4) IN (@periodos);    

	EXECUTE SERVNPROD.bd_passarela.dbo.tb_dwh_oc_UPDATE @periodos;
	
	INSERT INTO OC
	(
		DBF_NCOM,
		SERIENUMERO,
		FECHAEMISION,
		FECHAENTREGA,
		proveedor,
		CONDICIONPAGO,
		DIAS,
		FECHAVENCIMIENTO,
		MONEDA,
		SKU,
		PRODUCTO,
		ALMACEN,
		cantidad,
		PRECIOCOSTO_Sigv,
		PRECIOBLANCO_Cigv,
		ID,
		ESTADO,
		MARGEN,
		FECHAEMISIONB,
		FECHAENTREGAB
	)
	SELECT 
		DBF_NCOM,
		SERIENUMERO,
		FECHAEMISION,
		FECHAENTREGA,
		proveedor,
		CONDICIONPAGO,
		DIAS,
		FECHAVENCIMIENTO,
		MONEDA,
		SKU,
		PRODUCTO,
		ALMACEN,
		cantidad,
		PRECIOCOSTO_Sigv,
		PRECIOBLANCO_Cigv,
		ID,
		ESTADO,
		MARGEN,
		FECHAEMISIONB,
		FECHAENTREGAB
	FROM SERVNPROD.bd_passarela.dbo.tb_dwh_oc
	
END


DECLARE @OpenQuery        VARCHAR(MAX)
       ,@Script           VARCHAR(MAX)
       ,@LinkedServer     VARCHAR(MAX)


/*******************************************
 * -- PRE COMPRAS
 *******************************************/
BEGIN
	SET		@LinkedServer = 'SERVNPROD'

	--SET @PERIODOS='''''2023'''',''''2024'''''

	SET @OpenQuery = '	INSERT INTO  dbo.PRECOMPRA	SELECT	* 
									FROM	OPENQUERY(' + @LinkedServer + ','''
	SET @Script =    '
			SELECT 
				DBF_NCOM 
				 ,SERIENUMERO 
				 ,FECHAEMISION 
				 ,FECHAENTREGA 
				 ,RTRIM(B.CODIGO) + '''' - '''' + RTRIM(B.PATERNO) +'''' ''''+ RTRIM(B.MATERNO) +'''' ''''+ RTRIM(B.NOMBRE) as proveedor
				 ,CONDICIONPAGO
				 ,DIAS 
				 ,FECHAVENCIMIENTO
				 ,MONEDA
				 ,SKU
				 ,PRODUCTO
				 ,ALMACEN
				 ,CANTIDAD 
				 ,PRECIOCOSTO_Sigv
				 ,PRECIOBLANCO_Cigv
				 ,ID
				 ,A.ESTADO 

				 ,CASE 
							 WHEN PRECIOBLANCO_Cigv=0.00 THEN 0.00
							 WHEN PRECIOBLANCO_Cigv>18800000000.00 THEN 0.00
							 WHEN PRECIOBLANCO_Cigv!=0.00 THEN CAST(
												(PRECIOBLANCO_Cigv-(PRECIOCOSTO_Sigv*1.18))/PRECIOBLANCO_Cigv AS DECIMAL(8 ,2)
										)
					END  AS MARGEN 


				 ,FECHAEMISIONB
				 ,FECHAENTREGAB
				 ,fechaentregaSku
		
			FROM (
			
				SELECT 

				 A.TRANSACCIONCABECERA
				,B.DBF_NCOM
				,B.SERIE + ''''-'''' +  B.NUMERO AS SERIENUMERO
				,LEFT(B.FECHAEMISION,8) AS FECHAEMISION
				,LEFT(B.FECHAENTREGA,8) AS FECHAENTREGA
				,B.PROVEEDOR
				,ISNULL(FP.NOMBRE,'''''''') AS CONDICIONPAGO
				,ISNULL(FP.NUMERODIA,''''0'''') AS DIAS
				,LEFT(B.FECHAVENCIMIENTO,8) AS FECHAVENCIMIENTO
				,case when isnull(B.MONEDA,''''0'''') = ''''100911'''' then ''''SOLES'''' else ''''DOLARES'''' end as MONEDA 
				,P.CODIGOINTERNO AS SKU
				,P.NOMBRE AS PRODUCTO
				,B.INGRESO
				,A.CANTIDAD
				,CAST(A.PRECIOVENTA AS DECIMAL(18,2)) AS PRECIOBLANCO_Cigv
				,  CASE WHEN  ISNULL(A.CANTIDAD,''''0'''') <> ''''0'''' THEN case when isnull(A.MONTONETO,''''0.00'''') = ''''0'''' or  cast(A.MONTONETO as varchar) = '''''''' then ''''0.00'''' else  cast( convert(decimal(8,2), ISNULL(A.MONTONETO,''''0.00'''')) / isnull(A.CANTIDAD,''''0'''') as decimal(8,4)) end ELSE ''''0.00'''' END as PRECIOCOSTO_Sigv  
				,B.SERIE + ''''-'''' +  B.NUMERO+''''-''''+P.CODIGOINTERNO+''''-''''+B.PERIODO AS ID
				,'''''''' AS ESTADO
				,A.MONTONETO
						,SUBSTRING(B.FECHAEMISION,7,2)+''''/''''+ SUBSTRING(B.FECHAEMISION,5,2) +''''/''''+ left(B.FECHAEMISION ,4) as  FECHAEMISIONB
						,SUBSTRING(B.FECHAENTREGA,7,2)+''''/''''+ SUBSTRING(B.FECHAENTREGA,5,2) +''''/''''+ left(B.FECHAENTREGA ,4) as  FECHAENTREGAB 
				,al.fox_nombre +'''' ''''+ al.NOMBRE as ALMACEN
				,CASE WHEN A.fecha=''''000000'''' THEN '''''''' 
				 WHEN ISNULL(A.fecha,'''''''')='''''''' THEN '''''''' ELSE	 	
				 SUBSTRING(A.fecha,7,2)+''''/''''+ SUBSTRING(A.fecha,5,2) +''''/''''+ left(A.fecha ,4) END  as  fechaentregaSku
			 
				FROM  bd_passarela.dbo.TRANSACCIONDETALLE A WITH(NOLOCK) 
				INNER JOIN bd_passarela.dbo.TRANSACCIONCABECERA B WITH(NOLOCK) ON  B.TRANSACCIONCABECERA = A.TRANSACCIONCABECERAidx and A.TRANSACCIONCABECERAcvidx =  B.cvid and B.TRANSACCIONTIPO = A.TRANSACCIONTIPO 
				INNER JOIN bd_passarela.dbo.FORMAPAGO FP WITH(NOLOCK) ON (cast(FP.cvid as varchar)+cast(FP.FORMAPAGO as varchar)= B.FORMAPAGO ) 
				INNER JOIN (SELECT cast(cvid as varchar)+cast(ALMACEN as varchar) AS ALMACEN,fox_nombre,NOMBRE FROM  bd_passarela.dbo.ALMACEN) al on AL.ALMACEN =B.INGRESO
				INNER JOIN (SELECT CAST(CVID AS VARCHAR) + CAST(PRODUCTO AS VARCHAR) AS PRODUCTO , CODIGOINTERNO,NOMBRE FROM bd_passarela.dbo.PRODUCTO WITH(NOLOCK) ) P ON A.PRODUCTO = P.PRODUCTO

				WHERE A.TRANSACCIONTIPO=100911 AND B.PERIODO IN ('+ @PERIODOS +')  AND B.ESTADOCABECERA=1 and RTRIM(LTRIM(B.GLOSA)) = ''''PRE-COMPRA''''

			) A  INNER JOIN bd_passarela.dbo.PERSONA B  ON cast(b.cvid as varchar) + cast(b.persona as varchar) = a.PROVEEDOR AND B.PERSONATIPOPERSONA=''''100915''''
		
					'')
	 '


	EXEC (@OpenQuery + @Script)		

	SET @OpenQuery = ''; 
	SET @Script = '';
	
END



/*******************************************
 * MIGRACION DE GUIAS
 *******************************************/

BEGIN
	DELETE dbo.GUIA where periodo IN ('2025') 

	IF OBJECT_ID('tempdb..#Tb_Guia') IS NOT NULL DROP TABLE #Tb_Guia ;
	IF OBJECT_ID('tempdb..#DUPLICADOS') IS NOT NULL DROP TABLE #DUPLICADOS ;

	/************************************/
		---GUIA INGRESO
	/************************************/

	SELECT A.*
				,RTRIM(B.CODIGO)+' - '+RTRIM(B.PATERNO)+' '+RTRIM(B.MATERNO)+' '+RTRIM(B.NOMBRE) AS PROVEEDOR
	INTO   #Tb_Guia
	FROM   (
						 SELECT A.TRANSACCIONCABECERA
										--,B.cvid
									 ,B.periodo
									 ,B.DBF_NCOM
									 ,B.SERIE+'-'+B.NUMERO  AS SERIENUMERO
									 ,LEFT(B.FECHAREGISTRO ,8) AS FECHAREGISTRO
									 ,LEFT(B.FECHAEMISION ,8) AS FECHAEMISION
									 ,CASE 
												 WHEN ISNULL(B.fecharecepcion ,'')='' THEN '19900101'
												 ELSE LEFT(B.fecharecepcion ,8)
										END                   AS FECHAENTREGA
									 ,B.PROVEEDOR           AS proveedorid
									 ,CASE 
												 WHEN ISNULL(B.MONEDA ,'0')='100911' THEN 'SOLES'
												 ELSE 'DOLARES'
										END                   AS MONEDA
									 ,A.PRODUCTO            AS CODPRODUCTO
									 ,P.CODIGOINTERNO       AS SKU
									 ,P.NOMBRE              AS PRODUCTO
									 ,A.CANTIDAD
									 ,A.PRECIO
									 ,A.DESCUENTO
									 ,CAST(ISNULL(A.MONTONETO ,'0.00') AS DECIMAL(10 ,2)) AS VALORVENTA
									 ,CONVERT(DECIMAL(18 ,2) ,ISNULL(A.PRECIOVENTA ,'0.00')) AS PRECIOBLANCO_Cigv
									 ,AL.fox_nombre+' '+AL.NOMBRE AS ALMACEN
									 ,''                    AS ID
									 ,SUBSTRING(B.FECHAEMISION ,7 ,2)+'/'+SUBSTRING(B.FECHAEMISION ,5 ,2)+'/'+LEFT(B.FECHAEMISION ,4) AS 
										FECHAEMISIONB
									 ,CAST(
												CONVERT(
														CHAR(10)
													 ,LEFT(ISNULL(B.FECHARECEPCION ,'19900101') ,8)
													 ,120
												) AS DATE
										)                     AS FECHAENTREGAB 
										--,*
						 FROM   SERVNPROD.bd_passarela.dbo.TRANSACCIONDETALLE A WITH(NOLOCK)
										INNER JOIN SERVNPROD.bd_passarela.dbo.TRANSACCIONCABECERA B WITH(NOLOCK)
												 ON  B.TRANSACCIONCABECERA = A.transaccioncabeceraidx
														 AND B.cvid = A.transaccioncabeceracvidx
														 AND B.TRANSACCIONTIPO = A.TRANSACCIONTIPO
										INNER JOIN (
														 SELECT CVID
																	 ,PRODUCTO
																	 ,CODIGOINTERNO
																	 ,NOMBRE
														 FROM   SERVNPROD.bd_passarela.dbo.PRODUCTO WITH(NOLOCK)
												 ) P
												 ON  A.productoid = P.PRODUCTO
														 AND A.productocvid = P.cvid
										INNER JOIN SERVNPROD.bd_passarela.dbo.ALMACEN AL
												 ON  CAST(AL.cvid AS VARCHAR)+CAST(AL.ALMACEN AS VARCHAR) = B.INGRESO
						 --WHERE B.TRANSACCIONTIPO=100912 AND B.PERIODO IN ('2022','2024')  AND B.ESTADOCABECERA=1
						 WHERE  B.TRANSACCIONTIPO = 100912 AND B.PERIODO IN ('2025') AND B.ESTADOCABECERA = 1
				 ) A
				 INNER JOIN SERVNPROD.bd_passarela.dbo.PERSONA B
							ON  CAST(b.cvid AS VARCHAR)+CAST(b.persona AS VARCHAR) = a.proveedorid
				 INNER JOIN SERVNPROD.bd_passarela.dbo.PERSONATIPODOCUMENTO pd ON b.cvidpersona = pd.persona AND pd.personatipo = '100915'

				 /*INNER JOIN SERVNPROD.bd_passarela.dbo.PERSONA B
							ON  CAST(b.cvid AS VARCHAR)+CAST(b.persona AS VARCHAR) = a.proveedorid
									AND B.PERSONATIPOPERSONA = '100915'*/

 
			--
			-- AGRUPADO GUIA INGRESO

			INSERT INTO dbo.GUIA  
      
			SELECT X.periodo
						,X.DBF_NCOM
						,X.SERIENUMERO
						,X.FECHAREGISTRO
						,X.FECHAEMISION
						,X.FECHAENTREGA
						,X.proveedor
						,X.MONEDA
						,X.SKU
						,X.PRODUCTO
						,X.ALMACEN
						,X.CANTIDAD
						--,X.PRECIO
						--,X.DESCUENTO
						,ROUND((X.PRECIO-(X.PRECIO*(CAST(REPLACE (X.DESCUENTO, '%', '') AS FLOAT)/100))),2) AS PRECIOCOSTO_Sigv
						,X.PRECIOBLANCO_Cigv
						,ISNULL(X.TPADRE ,'0') AS tpadre
						,x.ID
						,X.FECHAEMISIONB
						,X.FECHAENTREGAB                              
				FROM  (
		                               
				SELECT 
					A.*
				 ,CAST(OC.SERIE AS VARCHAR) + '-' +  CAST(OC.NUMERO AS VARCHAR) AS TPADRE
				 ,CAST(OC.SERIE AS VARCHAR) + '-' +  CAST(OC.NUMERO AS VARCHAR) +'-'+ CAST(A.SKU AS VARCHAR)+'-'+ CAST(OC.PERIODO AS VARCHAR) AS ID
	
				 FROM (

					SELECT                                                       
						 GUIA.PERIODO                              
						,GUIA.DBF_NCOM                              
						,GUIA.SERIENUMERO                              
						,GUIA.FECHAREGISTRO                              
						,GUIA.FECHAEMISION                              
						,GUIA.FECHAENTREGA                              
						,GUIA.PROVEEDOR                              
						,GUIA.MONEDA                             
						,GUIA.SKU
						,GUIA.CODPRODUCTO                              
						,GUIA.PRODUCTO                              
						,GUIA.ALMACEN                          
						,GUIA.CANTIDAD
						,GUIA.PRECIO
						,GUIA.DESCUENTO
						--,GUIA.PRECIOCOSTO_Sigv                             
						--,convert(decimal(10,2),case when GUIA.CANTIDAD = 0 then 0.00 else (cast(GUIA.ValorVenta as decimal(10,2)) /  cast(GUIA.CANTIDAD as numeric) ) end ) as PRECIOCOSTO_Sigv                                      
						,GUIA.PRECIOBLANCO_Cigv
						,CG.COMPRA
						,GUIA.FECHAEMISIONB, GUIA.FECHAENTREGAB AS FECHAENTREGAB
						 from #Tb_Guia GUIA                              
						 --LEFT JOIN (SELECT GUIA,COMPRA,PERIODO FROM SERVNPROD.bd_passarela.dbo.COMPRASGUIAS WHERE PERIODO IN ('2023','2024') ) CG ON GUIA.TRANSACCIONCABECERA = CG.GUIA 
						 LEFT JOIN (SELECT GUIA,COMPRA,PERIODO FROM SERVNPROD.bd_passarela.dbo.COMPRASGUIAS WHERE PERIODO IN ('2025') ) CG ON GUIA.TRANSACCIONCABECERA = CG.GUIA 
					) A
						INNER JOIN (
							SELECT 
							 A.TRANSACCIONCABECERA,A.PRODUCTO,A.cantidad,A.TRANSACCIONTIPO,B.SERIE,B.NUMERO,B.PERIODO FROM  SERVNPROD.bd_passarela.dbo.transacciondetalle A  WITH(NOLOCK) 
							INNER JOIN  SERVNPROD.bd_passarela.dbo.transaccioncabecera B ON B.TRANSACCIONCABECERA = A.transaccioncabeceraidx AND B.cvid = A.transaccioncabeceracvidx AND B.TRANSACCIONTIPO = A.TRANSACCIONTIPO
							WHERE A.TRANSACCIONTIPO = 100911  AND B.ESTADOCABECERA=1
		   
						 ) OC ON A.COMPRA = OC.TRANSACCIONCABECERA  and A.CODPRODUCTO=OC.PRODUCTO  
						 WHERE OC.cantidad > 0


			) X                             
			GROUP BY                              
				X.periodo,X.DBF_NCOM,X.SERIENUMERO,X.FECHAREGISTRO,X.FECHAEMISION,X.FECHAENTREGA,X.proveedor,X.MONEDA,                              
				X.SKU,X.PRODUCTO,X.ALMACEN,X.CANTIDAD,X.PRECIO, X.DESCUENTO,X.PRECIOBLANCO_Cigv,X.TPADRE,x.ID,X.FECHAEMISIONB,X.FECHAENTREGAB 

		IF OBJECT_ID('tempdb..#Tb_Guia') IS NOT NULL DROP TABLE #Tb_Guia ;


		/************************************/
		---DUPLICADOS GUIA INGRESO UPDATE CANT = 0  FOR DUPLICADOS GUIAS
		/************************************/


		/*SELECT  INTO ITERATIVO*/
		; WITH C1 AS (
						 SELECT G.*
									 ,ROW_NUMBER() OVER(
												PARTITION BY g.periodo
											 ,g.dbf_ncom
											 ,g.serienumero
											 ,g.sku
											 ,g.cantidad ORDER BY g.TPADRE ASC
										) AS rn
						 FROM   guia G
										INNER JOIN (
														 SELECT periodo
																	 ,DBF_NCOM
																	 ,SERIENUMERO
																	 ,FECHAREGISTRO
																	 ,FECHAEMISION
																	 ,FECHAENTREGA
																	 ,proveedor
																	 ,MONEDA
																	 ,SKU
																	 ,PRODUCTO
																	 ,ALMACEN
																	 ,CANTIDAD
																	 ,PRECIOCOSTO_Sigv
																	 ,PRECIOBLANCO_Cigv
														 FROM   guia
														 GROUP BY
																		periodo
																	 ,DBF_NCOM
																	 ,SERIENUMERO
																	 ,FECHAREGISTRO
																	 ,FECHAEMISION
																	 ,FECHAENTREGA
																	 ,proveedor
																	 ,MONEDA
																	 ,SKU
																	 ,PRODUCTO
																	 ,ALMACEN
																	 ,CANTIDAD
																	 ,PRECIOCOSTO_Sigv
																	 ,PRECIOBLANCO_Cigv
														 HAVING COUNT(*)>1
												 ) D
												 ON  D.periodo = G.periodo
														 AND D.DBF_NCOM = G.DBF_NCOM
														 AND D.SERIENUMERO = G.SERIENUMERO
														 AND D.FECHAREGISTRO = G.FECHAREGISTRO
														 AND D.FECHAEMISION = G.FECHAEMISION
														 AND D.FECHAENTREGA = G.FECHAENTREGA
														 AND D.proveedor = G.proveedor
														 AND D.MONEDA = G.MONEDA
														 AND D.SKU = G.SKU
														 AND D.PRODUCTO = G.PRODUCTO
														 AND D.ALMACEN = G.ALMACEN
														 AND G.CANTIDAD = D.CANTIDAD
														 AND D.PRECIOCOSTO_Sigv = G.PRECIOCOSTO_Sigv
														 AND D.PRECIOBLANCO_Cigv = G.PRECIOBLANCO_Cigv
				 )
  
		SELECT *
		INTO   #DUPLICADOS
		FROM   C1
		WHERE  rn>1
					 AND periodo<>'2014'
					 AND CANTIDAD<>0
		ORDER BY
					 rn DESC

		MERGE INTO GUIA G 
					USING #DUPLICADOS D 
					ON (
							d.id=g.id
							AND D.periodo=G.periodo
							AND D.DBF_NCOM=G.DBF_NCOM
							AND D.SERIENUMERO=G.SERIENUMERO
							AND D.FECHAREGISTRO=G.FECHAREGISTRO
							AND D.FECHAEMISION=G.FECHAEMISION
							AND D.FECHAENTREGA=G.FECHAENTREGA
							AND D.proveedor=G.proveedor
							AND D.MONEDA=G.MONEDA
							AND D.SKU=G.SKU
							AND D.PRODUCTO=G.PRODUCTO
							AND D.ALMACEN=G.ALMACEN
							AND D.cantidad=G.CANTIDAD
							AND D.PRECIOCOSTO_Sigv=G.PRECIOCOSTO_Sigv
							AND D.PRECIOBLANCO_Cigv=G.PRECIOBLANCO_Cigv
					) 
					WHEN MATCHED THEN
					UPDATE 
					SET    G.CANTIDAD = '0';

		IF OBJECT_ID('tempdb..#DUPLICADOS') IS NOT NULL DROP TABLE #DUPLICADOS ;
	
END


/************************************/
	---UPDATE ESTADO 
/************************************/



   --actualiza estado              
   MERGE INTO OC a                 
   USING ( SELECT ID,CAST(SUM(CANTIDAD) AS NUMERIC) CANTIDAD FROM GUIA where FECHAENTREGA<>'19900101'  GROUP  BY ID) b  --                
   ON (b.ID = a.ID )  --CODIGOINTERNO               
   WHEN MATCHED THEN  UPDATE SET a.ESTADO = CASE WHEN a.cantidad = b.cantidad then 'OK'  WHEN  a.cantidad > b.cantidad then 'PARCIAL' ELSE 'EXCEDE' END;  


   /*******************************************
    * PROVEEDORES COMPLETOS
    *******************************************/

DROP TABLE dbo.proveedorC


SET		@LinkedServer = 'SERVNPROD'

SET @OpenQuery = '		
						SELECT	* 
	   					INTO  dbo.proveedorC  FROM	OPENQUERY(' + @LinkedServer + ',''' -- INSERT INTO  dbo.proveedor
SET @Script =    '
		
		
		SELECT 

			A.persona AS ID
		   ,A.CODIGO
		   ,Rtrim(B.PATERNO) + '''' '''' + Rtrim(B.MATERNO) + '''' '''' + Rtrim(B.NOMBRE) as RAZONSOCIAL
		   ,B.TIPODOCUMENTO
		   ,ISNULL(C.NUMERODOCUMENTO,'''' '''') AS NUMERODOCUMENTO
		   ,(select top 1 d.DIRECCION  from PERSONADIRECCION d where d.persona = cast(B.cvid as varchar) + cast(B.PERSONA as varchar) ORDER BY TIPODIRECCION ASC ) as DIRECCION
		   ,B.EMAIL
		   ,B.TELEFONO
		   ,B.CELULAR
		   ,B.FECHAINGRESO
		   ,B.PERSONATIPOPERSONA
   
		FROM PERSONATIPOPERSONA A  WITH(NOLOCK) 
		INNER JOIN PERSONA B  WITH(NOLOCK) ON A.personaidx = B.PERSONA AND A.personacvidx = B.cvid --AND A.personatipo = B.PERSONATIPOPERSONA
		LEFT JOIN PERSONATIPODOCUMENTO C  WITH(NOLOCK) ON A.persona = C.persona AND A.personatipo = C.personatipo


		WHERE A.PERSONATIPO=100915

		ORDER BY A.CODIGO ASC

				'')
 '
EXEC (@OpenQuery + @Script)		

DROP TABLE DBO.modeloC
SELECT	Prefijo
		,CASE WHEN ISNULL(CHARINDEX('(',NOMBRE,0),0)>0 THEN RTRIM(LTRIM(SUBSTRING(NOMBRE,1,ISNULL(CHARINDEX('(',NOMBRE,0),0)-1))) ELSE UPPER(RTRIM(LTRIM(NOMBRE))) END as Nombre
		,Proveedor
INTO	DBO.modeloC
FROM	servnprod.bd_passarela.dbo.Modelo







 
  ----- guias Logistica                    
  --     SELECT [periodo]                    
  --    ,[DBF_NCOM]                    
  --    ,[SERIENUMERO]                    
  --    ,[FECHAREGISTRO]                    
  --    ,[FECHAEMISION]                    
  --    ,[FECHAENTREGA]                    
  --    ,[proveedor]                    
  --    ,[MONEDA]                    
  --    ,[SKU]                    
  --    ,g.[PRODUCTO]                
  --    ,[ALMACEN]                    
  --    ,[CANTIDAD]                    
  --    ,[PRECIOCOSTO_Sigv]                    
  --    ,[PRECIOBLANCO_Cigv],m.nombre as marca,mode.nombre as modelo,c.nombre as color,descr.nombre as descripcionprincipal,mate.nombre as material,t.nombre as talla                    
  --into dbo.GuiaLog                    
  --FROM [passareladwh].[dbo].[GUIA] g,producto p, marca m, modelo mode, color c,talla t,categoria cat,descripcionprincipal descr,material mate                    
  --where p.producto=g.SKU and p.marca=m.marca and p.color=c.color and mode.modelo=p.modelo and t.talla=p.talla and p.categoria=cat.categoria and descr.descripcionprincipal=p.descripcionprincipal and mate.material=p.material                    
  --group by                     
  --periodo                    
  --    ,DBF_NCOM                    
  --    ,SERIENUMERO                    
  --    ,FECHAREGISTRO                    
  --    ,FECHAEMISION                    
  --    ,FECHAENTREGA                    
  --    ,proveedor                    
  --    ,MONEDA                    
  --    ,SKU                    
  --    ,g.PRODUCTO                    
  --    ,ALMACEN                    
  --    ,CANTIDAD                    
  --    ,PRECIOCOSTO_Sigv                    
  --    ,PRECIOBLANCO_Cigv,m.nombre,mode.nombre,c.nombre,descr.nombre,mate.nombre,t.nombre                     
  --    order by sku desc;

        
            
   
                     
   --UPDATE OC SET ESTADO = 'PENDIENTE' WHERE isnull(ESTADO,'') = '' AND left(OC.fechaemision,4) IN ('2017')   
   --update dbo.productos_compra set descripcionsecundaria=isnull(g.proveedor,'Sin Proveedor') from dbo.productos_compra p left join (select proveedor,sku from guia ) g on g.SKU=p.producto        
END

/*old*/

   --FACTURA                                
  --      select                                
  --      T.TRANSACCIONPADRE,                                 
  --      td.TRANSACCIONCABECERA,                                
  --      t.periodo,                                
  --      T.DBF_NCOM,                                
  --      ( t.SERIE +'-'+t.NUMERO) AS SERIENUMERO,                                
  --      SUBSTRING(t.FECHAREGISTRO,1,8) AS FECHAREGISTRO,                                
  --      SUBSTRING(t.FECHAEMISION,1,8) AS FECHAEMISION,                            
  --      SUBSTRING(t.FECHAEMISION ,1,8) AS FECHAVENCIMIENTO,                                
  --      RTRIM(persona.CODIGO) + ' - '+ RTRIM(persona.PATERNO) +' '+ RTRIM(persona.MATERNO) +' '+ RTRIM(persona.NOMBRE) as PROVEEDOR,                                
  --      ISNULL(FP.NOMBRE,'') AS CONDICIONPAGO,        
  --      ISNULL(FP.NUMERODIA,'0') AS DIAS,                                
  --      case when isnull(t.moneda,'0') = '100911' then 'SOLES' else 'DOLARES' end as MONEDA,                                   
  --      td.PRODUCTO as CODPRODUCTO,                                
  --      P.CODIGOINTERNO AS SKU,                                
  --      P.NOMBRE AS PRODUCTO,                                
  --      cast( (case when ISNULL(TD.CANTIDAD,'0')='' then '0' else   isnull(TD.CANTIDAD,'0') end) as numeric) as CANTIDAD,                                
  --      CAST( ISNULL(TD.MONTONETO,'0.00') AS DECIMAL (10,2)) AS VALORVENTA,                                
  --      T.INGRESO,                                
  --      td.tag                                
  --      into #tbFactura                                
  --      from servnprod.bd_passarela.dbo.TRANSACCIONDETALLE td                                
  --      LEFT JOIN servnprod.bd_passarela.dbo.TRANSACCIONCABECERA t ON td.TRANSACCIONCABECERAidx= t.TRANSACCIONCABECERA  AND td.TRANSACCIONCABECERAcvidx=  t.cvid and td.transacciontipo =t.TRANSACCIONTIPO 
  --      LEFT JOIN servnprod.bd_passarela.dbo.FORMAPAGO FP ON (cast(FP.cvid as varchar)+cast(FP.FORMAPAGO as varchar)= T.FORMAPAGO )                                
		--LEFT JOIN servnprod.bd_passarela.dbo.personatipopersona pt ON pt.PERSONA = T.PROVEEDOR and pt.personatipo=100915 
		--LEFT JOIN servnprod.bd_passarela.dbo.PERSONA ON  persona.persona=pt.personaidx and    persona.cvid=pt.personacvidx
  --  	LEFT JOIN servnprod.bd_passarela.dbo.PRODUCTO p ON p.PRODUCTO =TD.PRODUCTOid  and p.CVID = td.productocvid  
	 --   WHERE tD.TRANSACCIONTIPO = 100916  AND TD.PERIODO='2017' 
       
                            
  --      insert into dbo.FACTURA                                
  --      select C.periodo,C.DBF_NCOM,C.SERIENUMERO,C.FECHAREGISTRO,C.FECHAEMISION,C.FECHAVENCIMIENTO,C.proveedor,C.CONDICIONPAGO,C.DIAS,C.MONEDA,C.SKU,C.PRODUCTO,                                
  --      ISNULL((SELECT CAST(PREFIJO AS VARCHAR ) + ' '  + NOMBRE FROM servnprod.bd_passarela.dbo.ALMACEN AL WHERE CAST(AL.cvid AS VARCHAR) + CAST(AL.ALMACEN AS VARCHAR)=C.INGRESO),'') as ALMACEN,C.CANTIDAD,                                
  --      convert(decimal(8,4),case when C.CANTIDAD = 0 then 0.00 else(C.ValorVenta / C.CANTIDAD ) end ) as PRECIOCOSTO_Sigv ,                                 
  --       isnull( ( select top 1 t.dbf_ncom from servnprod.bd_passarela.dbo.TRANSACCIONCABECERA T,servnprod.bd_passarela.dbo.TRANSACCIONDETALLE TD                               
  --      where cast(t.cvid as varchar) + cast(t.transaccioncabecera as varchar) = TD.TRANSACCIONCABECERA AND                                         
  --      t.periodo=c.periodo and t.transacciontipo='100912' and td.producto = c.CODPRODUCTO                                
  --      and  CAST(T.SERIE AS VARCHAR) + '-' +  CAST(T.NUMERO AS VARCHAR) = left(c.tag,13) ),'') as TPADRE                                
  --      from  #tbFactura C                                
  --      ORDER BY C.PERIODO DESC, C.DBF_NCOM DESC, C.SKU DESC                                
  --      drop table #tbFactura         
--exec sp_compras
```

