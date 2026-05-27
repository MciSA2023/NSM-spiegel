// ═══════════════════════════════════════════════════════════════════
//  face-detection.js
//  Kapselt die MediaPipe-Initialisierung und den Erkennungs-Loop.
//  Gibt einen geglätteten "proximity"-Wert (0–1+) zurück,
//  den der Renderer an die Blasen weitergibt.
// ═══════════════════════════════════════════════════════════════════

import { FaceDetector, FilesetResolver }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// Glättungsgewichte (exponentielles Moving Average)
const SMOOTH_FACE    = 0.2; // Neue Messung
const SMOOTH_NO_FACE = 0.9; // Decay wenn kein Gesicht

export class FaceDetection {
  constructor() {
    this._detector      = null;
    this._lastVideoTime = -1;
    this.proximity      = 0; // geglätteter Wert, außen lesbar
    this._ready         = false;
  }

  get isReady() { return this._ready; }

  // ── Setup ─────────────────────────────────────────────────────

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      this._detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
      });
      this._ready = true;
      console.log("[FaceDetection] Initialisiert ✓");
    } catch (err) {
      console.error("[FaceDetection] Initialisierung fehlgeschlagen:", err);
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
        const box      = result.detections[0].boundingBox;
        const faceArea = (box.width * box.height) / (video.videoWidth * video.videoHeight);
        // Exponential Moving Average: bevorzugt stabilen Wert
        this.proximity = this.proximity * (1 - SMOOTH_FACE) + faceArea * SMOOTH_FACE;
      } else {
        this.proximity *= SMOOTH_NO_FACE; // Sanfter Decay
      }
    } catch (err) {
      // Fehler einzelner Frames sind harmlos (z.B. während Initialisierung)
      console.warn("[FaceDetection] Fehler bei detectForVideo:", err);
    }
  }
}
