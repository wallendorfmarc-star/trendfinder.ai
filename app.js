// === Brand Colors ===
const BRAND = {
  orange: '#FF7900',  // Trendfinder
  blue:   '#1436AE',  // TYCOONDATA
  gold:   '#D4AF37',  // Premium
  teal:   '#00AEEF',  // Akzent/Subline
  grey:   '#8892a6'
};

// Plotly Default Theme override (optional – einheitlicher Look)
const PLOTLY_LAYOUT_BASE = {
  margin:{l:60,r:20,t:10,b:40},
  paper_bgcolor:'#0A0D11',
  plot_bgcolor :'#0A0D11',
  font:{color:'#E6ECF8', family:'Inter, system-ui, -apple-system, Segoe UI, Roboto'},
  xaxis:{gridcolor:'#1C2230', zerolinecolor:'#1C2230', linecolor:'#2A3245'},
  yaxis:{gridcolor:'#1C2230', zerolinecolor:'#1C2230', linecolor:'#2A3245'},
  legend:{orientation:'h'}
};

// Helper: Layout zusammenführen
const mergeLayout = (custom)=>Object.assign({}, PLOTLY_LAYOUT_BASE, custom);

// Helper: Nummern hübsch
const fmt = (v)=> (typeof v==='number' ? (Math.round(v*100)/100) : v);

// === Util ===
async function loadJSON(path){ const r = await fetch(path); return r.json(); }
const fmt = (v)=> typeof v==='number' ? (Math.round(v*100)/100) : v;

// === State ===
const state = {
  retail:null, beauty:null, supp:null, finance:null, luxury:null,
  tab:'retail',
  windows:{'24':4,'48':3,'72':2,'96':1} // wie viele Punkte rückwärts abgeschnitten werden
};

// === Init ===
document.addEventListener('DOMContentLoaded', async ()=>{
  [state.retail,state.beauty,state.supp,state.finance,state.luxury] = await Promise.all([
    loadJSON('data/retail.json'),
    loadJSON('data/beauty.json'),
    loadJSON('data/supplements.json'),
    loadJSON('data/finance.json'),
    loadJSON('data/luxury.json')
  ]);

  bindTabs();
  bindControls();
  renderRetail();  // Starttab
});

// === Tabs ===
function bindTabs(){
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click', e=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tab = e.currentTarget.dataset.tab;
      state.tab = tab;
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
      // Render switch
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

// === Controls (Zeitauswahl) ===
function bindControls(){
  const map = [
    ['elec-time', renderRetail],
    ['beauty-time', renderBeauty]
  ];
  map.forEach(([id,fn])=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', fn);
  });
}

// === Retail ===
function renderRetail(){
  const d = state.retail;
  // Electronics line chart
  const sel = document.getElementById('elec-time');
  const cut = sel ? state.windows[sel.value]||0 : 0;
  const time = d.electronics.time.slice(cut);
  const traces = Object.keys(d.electronics.series).map(k=>({
    x: time,
    y: d.electronics.series[k].slice(cut),
    name: k,
    type:'scatter',
    mode:'lines+markers',
    line:{width:3, color:d.electronics.legend[k]}
  }));
  Plotly.newPlot('elec', traces, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit', tickangle:-20},
    yaxis:{title:d.electronics.units, rangemode:'tozero'},
    legend:{orientation:'h'},
    hovermode:'x unified'
  },{displayModeBar:false});

  // FMCG index (multi-series)
  const t2 = Object.keys(d.fmcg.series).map(k=>({
    x: d.fmcg.time, y: d.fmcg.series[k], name:k, type:'scatter', mode:'lines+markers'
  }));
  Plotly.newPlot('fmcg', t2, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit'},
    yaxis:{title:d.fmcg.units},
    legend:{orientation:'h'},
    hovermode:'x unified'
  },{displayModeBar:false});

  // Legende Farben
  const legend = document.getElementById('elec-legend');
  if(legend){
    legend.innerHTML = Object.entries(d.electronics.legend)
      .map(([k,c])=>`<span class="lg" style="--c:${c}"></span>${k}`).join(' ');
  }
}

// === Beauty ===
function renderBeauty(){
  const d = state.beauty;
  const sel = document.getElementById('beauty-time');
  const cut = sel ? state.windows[sel.value]||0 : 0;
  const time = d.time.slice(cut);
  const keys = Object.keys(d.series);
  const traces = keys.map(k=>({
    x: time, y: d.series[k].slice(cut), name:k, type:'scatter', mode:'lines+markers',
    line:{width:3, color: d.legend[k]}
  }));
  Plotly.newPlot('beauty-line', traces, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit', tickangle:-20},
    yaxis:{title:d.units},
    legend:{orientation:'h'},
    hovermode:'x unified'
  },{displayModeBar:false});

  // Legende Farben
  const legend = document.getElementById('beauty-legend');
  if(legend){
    legend.innerHTML = Object.entries(d.legend)
      .map(([k,c])=>`<span class="lg" style="--c:${c}"></span>${k}`).join(' ');
  }
}

// === Supplements (stacked area/Bar) ===
function renderSupp(){
  const d = state.supp;
  const cats = Object.keys(d.stacked);
  const traces = cats.map((k,i)=>({
    x: d.time, y: d.stacked[k], name:k, type:'bar', stackgroup:'a' // stacked
  }));
  Plotly.newPlot('supp-stacked', traces, {
    barmode:'stack',
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Quartal'},
    yaxis:{title:d.units, rangemode:'tozero'},
    legend:{orientation:'h'}
  },{displayModeBar:false});
}

// === Finance (Dual Axis: Preis + Sentiment) ===
function renderFinance(){
  const d = state.finance;
  const t = d.time;
  const asset = 'BTC'; // Default – du kannst Dropdown einführen
  const px = {
    x: t, y: d.assets[asset].price, name:`${asset} Preis`, type:'scatter', mode:'lines+markers',
    yaxis:'y1'
  };
  const sent = {
    x: t, y: d.assets[asset].sent, name:`${asset} Sentiment`, type:'scatter', mode:'lines+markers',
    yaxis:'y2'
  };
  Plotly.newPlot('finance-dual', [px, sent], {
    margin:{l:60,r:60,t:10,b:40},
    xaxis:{title:'Zeit', tickangle:-20},
    yaxis:{title:d.units_price, side:'left'},
    yaxis2:{title:d.units_sent, overlaying:'y', side:'right', rangemode:'normal'},
    legend:{orientation:'h'},
    hovermode:'x unified'
  },{displayModeBar:false});
}

// === Luxury (MSRP vs Secondary, Spread) ===
function renderLuxury(){
  const d = state.luxury;
  // Watches
  const time = d.time;
  const tracesW = [];
  Object.entries(d.watches).forEach(([brand,obj])=>{
    tracesW.push({x:time,y:obj.msrp,name:`${brand} MSRP`,type:'scatter',mode:'lines',line:{dash:'dot'}});
    tracesW.push({x:time,y:obj.sec,name:`${brand} Secondary`,type:'scatter',mode:'lines+markers'});
  });
  Plotly.newPlot('lux-watches', tracesW, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit'},
    yaxis:{title:d.units.price},
    legend:{orientation:'h'},
    hovermode:'x unified'
  },{displayModeBar:false});

  // Autos
  const tracesA = [];
  Object.entries(d.autos).forEach(([brand,obj])=>{
    tracesA.push({x:time,y:obj.msrp,name:`${brand} MSRP`,type:'scatter',mode:'lines',line:{dash:'dot'}});
    tracesA.push({x:time,y:obj.sec,name:`${brand} Secondary`,type:'scatter',mode:'lines+markers'});
  });
  Plotly.newPlot('lux-autos', tracesA, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit'},
    yaxis:{title:d.units.price},
    legend:{orientation:'h'}
  },{displayModeBar:false});

  // Yachten
  const tracesY = [];
  Object.entries(d.yachts).forEach(([brand,obj])=>{
    tracesY.push({x:time,y:obj.msrp,name:`${brand} MSRP`,type:'scatter',mode:'lines',line:{dash:'dot'}});
    tracesY.push({x:time,y:obj.sec,name:`${brand} Secondary`,type:'scatter',mode:'lines+markers'});
  });
  Plotly.newPlot('lux-yachts', tracesY, {
    margin:{l:60,r:20,t:10,b:40},
    xaxis:{title:'Zeit'},
    yaxis:{title:d.units.price},
    legend:{orientation:'h'}
  },{displayModeBar:false});
}
