// ═══════════════════════════════════════════════════════════════════
//  config.js
//  Zentrale Konfiguration – alle Werte hier ändern, nirgendwo sonst.
//  Das CONFIG-Objekt ist das einzige "Live"-Objekt, das vom Settings-
//  Panel zur Laufzeit mutiert wird.
// ═══════════════════════════════════════════════════════════════════

export const PREDEFINED_WORDS = [
  "EGO", "GELD", "EIFERSUCHT", "NEID", "STRESS",
  "GIER", "HASS", "LÜGEN", "FAULHEIT", "ARROGANZ",
];

export const CONFIG = {
  // ── Blasen ──────────────────────────────────────────────
  BUBBLE_COUNT: 300,
  RADIUS_MIN: 30,
  RADIUS_MAX: 70,
  SPEED_MULT: 2.0,   // Multiplikator auf Basis-Speed
  WOBBLE_AMP: 0.5,   // Amplitude der seitlichen Taumelbewegung

  // ── Gesichtserkennung / Nähe ─────────────────────────────
  PROXIMITY_THRESHOLD: 0.02, // Gesichtsfläche in % des Frames → Reaktion
  PUSH_FORCE: 1500, // Pixel, die Blasen nach außen gedrückt werden
  LERP_SPEED: 0.05, // Interpolationsgeschwindigkeit (0.01 = träge, 0.3 = schnell)
  FADE_INTENSITY: 1.5,  // Wie schnell Blasen bei Nähe ausblenden

  // ── Darstellung ──────────────────────────────────────────
  BLUR_OPACITY_MAX: 0.40,  // Max. Kamera-Abdunklung (0 = keins, 1 = schwarz)
  FILL_OPACITY: 0.40,  // Transparenz der Blasenfüllung (0–1)
  FONT_SIZE_RATIO: 0.35,  // Schriftgröße relativ zum Radius
  SHADOW_ENABLED: true,
  CAMERA_ENABLED: true,
  GLOSS_ENABLED: true,

  // ── Farbthema ────────────────────────────────────────────
  ACTIVE_GRADIENT_SET: 0,

  // ── Wörter ───────────────────────────────────────────────
  // Wird zur Laufzeit mit PREDEFINED_WORDS initialisiert (siehe main.js).
  // Zusätzliche Wörter werden via Settings-Panel ergänzt.
  WORDS: [...PREDEFINED_WORDS],
};

// Snapshot der Startwerte für den Reset-Button
export const DEFAULTS = { ...CONFIG, WORDS: [...CONFIG.WORDS] };

// ── Farbthemen-Presets ────────────────────────────────────────────
export const GRADIENT_SETS = [
  {
    name: "Spektrum",
    dot: "linear-gradient(135deg,#FF5F6D,#5B86E5)",
    gradients: [
      ["#FF5F6D", "#FFC371"], ["#36D1DC", "#5B86E5"], ["#FF4B2B", "#FF416C"],
      ["#11998e", "#38ef7d"], ["#8E2DE2", "#4A00E0"], ["#FDC830", "#F37335"],
      ["#00C9FF", "#92FE9D"], ["#fc4a1a", "#f7b733"], ["#DA22FF", "#9733EE"],
      ["#4CB8C4", "#3CD3AD"],
    ],
  },
  {
    name: "Nacht",
    dot: "linear-gradient(135deg,#1a1a2e,#6a4c93)",
    gradients: [
      ["#1a1a2e", "#16213e"], ["#0f3460", "#533483"], ["#6a4c93", "#1982c4"],
      ["#232526", "#414345"], ["#141e30", "#243b55"], ["#0f0c29", "#302b63"],
      ["#24243e", "#302b63"], ["#2c3e50", "#3498db"], ["#1a2980", "#26d0ce"],
      ["#16222a", "#3a6073"],
    ],
  },
  {
    name: "Feuer",
    dot: "linear-gradient(135deg,#ff4500,#ffd700)",
    gradients: [
      ["#ff4500", "#ff8c00"], ["#ff6b35", "#f7931e"], ["#c0392b", "#e74c3c"],
      ["#f39c12", "#f1c40f"], ["#e55d87", "#5fc3e4"], ["#fc4a1a", "#f7b733"],
      ["#eb3349", "#f45c43"], ["#f7971e", "#ffd200"], ["#ff416c", "#ff4b2b"],
      ["#f2994a", "#f2c94c"],
    ],
  },
  {
    name: "Ozean",
    dot: "linear-gradient(135deg,#006994,#00c9c8)",
    gradients: [
      ["#006994", "#0099cc"], ["#00b4db", "#0083b0"], ["#1a6b8a", "#2dd4bf"],
      ["#005c97", "#363795"], ["#36d1dc", "#5b86e5"], ["#00c9c8", "#0061ff"],
      ["#4cb8c4", "#3cd3ad"], ["#2193b0", "#6dd5ed"], ["#43b89c", "#6dd5a0"],
      ["#1565c0", "#b92b27"],
    ],
  },
  {
    name: "Pastell",
    dot: "linear-gradient(135deg,#fbc2eb,#a6c1ee)",
    gradients: [
      ["#fbc2eb", "#a6c1ee"], ["#ffecd2", "#fcb69f"], ["#a1c4fd", "#c2e9fb"],
      ["#fccb90", "#d57eeb"], ["#e0c3fc", "#8ec5fc"], ["#fddb92", "#d1fdff"],
      ["#f6d365", "#fda085"], ["#96fbc4", "#f9f586"], ["#cfd9df", "#e2ebf0"],
      ["#ffecd2", "#a1c4fd"],
    ],
  },
];
