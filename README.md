# English Placement Test · Admisiones

Sistema de evaluación diagnóstica en lengua inglesa alineado al Marco Común Europeo de Referencia (MCER, niveles Pre-A1 a B1/B2) para aspirantes y admisiones escolares (grados 1° a 5° de primaria y bachillerato).

---

## Estructura del Proyecto

El código ha sido modularizado para facilitar su lectura, mantenimiento y evolución:

```text
.
├── index.html               # Punto de entrada HTML (semántico y limpio)
├── assets/
│   └── logo.png             # Logotipo institucional (extraído del base64 original)
├── css/
│   └── styles.css           # Estilos globales, variables CSS, modo oscuro e impresión
├── js/
│   ├── config.js            # Niveles MCER, grados, habilidades, rúbricas y temas
│   ├── utils.js             # Utilidades DOM, generador de IDs, escape XSS y algoritmo Levenshtein
│   ├── data.js              # Banco de preguntas graduadas y semillas de datos
│   ├── storage.js           # Manejo de persistencia local (localStorage) y migraciones
│   ├── audio.js             # Síntesis de voz (TTS) y grabadora de audio (Speaking)
│   ├── scoring.js           # Algoritmo de nivelación MCER, rúbricas y calificación asistida
│   ├── app.js               # Estado global de la aplicación y enrutador principal
│   └── views/
│       ├── student.js       # Vistas y flujo del aspirante (preguntas, navegación, entrega)
│       ├── report.js        # Informe pedagógico imprimible del aspirante
│       └── admin.js         # Panel docente (aspirantes, editor de preguntas, dictados, ajustes)
└── README.md
```

---

## Habilidades Evaluadas

1. **Reading:** Comprensión lectora con selección múltiple y respuesta corta, contextualizada según grado y nivel MCER.
2. **Listening:** Dictados orales leídos por docente o reproducidos mediante síntesis de voz natural (`Web Speech API`). Evaluación automática mediante distancia de edición (Levenshtein) con desglose de aciertos, errores ortográficos y omisiones.
3. **Writing:** Producción escrita con retroalimentación docente basada en rúbricas analíticas (Cumplimiento, Organización, Gramática y Vocabulario).
4. **Speaking:** Grabación de audio en el navegador (Parte 1: Lectura en voz alta; Parte 2: Expresión oral libre) para evaluación con rúbrica docente.

---

## Panel Docente / Ajustes

* **Acceso:** Botón **Docente** en el encabezado.
* **PIN por defecto:** `1234` (se puede modificar desde la pestaña *Ajustes*).
* **Funcionalidades:**
  * Lista de aspirantes y estado de evaluación.
  * Informes individuales imprimibles o exportables a PDF.
  * Banco de preguntas editable (añadir, editar, filtrar y eliminar).
  * Guiones de dictados listos para imprimir o apoyar con voz de navegador.
  * **Conexión con Google Sheets:** Sincronización en la nube mediante Apps Script.

---

## Persistencia con Google Sheets

Para registrar los resultados en tiempo real en una hoja de Google Sheets:
1. Revisa el script en [`google-apps-script/Code.gs`](file:///home/ing-edgardo-ramos/Documentos/ingles/google-apps-script/Code.gs).
2. Sigue los pasos de la guía detallada en [`google-apps-script/INSTRUCCIONES.md`](file:///home/ing-edgardo-ramos/Documentos/ingles/google-apps-script/INSTRUCCIONES.md).
3. Pega la URL del Web App en el panel docente (**Ajustes** > **Persistencia en Google Sheets**) o configúrala en [`js/config.js`](file:///home/ing-edgardo-ramos/Documentos/ingles/js/config.js).
