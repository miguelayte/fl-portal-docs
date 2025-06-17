## 2. Diagrama de Entidad-Relación (DER)

```mermaid
erDiagram
    PROYECCIONES ||--o{ TB_MEDIOVENTA : tiene
    PROYECCIONES ||--o{ TB_SUBCANAL : pertenece
    TB_SUBCANAL ||--o{ TB_CANAL : pertenece
    TB_MEDIOVENTA ||--o{ TB_SUBCANAL : pertenece
    SUPERVISOR ||--o{ PROYECCIONES : supervisa
    FACTURAS ||--o{ FACTURAS_DETALLE : contiene
    FACTURAS ||--o{ TIPO_VENTA_MEDIOPAGO : tiene
    FACTURAS ||--o{ PRODUCTOS : referencia
    FACTURAS ||--o{ TIENDAS : pertenece
    FACTURAS ||--o{ VENDEDORES : tiene
    PRODUCTOS ||--o{ TIPO_ARTICULO : clasifica

    PROYECCIONES {
        string fecha PK
        string canalventa
        decimal monto
        int Par
        int Acc
        int id_medioventa FK
        string Supervisor
    }
    
    TB_MEDIOVENTA {
        int id_medioventa PK
        string medioventa
        int id_subcanal FK
        bit estado
    }
    
    TB_SUBCANAL {
        int id_subcanal PK
        string subcanal
        int id_canal FK
    }
    
    TB_CANAL {
        int id_canal PK
        string canal
    }
    
    SUPERVISOR {
        string nombre
        string email
        string canalventa
        bit estado
    }
    
    FACTURAS {
        string transacabid PK
        string tienda_3 FK
        string fichv_3 FK
        date fcom_3
        string tidoc_3
        string sfacu_3
        string nfactu_3
        string gloa_3
    }
    
    FACTURAS_DETALLE {
        string transacabid FK
        string linea_3a FK
        float cant_3a
        decimal vvta1_3a
    }
    
    TIPO_VENTA_MEDIOPAGO {
        string TIPODOC PK
        string SERIE PK
        string NRODOC PK
        string MEDIOPAGOID
        string TIPODEVENTA
    }
    
    PRODUCTOS {
        string producto PK
        string tipoarticulo FK
        decimal precio
        decimal preciocosto
    }
    
    TIPO_ARTICULO {
        string tipoarticulo PK
        string aplicapercepcion
    }
    
    TIENDAS {
        string tienda PK
        string descripcion
    }
    
    VENDEDORES {
        string codigo PK
        string nombre
    }
```
??? info "Notas importantes sobre el diagrama"
    ## Explicación del Diagrama Entidad-Relación
    - Representa las principales entidades involucradas en el proceso y sus relaciones.
    - Las entidades principales son:
        - `PROYECCIONES`: Datos de metas/objetivos de venta
        - `FACTURAS` y `FACTURAS_DETALLE`: Datos transaccionales de ventas
        - `TB_CANAL`, `TB_SUBCANAL`, `TB_MEDIOVENTA`: Estructura organizacional de canales de venta
        - `SUPERVISOR`: Responsables de cada canal/medio de venta
        - `PRODUCTOS` y `TIPO_ARTICULO`: Catálogo de productos
