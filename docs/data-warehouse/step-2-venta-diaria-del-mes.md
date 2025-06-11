## VDM: Ventas Diarias del Mes en curso
**OBJETIVO:** Envío automatizado por correo del informe de venta diaria del mes:
- A nivel empresa
- A nivel de canal de venta

**Nombre de SP:** job_email_VDM_6
```mermaid
flowchart TD
    A[Inicio] --> B[Establecer fec como cierre de dia anterior]
    B --> C[Calcular fechas TY/LY]
    C --> D[Crear #TVentas1]
    D --> E[Cargar datos ventas 2025]
    E --> F[Cargar datos ventas 2024]
    F --> G[Crear #TVentas2 con pivot]
    G --> H[Calcular métricas derivadas]
    H --> I[Crear #TVentasB1 con totales]
    I --> J[Generar HTML principal]
    J --> K[Procesar por canal: Retail]
    K --> L[Procesar por canal: Catálogo]
    L --> M[Procesar por canal: E-commerce]
    M --> N[Procesar por canal: Ventas Asistidas]
    N --> O[Construir cuerpo email]
    O --> P[Configurar formato CSS]
    P --> Q[Enviar email]
    Q --> R[Fin]

    %% Tablas
    D -->|Lee| T1[TiempoVersus]
    E -->|Lee| T2[VentasVersus2025]
    F -->|Lee| T3[VentasVersus2024]
    G -->|Usa| T4[vw_Producto]
    H -->|Usa| T5[vw_proyecciones_TY]
    
    %% Tablas temporales
    D --> TT1[#TVentas1]
    G --> TT2[#TVentas2]
    I --> TT3[#TVentasB1]
    K --> TT4[#TProyeccionRetail]
    L --> TT5[#TProyeccionCatalogo]
    M --> TT6[#TProyeccionEcommerce]
    N --> TT7[#TProyeccionVAsistidas]
```