// ═══════════════════════════════════════════════════════════════════
//  bubble.js
//  Die Bubble-Klasse ist vollständig in sich geschlossen.
//  Sie liest CONFIG zur Laufzeit – keine eigenen Kopien der Werte.
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
    this.pushedX  = 0;
    this.pushedY  = 0;
    this.currentPushOffset = 0;
    this.currentOpacity    = 1.0;

    this._init();

    if (initialY !== null) {
      this.naturalY = initialY;
      this.pushedY  = initialY;
    }
  }

  /** Werte für eine neue (oder zurückgesetzte) Blase */
  _init() {
    const { RADIUS_MIN, RADIUS_MAX, SPEED_MULT, WORDS } = CONFIG;

    this.radius = Math.random() * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN;
    this.naturalX = Math.random() * this.canvas.width;
    this.naturalY = this.canvas.height + this.radius; // starte unten
    this.speed    = (Math.random() * 1.5 + 0.5) * (SPEED_MULT / 2);
    this.wobble   = Math.random() * Math.PI * 2;
    this.word     = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.colorPair = this._randomColor();

    this.pushedX  = this.naturalX;
    this.pushedY  = this.naturalY;
  }

  _randomColor() {
    const grads = activeGradients();
    return grads[Math.floor(Math.random() * grads.length)];
  }

  /** Wird aufgerufen wenn Farbthema oder Wörter wechseln – ohne Neustart */
  refreshAppearance() {
    const { WORDS } = CONFIG;
    this.word      = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.colorPair = this._randomColor();
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
    this.wobble   += 0.02;

    // 2. Richtungsvektor von Bildmitte weg
    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 2;
    const vx = this.naturalX - cx;
    const vy = this.naturalY - cy;
    const dist = Math.sqrt(vx * vx + vy * vy);
    const dx = dist > 1 ? vx / dist : 0;
    const dy = dist > 1 ? vy / dist : -1;

    // 3. Push-Ziel und Opazität
    let targetPush    = 0;
    let targetOpacity = 1.0;
    if (proximity > PROXIMITY_THRESHOLD) {
      const intensity  = Math.min((proximity - PROXIMITY_THRESHOLD) * 10, 1.0);
      targetPush       = PUSH_FORCE * intensity;
      targetOpacity    = Math.max(0, 1.0 - intensity * FADE_INTENSITY);
    }

    // 4. Sanft interpolieren
    this.currentPushOffset = lerp(this.currentPushOffset, targetPush,    LERP_SPEED);
    this.currentOpacity    = lerp(this.currentOpacity,    targetOpacity, LERP_SPEED);

    // 5. Zeichenposition
    this.pushedX = this.naturalX + dx * this.currentPushOffset;
    this.pushedY = this.naturalY + dy * this.currentPushOffset;

    // 6. Oben raus → unten neu starten
    if (this.naturalY < -this.radius) {
      this._init();
    }
  }

  /** Blase auf Canvas zeichnen */
  draw(ctx) {
    const { FILL_OPACITY, FONT_SIZE_RATIO, SHADOW_ENABLED, GLOSS_ENABLED } = CONFIG;
    if (this.currentOpacity <= 0.01) return;

    const { pushedX: x, pushedY: y, radius: r } = this;

    ctx.save();

    // Farbverlauf
    const gradient = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    gradient.addColorStop(0, this.colorPair[0]);
    gradient.addColorStop(1, this.colorPair[1]);

    // Füllung (halbtransparent)
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.globalAlpha = this.currentOpacity * FILL_OPACITY;
    ctx.fillStyle   = gradient;
    ctx.fill();

    // Äußerer Rand
    ctx.globalAlpha  = this.currentOpacity * 0.9;
    ctx.lineWidth    = 2;
    ctx.strokeStyle  = "rgba(255,255,255,0.6)";
    ctx.stroke();

    // Glanzeffekt (optional)
    if (GLOSS_ENABLED) {
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.lineWidth   = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.stroke();
    }

    // Text
    ctx.globalAlpha = this.currentOpacity;
    if (SHADOW_ENABLED) {
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur  = 4;
    }
    ctx.fillStyle    = "#ffffff";
    ctx.font         = `bold ${r * FONT_SIZE_RATIO}px 'Syne', Arial`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, x, y);

    ctx.restore();
  }
}
