// ═══════════════════════════════════════════════════════════════════
//  main.js
//  Einstiegspunkt – verbindet alle Module.
//  Hier gibt es keine Logik, nur Initialisierung und Verdrahtung.
// ═══════════════════════════════════════════════════════════════════

import { initSettingsPanel, panelEvents } from "./settings-panel.js";
import { BubbleManager } from "./bubble-manager.js";
import { FaceDetection } from "./face-detection.js";
import { Camera } from "./camera.js";
import { Renderer } from "./renderer.js";

async function main() {
  await document.fonts.ready;
  console.log("[main] Schriftart 'RobotoCondensed' ist geladen.");
  // ── DOM-Elemente ──────────────────────────────────────────────
  const canvas = document.getElementById("output_canvas");
  const video = document.getElementById("webcam");

  // ── Module initialisieren ─────────────────────────────────────
  initSettingsPanel();

  const bubbleManager = new BubbleManager(canvas);
  const faceDetection = new FaceDetection();
  const camera = new Camera(video);
  const renderer = new Renderer(canvas, video, bubbleManager, faceDetection);

  // ── Idle & Overlay Manager (Attract Mode) ───────────────────────
  const overlay = document.getElementById("intro_overlay");

  if (overlay) {
    let idleSeconds = 0;
    const IDLE_LIMIT = 5; // Nach 5 Sekunden ohne Gesicht kommt das Overlay

    // Ein extrem sparsamer Timer, der nur 1x pro Sekunde tickt
    setInterval(() => {
      // Wir nutzen die geglättete Proximity aus deiner FaceDetection.
      // Wenn der Wert fast bei 0 ist, werten wir das als "niemand da".
      if (faceDetection.proximity < 0.01) {
        idleSeconds++;
      } else {
        // Gesicht erkannt! Timer sofort auf 0 setzen...
        idleSeconds = 0;
        // ...und Overlay weich ausblenden (falls es noch da ist)
        overlay.classList.add("hidden");
      }

      // Wenn das Limit erreicht ist, Overlay wieder weich einblenden
      if (idleSeconds >= IDLE_LIMIT) {
        overlay.classList.remove("hidden");
      }
    }, 1000); // 1000 Millisekunden = 1 Sekunde
  }

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
