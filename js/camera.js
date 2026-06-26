// ═══════════════════════════════════════════════════════════════════
//  camera.js
//  Kamera-Initialisierung: getUserMedia und Video-Element.
//  Optimiert auf maximale Framerate und flüssige HD-Performance.
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
   * Startet die Kamera im optimalen Leistungsbereich (Full-HD mit hoher FPS).
   * @returns {Promise<void>}
   */
  async start() {
    // 1080p ist der "Sweet Spot": Gestochen scharf auf dem Canvas,
    // aber schont die CPU, damit die Blasen und die KI flüssig laufen.
    const constraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // Wir fordern explizit eine hohe Framerate an!
        frameRate: { ideal: 30, max: 60 },
        facingMode: "user"
      },
      audio: false
    };

    try {
      console.log("[Camera] Fordere optimierten HD-Stream an...");
      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this._stream;
      
      // Verhindert Ruckeln: Sagt dem Browser, das Video so direkt wie möglich abzuspielen
      this.video.setAttribute("playsinline", true);
      this.video.muted = true; 

      await this.video.play();
      
      const settings = this._stream.getVideoTracks()[0].getSettings();
      console.log(`[Camera] Stream läuft flüssig: ${settings.width}x${settings.height} @ ${settings.frameRate || 30} FPS ✓`);
    } catch (err) {
      console.error("[Camera] Fehler beim Starten des optimierten Streams:", err);
      throw err;
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
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
      console.log("[Camera] Stream gestoppt");
    }
  }
}