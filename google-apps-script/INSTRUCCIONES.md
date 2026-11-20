# Guía de Conexión con Google Sheets

Esta guía explica paso a paso cómo conectar tu aplicación **English Placement Test** a una hoja de cálculo de Google Sheets para que los resultados de las evaluaciones se guarden de forma automática y en tiempo real.

---

### Paso 1: Crear la Hoja de Cálculo

1. Ve a [Google Sheets](https://sheets.new) y crea una nueva hoja en blanco.
2. Nómbrala, por ejemplo: **Resultados English Placement Test**.
3. *(Opcional)* Puedes dejar la hoja vacía; el script creará los encabezados y estilos automáticamente.

---

### Paso 2: Abrir el editor de Apps Script

1. En el menú superior de tu hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
2. Verás un editor de código con un archivo llamado `Código.gs` (o `Code.gs`).
3. Borra todo el código que aparezca allí y pega el contenido completo de [`Code.gs`](file:///home/ing-edgardo-ramos/Documentos/ingles/google-apps-script/Code.gs).
4. Haz clic en el ícono de **Guardar** (disquete) en la barra superior.

---

### Paso 3: Implementar como Aplicación Web (Web App)

1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar** (*Deploy*) > **Nueva implementación** (*New deployment*).
2. Haz clic en el ícono de engranaje ⚙️ junto a *Seleccionar tipo* y elige **Aplicación web** (*Web app*).
3. Configura los siguientes campos:
   * **Descripción:** *Webhook Evaluaciones de Inglés*
   * **Ejecutar como:** **Yo** (`tu-correo@gmail.com`)
   * **Quién tiene acceso:** **Cualquier usuario** (*Anyone*) *(¡Muy importante para que los aspirantes puedan enviar su prueba sin iniciar sesión de Google!)*
4. Haz clic en **Implementar** (*Deploy*).
5. Google te pedirá autorizar el acceso:
   * Haz clic en **Revisar permisos** (*Review permissions*).
   * Selecciona tu cuenta de Google.
   * Si aparece la advertencia *"Google no ha verificado esta aplicación"*, haz clic en **Configuración avanzada** (*Advanced*) y luego en **Ir a Webhook Evaluaciones de Inglés (no seguro)**.
   * Haz clic en **Permitir** (*Allow*).
6. Copia la **URL de la aplicación web** (tiene el formato `https://script.google.com/macros/s/.../exec`).

---

### Paso 4: Configurar la URL en la Aplicación

Tienes dos formas de configurarla:

#### Opción A: Desde el Panel Docente (Sin tocar código)
1. Abre tu aplicación [index.html](file:///home/ing-edgardo-ramos/Documentos/ingles/index.html).
2. Haz clic en **Docente** (PIN por defecto: `1234`).
3. Ve a la pestaña **Ajustes**.
4. Pega la URL en el campo **URL de Google Sheets (Web App)**.
5. Haz clic en **Probar conexión**. En unos segundos verás una fila de prueba en tu hoja de Google Sheets.

#### Opción B: Dejarla fija en el código
En el archivo [`js/config.js`](file:///home/ing-edgardo-ramos/Documentos/ingles/js/config.js), cambia:
```javascript
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/TU_ID_AQUI/exec';
```

---

### Datos que se guardan automáticamente

Cada vez que un estudiante finaliza su prueba, se genera una fila con:
* **Fecha y Hora** de entrega
* **ID Aspirante**
* **Nombre completo** del aspirante
* **Grado** al que aspira
* **Desempeño Total (%)** y **Nivel MCER General** (`Pre-A1` a `B2`)
* **Estado:** *Completo* o *Pendiente revisión docente*
* **Reading:** Puntaje (%) y Nivel alcanzado
* **Listening:** Puntaje (%) y Nivel alcanzado
* **Writing:** Texto redactado por el estudiante
* **Speaking:** Indicador de grabación
* **Observaciones y notas del docente**
* **Backup JSON completo** de la prueba
