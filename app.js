// ===== Helpers =====
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const Q=new URLSearchParams(location.search); const qp=(n,f=null)=>Q.get(n)??f;

function desiredPassword(){ return qp('pw','investor2025'); }

(function gate(){
  const ok=localStorage.getItem('gate_ok_v70')==='1';
  if(ok){ $('#gate').style.display='none'; $('#app').style.display='flex'; initApp(); }
  else{
    $('#gateForm').addEventListener('submit',e=>{
      e.preventDefault();
      if($('#pass').value.trim()===desiredPassword()){
        localStorage.setItem('gate_ok_v70','1');
        $('#gate').style.display='none'; $('#app').style.display='flex'; initApp();
      }else{ const m=$('#gateMsg'); m.textContent='Falsches Passwort'; m.style.color='#ff7a59'; }
    });
  }
})();

// Theme
function initTheme(){ const saved=localStorage.getItem('theme')||'dark';
 document.documentElement.setAttribute('data-theme',saved);
 $('#theme').addEventListener('click',()=>{ const cur=document.documentElement.getAttribute('data-theme'); const next=cur==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',next); localStorage.setItem('theme',next); });}

// SVG utils
function createSVG(W,H){const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox',`0 0 ${W} ${H}`); return s;}
const linePath=pts=>pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');
function morphPath(el,to){ el.setAttribute('d',to); }

// Charts
function LineChart(el,series){const pad={l:48,t:22,r:12,b:28},W=el.clientWidth||640,H=300,w=W-pad.l-pad.r,h=H-pad.t-pad.b;
  el.innerHTML=''; const svg=createSVG(W,H); el.appendChild(svg);
  const all=series.flatMap(s=>s.data); const xs=all.map(d=>d.x), ys=all.map(d=>d.y);
  const xmin=Math.min(...xs), xmax=Math.max(...xs), ymin=Math.floor(Math.min(...ys)*0.95), ymax=Math.ceil(Math.max(...ys)*1.05);
  const sx=x=>pad.l+((x-xmin)/(xmax-xmin||1))*w, sy=y=>pad.t+(1-(y-ymin)/(ymax-ymin||1))*h;
  for(let i=0;i<5;i++){const y=pad.t+(i/4)*h; const gl=document.createElementNS(svg.namespaceURI,'line'); gl.setAttribute('x1',pad.l);gl.setAttribute('x2',pad.l+w);gl.setAttribute('y1',y);gl.setAttribute('y2',y);gl.setAttribute('stroke','var(--grid)'); svg.appendChild(gl);}
  series.forEach(s=>{const pts=s.data.map(d=>[sx(d.x),sy(d.y)]); const p=document.createElementNS(svg.namespaceURI,'path'); p.setAttribute('fill','none'); p.setAttribute('stroke',s.color); p.setAttribute('stroke-width','2.5'); p.setAttribute('opacity','.95'); p.setAttribute('d',linePath(pts)); svg.appendChild(p); s._el=p;});
  return{update(newS){ newS.forEach((s,i)=>{ const pts=s.data.map(d=>[sx(d.x),sy(d.y)]); morphPath(series[i]._el,linePath(pts)); }); },
         svg(){ return svg; },
         csv(){ const header=['x'].concat(series.map(s=>s.name)); const rows=[]; const L=series[0]?.data?.length||0; for(let i=0;i<L;i++){ rows.push([series[0].data[i].x].concat(series.map(s=>s.data[i].y.toFixed(2)))); } return [header].concat(rows); } }
}

function BarChart(el,cats,vals){const pad={l:48,t:22,r:12,b:46},W=el.clientWidth||640,H=300,w=W-pad.l-pad.r,h=H-pad.t-pad.b;
  el.innerHTML=''; const svg=createSVG(W,H); el.appendChild(svg); const vmax=Math.max(...vals,1), bw=w/vals.length*0.7;
  const xs=i=>pad.l+i*(w/vals.length)+(w/vals.length-bw)/2, sy=v=>pad.t+(1-v/vmax)*h;
  const xAxis=document.createElementNS(svg.namespaceURI,'line'); xAxis.setAttribute('x1',pad.l);xAxis.setAttribute('x2',pad.l+w);xAxis.setAttribute('y1',pad.t+h);xAxis.setAttribute('y2',pad.t+h);xAxis.setAttribute('stroke','var(--grid)'); svg.appendChild(xAxis);
  vals.forEach((v,i)=>{ const x=xs(i), y=sy(v), hh=pad.t+h-y; const r=document.createElementNS(svg.namespaceURI,'rect'); r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',bw); r.setAttribute('height',hh); r.setAttribute('rx','6'); r.setAttribute('fill','url(#gradBar)'); r.style.transition='y .4s ease,height .4s ease'; svg.appendChild(r);
    const t=document.createElementNS(svg.namespaceURI,'text'); t.setAttribute('x',x+bw/2); t.setAttribute('y',pad.t+h+16); t.setAttribute('text-anchor','middle'); t.setAttribute('font-size','11'); t.setAttribute('fill','var(--muted)'); t.textContent=cats[i]; svg.appendChild(t);});
  const defs=document.createElementNS(svg.namespaceURI,'defs'); const grad=document.createElementNS(svg.namespaceURI,'linearGradient'); grad.setAttribute('id','gradBar'); grad.setAttribute('x1','0'); grad.setAttribute('x2','1'); grad.setAttribute('y1','0'); grad.setAttribute('y2','1');
  const s1=document.createElementNS(svg.namespaceURI,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','var(--acc1)'); const s2=document.createElementNS(svg.namespaceURI,'stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','var(--acc2)'); grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);
  return{update(newVals){ const bars=svg.querySelectorAll('rect'); newVals.forEach((v,i)=>{ const y=sy(v),hh=pad.t+h-y; bars[i].setAttribute('y',y); bars[i].setAttribute('height',hh); }); },
         svg(){ return svg; },
         csv(){ return [['Category','Value']].concat(cats.map((c,i)=>[c,vals[i]])); } }
}

function DualY(el,price,senti){const pad={l:48,t:22,r:48,b:28},W=el.clientWidth||640,H=300,w=W-pad.l-pad.r,h=H-pad.t-pad.b;
  el.innerHTML=''; const svg=createSVG(W,H); el.appendChild(svg);
  const xs=price.map(d=>d.x), xmin=Math.min(...xs), xmax=Math.max(...xs);
  const py=price.map(d=>d.y), syArr=senti.map(d=>d.y);
  const pmin=Math.min(...py), pmax=Math.max(...py), smin=Math.min(...syArr), smax=Math.max(...syArr);
  const sx=x=>pad.l+((x-xmin)/(xmax-xmin||1))*w, spy=v=>pad.t+(1-(v-pmin)/(pmax-pmin||1))*h, ssy=v=>pad.t+(1-(v-smin)/(smax-smin||1))*h;
  for(let i=0;i<5;i++){const y=pad.t+(i/4)*h; const gl=document.createElementNS(svg.namespaceURI,'line'); gl.setAttribute('x1',pad.l);gl.setAttribute('x2',pad.l+w);gl.setAttribute('y1',y);gl.setAttribute('y2',y);gl.setAttribute('stroke','var(--grid)'); svg.appendChild(gl);}
  const la=document.createElementNS(svg.namespaceURI,'line'); la.setAttribute('x1',pad.l);la.setAttribute('x2',pad.l);la.setAttribute('y1',pad.t);la.setAttribute('y2',pad.t+h);la.setAttribute('stroke','var(--grid)'); svg.appendChild(la);
  const ra=document.createElementNS(svg.namespaceURI,'line'); ra.setAttribute('x1',pad.l+w);ra.setAttribute('x2',pad.l+w);ra.setAttribute('y1',pad.t);ra.setAttribute('y2',pad.t+h);ra.setAttribute('stroke','var(--grid)'); svg.appendChild(ra);
  const pPath=document.createElementNS(svg.namespaceURI,'path'); pPath.setAttribute('fill','none'); pPath.setAttribute('stroke','var(--acc1)'); pPath.setAttribute('stroke-width','2.5'); pPath.setAttribute('d',linePath(price.map(d=>[sx(d.x),spy(d.y)]))); svg.appendChild(pPath);
  const sPath=document.createElementNS(svg.namespaceURI,'path'); sPath.setAttribute('fill','none'); sPath.setAttribute('stroke','var(--acc2)'); sPath.setAttribute('stroke-width','2.5'); sPath.setAttribute('d',linePath(senti.map(d=>[sx(d.x),ssy(d.y)]))); svg.appendChild(sPath);
  return{update(np,ns){ pPath.setAttribute('d',linePath(np.map(d=>[sx(d.x),spy(d.y)]))); sPath.setAttribute('d',linePath(ns.map(d=>[sx(d.x),ssy(d.y)]))); },
         svg(){ return svg; },
         csv(){ const header=['x','price','sentiment']; const rows=price.map((d,i)=>[d.x,d.y.toFixed(2),(senti[i]?.y||0).toFixed(2)]); return [header].concat(rows); } }
}

// Data Generators (synthetic demo)
const palette=['var(--acc1)','var(--acc2)','#7dd3fc','#a78bfa','#14c38e','#ff7a59'];
function genSeries(names,N,offset=0,amp=10,trend=6,region='EU',city='Genf',cohortFactor=1){const xs=[...Array(N)].map((_,i)=>i);
  const regionBias={EU:1.0,US:1.05,ME:1.12,APAC:0.97}[region]||1.0;
  const cityBias={'Genf':1.02,'Dubai':1.15,'Miami':1.06,'Hong Kong':1.04}[city]||1.0;
  const bias=regionBias*cityBias*cohortFactor;
  return names.map((n,i)=>({name:n,color:palette[i%palette.length],data:xs.map(x=>({x,y:(60+amp*Math.sin((x+i)/4)+(Math.random()*8-4)+i*trend+offset)*bias}))}));
}
function mutateSeries(s){ s.forEach(ln=>{ const last=ln.data[ln.data.length-1]; const next= last.y + (Math.random()*6-3); ln.data=ln.data.slice(1).concat({x:last.x+1,y:next}); }); return s; }
function fmcgVals(){ return [120,138,112,98,106].map(v=>Math.round(v*(0.9+Math.random()*0.25))); }
function stacksSupp(){ const cats=["Protein","Omega-3","Ashwagandha","Creatin"];
  const s1={name:"Amazon",color:"var(--acc1)",vals:cats.map(()=>Math.round(20+Math.random()*40))};
  const s2={name:"Retail",color:"#7dd3fc",vals:cats.map(()=>Math.round(20+Math.random()*40))};
  const s3={name:"D2C",color:"var(--acc2)",vals:cats.map(()=>Math.round(10+Math.random()*30))};
  for(let i=0;i<cats.length;i++){const tot=s1.vals[i]+s2.vals[i]+s3.vals[i]; s1.vals[i]=Math.round(s1.vals[i]*100/tot); s2.vals[i]=Math.round(s2.vals[i]*100/tot); s3.vals[i]=100-s1.vals[i]-s2.vals[i];}
  return {cats,stacks:[s1,s2,s3]};
}
function financeData(){ const xs=[...Array(60)].map((_,i)=>i); const price=xs.map(x=>({x,y:50000+2000*Math.sin(x/6)+(Math.random()*800-400)})); const senti=xs.map(x=>({x,y:50+20*Math.sin(x/8+1)+(Math.random()*10-5)})); return {price,senti}; }

const watchBrands=["Rolex","Patek Philippe","Audemars Piguet","Richard Mille"];
const autoBrands=["Ferrari","Lamborghini","Rolls-Royce","Bentley"];
const yachtBrands=["Feadship","Lürssen","Benetti","Sunseeker"];

let elecNames=["Earbuds X","Smartwatch Z","Powerbank 20k"];
let beautyNames=["Hyaluron Serum","Collagen Drink","Retinol Cream","SPF50"];
let tfElec=72, tfBeauty=72, tfWatch=72, tfAuto=72, tfYacht=72;

let region='EU', city='Genf', cohortW='Daytona', cohortA='Hypercars', cohortY='30–50m';

function cohortFactorW(){ return {Daytona:1.10,Nautilus:1.15,"Royal Oak":1.12,"RM 011":1.20}[cohortW]||1; }
function cohortFactorA(){ return {Hypercars:1.14,Chauffeur:1.05}[cohortA]||1; }
function cohortFactorY(){ return {"30–50m":1.08,"100m+":1.02}[cohortY]||1; }

let electronics, beauty, fmcg, supp, fin, luxW, luxA, luxY;

function seedAll(){
  electronics=genSeries(elecNames,tfElec,0,10,6,region,city,1);
  beauty=genSeries(beautyNames,tfBeauty,0,10,6,region,city,1);
  fmcg={cats:["Energy-Drinks","Protein-Riegel","RTD-Kaffee","Vegan Snacks","Electrolyte Water"],vals:fmcgVals()};
  supp = stacksSupp();
  fin  = financeData();
  luxW = genSeries(watchBrands, tfWatch, 10, 12, 8, region, city, cohortFactorW());
  luxA = genSeries(autoBrands,  tfAuto,  15, 14, 7, region, city, cohortFactorA());
  luxY = genSeries(yachtBrands, tfYacht, 20, 16, 6, region, city, cohortFactorY());
}

// Legends
function buildLegend(container, series, onSelect){
  container.innerHTML='';
  series.forEach((s,idx)=>{
    const item=document.createElement('div'); item.className='item'; item.dataset.idx=idx;
    const sw=document.createElement('div'); sw.className='swatch'; sw.style.background=s.color;
    const tx=document.createElement('span'); tx.textContent=s.name;
    item.appendChild(sw); item.appendChild(tx);
    item.addEventListener('click',()=>{ onSelect(idx); });
    container.appendChild(item);
  });
}
function setLegendActive(container, idx){ $$('.item',container).forEach((el,i)=>el.classList.toggle('active',i===idx)); }

// Export helpers
function exportCSV(rows,filename){
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function exportXLS(rows,filename){
  const html='<table>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td>').join('')+'</tr>').join('')+'</table>';
  const blob=new Blob([html],{type:'application/vnd.ms-excel'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function exportPNG(svgEl, filename){
  const xml = new XMLSerializer().serializeToString(svgEl);
  const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  const img = new Image(); img.onload = ()=> {
    const canvas = document.createElement('canvas');
    const vb = svgEl.viewBox.baseVal || {width: svgEl.clientWidth, height: svgEl.clientHeight};
    canvas.width = vb.width || svgEl.clientWidth; canvas.height = vb.height || svgEl.clientHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  };
  img.src = svg64;
}

// Pitch / Tabs / Dropdowns
let tabStartTs=Date.now(); let pitchTimer=null;
function initTabs(){
  setInterval(()=>$('#tabTimer').textContent=`Tab-Zeit: ${fmt(Date.now()-tabStartTs)}`,1000);
  function activate(id){
    $$('.tab').forEach(t=>t.classList.remove('active')); $$('.section').forEach(s=>s.classList.remove('active'));
    $(`.tab[data-tab="${id}"]`).classList.add('active'); $(`#${id}`).classList.add('active');
    tabStartTs=Date.now();
  }
  $$('.tab').forEach(t=>t.addEventListener('click',()=>{stopPitch();activate(t.dataset.tab)}));
  const order=["retail","beauty","supplements","finance","luxury","portfolio","matrix","brand"];
  window.addEventListener('keydown',e=>{
    const cur=document.querySelector('.tab.active')?.dataset.tab||order[0]; let i=order.indexOf(cur);
    if(e.key==='ArrowRight'){i=(i+1)%order.length;stopPitch();activate(order[i]);}
    if(e.key==='ArrowLeft'){i=(i-1+order.length)%order.length;stopPitch();activate(order[i]);}
    if(e.key.toLowerCase()==='n'){const n=$('#notes'); n.style.display=n.style.display==='block'?'none':'block';}
    if(e.key.toLowerCase()==='p'){togglePitch(order,activate);}
  });
  $('#pitchBtn').addEventListener('click',()=>togglePitch(order,activate));
  activate(order[0]);
  return {order,activate};
}
function fmt(ms){const s=Math.floor(ms/1000),m=String(Math.floor(s/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');return `${m}:${ss}`}
function startPitch(order,activate){ if(pitchTimer) return; $('#pitchBtn').textContent='⏸️ Pause Pitch';
  const dwell=parseInt(qp('dwell','12'),10); pitchTimer=setInterval(()=>{const cur=document.querySelector('.tab.active')?.dataset.tab||order[0]; let i=order.indexOf(cur); i=(i+1)%order.length; activate(order[i]);}, dwell*1000); }
function stopPitch(){ if(pitchTimer){clearInterval(pitchTimer);pitchTimer=null;} $('#pitchBtn').textContent='▶️ Auto-Pitch'; }
function togglePitch(order,activate){ if(pitchTimer) stopPitch(); else startPitch(order,activate); }

function initShare(){ $('#share').addEventListener('click',()=>{ const url=location.href; navigator.clipboard.writeText(url).then(()=>{$('#share').textContent='✅ Link kopiert'; setTimeout(()=>$('#share').textContent='🔗 Share',1500);});}); }
function initDropdowns(){
  $$('.dd').forEach(btn=>{ const dd=btn.parentElement.parentElement.querySelector('.dropdown-menu'); btn.addEventListener('click',e=>{e.stopPropagation(); $$('.dropdown-menu').forEach(x=>x.style.display='none'); dd.style.display=dd.style.display==='block'?'none':'block';});});
  document.addEventListener('click',()=> $$('.dropdown-menu').forEach(x=>x.style.display='none'));
}

// Memo (PDF via print)
function initMemo(){
  $('#memo').addEventListener('click',()=>{
    const k = $('#memo-kpis'); k.innerHTML='';
    const items=[['Rolex Spread', '+22%'],['Ferrari Liquidity', '68'],['Benetti Volatility','7.8%']];
    items.forEach(([h,v])=>{ const d=document.createElement('div'); d.className='k'; d.innerHTML=`<div><strong>${h}</strong></div><div>${v}</div>`; k.appendChild(d); });
    window.print();
  });
}

// Alerts (Demo)
function initAlerts(){
  const modal = $('#alertModal'); const txt=$('#alertText');
  $('#alert').addEventListener('click',()=>{ txt.textContent='ALERT – Rolex Premium dropped from +28% → +9% ('+region+', 72h)'; modal.style.display='flex'; });
  $('#closeAlert').addEventListener('click',()=>{ modal.style.display='none'; });
  $('#saveEML').addEventListener('click',()=>{
    const body = 'Subject: Tycoondata Alert\\r\\nTo: investor@example.com\\r\\nFrom: alerts@tycoondata.local\\r\\n\\r\\n' + txt.textContent + '\\r\\n';
    const blob = new Blob([body], {type:'message/rfc822'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='tycoondata_alert.eml'; a.click(); URL.revokeObjectURL(url);
  });
}

// Build charts & controls
let chartElec, chartFmcg, chartBeauty, chartSupp, chartFin;
let chartLuxW, chartLuxA, chartLuxY;
let chartBrandShare, chartBrandPremium;

function initCharts(){
  // selects
  const elecSel=$('#elec-product'); elecSel.innerHTML=''; elecNames.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;elecSel.appendChild(o);});
  const beautySel=$('#beauty-product'); beautySel.innerHTML=''; beautyNames.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;beautySel.appendChild(o);});

  // seed data
  seedAll();

  // charts
  chartElec = LineChart($('#elec'), electronics);
  chartFmcg = BarChart($('#fmcg'), fmcg.cats, fmcg.vals);
  chartBeauty= LineChart($('#beauty-line'), beauty);
  chartSupp  = (function(el){ // stacked quick
    const pad={l:58,t:22,r:12,b:46}, W=el.clientWidth||640,H=300,w=W-pad.l-pad.r,h=H-pad.t-pad.b;
    function draw(stacks){
      el.innerHTML=''; const svg=createSVG(W,H); el.appendChild(svg);
      const cats=supp.cats, ss=stacks; const totals=cats.map((_,i)=>ss.reduce((a,s)=>a+(s.vals[i]||0),0));
      const vmax=Math.max(...totals,1), bw=w/cats.length*0.7, xs=i=>pad.l+i*(w/cats.length)+(w/cats.length-bw)/2, sy=v=>pad.t+(1-v/vmax)*h;
      const xAxis=document.createElementNS(svg.namespaceURI,'line'); xAxis.setAttribute('x1',pad.l);xAxis.setAttribute('x2',pad.l+w);xAxis.setAttribute('y1',pad.t+h);xAxis.setAttribute('y2',pad.t+h);xAxis.setAttribute('stroke','var(--grid)'); svg.appendChild(xAxis);
      cats.forEach((c,i)=>{ let acc=0; ss.forEach(s=>{ const v=s.vals[i]||0; const y=sy(acc+v),hh=sy(acc)-y; const r=document.createElementNS(svg.namespaceURI,'rect'); r.setAttribute('x',xs(i)); r.setAttribute('y',y); r.setAttribute('width',bw); r.setAttribute('height',hh); r.setAttribute('fill',s.color); r.style.transition='y .4s ease,height .4s ease'; svg.appendChild(r); acc+=v;});
        const t=document.createElementNS(svg.namespaceURI,'text'); t.setAttribute('x',xs(i)+bw/2); t.setAttribute('y',pad.t+h+16); t.setAttribute('text-anchor','middle'); t.setAttribute('font-size','11'); t.setAttribute('fill','var(--muted)'); t.textContent=c; svg.appendChild(t);});
      let lx=pad.l, ly=18; ss.forEach(s=>{ const r=document.createElementNS(svg.namespaceURI,'rect'); r.setAttribute('x',lx); r.setAttribute('y',ly-8); r.setAttribute('width',18); r.setAttribute('height',6); r.setAttribute('fill',s.color);
        const t=document.createElementNS(svg.namespaceURI,'text'); t.setAttribute('x',lx+26); t.setAttribute('y',ly); t.setAttribute('font-size','12'); t.setAttribute('fill','var(--muted)'); t.textContent=s.name; svg.appendChild(r); svg.appendChild(t); lx+=160; });
      return svg;
    }
    const comp={el, draw, update(newStacks){ draw(newStacks); }, svg(){ return el.querySelector('svg'); },
                csv(){ const header=['Category'].concat(supp.stacks.map(s=>s.name)); const rows=supp.cats.map((c,i)=>[c].concat(supp.stacks.map(s=>s.vals[i]||0))); return [header].concat(rows);} };
    draw(supp.stacks); return comp;
  })($('#supp-stacked'));
  chartFin   = DualY($('#finance-dual'), fin.price, fin.senti);

  // Luxury
  chartLuxW  = LineChart($('#lux-watches'), luxW);
  chartLuxA  = LineChart($('#lux-autos'),   luxA);
  chartLuxY  = LineChart($('#lux-yachts'),  luxY);

  // legends + solo
  buildLegend($('#luxw-legend'), luxW, idx=>{ setLegendActive($('#luxw-legend'),idx); const solo=[luxW[idx]]; chartLuxW.update(solo); });
  buildLegend($('#luxa-legend'), luxA, idx=>{ setLegendActive($('#luxa-legend'),idx); const solo=[luxA[idx]]; chartLuxA.update(solo); });
  buildLegend($('#luxy-legend'), luxY, idx=>{ setLegendActive($('#luxy-legend'),idx); const solo=[luxY[idx]]; chartLuxY.update(solo); });

  // Brand cockpit starting charts
  chartBrandShare = BarChart($('#brand-share'), ['Brand','Peer A','Peer B','Peer C'], [38,24,20,18]);
  chartBrandPremium = BarChart($('#brand-premium'), ['Region 1','Region 2','Region 3','Region 4'], [22,15,28,9]);

  // timeframe controls
  $('#elec-time').addEventListener('change',e=>{ const N=parseInt(e.target.value,10); electronics=genSeries(elecNames,N,0,10,6,region,city,1); chartElec=LineChart($('#elec'),electronics); });
  $('#beauty-time').addEventListener('change',e=>{ const N=parseInt(e.target.value,10); beauty=genSeries(beautyNames,N,0,10,6,region,city,1); chartBeauty=LineChart($('#beauty-line'),beauty); });

  // exports hookup
  $$('.dropdown-menu a').forEach(a=> a.addEventListener('click',()=>{
    const w=a.dataset.exp,fmt=a.dataset.format;
    const map={elec:chartElec, fmcg:chartFmcg, beauty:chartBeauty, supp:chartSupp, fin:chartFin};
    const comp=map[w]; if(!comp) return;
    if(fmt==='csv') exportCSV(comp.csv(), `${w}.csv`);
    if(fmt==='xls') exportXLS(comp.csv(), `${w}.xls`);
    if(fmt==='png') exportPNG(comp.svg(), `${w}.png`);
  }));

  // Filters (Region/City/Cohorts) update data
  $('#region').addEventListener('change',e=>{ region=e.target.value; seedAll(); replot(); });
  $('#city').addEventListener('change',e=>{ city=e.target.value; seedAll(); replot(); });
  $('#cohort-w').addEventListener('change',e=>{ cohortW=e.target.value; seedAll(); replot(); });
  $('#cohort-a').addEventListener('change',e=>{ cohortA=e.target.value; seedAll(); replot(); });
  $('#cohort-y').addEventListener('change',e=>{ cohortY=e.target.value; seedAll(); replot(); });

  // live tick
  setInterval(()=>{
    electronics=mutateSeries(electronics); chartElec.update(electronics);
    beauty=mutateSeries(beauty); chartBeauty.update(beauty);
    fmcg.vals=fmcg.vals.map(v=>Math.max(10,Math.round(v+(Math.random()*10-5)))); chartFmcg.update(fmcg.vals);
    supp=stacksSupp(); chartSupp.update(supp.stacks);
    fin=financeData(); chartFin.update(fin.price,fin.senti);
    luxW=mutateSeries(luxW); chartLuxW.update(luxW);
    luxA=mutateSeries(luxA); chartLuxA.update(luxA);
    luxY=mutateSeries(luxY); chartLuxY.update(luxY);
    updateLuxuryBadges();
    drawPortfolioForecast();
  }, 5000);
}

function replot(){
  chartElec = LineChart($('#elec'), electronics);
  chartBeauty= LineChart($('#beauty-line'), beauty);
  chartLuxW  = LineChart($('#lux-watches'), luxW);
  chartLuxA  = LineChart($('#lux-autos'),   luxA);
  chartLuxY  = LineChart($('#lux-yachts'),  luxY);
  buildLegend($('#luxw-legend'), luxW, idx=>{ setLegendActive($('#luxw-legend'),idx); const solo=[luxW[idx]]; chartLuxW.update(solo); });
  buildLegend($('#luxa-legend'), luxA, idx=>{ setLegendActive($('#luxa-legend'),idx); const solo=[luxA[idx]]; chartLuxA.update(solo); });
  buildLegend($('#luxy-legend'), luxY, idx=>{ setLegendActive($('#luxy-legend'),idx); const solo=[luxY[idx]]; chartLuxY.update(solo); });
  updateLuxuryBadges();
}

// Luxury badges & what-if
function deriveMSRP(sec){ const smooth = sec.map((d,i)=>{ const prev = sec[Math.max(0,i-1)].y, cur = d.y; return {x:d.x, y: cur*0.88 + prev*0.12}; }); return smooth; }
function medianSeries(lines){ const L = lines[0].data.length; const xs = lines[0].data.map(d=>d.x); const vals = xs.map((_,i)=>{ const arr = lines.map(s=> s.data[i].y).sort((a,b)=>a-b); return arr[Math.floor(arr.length/2)];}); return xs.map((x,idx)=>({x, y: vals[idx]})); }
function spreadClass(spreadPct){ if (spreadPct >= 0.20) return 'ok'; if (spreadPct >= 0.05) return 'warn'; return 'risk'; }
function liquidityScore(){ const days = 14 + Math.floor(Math.random()*18); const bas  = 2 + Math.random()*3; const vol  = 5 + Math.random()*8; const dd   = 5 + Math.random()*15; let cls='ok'; if(days>24 || bas>3.8 || vol>10 || dd>14) cls='warn'; if(days>28 || bas>4.4 || vol>11.5 || dd>17) cls='risk'; return {days, bas, vol, dd, cls}; }

function updateLuxury(panelId, series, ifInputId, ifValId, spreadId, liqId, pngBtnId){
  const host = $(panelId);
  const secLine = medianSeries(series);
  const msrpLine = deriveMSRP(secLine);
  let whatIf = parseInt($(ifInputId).value,10)||0;
  function draw(){
    const price = secLine.map(d=>({x:d.x, y: d.y*(1+whatIf/100)}));
    const comp = DualY(host, price, msrpLine);
    const lastS = price[price.length-1].y; const lastM = msrpLine[msrpLine.length-1].y;
    const spread = (lastS - lastM) / lastM;
    const sb=$(spreadId); sb.textContent = `Spread: ${(spread*100).toFixed(1)}%`; sb.className=`badgeKPI ${spreadClass(spread)}`;
    const LQ = liquidityScore(); const lb=$(liqId); lb.textContent=`Liquidity: ${LQ.days}d · BAS ${LQ.bas.toFixed(1)}% · Vol ${LQ.vol.toFixed(1)}% · DD ${LQ.dd.toFixed(0)}%`; lb.className=`badgeKPI ${LQ.cls}`;
    $(pngBtnId).onclick=()=> exportPNG(comp.svg(), panelId.replace('#','')+'.png');
  }
  draw();
  $(ifInputId).addEventListener('input',e=>{ whatIf = parseInt(e.target.value,10); $(ifValId).textContent=(whatIf>0?'+':'')+whatIf+'%'; draw(); });
}

function updateLuxuryBadges(){
  updateLuxury('#lux-watches', luxW, '#if-w', '#ifw-val', '#spread-w', '#liq-w', '#png-w');
  updateLuxury('#lux-autos',   luxA, '#if-a', '#ifa-val', '#spread-a', '#liq-a', '#png-a');
  updateLuxury('#lux-yachts',  luxY, '#if-y', '#ify-val', '#spread-y', '#liq-y', '#png-y');
}

// Portfolio builder
function computePortfolio(){
  const items=$$('.pf-asset'); const sel=items.filter(i=>i.checked);
  if(sel.length===0) return {spread:0,liq:0,vol:0};
  const avg = sel.reduce((a,i)=>{ a.spread+=parseFloat(i.dataset.spread); a.liq+=parseFloat(i.dataset.liq); a.vol+=parseFloat(i.dataset.vol); return a; },{spread:0,liq:0,vol:0});
  avg.spread/=sel.length; avg.liq/=sel.length; avg.vol/=sel.length; return avg;
}
function drawPortfolioKPIs(){
  const k=computePortfolio(); $('#pf-spread').textContent=(k.spread*100).toFixed(1)+'%'; $('#pf-liq').textContent=Math.round(k.liq); $('#pf-vol').textContent=k.vol.toFixed(1)+'%';
}
function drawPortfolioForecast(){
  const el=$('#pf-forecast'); const W=el.clientWidth||640,H=300; const svg=createSVG(W,H); el.innerHTML=''; el.appendChild(svg);
  const base=100; const xs=[...Array(60)].map((_,i)=>i); const k=computePortfolio(); const band=xs.map(x=>({x,y:base + x*(k.spread*10) + (Math.random()*4-2)}));
  const pad={l:48,t:22,r:12,b:28},w=W-pad.l-pad.r,h=H-pad.t-pad.b; const xmin=0,xmax=59,ymin=Math.min(...band.map(b=>b.y))-5,ymax=Math.max(...band.map(b=>b.y))+5;
  const sx=x=>pad.l+((x-xmin)/(xmax-xmin||1))*w, sy=y=>pad.t+(1-(y-ymin)/(ymax-ymin||1))*h;
  const path=linePath(band.map(d=>[sx(d.x),sy(d.y)])); const p=document.createElementNS(svg.namespaceURI,'path'); p.setAttribute('fill','none'); p.setAttribute('stroke','var(--acc1)'); p.setAttribute('stroke-width','2.5'); p.setAttribute('d',path); svg.appendChild(p);
}

function initPortfolio(){
  $$('.pf-asset').forEach(i=> i.addEventListener('change',()=>{ drawPortfolioKPIs(); drawPortfolioForecast(); }));
  drawPortfolioKPIs(); drawPortfolioForecast();
}

// Correlation Matrix (synthetic demo)
function initMatrix(){
  const rows=['Rolex','Patek','Ferrari','Lürssen','BTC','US10Y'];
  const vals=[
    ['—',  0.62, 0.28,-0.12, 0.58,-0.31],
    [0.62,'—',   0.22,-0.18, 0.54,-0.29],
    [0.28, 0.22,'—',  -0.09, 0.35,-0.17],
    [-0.12,-0.18,-0.09,'—', -0.20, 0.11],
    [0.58, 0.54, 0.35,-0.20,'—',  -0.26],
    [-0.31,-0.29,-0.17,0.11,-0.26,'—']
  ];
  const grid=$('#matrix-grid'); grid.innerHTML='';
  rows.forEach((r,i)=>{ rows.forEach((c,j)=>{
    const d=document.createElement('div'); d.className='cell'+((typeof vals[i][j]==='number')?(vals[i][j]>=0?' pos':' neg'):''); d.innerHTML = (i===0? `<div class="h">${c}</div>` : (j===0? `<div class="h">${r}</div>` : (typeof vals[i][j]==='number'? vals[i][j].toFixed(2): '—')));
    grid.appendChild(d);
  }); });
}

// Brand cockpit
function initBrandCockpit(){
  $('#brand-sel').addEventListener('change',()=> drawBrandCockpit());
  $('#brand-png').addEventListener('click',()=>{
    exportPNG($('#brand-share').querySelector('svg'), 'brand_share.png');
  });
  drawBrandCockpit();
}
function drawBrandCockpit(){
  const sel=$('#brand-sel').value;
  const shares=[Math.round(30+Math.random()*15),Math.round(15+Math.random()*10),Math.round(12+Math.random()*8),Math.round(10+Math.random()*8)];
  chartBrandShare = BarChart($('#brand-share'), [sel,'Peer A','Peer B','Peer C'], shares);
  chartBrandPremium = BarChart($('#brand-premium'), ['EU','US','ME','APAC'], [20+Math.random()*8,12+Math.random()*8,25+Math.random()*8,8+Math.random()*6].map(v=>Math.round(v)));
}

// App init
function initApp(){
  initTheme(); initDropdowns(); initMemo(); initAlerts(); initShare();
  const t=initTabs();
  initCharts(); updateLuxuryBadges(); initPortfolio(); initMatrix(); initBrandCockpit();

  // presets via query (tab, dwell, pitch)
  const tab=qp('tab',null); if(tab){ const el=$(`.tab[data-tab="${tab}"]`); if(el){ el.click(); } }
  if((qp('pitch','off')+'').toLowerCase()==='on'){ togglePitch(["retail","beauty","supplements","finance","luxury","portfolio","matrix","brand"],(id)=>{}); }
}

// EOF
