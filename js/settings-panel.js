// ═══════════════════════════════════════════════════════════════════
//  settings-panel.js
//  Das versteckte Einstellungs-Panel.
//  – Öffnet sich wenn Maus in die rechte obere Ecke geht
//  – Mutiert nur CONFIG, nie Bubble/Renderer direkt
//  – Gibt Events über einen einfachen EventBus weiter
// ═══════════════════════════════════════════════════════════════════

import { CONFIG, DEFAULTS, GRADIENT_SETS, PREDEFINED_WORDS } from "./config.js";

// ── Tiny EventBus ─────────────────────────────────────────────────
class EventBus {
  constructor() { this._listeners = {}; }
  on(event, fn) { (this._listeners[event] ??= []).push(fn); }
  emit(event, data) { (this._listeners[event] ?? []).forEach(fn => fn(data)); }
}

export const panelEvents = new EventBus();
// Emittierte Events:
//   "apply"  – Nutzer klickt „Anwenden" → BubbleManager soll resize/refresh
//   "reset"  – Nutzer klickt „↺ Reset"

// ═══════════════════════════════════════════════════════════════════
//  HTML injizieren
// ═══════════════════════════════════════════════════════════════════
function injectHTML() {
  document.body.insertAdjacentHTML("beforeend", /* html */`

  <!-- Trigger-Zone (unsichtbar, rechte obere Ecke) -->
  <div id="sp-hot-zone"></div>

  <!-- Subtiler Ecken-Indikator -->
  <div id="sp-hint">
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2H10V4M10 2L6.5 5.5M4 10H2V8M2 10L5.5 6.5"
            stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>

  <!-- Panel -->
  <div id="sp-panel" role="dialog" aria-label="Einstellungen">
    <button id="sp-close" title="Schließen" aria-label="Schließen">
      <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L9 9M9 1L1 9" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="sp-header">
      <div class="sp-eyebrow">Ausstellungsmodus</div>
      <div class="sp-title">Einstellungen</div>
      <div class="sp-status">
        <span class="sp-dot"></span> Kamera aktiv
      </div>
    </div>

    <div class="sp-scroll">

      <!-- ── Blasen ── -->
      <div class="sp-section">
        <div class="sp-section-label">Seifenblasen</div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Anzahl</span>
            <span id="sp-val-count">700</span>
          </div>
          <input type="range" id="sp-count" min="50" max="1500" step="10" value="700">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Min. Radius</span>
            <span id="sp-val-rmin">30 px</span>
          </div>
          <input type="range" id="sp-rmin" min="10" max="80" step="1" value="30">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Max. Radius</span>
            <span id="sp-val-rmax">70 px</span>
          </div>
          <input type="range" id="sp-rmax" min="20" max="160" step="1" value="70">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Aufstiegsgeschwindigkeit</span>
            <span id="sp-val-speed">2.0×</span>
          </div>
          <input type="range" id="sp-speed" min="0.2" max="5.0" step="0.1" value="2.0">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Taumelbewegung</span>
            <span id="sp-val-wobble">0.50</span>
          </div>
          <input type="range" id="sp-wobble" min="0" max="3" step="0.05" value="0.5">
        </div>
      </div>

      <!-- ── Nähereaktion ── -->
      <div class="sp-section">
        <div class="sp-section-label">Nähereaktion</div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Auslöseschwelle</span>
            <span id="sp-val-threshold">2.0%</span>
          </div>
          <input type="range" id="sp-threshold" min="0.5" max="15" step="0.5" value="2">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Druckkraft (Push)</span>
            <span id="sp-val-push">1500 px</span>
          </div>
          <input type="range" id="sp-push" min="200" max="4000" step="50" value="1500">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Reaktionsgeschwindigkeit</span>
            <span id="sp-val-lerp">0.05</span>
          </div>
          <input type="range" id="sp-lerp" min="0.01" max="0.3" step="0.01" value="0.05">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Verblassungsintensität</span>
            <span id="sp-val-fade">1.5×</span>
          </div>
          <input type="range" id="sp-fade" min="0.1" max="5" step="0.1" value="1.5">
        </div>
      </div>

      <!-- ── Darstellung ── -->
      <div class="sp-section">
        <div class="sp-section-label">Darstellung</div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Kamera-Abdunklung</span>
            <span id="sp-val-blur">0.40</span>
          </div>
          <input type="range" id="sp-blur" min="0" max="1" step="0.01" value="0.40">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Blasen-Deckkraft</span>
            <span id="sp-val-fill">40%</span>
          </div>
          <input type="range" id="sp-fill" min="5" max="100" step="1" value="40">
        </div>

        <div class="sp-control">
          <div class="sp-ctrl-header">
            <span>Schriftgröße</span>
            <span id="sp-val-font">0.35×</span>
          </div>
          <input type="range" id="sp-font" min="0.1" max="0.7" step="0.01" value="0.35">
        </div>

        <div class="sp-toggle-row">
          <span>Textschatten</span>
          <div class="sp-toggle on" id="sp-tog-shadow" data-key="SHADOW_ENABLED"></div>
        </div>
        <div class="sp-toggle-row">
          <span>Kamerabild anzeigen</span>
          <div class="sp-toggle on" id="sp-tog-camera" data-key="CAMERA_ENABLED"></div>
        </div>
        <div class="sp-toggle-row">
          <span>Glanzeffekt</span>
          <div class="sp-toggle on" id="sp-tog-gloss" data-key="GLOSS_ENABLED"></div>
        </div>
      </div>

      <!-- ── Farbthemen ── -->
      <div class="sp-section">
        <div class="sp-section-label">Farbthema</div>
        <div class="sp-presets" id="sp-presets"></div>
      </div>

      <!-- ── Wörter ── -->
      <div class="sp-section">
        <div class="sp-section-label">Wörter</div>

        <div class="sp-hint-text">
          Vordefinierte Wörter (immer aktiv)
        </div>
        <div class="sp-tags" id="sp-predefined-tags"></div>

        <div class="sp-hint-text" style="margin-top:14px">
          Eigene Wörter hinzufügen (kommagetrennt)
        </div>
        <textarea id="sp-extra-words"
          placeholder="z.B. NEID, ZWEIFEL, SCHAM …"
          spellcheck="false"></textarea>

        <div class="sp-hint-text" style="margin-top:8px; color:rgba(255,255,255,0.2)">
          Eigene Wörter werden zu den vordefinierten ergänzt, nicht ersetzt.
        </div>
      </div>

      <!-- Buttons -->
      <div class="sp-btn-row">
        <button class="sp-btn sp-btn-ghost" id="sp-reset">↺ Reset</button>
        <button class="sp-btn sp-btn-primary" id="sp-apply">Anwenden</button>
      </div>

    </div><!-- /sp-scroll -->
  </div><!-- /sp-panel -->
  `);
}

// ═══════════════════════════════════════════════════════════════════
//  CSS injizieren
// ═══════════════════════════════════════════════════════════════════
function injectCSS() {
  const style = document.createElement("style");
  style.textContent = /* css */`
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;700;800&display=swap');

    #sp-hot-zone {
      position: fixed; top: 0; right: 0;
      width: 80px; height: 80px;
      z-index: 900;
    }

    /* Panel und alle Kinder bekommen ihren Cursor zurück –
       body hat cursor:none für die Installation, das Panel nicht */
    #sp-panel, #sp-panel * {
      cursor: default;
    }
    #sp-panel input[type=range],
    #sp-panel .sp-toggle,
    #sp-panel .sp-preset,
    #sp-panel .sp-btn,
    #sp-panel #sp-close {
      cursor: pointer;
    }
    #sp-panel textarea,
    #sp-panel input[type=text] {
      cursor: text;
    }

    #sp-hint {
      position: fixed; top: 12px; right: 12px;
      width: 28px; height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      z-index: 901;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    #sp-hint.visible { opacity: 1; }
    #sp-hint svg { width: 12px; height: 12px; opacity: 0.5; }

    #sp-panel {
      position: fixed; top: 0; right: 0;
      width: 340px; height: 100vh;
      background: rgba(8,8,12,0.93);
      backdrop-filter: blur(24px) saturate(160%);
      border-left: 1px solid rgba(255,255,255,0.07);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
      display: flex; flex-direction: column;
      font-family: 'DM Mono', monospace;
      overflow: hidden;
    }
    #sp-panel.open { transform: translateX(0); }

    /* Glow-Rand */
    #sp-panel::before {
      content: '';
      position: absolute; inset: 0 auto 0 0;
      width: 1px;
      background: linear-gradient(to bottom,
        transparent 0%, rgba(120,180,255,0.4) 30%,
        rgba(200,120,255,0.4) 70%, transparent 100%);
      pointer-events: none;
    }

    .sp-header {
      padding: 28px 24px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .sp-eyebrow {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: 10px; letter-spacing: 0.22em;
      text-transform: uppercase; color: rgba(255,255,255,0.3);
      margin-bottom: 4px;
    }
    .sp-title {
      font-family: 'Syne', sans-serif; font-weight: 700;
      font-size: 18px; color: #fff;
    }
    .sp-status {
      display: flex; align-items: center;
      font-size: 10px; color: rgba(255,255,255,0.28);
      margin-top: 6px;
    }
    .sp-dot {
      display: inline-block; width: 6px; height: 6px;
      border-radius: 50%; background: #4ade80;
      box-shadow: 0 0 6px #4ade80; margin-right: 6px;
      animation: sp-pulse 2s infinite;
    }
    @keyframes sp-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

    #sp-close {
      position: absolute; top: 24px; right: 20px;
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    #sp-close:hover { background: rgba(255,255,255,0.13); }
    #sp-close svg { width: 10px; height: 10px; opacity: 0.6; }

    .sp-scroll {
      flex: 1; overflow-y: auto;
      padding: 20px 24px 28px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .sp-scroll::-webkit-scrollbar { width: 4px; }
    .sp-scroll::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1); border-radius: 4px;
    }

    .sp-section { margin-bottom: 28px; }
    .sp-section-label {
      font-size: 9px; letter-spacing: 0.2em;
      text-transform: uppercase; color: rgba(255,255,255,0.22);
      padding-bottom: 8px; margin-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .sp-control { margin-bottom: 16px; }
    .sp-ctrl-header {
      display: flex; justify-content: space-between;
      align-items: baseline; margin-bottom: 7px;
      font-size: 11px; color: rgba(255,255,255,0.72);
      letter-spacing: 0.03em;
    }
    .sp-ctrl-header span:last-child {
      color: rgba(255,255,255,0.35);
      font-variant-numeric: tabular-nums;
    }

    input[type=range] {
      -webkit-appearance: none; width: 100%;
      height: 2px; background: rgba(255,255,255,0.1);
      border-radius: 2px; outline: none; cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      border-radius: 50%; background: #fff;
      box-shadow: 0 0 0 3px rgba(255,255,255,0.1);
      transition: box-shadow 0.2s, transform 0.15s;
    }
    input[type=range]:hover::-webkit-slider-thumb {
      box-shadow: 0 0 0 5px rgba(255,255,255,0.18);
      transform: scale(1.15);
    }

    .sp-toggle-row {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 13px;
      font-size: 11px; color: rgba(255,255,255,0.72);
      letter-spacing: 0.03em;
    }
    .sp-toggle {
      width: 36px; height: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px; position: relative;
      cursor: pointer; transition: background 0.25s;
      flex-shrink: 0;
    }
    .sp-toggle.on { background: rgba(120,200,255,0.55); }
    .sp-toggle::after {
      content: ''; position: absolute;
      width: 14px; height: 14px; background: #fff;
      border-radius: 50%; top: 3px; left: 3px;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .sp-toggle.on::after { transform: translateX(16px); }

    .sp-presets { display: flex; gap: 9px; flex-wrap: wrap; }
    .sp-preset {
      width: 30px; height: 30px; border-radius: 50%;
      cursor: pointer; border: 2px solid transparent;
      transition: transform 0.2s, border-color 0.2s;
    }
    .sp-preset:hover { transform: scale(1.12); }
    .sp-preset.active { border-color: #fff; }

    .sp-hint-text {
      font-size: 9px; letter-spacing: 0.06em;
      color: rgba(255,255,255,0.3); margin-bottom: 8px;
      text-transform: uppercase;
    }

    /* Predefined word tags */
    .sp-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
    .sp-tag {
      padding: 3px 8px; border-radius: 20px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 9px; letter-spacing: 0.08em;
      color: rgba(255,255,255,0.45);
      white-space: nowrap;
    }

    #sp-extra-words {
      width: 100%; min-height: 64px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px; padding: 10px;
      color: rgba(255,255,255,0.8);
      font-family: 'DM Mono', monospace; font-size: 10px;
      line-height: 1.7; resize: vertical; outline: none;
    }
    #sp-extra-words::placeholder { color: rgba(255,255,255,0.2); }
    #sp-extra-words:focus {
      border-color: rgba(255,255,255,0.18);
    }

    .sp-btn-row { display: flex; gap: 10px; margin-top: 12px; }
    .sp-btn {
      flex: 1; padding: 10px 0; border-radius: 6px;
      font-family: 'DM Mono', monospace;
      font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; cursor: pointer;
      border: none; transition: opacity 0.2s, transform 0.15s;
    }
    .sp-btn:hover { opacity: 0.8; transform: translateY(-1px); }
    .sp-btn:active { transform: translateY(0); }
    .sp-btn-ghost  { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }
    .sp-btn-primary { background: rgba(255,255,255,0.9); color: #000; font-weight: 700; }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════
//  Panel-Logik
// ═══════════════════════════════════════════════════════════════════
function bindPanel() {
  const panel = document.getElementById("sp-panel");
  const hotZone = document.getElementById("sp-hot-zone");
  const hint = document.getElementById("sp-hint");
  let hintTimer;

  // Öffnen/Schließen
  hotZone.addEventListener("mouseenter", () => {
    panel.classList.add("open");
    hint.classList.remove("visible");
    clearTimeout(hintTimer);
  });
  document.getElementById("sp-close").addEventListener("click", () => {
    panel.classList.remove("open");
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== hotZone) {
      panel.classList.remove("open");
    }
  });

  // Ecken-Indikator anzeigen wenn Maus nah
  document.addEventListener("mousemove", (e) => {
    if (panel.classList.contains("open")) return;
    if (e.clientX > window.innerWidth - 100 && e.clientY < 100) {
      hint.classList.add("visible");
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => hint.classList.remove("visible"), 2000);
    }
  });
}

// ── Slider helper ─────────────────────────────────────────────────
function bindSlider(id, displayId, format, configKey) {
  const el = document.getElementById(id);
  const disp = document.getElementById(displayId);
  el.addEventListener("input", () => {
    const v = parseFloat(el.value);
    CONFIG[configKey] = v;
    disp.textContent = format(v);
  });
}

function bindSliders() {
  bindSlider("sp-count", "sp-val-count", v => Math.round(v), "BUBBLE_COUNT");
  bindSlider("sp-rmin", "sp-val-rmin", v => `${Math.round(v)} px`, "RADIUS_MIN");
  bindSlider("sp-rmax", "sp-val-rmax", v => `${Math.round(v)} px`, "RADIUS_MAX");
  bindSlider("sp-speed", "sp-val-speed", v => `${v.toFixed(1)}×`, "SPEED_MULT");
  bindSlider("sp-wobble", "sp-val-wobble", v => v.toFixed(2), "WOBBLE_AMP");
  bindSlider("sp-threshold", "sp-val-threshold", v => `${v.toFixed(1)}%`, "_THRESHOLD_PCT"); // Proxy, s.u.
  bindSlider("sp-push", "sp-val-push", v => `${Math.round(v)} px`, "PUSH_FORCE");
  bindSlider("sp-lerp", "sp-val-lerp", v => v.toFixed(2), "LERP_SPEED");
  bindSlider("sp-fade", "sp-val-fade", v => `${v.toFixed(1)}×`, "FADE_INTENSITY");
  bindSlider("sp-blur", "sp-val-blur", v => v.toFixed(2), "BLUR_OPACITY_MAX");
  bindSlider("sp-fill", "sp-val-fill", v => `${Math.round(v)}%`, "_FILL_PCT"); // Proxy
  bindSlider("sp-font", "sp-val-font", v => `${v.toFixed(2)}×`, "FONT_SIZE_RATIO");

  // Proxy-Konversionen: Slider-Wert ≠ CONFIG-Wert
  document.getElementById("sp-threshold").addEventListener("input", (e) => {
    CONFIG.PROXIMITY_THRESHOLD = parseFloat(e.target.value) / 100;
  });
  document.getElementById("sp-fill").addEventListener("input", (e) => {
    CONFIG.FILL_OPACITY = parseFloat(e.target.value) / 100;
  });
}

// ── Toggles ───────────────────────────────────────────────────────
function bindToggles() {
  document.querySelectorAll(".sp-toggle").forEach(el => {
    el.addEventListener("click", () => {
      const on = el.dataset.state !== "on";
      el.dataset.state = on ? "on" : "off";
      el.classList.toggle("on", on);
      CONFIG[el.dataset.key] = on;
    });
  });
}

// ── Farbthemen ────────────────────────────────────────────────────
function buildColorPresets() {
  const container = document.getElementById("sp-presets");
  GRADIENT_SETS.forEach((set, i) => {
    const dot = document.createElement("div");
    dot.className = "sp-preset" + (i === 0 ? " active" : "");
    dot.style.background = set.dot;
    dot.title = set.name;
    dot.addEventListener("click", () => {
      document.querySelectorAll(".sp-preset").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      CONFIG.ACTIVE_GRADIENT_SET = i;
      panelEvents.emit("apply"); // Farben sofort sichtbar
    });
    container.appendChild(dot);
  });
}

// ── Vordefinierte Wort-Tags ───────────────────────────────────────
function buildPredefinedTags() {
  const container = document.getElementById("sp-predefined-tags");
  PREDEFINED_WORDS.forEach(word => {
    const tag = document.createElement("div");
    tag.className = "sp-tag";
    tag.textContent = word;
    container.appendChild(tag);
  });
}

// ── Apply & Reset ─────────────────────────────────────────────────
function bindButtons() {
  document.getElementById("sp-apply").addEventListener("click", () => {
    // Wörter: Vordefinierte + eigene Zusätze
    const extra = document.getElementById("sp-extra-words").value
      .split(",")
      .map(w => w.trim().toUpperCase())
      .filter(Boolean);

    CONFIG.WORDS = [...PREDEFINED_WORDS, ...extra];
    panelEvents.emit("apply");
    document.getElementById("sp-panel").classList.remove("open");
  });

  document.getElementById("sp-reset").addEventListener("click", () => {
    // CONFIG auf Defaults zurücksetzen
    Object.assign(CONFIG, DEFAULTS, { WORDS: [...DEFAULTS.WORDS] });

    // Slider zurücksetzen
    document.getElementById("sp-count").value = DEFAULTS.BUBBLE_COUNT;
    document.getElementById("sp-val-count").textContent = DEFAULTS.BUBBLE_COUNT;
    document.getElementById("sp-rmin").value = DEFAULTS.RADIUS_MIN;
    document.getElementById("sp-val-rmin").textContent = `${DEFAULTS.RADIUS_MIN} px`;
    document.getElementById("sp-rmax").value = DEFAULTS.RADIUS_MAX;
    document.getElementById("sp-val-rmax").textContent = `${DEFAULTS.RADIUS_MAX} px`;
    document.getElementById("sp-speed").value = DEFAULTS.SPEED_MULT;
    document.getElementById("sp-val-speed").textContent = `${DEFAULTS.SPEED_MULT.toFixed(1)}×`;
    document.getElementById("sp-wobble").value = DEFAULTS.WOBBLE_AMP;
    document.getElementById("sp-val-wobble").textContent = DEFAULTS.WOBBLE_AMP.toFixed(2);
    document.getElementById("sp-threshold").value = DEFAULTS.PROXIMITY_THRESHOLD * 100;
    document.getElementById("sp-val-threshold").textContent = `${(DEFAULTS.PROXIMITY_THRESHOLD * 100).toFixed(1)}%`;
    document.getElementById("sp-push").value = DEFAULTS.PUSH_FORCE;
    document.getElementById("sp-val-push").textContent = `${DEFAULTS.PUSH_FORCE} px`;
    document.getElementById("sp-lerp").value = DEFAULTS.LERP_SPEED;
    document.getElementById("sp-val-lerp").textContent = DEFAULTS.LERP_SPEED.toFixed(2);
    document.getElementById("sp-fade").value = DEFAULTS.FADE_INTENSITY;
    document.getElementById("sp-val-fade").textContent = `${DEFAULTS.FADE_INTENSITY.toFixed(1)}×`;
    document.getElementById("sp-blur").value = DEFAULTS.BLUR_OPACITY_MAX;
    document.getElementById("sp-val-blur").textContent = DEFAULTS.BLUR_OPACITY_MAX.toFixed(2);
    document.getElementById("sp-fill").value = DEFAULTS.FILL_OPACITY * 100;
    document.getElementById("sp-val-fill").textContent = `${Math.round(DEFAULTS.FILL_OPACITY * 100)}%`;
    document.getElementById("sp-font").value = DEFAULTS.FONT_SIZE_RATIO;
    document.getElementById("sp-val-font").textContent = `${DEFAULTS.FONT_SIZE_RATIO.toFixed(2)}×`;

    // Toggles zurücksetzen
    document.querySelectorAll(".sp-toggle").forEach(el => {
      el.dataset.state = "on";
      el.classList.add("on");
    });

    // Farb-Presets zurücksetzen
    document.querySelectorAll(".sp-preset").forEach((d, i) => {
      d.classList.toggle("active", i === 0);
    });

    // Extra-Wörter leeren
    document.getElementById("sp-extra-words").value = "";

    panelEvents.emit("reset");
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Öffentliche Init-Funktion
// ═══════════════════════════════════════════════════════════════════
export function initSettingsPanel() {
  injectCSS();
  injectHTML();
  bindPanel();
  bindSliders();
  bindToggles();
  buildColorPresets();
  buildPredefinedTags();
  bindButtons();
  console.log("[SettingsPanel] Initialisiert ✓");
}