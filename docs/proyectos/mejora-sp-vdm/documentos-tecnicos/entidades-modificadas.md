??? info "1. Mejoras en la vista `vw_Producto`"
     ### 1. Mejoras en la vista `vw_Producto`
     Por resiliencia se cambia de `INNER JOIN` a `LEFT JOIN` en la vinculación de la tabla `Producto` con la tabla `Clasificacion`.

     ```sql title="vw_Producto.sql" linenums="1" hl_lines="58-59"
     ALTER VIEW [dbo].[vw_Producto]
     AS
     SELECT p.producto
          ,p.nombre
          ,p.preciocosto
          ,p.precio
          ,p.fechaingreso
          ,p.estado
          ,p.marca
          ,p.material
          ,p.modelo
          ,p.talla
          ,p.color
          ,p.categoria
          ,p.tipoarticulo
          ,p.linea
          ,p.temporada
          ,p.descripcionprincipal
          ,p.descripcionsecundaria
          ,p.fechacompra
          ,p.prodOferta
          ,p.productoestilo
          ,p.plataforma
          ,p.altura
          ,p.fechaing
          ,p.productouso
          ,p.FecIngCD
          ,p.FecIngTD
          ,p.procedencia
          ,p.proveedor
          ,p.idclasificacion
          ,c.clasificacion
          ,p.lineaname
          ,p.uso
          ,p.estilo
          ,p.ocasion
          ,p.detalle_planta
          ,p.campaña
          ,p.mesq
          ,p.tec_planta
          ,p.tec_plantilla
          ,cc.id_compradora
          ,p.TIPOCONSTRUCCION
          ,p.CONSTRUCCION
          ,d.id_grupo
          ,tasp.urlimagen
          ,m.nombre AS nombre_marca,m.tipomarca
          ,c2.nombre AS nombre_categoria,c2.resumen AS resumen_categoria
          ,c3.nombre AS nombre_color
          ,l.nombre AS nombre_linea
          ,m2.nombre AS nombre_material
          ,m3.nombre AS nombre_modelo
          ,t.nombre AS nombre_talla
          ,t2.nombre AS nombre_temporada,t2.resumen AS resumen_temporada
          ,t3.nombre AS nombre_tipoarticulo,t3.resumen AS resumen_tipoarticulo,
          ISNULL(tm.product_manager, 'NO ASIGNADO') AS [PRODUCT MANAGER]
     FROM   dbo.producto                     AS p
          LEFT JOIN dbo.tb_clasificacion  AS c
               ON  p.producto = c.codigointerno
          LEFT JOIN descripcionprincipal   AS d
               ON  d.descripcionprincipal = p.descripcionprincipal
          LEFT JOIN marca AS m ON m.marca = p.marca
          LEFT JOIN categoria AS c2 ON c2.categoria = p.categoria
          LEFT JOIN compradoraCombinacion AS cc ON cc.tipomarca2 = m.tipomarca2 and cc.grupo = d.grupo AND cc.catgroup = c2.catgroup
          LEFT JOIN passareladwh.dbo.tmp_alm_stock_producto AS tasp ON tasp.Codigointerno=p.producto
          LEFT JOIN color AS c3 ON c3.color = p.color
          LEFT JOIN linea AS l ON l.linea = p.linea
          LEFT JOIN material AS m2 ON m2.material = p.material
          LEFT JOIN modelo AS m3 ON m3.modelo = p.modelo
          LEFT JOIN talla AS t ON t.talla = p.talla
          LEFT JOIN temporada AS t2 ON t2.temporada = p.temporada
          LEFT JOIN tipoarticulo AS t3 ON t3.tipoarticulo = p.tipoarticulo
          LEFT JOIN tb_product_manager as tm 
                    ON tm.MARCA = m.nombre AND tm.TIPOMARCA = m.tipomarca AND tm.CATEGORIA = c2.catgroup AND tm.GRUPO = d.grupo AND tm.ARTICULO = d.nombre

     WHERE p.temporada>'61' AND 
     NOT EXISTS (
               SELECT 1
               FROM   tb_productos_excluidos AS tpe
               WHERE  tpe.producto = p.producto
     )

     GO

     ```

??? info "2. Mejoras en la tabla `tb_canal`"
     ### 2. Mejoras en la tabla `tb_canal`
     Adicionar columna de `permitido` para reportes de venta.

     ```sql title="tb_canal.sql" linenums="1" hl_lines="9-9"
     -- 3. Adicionar columna de "permitido" para reportes de venta
     CREATE TABLE [dbo].[tb_canal] (
     [id_canal]    INT           NOT NULL,
     [canal]       VARCHAR (100) NULL,
     [CostingCode] VARCHAR (20)  NULL,
     PRIMARY KEY CLUSTERED ([id_canal] ASC)
     );

     ALTER TABLE [dbo].[tb_canal] ADD permitido bit;

     -- 4. Actualizar columna de "permitido" para reportes de venta
     UPDATE tc SET tc.permitido=1
     FROM tb_canal AS tc
     WHERE tc.id_canal IN (1,2,3,4,5)
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
