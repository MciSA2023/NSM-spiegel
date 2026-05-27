// ═══════════════════════════════════════════════════════════════════
//  main.js
//  Einstiegspunkt – verbindet alle Module.
//  Hier gibt es keine Logik, nur Initialisierung und Verdrahtung.
// ═══════════════════════════════════════════════════════════════════

import { initSettingsPanel, panelEvents } from "./settings-panel.js";
import { BubbleManager }                  from "./bubble-manager.js";
import { FaceDetection }                  from "./face-detection.js";
import { Camera }                         from "./camera.js";
import { Renderer }                       from "./renderer.js";

async function main() {
  // ── DOM-Elemente ──────────────────────────────────────────────
  const canvas = document.getElementById("output_canvas");
  const video  = document.getElementById("webcam");

  // ── Module initialisieren ─────────────────────────────────────
  initSettingsPanel();

  const bubbleManager = new BubbleManager(canvas);
  const faceDetection = new FaceDetection();
  const camera        = new Camera(video);
  const renderer      = new Renderer(canvas, video, bubbleManager, faceDetection);

  // ── KI laden ──────────────────────────────────────────────────
  await faceDetection.init();

  // ── Kamera starten ───────────────────────────────────────────
  try {
    await camera.start();
    await camera.waitForData();
  } catch (err) {
    console.warn("[main] Kamera nicht verfügbar – fahre ohne fort.");
  }

  // ── Renderer starten ─────────────────────────────────────────
  renderer.start();

  // ── Settings-Events verdrahten ────────────────────────────────
  // "apply"  → Blasen-Pool anpassen und Erscheinungsbild aktualisieren
  panelEvents.on("apply", () => {
    bubbleManager.resize();
    bubbleManager.refreshAppearance();
    console.log("[main] Einstellungen übernommen");
  });

  // "reset"  → Pool komplett neu aufbauen
  panelEvents.on("reset", () => {
    bubbleManager.rebuild();
    console.log("[main] Reset durchgeführt");
  });

  console.log("[main] Alles bereit ✓");
}

main().catch(err => console.error("[main] Kritischer Fehler:", err));
