// app.js — simple client-side password unlock with debug aids

(() => {
  const CORRECT = "7707";                 // <--- das gültige Passwort
  const STORAGE_KEY = "trendfinder_unlocked";

  const landing = document.getElementById("landing");
  const main = document.getElementById("mainContent");
  const input = document.getElementById("pwInput");
  const unlockBtn = document.getElementById("unlockBtn");
  const lockBtn = document.getElementById("lockBtn");
  const msg = document.getElementById("msg");
  const demoBtn = document.getElementById("demoBtn");

  function debugLog(...args){
    try { console.log("[Trendfinder-debug]", ...args); } catch(e){}
  }

  function showMessage(text, isError){
    msg.textContent = text;
    msg.className = isError ? "msg" : "ok";
  }

  function setUnlocked(v){
    if(v) sessionStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.removeItem(STORAGE_KEY);
    updateUI();
  }

  function isUnlocked(){
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  }

  function updateUI(){
    if(isUnlocked()){
      landing.classList.add("hidden");
      main.classList.remove("hidden");
      showMessage("", false);
      debugLog("UI: unlocked");
    } else {
      landing.classList.remove("hidden");
      main.classList.add("hidden");
      debugLog("UI: locked");
    }
  }

  function tryUnlock(value){
    const v = (value || input.value || "").toString().trim();
    debugLog("tryUnlock:", v);
    if(!v){
      showMessage("Bitte Passwort eingeben.", true);
      return;
    }
    if(v === CORRECT){
      setUnlocked(true);
      showMessage("Erfolgreich entsperrt.", false);
      debugLog("Unlocked OK");
    } else {
      showMessage("Falsches Passwort.", true);
      debugLog("Wrong password");
    }
  }

  // allow query parameter ?pw=7707 for quick testing
  function checkQueryParam(){
    try {
      const params = new URLSearchParams(location.search);
      if(params.has("pw")){
        const p = params.get("pw");
        debugLog("pw param present:", p);
        tryUnlock(p);
        return true;
      }
    } catch(e){}
    return false;
  }

  // attach events
  unlockBtn.addEventListener("click", () => tryUnlock());
  input.addEventListener("keydown", (ev) => { if(ev.key === "Enter") tryUnlock(); });
  lockBtn && lockBtn.addEventListener("click", () => { setUnlocked(false); showMessage("Demo gesperrt.", false); });
  demoBtn.addEventListener("click", () => {
    // quick test: add pw param and reload to simulate external link
    const q = new URL(location.href);
    q.searchParams.set("pw", CORRECT);
    location.href = q.toString();
  });

  // initial UI update
  updateUI();

  // auto-check query param to allow quick unlock via ?pw=7707
  checkQueryParam();

  // helpful info for debugging in console
  debugLog("app.js loaded. unlocked:", isUnlocked());
  debugLog("If unlock doesn't work: open DevTools (F12) and check console for messages.");
})();
