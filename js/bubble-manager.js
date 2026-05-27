// ═══════════════════════════════════════════════════════════════════
//  bubble-manager.js
//  Verwaltet den Blasen-Pool: Erzeugen, Größe anpassen, Zeichnen.
//  Trennt Pool-Logik sauber von der Bubble-Klasse und dem Renderer.
// ═══════════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";
import { Bubble }  from "./bubble.js";

export class BubbleManager {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas  = canvas;
    this.bubbles = [];
    this._fill(CONFIG.BUBBLE_COUNT, true /* scatter vertically */);
  }

  // ── Pool-Größe ────────────────────────────────────────────────

  /** Pool auf CONFIG.BUBBLE_COUNT anpassen (hinzufügen oder entfernen) */
  resize() {
    const target = CONFIG.BUBBLE_COUNT;
    const current = this.bubbles.length;

    if (target > current) {
      // Neue Blasen zufällig auf dem Screen verteilen
      for (let i = current; i < target; i++) {
        const y = Math.random() * this.canvas.height;
        this.bubbles.push(new Bubble(this.canvas, y));
      }
    } else if (target < current) {
      this.bubbles.splice(target);
    }
  }

  /** Alle Blasen neu erstellen (z.B. nach Canvas-Resize) */
  rebuild() {
    this.bubbles = [];
    this._fill(CONFIG.BUBBLE_COUNT, true);
  }

  // ── Erscheinungsbild ──────────────────────────────────────────

  /** Wörter und Farben aller Blasen sofort aktualisieren */
  refreshAppearance() {
    this.bubbles.forEach(b => b.refreshAppearance());
  }

  // ── Frame-Update ──────────────────────────────────────────────

  /**
   * Physik und Zeichnen pro Frame
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} proximity
   */
  update(ctx, proximity) {
    this.bubbles.forEach(b => {
      b.update(proximity);
      b.draw(ctx);
    });
  }

  // ── Privat ───────────────────────────────────────────────────

  _fill(count, scatter = false) {
    for (let i = 0; i < count; i++) {
      const y = scatter ? Math.random() * this.canvas.height : null;
      this.bubbles.push(new Bubble(this.canvas, y));
    }
  }
}
