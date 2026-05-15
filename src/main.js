import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');

// --- KONFIGURATION ---
const WORDS = ["Ego", "Geld", "Eifersucht", "Neid", "Stress", "Gier"];
const BUBBLE_COUNT = 30;
// Ab welcher Gesichtsgröße (in % des Bildschirms) sollen Blasen platzen/verschwinden?
const PROXIMITY_THRESHOLD = 0.04; // 4% der Bildfläche
// ---------------------

let faceDetector;
let lastVideoTime = -1;
let currentProximity = 0; // Wie nah ist die Person (0.0 bis 1.0+)

// Passe Canvas an Fenstergröße an
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- SEIFENBLASEN KLASSE ---
class Bubble {
  constructor() {
    this.reset();
    this.y = Math.random() * canvas.height; // Beim Start zufällig verteilen
  }

  reset() {
    this.radius = Math.random() * 40 + 30;
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + this.radius; // Starte unten
    this.speed = Math.random() * 1.5 + 0.5;
    this.wobble = Math.random() * Math.PI * 2;
    this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.opacity = 1.0;
  }

  update(proximity) {
    // Bewegung nach oben mit leichtem Schwanken
    this.y -= this.speed;
    this.x += Math.sin(this.wobble) * 0.5;
    this.wobble += 0.02;

    // Logik für Nähe: Wenn Person nah ist, verblasst die Blase
    if (proximity > PROXIMITY_THRESHOLD) {
      this.opacity -= 0.05; // Schnelles Verblassen
    } else {
      this.opacity += 0.01; // Langsames Zurückkommen
    }

    // Grenzen der Deckkraft (0 bis 1)
    this.opacity = Math.max(0, Math.min(1, this.opacity));

    // Wenn Blase oben rausfliegt, unten neu starten
    if (this.y < -this.radius && this.opacity > 0) {
      this.reset();
    }
  }

  draw(ctx) {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Zeichne Seifenblase (simplifizierte Version)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; // Halbtransparente Füllung
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Hellerer Rand
    ctx.stroke();

    // Zeichne Text (Die "negativen" Eigenschaften)
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = `${this.radius * 0.4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, this.x, this.y);

    ctx.restore();
  }
}

const bubbles = Array.from({ length: BUBBLE_COUNT }, () => new Bubble());

// --- KI & KAMERA INITIALISIEREN ---
async function init() {
  // 1. MediaPipe Modell laden
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU"
    },
    runningMode: "VIDEO"
  });

  // 2. Webcam starten
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1920, height: 1080, facingMode: "user" }
    });
    video.srcObject = stream;
    video.play();

    // Starte den Render-Loop, sobald das Video läuft
    video.onloadeddata = () => {
      renderLoop();
    };
  } catch (err) {
    console.error("Kamerafehler: ", err);
    alert("Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.");
  }
}

// --- HAUPTSCHLEIFE (Läuft 60x pro Sekunde) ---
async function renderLoop() {
  // 1. Video horizontal spiegeln und auf Canvas zeichnen
  ctx.save();
  ctx.scale(-1, 1); // Flip X-Achse
  // Das Bild wird zentriert gezeichnet (wichtig für Kiosk-Monitore, die nicht 16:9 sind)
  const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
  const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;

  // Wegen dem Scale(-1) müssen wir die X-Koordinate beim Zeichnen anpassen
  ctx.drawImage(video, -x - (video.videoWidth * scale), y, video.videoWidth * scale, video.videoHeight * scale);
  ctx.restore();

  // Milchglas-Filter (Optional: Nur stark, wenn keine Person nah ist)
  if (currentProximity < PROXIMITY_THRESHOLD) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; // Dunkelt den Spiegel ab, rückt Blasen in Fokus
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Gesichtserkennung durchführen
  if (video.currentTime !== lastVideoTime && faceDetector) {
    lastVideoTime = video.currentTime;
    const detections = faceDetector.detectForVideo(video, performance.now()).detections;

    if (detections.length > 0) {
      // Wir nehmen das erste erkannte Gesicht
      const face = detections[0].boundingBox;
      // Berechne den Flächenanteil des Gesichts im Verhältnis zum Videobild
      const faceArea = (face.width * face.height) / (video.videoWidth * video.videoHeight);

      // Glätte den Wert etwas, damit es nicht so stark flackert
      currentProximity = currentProximity * 0.8 + faceArea * 0.2;
    } else {
      // Niemand im Bild
      currentProximity = currentProximity * 0.9; // Langsam zurücksetzen
    }
  }

  // 3. Seifenblasen updaten und zeichnen
  bubbles.forEach(bubble => {
    bubble.update(currentProximity);
    bubble.draw(ctx);
  });

  // Nächster Frame
  requestAnimationFrame(renderLoop);
}

// Startschuss
init();