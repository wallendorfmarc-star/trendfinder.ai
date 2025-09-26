/* Tycoondata · Trendfinder – app.js (FULL) */

/* -------------------- Config -------------------- */
const DATA_BASE = '/data/'; // Dateien liegen unter https://www.trendfinder.ai/data/*.json
const PASSWORD  = '369';    // Gate Unlock

/* -------------------- State --------------------- */
const state = {
  retail: null,
  beauty: null,
  supp: null,
  finance: null,
  luxury: null,
  selected: { retail: 0, beauty: 0 }, // für Dropdowns, falls vorhanden
};

/* -------------------- Health Panel -------------- */
const HEALTH = {
  files: {
    [`${DATA_BASE}retail.json`]: null,
    [`${DATA_BASE}beauty.json`]: null,
    [`${DATA_BASE}supplements.json`]: null,
    [`${DATA_BASE}finance.json`]: null,
    [`${DATA_BASE}luxury.json`]: null,
  },
  dom: {
    'elec': true, 'fmcg': true,
    'beauty-line': true,
    'supp-stacked': true,
    'finance-dual': true,
    'lux-watches': true, 'lux-autos': true, 'lux-yachts': true
  }
};

function updateHealthPanel(){
  const el = id => document.getElementById(id);
  const hp = el('health-plotly');
  const hf = el('health-files');
  const hd = el('health-dom');
  const ok   = (s)=>`<span style="color:#18c964">OK</span> ${s}`;
  const fail = (s)=>`<span style="color:#ff5b5b">FEHLT</span> ${s}`;

  if (hp) hp.innerHTML = `<strong>Plotly:</strong> ${window.Plotly ? ok('geladen') : fail('nicht gefunden')}`;

  if (hf) hf.innerHTML = `<strong>Data Files:</strong><br>` +
    Object.entries(HEALTH.files).map(([k,v]) => (v===true ? ok(k) : v===false ? fail(k) : `… ${k}`)).join('<br>');

  if (hd) hd.innerHTML = `<strong>DOM Targets:</strong><br>` +
    Object.keys(HEALTH.dom).map(id => (document.getElementById(id) ? ok('#'+id) : fail('#'+id))).join('<br>');
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

/* -------------------- Gate (Passwort) ----------- */
function initGate(){
  const form = document.getElementById('gateForm');
  const input = document.getElementById('pass');
  const msg = document.getElementById('gateMsg');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(input.value.trim() === PASSWORD){
      document.getElementById('gate').style.display = 'none';
      document.getElementById('app').style.display = 'grid';
      renderAllIfReady();
    }else{
      msg.textContent = 'Falsches Passwort';
      msg.style.color = '#ff6b6b';
    }
  });
}

/* -------------------- Tabs & Controls ----------- */
function bindTabs(){
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.getAttribute('data-tab');
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      const sec = document.getElementById(tab);
      if(sec){ sec.classList.add('active'); }
      // on-demand Render
      switch(tab){
        case 'retail': renderRetail(); break;
        case 'beauty': renderBeauty(); break;
        case 'supplements': renderSupplements(); break;
        case 'finance': renderFinance(); break;
        case 'luxury': renderLuxury(); break;
        case 'portfolio': /* optional */ break;
        case 'matrix': /* optional */ break;
        case 'brand': /* optional */ break;
      }
    });
  });
}

/* -------------------- Rendering ----------------- */
// 1) Retail: Multi-Line (elec) + Mini-Bar (fmcg) als „Index“
function renderRetail(){
  if(!state.retail) return;
  const el1 = document.getElementById('elec');
  const el2 = document.getElementById('fmcg');
  if(el1){
    const {products,time,demand} = state.retail;
    const traces = products.map((p,i)=>({
      x: time, y: demand[i], type:'scatter', mode:'lines+markers', name: p
    }));
    const layout = {
      margin:{l:50,r:20,t:30,b:40},
      legend:{orientation:'h'},
      xaxis:{title:'Zeit'},
      yaxis:{title:'Nachfrage-Index'}
    };
    Plotly.react(el1, traces, layout, {responsive:true});
  }
  if(el2){
    // einfacher „Index“ = letzter Wert je Produkt
    const {products,demand} = state.retail;
    const last = products.map((_,i)=> demand[i][demand[i].length-1]);
    Plotly.react(el2, [{x:products, y:last, type:'bar'}],
      {margin:{l:50,r:10,t:30,b:60}, xaxis:{tickangle:-20}, yaxis:{title:'Index'}},
      {responsive:true});
  }
}

// 2) Beauty: Multi-Line (buzz)
function renderBeauty(){
  if(!state.beauty) return;
  const el = document.getElementById('beauty-line');
  if(!el) return;
  const {products,time,buzz} = state.beauty;
  const traces = products.map((p,i)=>({x:time,y:buzz[i], type:'scatter', mode:'lines', name:p}));
  Plotly.react(el, traces, {
    margin:{l:50,r:20,t:30,b:40},
    legend:{orientation:'h'},
    xaxis:{title:'Zeit'}, yaxis:{title:'Buzz-Index'}
  }, {responsive:true});
}

// 3) Supplements: Stacked Bars (shares)
function renderSupplements(){
  if(!state.supp) return;
  const el = document.getElementById('supp-stacked');
  if(!el) return;
  const {categories,channels,shares} = state.supp; // shares: [cat][channel]
  const traces = channels.map((ch,ci)=>({
    x: categories,
    y: categories.map((_,ri)=> shares[ri][ci]),
    name: ch,
    type:'bar'
  }));
  Plotly.react(el, traces, {
    barmode:'stack',
    margin:{l:50,r:20,t:30,b:60},
    xaxis:{title:'Kategorie', tickangle:-15},
    yaxis:{title:'Marktanteil (%)'}
  }, {responsive:true});
}

// 4) Finance: Preis (Linie) + Sentiment (Sekundärachse)
function renderFinance(){
  if(!state.finance) return;
  const el = document.getElementById('finance-dual');
  if(!el) return;
  const {assets,time,price,sentiment} = state.finance;

  const priceTraces = assets.map((a,i)=>({
    x: time, y: price[i], name: `${a} Price`, type:'scatter', mode:'lines'
  }));
  const sentTraces = assets.map((a,i)=>({
    x: time, y: sentiment[i], name: `${a} Sentiment`, type:'scatter', mode:'lines', yaxis:'y2', line:{dash:'dot'}
  }));

  Plotly.react(el, [...priceTraces, ...sentTraces], {
    margin:{l:50,r:50,t:30,b:40},
    xaxis:{title:'Zeit'},
    yaxis:{title:'Preis'},
    yaxis2:{title:'Sentiment', overlaying:'y', side:'right', range:[0,100]},
    legend:{orientation:'h'}
  }, {responsive:true});
}

// 5) Luxury: Drei Diagramme – Watches / Autos / Yachts
function renderLuxury(){
  if(!state.luxury) return;
  const watchEl = document.getElementById('lux-watches');
  const autoEl  = document.getElementById('lux-autos');
  const yachtEl = document.getElementById('lux-yachts');
  const {watches, autos, yachts} = state.luxury;

  if(watchEl && watches){
    const data = [
      {x: watches.brands, y: watches.msrp,      type:'bar', name:'MSRP'},
      {x: watches.brands, y: watches.secondary, type:'bar', name:'Secondary'}
    ];
    Plotly.react(watchEl, data, {
      barmode:'group',
      margin:{l:60,r:20,t:30,b:60},
      yaxis:{title:'Preis (€)'}
    }, {responsive:true});
  }

  if(autoEl && autos){
    const data = [
      {x: autos.brands, y: autos.msrp,      type:'bar', name:'MSRP'},
      {x: autos.brands, y: autos.secondary, type:'bar', name:'Secondary'}
    ];
    Plotly.react(autoEl, data, {
      barmode:'group',
      margin:{l:60,r:20,t:30,b:60},
      yaxis:{title:'Preis (€)'}
    }, {responsive:true});
  }

  if(yachtEl && yachts){
    const data = [
      {x: yachts.brands, y: yachts.msrp,      type:'bar', name:'MSRP'},
      {x: yachts.brands, y: yachts.secondary, type:'bar', name:'Secondary'}
    ];
    Plotly.react(yachtEl, data, {
      barmode:'group',
      margin:{l:60,r:20,t:30,b:60},
      yaxis:{title:'Preis (€)'}
    }, {responsive:true});
  }
}

/* -------- Render-All wenn Daten & App sichtbar --- */
function renderAllIfReady(){
  const appVisible = document.getElementById('app') && document.getElementById('app').style.display !== 'none';
  if(!appVisible) return;
  renderRetail();
  renderBeauty();
  renderSupplements();
  renderFinance();
  renderLuxury();
}

/* -------------------- Boot ---------------------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  initGate();
  bindTabs();
  updateHealthPanel();

  try{
    const [ret,bea,sup,fin,lux] = await Promise.all([
      loadJSONChecked(`${DATA_BASE}retail.json`),
      loadJSONChecked(`${DATA_BASE}beauty.json`),
      loadJSONChecked(`${DATA_BASE}supplements.json`),
      loadJSONChecked(`${DATA_BASE}finance.json`),
      loadJSONChecked(`${DATA_BASE}luxury.json`)
    ]);
    state.retail  = ret;
    state.beauty  = bea;
    state.supp    = sup;
    state.finance = fin;
    state.luxury  = lux;
  }catch(e){
    console.error('Daten konnten nicht vollständig geladen werden.', e);
  }

  // Wenn kein Gate existiert (öffentliche Demo), sofort rendern
  if (!document.getElementById('gate')) {
    const app = document.getElementById('app');
    if (app) app.style.display = 'grid';
    renderAllIfReady();
  }
});
