// ═══════════════════════════════════════════════════════════════════
//  config.js
//  Zentrale Konfiguration – alle Werte hier ändern, nirgendwo sonst.
// ═══════════════════════════════════════════════════════════════════

// ── Wortlisten pro Sprache (je rein in ihrer Sprache) ─────────────
export const PREDEFINED_WORDS_DE = [
  "EGO", "GELD", "EIFERSUCHT", "NEID", "STRESS",
  "GIER", "HASS", "LÜGEN", "FAULHEIT", "ARROGANZ",
];

export const PREDEFINED_WORDS_IT = [
  "EGO", "DENARO", "GELOSIA", "INVIDIA", "STRESS",
  "AVIDITÀ", "ODIO", "BUGIE", "PIGRIZIA", "ARROGANZA",
];

export const PREDEFINED_WORDS_EN = [
  "EGO", "MONEY", "JEALOUSY", "ENVY", "STRESS",
  "GREED", "HATE", "LIES", "LAZINESS", "ARROGANCE",
];

export const PREDEFINED_WORDS_ES = [
  "EGO", "DINERO", "CELOS", "ENVIDIA", "ESTRÉS",
  "AVARICIA", "ODIO", "MENTIRAS", "PEREZA", "ARROGANCIA",
];

// Standard beim Start: Deutsch
export const PREDEFINED_WORDS = PREDEFINED_WORDS_DE;

// Lookup-Map für das Settings-Panel
export const WORDS_BY_LANG = {
  de: PREDEFINED_WORDS_DE,
  it: PREDEFINED_WORDS_IT,
  en: PREDEFINED_WORDS_EN,
  es: PREDEFINED_WORDS_ES,
};

export const CONFIG = {
  // ── Blasen ──────────────────────────────────────────────
  BUBBLE_COUNT: 300,
  RADIUS_MIN: 10,
  RADIUS_MAX: 100,
  SPEED_MULT: 1.5,
  WOBBLE_AMP: 0.5,

  // ── Gesichtserkennung / Nähe ─────────────────────────────
  PROXIMITY_THRESHOLD: 0.02,
  PUSH_FORCE: 500,
  LERP_SPEED: 0.05,
  FADE_INTENSITY: 1.5,

  // ── Darstellung ──────────────────────────────────────────
  BLUR_OPACITY_MAX: 0.40,
  FILL_OPACITY: 0.60,
  FONT_SIZE_RATIO: 0.35,
  SHADOW_ENABLED: true,
  CAMERA_ENABLED: true,
  GLOSS_ENABLED: true,

  // ── Farbthema ────────────────────────────────────────────
  ACTIVE_GRADIENT_SET: 0,

  // ── Sprache & Wörter ─────────────────────────────────────
  ACTIVE_LANGUAGE: "de",
  WORDS: [...PREDEFINED_WORDS_DE],
};

export const DEFAULTS = { ...CONFIG, WORDS: [...CONFIG.WORDS] };

// ── Farbthemen-Presets ────────────────────────────────────────────
export const GRADIENT_SETS = [
  {
    name: "Spectrum",
    dot: "linear-gradient(135deg,#FF5F6D,#5B86E5)",
    gradients: [
      ["#FF5F6D", "#FFC371"], ["#36D1DC", "#5B86E5"], ["#FF4B2B", "#FF416C"],
      ["#11998e", "#38ef7d"], ["#8E2DE2", "#4A00E0"], ["#FDC830", "#F37335"],
      ["#00C9FF", "#92FE9D"], ["#fc4a1a", "#f7b733"], ["#DA22FF", "#9733EE"],
      ["#4CB8C4", "#3CD3AD"],
    ],
  },
  {
    name: "Night",
    dot: "linear-gradient(135deg,#1a1a2e,#6a4c93)",
    gradients: [
      ["#1a1a2e", "#16213e"], ["#0f3460", "#533483"], ["#6a4c93", "#1982c4"],
      ["#232526", "#414345"], ["#141e30", "#243b55"], ["#0f0c29", "#302b63"],
      ["#24243e", "#302b63"], ["#2c3e50", "#3498db"], ["#1a2980", "#26d0ce"],
      ["#16222a", "#3a6073"],
    ],
  },
  {
    name: "Fire",
    dot: "linear-gradient(135deg,#ff4500,#ffd700)",
    gradients: [
      ["#ff4500", "#ff8c00"], ["#ff6b35", "#f7931e"], ["#c0392b", "#e74c3c"],
      ["#f39c12", "#f1c40f"], ["#e55d87", "#5fc3e4"], ["#fc4a1a", "#f7b733"],
      ["#eb3349", "#f45c43"], ["#f7971e", "#ffd200"], ["#ff416c", "#ff4b2b"],
      ["#f2994a", "#f2c94c"],
    ],
  },
  {
    name: "Ocean",
    dot: "linear-gradient(135deg,#006994,#00c9c8)",
    gradients: [
      ["#006994", "#0099cc"], ["#00b4db", "#0083b0"], ["#1a6b8a", "#2dd4bf"],
      ["#005c97", "#363795"], ["#36d1dc", "#5b86e5"], ["#00c9c8", "#0061ff"],
      ["#4cb8c4", "#3cd3ad"], ["#2193b0", "#6dd5ed"], ["#43b89c", "#6dd5a0"],
      ["#1565c0", "#b92b27"],
    ],
  },
  {
    name: "Pastel",
    dot: "linear-gradient(135deg,#fbc2eb,#a6c1ee)",
    gradients: [
      ["#fbc2eb", "#a6c1ee"], ["#ffecd2", "#fcb69f"], ["#a1c4fd", "#c2e9fb"],
      ["#fccb90", "#d57eeb"], ["#e0c3fc", "#8ec5fc"], ["#fddb92", "#d1fdff"],
      ["#f6d365", "#fda085"], ["#96fbc4", "#f9f586"], ["#cfd9df", "#e2ebf0"],
      ["#ffecd2", "#a1c4fd"],
    ],
  },
];
