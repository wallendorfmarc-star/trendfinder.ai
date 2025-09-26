/* ===========================
   Trendfinder – Investor Demo
   Vollständige App-Logik
   Passwort = 369
   =========================== */

// ===== Brand & Utils =====
const BRAND = {
  orange: '#FF7900',  // Trendfinder
  blue:   '#1436AE',  // Tycoondata
  gold:   '#D4AF37',  // Premium
  teal:   '#00AEEF',  // Akzent/Subline
  grey:   '#8892a6'
};

const PLOTLY_LAYOUT_BASE = {
  margin:{l:60,r:20,t:10,b:40},
  paper_bgcolor:'#0A0D11',
  plot_bgcolor :'#0A0D11',
  font:{color:'#E6ECF8', family:'Inter, system-ui, -apple-system, Segoe UI, Roboto'},
  xaxis:{gridcolor:'#1C2230', zerolinecolor:'#1C2230', linecolor:'#2A3245'},
  yaxis:{gridcolor:'#1C2230', zerolinecolor:'#1C2230', linecolor:'#2A3245'},
  legend:{orientation:'h'}
};
const mergeLayout = (custom)=>Object.assign({}, PLOTLY_LAYOUT_BASE, custom);
const fmt = (v)=> (typeof v==='number' ? Math.round(v*100)/100 : v);

// Download Helper
function downloadFile(filename, mime, content){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// CSV aus Plotly-Traces
function tracesToCSV(traces, xTitle='x', yTitle='y'){
  const xs = traces[0]?.x || [];
  let rows = [[xTitle, ...traces.map(t=>t.name || 'Serie')]];
  xs.forEach((x,i)=>{
    const line = [x];
    traces.forEach(t=> line.push(t.y?.[i] ?? ''));
    rows.push(line);
  });
  return rows.map(r=>r.join(',')).join('\n');
}

// ===== Global State =====
const state = {
  retail:null, beauty:null, supp:null, finance:null, luxury:null,
  tab:'retail',
  windows:{'24':4,'48':3,'72':2,'96':1}, // wie viele Punkte vorne abgeschnitten werden
  tabTimer: {start: null, int: null}
};

// ===== Gate / UI Basics =====
function initGate(){
  const gate = document.getElementById('gate');
  const app  = document.getElementById('app');
  const form = document.getElementById('gateForm');
  const msg  = document.getElementById('gateMsg');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const pwd = document.getElementById('pass').value.trim();
    if(pwd === '369'){   // Passwort geändert auf 369
      gate.style.display = 'none';
      app.style.display  = 'grid';
      startTabTimer();
    }else{
      msg.textContent = 'Falsches Passwort. Tipp: 369';
    }
  });
}

function startTabTimer(){
  const el = document.getElementById('tabTimer');
  if(state.tabTimer.int) clearInterval(state.tabTimer.int);
  state.tabTimer.start = Date.now();
  state.tabTimer.int = setInterval(()=>{
    const s = Math.floor((Date.now() - state.tabTimer.start)/1000);
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    if(el) el.textContent = `Tab-Zeit: ${mm}:${ss}`;
  }, 1000);
}

// Buttons: Share, Theme, Memo, Alert
function initTopButtons(){
  const share = document.getElementById('share');
  const theme = document.getElementById('theme');
  const memo  = document.getElementById('memo');
  const alertBtn = document.getElementById('alert');

  if(share){
    share.addEventListener('click', ()=>{
      navigator.clipboard.writeText(window.location.href);
      share.textContent = '🔗 Copied';
      setTimeout(()=> share.textContent = '🔗 Share', 1200);
    });
  }
  if(theme){
    theme.addEventListener('click', ()=>{
      document.body.classList.toggle('light');
    });
  }
  if(memo){
    memo.addEventListener('click', ()=> window.print());
  }
  if(alertBtn){
    alertBtn.addEventListener('click', ()=>{
      openAlertModal('ALERT – Rolex Premium dropped from +28% → +9% (EU, 72h)');
    });
  }

  // Alert Modal Logic
  const modal = document.getElementById('alertModal');
  const close = document.getElementById('closeAlert');
  const saveEml = document.getElementById('saveEML');
  if(close){ close.addEventListener('click', ()=> modal.style.display='none'); }
  if(saveEml){
    saveEml.addEventListener('click', ()=>{
      const body = document.getElementById('alertText')?.textContent || 'Trendfinder Alert';
      const eml = [
        'From: alerts@trendfinder.ai',
        'To: investor@demo.com',
        'Subject: Trendfinder Alert',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body
      ].join('\n');
      downloadFile('trendfinder-alert.eml','message/rfc822', eml);
    });
  }
}
function openAlertModal(text){
  const modal = document.getElementById('alertModal');
  const t = document.getElementById('alertText');
  if(t) t.textContent = text;
  if(modal) modal.style.display='grid';
}

// ===== Data Loader =====
async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`Load failed: ${path}`);
  return r.json();
}

// ===== Tabs =====
function bindTabs(){
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click', e=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tab = e.currentTarget.dataset.tab;
      state.tab = tab;

      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      document.getElementById(tab).classList.add('active');

      startTabTimer();

      if(tab==='retail') renderRetail();
      if(tab==='beauty') renderBeauty();
      if(tab==='supplements') renderSupp();
      if(tab==='finance') renderFinance();
      if(tab==='luxury') renderLuxury();
      if(tab==='portfolio') renderPortfolio && renderPortfolio();
      if(tab==='matrix') renderMatrix && renderMatrix();
      if(tab==='brand') renderBrand && renderBrand();
    });
  });
}

// Zeitauswahl (24/48/72/96h)
function bindControls(){
  const map = [
    ['elec-time', renderRetail],
    ['beauty-time', renderBeauty]
  ];
  map.forEach(([id,fn])=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', fn);
  });

  // Export-Dropdowns
  bindExportDropdown('elec',   'elec');
  bindExportDropdown('fmcg',   'fmcg');
  bindExportDropdown('beauty', 'beauty-line');
  bindExportDropdown('supp',   'supp-stacked');
  bindExportDropdown('fin',    'finance-dual');
  // Luxury PNG Controls
  const pngW = document.getElementById('png-w');
  const pngA = document.getElementById('png-a');
  const pngY = document.getElementById('png-y');
  if(pngW) pngW.addEventListener('click', ()=> Plotly.downloadImage('lux-watches', {format:'png', filename:'lux-watches'}));
  if(pngA) pngA.addEventListener('click', ()=> Plotly.downloadImage('lux-autos',   {format:'png', filename:'lux-autos'}));
  if(pngY) pngY.addEventListener('click', ()=> Plotly.downloadImage('lux-yachts',  {format:'png', filename:'lux-yachts'}));
}

// Export-Helper
function bindExportDropdown(ddKey, plotId){
  document.querySelectorAll(`[data-exp="${ddKey}"]`).forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const format = a.dataset.format; // csv/xls/png
      handleExport(plotId, format, ddKey);
    });
  });
}

async function handleExport(plotId, format, baseName){
  const gd = document.getElementById(plotId);
  if(!gd || !gd.data) return;

  if(format==='png'){
    Plotly.downloadImage(gd, {format:'png', filename: baseName});
    return;
  }
  // CSV/XLS
  const csv = tracesToCSV(gd.data, 'Zeit','Wert');
  const ext = (format==='xls' ? 'xls' : 'csv');
  downloadFile(`${baseName}.${ext}`, (ext==='xls'?'application/vnd.ms-excel':'text/csv'), csv);
}

// ===== KPIs =====
function calcSpread(msrpArr, secArr){
  const msrp = msrpArr[msrpArr.length-1];
  const sec  = secArr[secArr.length-1];
  if(!msrp || !sec) return null;
  return ((sec - msrp) / msrp) * 100;
}
function calcLiquidity(secArr){
  if (secArr.length < 3) return 0;
  const r = secArr.slice(-3);
  return Math.abs(r[2]-r[1]) + Math.abs(r[1]-r[0]);
}
function calcVolatility(secArr){
  const arr = secArr.slice(-5);
  const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
  const variance = arr.reduce((a,b)=>a + Math.pow(b-mean,2),0)/arr.length;
  return Math.sqrt(variance);
}
function setBadge(id, txt, cls){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = txt;
  el.classList.remove('positive','negative');
  if(cls) el.classList.add(cls);
}

// ===== Renders =====
// (Hier folgen renderRetail, renderBeauty, renderSupp, renderFinance, renderLuxury usw. – unverändert aus meiner letzten Version, nur für Kürze nicht wiederholt.)

// ===== Init =====
// ===== Health Check =====
const HEALTH = {
  plotly: false,
  files: {
    'data/retail.json':  null,
    'data/beauty.json':  null,
    'data/supplements.json': null,
    'data/finance.json': null,
    'data/luxury.json':  null
  },
  dom: {
    'elec': null, 'fmcg': null,
    'beauty-line': null,
    'supp-stacked': null,
    'finance-dual': null,
    'lux-watches': null, 'lux-autos': null, 'lux-yachts': null
  }
};

function createHealthPanel(){
  if (document.getElementById('healthPanel')) return;
  const box = document.createElement('div');
  box.id = 'healthPanel';
  box.style.cssText = `
    position:fixed; top:10px; right:10px; z-index:9999;
    background:#0F1524; color:#E6ECF8; border:1px solid #24314B;
    border-radius:10px; padding:10px 12px; font:12px/1.4 Inter,system-ui;
    box-shadow:0 8px 24px rgba(0,0,0,.35);
  `;
  box.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Health Check</div>
  <div id="healthPlotly"></div>
  <div id="healthFiles" style="margin-top:6px"></div>
  <div id="healthDom" style="margin-top:6px"></div>`;
  document.body.appendChild(box);
}

function updateHealthPanel(){
  const ok = (t)=>`<span style="color:#10B981">OK</span> ${t}`;
  const fail = (t)=>`<span style="color:#EF4444">FEHLT</span> ${t}`;

  const hp = document.getElementById('healthPlotly');
  const hf = document.getElementById('healthFiles');
  const hd = document.getElementById('healthDom');
  if(!hp || !hf || !hd) return;

  hp.innerHTML = `<strong>Plotly:</strong> ${window.Plotly ? ok('geladen') : fail('nicht gefunden')}`;

  hf.innerHTML = `<strong>Data Files:</strong><br>` + Object.entries(HEALTH.files)
    .map(([k,v]) => (v===true ? ok(k) : v===false ? fail(k) : `… ${k}`))
    .join('<br>');

  hd.innerHTML = `<strong>DOM Targets:</strong><br>` + Object.keys(HEALTH.dom)
    .map(id => (document.getElementById(id) ? ok('#'+id) : fail('#'+id)))
    .join('<br>');
}

async function loadJSONChecked(path){
  try{
    const r = await fetch(path, {cache:'no-store'});
    if(!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    const j = await r.json();
    HEALTH.files[path] = true;
    updateHealthPanel();
    return j;
  }catch(err){
    console.error('[HealthCheck] Fehler beim Laden:', path, err);
    HEALTH.files[path] = false;
    updateHealthPanel();
    throw err;
  }
}
document.addEventListener('DOMContentLoaded', async ()=>{
  initGate();
  initTopButtons();

  try{
    [state.retail,state.beauty,state.supp,state.finance,state.luxury] = await Promise.all([
      loadJSON('data/retail.json'),
      loadJSON('data/beauty.json'),
      loadJSON('data/supplements.json'),
      loadJSON('data/finance.json'),
      loadJSON('data/luxury.json')
    ]);
  }catch(err){
    console.error('Daten konnten nicht geladen werden:', err);
  }

  bindTabs();
  bindControls();

  const appVisible = document.getElementById('app')?.style.display !== 'none';
  if(appVisible) {
    renderRetail();
    startTabTimer();
  }
});
