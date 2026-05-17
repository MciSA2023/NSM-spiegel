import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');

// --- KONFIGURATION ---
const WORDS = ["Ego", "Geld", "Eifersucht", "Neid", "Stress", "Gier"];
const BUBBLE_COUNT = 300;
// Ab welcher Gesichtsgröße (in % des Bildschirms) sollen Blasen reagieren?
const PROXIMITY_THRESHOLD = 0.02; // 2% der Bildfläche
// Wie stark sollen die Blasen nach außen gedrückt werden? (Pixel)
const PUSH_FORCE = 1500;

// --- FARBVERLÄUFE (Gradients) ---
const GRADIENTS = [
  ['#FF5F6D', '#FFC371'], // Pink zu Orange
  ['#36D1DC', '#5B86E5'], // Cyan zu Blau
  ['#FF4B2B', '#FF416C'], // Rot zu Magenta
  ['#11998e', '#38ef7d'], // Dunkelgrün zu Hellgrün
  ['#8E2DE2', '#4A00E0'], // Violett zu Dunkelblau
  ['#FDC830', '#F37335'], // Gelb zu Orange
  ['#00C9FF', '#92FE9D'], // Hellblau zu Mintgrün
  ['#fc4a1a', '#f7b733'], // Kräftiges Rot zu Gelb
  ['#DA22FF', '#9733EE'], // Neon Pink zu Lila
  ['#4CB8C4', '#3CD3AD']  // Türkis zu Aqua
];
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
    this.naturalX = 0;
    this.naturalY = 0;
    this.pushedX = 0;
    this.pushedY = 0;
    this.currentPushOffset = 0;
    this.currentOpacity = 1.0;

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

    // Weise dieser Blase einen zufälligen Farbverlauf zu
    this.colorPair = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

    this.pushedX = this.naturalX;
    this.pushedY = this.naturalY;
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

    // 3. Push-Ziel und Transparenz berechnen
    let targetPushOffset = 0;
    let targetOpacity = 1.0;

    if (proximity > PROXIMITY_THRESHOLD) {
      let intensity = (proximity - PROXIMITY_THRESHOLD) * 10;
      targetPushOffset = PUSH_FORCE * Math.min(intensity, 1.0);
      targetOpacity = Math.max(0, 1.0 - (intensity * 1.5));
    }

    // 4. Sanft interpolieren (Sliden und sanftes Faden)
    this.currentPushOffset = Bubble.lerp(this.currentPushOffset, targetPushOffset, 0.05);
    this.currentOpacity = Bubble.lerp(this.currentOpacity, targetOpacity, 0.05);

    // 5. Tatsächliche Zeichen-Position berechnen
    this.pushedX = this.naturalX + (dx * this.currentPushOffset);
    this.pushedY = this.naturalY + (dy * this.currentPushOffset);

    // Wenn Blase oben rausfliegt, unten neu starten
    if (this.naturalY < -this.radius) {
      this.reset();
    }
  }

  draw(ctx) {
    if (this.currentOpacity <= 0.01) return;

    ctx.save();

    ctx.globalAlpha = this.currentOpacity * 0.85;

    // Farbverlauf für den Rand erstellen (diagonal über die Blase)
    const gradient = ctx.createLinearGradient(
      this.pushedX - this.radius, this.pushedY - this.radius,
      this.pushedX + this.radius, this.pushedY + this.radius
    );
    gradient.addColorStop(0, this.colorPair[0]);
    gradient.addColorStop(1, this.colorPair[1]);

    // Zeichne Seifenblase
    ctx.beginPath();
    ctx.arc(this.pushedX, this.pushedY, this.radius, 0, Math.PI * 2);

    // Leicht milchige, fast transparente Füllung (wie bei echten Blasen)
    ctx.fillStyle = gradient;
    ctx.fill();

    // Bunter Rand mit dem erstellten Gradienten
    ctx.lineWidth = 2; // Etwas dicker für bessere Sichtbarkeit der Farben
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.stroke();

    // Zusätzlicher weißer "Glanz"-Effekt (optional, für mehr Plastizität)
    ctx.beginPath();
    ctx.arc(this.pushedX, this.pushedY, this.radius - 2, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.stroke();

    // Zeichne Text
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${this.radius * 0.35}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.word, this.pushedX, this.pushedY);

    ctx.restore();
  }
}

const bubbles = Array.from({ length: BUBBLE_COUNT }, () => new Bubble());

// --- KI & KAMERA INITIALISIEREN ---
async function init() {
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

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        facingMode: "user"
      }
    });
    video.srcObject = stream;
    video.play();

    video.onloadeddata = () => {
      renderLoop();
    };
  } catch (err) {
    console.error("Kamerafehler: ", err);
    alert("Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.");
  }
}

// --- HAUPTSCHLEIFE ---
async function renderLoop() {
  ctx.save();
  ctx.scale(-1, 1);
  const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
  const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;

  ctx.drawImage(video, -x - (video.videoWidth * scale), y, video.videoWidth * scale, video.videoHeight * scale);
  ctx.restore();

  // Milchglas-Filter 
  let blurOpacity = Math.max(0, 0.4 - (currentProximity * 5));
  if (blurOpacity > 0.01) {
    ctx.fillStyle = `rgba(0, 0, 0, ${blurOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Gesichtserkennung durchführen
  if (video.currentTime !== lastVideoTime && faceDetector) {
    lastVideoTime = video.currentTime;
    const detections = faceDetector.detectForVideo(video, performance.now()).detections;

    if (detections.length > 0) {
      const face = detections[0].boundingBox;
      const faceArea = (face.width * face.height) / (video.videoWidth * video.videoHeight);
      currentProximity = currentProximity * 0.8 + faceArea * 0.2;
    } else {
      currentProximity = currentProximity * 0.9;
    }
  }

  // Seifenblasen updaten und zeichnen
  bubbles.forEach(bubble => {
    bubble.update(currentProximity);
    bubble.draw(ctx);
  });

  requestAnimationFrame(renderLoop);
}

init();