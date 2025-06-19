# Análisis del Stored Procedure `job_email_ACH_2024.sql`

## 1. Diagrama de Flujo de Datos (DFD)

```mermaid
flowchart TD
    A[Inicio] --> B[Declarar variables y parámetros]
    B --> C[Crear tablas temporales]
    C --> D[Obtener datos de proyecciones]
    D --> E[Obtener datos de ventas]
    E --> F[Procesar datos de ventas]
    F --> G[Calcular métricas de avance]
    G --> H[Generar reporte consolidado]
    H --> I[Generar HTML para correo general]
    I --> J[Enviar correo general]
    H --> K[Generar reporte por supervisor]
    K --> L[Generar HTML para correos por supervisor]
    L --> M[Enviar correos individuales]
    M --> N[Limpiar tablas temporales]
    N --> O[Fin]
```
??? info "Notas importantes sobre el diagrama"
    ## Explicación del Diagrama de Flujo de Datos
    - Muestra el proceso principal del stored procedure desde la inicialización hasta el envío de correos.
    - Destaca las etapas clave como obtención de datos, procesamiento, generación de reportes y envío de correos.

    El stored procedure es complejo y realiza múltiples funciones:
    - Consulta datos de ventas reales vs proyecciones
    - Calcula métricas de desempeño (avances, márgenes)
    - Genera reportes HTML detallados
    - Distribuye la información por correo electrónico a diferentes destinatarios según su rol