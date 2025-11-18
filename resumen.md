# Resumen del Proyecto: foodcalcnew

Este documento resume el trabajo contenido en el proyecto "foodcalcnew", analizando sus funciones, funcionalidades, objetivos, logros, falencias detectadas y estableciendo metas futuras.

## 1. Visión General del Proyecto

**Nombre del Proyecto:** foodcalcnew
**Tecnologías Principales:** Electron, TypeScript, SQLite3, ExcelJS, csv-parse, simple-statistics, ECharts (para visualización, inferido).
**Propósito:** "foodcalcnew" es una aplicación de escritorio diseñada para el cálculo y análisis nutricional. Permite a los usuarios gestionar bases de datos de alimentos, registrar su consumo diario y obtener informes detallados y análisis estadísticos sobre su ingesta de nutrientes.

## 2. Estructura y Componentes Clave

El proyecto sigue una arquitectura típica de Electron, separando el proceso principal (main) del proceso de renderizado (renderer).

*   **`package.json`**: Define el proyecto, sus scripts (`start`, `build`) y dependencias. Destacan `electron`, `sqlite3`, `exceljs`, `csv-parse`, `simple-statistics` y `echarts`.
*   **`tsconfig.json`**: Configuración de TypeScript, compilando a `es2022` y `commonjs` en el directorio `dist`.
*   **`src/main.ts`**: El corazón del proceso principal de Electron. Contiene:
    *   **Configuración de la Ventana:** Creación de la ventana principal de Electron.
    *   **Gestión de la Base de Datos SQLite:** Inicialización, creación de tablas y lógica de conexión/desconexión.
    *   **Manejadores IPC (Inter-Process Communication):** Funciones que exponen la lógica de negocio y acceso a datos al proceso de renderizado.
    *   **Lógica de Importación/Exportación:** Manejo de archivos Excel y CSV.
    *   **Lógica de Cálculo y Análisis Nutricional:** Implementación de las funciones de cálculo y estadísticas.
*   **`src/preload.ts`**: (Inferred, based on `tsconfig.json` and Electron best practices) Actúa como un puente seguro entre el proceso principal y el de renderizado, exponiendo solo las funciones IPC necesarias.
*   **`src/renderer.ts`**: (Inferred) Contendría la lógica de la interfaz de usuario, interactuando con el proceso principal a través de los manejadores IPC expuestos por `preload.ts`.
*   **`src/index.html`**: La interfaz de usuario principal de la aplicación.

## 3. Funcionalidades y Logros

El proyecto ha implementado un conjunto robusto de funcionalidades:

### 3.1. Gestión de Bases de Datos de Alimentos

*   **Base de Datos Local:** Utiliza SQLite para almacenar datos de forma persistente en el sistema del usuario (`foodcalc.db`).
*   **Tablas Definidas:**
    *   `FoodDatabases`: Para organizar los alimentos en diferentes colecciones (ej. "Default").
    *   `Foods`: Almacena alimentos con un amplio perfil nutricional (macronutrientes, vitaminas, minerales, etc.).
    *   `ConsumptionLog`: Registra el consumo de alimentos por usuario, fecha y tipo de comida.
*   **CRUD Completo:**
    *   **`FoodDatabases`**: Añadir, obtener y eliminar bases de datos (la base de datos "Default" es protegida).
    *   **`Foods`**: Añadir, obtener detalles, actualizar y eliminar alimentos.
*   **Importación de Datos:**
    *   **`import-excel`**: Permite importar grandes volúmenes de datos de alimentos desde archivos `.xlsx` a una base de datos específica, mapeando columnas de Excel a campos de nutrientes.
    *   **`import-csv`**: Similar a la importación de Excel, pero para archivos `.csv`, con manejo de delimitadores.
*   **Exportación de Informes:**
    *   **`export-report`**: Exporta los resultados de los cálculos nutricionales a archivos `.csv` o `.xlsx` con formato adecuado.

### 3.2. Registro de Consumo

*   **Búsqueda de Alimentos:** `search-foods` permite encontrar alimentos rápidamente dentro de una base de datos.
*   **Registro de Entradas:** `add-log-entry` para registrar el consumo de un alimento (cantidad en gramos) por un usuario en una fecha y tipo de comida específicos.
*   **Consulta y Edición:** `get-log-entries` para ver el historial de consumo y `edit-log-entry` para modificar cantidades.
*   **Eliminación:** `delete-log-entry` para remover entradas de consumo.
*   **Importación de Registros:**
    *   **`import-consumption-log` (Excel) y `import-consumption-log-csv` (CSV):** Permiten importar historiales de consumo completos, realizando búsquedas internas para vincular los alimentos y bases de datos por nombre.
*   **Usuarios Únicos:** `get-unique-user-ids` para obtener una lista de todos los usuarios registrados.

### 3.3. Análisis Nutricional Avanzado (Módulo 3)

El proyecto incluye un potente módulo de análisis que utiliza la librería `simple-statistics` y está diseñado para integrarse con `echarts` para visualizaciones:

*   **`calculate-intake`**: Calcula la ingesta total de todos los nutrientes para un usuario en un rango de fechas y una base de datos de referencia.
*   **`get-statistical-report` (Análisis Epidemiológico):** Genera un informe estadístico (media, mediana, desviación estándar, varianza, cuartiles, min, max) sobre el *promedio diario de ingesta de un nutriente* entre múltiples usuarios.
*   **`get-daily-intake-over-time` (Análisis Nutricional Individual):** Proporciona la ingesta diaria de un nutriente específico para un usuario a lo largo del tiempo, ideal para gráficos de línea.
*   **`get-nutrient-contribution` (Análisis de Contribución por Alimento):** Calcula la contribución de cada alimento a la ingesta total de un nutriente para un usuario en un período, útil para gráficos de pastel.
*   **`get-meal-contribution` (Análisis de Contribución por Comida):** Determina cómo los diferentes tipos de comida (desayuno, almuerzo, etc.) contribuyen a la ingesta de un nutriente, también para gráficos de pastel.
*   **`getBaseAnalyticsData`**: Función auxiliar clave para pre-procesar los datos de consumo para los análisis.

### 3.4. Interacción con el Usuario

*   **Diálogos Estándar:** Implementación de diálogos de confirmación, error e información (`show-confirm-dialog`, `show-error-dialog`, `show-info-dialog`) para una comunicación clara con el usuario.

## 4. Falencias Detectadas y Áreas de Mejora

1.  **Manejo de Errores en Importaciones:**
    *   Las importaciones de alimentos y registros de consumo utilizan `INSERT OR IGNORE`. Esto significa que las filas con nombres duplicados (para alimentos) o entradas ya existentes (para logs) son ignoradas silenciosamente. Sería beneficioso ofrecer al usuario opciones (ej. actualizar, omitir con notificación, detener la importación) o un informe detallado de las filas ignoradas/fallidas.
    *   Los mensajes de error actuales son informativos, pero una interfaz de usuario que muestre un log de errores detallado durante importaciones masivas mejoraría la experiencia.
2.  **Flexibilidad de Importación:**
    *   Las funciones de importación de Excel y CSV asumen un orden y nombre de columnas fijos. Esto hace que el sistema sea frágil ante cambios en el formato de los archivos fuente. Una interfaz que permita al usuario mapear las columnas del archivo a los campos de la base de datos sería una mejora significativa.
3.  **Validación de Datos:**
    *   Aunque existe validación básica (tipos, no vacíos), se podría mejorar con validaciones más estrictas para rangos de valores de nutrientes (ej. no negativos, límites realistas) y formatos de fecha más flexibles si fuera necesario.
4.  **Rendimiento con Grandes Volúmenes de Datos:**
    *   Para bases de datos de alimentos o historiales de consumo muy grandes, la carga completa de `FoodDatabases` y `Foods` en mapas (`dbLookupMap`, `foodLookupMap`) durante la importación de logs podría afectar el rendimiento. Se podrían explorar estrategias como la indexación de la base de datos o la búsqueda incremental.
5.  **Gestión de Usuarios:**
    *   El `UserID` es actualmente una cadena de texto simple. Para una aplicación multiusuario más robusta, se necesitaría un sistema de autenticación y gestión de perfiles de usuario más sofisticado.
6.  **Consistencia de Unidades:**
    *   Aunque los nutrientes tienen unidades implícitas (ej. `_kcal`, `_g`, `_mg`), asegurar una gestión y conversión de unidades consistente en toda la aplicación (especialmente si se introducen diferentes fuentes de datos) es crucial.
7.  **Duplicación de Código:**
    *   Hay cierta repetición en la lógica de conexión/cierre de la base de datos y el manejo de errores en los manejadores IPC. Una capa de abstracción para las operaciones de la base de datos podría centralizar esto y mejorar la mantenibilidad.
8.  **Interpretación de Estadísticas:**
    *   El `get-statistical-report` calcula estadísticas sobre los *promedios diarios por usuario*. Dependiendo del objetivo epidemiológico exacto, podría ser necesario ofrecer otras métricas (ej. estadísticas sobre todas las ingestas diarias combinadas de todos los usuarios).

## 5. Metas Futuras

1.  **Interfaz de Usuario para Mapeo de Importación:** Desarrollar una UI que permita a los usuarios configurar dinámicamente el mapeo de columnas para las importaciones de Excel y CSV, haciendo la aplicación más flexible.
2.  **Visualizaciones Interactivas Avanzadas:** Implementar gráficos interactivos y personalizables utilizando `echarts` para todas las funcionalidades de análisis (estadísticas, tendencias diarias, contribuciones por alimento/comida).
3.  **Perfiles de Usuario y Metas Nutricionales:** Permitir la creación de perfiles de usuario con la capacidad de establecer metas nutricionales (ej. calorías diarias, ratios de macronutrientes) y visualizar el progreso.
4.  **Gestión de Recetas:** Añadir una funcionalidad para crear y gestionar recetas, calculando automáticamente su perfil nutricional a partir de los alimentos en las bases de datos.
5.  **Planificación de Comidas:** Herramientas para planificar comidas con antelación y generar listas de compras.
6.  **Sincronización y Copias de Seguridad en la Nube:** Ofrecer opciones para sincronizar datos con servicios en la nube o realizar copias de seguridad sencillas de la base de datos local.
7.  **Internacionalización (i18n):** Soporte para múltiples idiomas y formatos regionales (fechas, números).
8.  **Optimización de Rendimiento:** Investigar e implementar mejoras de rendimiento para operaciones con grandes volúmenes de datos, especialmente en importaciones y consultas complejas.
9.  **Pruebas Unitarias y de Integración:** Desarrollar un conjunto completo de pruebas para los manejadores IPC, la lógica de la base de datos y las funciones de cálculo para asegurar la robustez y prevenir regresiones.
10. **Refactorización de la Capa de Acceso a Datos:** Crear una clase o servicio dedicado para todas las interacciones con SQLite, centralizando la lógica, mejorando el manejo de errores y reduciendo la duplicación de código.
11. **Mejora de la Experiencia de Usuario en Importaciones:** Implementar indicadores de progreso y logs de errores detallados directamente en la UI durante las operaciones de importación.

Este resumen proporciona una visión completa del estado actual del proyecto "foodcalcnew" y un camino claro para su evolución futura.
