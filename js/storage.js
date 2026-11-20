/**
 * English Placement Test - Storage & Data Persistence (localStorage)
 */

// Global in-memory database
let D;

/**
 * Loads test data and settings from localStorage, running migrations if necessary.
 */
function load() {
  try {
    D = JSON.parse(localStorage.getItem('ept3'));
  } catch (e) {
    console.error('Error loading data from localStorage', e);
  }

  if (!D) {
    D = seed2();
  }

  // Migration v1 -> v2 (reading questions)
  if (!D.v) {
    D.v = 2;
    D.qs.push(...seed2().qs.filter(q => q.type == 'read'));
    save();
  }

  // Migration v2 -> v3 (listening dictations & question cues)
  if (D.v < 3) {
    D.v = 3;
    D.qs = D.qs.filter(q => !(q.sk == 'Listening' && q.type != 'dict'));
    if (!D.qs.some(q => q.type == 'dict')) {
      D.qs.push(...seed2().qs.filter(q => q.type == 'dict'));
    }
    D.qs.forEach(q => {
      if (!q.img) {
        const m = IMG.find(x => q.q.startsWith(x[0]));
        if (m) q.img = pic(m[1], CLR[q.sk]);
      }
    });
    save();
  }
}

/**
 * Persists the current database object to localStorage.
 */
function save() {
  try {
    localStorage.setItem('ept3', JSON.stringify(D));
  } catch (e) {
    toast('Almacenamiento lleno: usa archivos más pequeños.');
  }
}
