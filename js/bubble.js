// ═══════════════════════════════════════════════════════════════════
//  bubble.js
//  Die Bubble-Klasse mit Offscreen-Canvas (Pre-Rendering) für 
//  maximale Performance bei hohen Blasen-Anzahlen (300-700+).
// ═══════════════════════════════════════════════════════════════════

import { CONFIG, GRADIENT_SETS } from "./config.js";

/** Gibt den aktuell aktiven Gradienten-Array zurück */
function activeGradients() {
  return GRADIENT_SETS[CONFIG.ACTIVE_GRADIENT_SET]?.gradients ?? GRADIENT_SETS[0].gradients;
}

/** Lineare Interpolation */
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

export class Bubble {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number|null} initialY – wenn gesetzt, startet die Blase hier (Verteilen beim Start)
   */
  constructor(canvas, initialY = null) {
    this.canvas = canvas;
    this.naturalX = 0;
    this.naturalY = 0;
    this.pushedX = 0;
    this.pushedY = 0;
    this.currentPushOffset = 0;
    this.currentOpacity = 1.0;

    this._init();

    if (initialY !== null) {
      this.naturalY = initialY;
      this.pushedY = initialY;
    }
  }

  /** Werte für eine neue (oder zurückgesetzte) Blase */
  _init() {
    const { RADIUS_MIN, RADIUS_MAX, SPEED_MULT, WORDS } = CONFIG;

    this.radius = Math.random() * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN;
    this.naturalX = Math.random() * this.canvas.width;
    this.naturalY = this.canvas.height + this.radius; // starte unten
    this.speed = (Math.random() * 1.5 + 0.5) * (SPEED_MULT / 2);
    this.wobble = Math.random() * Math.PI * 2;
    this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.colorPair = this._randomColor();

    this.pushedX = this.naturalX;
    this.pushedY = this.naturalY;

    // NEU: Die Blase einmalig als Bild im Speicher generieren!
    this._preRender();
  }

  _randomColor() {
    const grads = activeGradients();
    return grads[Math.floor(Math.random() * grads.length)];
  }

  /** Wird aufgerufen wenn Farbthema oder Wörter wechseln – ohne Neustart */
  refreshAppearance() {
    const { WORDS } = CONFIG;
    this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.colorPair = this._randomColor();

    // WICHTIG: Nach einem Farb/Wort-Wechsel muss das Cache-Bild neu gemalt werden!
    this._preRender();
  }

  /** * Diese Funktion malt die Blase EINMALIG auf einen unsichtbaren Canvas.
   * Das spart im Render-Loop massiv CPU-Ressourcen.
   */
  _preRender() {
    const { FILL_OPACITY, FONT_SIZE_RATIO, SHADOW_ENABLED, GLOSS_ENABLED } = CONFIG;

    // Erstelle ein unsichtbares Canvas, das genau so groß ist wie die Blase
    this.cacheCanvas = document.createElement('canvas');
    const size = this.radius * 2;
    // Etwas Puffer für Schatten, damit dieser nicht abgeschnitten wird
    const padding = SHADOW_ENABLED ? 10 : 2;
    this.cacheCanvas.width = size + padding * 2;
    this.cacheCanvas.height = size + padding * 2;

    const cacheCtx = this.cacheCanvas.getContext('2d');
    const center = this.radius + padding; // Mittelpunkt auf dem Cache-Canvas

    cacheCtx.save();

    // Farbverlauf
    const gradient = cacheCtx.createLinearGradient(center - this.radius, center - this.radius, center + this.radius, center + this.radius);
    gradient.addColorStop(0, this.colorPair[0]);
    gradient.addColorStop(1, this.colorPair[1]);

    // Füllung (halbtransparent)
    cacheCtx.beginPath();
    cacheCtx.arc(center, center, this.radius, 0, Math.PI * 2);
    cacheCtx.globalAlpha = FILL_OPACITY;
    cacheCtx.fillStyle = gradient;
    cacheCtx.fill();

    // Äußerer Rand
    cacheCtx.globalAlpha = 0.9;
    cacheCtx.lineWidth = 2;
    cacheCtx.strokeStyle = "rgba(255,255,255,0.6)";
    cacheCtx.stroke();

    // Glanzeffekt (optional)
    if (GLOSS_ENABLED) {
      cacheCtx.beginPath();
      cacheCtx.arc(center, center, this.radius - 2, 0, Math.PI * 2);
      cacheCtx.lineWidth = 1;
      cacheCtx.strokeStyle = "rgba(255,255,255,0.3)";
      cacheCtx.stroke();
    }

    // Text
    cacheCtx.globalAlpha = 1.0;
    if (SHADOW_ENABLED) {
      cacheCtx.shadowColor = "rgba(0,0,0,0.9)";
      cacheCtx.shadowBlur = 4;
    }
    cacheCtx.fillStyle = "#ffffff";
    cacheCtx.font = `bold ${this.radius * FONT_SIZE_RATIO}px 'RobotoCondensed', Arial`;
    cacheCtx.textAlign = "center";
    cacheCtx.textBaseline = "middle";
    cacheCtx.fillText(this.word, center, center);

    cacheCtx.restore();
  }

  /**
   * Physik-Update pro Frame
   * @param {number} proximity – normalisierter Wert der Gesichtsgröße (0–1+)
   */
  update(proximity) {
    const { WOBBLE_AMP, LERP_SPEED, PROXIMITY_THRESHOLD, PUSH_FORCE, FADE_INTENSITY } = CONFIG;

    // 1. Natürliche Bewegung
    this.naturalY -= this.speed;
    this.naturalX += Math.sin(this.wobble) * (WOBBLE_AMP / 3);
    this.wobble += 0.02;

    // 2. Richtungsvektor von Bildmitte weg
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const vx = this.naturalX - cx;
    const vy = this.naturalY - cy;
    const dist = Math.sqrt(vx * vx + vy * vy);
    const dx = dist > 1 ? vx / dist : 0;
    const dy = dist > 1 ? vy / dist : -1;

    // 3. Push-Ziel und Opazität
    let targetPush = 0;
    let targetOpacity = 1.0;
    if (proximity > PROXIMITY_THRESHOLD) {
      const intensity = Math.min((proximity - PROXIMITY_THRESHOLD) * 10, 1.0);
      targetPush = PUSH_FORCE * intensity;
      targetOpacity = Math.max(0, 1.0 - intensity * FADE_INTENSITY);
    }

    // 4. Sanft interpolieren
    this.currentPushOffset = lerp(this.currentPushOffset, targetPush, LERP_SPEED);
    this.currentOpacity = lerp(this.currentOpacity, targetOpacity, LERP_SPEED);

    // 5. Zeichenposition
    this.pushedX = this.naturalX + dx * this.currentPushOffset;
    this.pushedY = this.naturalY + dy * this.currentPushOffset;

    // 6. Oben raus → unten neu starten
    if (this.naturalY < -this.radius) {
      this._init();
    }
  }

  /** Extrem schnelle Draw-Funktion, die nur noch stempelt */
  draw(ctx) {
    if (this.currentOpacity <= 0.01) return;

    ctx.save();

    // Nur noch Transparenz setzen...
    ctx.globalAlpha = this.currentOpacity;

    // ... und das fertige Bild stempeln!
    const offset = this.radius + (CONFIG.SHADOW_ENABLED ? 10 : 2);
    ctx.drawImage(this.cacheCanvas, this.pushedX - offset, this.pushedY - offset);

    ctx.restore();
  }
}