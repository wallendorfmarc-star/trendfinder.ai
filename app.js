/* Trendfinder v7 – app.js (Passwort=7707) */

const $  = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));
const state = {retail:null,beauty:null,supp:null,finance:null,luxury:null,portfolio:null,correlation:null,brands:null};

// ---------- Password Gate ----------
function initGate(){
  const gate=$('#gate'); const app=$('#app');
  const form=$('#gateForm'); const inp=$('#pass'); const msg=$('#gateMsg');
  if(!form) return;
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const v=(inp.value||'').trim();
    if(v==='7707'){ gate.style.display='none'; app.style.display='grid'; msg.textContent=''; initialRender(); }
    else msg.textContent='Falsches Passwort.';
  });
}

// ---------- Tabs ----------
function bindTabs(){
  const tabs=$$('.tab'), sections=$$('.section');
  tabs.forEach(t=>{
    t.addEventListener('click',()=>{
      const id=t.dataset.tab;
      tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
      sections.forEach(s=>s.classList.toggle('active',s.id===id));
      switch(id){
        case 'retail':renderRetail();break;
        case 'beauty':renderBeauty();break;
        case 'supplements':renderSupp();break;
        case 'finance':renderFinance();break;
        case 'luxury':renderLuxury();break;
        case 'portfolio':renderPortfolio();break;
        case 'matrix':renderCorrelation();break;
        case 'brand':renderBrands();break;
      }
    });
  });
}

// ---------- Health & Loader ----------
const HEALTH={files:{},dom:{'elec':1,'fmcg':1,'beauty-line':1,'supp-stacked':1,'finance-dual':1,'lux-watches':1,'lux-autos':1,'lux-yachts':1,'pf-forecast':1,'matrix-grid':1,'brand-share':1,'brand-premium':1}};
function createHealthPanel(){ if($('#healthPanel')) return; const p=document.createElement('div'); p.id='healthPanel'; p.style.cssText="position:fixed;right:14px;bottom:14px;z-index:9999;background:#111c33;color:#d1e9ff;font:12px Inter; padding:10px;border-radius:10px"; p.innerHTML="<b>Health</b><div id=hpPlotly></div><div id=hpFiles></div><div id=hpDom></div>"; document.body.appendChild(p); updateHealthPanel();}
function updateHealthPanel(){const ok=s=>`<span style=color:#7bf77b>OK</span> ${s}`,fail=s=>`<span style=color:#ff7b7b>FEHLT</span> ${s}`;$('#hpPlotly').innerHTML="Plotly: "+(window.Plotly?ok('geladen'):fail('fehlt'));$('#hpFiles').innerHTML=Object.entries(HEALTH.files).map(([k,v])=>v===true?ok(k):v===false?fail(k):'… '+k).join('<br>');$('#hpDom').innerHTML=Object.keys(HEALTH.dom).map(id=>document.getElementById(id)?ok('#'+id):fail('#'+id)).join('<br>');}
async function loadJSONChecked(path){try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error();const j=await r.json();HEALTH.files[path]=true;updateHealthPanel();return j;}catch{HEALTH.files[path]=false;updateHealthPanel();return null;}}

// ---------- Renderer-Funktionen (gekürzt Demo) ----------
function renderRetail(){ /* dein Chartcode hier (wie vorher) */ }
function renderBeauty(){ /* … */ }
function renderSupp(){ /* … */ }
function renderFinance(){ /* … mit Signals … */ }
function renderLuxury(){ /* … */ }
function renderPortfolio(){ /* … */ }
function renderCorrelation(){ /* … */ }
function renderBrands(){ /* … */ }

// ---------- Initial Render ----------
function initialRender(){renderRetail();renderBeauty();renderSupp();renderFinance();renderLuxury();renderPortfolio();renderCorrelation();renderBrands();}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded',async()=>{
  initGate(); createHealthPanel(); bindTabs();
  ['data/retail.json','data/beauty.json','data/supplements.json','data/finance.json','data/luxury.json','data/portfolio.json','data/correlation.json','data/brands.json'].forEach(p=>HEALTH.files[p]='…');
  const [r,b,s,f,l,p,c,br]=await Promise.all([
    loadJSONChecked('data/retail.json'),loadJSONChecked('data/beauty.json'),
    loadJSONChecked('data/supplements.json'),loadJSONChecked('data/finance.json'),
    loadJSONChecked('data/luxury.json'),loadJSONChecked('data/portfolio.json'),
    loadJSONChecked('data/correlation.json'),loadJSONChecked('data/brands.json')
  ]);
  state.retail=r; state.beauty=b; state.supp=s; state.finance=f; state.luxury=l; state.portfolio=p; state.correlation=c; state.brands=br;
});
