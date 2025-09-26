/* ==============================
   Trendfinder v7 – app.js (Passwort=7707, Compare + Signals)
   ============================== */

/* ----- Helpers ----- */
const $  = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));

const state = {
  retail:null, beauty:null, supp:null, finance:null,
  luxury:null, portfolio:null, correlation:null, brands:null
};

/* ----- Password Gate ----- */
function initGate(){
  const gate=$('#gate'), app=$('#app');
  const form=$('#gateForm'), inp=$('#pass'), msg=$('#gateMsg');
  if(!form) return;
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const v=(inp.value||'').trim();
    if(v==='7707'){ gate.style.display='none'; app.style.display='grid'; msg.textContent=''; initialRender(); }
    else { msg.textContent='Falsches Passwort.'; }
  });
}

/* ----- Top Buttons / Modal ----- */
function initTopButtons(){
  $('#theme')?.addEventListener('click',()=>document.body.classList.toggle('light'));
  $('#share')?.addEventListener('click', async ()=>{
    const url=location.href;
    try{ await navigator.clipboard.writeText(url); alert('Link kopiert: '+url); }
    catch{ alert('Link: '+url); }
  });
  $('#memo')?.addEventListener('click',()=>window.print());

  const modal=$('#alertModal');
  $('#alert')?.addEventListener('click',()=>modal.style.display='flex');
  $('#closeAlert')?.addEventListener('click',()=>modal.style.display='none');
  $('#saveEML')?.addEventListener('click',()=>{
    const blob=new Blob(["From: alerts@trendfinder.ai\nSubject: Trendfinder Alert\n\nSignal …"],{type:'message/rfc822'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='trendfinder_alert.eml'; a.click(); URL.revokeObjectURL(url);
  });
}

/* ----- Tabs ----- */
function bindTabs(){
  const tabs=$$('.tab'), sections=$$('.section');
  tabs.forEach(t=>{
    t.addEventListener('click',()=>{
      const id=t.dataset.tab;
      tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
      sections.forEach(s=>s.classList.toggle('active', s.id===id));
      switch(id){
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

/* ----- Health Panel + Loader ----- */
const HEALTH={files:{},dom:{
  'elec':1,'fmcg':1,'beauty-line':1,'supp-stacked':1,'finance-dual':1,
  'lux-watches':1,'lux-autos':1,'lux-yachts':1,'pf-forecast':1,
  'matrix-grid':1,'brand-share':1,'brand-premium':1
}};
function createHealthPanel(){
  if($('#healthPanel')) return;
  const p=document.createElement('div'); p.id='healthPanel';
  p.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;background:rgba(13,18,28,.92);color:#d1e9ff;font:12px Inter,system-ui;padding:10px 12px;border:1px solid #203043;border-radius:10px;width:270px;box-shadow:0 6px 24px rgba(0,0,0,.35)';
  p.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:6px"><strong>Health Check</strong><button id="hpClose" style="background:#122033;border:0;color:#9ad3ff;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button></div><div id="hpPlotly"></div><div id="hpFiles" style="margin-top:6px"></div><div id="hpDom" style="margin-top:6px"></div><div style="margin-top:6px;color:#6aa9ff">Toggle: H</div>`;
  document.body.appendChild(p);
  $('#hpClose').onclick=()=>p.style.display='none';
  document.addEventListener('keydown',(e)=>{if(e.key.toLowerCase()==='h'){p.style.display=(p.style.display==='none'?'block':'none');}});
  updateHealthPanel();
}
function updateHealthPanel(){
  const ok=s=>`<span style="color:#7bf77b">OK</span> ${s}`, fail=s=>`<span style="color:#ff7b7b">FEHLT</span> ${s}`;
  $('#hpPlotly').innerHTML=`<strong>Plotly:</strong> ${window.Plotly?ok('geladen'):fail('fehlt')}`;
  $('#hpFiles').innerHTML=`<strong>Data Files:</strong><br>`+Object.entries(HEALTH.files).map(([k,v])=>v===true?ok(k):v===false?fail(k):'… '+k).join('<br>');
  $('#hpDom').innerHTML=`<strong>DOM Targets:</strong><br>`+Object.keys(HEALTH.dom).map(id=>document.getElementById(id)?ok('#'+id):fail('#'+id)).join('<br>');
}
async function loadJSONChecked(path){
  try{ const r=await fetch(path,{cache:'no-store'}); if(!r.ok) throw new Error(`${path} → ${r.status}`);
       const j=await r.json(); HEALTH.files[path]=true; updateHealthPanel(); return j; }
  catch(e){ console.warn('Load fail',path,e); HEALTH.files[path]=false; updateHealthPanel(); return null; }
}

/* ----- Fallback-Daten ----- */
const Fallback={
  retail:{products:["Smartphone","Laptop","Tablet","Smartwatch"], time:["2025-09-20","2025-09-21","2025-09-22","2025-09-23"], demand:[[120,150,170,160],[80,95,110,130],[60,65,70,75],[40,55,50,60]]},
  beauty:{products:["Serum","Cream","Mask","Cleanser"], time:["2025-09-20","2025-09-21","2025-09-22","2025-09-23"], buzz:[[200,210,220,230],[160,162,165,170],[80,85,95,100],[90,88,92,96]]},
  supp:{channels:["Amazon","Retail","D2C"], categories:["Protein","Omega-3","Ashwagandha","Creatine"], share:[[40,30,30],[20,30,50],[10,15,75],[35,45,20]]},
  finance:{time:["2025-09-20","2025-09-21","2025-09-22","2025-09-23"], price:{BTC:[61000,61500,61200,62000], ETH:[3100,3150,3140,3180], Tesla:[240,242,238,241], Nvidia:[470,475,480,478]}, sentiment:{BTC:[45,46,47,48], ETH:[42,44,43,45], Tesla:[51,49,50,52], Nvidia:[55,56,57,57]}},
  luxury:{watches:{brands:["Rolex","Patek Philippe","Audemars Piguet","Richard Mille"],msrp:[9000,30000,26000,160000],secondary:[14000,42000,38000,320000]}, autos:{brands:["Ferrari","Lamborghini","Rolls-Royce","Bentley"],msrp:[280000,300000,420000,320000],secondary:[420000,450000,380000,350000]}, yachts:{brands:["Feadship","Lürssen","Benetti","Sunseeker"],msrp:[50000000,70000000,35000000,15000000],secondary:[48000000,68000000,34000000,14000000]}},
  portfolio:{time:["T-3","T-2","T-1","T0","T+1","T+2"], series:[{name:"Rolex Index",values:[100,101,102,104,103,105],color:"#3ea7ff"},{name:"Patek Index",values:[100,100,101,101,102,103],color:"#7dd3a6"},{name:"Ferrari Index",values:[100,101,100,101,103,104],color:"#f97316"}]},
  correlation:{labels:["Rolex Spread","Patek Spread","BTC","US10Y","Nasdaq"], matrix:[[1,0.72,0.28,-0.35,0.18],[0.72,1,0.31,-0.29,0.11],[0.28,0.31,1,-0.18,0.64],[-0.35,-0.29,-0.18,1,-0.27],[0.18,0.11,0.64,-0.27,1]]},
  brands:{brands:["Rolex","Patek Philippe","Audemars Piguet","Richard Mille"], share:[35,25,20,20], premium:[28,35,22,55]}
};

/* ----- Toast + Alerts ----- */
function toast(msg, type='info'){
  let c=$('#toastWrap'); if(!c){ c=document.createElement('div'); c.id='toastWrap'; c.style.cssText='position:fixed;right:16px;top:16px;z-index:9999;display:flex;flex-direction:column;gap:8px'; document.body.appendChild(c);}
  const t=document.createElement('div'); const bg=type==='buy'?'#0f5132':type==='sell'?'#842029':'#0b3d60';
  t.style.cssText=`background:${bg};color:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.3);font:13px Inter`; t.textContent=msg; c.appendChild(t);
  setTimeout(()=>t.remove(),5500);
}
function raiseAlert(message, severity='info'){
  $('#alertText') && ($('#alertText').textContent=message);
  toast(message, severity==='buy'?'buy':severity==='sell'?'sell':'info');
}

/* ----- Math: SMA / RSI / Signals ----- */
const SMA=(arr,n)=>arr.map((_,i)=> i+1<n?null: (arr.slice(i+1-n,i+1).reduce((a,b)=>a+b,0)/n));
function RSI(values,p=14){
  let gains=0, losses=0; const rsi=Array(values.length).fill(null);
  for(let i=1;i<values.length;i++){
    const diff=values[i]-values[i-1];
    if(i<=p){ if(diff>=0) gains+=diff; else losses-=diff; if(i===p){const rs=gains/(losses||1); rsi[i]=100-(100/(1+rs));}}
    else{ const d=values[i]-values[i-1]; const g=Math.max(d,0), l=Math.max(-d,0);
      gains=(gains*(p-1)+g)/p; losses=(losses*(p-1)+l)/p; const rs=gains/(losses||1); rsi[i]=100-(100/(1+rs)); }
  } return rsi;
}
function detectSignals(price, lookback=20){
  const sma20=SMA(price,20), sma50=SMA(price,50), rsi=RSI(price,14);
  const highs=price.map((_,i)=> i<lookback? null : Math.max(...price.slice(i-lookback,i+1)));
  const lows =price.map((_,i)=> i<lookback? null : Math.min(...price.slice(i-lookback,i+1)));
  const buys=[], sells=[];
  for(let i=1;i<price.length;i++){
    if(sma20[i-1]&&sma50[i-1]){
      if(sma20[i-1]<=sma50[i-1] && sma20[i]>sma50[i]) buys.push({i,type:'SMA Cross ↑'});
      if(sma20[i-1]>=sma50[i-1] && sma20[i]<sma50[i]) sells.push({i,type:'SMA Cross ↓'});
    }
    if(rsi[i]!==null){ if(rsi[i]<30) buys.push({i,type:'RSI < 30'}); if(rsi[i]>70) sells.push({i,type:'RSI > 70'}); }
    if(highs[i] && price[i]===highs[i]) buys.push({i,type:`Breakout ${lookback}`});
    if(lows[i]  && price[i]===lows[i])  sells.push({i,type:`Breakdown ${lookback}`});
  }
  return {buys,sells,sma20,sma50,rsi};
}

/* ----- Compare UI helper ----- */
function ensureCompareSelect(idBase, items){
  const host = $(`#${idBase}-legend`)?.parentElement?.querySelector('.controls') || null;
  if(!host) return null;
  let sel = $(`#${idBase}-compare`);
  if(!sel){
    sel = document.createElement('select'); sel.id=`${idBase}-compare`; sel.className='select';
    host.insertBefore(sel, host.querySelector('.dropdown') || null);
  }
  sel.innerHTML = `<option value="">Vergleiche mit …</option>` + items.map((p,i)=>`<option value="${i}">${p}</option>`).join('');
  return sel;
}
const ratioSeries=(a,b)=>a.map((v,i)=> b[i]===0? null : (v/b[i])*100);

/* ----- RENDER: Retail (mit Compare) ----- */
function renderRetail(){
  const d=state.retail||Fallback.retail;
  const t=$('#elec'), lg=$('#elec-legend'), selProd=$('#elec-product');
  const selCmp=ensureCompareSelect('elec', d.products);

  if(selProd && selProd.options.length===0)
    selProd.innerHTML=d.products.map((p,i)=>`<option value="${i}">${p}</option>`).join('');

  const prodIdx=Number(selProd?.value ?? 0);
  const cmpIdx =selCmp && selCmp.value!=='' ? Number(selCmp.value) : null;

  let traces;
  if(cmpIdx!==null && cmpIdx!==prodIdx){
    const r=ratioSeries(d.demand[prodIdx], d.demand[cmpIdx]);
    traces=[
      {x:d.time, y:d.demand[cmpIdx], name:d.products[cmpIdx], type:'scatter', mode:'lines', line:{color:'#80808055'}},
      {x:d.time, y:d.demand[prodIdx], name:d.products[prodIdx], type:'scatter', mode:'lines', line:{color:'#80808055'}},
      {x:d.time, y:r, name:`${d.products[prodIdx]} / ${d.products[cmpIdx]} ×100`, type:'scatter', mode:'lines+markers', line:{width:3,color:'#3ea7ff'}}
    ];
  }else{
    traces=d.products.map((p,i)=>({x:d.time,y:d.demand[i],name:p,type:'scatter',mode:'lines+markers'}));
  }
  Plotly.react(t,traces,{template:'plotly_dark',height:300,margin:{l:40,r:10,t:10,b:35},xaxis:{title:'Zeit'},yaxis:{title: cmpIdx!==null?'Ratio-Index (×100)':'Nachfrage-Index'}},{displayModeBar:false});
  if(lg) lg.innerHTML=(cmpIdx!==null?['<span class="lg">Ratio</span>']:d.products.map(p=>`<span class="lg">${p}</span>`)).join(' ');

  selProd?.addEventListener('change',()=>renderRetail());
  selCmp?.addEventListener('change',()=>renderRetail());

  // FMCG (Bar – letzter Punkt)
  const f=$('#fmcg'); if(f){
    const last=d.time.length-1; const vals=d.products.map((p,i)=>d.demand[i][last]);
    Plotly.react(f,[{x:d.products,y:vals,type:'bar'}],{template:'plotly_dark',height:300,margin:{l:40,r:10,t:10,b:50},yaxis:{title:'Index'}},{displayModeBar:false});
  }
}

/* ----- RENDER: Beauty (mit Compare) ----- */
function renderBeauty(){
  const d=state.beauty||Fallback.beauty;
  const t=$('#beauty-line'), lg=$('#beauty-legend'), selProd=$('#beauty-product');
  const selCmp=ensureCompareSelect('beauty', d.products);

  if(selProd && selProd.options.length===0)
    selProd.innerHTML=d.products.map((p,i)=>`<option value="${i}">${p}</option>`).join('');

  const prodIdx=Number(selProd?.value ?? 0);
  const cmpIdx =selCmp && selCmp.value!=='' ? Number(selCmp.value) : null;

  let traces;
  if(cmpIdx!==null && cmpIdx!==prodIdx){
    const r=ratioSeries(d.buzz[prodIdx], d.buzz[cmpIdx]);
    traces=[
      {x:d.time, y:d.buzz[cmpIdx], name:d.products[cmpIdx], type:'scatter', mode:'lines', line:{color:'#80808055'}},
      {x:d.time, y:d.buzz[prodIdx], name:d.products[prodIdx], type:'scatter', mode:'lines', line:{color:'#80808055'}},
      {x:d.time, y:r, name:`${d.products[prodIdx]} / ${d.products[cmpIdx]} ×100`, type:'scatter', mode:'lines+markers', line:{width:3,color:'#22c55e'}}
    ];
  }else{
    traces=d.products.map((p,i)=>({x:d.time,y:d.buzz[i],name:p,type:'scatter',mode:'lines+markers'}));
  }
  Plotly.react(t,traces,{template:'plotly_dark',height:320,margin:{l:40,r:10,t:10,b:35},xaxis:{title:'Zeit'},yaxis:{title: cmpIdx!==null?'Ratio-Index (×100)':'Buzz-Index'}},{displayModeBar:false});
  if(lg) lg.innerHTML=(cmpIdx!==null?['<span class="lg">Ratio</span>']:d.products.map(p=>`<span class="lg">${p}</span>`)).join(' ');

  selProd?.addEventListener('change',()=>renderBeauty());
  selCmp?.addEventListener('change',()=>renderBeauty());
}

/* ----- RENDER: Supplements ----- */
function renderSupp(){
  const t=$('#supp-stacked'); if(!t) return;
  const d=state.supp||Fallback.supp;
  const traces=d.channels.map((ch,i)=>({x:d.categories, y:d.share.map(r=>r[i]), name:ch, type:'bar'}));
  Plotly.react(t,traces,{template:'plotly_dark',height:320,barmode:'stack',margin:{l:40,r:10,t:10,b:60},xaxis:{title:'Kategorie'},yaxis:{title:'Marktanteil (%)'}},{displayModeBar:false});
}

/* ----- RENDER: Finance (Signals) ----- */
function renderFinance(){
  const t=$('#finance-dual'); if(!t) return;
  const d=state.finance||Fallback.finance;
  const traces=[];

  Object.keys(d.price).forEach(asset=>{
    const px=d.price[asset], x=d.time.slice();
    const sig=detectSignals(px, Math.min(20, px.length));
    traces.push({x, y:px, type:'scatter', mode:'lines', name:`${asset} Price`});
    if(sig.sma20.some(v=>v!==null)) traces.push({x,y:sig.sma20,type:'scatter',mode:'lines',name:`${asset} SMA20`,line:{dash:'dot'}});
    if(sig.sma50.some(v=>v!==null)) traces.push({x,y:sig.sma50,type:'scatter',mode:'lines',name:`${asset} SMA50`,line:{dash:'dot'}});
    sig.buys.forEach(b=>{ traces.push({x:[x[b.i]],y:[px[b.i]],type:'scatter',mode:'markers',name:`${asset} BUY`,marker:{color:'#16a34a',symbol:'triangle-up',size:12}}); raiseAlert(`BUY ${asset} – ${b.type}`,'buy'); });
    sig.sells.forEach(s=>{ traces.push({x:[x[s.i]],y:[px[s.i]],type:'scatter',mode:'markers',name:`${asset} SELL`,marker:{color:'#dc2626',symbol:'triangle-down',size:12}}); raiseAlert(`SELL ${asset} – ${s.type}`,'sell'); });
  });

  Object.keys(d.sentiment).forEach(asset=>{
    traces.push({x:d.time, y:d.sentiment[asset], type:'scatter', mode:'lines', name:`${asset} Sentiment`, yaxis:'y2', line:{dash:'dash'}});
  });

  Plotly.react(t,traces,{template:'plotly_dark',height:360,margin:{l:50,r:50,t:10,b:40},xaxis:{title:'Zeit'},yaxis:{title:'Preis'},yaxis2:{title:'Sentiment',overlaying:'y',side:'right',rangemode:'tozero'}},{displayModeBar:false});
}

/* ----- RENDER: Luxury ----- */
function renderLuxury(){
  const d=state.luxury||Fallback.luxury;
  const W=$('#lux-watches'), A=$('#lux-autos'), Y=$('#lux-yachts');
  if(W) Plotly.react(W,[{x:d.watches.brands,y:d.watches.msrp,name:'MSRP',type:'bar'},{x:d.watches.brands,y:d.watches.secondary,name:'Secondary',type:'bar'}],{template:'plotly_dark',height:280,barmode:'group',margin:{l:50,r:10,t:10,b:60},yaxis:{title:'Preis'}},{displayModeBar:false});
  if(A) Plotly.react(A,[{x:d.autos.brands,y:d.autos.msrp,name:'MSRP',type:'bar'},{x:d.autos.brands,y:d.autos.secondary,name:'Secondary',type:'bar'}],{template:'plotly_dark',height:280,barmode:'group',margin:{l:50,r:10,t:10,b:60},yaxis:{title:'Preis'}},{displayModeBar:false});
  if(Y) Plotly.react(Y,[{x:d.yachts.brands,y:d.yachts.msrp,name:'MSRP',type:'bar'},{x:d.yachts.brands,y:d.yachts.secondary,name:'Secondary',type:'bar'}],{template:'plotly_dark',height:280,barmode:'group',margin:{l:50,r:10,t:10,b:60},yaxis:{title:'Preis'}},{displayModeBar:false});
}

/* ----- RENDER: Portfolio ----- */
function renderPortfolio(){
  const el=$('#pf-forecast'); if(!el) return;
  const d=state.portfolio||Fallback.portfolio;
  const traces=d.series.map(s=>({x:d.time,y:s.values,name:s.name,type:'scatter',mode:'lines+markers',line:{width:2,color:s.color||undefined}}));
  Plotly.react(el,traces,{template:'plotly_dark',height:300,margin:{l:40,r:10,t:10,b:35},xaxis:{title:'Horizon'},yaxis:{title:'Index'}},{displayModeBar:false});
  $('#pf-spread')?.textContent='—'; $('#pf-liq')?.textContent='—'; $('#pf-vol')?.textContent='—';
}

/* ----- RENDER: Correlation ----- */
function renderCorrelation(){
  const el=$('#matrix-grid'); if(!el) return;
  const d=state.correlation||Fallback.correlation;
  Plotly.react(el,[{z:d.matrix,x:d.labels,y:d.labels,type:'heatmap',colorscale:[[0,'#0f172a'],[0.5,'#3b82f6'],[1,'#22c55e']],zmin:-1,zmax:1,showscale:true}],
    {template:'plotly_dark',height:360,margin:{l:80,r:30,t:10,b:80},xaxis:{tickangle:-30},yaxis:{automargin:true}},{displayModeBar:false});
}

/* ----- RENDER: Brands ----- */
function renderBrands(){
  const share=$('#brand-share'), prem=$('#brand-premium'); if(!share||!prem) return;
  const db=state.brands||Fallback.brands;
  Plotly.react(share,[{x:db.brands,y:db.share,type:'bar',marker:{color:'#3ea7ff'}}],{template:'plotly_dark',height:260,margin:{l:40,r:10,t:10,b:40},yaxis:{title:'Market Share (%)'}},{displayModeBar:false});
  Plotly.react(prem,[{x:db.brands,y:db.premium,type:'bar',marker:{color:'#22c55e'}}],{template:'plotly_dark',height:260,margin:{l:40,r:10,t:10,b:40},yaxis:{title:'Premium vs. MSRP (%)'}},{displayModeBar:false});
}

/* ----- Controls ----- */
function bindControls(){
  $('#brand-sel')?.addEventListener('change',()=>renderBrands());
}

/* ----- Timer (optisch) ----- */
let tabTimerInt=null;
function startTabTimer(){ const el=$('#tabTimer'); if(!el) return; let s=0; clearInterval(tabTimerInt); tabTimerInt=setInterval(()=>{s++; el.textContent=`Tab-Zeit: ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},1000); }

/* ----- Initial Render ----- */
function initialRender(){
  renderRetail(); renderBeauty(); renderSupp(); renderFinance();
  renderLuxury(); renderPortfolio(); renderCorrelation(); renderBrands();
  startTabTimer();
}

/* ----- Boot ----- */
document.addEventListener('DOMContentLoaded', async ()=>{
  initGate(); initTopButtons(); createHealthPanel(); bindTabs();
  ['data/retail.json','data/beauty.json','data/supplements.json','data/finance.json','data/luxury.json','data/portfolio.json','data/correlation.json','data/brands.json'].forEach(p=>HEALTH.files[p]='…');

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
  state.retail=r||Fallback.retail; state.beauty=b||Fallback.beauty; state.supp=s||Fallback.supp;
  state.finance=f||Fallback.finance; state.luxury=l||Fallback.luxury; state.portfolio=p||Fallback.portfolio;
  state.correlation=c||Fallback.correlation; state.brands=br||Fallback.brands;

  // Falls Gate bereits offen
  if($('#app')?.style.display!=='none') initialRender();
});
