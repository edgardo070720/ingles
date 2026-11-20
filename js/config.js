/**
 * English Placement Test - Configuration & Constants
 */

// School branding & logo path
const LOGO = 'assets/logo.png';

// Google Sheets Webhook URL (Official deployment endpoint)
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzgsGFjzbXP4Ejt7YSJf7zOxu-WKEbNtat4iHib29R0eQ5SH-PP523fBJKdoAxSnYh27w/exec';

// Default Teacher PIN Hash (SHA-256 for '1234')
const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

// CEFR Levels
const L = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Evaluation Skills
const SK = ['Reading', 'Listening', 'Writing', 'Speaking'];

// School Grades (0: Transición, 1: 1°, ..., 11: 11°)
const G = ['Transición', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g, i) => i ? g + '°' : g);

// Rubrics for open-ended skills
const RUB = {
  Writing: [
    'Cumplimiento de la tarea',
    'Organización y coherencia',
    'Gramática',
    'Vocabulario'
  ],
  Speaking: [
    'Pronunciación y entonación',
    'Fluidez (lectura y habla)',
    'Contenido e interacción (Parte 2)',
    'Amplitud y precisión del lenguaje'
  ]
};

// Skill instructions for students
const INS = {
  Reading: 'Lee cada texto y responde.',
  Listening: 'Dictado: escucha con atención a tu profesor y escribe exactamente lo que oigas.',
  Writing: 'Escribe tus respuestas en inglés.',
  Speaking: 'Parte 1: lee el texto en voz alta. Parte 2: habla con tus propias palabras. Pulsa “Grabar” y luego “Detener” (máx. 60 s cada una).'
};

// Pedagogical recommendations by skill and performance level
const REC = {
  Reading: [
    'Lecturas graduadas cortas con apoyo visual y vocabulario cotidiano.',
    'Textos informativos semanales: idea principal, inferencias y vocabulario en contexto.',
    'Textos auténticos y argumentativos: tono, implícitos y registro formal.'
  ],
  Listening: [
    'Audios lentos con imágenes, canciones y dictados de frases simples.',
    'Podcasts y diálogos graduados; tomar notas y verificar la idea general y los detalles.',
    'Conferencias y debates a velocidad natural; acentos variados y toma de notas.'
  ],
  Writing: [
    'Oraciones guiadas y párrafos modelo; vocabulario básico y puntuación.',
    'Párrafos con conectores; revisión de tiempos verbales y borradores corregidos.',
    'Ensayos con tesis, argumentos y revisión de estilo y cohesión.'
  ],
  Speaking: [
    'Rutinas de repetición, juegos de rol sencillos y pronunciación de sonidos clave.',
    'Conversaciones en parejas, exposiciones de 1 minuto y retroalimentación de fluidez.',
    'Debates, presentaciones y paráfrasis con precisión léxica.'
  ]
};

// Colors and banner icons per skill
const CLR = {
  Reading: '#e3edff',
  Listening: '#fde8f1',
  Writing: '#fff1db',
  Speaking: '#e2f6ea'
};

const BN = {
  Reading: '📚 🔍 💡',
  Listening: '🎧 ✍️ 👂',
  Writing: '✏️ 📝 ✨',
  Speaking: '🎤 🗣️ 💬'
};

// Emojis for question visual cues
const IMG = [
  ['Look:', '🐱 🐱 🐱'],
  ['Tom ___', '👦 🤎 👀'],
  ['It is cold outside', '🧥 🧣 ❄️'],
  ['Complete: The girls', '👧 👧 ⚽ 🌳'],
  ['Where is the cat', '🐈 🐕 🛋️ 🪑'],
  ['Choose the correct sentence', '👧 🍎 🚫'],
  ['There aren', '🥚 🥛 🧊'],
  ['Write the word: Lucy', '🏃 🥇 🥈 🥉'],
  ['Anna ___', '🪥 😁 🦷'],
  ['Yesterday we ___', '🦁 🐘 🚌'],
  ['The students ___', '🏛️ 🧒 🧒 📅'],
  ['Which item can be reused', '🍾 🍌 🍬 ♻️'],
  ['Mount Everest', '🏔️ ⛰️'],
  ['The blue whale', '🐋 🐘 🐜'],
  ['I was reading', '📖 📞 🛋️'],
  ['You have a fever', '🤒 🛏️ 🌡️'],
  ['What did his grandfather', '👴 👟 🏫 🚲'],
  ['She has never', '✈️ 🗾 ❌'],
  ['If you heat ice', '🧊 🔥 💧'],
  ['If it rains', '🌧️ ⚽ ❓'],
  ['Choose the passive', '📝 ✅ 🧑'],
  ['What happens right after', '☀️ ☁️ 🌧️ 🌊'],
  ['Describe your best friend', '🧒 👕 😊 🎒'],
  ['Write 4–5 sentences', '⏰ 🪥 🍳 🎒'],
  ['Write 5 sentences', '⚽ 🎬 🛝 🍕'],
  ['Write a paragraph (6', '✈️ 🏖️ 🏕️ 🗺️'],
  ['Write 8–10', '🏔️ 🍕 ✈️ 🎢'],
  ['Choose your favourite animal', '🐘 🦁 🐧'],
  ['Tell us three things', '🏊 🚴 🎹'],
  ['Talk about your favourite sport', '⚽ 🏀 🏐 🎾'],
  ['Talk about a country', '🌎 ✈️ 🗺️'],
  ['Talk for one minute about your favourite movie', '🎬 🍿 🎞️'],
  ['Read the text aloud', '🔊 📖 🗣️']
];

// Curriculum topics by grade (Grammar and Oral/Vocabulary)
const TP = {
  1: [
    'What’s your name?|What is it? / What are they?|Who is she / he?|There is / There are|Is there? / Are there?|How many?|Where are you?|Demonstrative pronouns|What are you wearing?|Present continuous|Like / Don’t like|Do you like?|Have / Has',
    'Classroom objects|Colors|Family|Toys|Numbers|Furniture|Rooms in a house|Animals|Clothes|Verbs|Food and drinks|Parts of the body|Adjectives'
  ],
  2: [
    'Present simple|What time do you…?|Prepositions of place|There is / There are|Can / Can’t|Whose?|What do you wear?|Weather adjectives|Singular and plural|Some and any|Does questions and negative|Likes / Doesn’t like|Where they go|Ordinal numbers',
    'Daily routines|Places in the city|City verbs|Animals|Clothes|Numbers|Seasons|Food|Occupations|Free-time activities|Months'
  ],
  3: [
    'Present simple|Before and after|Frequency adverbs|There is / There are|Quantifiers|Giving orders|Present continuous|Adverbs and adjectives|Verbs|Was / Were|There was / There were|Past simple|Did not',
    'Healthy habits|Time expressions|City and countryside activities|Food units|Food and drinks|Chore verbs|Cleaning items|Sports|Sports equipment|Recyclable and reusable materials|Literary genres|Characters|Tourist attractions|Vacation verbs|Society words'
  ],
  4: [
    'Have / Don’t have|Past continuous|Interrupted past|Should / Shouldn’t|Comparatives|Adjectives|Superlatives|Could / Couldn’t|Used to / Didn’t use to|Going to|Relative pronouns',
    'School rooms|School personnel|School verbs|Places in a town|Tourist verbs|Body parts|Illnesses|Countries|Endangered animals|Sports|Sport verbs|Collectables|Verbs|Extreme sports|Sports gear|Places|Travel professions'
  ],
  5: [
    'What time?|Present simple|Should / Shouldn’t|Third person singular|Past simple|Present perfect|Present perfect questions|Zero conditional|First conditional|Passive voice|Adjectives|There will / Won’t be|Description',
    'School subjects|Telling the time / Schedules|Family members|Parental suggestions|The universe|Movie genres|-ed / -ing adjectives|The water cycle|Water|The 3 Rs|Food|Household items|School items|School-related activities'
  ]
};
