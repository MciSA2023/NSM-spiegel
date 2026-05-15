import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');

// --- KONFIGURATION ---
const WORDS = ["Ego", "Geld", "Eifersucht", "Neid", "Stress", "Gier"];
const BUBBLE_COUNT = 300;
// Ab welcher Gesichtsgröße (in % des Bildschirms) sollen Blasen gedrückt werden?
const PROXIMITY_THRESHOLD = 0.02; // 2% der Bildfläche
// Wie stark sollen die Blasen nach außen gedrückt werden? (Pixel)
const PUSH_FORCE = 1500;
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

// --- SEIFENBLASEN KLASSE (Mit Push-Physik) ---
class Bubble {
  constructor() {
    this.naturalX = 0;
    this.naturalY = 0;
    this.pushedX = 0;
    this.pushedY = 0;
    this.currentPushOffset = 0;

    this.reset();
    // Beim Start zufällig verteilen
    this.naturalY = Math.random() * canvas.height;
    this.pushedY = this.naturalY;
  }

  reset() {
    this.radius = Math.random() * 40 + 30;
    this.naturalX = Math.random() * canvas.width;
    this.naturalY = canvas.height + this.radius; // Starte unten
    this.speed = Math.random() * 1.5 + 0.5;
    this.wobble = Math.random() * Math.PI * 2;
    this.word = WORDS[Math.floor(Math.random() * WORDS.length)];

    this.pushedX = this.naturalX;
    this.pushedY = this.naturalY;
    // Wir belassen currentPushOffset unangetastet für fließende Übergänge beim Reset
  }

  // Hilfsfunktion für weiche Übergänge
  static lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }

  update(proximity) {
    // 1. Normale, natürliche Bewegung nach oben
    this.naturalY -= this.speed;
    this.naturalX += Math.sin(this.wobble) * 0.5;
    this.wobble += 0.02;

    // 2. Richtung berechnen (Von der Mitte weg)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let vectorX = this.naturalX - centerX;
    let vectorY = this.naturalY - centerY;
    const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);

    // Richtungsvektor normalisieren
    let dx = 0, dy = 0;
    if (distance > 1) {
      dx = vectorX / distance;
      dy = vectorY / distance;
    } else {
      dy = -1; // Fallback, falls genau in der Mitte
    }

    // 3. Push-Ziel berechnen
    let targetPushOffset = 0;
    if (proximity > PROXIMITY_THRESHOLD) {
      // Je näher die Person (über dem Schwellenwert), desto stärker der Druck
      // Wir multiplizieren mit 10, um die kleinen Proximity-Werte der Gesichtserkennung nutzbar zu machen
      let intensity = (proximity - PROXIMITY_THRESHOLD) * 10;
      targetPushOffset = PUSH_FORCE * Math.min(intensity, 1.0);
    }

    // 4. Sanft interpolieren (Damit sie nicht springen, sondern sliden)
    this.currentPushOffset = Bubble.lerp(this.currentPushOffset, targetPushOffset, 0.05);

    // 5. Tatsächliche Zeichen-Position berechnen
    this.pushedX = this.naturalX + (dx * this.currentPushOffset);
    this.pushedY = this.naturalY + (dy * this.currentPushOffset);

    // Wenn Blase oben rausfliegt, unten neu starten
    if (this.naturalY < -this.radius) {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.save();

    // Die Blasen verblassen nicht mehr, sie bleiben konstant sichtbar
    ctx.globalAlpha = 1.0;

    // Zeichne Seifenblase an der GEPUSHTEN Position
    ctx.beginPath();
    ctx.arc(this.pushedX, this.pushedY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; // Halbtransparente Füllung
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Hellerer Rand
    ctx.stroke();

    // Zeichne Text
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = `${this.radius * 0.4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, this.pushedX, this.pushedY);

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

  // Milchglas-Filter (Wird schwächer, je näher die Person kommt)
  let blurOpacity = Math.max(0, 0.4 - (currentProximity * 5));
  if (blurOpacity > 0.01) {
    ctx.fillStyle = `rgba(0, 0, 0, ${blurOpacity})`;
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