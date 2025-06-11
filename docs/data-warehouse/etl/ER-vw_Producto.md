# Diagrama de Entidad Relación para vw_Producto:

```mermaid
erDiagram
    producto ||--o{ tb_clasificacion : "INNER JOIN"
    producto ||--o| descripcionprincipal : "LEFT JOIN"
    producto ||--o| marca : "LEFT JOIN"
    producto ||--o| categoria : "LEFT JOIN"
    producto ||--o| compradoraCombinacion : "LEFT JOIN"
    producto ||--o| tmp_alm_stock_producto : "LEFT JOIN"
    producto ||--o| color : "LEFT JOIN"
    producto ||--o| linea : "LEFT JOIN"
    producto ||--o| material : "LEFT JOIN"
    producto ||--o| modelo : "LEFT JOIN"
    producto ||--o| talla : "LEFT JOIN"
    producto ||--o| temporada : "LEFT JOIN"
    producto ||--o| tipoarticulo : "LEFT JOIN"
    producto ||--o| tb_product_manager : "LEFT JOIN"
    marca ||--o{ compradoraCombinacion : "tipomarca2"
    descripcionprincipal ||--o{ compradoraCombinacion : "grupo"
    categoria ||--o{ compradoraCombinacion : "catgroup"
    tb_product_manager }|--|| marca : "MARCA, TIPOMARCA"
    tb_product_manager }|--|| descripcionprincipal : "GRUPO, ARTICULO"
    tb_product_manager }|--|| categoria : "CATEGORIA"

    producto {
        string producto PK
        string nombre
        decimal preciocosto
        decimal precio
        datetime fechaingreso
        string estado
        string marca FK
        string material FK
        string modelo FK
        string talla FK
        string color FK
        string categoria FK
        string tipoarticulo FK
        string linea FK
        string temporada FK
        string descripcionprincipal FK
        string descripcionsecundaria
        datetime fechacompra
        string prodOferta
        string productoestilo
        string plataforma
        string altura
        datetime fechaing
        string productouso
        datetime FecIngCD
        datetime FecIngTD
        string procedencia
        string proveedor
        string idclasificacion
        string lineaname
        string uso
        string estilo
        string ocasion
        string detalle_planta
        string campańa
        string mesq
        string tec_planta
        string tec_plantilla
        string TIPOCONSTRUCCION
        string CONSTRUCCION
    }

    tb_clasificacion {
        string codigointerno PK
        string clasificacion
    }

    descripcionprincipal {
        string descripcionprincipal PK
        string id_grupo
        string grupo
        string nombre
    }

    marca {
        string marca PK
        string nombre
        string tipomarca
        string tipomarca2
    }

    categoria {
        string categoria PK
        string nombre
        string catgroup
        string resumen
    }

    compradoraCombinacion {
        string tipomarca2 PK
        string grupo PK
        string catgroup PK
        string id_compradora
    }

    tmp_alm_stock_producto {
        string Codigointerno PK
        string urlimagen
    }

    color {
        string color PK
        string nombre
    }

    linea {
        string linea PK
        string nombre
    }

    material {
        string material PK
        string nombre
    }

    modelo {
        string modelo PK
        string nombre
    }

    talla {
        string talla PK
        string nombre
    }

    temporada {
        string temporada PK
        string nombre
        string resumen
    }

    tipoarticulo {
        string tipoarticulo PK
        string nombre
        string resumen
    }

    tb_product_manager {
        string MARCA PK
        string TIPOMARCA PK
        string CATEGORIA PK
        string GRUPO PK
        string ARTICULO PK
        string PRODUCT_MANAGER
    }
```
### **Notas importantes sobre el diagrama**
1. La entidad principal es `producto` que se relaciona con múltiples tablas de referencia
2. Se muestran las relaciones INNER JOIN (con tb_clasificacion) y LEFT JOIN (con las demás tablas)
3. La tabla compradoraCombinacion tiene una relación compuesta con marca, descripcionprincipal y categoria
4. La tabla tb_product_manager tiene una relación compuesta con múltiples campos de otras tablas
5. Se incluyen los campos PK (Primary Key) y FK (Foreign Key) relevantes
6. La vista filtra productos donde temporada > '61' y excluye los productos listados en tb_productos_excluidos