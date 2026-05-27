// ═══════════════════════════════════════════════════════════════════
//  camera.js
//  Kamera-Initialisierung: getUserMedia und Video-Element.
//  Getrennt vom Renderer damit man den Stream leicht tauschen kann.
// ═══════════════════════════════════════════════════════════════════

export class Camera {
  /**
   * @param {HTMLVideoElement} videoEl
   */
  constructor(videoEl) {
    this.video  = videoEl;
    this._stream = null;
  }

  // ── Setup ─────────────────────────────────────────────────────

  /**
   * Kamera starten.
   * @returns {Promise<void>}
   */
  async start() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 1080 },
          height:     { ideal: 1920 },
          facingMode: "user",
        },
      });
      this.video.srcObject = this._stream;
      await this.video.play();
      console.log("[Camera] Stream aktiv ✓");
    } catch (err) {
      console.error("[Camera] Kein Zugriff:", err);
      throw err; // weitergeben damit main.js reagieren kann
    }
  }

  /** Warten bis erste Frames da sind */
  waitForData() {
    return new Promise((resolve) => {
      if (this.video.readyState >= 2) { resolve(); return; }
      this.video.addEventListener("loadeddata", resolve, { once: true });
    });
  }

  stop() {
    this._stream?.getTracks().forEach(t => t.stop());
    console.log("[Camera] Stream gestoppt");
  }
}
