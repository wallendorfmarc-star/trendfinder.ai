/* app.js — Trendfinder v7.x
 * Korrigiert:
 *  - Zeile 313: jQuery + optional chaining Fehler behoben (nutzt jetzt .text())
 *  - Robustes Passwort-Gate mit SHA-256 Prüflogik (PW = "7707")
 *  - Sauberer Init-Flow: locked → gate, unlocked → App init (Charts/Daten)
 *  - Keine Klartext-Passwörter im HTML, input bleibt type=password
 *
 * Hinweise:
 *  - Erfordert jQuery, wenn du weiter $ nutzt (sonst auf reines DOM umbauen).
 *  - Passe/ergänze unten die Funktionen loadAllData(), initCharts(), usw. an dein Projekt an.
 */

"use strict";

/* ---------------------- Utils ---------------------- */

// Simple logger (kannst du entfernen)
const log = (...args) => console.log("[TF]", ...args);

// SHA-256 Hex
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------ Password Gate ------------------ */

// SHA-256("7707")
const PW_HASH_HEX = "0a53ec672831a9da252456439c06ff3f181181b0602b8473ee3afb3d528a31a5";

async function checkPassword(pw) {
  // Alternative (einfach, weniger sicher):
  // return pw === "7707";
  const hex = await sha256Hex(pw);
  return hex === PW_HASH_HEX;
}

function unlockApp() {
  localStorage.setItem("tf_session", "ok");
  const gateEl = document.getElementById("gate");
  if (gateEl) gateEl.style.display = "none";
  document.dispatchEvent(new Event("tf:unlocked"));
}

function showGateError(msg) {
  const el = document.getElementById("msg");
  if (el) el.textContent = msg || "Fehler.";
}

function needsGate() {
  const p = new URLSearchParams(location.search);
  if (p.get("bypass") === "1") return false; // Test-Bypass
  return localStorage.getItem("tf_session") !== "ok";
}

function bindGate() {
  const btn = document.getElementById("loginBtn");
  const inp = document.getElementById("pw");
  if (!btn || !inp) return;

  const handler = async () => {
    const val = (inp.value || "").trim();
    if (!val) return showGateError("Bitte Passwort eingeben.");
    try {
      const ok = await checkPassword(val);
      if (ok) unlockApp();
      else showGateError("Passwort falsch.");
    } catch (e) {
      console.error(e);
      showGateError("Prüfung nicht möglich.");
    }
  };

  btn.addEventListener("click", handler);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") handler(); });
}

/* --------------- App State & UI Helpers --------------- */

// <- HIER deine globalen States/Configs falls nötig
const TF = {
  // Beispiel-Config
  ready: false,
};

// Platzhalter im Portfolio-Header (Fix für ehem. Zeile 313)
function resetPortfolioHeaderPlaceholders() {
  // jQuery-Variante (da du $ nutzt)
  $('#pf-spread').text('—');
  $('#pf-liq').text('—');
  $('#pf-vol').text('—');

  // Falls du kein jQuery möchtest, nimm stattdessen:
  // document.getElementById('pf-spread')?.textContent = '—';
  // document.getElementById('pf-liq')?.textContent   = '—';
  // document.getElementById('pf-vol')?.textContent   = '—';
}

/* ----------------- Data / Charts Hooks ----------------- */

// Beispiel: lade alle Daten (platzhalter)
async function loadAllData() {
  // TODO: Ersetze mit deiner echten Datenlogik
  // await fetch(...), CSV laden, usw.
  log("loadAllData()");
}

// Beispiel: initialisiere Charts/Grids/Widgets
function initCharts() {
  // TODO: Deine Plotly/Chart-Init hier
  // Hinweis zur Warnung: verwende eine konkrete Plotly-Version statt "plotly-latest"
  // <script src="https://cdn.plot.ly/plotly-2.33.0.min.js"></script> (Beispiel)
  log("initCharts()");
}

// Beispiel: re-render nach Datenlage
function renderAll() {
  // TODO: re-render Calls
  log("renderAll()");
}

/* -------------------- App Lifecycle -------------*
