/* ==============================
   Trendfinder v7 – app.js (full)
   ============================== */

// ---------- Helpers ----------
const $  = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));

const state = {
  retail: null,
  beauty: null,
  supp: null,
  finance: null,
  luxury: null,
  portfolio: null,
  correlation: null,
  brands: null
};

// ---------- Password Gate ----------
function initGate(){
  const gate = $('#gate');
  const app  = $('#app');
  const form = $('#gateForm');
  const inp  = $('#pass');
  const msg  = $('#gateMsg');
  if(!gate || !form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const v = String(inp.value || '').trim();
    if(v === '369'){                         // <— Passwort
      gate.style.display = 'none';
      app.style.display  = 'grid';
      msg.textContent = '';
    }else{
      msg.textContent = 'Falsches Passwort.';
    }
  });
}

// ---------- Top Buttons / Misc ----------
function initTopButtons(){
  const theme = $('#theme');
  if(theme){
    theme.addEventListener('click', ()=>{
      document.body.classList.toggle('light');
    });
  }
  const share = $('#share');
  if(share){
    share.addEventListener('click', async ()=>{
      const url = location.href;
      try{
        await navigator.clipboard.writeText(url);
        alert('Link kopiert: '+url);
      }catch{
        alert('Link: '+url);
      }
    });
  }
  const memo = $('#memo');
  const memoDoc = $('#memoDoc');
  if(memo && memoDoc){
    memo.addEventListener('click', ()=> {
      window.print(); // nutzt .print-only in CSS
    });
  }
  // Demo-Alert
  const alertBtn = $('#alert');
  const modal = $('#alertModal');
  const closeAlert = $('#closeAlert');
  const saveEML = $('#saveEML');
  if(alertBtn && modal){
    alertBtn.addEventListener('click', ()=> modal.style.display = 'flex');
    closeAlert?.addEventListener('click', ()=> modal.style.display = 'none');
    saveEML?.addEventListener('click', ()=>{
      const blob = new Blob([
        "From: alerts@trendfinder.ai\nSubject: Alert Demo\n\nRolex Premium dropped …"
      ], {type:'message/rfc822'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'alert_demo.eml'; a.click();
      URL.revokeObjectURL(url);
    });
  }
}

// ---------- Tabs ----------
function bindTabs(){
  const tabs = $$('.tab');
  const sections = $$('.section');
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      const target = t.dataset.tab;
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      sections.forEach(s=>{
        s.classList.toggle('active', s.id === target);
      });
      // Optional: beim Wechsel rendern
      switch(target){
        case 'retail':      renderRetail(); break;
        case 'beauty':      renderBeauty(); break;
        case 'supplements': renderSupp(); break;
        case 'finance':     renderFinance(); break;
        case 'luxury':      renderLuxury(); break;
        case 'portfolio':   renderPortfolio(); break;
        case 'matrix':      renderCorrelation(); break;
        case 'brand':       renderBrands(); break;
      }
    });
  });
}

// ---------- Health Panel ----------
const HEALTH = {
  files: {},
  dom: {
    'elec':1,'fmcg':1,'beauty-line':1,'supp-stacked':1,'finance-dual':1,
    'lux-watches':1,'lux-autos':1,'lux-yachts':1,'pf-forecast':1,
    'matrix-grid':1,'brand-share':1,'brand-premium':1
  }
};

function createHealthPanel(){
  if($('#healthPanel')) return;
  const p = document.createElement('div');
  p.id = 'healthPanel';
  p.style.cssText = `
    position:fixed; right:14px; bottom:14px; z-index:9999;
    background:rgba(13,18,28,.92); color:#d1e9ff; font:12px/1.4 Inter,system-ui,Arial;
    border:1px solid #203043; border-radius:10px; padding:10px 12px; width:270px;
    box-shadow:0 6px 24px rgba(0,0,0,.35); backdrop-filter:saturate(140%) blur(8px);
  `;
  p.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong style="letter-spacing:.2px">Health Check</strong>
      <button id="hpClose" style="background:#122033;border:0;color:#9ad3ff;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
    </div>
    <div id="hpPlotly" style="margin-bottom:6px"></div>
    <div id="hpFiles" style="margin-bottom:6px"></div>
    <div id="hpDom"></div>
    <div style="margin-top:6px;color:#6aa9ff">Toggle: Taste <b>H</b></div>
  `;
  document.body.appendChild(p);
  $('#hpClose').onclick = ()=> p.style.display='none';

  document.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase()==='h'){
      p.style.display = (p.style.display==='none'?'block':'none');
    }
  });
  updateHealthPanel();
}
function updateHealthPanel(){
  const ok   = s => `<span style="color:#7bf77b">OK</span> ${s}`;
  const fail = s => `<span style="color:#ff7b7b">FEHLT</span> ${s}`;
  const hp = $('#hpPlotly'), hf = $('#hpFiles'), hd = $('#hpDom');
  if(!hp||!hf||!hd) return;
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
    HEALTH.files[path] = true; updateHealthPanel();
    return j;
  }catch(err){
    console.error('[HealthCheck] Fehler beim Laden:', path, err);
    HEALTH.files[path] = false; updateHealthPanel();
    return null; // wir rendern mit Fallback
  }
}

// ---------- Fallback-Datensätze ----------
const Fallback = {
  retail: {
    products: ["Smartphone","Laptop","Tablet","Smartwatch"],
    time: ["2025-09-20","2025-09-21","2025-09-22","2025-09-23"],
    demand: [
      [120,150,170,160],
      [ 80, 95,110,130],
      [ 60, 65, 70, 75],
      [ 40, 55, 50, 60]
    ]
  },
  beauty: {
    products:["Serum","Cream","Mask","Cleanser"],
    time:["2025-09-20","2025-09-21","2025-09-22","2025-09-23"],
    buzz:[
      [200,210,220,230],
      [160,162,165,170],
      [ 80, 85, 95,100],
      [ 90, 88, 92, 96]
    ]
  },
  supp: {
    channels:["Amazon","Retail","D2C"],
    categories:["Protein","Omega-3","Ashwagandha","Creatine"],
    share:[
      [40,30,30],
      [20,30,50],
      [10,15,75],
      [35,45,20]
    ]
  },
  finance: {
    time:["2025-09-20","2025-09-21","2025-09-22","2025-09-23"],
    price:{
      "BTC":[61000,61500,61200,62000],
      "ETH":[3100,3150,3140,3180],
      "Tesla":[240,242,238,241],
      "Nvidia":[470,475,480,478]
    },
    sentiment:{
      "BTC":[45,46,47,48],
      "ETH":[42,44,43,45],
      "Tesla":[51,49,50,52],
      "Nvidia":[55,56,57,57]
    }
  },
  luxury: {
    watches:{
      brands:["Rolex","Patek Philippe","Audemars Piguet","Richard Mille"],
      msrp:[9000,30000,26000,160000],
      secondary:[14000,42000,38000,320000]
    },
    autos:{
      brands:["Ferrari","Lamborghini","Rolls-Royce","Bentley"],
      msrp:[280000,300000,420000,320000],
      secondary:[420000,450000,380000,350000]
    },
    yachts:{
      brands:["Feadship","Lürssen","Benetti","Sunseeker"],
      msrp:[50000000,70000000,35000000,15000000],
      secondary:[48000000,68000000,34000000,14000000]
    }
  },
  portfolio:{
    time:["T-3","T-2","T-1","T0","T+1","T+2"],
    series:[
      {name:"Rolex Index", values:[100,101,102,104,103,105], color:"#3ea7ff"},
      {name:"Patek Index", values:[100,100,101,101,102,103], color:"#7dd3a6"},
      {name:"Ferrari Index", values:[100,101,100,101,103,104], color:"#f97316"}
    ]
  },
  correlation:{
    labels:["Rolex Spread","Patek Spread","BTC","US10Y","Nasdaq"],
    matrix:[
      [ 1.00,  0.72,  0.28, -0.35,  0.18],
      [ 0.72,  1.00,  0.31, -0.29,  0.11],
      [ 0.28,  0.31,  1.00, -0.18,  0.64],
      [-0.35, -0.29, -0.18,  1.00, -0.27],
      [ 0.18,  0.11,  0.64, -0.27,  1.00]
    ]
  },
  brands:{
    brands:["Rolex","Patek Philippe","Audemars Piguet","Richard Mille"],
    share:[35,25,20,20],
    premium:[28,35,22,55]
  }
};

// ---------- Renderer: Retail ----------
function renderRetail(){
  // ELECTRONICS
  const target = $('#elec');
  const legend = $('#elec-legend');
  if(target){
    const d = state.retail || Fallback.retail;
    const traces = d.products.map((p, i)=>({
      x: d.time, y: d.demand[i], type:'scatter', mode:'lines+markers', name:p
    }));
    const layout = {
      template:'plotly_dark', height:300,
      margin:{l:40,r:10,t:10,b:35},
      xaxis:{title:'Zeit'}, yaxis:{title:'Nachfrage-Index'}
    };
    Plotly.react(target, traces, layout, {displayModeBar:false});
    if(legend){
      legend.innerHTML = d.products.map((p,i)=>`<span class="lg">${p}</span>`).join(' ');
    }
  }

  // FMCG (Bar)
  const fmcg = $('#fmcg');
  if(fmcg){
    const d = state.retail || Fallback.retail;
    // simple Bar: letzter Zeitstempel pro Produkt
    const last = d.time.length-1;
    const vals = d.products.map((p,i)=> d.demand[i][last]);
    const trace = [{x:d.products, y:vals, type:'bar'}];
    const layout = {template:'plotly_dark', height:300, margin:{l:40,r:10,t:10,b:40}, yaxis:{title:'Index'}};
    Plotly.react(fmcg, trace, layout, {displayModeBar:false});
  }
}

// ---------- Renderer: Beauty ----------
function renderBeauty(){
  const target = $('#beauty-line');
  const legend = $('#beauty-legend');
  if(!target) return;
  const d = state.beauty || Fallback.beauty;
  const traces = d.products.map((p,i)=>({
    x:d.time, y:d.buzz[i], type:'scatter', mode:'lines+markers', name:p
  }));
  const layout = {
    template:'plotly_dark', height:320,
    margin:{l:40,r:10,t:10,b:35},
    xaxis:{title:'Zeit'}, yaxis:{title:'Buzz-Index'}
  };
  Plotly.react(target, traces, layout, {displayModeBar:false});
  if(legend){
    legend.innerHTML = d.products.map(p=>`<span class="lg">${p}</span>`).join(' ');
  }
}

// ---------- Renderer: Supplements ----------
function renderSupp(){
  const target = $('#supp-stacked');
  if(!target) return;
  const d = state.supp || Fallback.supp;
  // gestapelte Balken: pro Kategorie die Verteilung über Channels
  const traces = d.channels.map((ch, colIdx)=>({
    x: d.categories,
    y: d.share.map(row=> row[colIdx]),
    name: ch,
    type: 'bar'
  }));
  const layout = {
    template:'plotly_dark', height:320, barmode:'stack',
    margin:{l:40,r:10,t:10,b:60},
    xaxis:{title:'Kategorie'}, yaxis:{title:'Marktanteil (%)', rangemode:'tozero'}
  };
  Plotly.react(target, traces, layout, {displayModeBar:false});
}

// ---------- Renderer: Finance ----------
function renderFinance(){
  const target = $('#finance-dual');
  if(!target) return;
  const d = state.finance || Fallback.finance;

  const priceTraces = Object.keys(d.price).map((k)=>({
    x: d.time, y: d.price[k], name: `${k} Price`, type:'scatter', mode:'lines'
  }));
  const sentTraces = Object.keys(d.sentiment).map((k)=>({
    x: d.time, y: d.sentiment[k], name: `${k} Sentiment`, type:'scatter', mode:'lines', yaxis:'y2', line:{dash:'dot'}
  }));

  const layout = {
    template:'plotly_dark', height:340,
    margin:{l:50,r:50,t:10,b:35},
    xaxis:{title:'Zeit'},
    yaxis:{title:'Preis'},
    yaxis2:{title:'Sentiment', overlaying:'y', side:'right', rangemode:'tozero'}
  };
  Plotly.react(target, [...priceTraces, ...sentTraces], layout, {displayModeBar:false});
}

// ---------- Renderer: Luxury ----------
function renderLuxury(){
  // Watches
  const w = $('#lux-watches');
  const a = $('#lux-autos');
  const y = $('#lux-yachts');

  if(w){
    const d = (state.luxury && state.luxury.watches) || Fallback.luxury.watches;
    const traces = [
      {x:d.brands, y:d.msrp,      name:'MSRP',      type:'bar'},
      {x:d.brands, y:d.secondary, name:'Secondary', type:'bar'}
    ];
    Plotly.react(w, traces, {
      template:'plotly_dark', height:280, barmode:'group',
      margin:{l:50,r:10,t:10,b:60}, yaxis:{title:'Preis'}
    }, {displayModeBar:false});
  }
  if(a){
    const d = (state.luxury && state.luxury.autos) || Fallback.luxury.autos;
    const traces = [
      {x:d.brands, y:d.msrp,      name:'MSRP',      type:'bar'},
      {x:d.brands, y:d.secondary, name:'Secondary', type:'bar'}
    ];
    Plotly.react(a, traces, {
      template:'plotly_dark', height:280, barmode:'group',
      margin:{l:50,r:10,t:10,b:60}, yaxis:{title:'Preis'}
    }, {displayModeBar:false});
  }
  if(y){
    const d = (state.luxury && state.luxury.yachts) || Fallback.luxury.yachts;
    const traces = [
      {x:d.brands, y:d.msrp,      name:'MSRP',      type:'bar'},
      {x:d.brands, y:d.secondary, name:'Secondary', type:'bar'}
    ];
    Plotly.react(y, traces, {
      template:'plotly_dark', height:280, barmode:'group',
      margin:{l:50,r:10,t:10,b:60}, yaxis:{title:'Preis'}
    }, {displayModeBar:false});
  }
}

// ---------- Renderer: Portfolio ----------
function renderPortfolio() {
  const el = document.getElementById('pf-forecast');
  if (!el) return;
  const d = state.portfolio || Fallback.portfolio;
  const traces = d.series.map(s => ({
    x: d.time, y: s.values, name: s.name, type:'scatter', mode:'lines+markers',
    line:{width:2, color:s.color || undefined}
  }));
  const layout = {
    template:'plotly_dark', height:300,
    margin:{l:40,r:10,t:10,b:35},
    xaxis:{title:'Horizon'}, yaxis:{title:'Index'}
  };
  Plotly.react(el, traces, layout, {displayModeBar:false});

  // KPI badges (Demo)
  const s = d.series;
  const avgSpread = '—';
  $('#pf-spread') && ($('#pf-spread').textContent = avgSpread);
  $('#pf-liq')    && ($('#pf-liq').textContent    = '—');
  $('#pf-vol')    && ($('#pf-vol').textContent    = '—');
}

// ---------- Renderer: Correlation ----------
function renderCorrelation() {
  const el = document.getElementById('matrix-grid');
  if (!el) return;
  const d = state.correlation || Fallback.correlation;
  const trace = {
    z: d.matrix, x: d.labels, y: d.labels, type:'heatmap',
    colorscale: [[0,'#0f172a'],[0.5,'#3b82f6'],[1,'#22c55e']],
    zmin:-1, zmax:1, showscale:true
  };
  const layout = {
    template:'plotly_dark', height:360,
    margin:{l:80,r:30,t:10,b:80},
    xaxis:{tickangle:-30}, yaxis:{automargin:true}
  };
  Plotly.react(el,[trace],layout,{displayModeBar:false});
}

// ---------- Renderer: Brand Cockpit ----------
function renderBrands(brand) {
  const elShare   = document.getElementById('brand-share');
  const elPremium = document.getElementById('brand-premium');
  if (!elShare || !elPremium) return;

  const db = state.brands || Fallback.brands;
  const b  = brand || ($('#brand-sel')?.value) || db.brands[0];

  const tShare = [{
    x: db.brands, y: db.share, type:'bar', marker:{color:'#3ea7ff'}
  }];
  const lShare = {
    template:'plotly_dark', height:260,
    margin:{l:40,r:10,t:10,b:40},
    yaxis:{title:'Market Share (%)'}
  };
  const tPrem = [{
    x: db.brands, y: db.premium, type:'bar', marker:{color:'#22c55e'}
  }];
  const lPrem = {
    template:'plotly_dark', height:260,
    margin:{l:40,r:10,t:10,b:40},
    yaxis:{title:'Premium vs. MSRP (%)'}
  };

  Plotly.react(elShare, tShare, lShare, {displayModeBar:false});
  Plotly.react(elPremium, tPrem, lPrem, {displayModeBar:false});
}

// ---------- Controls ----------
function bindControls(){
  const brandSel = $('#brand-sel');
  if(brandSel){
    brandSel.addEventListener('change', ()=> renderBrands(brandSel.value));
  }
}

// ---------- Timer (optional, Anzeige oben) ----------
let tabTimerInt = null;
function startTabTimer(){
  const el = $('#tabTimer');
  if(!el) return;
  let s = 0;
  clearInterval(tabTimerInt);
  tabTimerInt = setInterval(()=>{
    s++;
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s % 60).padStart(2,'0');
    el.textContent = `Tab-Zeit: ${mm}:${ss}`;
  }, 1000);
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', async ()=>{
  initGate();
  initTopButtons();
  createHealthPanel();

  // Ziel-Dateien in Health initialisieren
  ['data/retail.json','data/beauty.json','data/supplements.json','data/finance.json',
   'data/luxury.json','data/portfolio.json','data/correlation.json','data/brands.json']
   .forEach(p => HEALTH.files[p] = '…');

  // JSONs laden (fehler-tolerant, mit Fallbacks)
  const [r,b,s,f,l,p,c,br] = await Promise.all([
    loadJSONChecked('data/retail.json'),
    loadJSONChecked('data/beauty.json'),
    loadJSONChecked('data/supplements.json'),
    loadJSONChecked('data/finance.json'),
    loadJSONChecked('data/luxury.json'),
    loadJSONChecked('data/portfolio.json'),
    loadJSONChecked('data/correlation.json'),
    loadJSONChecked('data/brands.json')
  ]);

  state.retail      = r || Fallback.retail;
  state.beauty      = b || Fallback.beauty;
  state.supp        = s || Fallback.supp;
  state.finance     = f || Fallback.finance;
  state.luxury      = l || Fallback.luxury;
  state.portfolio   = p || Fallback.portfolio;
  state.correlation = c || Fallback.correlation;
  state.brands      = br || Fallback.brands;

  bindTabs();
  bindControls();

  // Erste Ansicht rendern, falls App sichtbar ist (nach Gate)
  const appVisible = $('#app')?.style.display !== 'none';
  if(appVisible){
    renderRetail();
    renderBeauty();
    renderSupp();
    renderFinance();
    renderLuxury();
    renderPortfolio();
    renderCorrelation();
    renderBrands();
    startTabTimer();
  }
});
