# AIKZ - Sistema de Gestión Empresarial

AIKZ es una aplicación integral de gestión empresarial (ERP) diseñada para administrar las operaciones de una empresa de fabricación y ventas. La aplicación está construida con React Native y Expo, lo que le permite funcionar en plataformas web, Android e iOS. Utiliza Supabase para el backend y la base de datos en tiempo real.

## ✨ Core Functionalities

La aplicación cuenta con un panel de administración centralizado que ofrece una visión completa del negocio y módulos para gestionar áreas clave:

-   **📊 Panel de Control (Dashboard):** Visualización de métricas clave del negocio, como total de pedidos, cuentas por cobrar/pagar, y niveles de inventario.
-   **💰 Finanzas:**
    -   Gestión de **Gastos**.
    -   Seguimiento de **Cuentas por Cobrar**.
    -   Control de **Cuentas por Pagar**.
-   **📦 Inventario (Almacén):**
    -   Administración de inventario de **Celofán**.
    -   Administración de inventario de **Polietileno**.
-   **🏭 Producción:**
    -   Registro y seguimiento de la producción de **Celofán**.
    -   Registro y seguimiento de la producción de **Polietileno**.
-   **📈 Ventas y Clientes (CRM):**
    -   Gestión de **Clientes**.
    -   Administración de **Vendedores**.
    -   Creación y seguimiento de **Pedidos**.
    -   Registro de **Entregas**.
-   **🤖 Asistente IA:** Un chat integrado para interactuar con un asistente de inteligencia artificial que puede proporcionar información y realizar acciones dentro del sistema.

## 🚀 Tech Stack

-   **Framework:** React Native & Expo
-   **Backend y Base de Datos:** [Supabase](https://supabase.io/) (PostgreSQL)
-   **Lenguaje:** JavaScript (ES6+) y TypeScript
-   **Navegación:** Expo Router (File-based routing)
-   **UI Components:** React Native Paper, React Native Chart Kit
-   **Styling:** Tailwind CSS (para la versión web) y hojas de estilo de React Native.

## 🏁 Getting Started

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

1.  **Instalar dependencias:**
    Abre una terminal en el directorio raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```

2.  **Iniciar la aplicación:**
    Una vez instaladas las dependencias, puedes iniciar el servidor de desarrollo:
    ```bash
    npx expo start
    ```
    Esto abrirá las herramientas de desarrollo de Expo. Desde allí, puedes elegir abrir la aplicación en:
    -   Un emulador de Android
    -   Un simulador de iOS
    -   Tu navegador web
    -   La aplicación Expo Go en tu dispositivo móvil físico.

## 📜 Available Scripts

En el archivo `package.json` se incluyen los siguientes scripts:

-   `npm start`: Inicia el servidor de desarrollo de Expo.
-   `npm run android`: Inicia la aplicación en un dispositivo/emulador de Android.
-   `npm run ios`: Inicia la aplicación en un simulador/dispositivo de iOS.
-   `npm run web`: Inicia la aplicación en un navegador web.
-   `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores y problemas de estilo.

## 📂 Project Structure

El proyecto sigue una estructura organizada para facilitar el desarrollo y mantenimiento:

```
/
├── app/                # Código fuente principal de la aplicación
│   ├── (tabs)/         # Layout para la navegación por pestañas
│   ├── components/     # Componentes reutilizables de la UI
│   ├── pages/          # Pantallas principales de cada módulo (Clientes, Pedidos, etc.)
│   └── _layout.tsx     # Layout principal de la aplicación
├── assets/             # Archivos estáticos como imágenes y fuentes
├── components/         # Componentes genéricos de la UI
├── constants/          # Constantes de la aplicación (colores, etc.)
├── supabase/           # Configuración del cliente de Supabase
├── database/
│   └── supabase.sql    # Script SQL con la estructura de la base de datos
├── package.json        # Dependencias y scripts del proyecto
└── README.md           # Esta documentación
```

## 🗃️ Database Structure

El proyecto utiliza **Supabase** como backend, con una base de datos **PostgreSQL**. La estructura completa está definida en el archivo `database/supabase.sql`.

**Principales características de la base de datos:**

-   **Integridad de Datos:** Utiliza tipos de datos `ENUM` para garantizar la consistencia en campos como `material_type` ('celofan', 'polietileno') y `rol_type` ('admin', 'vendedor').
-   **Normalización:** Las tablas están bien estructuradas y relacionadas para minimizar la redundancia de datos.
-   **Optimización:** Se han creado **índices** en columnas de uso frecuente (como fechas y claves foráneas) para acelerar las consultas.
-   **Vistas (Views):** Se han definido vistas para simplificar consultas complejas, como `vista_inventario_celofan` y `vista_ventas_por_cliente`, que ofrecen resúmenes de datos en tiempo real.
-   **Lógica de Negocio en la BD:**
    -   **Funciones:** Incluye funciones como `obtener_stock_producto()` para encapsular la lógica de negocio y hacerla reutilizable.
    -   **Triggers:** Un trigger de **auditoría** registra automáticamente todos los cambios (INSERT, UPDATE, DELETE) en tablas críticas como `productos`, `notas_venta` y `pagos`, guardando un historial en la tabla `auditoria`.

**Diagrama de Tablas Principales:**

-   `usuarios` -> `clientes` -> `vendedores`
-   `notas_venta` -> `pedidos` -> `productos`
-   `produccion_celofan` / `produccion_polietileno` -> `almacen_celofan_movimientos` / `almacen_polietileno_movimientos` -> `entregas`
-   `notas_venta` -> `pagos`
-   `gastos`

**Importante:** Para que la aplicación funcione, es necesario tener una cuenta de Supabase, ejecutar el script `database/supabase.sql` para crear la estructura de la base de datos y configurar las credenciales correctas en `supabase.ts`.
