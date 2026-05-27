// ═══════════════════════════════════════════════════════════════════
//  renderer.js
//  Verwaltet Canvas, Kamerabild und die Hauptschleife.
//  Kennt weder Bubble-Details noch Settings – es ruft nur die
//  öffentlichen APIs der anderen Module auf.
// ═══════════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLVideoElement}  video
   * @param {BubbleManager}     bubbleManager
   * @param {FaceDetection}     faceDetection
   */
  constructor(canvas, video, bubbleManager, faceDetection) {
    this.canvas        = canvas;
    this.ctx           = canvas.getContext("2d");
    this.video         = video;
    this.bubbleManager = bubbleManager;
    this.faceDetection = faceDetection;
    this._running      = false;
    this._rafId        = null;

    this._bindResize();
  }

  // ── Lebenszyklus ─────────────────────────────────────────────

  start() {
    if (this._running) return;
    this._running = true;
    this._loop();
    console.log("[Renderer] Schleife gestartet ✓");
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    console.log("[Renderer] Schleife gestoppt");
  }

  // ── Privat: Rendering ─────────────────────────────────────────

  _loop() {
    if (!this._running) return;

    this._drawBackground();
    this.faceDetection.detect(this.video);
    this.bubbleManager.update(this.ctx, this.faceDetection.proximity);

    this._rafId = requestAnimationFrame(() => this._loop());
  }

  _drawBackground() {
    const { canvas, ctx, video } = this;

    if (CONFIG.CAMERA_ENABLED && video.readyState >= 2) {
      // Gespiegeltes Kamerabild (Self-View)
      ctx.save();
      ctx.scale(-1, 1);
      const scale = Math.max(
        canvas.width  / video.videoWidth,
        canvas.height / video.videoHeight,
      );
      const x = (canvas.width  / 2) - (video.videoWidth  / 2) * scale;
      const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
      ctx.drawImage(
        video,
        -x - video.videoWidth * scale, y,
        video.videoWidth * scale,
        video.videoHeight * scale,
      );
      ctx.restore();

      // Abdunklungs-Overlay: nimmt ab wenn Person sehr nah ist
      const blurOpacity = Math.max(
        0,
        CONFIG.BLUR_OPACITY_MAX - this.faceDetection.proximity * 5,
      );
      if (blurOpacity > 0.01) {
        ctx.fillStyle = `rgba(0,0,0,${blurOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      // Kein Feed → schwarzer Hintergrund
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── Canvas-Resize ─────────────────────────────────────────────

  _bindResize() {
    const resize = () => {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.bubbleManager.rebuild();
    };
    window.addEventListener("resize", resize);
    resize(); // Initial
  }
}
