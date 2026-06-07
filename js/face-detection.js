// ═══════════════════════════════════════════════════════════════════
//  face-detection.js
//  100% OFFLINE VERSION
//  Kapselt die MediaPipe-Initialisierung und den Erkennungs-Loop.
//  Gibt einen geglätteten "proximity"-Wert (0–1+) zurück,
//  den der Renderer an die Blasen weitergibt.
// ═══════════════════════════════════════════════════════════════════

// 1. Lokaler Import der Engine (relativer Pfad vom js-Ordner zum assets-Ordner)
import { FaceDetector, FilesetResolver }
  from "../assets/ai/vision_bundle.mjs";

// 2. Lokale Pfade zum Modell und zum WASM-Ordner
const MODEL_URL = "../assets/ai/blaze_face_short_range.tflite";
const WASM_URL = "../assets/ai/wasm";

// Glättungsgewichte (exponentielles Moving Average)
const SMOOTH_FACE = 0.2; // Wie schnell reagiert es auf ein Gesicht
const SMOOTH_NO_FACE = 0.9; // Wie weich blendet es aus (Decay), wenn jemand weggeht

export class FaceDetection {
  constructor() {
    this._detector = null;
    this._lastVideoTime = -1;
    this.proximity = 0; // geglätteter Wert, von außen lesbar
    this._ready = false;
  }

  get isReady() { return this._ready; }

  // ── Setup ─────────────────────────────────────────────────────

  async init() {
    try {
      // Nutzt den lokalen WASM-Ordner statt des Internets
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      this._detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          // WICHTIG FÜR DEN NUC: CPU nutzen, um Hardware-Fehler unter Linux zu vermeiden!
          delegate: "CPU"
        },
        runningMode: "VIDEO",
      });
      this._ready = true;
      console.log("[FaceDetection] Offline-KI Initialisiert ✓");
    } catch (err) {
      console.error("[FaceDetection] Initialisierung fehlgeschlagen. Pfade prüfen!", err);
    }
  }

  // ── Frame-Update ──────────────────────────────────────────────

  /**
   * Einmal pro Frame aufrufen. Aktualisiert this.proximity.
   * @param {HTMLVideoElement} video
   */
  detect(video) {
    if (!this._ready || !this._detector) return;
    if (video.currentTime === this._lastVideoTime) return; // gleicher Frame, überspringen

    this._lastVideoTime = video.currentTime;

    try {
      const result = this._detector.detectForVideo(video, performance.now());

      if (result.detections.length > 0) {
        const box = result.detections[0].boundingBox;
        const faceArea = (box.width * box.height) / (video.videoWidth * video.videoHeight);

        // Exponential Moving Average: bevorzugt stabilen Wert und reduziert "Zittern"
        this.proximity = this.proximity * (1 - SMOOTH_FACE) + faceArea * SMOOTH_FACE;
      } else {
        // Sanfter Decay, wenn das Gesicht aus dem Bild verschwindet
        this.proximity *= SMOOTH_NO_FACE;
      }
    } catch (err) {
      // Fehler einzelner Frames sind harmlos (z.B. während der allerersten Initialisierung)
      console.warn("[FaceDetection] Fehler bei detectForVideo:", err);
    }
  }
}