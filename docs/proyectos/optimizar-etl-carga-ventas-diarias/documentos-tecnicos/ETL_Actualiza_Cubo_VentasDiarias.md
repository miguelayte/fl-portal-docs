# Documentación del Proceso ETL para Actualización del Cubo de Ventas Diarias

## 1. Diagrama de Flujo de Datos (DFD)

```mermaid
flowchart TD
    A[Inicio] --> B[Definir parámetros de fecha]
    B --> C{Ejecutar usp_etl_migrar_ventas_diarias}
    C --> D[Actualizar tabla ventas]
    C --> E[Actualizar Factventas]
    C --> F[Actualizar VentasVersus]
    F --> G[Crear VentasVersusYYYY]
    D --> H[Actualizar VentasSH]
    E --> H
    F --> H
    G --> I[Actualizar tb_asesorventa]
    H --> J[Actualizar CostoSH]
    I --> K[Presentación de datos]
    J --> K
    K --> L[Actualizar datos RRHH]
    L --> M[Actualizar catálogos]
    M --> N[Actualizar ventas de catálogo]
    N --> O[Fin]
```

??? info "Explicación del DFD"
    **Explicación del DFD:**

    Este diagrama muestra el flujo de datos del procedimiento almacenado, que sigue un típico patrón ETL (Extract, Transform, Load):

    1. **Definición de parámetros**: Establece todas las variables de fecha necesarias para el procesamiento, manejando tanto ejecuciones automáticas (sin parámetro) como manuales (con fecha específica).

    2. **Migración inicial**: Llama a `usp_etl_migrar_ventas_diarias` para extraer y preparar los datos fuente.

    3. **Carga en tablas de hechos**: 
      - Actualiza secuencialmente las tablas `ventas`, `Factventas` y `VentasVersus` con los datos del día procesado.
      - Crea una tabla anual `VentasVersusYYYY` para análisis históricos.

    4. **Procesamiento auxiliar**:
      - Actualiza información de asesores de venta en `tb_asesorventa`.
      - Carga datos en tablas resumen `VentasSH` y `CostoSH`.

    5. **Transformación para presentación**:
      - Formatea campos como rangos horarios para facilitar el análisis.
      - Maneja casos especiales para presentación en informes.

    6. **Integración con otros sistemas**:
      - Actualiza datos de RRHH (empleados activos).
      - Sincroniza información de catálogos y su relación con productos.

    El flujo es principalmente secuencial, con algunas operaciones en paralelo cuando no hay dependencias de datos entre ellas.

## 2. Diagrama de Entidad-Relación (DER)

```mermaid
erDiagram
    VENTASCABECERA ||--o{ VENTASDETALLE : contiene
    VENTASCABECERA {
        string id PK
        date fecha
        string canalventa
        string vendedor
        string tienda
        string cliente
    }
    VENTASDETALLE {
        string id FK
        string producto
        decimal cantidad
        decimal precioventa
    }
    PRODUCTO ||--o{ VENTASDETALLE : referencia
    PRODUCTO {
        string producto PK
        decimal preciocosto
        decimal precio
    }
    FACTVENTAS ||--|{ VENTASVERSUS : deriva
    FACTVENTAS {
        date fecha
        string id
        string producto
    }
    VENTASVERSUS {
        date fecha
        string idFecha
    }
    TB_ASESORVENTA {
        string vendedor PK
        date fecha PK
        string nombre
        string cargo
    }
    VENDEDOR ||--o{ TB_ASESORVENTA : referencia
    VENDEDOR {
        string vendedor PK
        string nombre
    }
    TB_CAT {
        int id_catalogo PK
        date fecha
    }
    TB_CAT_PROD {
        int idcat FK
        string producto FK
    }
```

??? info "Explicación del DER"
    **Explicación del DER:**

    El diagrama muestra las principales entidades involucradas en el proceso:

    1. **Entidades centrales**:
      - `VENTASCABECERA` y `VENTASDETALLE` son las tablas fuente principales con relación 1:N.
      - `PRODUCTO` contiene información de precios que enriquece los datos de ventas.

    2. **Tablas de hechos**:
      - `FACTVENTAS` es la tabla principal del data warehouse.
      - `VENTASVERSUS` parece ser una tabla para análisis comparativos.

    3. **Entidades de soporte**:
      - `TB_ASESORVENTA` almacena información de vendedores con historización.
      - `TB_CAT` y `TB_CAT_PROD` gestionan la relación entre catálogos y productos.

    Las relaciones muestran cómo los datos fluyen desde las tablas transaccionales (`VENTASCABECERA`, `VENTASDETALLE`) hacia las tablas analíticas (`FACTVENTAS`, `VENTASVERSUS`), con tablas auxiliares para enriquecer la información.

