# Análisis del Stored Procedure `usp_jo_pos_dw_cubo_actualizar`

## 1. Diagrama de Flujo de Datos

```mermaid
flowchart TD
    A[Inicio] --> B[Ejecutar usp_jo_pos_dw_ventas_actualizar]
    B --> C[Definir variables de fecha]
    C --> D[Mostrar valores de variables]
    D --> E[Actualizar tabla ventas]
    E --> F[Actualizar tabla Factventas]
    F --> G[Actualizar tabla VentasVersus]
    G --> H[Crear VentasVersusYYYY]
    H --> I[Actualizar tb_asesorventa]
    I --> J[Actualizar VentasSH y CostoSH]
    J --> K[Actualizar formatos de hora en ventas]
    K --> L[Actualizar empleados activos]
    L --> M[Actualizar catálogos]
    M --> N[Actualizar relación catálogo-producto]
    N --> O[Actualizar ventas de catálogo]
    O --> P[Limpiar datos de días no fin de mes de tabla stockFdm]
    P --> Q[Fin]
```

## 2. Diagrama de Entidad-Relación

```mermaid
erDiagram
    VENTASCABECERA ||--o{ VENTASDETALLE : contiene
    VENTASCABECERA {
        int id PK
        varchar canalventa
        varchar tipodocumento
        varchar serie
        varchar numero
        date fecha
        varchar vendedor
        varchar tienda
        varchar cliente
        decimal total
    }
    
    VENTASDETALLE {
        int id FK
        varchar producto
        decimal cantidad
        decimal precioventa
        decimal descuento
        decimal subtotal
        decimal igv
        decimal total
    }
    
    PRODUCTO {
        varchar producto PK
        varchar codigointerno
        decimal preciocosto
        decimal precio
        date fechacompra
    }
    
    VENDEDOR {
        varchar vendedor PK
        varchar nombre
        varchar cargo
    }
    
    VENTAS ||--|{ FACTVENTAS : deriva
    FACTVENTAS ||--|{ VENTASVERSUS : deriva
    VENTASVERSUS ||--|{ VENTASVERSUSYYYY : deriva
    VENTASVERSUS ||--|{ VENTASSH : deriva
    
    COSTOVERSUS ||--|{ COSTOSH : deriva
    COSTOVERSUS ||--|{ COSTOYYYY : deriva
    
    TB_CAT {
        int id_catalogo PK
        varchar codigo
        varchar nombre
        date fecha
    }
    
    TB_CAT_PROD {
        int idcat FK
        varchar producto FK
        int pagina
    }
    
    TB_ASESORVENTA {
        varchar canalventa
        date fecha
        varchar vendedor FK
        varchar nombre
        varchar cargo
    }
    
    STOCKFDM {
        varchar canalventa
        date fechacierre
        varchar producto FK
        int idcatalogo FK
    }
    
    VENTASCABECERA }|--|| VENDEDOR : tiene
    VENTASDETALLE }|--|| PRODUCTO : referencia
    TB_CAT ||--o{ TB_CAT_PROD : contiene
    TB_CAT ||--o{ STOCKFDM : referencia
```

??? info "Notas importantes sobre el diagrama"
    ## Observaciones sobre el modelo

    1. **Ventas**: El procedimiento trabaja con varias tablas de ventas que parecen ser versiones o transformaciones de los mismos datos básicos (ventas, Factventas, VentasVersus, VentasSH).

    2. **Jerarquía de datos**: Las ventas fluyen desde ventascabecera/ventasdetalle hasta las tablas analíticas finales.

    3. **Catálogos**: Existe un sistema de catálogos (tb_cat) que se relaciona con productos (tb_cat_prod) y afecta a las ventas y stock.

    4. **Dimensiones**: Se identifican dimensiones clave como tiempo, productos, vendedores y tiendas.

    5. **Transformaciones**: El procedimiento realiza varias transformaciones de datos, especialmente en el formato de fechas y horas.

    El modelo refleja un data warehouse con tablas de hechos (ventas) y dimensiones (productos, vendedores, tiempo), con procesos ETL para mantener los datos actualizados.