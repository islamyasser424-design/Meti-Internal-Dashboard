/* Presentation layer. The existing Google data and authentication remain authoritative. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
let protectedOptions=null;
const queuesFilters={query:'',shift:'',floor:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0,pageSize:25};
const queuesChartFilters={queue:'all',stage:'all',from:'',to:'',day:''};
const qtcFloorFilters={query:'',qtc:'',floor:'',shift:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0,pageSize:25};
let view='both';let target=0;try{target=Math.max(0,Number(localStorage.getItem('meeg_personal_target'))||0);}catch(e){}
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.createElement('div');root.id='uxDashboard';
const start=document.querySelector('.hdr'),end=$('mainContent');
let n=start;while(n){const next=n.nextSibling;root.appendChild(n);if(n===end)break;n=next;}
document.body.appendChild(root);
const overview=document.createElement('section');overview.className='ux-overview';overview.id='uxOverview';
$('syncBar').after(overview);
const analysis=document.createElement('section');analysis.id='uxAnalysis';analysis.hidden=true;analysis.innerHTML='<div class="ux-placeholder"><span class="ux-symbol" aria-hidden="true">◈</span><div class="ux-eyebrow" style="margin-top:24px">Your next workspace</div><h1>Analysis Overview</h1><p>This space is ready for your analysis.<br>Metrics, charts and workflows will be added once you define them.</p><button class="btn btn-c" id="uxBack" style="margin-top:24px">Back to dashboard →</button></div>';
document.body.appendChild(analysis);
const performance=document.createElement('section');performance.id='uxPerformance';performance.hidden=true;document.body.appendChild(performance);
const dailyPage=document.createElement('section');dailyPage.id='uxDaily';dailyPage.hidden=true;document.body.appendChild(dailyPage);
const queuesPage=document.createElement('section');queuesPage.id='uxQueues';queuesPage.hidden=true;document.body.appendChild(queuesPage);
const qtcFloorPage=document.createElement('section');qtcFloorPage.id='uxQtcFloor';qtcFloorPage.hidden=true;document.body.appendChild(qtcFloorPage);
const aside=document.createElement('aside');aside.className='ux-sidebar';aside.setAttribute('aria-label','Main navigation');aside.innerHTML='<div class="ux-brand"><b>◈</b> MEEG<span style="display:block;font-size:11px;letter-spacing:1px;color:var(--muted);margin-top:7px">PRODUCTIVITY WORKSPACE</span></div><small>WORKSPACE</small><button class="ux-nav active" data-page="dashboard">▦ &nbsp; Dashboard</button><button class="ux-nav" data-page="analysis">◈ &nbsp; Analysis Overview</button><button class="ux-nav" data-page="queues">☷ &nbsp; Queues Analysis</button><button class="ux-nav" data-page="performance">▤ &nbsp; Performance per Labelers</button><button class="ux-nav" data-page="qtcfloor">🏢 &nbsp; Performance per QTC & Floor</button><button class="ux-nav" data-page="daily">▦ &nbsp; Daily Report</button><footer>Connected to your existing data<br><span style="display:block;margin-top:8px">MEEG · Internal Dashboard</span></footer>';
document.body.appendChild(aside);
const menu=document.createElement('button');menu.className='btn ux-mobile';menu.textContent='☰ Menu';menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');document.body.insertBefore(menu,root);
const backdrop=document.createElement('button');backdrop.className='ux-backdrop';backdrop.setAttribute('aria-label','Close navigation');document.body.appendChild(backdrop);
function closeNav(){document.body.classList.remove('ux-sidebar-open');menu.setAttribute('aria-expanded','false');}
menu.onclick=()=>{const open=document.body.classList.toggle('ux-sidebar-open');menu.setAttribute('aria-expanded',String(open));if(open)aside.querySelector('button').focus();};backdrop.onclick=closeNav;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNav();menu.focus();}});
function route(){const current=location.hash==='#analysis-overview'?'analysis':location.hash==='#queues-analysis'?'queues':location.hash==='#performance-labelers'?'performance':location.hash==='#performance-qtc-floor'?'qtcfloor':location.hash==='#daily-report'?'daily':'dashboard';root.hidden=current!=='dashboard';analysis.hidden=current!=='analysis';queuesPage.hidden=current!=='queues';performance.hidden=current!=='performance';qtcFloorPage.hidden=current!=='qtcfloor';dailyPage.hidden=current!=='daily';aside.querySelectorAll('[data-page]').forEach(b=>{const active=b.dataset.page===current;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});closeNav();
 if(current==='queues'&&typeof renderQueuesAnalysis==='function')renderQueuesAnalysis();
 else if(current==='analysis'&&typeof renderAnalysis==='function')renderAnalysis();
 else if(current==='performance'&&typeof renderPerformance==='function')renderPerformance();
 else if(current==='qtcfloor'&&typeof renderQtcFloorPerformance==='function')renderQtcFloorPerformance();
 else if(current==='daily'&&typeof renderDailyReport==='function')renderDailyReport();
 else if(typeof renderOverview==='function')renderOverview();
 queueMicrotask(()=>{renderAllSections();if(!root.hidden&&!rawRows.length&&getAuthToken())loadData();});}
aside.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.page==='analysis'?'analysis-overview':b.dataset.page==='queues'?'queues-analysis':b.dataset.page==='performance'?'performance-labelers':b.dataset.page==='qtcfloor'?'performance-qtc-floor':b.dataset.page==='daily'?'daily-report':'dashboard';});$('uxBack').onclick=()=>location.hash='dashboard';$('uxSideRefresh')?.addEventListener('click',()=>loadData());$('uxSideTheme')?.addEventListener('click',()=>toggleDark());window.addEventListener('hashchange',route);route();
function rowsInView(){return activeLoc&& !activeLoc.startsWith('__')&&locColIdx>=0?fcache.filter(r=>String(r[locColIdx]||'').trim()===activeLoc):fcache;}
function uniq(rows,name){const i=hdrs.findIndex(h=>h.toLowerCase()===name.toLowerCase());return i<0?null:new Set(rows.map(r=>String(r[i]||'').trim()).filter(Boolean)).size;}
function daily(rows){const map=new Map();rows.forEach(r=>{const d=rDate(r);if(d)map.set(d,(map.get(d)||0)+1);});return [...map].sort(([a],[b])=>a.localeCompare(b));}
function spark(points){if(!points.length)return '';const max=Math.max(1,...points.map(p=>p[1]));return '<svg class="ux-spark" viewBox="0 0 200 32" preserveAspectRatio="none" aria-label="Daily submission trend"><polyline fill="none" stroke="currentColor" stroke-width="2.5" points="'+points.map((p,i)=>(points.length===1?100:i/(points.length-1)*200)+','+(30-p[1]/max*26)).join(' ')+'"/></svg>';}
function animate(){overview.querySelectorAll('[data-count]').forEach(el=>{const value=Number(el.dataset.count);if(reduced()){el.textContent=value.toLocaleString();return;}const begin=performance.now();function tick(t){const p=Math.min(1,(t-begin)/650);el.textContent=Math.round(value*(1-Math.pow(1-p,3))).toLocaleString();if(p<1&&el.isConnected)requestAnimationFrame(tick);}requestAnimationFrame(tick);});}
function applyView(){root.classList.toggle('ux-summary-hidden',view==='details');root.classList.toggle('ux-details-hidden',view==='summary');overview.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===view)));}
function resetAllFilters(){
 selD.clear();selWeeks.clear();
 Object.keys(sel).forEach(k=>sel[k].clear());
 Object.assign(analysisFilters,{from:'',to:'',modality:'all',shift:'',unit:'',qtc:'',category:'',chartCategory:'all'});
 Object.assign(queuesFilters,{query:'',shift:'',floor:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0});
 Object.assign(queuesChartFilters,{queue:'all',stage:'all',from:'',to:'',day:''});
 Object.assign(perfFilters,{from:'',to:'',day:'',week:'',category:'',query:'',person:'',page:0});
 Object.assign(qtcFloorFilters,{query:'',qtc:'',floor:'',shift:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0});
 if(typeof setShiftsUI==='function')setShiftsUI({});
 const idInput=$('idFilterInput');if(idInput)idInput.value='';
 idFilter='';timeFrom='';timeTo='';timePreset='';activeLoc='__all__';
 if(typeof closeAll==='function')closeAll();
 if(typeof buildStrip==='function')buildStrip();
 if(typeof applyAll==='function')applyAll();
 renderAllSections();
 showToast('✓ All filters have been reset');
}

function renderHeaderControlsHTML(prefix='ux'){
 return '<div class="ux-header-actions"><button class="btn btn-reset-all" title="Reset all active filters across all pages">↺ Reset all filters</button></div>';
}
function _oldRenderHeaderControlsHTML(prefix='ux'){
 const isDark=document.documentElement.getAttribute('data-theme')==='dark';
 const themeLabel=isDark?'☀️ Light mode':'🌙 Dark mode';
 return '<div class="ux-header-actions">'
  +'<button class="btn btn-c '+prefix+'-btn-refresh" title="Refresh Google Sheet data">↻ Refresh data</button>'
  +'<button class="btn '+prefix+'-btn-theme" title="Toggle appearance mode (Dark / Light)">'+themeLabel+'</button>'
  +'</div>';
}
function bindHeaderControls(container,prefix='ux'){
 if(!container)return;
 container.querySelectorAll('.btn-reset-all').forEach(btn=>{
  btn.onclick=()=>resetAllFilters();
 });
}
function _oldBindHeaderControls(container,prefix='ux'){
 if(!container)return;
 container.querySelectorAll('.'+prefix+'-btn-refresh').forEach(btn=>{
  btn.onclick=()=>loadData();
 });
 container.querySelectorAll('.'+prefix+'-btn-theme').forEach(btn=>{
  btn.onclick=()=>{
   toggleDark();
   updateAllThemeButtons();
  };
 });
}
function updateAllThemeButtons(){
 const isDark=document.documentElement.getAttribute('data-theme')==='dark';
 const themeLabel=isDark?'☀️ Light mode':'🌙 Dark mode';
 document.querySelectorAll('[class*="-btn-theme"]').forEach(b=>{
  b.innerHTML=themeLabel;
 });
}

function getCategorySummary(rows){
 const idx=name=>hdrs.findIndex(h=>String(h).trim().toLowerCase()===name);
 const ni=idx('national id'),mi=idx('modality'),pi=idx('pass'),li=idx('labeler name'),qi=idx('qtc name');
 const defs=[
  {key:'lidarFP',label:'Lidar FP',modality:'Lidar',pass:'FP',color:'#7258f5',bg:'rgba(114,88,245,0.12)',icon:'⚡'},
  {key:'lidarQA',label:'Lidar QA',modality:'Lidar',pass:'QA',color:'#15b8a6',bg:'rgba(21,184,166,0.12)',icon:'✓'},
  {key:'laneFP',label:'Lane Line FP',modality:'Lane Line',pass:'FP',color:'#ed9a35',bg:'rgba(237,154,53,0.12)',icon:'⚡'},
  {key:'laneQA',label:'Lane Line QA',modality:'Lane Line',pass:'QA',color:'#e9689e',bg:'rgba(233,104,158,0.12)',icon:'✓'}
 ];
 const categories=Object.fromEntries(defs.map(d=>[d.key,{
  ...d,
  tasks:0,
  labelerSet:new Set(),
  uniqueLabelers:0,
  avgSubmit:'0',
  qtcSet:new Set(),
  uniqueQtc:0
 }]));
 const overallLabelers=new Set();
 const overallQtc=new Set();
 let overallTasks=0;
 rows.forEach(r=>{
  let lid='';
  if(ni>=0){
   const rawNi=String(r[ni]??'').trim()
    .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
    .replace(/\.0+$/,'').replace(/[\s-]/g,'');
   if(/^\d{14}$/.test(rawNi))lid=rawNi;
  }
  if(!lid&&li>=0){
   const name=String(r[li]??'').trim().toLowerCase();
   if(name)lid='name:'+name;
  }
  if(lid)overallLabelers.add(lid);

  const qtc=qi>=0?String(r[qi]||'').normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase():'';
  if(qtc)overallQtc.add(qtc);

  overallTasks++;
  const mod=mi<0?'':String(r[mi]??'').trim().toLowerCase().replace(/[\s_-]+/g,'');
  const pass=pi<0?'':String(r[pi]??'').trim().toUpperCase();
  const prefix=mod==='lidar'?'lidar':(mod==='laneline'||mod==='lane')?'lane':'';
  if(prefix&&(pass==='FP'||pass==='QA')){
   const key=prefix+pass;
   const cat=categories[key];
   if(cat){
    cat.tasks++;
    if(lid)cat.labelerSet.add(lid);
    if(qtc)cat.qtcSet.add(qtc);
   }
  }
 });
 defs.forEach(d=>{
  const cat=categories[d.key];
  cat.uniqueLabelers=cat.labelerSet.size;
  cat.avgSubmit=cat.uniqueLabelers>0?(cat.tasks/cat.uniqueLabelers).toFixed(1):'0';
  cat.uniqueQtc=cat.qtcSet.size;
 });
 const overallUnique=overallLabelers.size;
 const overallAvg=overallUnique>0?(overallTasks/overallUnique).toFixed(1):'0';
 return {
  defs,
  categories,
  overall:{
   tasks:overallTasks,
   uniqueLabelers:overallUnique,
   avgSubmit:overallAvg,
   uniqueQtc:overallQtc.size
  }
 };
}

function renderCategoryCardsHTML(summary,activeCategory='',scope='overview'){
 const defs=summary.defs;
 const isOverview=scope==='overview';
 return '<section class="an-cat-section" aria-label="Workstream metrics">'
  +'<div class="an-cat-grid">'
  +defs.map(d=>{
   const cat=summary.categories[d.key];
   const isSel=activeCategory===d.key;
   const titleAction=isOverview?'Click to view '+d.label+' in Analysis':'Click to filter by '+d.label+(isSel?' (active)':'');
   return '<article class="an-cat-card '+(isSel?'selected':'')+'" style="--cat-color:'+d.color+';--cat-bg:'+d.bg+'" data-cat="'+d.key+'" role="button" tabindex="0" aria-label="'+d.label+': '+cat.tasks.toLocaleString()+' tasks, '+cat.uniqueLabelers.toLocaleString()+' unique labelers, '+cat.avgSubmit+' avg submit, '+cat.uniqueQtc.toLocaleString()+' unique QTC" title="'+titleAction+'">'
    +'<div class="an-cat-header">'
     +'<div class="an-cat-title"><span aria-hidden="true">'+d.icon+'</span> <span>'+d.label+'</span></div>'
     +'<span class="an-cat-badge">'+d.pass+'</span>'
    +'</div>'
    +'<div class="an-cat-stats">'
     +'<div class="an-cat-stat">'
      +'<span class="an-cat-stat-lbl">Total Tasks</span>'
      +'<strong class="an-cat-stat-val highlight">'+cat.tasks.toLocaleString()+'</strong>'
     +'</div>'
     +'<div class="an-cat-stat">'
      +'<span class="an-cat-stat-lbl">Unique Labelers</span>'
      +'<strong class="an-cat-stat-val">'+cat.uniqueLabelers.toLocaleString()+'</strong>'
     +'</div>'
     +'<div class="an-cat-stat">'
      +'<span class="an-cat-stat-lbl">Avg Submit / Labeler</span>'
      +'<strong class="an-cat-stat-val highlight">'+cat.avgSubmit+'</strong>'
     +'</div>'
     +'<div class="an-cat-stat">'
      +'<span class="an-cat-stat-lbl">Total Unique QTC</span>'
      +'<strong class="an-cat-stat-val">'+cat.uniqueQtc.toLocaleString()+'</strong>'
     +'</div>'
    +'</div>'
   +'</article>';
  }).join('')
  +'</div>'
  +'</section>';
}

function renderOverview(){
if(root.hidden)return;
const rows=rowsInView(),days=daily(rows),last=days.slice(-21),max=Math.max(1,...last.map(p=>p[1]));
const catSummary=getCategorySummary(rows);
const metrics=[
 ['Submissions',window._firstDataReady||rawRows.length?catSummary.overall.tasks:null,'Rows matching your current filters. One row counts as one submission.','#7258f5'],
 ['Active labelers',window._firstDataReady||rawRows.length?catSummary.overall.uniqueLabelers:uniq(rows,'Labeler Name'),'Distinct labelers in the current selection.','#0a9d8c'],
 ['Avg submit / labeler',window._firstDataReady||rawRows.length?catSummary.overall.avgSubmit:null,'Average submission tasks per unique labeler.','#df8b24'],
 ['Active queues',uniq(rows,'Queue Name'),'Distinct non-empty queues in the current selection.','#df5c99']
];
overview.innerHTML='<div class="ux-heading"><div><div class="ux-eyebrow">Performance at a glance</div><h2>Productivity dashboard</h2><p>Explore your team’s output, one insight at a time.</p></div><div class="ux-tools">'+renderHeaderControlsHTML('ov')+'<button class="btn" id="uxCSV">↓ CSV</button><button class="btn" id="uxPrint">Print</button></div></div><div class="ux-grid">'+metrics.map(([label,value,note,tone],i)=>'<article class="ux-kpi" style="--tone:'+tone+'"><div class="ux-flipper"><div class="ux-face"><span class="ux-label" title="'+note+'">'+label+'</span><button class="ux-flip" data-flip="'+i+'" aria-label="Show '+label+' details" aria-expanded="false">↗</button><strong '+(value===null?'':'data-count="'+value+'"')+'>'+ (value===null?'—':value.toLocaleString())+'</strong><span class="ux-note">'+(value===null?(window._firstDataReady?'Column unavailable':'Waiting for data'):'Current filtered selection')+'</span>'+(i===0?spark(last):'<span class="ux-note" style="margin-top:auto;color:'+tone+'">'+(rows.length?'Live data · filtered view':'No matching data')+'</span>')+'</div><div class="ux-face ux-back" inert><b>'+label+'</b><p>'+note+'</p><span class="ux-note">'+(value===null?'Required column is missing.':'No previous-period comparison is assumed.')+'</span><button class="btn" data-unflip="'+i+'">Back</button></div></div></article>').join('')+'</div>'
+renderCategoryCardsHTML(catSummary,'','overview')
+'<div class="ux-panels"><section class="ux-panel"><h3>Submission activity</h3><p>Latest 21 dates with activity. Select a bar to drill into that date.</p><div class="ux-bars">'+(last.length?last.map(([d,c])=>'<button class="ux-bar" style="height:'+Math.max(5,c/max*100)+'%" data-date="'+d+'" title="'+d+': '+c+' submissions" aria-label="'+d+', '+c+' submissions. Filter by this date."></button>').join(''):'<div class="ux-empty">No dated submissions match your selection. Adjust or clear the filters.</div>')+'</div><details><summary>View chart values</summary>'+last.map(([d,c])=>'<p>'+d+' · '+c.toLocaleString()+'</p>').join('')+'</details></section><section class="ux-panel"><h3>Personal submission target</h3><p>A target for this filtered selection, saved on this browser.</p><label class="ux-note">Target rows<input class="ux-target" id="uxTarget" type="number" min="1" step="1" placeholder="Set your target" value="'+(target||'')+'"></label><div id="uxProgress"></div></section></div><div class="ux-view-tabs" role="tablist" aria-label="Dashboard view"><button class="btn" role="tab" data-view="summary">Summary</button><button class="btn" role="tab" data-view="details">Details & tables</button><button class="btn" role="tab" data-view="both">Expanded view</button><button class="btn" id="uxCompare">Compare periods</button></div>';
if(selD.size&&$('uxFrom')){const dates=[...selD].sort();$('uxFrom').value=dates[0];$('uxTo').value=dates[dates.length-1];}
bindHeaderControls(overview,'ov');
overview.querySelectorAll('[data-flip]').forEach(b=>b.onclick=()=>flip(b.dataset.flip,true));overview.querySelectorAll('[data-unflip]').forEach(b=>b.onclick=()=>flip(b.dataset.unflip,false));
function flip(i,on){const card=overview.querySelectorAll('.ux-kpi')[i];card.classList.toggle('flipped',on);card.querySelector('.ux-face:not(.ux-back)').inert=on;card.querySelector('.ux-back').inert=!on;card.querySelector('[data-flip]').setAttribute('aria-expanded',String(on));card.querySelector(on?'[data-unflip]':'[data-flip]').focus();}
overview.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;applyView();});
overview.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{selD.clear();selWeeks.clear();selD.add(b.dataset.date);view='both';buildStrip();applyAll();});
overview.querySelectorAll('.an-cat-card[data-cat]').forEach(card=>{
 const cat=card.dataset.cat;
 card.onclick=()=>{analysisFilters.category=cat;location.hash='analysis-overview';};
 card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.onclick();}};
});
if($('uxRange'))$('uxRange').onclick=()=>{const from=$('uxFrom').value,to=$('uxTo').value;if(!from||!to||from>to){showToast('Choose a valid start and end date.');return;}selD.clear();selWeeks.clear();const dates=(sOpts._dates||[]).filter(d=>d>=from&&d<=to);if(!dates.length){selD.add(from);}else dates.forEach(d=>selD.add(d));buildStrip();applyAll();};
$('uxTarget').onchange=e=>{target=Math.max(0,Math.floor(Number(e.target.value)||0));try{localStorage.setItem('meeg_personal_target',String(target));}catch(e){}progress(rows.length);};
$('uxCSV').onclick=exportCSV;$('uxPrint').onclick=()=>window.print();$('uxCompare').onclick=()=>{if(!cmpMode)toggleCompare();$('cmpBar').scrollIntoView({behavior:reduced()?'instant':'smooth'});};progress(rows.length);applyView();animate();
}
function progress(count){const pct=target?count/target*100:0;$('uxProgress').innerHTML=target?'<div class="ux-track" role="progressbar" aria-label="Submission target" aria-valuenow="'+Math.min(100,Math.round(pct))+'" aria-valuemin="0" aria-valuemax="100"><div class="ux-fill" style="width:'+Math.min(100,pct)+'%"></div></div><b>'+Math.round(pct)+'%</b><p>'+count.toLocaleString()+' of '+target.toLocaleString()+' submissions</p>':'<p style="margin-top:18px">Set a target to see your progress.</p>';}
function exportCSV(){const rows=rowsInView();if(!rows.length){showToast('No matching rows to export.');return;}const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';const csv=[hdrs,...rows].map(r=>r.map(cell).join(',')).join('\r\n');downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'MEEG_filtered_'+cairoToday()+'.csv');}
const analysisFilters={from:'',to:'',modality:'all',shift:'',unit:'',qtc:'',category:'',chartCategory:'all'};
function labelerSubmissionMetrics(rows){
 const idx=name=>hdrs.findIndex(h=>String(h).trim().toLowerCase()===name);
 const ni=idx('national id'),mi=idx('modality'),pi=idx('pass');
 const names=new Set();let missingNames=0;
 const totals={lidarFP:0,lidarQA:0,laneFP:0,laneQA:0};
 const categoryIds=Object.fromEntries(Object.keys(totals).map(k=>[k,new Set()]));
 rows.forEach(r=>{
  const name=ni<0?'':String(r[ni]??'').trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/\.0+$/,'').replace(/[\s-]/g,'');
  if(/^\d{14}$/.test(name))names.add(name);else missingNames++;
  const modality=mi<0?'':String(r[mi]??'').trim().toLowerCase().replace(/[\s_-]+/g,'');
  const pass=pi<0?'':String(r[pi]??'').trim().toUpperCase();
  const prefix=modality==='lidar'?'lidar':modality==='laneline'?'lane':'';
  if(prefix&&(pass==='FP'||pass==='QA')){const key=prefix+pass;totals[key]++;if(/^\d{14}$/.test(name))categoryIds[key].add(name);}
 });
 return {unique:ni<0?null:names.size,missingNames,totals,categoryUnique:Object.fromEntries(Object.entries(categoryIds).map(([k,ids])=>[k,ni<0?null:ids.size])),categoryColumns:mi>=0&&pi>=0};
}

function uniqueQtcCount(rows){const i=hdrs.findIndex(h=>String(h).trim().toLowerCase()==='qtc name');if(i<0)return null;return new Set(rows.map(r=>String(r[i]||'').normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('en')).filter(Boolean)).size;}

function categoryGroups(rows,field){
 const idx=hdrs.findIndex(h=>String(h).trim().toLowerCase()===field.toLowerCase());if(idx<0)return null;
 const map=new Map();rows.forEach(r=>{const name=String(r[idx]||'').trim()||'Unknown';if(!map.has(name))map.set(name,[]);map.get(name).push(r);});
 return [...map].map(([name,group])=>({name,rows:group,totals:labelerSubmissionMetrics(group).totals})).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
}
function floorComparisonRows(dimension='unit'){
 const excluded=new Set(dimension==='unit'?['floor','unit','location','modality','pass']:['qtc name','modality','pass']);const idIdx=hdrs.findIndex(h=>h.trim().toLowerCase()==='id');
 const rows=rawRows.filter(r=>{if(!isRowAllowed(r)||!timeOk(r))return false;const date=rDate(r);if(selD.size&&!selD.has(date))return false;if(selWeeks.size&&!selWeeks.has(getWeekLabel(date)))return false;if(idFilter&&idIdx>=0&&!String(r[idIdx]||'').toLowerCase().includes(idFilter.toLowerCase()))return false;for(const [key,values]of Object.entries(sel)){if(excluded.has(key.toLowerCase())||!values.size)continue;const ci=sIdx[key];if(ci!==undefined&&!values.has(String(r[ci]||'').trim()))return false;}return true;});
 const scoped=dimension==='qtc'&&activeLoc&&!activeLoc.startsWith('__')&&locColIdx>=0?rows.filter(r=>String(r[locColIdx]||'').trim()===activeLoc):rows;
 return analysisAggregate(scoped,{...analysisFilters,[dimension]:'',category:'',modality:'all'}).selected;
}

function addAnalysisCharts(a){
 const defs=[['Lidar FP','lidarFP','#7258f5'],['Lidar QA','lidarQA','#15b8a6'],['Lane Line FP','laneFP','#ed9a35'],['Lane Line QA','laneQA','#e9689e']];
 const container=document.createElement('div');container.className='an-extra-charts';
 const floorField=hdrs.some(h=>h.trim().toLowerCase()==='floor')?'Floor':'Unit';
 [[floorField,'Floor / Unit','horizontal','unit'],['Qtc Name','QC','vertical','qtc']].forEach(([field,label,layout,key])=>{
 const floorMode=key==='unit';const comparisonStage=analysisFilters[floorMode?'floorStage':'qcStage']||'lidarFP';const chartDefs=defs.filter(d=>d[1]===comparisonStage);
 const groups=categoryGroups(floorComparisonRows(key),field),panel=document.createElement('section');panel.className='ux-panel';
 if(groups){const idx=hdrs.findIndex(h=>h.trim().toLowerCase()===field.toLowerCase());const allFloors=[...new Set(rawRows.map(r=>String(r[idx]||'').trim()||'Unknown'))];allFloors.forEach(name=>{if(!groups.some(g=>g.name===name))groups.push({name,totals:{lidarFP:0,lidarQA:0,laneFP:0,laneQA:0}});});groups.sort((a,b)=>b.totals[comparisonStage]-a.totals[comparisonStage]||a.name.localeCompare(b.name));}
 if(!floorMode&&groups){const ranked=rankQcGroups(groups,comparisonStage,!!analysisFilters.qcLower);groups.splice(0,groups.length,...ranked);}
 panel.innerHTML='<h3>'+ (floorMode?'Compare all Floors · '+chartDefs[0][0]:(analysisFilters.qcLower?'Lower 15 QCs · ':'Top 15 QCs · ')+chartDefs[0][0])+'</h3><p>'+(floorMode?'Same category across every floor. Floor selection is ignored in this comparison; date, shift, QTC and email filters still apply.':'Switch Top / Lower 15 by Total Submit. QCs with zero submits in this category are excluded. Date, shift, floor and email filters apply.')+'</p><div class="an-chart-key">'+chartDefs.map(([name,,color])=>'<span><i style="background:'+color+'"></i>'+name+'</span>').join('')+'</div>';
 if(groups===null){panel.insertAdjacentHTML('beforeend','<div class="ux-empty">Required column unavailable: '+esc(field)+'</div>');container.appendChild(panel);return;}
 {const stageSelect=document.createElement('select');stageSelect.className='an-stage-select';stageSelect.setAttribute('aria-label',floorMode?'Floor comparison category':'QC comparison category');defs.forEach(([name,key])=>stageSelect.add(new Option(name,key)));stageSelect.value=comparisonStage;stageSelect.onchange=()=>{analysisFilters[floorMode?'floorStage':'qcStage']=stageSelect.value;renderAnalysis();};panel.insertBefore(stageSelect,panel.querySelector('.an-chart-key'));}
 if(!floorMode){const toggle=document.createElement('button');toggle.className='btn btn-c';toggle.classList.add('an-qc-switch');toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(!!analysisFilters.qcLower));toggle.textContent=analysisFilters.qcLower?'Lower 15 · switch to Top 15':'Top 15 · switch to Lower 15';toggle.onclick=()=>{analysisFilters.qcLower=!analysisFilters.qcLower;renderAnalysis();};const controls=document.createElement('div');controls.className='an-qc-controls';const categorySelect=panel.querySelector('.an-stage-select');panel.insertBefore(controls,panel.querySelector('.an-chart-key'));controls.append(categorySelect,toggle);}
 const max=Math.max(1,...groups.flatMap(g=>chartDefs.map(d=>g.totals[d[1]])));
 const chart=document.createElement('div');chart.className='an-group-chart '+layout;chart.setAttribute('aria-label','Total Submit by '+label);
 groups.forEach(g=>{const group=document.createElement('div');group.className='an-bar-group';const title=document.createElement('strong');title.textContent=g.name;title.className='an-group-name';group.appendChild(title);const bars=document.createElement('div');bars.className='an-category-bars';chartDefs.forEach(([name,cat,color])=>{const bar=document.createElement('button');bar.className='an-category-bar';const value=g.totals[cat];bar.style.setProperty('--bar-color',color);bar.style.setProperty('--bar-size',Math.max(value?2:0,value/max*100)+'%');bar.setAttribute('aria-label',g.name+' · '+name+': '+value+' submissions. Select to filter.');const mi=hdrs.findIndex(h=>h.trim().toLowerCase()==='modality'),pi=hdrs.findIndex(h=>h.trim().toLowerCase()==='pass');bar._tooltipRows=(g.rows||[]).filter(r=>{const mod=String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');return (mod==='lidar'?'lidar':mod==='laneline'?'lane':'')+String(r[pi]||'').trim().toUpperCase()===cat;});bar._tooltipTitle=g.name+' · '+name;bar.setAttribute('aria-description','Total Unique QTC: '+(uniqueQtcCount(bar._tooltipRows)??'Unavailable'));bar.innerHTML='<span>'+value.toLocaleString()+'</span>';bar.onclick=()=>{analysisFilters[key]=g.name;analysisFilters.category=cat;renderAnalysis();};bars.appendChild(bar);});group.appendChild(bars);chart.appendChild(group);});
 panel.appendChild(chart);if(!groups.length)chart.innerHTML='<div class="ux-empty">No matching submissions.</div>';container.appendChild(panel);
 });analysis.querySelector('.ux-overview').appendChild(container);
 const hint=document.createElement('p');hint.className='an-context';hint.textContent='Chart filters: '+[analysisFilters.unit,analysisFilters.qtc,defs.find(d=>d[1]===analysisFilters.category)?.[0]].filter(Boolean).join(' · ');const clear=document.createElement('button');clear.className='btn';clear.textContent='Clear chart filters';clear.onclick=()=>{Object.assign(analysisFilters,{unit:'',qtc:'',category:''});renderAnalysis();};hint.append(' ',clear);container.prepend(hint);
 const tooltip=document.createElement('div');tooltip.className='an-chart-tooltip';tooltip.role='tooltip';tooltip.hidden=true;document.body.querySelectorAll('.an-chart-tooltip').forEach(n=>n.remove());document.body.appendChild(tooltip);
 function show(rows,title,event){const totals=labelerSubmissionMetrics(rows).totals;tooltip.replaceChildren();const heading=document.createElement('b');heading.textContent=title;tooltip.appendChild(heading);const qtcLine=document.createElement('div');qtcLine.textContent='Total Unique QTC: '+(uniqueQtcCount(rows)??'Unavailable');tooltip.appendChild(qtcLine);defs.forEach(([name,key])=>{const p=document.createElement('div');p.textContent=name+': '+totals[key].toLocaleString();tooltip.appendChild(p);});tooltip.hidden=false;const rect=event.currentTarget.getBoundingClientRect();const x=event.clientX||rect.left,y=event.clientY||rect.top;tooltip.style.left=Math.min(Math.max(8,x+14),innerWidth-245)+'px';tooltip.style.top=Math.max(8,Math.min(y+14,innerHeight-170))+'px';}
 function bind(el,rows,title,select){el.setAttribute('role','button');const display=e=>show(rows,title,e);el.addEventListener('pointermove',display);el.addEventListener('focus',display);el.addEventListener('pointerleave',()=>tooltip.hidden=true);el.addEventListener('blur',()=>tooltip.hidden=true);el.addEventListener('click',()=>{tooltip.hidden=true;select();});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}if(e.key==='Escape')tooltip.hidden=true;});}
 container.querySelectorAll('.an-category-bar').forEach(bar=>{const display=e=>show(bar._tooltipRows,bar._tooltipTitle,e);bar.addEventListener('pointermove',display);bar.addEventListener('focus',display);bar.addEventListener('pointerleave',()=>tooltip.hidden=true);bar.addEventListener('blur',()=>tooltip.hidden=true);bar.addEventListener('click',()=>tooltip.hidden=true);});
 const line=$('anLine').querySelector('svg');
 if(line){const circles=line.querySelectorAll('circle');circles.forEach((el,i)=>{const date=a.points[i][0];bind(el,a.selected.filter(r=>rDate(r)===date),date,()=>{analysisFilters.from=date;analysisFilters.to=date;renderAnalysis();});});
 line.addEventListener('click',e=>{if(e.target.closest('circle'))return;const rect=line.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*760;const index=Math.min(a.points.length-1,Math.max(0,Math.round((x-55)/(760-55-20)*Math.max(0,a.points.length-1))));const d=a.points[index]?.[0];if(d){analysisFilters.from=d;analysisFilters.to=d;tooltip.hidden=true;renderAnalysis();}});
 line.addEventListener('pointermove',e=>{if(e.target.closest('circle'))return;const rect=line.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*760;const i=Math.min(a.points.length-1,Math.max(0,Math.round((x-55)/685*Math.max(0,a.points.length-1))));const date=a.points[i]?.[0];if(date)show(a.selected.filter(r=>rDate(r)===date),date,e);});line.addEventListener('pointerleave',()=>tooltip.hidden=true);
 }
 const si=hdrs.findIndex(h=>h.trim().toLowerCase()==='shift');const shiftName=r=>si>=0?String(r[si]||'').trim()||'Unknown':'Unknown';
 $('anDonut').querySelectorAll('circle[tabindex]').forEach((el,i)=>{const shift=a.shifts[i][0];el.style.pointerEvents='stroke';bind(el,a.selected.filter(r=>shiftName(r)===shift),shift,()=>{analysisFilters.shift=shift;renderAnalysis();});});
 $('anLegend').querySelectorAll(':scope > div').forEach((el,i)=>{el.tabIndex=0;const shift=a.shifts[i][0];bind(el,a.selected.filter(r=>shiftName(r)===shift),shift,()=>{analysisFilters.shift=shift;renderAnalysis();});});
}

function analysisAggregate(rows,filters){
 const idx=name=>hdrs.findIndex(h=>h.toLowerCase()===name.toLowerCase());const mi=idx('Modality'),si=idx('Shift');
 const lane=r=>mi>=0&&String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'')==='laneline';
 const fi=idx(hdrs.some(h=>h.trim().toLowerCase()==='floor')?'Floor':'Unit'),qi=idx('Qtc Name'),passIdx=idx('Pass');
 const selected=rows.filter(r=>{const date=rDate(r);const mod=mi<0?'':String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');const pass=passIdx<0?'':String(r[passIdx]||'').trim().toUpperCase();const category=(mod==='lidar'?'lidar':mod==='laneline'?'lane':'')+pass;return (!filters.unit||(fi>=0&&(String(r[fi]||'').trim()||'Unknown')===filters.unit))&&(!filters.qtc||(qi>=0&&(String(r[qi]||'').trim()||'Unknown')===filters.qtc))&&(!filters.category||category===filters.category)&& (!filters.from||date>=filters.from)&&(!filters.to||date&&date<=filters.to)&&(filters.modality!=='lane'||lane(r))&&(!filters.shift||(si>=0?String(r[si]||'').trim()||'Unknown':'Unknown')===filters.shift);});
 const dates=new Map(),shifts=new Map();selected.forEach(r=>{const d=rDate(r);if(d)dates.set(d,(dates.get(d)||0)+1);const shift=si<0?'Unknown':String(r[si]||'').trim()||'Unknown';shifts.set(shift,(shifts.get(shift)||0)+1);});
 const dated=[...dates.keys()].sort();const points=[];
 if(dated.length){const from=filters.from||dated[0],to=filters.to||dated[dated.length-1];let d=new Date(from+'T00:00:00Z');const end=new Date(to+'T00:00:00Z');while(d<=end){const key=d.toISOString().slice(0,10);points.push([key,dates.get(key)||0]);d.setUTCDate(d.getUTCDate()+1);}}
 return {selected,points,shifts:[...shifts].sort((a,b)=>b[1]-a[1]),lane:mi<0?null:selected.filter(lane).length,undated:selected.length-[...dates.values()].reduce((a,b)=>a+b,0)};
}
const slicerQueries={};
const slicerDropdownOpen={};
const slicerValueCache=new WeakMap();function slicerValues(rows,column){if(column<0)return [];let columns=slicerValueCache.get(rows);if(!columns){columns=new Map();slicerValueCache.set(rows,columns);}if(!columns.has(column))columns.set(column,[...new Set(rows.map(r=>String(r[column]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})));return columns.get(column);}
function createListSlicers(){
 const host=document.createElement('div');host.className='an-list-slicers';
 [['Shift','Shift'],['Floor',hdrs.some(h=>h.trim().toLowerCase()==='floor')?'Floor':'Unit'],['QTC','Qtc Name'],['Email','Yubikey Email']].forEach(([label,key])=>{
 const ci=hdrs.findIndex(h=>h.trim().toLowerCase()===key.toLowerCase());const apiKey={'Shift':'shift','Unit':'unit','Floor':'unit','Qtc Name':'qtc','Yubikey Email':'email'}[key];const values=protectedOptions&&apiKey?(protectedOptions[apiKey]||[]):slicerValues(rawRows,ci);
 if(ci>=0)sIdx[key]=ci;
 const clearChartSelection=()=>{if(key==='Shift')analysisFilters.shift='';if(label==='Floor')analysisFilters.unit='';if(label==='QTC')analysisFilters.qtc='';};
 const panel=document.createElement('section');panel.className='an-slicer';const title=document.createElement('div');title.className='an-slicer-head';const heading=document.createElement('b');heading.textContent=label;const clear=document.createElement('button');clear.type='button';clear.className='btn';clear.textContent='Clear All';clear.setAttribute('aria-label','Clear '+label+' selections');clear.onclick=()=>{clearChartSelection();sel[key]?.clear();if(key==='Shift')setShiftsUI(null);applyAll();refreshOpenSlicers();};const selectAll=document.createElement('button');selectAll.type='button';selectAll.className='btn';selectAll.textContent='Select All';selectAll.disabled=values.length===0;selectAll.setAttribute('aria-label','Select all '+label+' values');selectAll.onclick=()=>{clearChartSelection();sel[key]=new Set(values);if(key==='Shift')setShiftsUI(null);applyAll();refreshOpenSlicers();};const actions=document.createElement('div');actions.className='an-slicer-actions';actions.append(selectAll,clear);title.append(heading,actions);panel.appendChild(title);
 const search=document.createElement('input');search.type='search';search.placeholder='Search '+label+'…';search.setAttribute('aria-label','Search '+label);search.value=slicerQueries[key]||'';panel.appendChild(search);
 const list=document.createElement('div');list.className='an-slicer-options';list.setAttribute('role','group');list.setAttribute('aria-label',label+' filter options');panel.appendChild(list);
 function draw(){list.replaceChildren();const q=search.value.trim().toLowerCase();const visible=values.filter(v=>v.toLowerCase().includes(q));visible.forEach(value=>{const row=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!sel[key]?.has(value);const text=document.createElement('span');text.textContent=value;row.append(checkbox,text);checkbox.onchange=()=>{clearChartSelection();if(!sel[key])sel[key]=new Set();if(key==='Shift')setShiftsUI(null);checkbox.checked?sel[key].add(value):sel[key].delete(value);applyAll();refreshOpenSlicers();};list.appendChild(row);});if(!visible.length){const empty=document.createElement('p');empty.className='ux-note';empty.textContent=ci<0?'Column unavailable':'No matching values';list.appendChild(empty);}}
 search.oninput=()=>{slicerQueries[key]=search.value;draw();};draw();
 const dropdown=document.createElement('details');dropdown.className='an-slicer-dropdown';dropdown.dataset.slicerKey=key;dropdown.open=!!slicerDropdownOpen[key];
 const summary=document.createElement('summary');summary.setAttribute('aria-label',label+' filter');const selected=[...(sel[key]||[])];summary.textContent=selected.length===0?label+' · All':label+' · '+(selected.length===1?selected[0]:selected.length+' selected');summary.title=selected.length?selected.join(', '):'All '+label;dropdown.append(summary,panel);
 dropdown.addEventListener('toggle',()=>{if(!dropdown.isConnected)return;slicerDropdownOpen[key]=dropdown.open;if(dropdown.open){document.querySelectorAll('.an-slicer-dropdown[open]').forEach(other=>{if(other!==dropdown){other.open=false;slicerDropdownOpen[other.dataset.slicerKey]=false;}});}});
 dropdown.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();dropdown.open=false;slicerDropdownOpen[key]=false;summary.focus();}});
 host.appendChild(dropdown);
 });return host;
}
function refreshOpenSlicers(){if(filterDrawer.open)renderDrawerAnalysis();}

function enableAnalysisFlips(rows){
 const flipCache=new Map();
 analysis.querySelectorAll('.an-metrics > article').forEach(card=>{
 const label=card.querySelector('.ux-label')?.textContent||'Metric';const note=card.querySelector('p')?.textContent||'';
 const category=[['Lidar FP','lidarFP'],['Lidar QA','lidarQA'],['Lane Line FP','laneFP'],['Lane Line QA','laneQA']].find(([name])=>label.includes(name));
 const cacheKey=category?category[1]:'all';let cached=flipCache.get(cacheKey);if(!cached){const mi=hdrs.findIndex(h=>h.trim().toLowerCase()==='modality'),pi=hdrs.findIndex(h=>h.trim().toLowerCase()==='pass');const relevant=category?rows.filter(r=>{const mod=String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');return (mod==='lidar'?'lidar':mod==='laneline'?'lane':'')+String(r[pi]||'').trim().toUpperCase()===category[1];}):rows;const metrics=labelerSubmissionMetrics(relevant);cached={relevant,metrics,qtc:uniqueQtcCount(relevant)};flipCache.set(cacheKey,cached);}
 const {relevant,metrics,qtc}=cached;
 const front=document.createElement('div');front.className='an-flip-front';while(card.firstChild)front.appendChild(card.firstChild);
 const back=document.createElement('div');back.className='an-flip-back';back.inert=true;const title=document.createElement('b');title.textContent=label;const description=document.createElement('p');description.textContent=note;back.append(title,description);
 [['Total Submit',relevant.length],['Unique Labelers',metrics.unique??'—'],['Unique QTC',qtc??'—']].forEach(([key,value])=>{const line=document.createElement('p');line.textContent=key+': '+(typeof value==='number'?value.toLocaleString():value);back.appendChild(line);});
 const hint=document.createElement('span');hint.className='ux-note';hint.textContent='Current filters · click to return';back.appendChild(hint);
 const inner=document.createElement('div');inner.className='an-flip-inner';inner.append(front,back);card.appendChild(inner);card.classList.add('an-flip-card');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',label+' — flip for filtered details');card.setAttribute('aria-pressed','false');
 const cue=document.createElement('span');cue.className='an-flip-cue';cue.textContent='↻';cue.setAttribute('aria-hidden','true');card.appendChild(cue);
 const toggle=()=>{const flipped=card.classList.toggle('an-is-flipped');front.inert=flipped;back.inert=!flipped;card.setAttribute('aria-pressed',String(flipped));};card.onclick=toggle;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}if(e.key==='Escape'&&card.classList.contains('an-is-flipped'))toggle();};
 });
}

function renderAnalysis(){
if(analysis.hidden)return;
 const base=rowsInView(),a=analysisAggregate(base,analysisFilters),catSummary=getCategorySummary(a.selected),labelerMetrics=labelerSubmissionMetrics(a.selected),si=hdrs.findIndex(h=>h.toLowerCase()==='shift');
 const shifts=[...new Set(base.map(r=>si>=0?String(r[si]||'').trim():'').filter(Boolean))].sort();const top=a.points.length?[...a.points].sort((a,b)=>b[1]-a[1])[0]:null;
 const palette=['#7258f5','#15b8a6','#ed9a35','#e9689e','#459ce8','#9ca53c','#b77bdb','#7689a3'];
 analysis.innerHTML='<div class="ux-overview"><div class="ux-heading"><div><div class="ux-eyebrow">Team output · live insights</div><h2>Analysis Overview</h2><p>Submission trends and shift contribution · one row = one submit</p></div>'+renderHeaderControlsHTML('an')+'</div><div class="ux-panel an-filters"><label>From<input id="anFrom" type="date" value="'+analysisFilters.from+'"></label><label>To<input id="anTo" type="date" value="'+analysisFilters.to+'"></label><label>Modality<select id="anMod"><option value="all">All modalities</option><option value="lane">Lane Line</option></select></label><label>Shift<select id="anShift"><option value="">All shifts</option>'+shifts.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></label><button class="btn btn-c" id="anApply">Apply filters</button><button class="btn" id="anReset">Reset</button><button class="btn" id="anDashboard">Dashboard filters ↗</button></div><p class="an-context">Uses current dashboard filters'+(activeLoc&&!activeLoc.startsWith('__')?' · '+esc(activeLoc):'')+'. These filters narrow that selection.</p>'
  +renderCategoryCardsHTML(catSummary,analysisFilters.category,'analysis')
  +'<div class="ux-panels"><section class="ux-panel"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px"><div><h3 style="margin:0 0 4px">Submit by date · Area Trend</h3><p style="margin:0">Hover for details or click a date to filter. Select stage below.</p></div><div class="an-chart-cat-tabs" id="anChartCatTabs">'
   +[
     {key:'all',label:'All Stages (Total)',color:'#8a6ff7'},
     {key:'lidarFP',label:'Lidar FP',color:'#7258f5'},
     {key:'lidarQA',label:'Lidar QA',color:'#15b8a6'},
     {key:'laneFP',label:'Lane Line FP',color:'#ed9a35'},
     {key:'laneQA',label:'Lane Line QA',color:'#e9689e'}
   ].map(t=>'<button class="an-chart-tab '+(t.key===(analysisFilters.chartCategory||'all')?'active':'')+'" style="--tab-color:'+t.color+'" data-tab-cat="'+t.key+'">'+t.label+'</button>').join('')
   +'</div></div><div id="anLine" class="an-line"></div><p>'+(a.undated?a.undated+' submissions without a valid date are excluded from this chart.':'Date follows the dashboard timestamp column.')+'</p><details><summary>View daily values</summary><div class="an-values">'+a.points.map(([d,c])=>'<p>'+d+' · '+c.toLocaleString()+'</p>').join('')+'</div></details></section><section class="ux-panel"><h3>Submit share by shift</h3><p>Share of '+a.selected.length.toLocaleString()+' filtered submissions.</p><div id="anDonut" class="an-donut"></div><div id="anLegend" class="an-legend"></div></section></div></div>';
 bindHeaderControls(analysis,'an');
 analysis.querySelectorAll('.an-cat-card[data-cat]').forEach(card=>{
  const cat=card.dataset.cat;
  card.onclick=()=>{
   analysisFilters.category=analysisFilters.category===cat?'':cat;
   renderAnalysis();
  };
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.onclick();}};
 });
 enableAnalysisFlips(a.selected);
  analysis.querySelectorAll('[data-tab-cat]').forEach(btn=>{
   btn.onclick=()=>{
    analysisFilters.chartCategory=btn.dataset.tabCat;
    renderAnalysis();
   };
  });
 const oldFilterBar=analysis.querySelector('.an-filters');oldFilterBar.replaceWith(createListSlicers());
 const resetBar=document.createElement('div');resetBar.className='an-selection-toolbar';
 const resetButton=document.createElement('button');resetButton.className='btn';resetButton.textContent='Clear all filters';resetButton.onclick=()=>{Object.assign(analysisFilters,{from:'',to:'',modality:'all',shift:'',unit:'',qtc:'',category:''});clearAll();refreshOpenSlicers();};
 const catLabel={'lidarFP':'Lidar FP','lidarQA':'Lidar QA','laneFP':'Lane Line FP','laneQA':'Lane Line QA'}[analysisFilters.category]||analysisFilters.category;
 const selectionText=document.createElement('span');selectionText.className='ux-note';selectionText.textContent=[analysisFilters.from&&('Date: '+analysisFilters.from+(analysisFilters.to!==analysisFilters.from?' → '+analysisFilters.to:'')),analysisFilters.shift,analysisFilters.unit,analysisFilters.qtc,catLabel].filter(Boolean).join(' · ')||'Select multiple values · changes apply immediately';resetBar.append(selectionText,resetButton);analysis.querySelector('.an-context').replaceWith(resetBar);
 if(!a.selected.length){$('anLine').innerHTML='<div class="ux-empty">'+(window._firstDataReady?'No submissions match these filters.':'Waiting for dashboard data…')+'</div>';$('anDonut').innerHTML='<div class="ux-empty">No shift distribution available.</div>';addAnalysisCharts(a);return;}
 if(!a.points.length)$('anLine').innerHTML='<div class="ux-empty">No valid dates available.</div>';
 else{
 const chartCat=analysisFilters.chartCategory||'all';
  const catColorMap={all:'#8a6ff7',lidarFP:'#7258f5',lidarQA:'#15b8a6',laneFP:'#ed9a35',laneQA:'#e9689e'};
  const strokeColor=catColorMap[chartCat]||'#8a6ff7';
  let catRows=a.selected;
  if(chartCat!=='all'){
   const mi=hdrs.findIndex(h=>h.toLowerCase()==='modality');
   const pi=hdrs.findIndex(h=>h.toLowerCase()==='pass');
   catRows=a.selected.filter(r=>{
    const mod=mi<0?'':String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');
    const pass=pi<0?'':String(r[pi]||'').trim().toUpperCase();
    const prefix=mod==='lidar'?'lidar':(mod==='laneline'||mod==='lane')?'lane':'';
    return (prefix+pass)===chartCat;
   });
  }
  const catDates=new Map();
  catRows.forEach(r=>{const d=rDate(r);if(d)catDates.set(d,(catDates.get(d)||0)+1);});
  const chartPoints=a.points.map(([d])=>[d,catDates.get(d)||0]);

  const W=760,H=280,L=55,R=20,T=20,B=45,max=Math.max(1,...chartPoints.map(p=>p[1]));const x=i=>L+(chartPoints.length===1?(W-L-R)/2:i/(chartPoints.length-1)*(W-L-R)),y=v=>H-B-v/max*(H-T-B);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="Daily submission area chart">';
  svg+='<defs><linearGradient id="anAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+strokeColor+'" stop-opacity="0.38"/><stop offset="100%" stop-color="'+strokeColor+'" stop-opacity="0.02"/></linearGradient></defs>';
  for(let i=0;i<5;i++){const value=max*i/4,yy=y(value);svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--border)" stroke-dasharray="3 3"/><text x="'+(L-9)+'" y="'+(yy+4)+'" text-anchor="end">'+Number(value.toFixed(1)).toLocaleString()+'</text>';}
  if(chartPoints.length>1){
   const polyPoints=[L+','+(H-B),...chartPoints.map((p,i)=>x(i)+','+y(p[1])),(chartPoints.length===1?L:x(chartPoints.length-1))+','+(H-B)].join(' ');
   svg+='<polygon fill="url(#anAreaGrad)" points="'+polyPoints+'"/>';
  }
  svg+='<polyline fill="none" stroke="'+strokeColor+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="'+chartPoints.map((p,i)=>x(i)+','+y(p[1])).join(' ')+'"/>';
  chartPoints.forEach(([d,c],i)=>{svg+='<circle tabindex="0" role="img" aria-label="'+d+': '+c+' submissions" cx="'+x(i)+'" cy="'+y(c)+'" r="4.5" fill="'+strokeColor+'" stroke="var(--bg-3)" stroke-width="1.5"><title>'+d+' ('+chartCat+'): '+c.toLocaleString()+' submissions</title></circle>';if(i===0||i===chartPoints.length-1||(chartPoints.length>3&&i===Math.floor(chartPoints.length/2)))svg+='<text x="'+x(i)+'" y="'+(H-12)+'" text-anchor="'+(i===0?'start':i===chartPoints.length-1?'end':'middle')+'">'+d+'</text>';});$('anLine').innerHTML=svg+'</svg>';
 }
 let offset=0;const circumference=2*Math.PI*70;let ring='<svg viewBox="0 0 200 200" role="group" aria-label="Shift submission share donut chart"><circle cx="100" cy="100" r="70" fill="none" stroke="var(--border)" stroke-width="26"/>';
 a.shifts.forEach(([s,c],i)=>{const length=c/a.selected.length*circumference;ring+='<circle tabindex="0" role="img" aria-label="'+esc(s)+': '+c+' submissions, '+(c/a.selected.length*100).toFixed(1)+' percent" cx="100" cy="100" r="70" fill="none" stroke="'+palette[i%palette.length]+'" stroke-width="26" stroke-dasharray="'+length+' '+(circumference-length)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 100 100)"><title>'+esc(s)+' · '+c.toLocaleString()+' · '+(c/a.selected.length*100).toFixed(1)+'%</title></circle>';offset+=length;});
 $('anDonut').innerHTML=ring+'<text x="100" y="99" text-anchor="middle" class="an-total">'+a.selected.length.toLocaleString()+'</text><text x="100" y="120" text-anchor="middle">Submissions</text></svg>';
 $('anLegend').innerHTML=a.shifts.map(([s,c],i)=>'<div><span style="background:'+palette[i%palette.length]+'" class="an-dot"></span><span>'+esc(s)+'</span><b>'+c.toLocaleString()+'</b><span>'+(c/a.selected.length*100).toFixed(1)+'%</span></div>').join('');
 addAnalysisCharts(a);
}

/* Named local filter bookmarks, isolated by signed-in account. */
function bookmarkKey(){return 'meeg_filter_bookmarks_v1:'+String(getLoggedInEmail()||'guest').toLowerCase();}
function readBookmarks(){try{const data=JSON.parse(localStorage.getItem(bookmarkKey())||'[]');return Array.isArray(data)?data.filter(b=>b&&typeof b.id==='string'&&typeof b.name==='string'&&b.state):[];}catch(e){return [];}}
function writeBookmarks(items){try{localStorage.setItem(bookmarkKey(),JSON.stringify(items));return true;}catch(e){showToast('Bookmarks could not be saved. Check browser storage.');return false;}}
function captureBookmark(){const input=$('idFilterInput');return {sel:Object.fromEntries(Object.entries(sel).map(([k,v])=>[k,[...v]])),selD:[...selD],selWeeks:[...selWeeks],idFilter:input?input.value.trim():idFilter,timeFrom,timeTo,timePreset,shifts:Object.fromEntries(Object.entries(shiftState).map(([k,v])=>[k,!!v.on])),activeLoc,analysis:{...analysisFilters},view,page:location.hash==='#analysis-overview'?'analysis-overview':location.hash==='#queues-analysis'?'queues-analysis':location.hash==='#performance-labelers'?'performance-labelers':location.hash==='#performance-qtc-floor'?'performance-qtc-floor':location.hash==='#daily-report'?'daily-report':'dashboard'};}
function applyBookmark(state){
 clearTimeout(_idFilterDebounce);
 Object.keys(sel).forEach(k=>sel[k].clear());Object.entries(state.sel||{}).forEach(([k,values])=>{if(Array.isArray(values))sel[k]=new Set(values);});
 selD=new Set(state.selD||[]);selWeeks=new Set(state.selWeeks||[]);idFilter=state.idFilter||'';timeFrom=state.timeFrom||'';timeTo=state.timeTo||'';timePreset=TIME_SHIFTS[state.timePreset]?state.timePreset:'';
 setShiftsUI(state.shifts||{});activeLoc=['__all__','__totalsubmit__','__topperf__','__quality__',...locations].includes(state.activeLoc)?state.activeLoc:'__all__';
 Object.assign(analysisFilters,{from:'',to:'',modality:'all',shift:'',unit:'',qtc:'',category:''},state.analysis||{});view=['summary','details','both'].includes(state.view)?state.view:'both';
 closeAll();buildStrip();applyAll();location.hash=['analysis-overview','queues-analysis','performance-labelers','performance-qtc-floor','daily-report'].includes(state.page)?state.page:'dashboard';route();
}
const bookmarks=document.createElement('section');bookmarks.className='ux-bookmarks';bookmarks.setAttribute('aria-label','Saved filter bookmarks');bookmarks.innerHTML='<span class="ux-bookmark-icon" aria-hidden="true">☆</span><label for="uxBookmarkList">Filter bookmarks</label><select id="uxBookmarkList" aria-label="Saved filter bookmark"><option value="">Choose a bookmark…</option></select><button class="btn" id="uxBookmarkApply">Apply</button><button class="btn" id="uxBookmarkDelete">Delete</button><form id="uxBookmarkForm"><input id="uxBookmarkName" aria-label="New bookmark name" placeholder="Name this filter selection…" maxlength="60" required><button class="btn btn-c" type="submit">☆ Save bookmark</button></form><span class="ux-note">Saved on this browser</span>';
document.body.insertBefore(bookmarks,root);
function renderBookmarkList(selected){const list=$('uxBookmarkList'),items=readBookmarks();list.replaceChildren(new Option(items.length?'Choose a bookmark…':'No saved bookmarks yet',''));items.forEach(b=>list.add(new Option(b.name,b.id)));if(selected&&items.some(b=>b.id===selected))list.value=selected;const disabled=!list.value;$('uxBookmarkApply').disabled=disabled;$('uxBookmarkDelete').disabled=disabled;}
$('uxBookmarkList').onchange=()=>{const disabled=!$('uxBookmarkList').value;$('uxBookmarkApply').disabled=disabled;$('uxBookmarkDelete').disabled=disabled;};
$('uxBookmarkForm').onsubmit=e=>{e.preventDefault();const name=$('uxBookmarkName').value.trim();if(!name){$('uxBookmarkName').focus();return;}const items=readBookmarks();if(items.some(b=>b.name.toLowerCase()===name.toLowerCase())){showToast('This name already exists. Choose another bookmark name.');return;}const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);items.push({id,name,state:captureBookmark(),createdAt:new Date().toISOString()});if(writeBookmarks(items)){renderBookmarkList(id);$('uxBookmarkName').value='';showToast('Filter bookmark saved: '+name);}};
$('uxBookmarkApply').onclick=()=>{if(!window._firstDataReady){showToast('Wait for dashboard data to load before applying a bookmark.');return;}const item=readBookmarks().find(b=>b.id===$('uxBookmarkList').value);if(!item)return;applyBookmark(item.state);showToast('Bookmark applied: '+item.name);};
$('uxBookmarkDelete').onclick=()=>{const items=readBookmarks(),id=$('uxBookmarkList').value,item=items.find(b=>b.id===id);if(!item)return;if(writeBookmarks(items.filter(b=>b.id!==id))){renderBookmarkList();showToastUndo('Bookmark deleted: '+item.name,'Undo',()=>{const latest=readBookmarks();if(!latest.some(b=>b.id===item.id)){latest.push(item);if(writeBookmarks(latest))renderBookmarkList(item.id);}});}};
let bookmarkAccount=bookmarkKey();const bookmarkUserObserver=new MutationObserver(()=>{const key=bookmarkKey();if(key!==bookmarkAccount){bookmarkAccount=key;renderBookmarkList();}});if($('userName'))bookmarkUserObserver.observe($('userName'),{childList:true,subtree:true});window.addEventListener('storage',e=>{if(e.key===bookmarkKey())renderBookmarkList();});renderBookmarkList();

/* A single filter drawer shared by every page. */
const filterButton=document.createElement('button');filterButton.className='ux-nav';filterButton.id='uxOpenFilters';filterButton.textContent='☆  Bookmark / Filters';filterButton.setAttribute('aria-expanded','false');filterButton.setAttribute('aria-controls','uxFilterDrawer');aside.insertBefore(filterButton,aside.querySelector('footer'));
const filterDrawer=document.createElement('section');filterDrawer.hidden=true;filterDrawer.open=false;filterDrawer.id='uxFilterDrawer';filterDrawer.setAttribute('aria-labelledby','uxDrawerTitle');filterDrawer.innerHTML='<div class="ux-drawer-head"><div><div class="ux-eyebrow">Saved views & selection</div><h2 id="uxDrawerTitle">Bookmarks & filters</h2></div><div style="display:flex;align-items:center;gap:6px"><button class="btn btn-c" id="uxDrawerApplyFilters" style="padding:6px 14px;font-weight:700">✓ Apply</button><button class="btn" id="uxCloseFilters" aria-label="Close filters">✕ Close</button></div></div><div class="ux-drawer-body"><div class="ux-drawer-apply-banner"><div><strong>Pending filter selections?</strong><div class="ux-note">Click Apply to push all filters and bookmarks to the dashboard</div></div><button class="btn btn-c" id="uxDrawerApplyBanner" style="padding:6px 14px;font-weight:700">✓ Apply Filters</button></div><h3>Saved bookmarks</h3><div id="uxDrawerBookmarks"></div><h3>Dashboard filters</h3><div id="uxDrawerGlobal"></div><h3>Analysis Overview filters</h3><div id="uxDrawerAnalysis"></div></div>';
aside.appendChild(filterDrawer);$('uxDrawerBookmarks').appendChild(bookmarks);
const onDrawerApply=()=>{applyAll();renderAllSections();showToast('✓ Filters applied successfully');closeSidebarFilters();};
$('uxDrawerApplyFilters')?.addEventListener('click',onDrawerApply);
$('uxDrawerApplyBanner')?.addEventListener('click',onDrawerApply);
$('uxDrawerGlobal').hidden=true;$('uxDrawerGlobal').previousElementSibling.hidden=true;$('uxDrawerAnalysis').previousElementSibling.textContent='List slicers · apply immediately';
const globalFilters=$('uxDrawerGlobal');['.shift-banner','#fstrip','.pills-row','#locTabs'].forEach(selector=>{const el=root.querySelector(selector);if(el)globalFilters.appendChild(el);});
function closeSidebarFilters(){filterDrawer.hidden=true;filterDrawer.open=false;aside.classList.remove('ux-filters-mode');[...aside.children].forEach(el=>{if(el!==filterDrawer)el.inert=false;});filterButton.setAttribute('aria-expanded','false');if($('uxSidebarPeriods')?.contains(sharedPeriods))document.body.insertBefore(sharedPeriods,root);filterButton.focus();}
filterButton.onclick=()=>{renderDrawerAnalysis();renderBookmarkList();filterDrawer.hidden=false;filterDrawer.open=true;aside.classList.add('ux-filters-mode');[...aside.children].forEach(el=>{if(el!==filterDrawer&&!el.classList.contains('ux-brand'))el.inert=true;});filterButton.setAttribute('aria-expanded','true');let periodSlot=$('uxSidebarPeriods');if(!periodSlot){periodSlot=document.createElement('div');periodSlot.id='uxSidebarPeriods';filterDrawer.querySelector('.ux-drawer-body').prepend(periodSlot);}periodSlot.appendChild(sharedPeriods);$('uxCloseFilters').focus();};$('uxCloseFilters').textContent='← Pages';$('uxCloseFilters').setAttribute('aria-label','Return to page navigation');$('uxCloseFilters').onclick=closeSidebarFilters;filterDrawer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeSidebarFilters();}});

function renderDrawerAnalysis(){const box=$('uxDrawerAnalysis');box.replaceChildren(createListSlicers());}

document.addEventListener('click',e=>{if(!e.target.closest('.an-slicer-dropdown'))document.querySelectorAll('.an-slicer-dropdown[open]').forEach(el=>{el.open=false;slicerDropdownOpen[el.dataset.slicerKey]=false;});});
const perfFilters={from:'',to:'',day:'',week:'',category:'',query:'',person:'',page:0};
function performanceWeek(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;const d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime()))return null;d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+1)%7);const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);return {start,end:d.toISOString().slice(0,10)};
}
function performanceData(rows,filters){
 const index=name=>hdrs.findIndex(h=>h.trim().toLowerCase()===name.toLowerCase());
 const columns={name:index('Labeler Name'),national:index('National Id'),objects:index('Object Count'),shift:index('Shift'),qtc:index('Qtc Name'),id:index('Id'),link:index('Task Link'),mod:index('Modality'),pass:index('Pass')};
 const value=(r,key)=>columns[key]<0?'':String(r[columns[key]]||'').trim();
 const tasks=rows.map((r,i)=>{const raw=value(r,'objects').replace(/,/g,'');const objects=raw!==''&&/^\d+(?:\.\d+)?$/.test(raw)&&Number.isFinite(Number(raw))?Number(raw):null;const name=value(r,'name')||'Unknown labeler';const nid=value(r,'national').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/\.0+$/,'').replace(/[\s-]/g,'');const person=/^\d{14}$/.test(nid)?'id:'+nid:'name:'+name.normalize('NFC').replace(/\s+/g,' ').toLowerCase();return {person,name,objects,shift:value(r,'shift')||'Unknown',qtc:value(r,'qtc')||'Unknown',date:rDate(r),id:value(r,'id')||'—',link:value(r,'link'),mod:value(r,'mod'),pass:value(r,'pass'),row:i,fallback:!/^\d{14}$/.test(nid)};}).filter(t=>{
 const category=t.mod.toLowerCase().replace(/[\s_-]+/g,'')+' '+t.pass.toUpperCase();
 return (!filters.day||t.date===filters.day)&&(!filters.week||performanceWeek(t.date)?.start===filters.week)&&(!filters.from||t.date>=filters.from)&&(!filters.to||t.date&&t.date<=filters.to)&&(!filters.category||category===filters.category)&&(!filters.query||[t.name,t.shift,t.qtc,t.id].some(v=>v.toLowerCase().includes(filters.query.toLowerCase())));
 });
 tasks.sort((a,b)=>(b.objects??-1)-(a.objects??-1)||a.row-b.row);
 const map=new Map();tasks.forEach(t=>{if(!map.has(t.person))map.set(t.person,{person:t.person,name:t.name,total:0,count:0,largest:null,shifts:new Set(),qtcs:new Set(),fallback:t.fallback});const p=map.get(t.person);p.total+=t.objects??0;p.count++;if(t.objects!==null)p.largest=Math.max(p.largest??0,t.objects);p.shifts.add(t.shift);p.qtcs.add(t.qtc);});
 return {columns,tasks,people:[...map.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)),invalid:tasks.filter(t=>t.objects===null).length};
}
function renderPerformance(){
 const page=$('uxPerformance');if(!page||page.hidden)return;
 const data=performanceData(rowsInView(),perfFilters);const selected=data.people.find(p=>p.person===perfFilters.person);const tasks=perfFilters.person?data.tasks.filter(t=>t.person===perfFilters.person):data.tasks;
 const pageSize=25,totalPages=Math.max(1,Math.ceil(tasks.length/pageSize));perfFilters.page=Math.min(perfFilters.page,totalPages-1);const visible=tasks.slice(perfFilters.page*pageSize,(perfFilters.page+1)*pageSize);
 page.innerHTML='<div class="ux-overview"><div class="ux-heading"><div><div class="ux-eyebrow">Objects analysis · task tracking</div><h2>Performance per Labelers</h2><p>Ranked by Object Count. One submission row = one task entry.</p></div>'+renderHeaderControlsHTML('perf')+'</div><div id="perfSlicers"></div><div class="ux-panel perf-controls"><label>From<input id="perfFrom" type="date"></label><label>To<input id="perfTo" type="date"></label><label>Category<select id="perfCategory"><option value="">All categories</option><option value="lidar FP">Lidar FP</option><option value="lidar QA">Lidar QA</option><option value="laneline FP">Lane Line FP</option><option value="laneline QA">Lane Line QA</option></select></label><label>Search<input id="perfQuery" placeholder="Labeler, QTC, shift or task ID"></label><button class="btn btn-c" id="perfApply">Apply</button><button class="btn" id="perfReset">Reset page filters</button></div><div class="ux-grid an-metrics" style="margin:20px 0">'+[['Total Objects',data.tasks.reduce((n,t)=>n+(t.objects??0),0)],['Labelers',data.people.length],['Task entries',data.tasks.length],['Largest task',data.tasks.find(t=>t.objects!==null)?.objects??'—']].map(([name,v])=>'<div class="ux-panel"><span class="ux-label">'+name+'</span><b class="an-value">'+(typeof v==='number'?v.toLocaleString():v)+'</b></div>').join('')+'</div><p class="an-context">Uses current Shift / Floor / QTC / Email filters. '+data.invalid+' entries have missing or invalid Object Count and are excluded from object totals. Labelers use National Id; missing IDs are grouped by exact normalized name.</p><section class="ux-panel"><h3>Labeler ranking · total objects ↓</h3><p>Select a labeler to inspect their largest tasks below.</p><div class="perf-table"><table><thead><tr><th>Rank</th><th>Labeler</th><th>Total Objects</th><th>Tasks</th><th>Largest task</th><th>Shifts</th><th>QTCs</th></tr></thead><tbody>'+data.people.map((p,i)=>'<tr><td>'+(i+1)+'</td><td><button class="perf-person" data-person-index="'+i+'">'+esc(p.name)+'</button>'+(p.fallback?'<small class="ux-note"> · matched by name</small>':'')+'</td><td>'+p.total.toLocaleString()+'</td><td>'+p.count.toLocaleString()+'</td><td>'+(p.largest===null?'—':p.largest.toLocaleString())+'</td><td>'+esc([...p.shifts].join(', '))+'</td><td>'+esc([...p.qtcs].join(', '))+'</td></tr>').join('')+'</tbody></table>'+(data.people.length?'':'<p class="ux-empty">No labelers match these filters.</p>')+'</div></section><section class="ux-panel" style="margin-top:20px" id="perfTasks"><div class="ux-heading"><div><h3>Largest tasks ↓'+(perfFilters.person?' · '+esc(selected?.name||'Selected labeler'):'')+'</h3><p>Shift, submitting QTC and day for each task.</p></div><button class="btn" id="perfAll">Show all labelers</button></div><div class="perf-table"><table><thead><tr><th>Labeler</th><th>Objects</th><th>Shift</th><th>Submitting QTC</th><th>Day</th><th>Modality</th><th>Pass</th><th>Task ID</th><th>Task</th></tr></thead><tbody>'+visible.map(t=>'<tr><td>'+esc(t.name)+'</td><td><b>'+(t.objects===null?'—':t.objects.toLocaleString())+'</b></td><td>'+esc(t.shift)+'</td><td>'+esc(t.qtc)+'</td><td>'+esc(t.date||'Unknown')+'</td><td>'+esc(t.mod)+'</td><td>'+esc(t.pass)+'</td><td>'+esc(t.id)+'</td><td>'+(/^https?:\/\//i.test(t.link)?'<a href="'+esc(t.link)+'" target="_blank" rel="noopener noreferrer">Open ↗</a>':'—')+'</td></tr>').join('')+'</tbody></table>'+(tasks.length?'':'<p class="ux-empty">No tasks match this selection.</p>')+'</div><div class="perf-pagination"><button class="btn" id="perfPrev">Previous</button><span>'+ (perfFilters.page+1)+' / '+totalPages+' · '+tasks.length.toLocaleString()+' task entries</span><button class="btn" id="perfNext">Next</button></div></section></div>';
 $('perfSlicers').appendChild(createListSlicers());$('perfFrom').value=perfFilters.from;$('perfTo').value=perfFilters.to;$('perfCategory').value=perfFilters.category;$('perfQuery').value=perfFilters.query;
 $('perfApply').onclick=()=>{const from=$('perfFrom').value,to=$('perfTo').value;if(from&&to&&from>to){showToast('Choose a valid date range.');return;}Object.assign(perfFilters,{from,to,day:from||to?'':perfFilters.day,week:from||to?'':perfFilters.week,category:$('perfCategory').value,query:$('perfQuery').value.trim(),person:'',page:0});renderPerformance();};$('perfQuery').onkeydown=e=>{if(e.key==='Enter')$('perfApply').click();};
 $('perfReset').onclick=()=>{Object.assign(perfFilters,{from:'',to:'',day:'',week:'',category:'',query:'',person:'',page:0});renderPerformance();};bindHeaderControls(page,'perf');
 page.querySelectorAll('[data-person-index]').forEach(b=>b.onclick=()=>{perfFilters.person=data.people[Number(b.dataset.personIndex)].person;perfFilters.page=0;renderPerformance();$('perfTasks').scrollIntoView({behavior:reduced()?'instant':'smooth'});});
 $('perfAll').onclick=()=>{perfFilters.person='';perfFilters.page=0;renderPerformance();};$('perfPrev').disabled=perfFilters.page===0;$('perfNext').disabled=perfFilters.page>=totalPages-1;$('perfPrev').onclick=()=>{perfFilters.page--;renderPerformance();};$('perfNext').onclick=()=>{perfFilters.page++;renderPerformance();};
}

function rankQcGroups(groups,category,lower){return groups.filter(g=>g.totals[category]>0).sort((a,b)=>(lower?a.totals[category]-b.totals[category]:b.totals[category]-a.totals[category])||a.name.localeCompare(b.name)).slice(0,15);}
const sharedPeriods=document.createElement('section');sharedPeriods.className='ux-shared-periods';sharedPeriods.setAttribute('aria-label','Date filters for all pages');document.body.insertBefore(sharedPeriods,root);
function renderSharedPeriods(){
 const dates=protectedOptions?[...(protectedOptions.day||[])].sort().reverse():[...new Set(rawRows.map(r=>rDate(r)).filter(Boolean))].sort().reverse();const weeks=[...new Set(dates.map(d=>performanceWeek(d)?.start).filter(Boolean))].sort().reverse();
 sharedPeriods.replaceChildren();
 const caption=document.createElement('strong');caption.textContent='GLOBAL FILTERS';sharedPeriods.appendChild(caption);

 const dayLabel=document.createElement('label');dayLabel.textContent='Day: ';
 const day=document.createElement('input');day.type='date';day.id='sharedDay';day.setAttribute('aria-label','Day filter for all pages');day.value=selD.size===1?[...selD][0]:'';dayLabel.appendChild(day);
 const applyDay=document.createElement('button');applyDay.className='btn btn-c';applyDay.textContent='Apply Day';
 dayLabel.appendChild(applyDay);sharedPeriods.appendChild(dayLabel);

 const rangeWrap=document.createElement('div');rangeWrap.style.display='inline-flex';rangeWrap.style.alignItems='center';rangeWrap.style.gap='5px';
 rangeWrap.innerHTML='<label>From: <input type="date" id="sharedFrom"></label><label>To: <input type="date" id="sharedTo"></label><button class="btn btn-c" id="sharedApplyRange">Apply Range</button>';
 const fromInp=rangeWrap.querySelector('#sharedFrom');const toInp=rangeWrap.querySelector('#sharedTo');
 if(selD.size>1){const s=[...selD].sort();fromInp.value=s[0];toInp.value=s[s.length-1];}
 rangeWrap.querySelector('#sharedApplyRange').onclick=()=>{
  const f=fromInp.value,t=toInp.value;
  if(!f||!t||f>t){showToast('Choose a valid start and end date.');return;}
  selD.clear();selWeeks.clear();
  const rangeDates=(sOpts._dates||[]).filter(d=>d>=f&&d<=t);
  if(!rangeDates.length)selD.add(f);else rangeDates.forEach(d=>selD.add(d));
  Object.assign(analysisFilters,{from:f,to:t});
  Object.assign(perfFilters,{from:f,to:t,day:'',week:''});
  buildStrip();applyAll();renderAllSections();
  showToast('Applied range: '+f+' → '+t);
 };
 sharedPeriods.appendChild(rangeWrap);

 const weekLabel=document.createElement('label');weekLabel.textContent='Week: ';
 const week=document.createElement('select');week.id='sharedWeek';week.setAttribute('aria-label','Week filter for all pages');week.add(new Option('All weeks',''));weeks.forEach(w=>week.add(new Option(w+' → '+performanceWeek(w).end,w)));
 if(selD.size===7){const starts=new Set([...selD].map(d=>performanceWeek(d)?.start));if(starts.size===1)week.value=[...starts][0];}
 weekLabel.appendChild(week);sharedPeriods.appendChild(weekLabel);

 function applyPeriod(value,isWeek){selD.clear();selWeeks.clear();if(value){if(isWeek){const d=new Date(value+'T00:00:00Z');for(let i=0;i<7;i++){selD.add(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}}else selD.add(value);}Object.assign(analysisFilters,{from:'',to:''});Object.assign(perfFilters,{from:'',to:'',day:'',week:'',page:0,person:''});buildStrip();applyAll();}
 applyDay.onclick=()=>{if(!day.value){showToast('Choose a day from the calendar.');day.focus();return;}applyPeriod(day.value,false);};
 day.onchange=()=>{if(day.value)applyPeriod(day.value,false);};
 week.onchange=()=>applyPeriod(week.value,true);

 const clear=document.createElement('button');clear.className='btn';clear.textContent='Clear dates';clear.onclick=()=>{applyPeriod('',false);fromInp.value='';toInp.value='';day.value='';week.value='';};sharedPeriods.appendChild(clear);
 const info=document.createElement('span');info.className='ux-note';info.textContent=selD.size?selD.size+' selected day(s) · applies to all pages':'Applies to all pages';sharedPeriods.appendChild(info);
}

function dailyQueueReport(rows,universe=rows){
 const idx=name=>hdrs.findIndex(h=>h.trim().toLowerCase()===name.toLowerCase());const qi=idx('Queue Name'),mi=idx('Modality'),pi=idx('Pass'),ni=idx('National Id');
 const groups=new Map();const modality=r=>{const raw=String(r[mi]||'').trim(),key=raw.toLowerCase().replace(/[\s_-]+/g,'');return key==='lidar'?'Lidar':key==='laneline'?'Lane Line':raw||'Unspecified';};
 function group(r){const name=qi<0?'':String(r[qi]||'').trim();if(!name)return null;const mod=modality(r),key=JSON.stringify([name,mod]);if(!groups.has(key))groups.set(key,{name,mod,fp:0,qa:0,fpIds:new Set(),qaIds:new Set(),missing:0});return groups.get(key);}
 universe.forEach(group);rows.forEach(r=>{const g=group(r);if(!g)return;const pass=String(r[pi]||'').trim().toUpperCase();if(pass!=='FP'&&pass!=='QA')return;const key=pass.toLowerCase();g[key]++;const id=ni<0?'':String(r[ni]||'').trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/\.0+$/,'').replace(/[\s-]/g,'');if(/^\d{14}$/.test(id))g[key+'Ids'].add(id);else g.missing++;});
 return {hasQueue:qi>=0,hasPass:pi>=0,hasNational:ni>=0,groups:[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.mod.localeCompare(b.mod))};
}
function renderDailyReport(){
 const page=$('uxDaily');if(!page||page.hidden)return;
 if(!window._firstDataReady&&!hdrs.length){const error=$('mainContent')?.querySelector('.errbox');page.innerHTML='<div class="ux-overview"><div class="ux-heading"><h2>Daily Report</h2></div><div class="ux-panel"><h3>'+(error?'Data could not be loaded':'Waiting for source data')+'</h3><p>'+esc(error?error.textContent.replace('↻ Retry','').trim():'The report and slicer values will appear after the sheet finishes loading. You can choose a day from the calendar above.')+'</p><button class="btn btn-c" id="dailyRetry" style="margin-top:16px">↻ Retry data load</button></div></div>';$('dailyRetry').onclick=()=>loadData();return;}
const report=dailyQueueReport(rowsInView(),rawRows);const days=[...selD].sort();
 page.innerHTML='<div class="ux-overview"><div class="ux-heading"><div><div class="ux-eyebrow">Queue activity · FP / QA</div><h2>Daily Report</h2><p>'+esc(days.length===1?days[0]:days.length?days[0]+' → '+days[days.length-1]:'All dates · choose a day from the shared date filter above')+'</p></div>'+renderHeaderControlsHTML('daily')+'</div><div id="dailyShift"></div><section class="ux-panel"><h3>Queue daily summary</h3><p>Unique Labelers use valid National Id, once per Queue + Modality + Pass. Queues with zero FP and QA submissions are hidden.</p><div class="perf-table daily-table"><table><thead><tr><th>Queue</th><th>Unique Labelers (FP)</th><th>Total Submit (FP)</th><th>Unique Labelers (QA)</th><th>Total Submit (QA)</th></tr></thead><tbody>'+report.groups.filter(g=>g.fp>0||g.qa>0).map(g=>'<tr><td>'+esc(g.name)+' <span class="daily-mod '+(g.mod==='Lidar'?'daily-lidar':'daily-lane')+'">('+esc(g.mod)+')</span></td><td>'+(report.hasNational?g.fpIds.size.toLocaleString():'—')+'</td><td>'+g.fp.toLocaleString()+'</td><td>'+(report.hasNational?g.qaIds.size.toLocaleString():'—')+'</td><td>'+g.qa.toLocaleString()+'</td></tr>').join('')+'</tbody></table>'+(!report.hasQueue||!report.hasPass?'<p class="ux-empty">Queue Name and Pass columns are required.</p>':report.groups.some(g=>g.fp>0||g.qa>0)?'':'<p class="ux-empty">No queue submissions match the current filters.</p>')+'</div><p class="an-context">'+report.groups.reduce((n,g)=>n+g.missing,0)+' FP/QA entries have missing or invalid National Id; included in submit totals, excluded from unique counts.</p></section></div>';
 const slicers=createListSlicers();[...slicers.children].slice(1).forEach(el=>el.remove());$('dailyShift').appendChild(slicers);bindHeaderControls(page,'daily');
}



const sourceStateObserver=new MutationObserver(()=>{if(!window._firstDataReady){renderDailyReport();if(typeof renderQueuesAnalysis==='function')renderQueuesAnalysis();}});if($('mainContent'))sourceStateObserver.observe($('mainContent'),{childList:true,subtree:true});



/* Bound source requests and worker parsing; keep the same sheet and session. */

async function fetchSheetText(url,timeoutMs=45000){

 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);

 try{

   const response=await fetch(url,{cache:'no-store',signal:controller.signal});

   if(!response.ok)throw new Error('HTTP '+response.status);

   const text=await response.text();

   if(/^\s*</.test(text))throw new Error('Google returned a sign-in or error page instead of CSV');

   const firstLine=text.slice(0,text.indexOf('\n')>=0?text.indexOf('\n')+1:text.length);

   const first=parseCSV(firstLine)[0]||[];

   if(!first.some(h=>String(h).trim().toLowerCase()==='queue name')||!first.some(h=>String(h).trim().toLowerCase()==='pass'))throw new Error('The source response is missing Queue Name or Pass');

   return text;

 }catch(e){

   if(e.name==='AbortError')throw new Error('Source request timed out');

   throw e;

 }finally{clearTimeout(timer);}

}



const originalCsvParser=parseCSVAsync;

parseCSVAsync=function(text){

 return new Promise((resolve,reject)=>{

   const timer=setTimeout(()=>{

     try{resolve(parseCSV(text).filter(r=>r&&r.length&&r.some(c=>String(c||'').trim())));}catch(e){reject(e);}

   },15000);

   Promise.resolve().then(()=>originalCsvParser(text)).then(table=>{

     clearTimeout(timer);resolve(table);

   },error=>{

     clearTimeout(timer);

     try{resolve(parseCSV(text).filter(r=>r&&r.length&&r.some(c=>String(c||'').trim())));}catch(e){reject(error);}

   });

 });

};



let sheetLoadPromise=null;

let _instantCacheAttempted=false;



loadData=function(){

 if(sheetLoadPromise)return sheetLoadPromise;

 if(!getLoggedInEmail()){showToast('Sign in to load dashboard data.');return Promise.resolve();}

 const button=$('refreshBtn');setSyncActive(true);setTrafficLight('yellow');if(button)button.disabled=true;



 // Fast cache hydration: immediately render from IndexedDB if memory is empty

 if(!rawRows.length&&!_instantCacheAttempted){

   _instantCacheAttempted=true;

   idbGet('csv').then(cached=>{

     if(cached&&cached.v===AUTH_VER&&cached.text&&!rawRows.length){

       parseCSVAsync(cached.text).then(table=>{

         if(!rawRows.length&&table&&table.length){

           onCsvTable(table);

           setTrafficLight('yellow');

           showToast('⚡ Showing cached data — syncing latest updates…');

         }

       }).catch(()=>{});

     }

   }).catch(()=>{});

 }



 if(!rawRows.length)$('mainContent').innerHTML='<div class="loader"><div class="spin"></div><span class="ltxt">Loading source data…</span></div>';

 

 const base='https://docs.google.com/spreadsheets/d/'+SHEET_ID;

 const cleanQuery=encodeURIComponent('select * where A is not null');

 const urls=[

   base+'/gviz/tq?tqx=out:csv&headers=1&tq='+cleanQuery+(SHEET_GID?'&gid='+encodeURIComponent(SHEET_GID):''),

   base+'/export?format=csv&gid='+encodeURIComponent(SHEET_GID),

   base+'/gviz/tq?tqx=out:csv&headers=1&gid='+encodeURIComponent(SHEET_GID)

 ];



 sheetLoadPromise=(async()=>{

   let failure;

   for(const url of urls){

     try{

       const text=await fetchSheetText(url,45000);

       const hash=simpleHash(text);

       if(hash===_lastCsvHash&&rawRows.length){

         lastUpdateTs=Date.now();

         updateRelativeTime();

         setTrafficLight('green');

         return;

       }

       const table=await parseCSVAsync(text);

       onCsvTable(table);

       _lastCsvHash=hash;

       idbSet('csv',{v:AUTH_VER,ts:Date.now(),text});

       setTrafficLight('green');

       return;

     }catch(e){

       failure=e;

     }

   }



   if(!rawRows.length){

     const cached=await idbGet('csv');

     if(cached&&cached.v===AUTH_VER&&cached.text){

       try{

         onCsvTable(await parseCSVAsync(cached.text));

         setTrafficLight('yellow');

         showToast('Showing saved data. Google could not be reached.');

         return;

       }catch(e){}

     }

     showErr('Could not load the Google Sheet: '+(failure?.message||'Network error')+'. Check your connection and sheet viewing access, then retry.');

   }else{

     setTrafficLight('red');

     showToast('Refresh failed — keeping the last loaded data.');

   }

 })().finally(()=>{

   sheetLoadPromise=null;

   setSyncActive(false);

   if(button)button.disabled=false;

   renderAllSections();

 });



 return sheetLoadPromise;

};



const rowDates=new WeakMap();

const uncachedRowDate=rDate;

rDate=function(row){

 const source=tsIdx>=0?row[tsIdx]:undefined;

 const hit=rowDates.get(row);

 if(hit&&hit.column===tsIdx&&hit.source===source)return hit.value;

 const value=uncachedRowDate(row);

 rowDates.set(row,{column:tsIdx,source,value});

 return value;

};



const oldRender=renderAllSections;


/* ============ Queues Analysis Logic ============ */
/* queuesFilters declared at top */

function queuesAggregateData(rows){
 const idx=name=>hdrs.findIndex(h=>String(h).trim().toLowerCase()===name);
 const qi=idx('queue name'),si=idx('shift'),fi=hdrs.findIndex(h=>['floor','unit'].includes(String(h).trim().toLowerCase()));
 const qci=idx('qtc name'),mi=idx('modality'),pi=idx('pass'),ni=idx('national id'),li=idx('labeler name');

 const queueMap=new Map();

 rows.forEach(r=>{
  const qName=qi>=0?String(r[qi]||'').trim():'';
  if(!qName)return;

  if(!queueMap.has(qName)){
   queueMap.set(qName,{
    name:qName,
    shifts:new Set(),
    floors:new Set(),
    qtcs:new Set(),
    labelers:new Set(),
    totalSubmit:0,
    lidarFP:0,
    lidarQA:0,
    laneFP:0,
    laneQA:0
   });
  }

  const item=queueMap.get(qName);

  const shift=si>=0?String(r[si]||'').trim():'';
  if(shift)item.shifts.add(shift);

  const floor=fi>=0?String(r[fi]||'').trim():'';
  if(floor)item.floors.add(floor);

  const qtc=qci>=0?String(r[qci]||'').normalize('NFC').trim().replace(/\s+/gu,' '):'';
  if(qtc)item.qtcs.add(qtc);

  let lid='';
  if(ni>=0){
   const rawNi=String(r[ni]??'').trim()
    .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
    .replace(/\.0+$/,'').replace(/[\s-]/g,'');
   if(/^\d{14}$/.test(rawNi))lid=rawNi;
  }
  if(!lid&&li>=0){
   const name=String(r[li]??'').trim().toLowerCase();
   if(name)lid='name:'+name;
  }
  if(lid)item.labelers.add(lid);

  item.totalSubmit++;

  const mod=mi<0?'':String(r[mi]??'').trim().toLowerCase().replace(/[\s_-]+/g,'');
  const pass=pi<0?'':String(r[pi]??'').trim().toUpperCase();
  const prefix=mod==='lidar'?'lidar':(mod==='laneline'||mod==='lane')?'lane':'';
  if(prefix&&(pass==='FP'||pass==='QA')){
   const key=prefix+pass;
   if(item[key]!==undefined)item[key]++;
  }
 });

 return [...queueMap.values()].map(q=>{
  const uniqueLabelers=q.labelers.size;
  const avgSubmit=uniqueLabelers>0?(q.totalSubmit/uniqueLabelers).toFixed(1):'0';
  return {
   name:q.name,
   shifts:[...q.shifts].sort(),
   floors:[...q.floors].sort(),
   qtcs:[...q.qtcs].sort(),
   totalSubmit:q.totalSubmit,
   lidarFP:q.lidarFP,
   lidarQA:q.lidarQA,
   laneFP:q.laneFP,
   laneQA:q.laneQA,
   uniqueLabelers,
   avgSubmit:Number(avgSubmit),
   avgSubmitStr:avgSubmit,
   uniqueQtc:q.qtcs.size
  };
 });
}

function exportQueuesCSV(queues){
 if(!queues.length){showToast('No queues to export.');return;}
 const headers=['Queue Name','Shifts','Floors / Units','QTC Names','Total Unique QTC','Lidar FP Submit','Lidar QA Submit','Lane Line FP Submit','Lane Line QA Submit','Total Submit','Unique Labelers','Avg Submit / Labeler'];
 const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 const rows=queues.map(q=>[
  q.name,
  q.shifts.join('; '),
  q.floors.join('; '),
  q.qtcs.join('; '),
  q.uniqueQtc,
  q.lidarFP,
  q.lidarQA,
  q.laneFP,
  q.laneQA,
  q.totalSubmit,
  q.uniqueLabelers,
  q.avgSubmitStr
 ]);
 const csv=[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
 downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'MEEG_queues_analysis_'+cairoToday()+'.csv');
 showToast('Queues analysis exported to CSV.');
}

function renderQueuesAnalysis(){
 const page=$('uxQueues');
 if(!page||page.hidden)return;

 if(!window._firstDataReady&&!hdrs.length){
  const error=$('mainContent')?.querySelector('.errbox');
  page.innerHTML='<div class="ux-overview"><div class="ux-heading"><div><div class="ux-eyebrow">Queue breakdown · Shifts & Floors & QTCs</div><h2>Queues Analysis</h2><p>Submission volume, shifts, floors, and QTC distribution per queue</p></div>'+renderHeaderControlsHTML('queues')+'</div><div class="ux-panel"><h3>'+(error?'Data could not be loaded':'Waiting for source data')+'</h3><p>'+esc(error?error.textContent.replace('↻ Retry','').trim():'Queues analysis will appear once dashboard data is loaded.')+'</p><button class="btn btn-c" id="qRetry" style="margin-top:16px">↻ Retry data load</button></div></div>';
  bindHeaderControls(page,'queues');
  $('qRetry')?.addEventListener('click',()=>loadData());
  return;
 }

 const base=rowsInView();
 const catSummary=getCategorySummary(base);
 const allQueues=queuesAggregateData(base);

 const allShifts=[...new Set(allQueues.flatMap(q=>q.shifts))].sort();
 const allFloors=[...new Set(allQueues.flatMap(q=>q.floors))].sort();
 const distinctQueues=[...new Set(allQueues.map(q=>q.name))].sort();

 // Filter queues
 const qFilter=queuesFilters.query.toLowerCase().trim();
 const filtered=allQueues.filter(q=>{
  if(queuesFilters.shift&&!q.shifts.includes(queuesFilters.shift))return false;
  if(queuesFilters.floor&&!q.floors.includes(queuesFilters.floor))return false;
  if(queuesFilters.category){
   if(queuesFilters.category==='lidarFP'&&q.lidarFP===0)return false;
   if(queuesFilters.category==='lidarQA'&&q.lidarQA===0)return false;
   if(queuesFilters.category==='laneFP'&&q.laneFP===0)return false;
   if(queuesFilters.category==='laneQA'&&q.laneQA===0)return false;
  }
  if(qFilter){
   const matchName=q.name.toLowerCase().includes(qFilter);
   const matchShifts=q.shifts.some(s=>s.toLowerCase().includes(qFilter));
   const matchFloors=q.floors.some(f=>f.toLowerCase().includes(qFilter));
   const matchQtcs=q.qtcs.some(qc=>qc.toLowerCase().includes(qFilter));
   if(!matchName&&!matchShifts&&!matchFloors&&!matchQtcs)return false;
  }
  return true;
 });

 // Sort
 const col=queuesFilters.sortCol;
 const asc=queuesFilters.sortAsc;
 filtered.sort((a,b)=>{
  let va=a[col],vb=b[col];
  if(typeof va==='string')return asc?va.localeCompare(vb):vb.localeCompare(va);
  return asc?(va-vb):(vb-va);
 });

 // Compute selection summary stats
 const totalTasks=filtered.reduce((n,q)=>n+q.totalSubmit,0);
 const totalLidarFP=filtered.reduce((n,q)=>n+q.lidarFP,0);
 const totalLidarQA=filtered.reduce((n,q)=>n+q.lidarQA,0);
 const totalLaneFP=filtered.reduce((n,q)=>n+q.laneFP,0);
 const totalLaneQA=filtered.reduce((n,q)=>n+q.laneQA,0);

 const filteredNames=new Set(filtered.map(q=>q.name));
 const allFilteredLabelers=new Set();
 const allFilteredQtcs=new Set();
 const qi=hdrs.findIndex(h=>String(h).trim().toLowerCase()==='queue name');
 const ni=hdrs.findIndex(h=>String(h).trim().toLowerCase()==='national id');
 const li=hdrs.findIndex(h=>String(h).trim().toLowerCase()==='labeler name');
 const qci=hdrs.findIndex(h=>String(h).trim().toLowerCase()==='qtc name');

 base.forEach(r=>{
  const qName=qi>=0?String(r[qi]||'').trim():'';
  if(filteredNames.has(qName)){
   let lid='';
   if(ni>=0){
    const rawNi=String(r[ni]??'').trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/\.0+$/,'').replace(/[\s-]/g,'');
    if(/^\d{14}$/.test(rawNi))lid=rawNi;
   }
   if(!lid&&li>=0){
    const name=String(r[li]??'').trim().toLowerCase();
    if(name)lid='name:'+name;
   }
   if(lid)allFilteredLabelers.add(lid);

   const qtc=qci>=0?String(r[qci]||'').normalize('NFC').trim().toLowerCase():'';
   if(qtc)allFilteredQtcs.add(qtc);
  }
 });

 const uniqueLabelers=allFilteredLabelers.size;
 const avgSubmit=uniqueLabelers>0?(totalTasks/uniqueLabelers).toFixed(1):'0';
 const uniqueQtc=allFilteredQtcs.size;

 // Pagination
 const pageSize=queuesFilters.pageSize||25;
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 queuesFilters.page=Math.min(queuesFilters.page,totalPages-1);
 const visible=filtered.slice(queuesFilters.page*pageSize,(queuesFilters.page+1)*pageSize);

 page.innerHTML='<div class="ux-overview">'
  +'<div class="ux-heading"><div><div class="ux-eyebrow">Queue breakdown · Shifts & Floors & QTCs</div><h2>Queues Analysis</h2><p>Submission volume, shifts, floors, and QTC distribution per queue</p></div>'+renderHeaderControlsHTML('queues')+'</div>'
  +renderCategoryCardsHTML(catSummary,queuesFilters.category,'queues')
  +'<div class="queues-controls">'
   +'<label>Search Queues / Shifts / Floors / QCs<input id="qSearch" placeholder="Type to filter queues, shifts, floors, QTCs…" value="'+esc(queuesFilters.query)+'"></label>'
   +'<label>Shift<select id="qShift"><option value="">All shifts ('+allShifts.length+')</option>'+allShifts.map(s=>'<option value="'+esc(s)+'" '+(queuesFilters.shift===s?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'
   +'<label>Floor / Unit<select id="qFloor"><option value="">All floors ('+allFloors.length+')</option>'+allFloors.map(f=>'<option value="'+esc(f)+'" '+(queuesFilters.floor===f?'selected':'')+'>'+esc(f)+'</option>').join('')+'</select></label>'
   +'<label>Category filter<select id="qCategory"><option value="">All categories</option><option value="lidarFP" '+(queuesFilters.category==='lidarFP'?'selected':'')+'>Lidar FP</option><option value="lidarQA" '+(queuesFilters.category==='lidarQA'?'selected':'')+'>Lidar QA</option><option value="laneFP" '+(queuesFilters.category==='laneFP'?'selected':'')+'>Lane Line FP</option><option value="laneQA" '+(queuesFilters.category==='laneQA'?'selected':'')+'>Lane Line QA</option></select></label>'
   +'<div style="margin-left:auto;display:flex;gap:8px;align-items:flex-end">'
    +'<button class="btn btn-c" id="qExportCSV">↓ Export CSV</button>'
    +'<button class="btn" id="qReset">Reset filters</button>'
   +'</div>'
  +'</div>'
  +'<div class="an-overall-bar" style="margin-bottom:18px">'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Queues Count</span><strong class="an-overall-val highlight">'+filtered.length.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Total Submit</span><strong class="an-overall-val highlight">'+totalTasks.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Total Unique QTC</span><strong class="an-overall-val">'+uniqueQtc.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Unique Labelers</span><strong class="an-overall-val">'+uniqueLabelers.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Avg Submit / Labeler</span><strong class="an-overall-val highlight">'+avgSubmit+'</strong></div>'
  +'</div>'
  +'<section class="ux-panel">'
   +'<div class="ux-heading" style="margin-bottom:12px"><div><h3>Queues breakdown table ('+filtered.length.toLocaleString()+' queues)</h3><p>Click any column header with ↕ to sort</p></div><span class="ux-note">Showing '+(visible.length?(queuesFilters.page*pageSize+1):0)+' – '+Math.min((queuesFilters.page+1)*pageSize,filtered.length)+' of '+filtered.length+' queues</span></div>'
   +'<div class="perf-table">'
    +'<table>'
     +'<thead><tr>'
      +'<th data-sort="name">Queue Name ↕</th>'
      +'<th>Shifts</th>'
      +'<th>Floors / Units</th>'
      +'<th>QCs / QTCs</th>'
      +'<th data-sort="lidarFP" style="color:#7258f5">Lidar FP ↕</th>'
      +'<th data-sort="lidarQA" style="color:#15b8a6">Lidar QA ↕</th>'
      +'<th data-sort="laneFP" style="color:#ed9a35">Lane Line FP ↕</th>'
      +'<th data-sort="laneQA" style="color:#e9689e">Lane Line QA ↕</th>'
      +'<th data-sort="totalSubmit">Total Submit ↕</th>'
      +'<th data-sort="uniqueLabelers">Unique Labelers ↕</th>'
      +'<th data-sort="avgSubmit">Avg Submit ↕</th>'
      +'<th data-sort="uniqueQtc">Total Unique QTC ↕</th>'
     +'</tr></thead>'
     +'<tbody>'
      +visible.map(q=>'<tr>'
       +'<td><b>'+esc(q.name)+'</b></td>'
       +'<td>'+(q.shifts.length?q.shifts.map(s=>'<span class="q-badge q-shift">'+esc(s)+'</span>').join(''):'—')+'</td>'
       +'<td>'+(q.floors.length?q.floors.map(f=>'<span class="q-badge q-floor">'+esc(f)+'</span>').join(''):'—')+'</td>'
       +'<td><span class="q-badge q-qtc" title="'+esc(q.qtcs.join(', '))+'">'+q.uniqueQtc+' QTC'+(q.uniqueQtc===1?'':'s')+'</span></td>'
       +'<td><b class="q-val-lidar-fp">'+q.lidarFP.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lidar-qa">'+q.lidarQA.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lane-fp">'+q.laneFP.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lane-qa">'+q.laneQA.toLocaleString()+'</b></td>'
       +'<td><strong class="q-val-total">'+q.totalSubmit.toLocaleString()+'</strong></td>'
       +'<td><b>'+q.uniqueLabelers.toLocaleString()+'</b></td>'
       +'<td><span class="q-val-avg">'+q.avgSubmitStr+'</span></td>'
       +'<td><b>'+q.uniqueQtc.toLocaleString()+'</b></td>'
      +'</tr>').join('')
     +'</tbody>'
    +'</table>'
    +(!filtered.length?'<div class="ux-empty">No queues match your current filters. Adjust or clear your search.</div>':'')
   +'</div>'
   +'<div class="perf-pagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">'
    +'<button class="btn" id="qPrev" '+(queuesFilters.page===0?'disabled':'')+'>Previous</button>'
    +'<span class="ux-note">Page '+(queuesFilters.page+1)+' of '+totalPages+' ('+filtered.length.toLocaleString()+' queues)</span>'
    +'<button class="btn" id="qNext" '+(queuesFilters.page>=totalPages-1?'disabled':'')+'>Next</button>'
   +'</div>'
  +'</section>'
  +'<section class="ux-panel queues-trend-section">'
   +'<div class="ux-heading" style="margin-bottom:14px">'
    +'<div>'
     +'<div class="ux-eyebrow">Interactive Trend Analysis</div>'
     +'<h3 style="font-size:18px;margin:4px 0">Queue Performance Trend</h3>'
     +'<p style="margin:0">Track submissions over time for any queue and stage.</p>'
    +'</div>'
   +'</div>'
   +'<div class="queues-controls" style="margin:0 0 16px;padding:14px 18px">'
    +'<label>Select Queue:<select id="qTrendQueue"><option value="all">All Queues</option>'+distinctQueues.map(n=>'<option value="'+esc(n)+'" '+(queuesChartFilters.queue===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label>'
    +'<label>Stage / Modality:<select id="qTrendStage"><option value="all" '+(queuesChartFilters.stage==='all'?'selected':'')+'>All Stages (Total)</option><option value="lidarFP" '+(queuesChartFilters.stage==='lidarFP'?'selected':'')+'>Lidar FP</option><option value="lidarQA" '+(queuesChartFilters.stage==='lidarQA'?'selected':'')+'>Lidar QA</option><option value="laneFP" '+(queuesChartFilters.stage==='laneFP'?'selected':'')+'>Lane Line FP</option><option value="laneQA" '+(queuesChartFilters.stage==='laneQA'?'selected':'')+'>Lane Line QA</option></select></label>'
    +'<label>Single Day:<input type="date" id="qTrendDay" value="'+esc(queuesChartFilters.day)+'"></label>'
    +'<label>From:<input type="date" id="qTrendFrom" value="'+esc(queuesChartFilters.from)+'"></label>'
    +'<label>To:<input type="date" id="qTrendTo" value="'+esc(queuesChartFilters.to)+'"></label>'
    +'<div style="display:flex;gap:8px;align-self:flex-end">'
     +'<button class="btn btn-c" id="qTrendApplyDate">Filter Trend</button>'
     +'<button class="btn" id="qTrendResetDate">Reset Trend</button>'
    +'</div>'
   +'</div>'
   +'<div id="qTrendChart" class="an-line"></div>'
   +'<div id="qTrendSummary" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;font-size:12px"></div>'
  +'</section>'
 +'</div>';

 bindHeaderControls(page,'queues');

 // Card click filter
 page.querySelectorAll('.an-cat-card[data-cat]').forEach(card=>{
  const cat=card.dataset.cat;
  card.onclick=()=>{
   queuesFilters.category=queuesFilters.category===cat?'':cat;
   queuesFilters.page=0;
   renderQueuesAnalysis();
  };
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.onclick();}};
 });

 // Table sort headers
 page.querySelectorAll('th[data-sort]').forEach(th=>{
  const sortKey=th.dataset.sort;
  th.onclick=()=>{
   if(queuesFilters.sortCol===sortKey){
    queuesFilters.sortAsc=!queuesFilters.sortAsc;
   }else{
    queuesFilters.sortCol=sortKey;
    queuesFilters.sortAsc=sortKey==='name';
   }
   renderQueuesAnalysis();
  };
 });

 // Inputs
 const searchInput=$('qSearch');
 if(searchInput){
  searchInput.oninput=()=>{
   queuesFilters.query=searchInput.value;
   queuesFilters.page=0;
   renderQueuesAnalysis();
   // Maintain focus
   const el=$('qSearch');
   if(el){el.focus();el.selectionStart=el.selectionEnd=el.value.length;}
  };
 }

 const shiftSelect=$('qShift');
 if(shiftSelect){
  shiftSelect.onchange=()=>{
   queuesFilters.shift=shiftSelect.value;
   queuesFilters.page=0;
   renderQueuesAnalysis();
  };
 }

 const floorSelect=$('qFloor');
 if(floorSelect){
  floorSelect.onchange=()=>{
   queuesFilters.floor=floorSelect.value;
   queuesFilters.page=0;
   renderQueuesAnalysis();
  };
 }

 const catSelect=$('qCategory');
 if(catSelect){
  catSelect.onchange=()=>{
   queuesFilters.category=catSelect.value;
   queuesFilters.page=0;
   renderQueuesAnalysis();
  };
 }

 $('qReset')?.addEventListener('click',()=>{
  Object.assign(queuesFilters,{query:'',shift:'',floor:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0});
  renderQueuesAnalysis();
 });

 $('qExportCSV')?.addEventListener('click',()=>exportQueuesCSV(filtered));

 $('qPrev')?.addEventListener('click',()=>{
  if(queuesFilters.page>0){
   queuesFilters.page--;
   renderQueuesAnalysis();
  }
 });

 $('qNext')?.addEventListener('click',()=>{
  if(queuesFilters.page<totalPages-1){
   queuesFilters.page++;
   renderQueuesAnalysis();
  }
 });

 renderQueueTrendChart('qTrendChart',base);
 $('qTrendQueue')?.addEventListener('change',e=>{queuesChartFilters.queue=e.target.value;renderQueueTrendChart('qTrendChart',base);});
 $('qTrendStage')?.addEventListener('change',e=>{queuesChartFilters.stage=e.target.value;renderQueueTrendChart('qTrendChart',base);});
 $('qTrendApplyDate')?.addEventListener('click',()=>{
  queuesChartFilters.day=$('qTrendDay').value;
  queuesChartFilters.from=$('qTrendFrom').value;
  queuesChartFilters.to=$('qTrendTo').value;
  renderQueueTrendChart('qTrendChart',base);
 });
 $('qTrendResetDate')?.addEventListener('click',()=>{
  Object.assign(queuesChartFilters,{queue:'all',stage:'all',from:'',to:'',day:''});
  renderQueuesAnalysis();
 });
}


function renderQueueTrendChart(containerId, rows){
 const qi=hdrs.findIndex(h=>h.trim().toLowerCase()==='queue name');
 const mi=hdrs.findIndex(h=>h.trim().toLowerCase()==='modality');
 const pi=hdrs.findIndex(h=>h.trim().toLowerCase()==='pass');

 let chartRows=rows;
 if(queuesChartFilters.queue!=='all'&&qi>=0){
  chartRows=chartRows.filter(r=>String(r[qi]||'').trim()===queuesChartFilters.queue);
 }
 if(queuesChartFilters.stage!=='all'){
  chartRows=chartRows.filter(r=>{
   const mod=mi<0?'':String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');
   const pass=pi<0?'':String(r[pi]||'').trim().toUpperCase();
   const prefix=mod==='lidar'?'lidar':(mod==='laneline'||mod==='lane')?'lane':'';
   return (prefix+pass)===queuesChartFilters.stage;
  });
 }
 if(queuesChartFilters.day){
  chartRows=chartRows.filter(r=>rDate(r)===queuesChartFilters.day);
 } else {
  if(queuesChartFilters.from) chartRows=chartRows.filter(r=>{const d=rDate(r); return d&&d>=queuesChartFilters.from;});
  if(queuesChartFilters.to) chartRows=chartRows.filter(r=>{const d=rDate(r); return d&&d<=queuesChartFilters.to;});
 }

 const dateMap=new Map();
 chartRows.forEach(r=>{
  const d=rDate(r);
  if(d) dateMap.set(d,(dateMap.get(d)||0)+1);
 });

 const sortedDates=[...dateMap.keys()].sort();
 const el=$(containerId);
 if(!el) return;
 if(!sortedDates.length){
  el.innerHTML='<div class="ux-empty">No queue submissions match the selected trend filters.</div>';
  const sumEl=$('qTrendSummary');
  if(sumEl) sumEl.innerHTML='<span class="q-trend-pill">Total: 0 submissions</span>';
  return;
 }

 const points=[];
 const startD=queuesChartFilters.from||sortedDates[0];
 const endD=queuesChartFilters.to||sortedDates[sortedDates.length-1];
 let cur=new Date(startD+'T00:00:00Z'), end=new Date(endD+'T00:00:00Z');
 if(cur<=end && (end-cur)/(86400000)<=90){
  while(cur<=end){
   const k=cur.toISOString().slice(0,10);
   points.push([k,dateMap.get(k)||0]);
   cur.setUTCDate(cur.getUTCDate()+1);
  }
 } else {
  sortedDates.forEach(d=>points.push([d,dateMap.get(d)||0]));
 }

 const catColorMap={all:'#7258f5',lidarFP:'#7258f5',lidarQA:'#15b8a6',laneFP:'#ed9a35',laneQA:'#e9689e'};
 const strokeColor=catColorMap[queuesChartFilters.stage]||'#7258f5';

 const W=760,H=260,L=55,R=20,T=20,B=45;
 const max=Math.max(1,...points.map(p=>p[1]));
 const x=i=>L+(points.length===1?(W-L-R)/2:i/(points.length-1)*(W-L-R));
 const y=v=>H-B-v/max*(H-T-B);

 let svg='<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="Queue trend area chart">';
 svg+='<defs><linearGradient id="qTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+strokeColor+'" stop-opacity="0.4"/><stop offset="100%" stop-color="'+strokeColor+'" stop-opacity="0.02"/></linearGradient></defs>';
 for(let i=0;i<5;i++){
  const val=max*i/4, yy=y(val);
  svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--border)" stroke-dasharray="3 3"/><text x="'+(L-9)+'" y="'+(yy+4)+'" text-anchor="end">'+Number(val.toFixed(1)).toLocaleString()+'</text>';
 }
 if(points.length>1){
  const polyPoints=[L+','+(H-B),...points.map((p,i)=>x(i)+','+y(p[1])),(points.length===1?L:x(points.length-1))+','+(H-B)].join(' ');
  svg+='<polygon fill="url(#qTrendGrad)" points="'+polyPoints+'"/>';
 }
 svg+='<polyline fill="none" stroke="'+strokeColor+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="'+points.map((p,i)=>x(i)+','+y(p[1])).join(' ')+'"/>';
 points.forEach(([d,c],i)=>{
  svg+='<circle tabindex="0" role="img" aria-label="'+d+': '+c+' submissions" cx="'+x(i)+'" cy="'+y(c)+'" r="4.5" fill="'+strokeColor+'" stroke="var(--bg-3)" stroke-width="1.5"><title>'+d+' ('+queuesChartFilters.stage+'): '+c.toLocaleString()+' submissions</title></circle>';
  if(i===0||i===points.length-1||(points.length>3&&i===Math.floor(points.length/2))){
   svg+='<text x="'+x(i)+'" y="'+(H-12)+'" text-anchor="'+(i===0?'start':i===points.length-1?'end':'middle')+'">'+d+'</text>';
  }
 });
 svg+='</svg>';
 el.innerHTML=svg;

 const sumEl=$('qTrendSummary');
 if(sumEl){
  const totalSub=points.reduce((s,p)=>s+p[1],0);
  const peak=points.reduce((p,c)=>c[1]>p[1]?c:p,['—',0]);
  sumEl.innerHTML='<span class="q-trend-pill">Queue: <b>'+esc(queuesChartFilters.queue==='all'?'All Queues':queuesChartFilters.queue)+'</b></span>'
   +'<span class="q-trend-pill">Stage: <b>'+esc(queuesChartFilters.stage)+'</b></span>'
   +'<span class="q-trend-pill">Total Submissions: <b style="color:var(--accent)">'+totalSub.toLocaleString()+'</b></span>'
   +'<span class="q-trend-pill">Peak Day: <b>'+peak[0]+' ('+peak[1].toLocaleString()+')</b></span>'
   +'<span class="q-trend-pill">Active Days: <b>'+points.filter(p=>p[1]>0).length+'</b></span>';
 }
}

function qtcFloorAggregateData(rows){
 const idx=name=>hdrs.findIndex(h=>h.trim().toLowerCase()===name.toLowerCase());
 const qi=idx('qtc name'), fi=hdrs.findIndex(h=>['floor','unit'].includes(h.trim().toLowerCase()));
 const si=idx('shift'), mi=idx('modality'), pi=idx('pass');
 const ni=idx('national id'), li=idx('labeler name');

 const groups=new Map();
 rows.forEach(r=>{
  const qtc=qi>=0?(String(r[qi]||'').normalize('NFC').trim().replace(/\s+/gu,' ')||'Unknown QTC'):'Unknown QTC';
  const floor=fi>=0?(String(r[fi]||'').trim()||'Unknown Floor'):'Unknown Floor';
  const key=qtc+'|||'+floor;
  if(!groups.has(key)){
   groups.set(key,{
    qtc,
    floor,
    shifts:new Set(),
    lidarFP:0,
    lidarQA:0,
    laneFP:0,
    laneQA:0,
    totalSubmit:0,
    labelerSet:new Set()
   });
  }
  const g=groups.get(key);
  g.totalSubmit++;
  if(si>=0){
   const s=String(r[si]||'').trim();
   if(s)g.shifts.add(s);
  }
  let lid='';
  if(ni>=0){
   const rawNi=String(r[ni]??'').trim()
    .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
    .replace(/\.0+$/,'').replace(/[\s-]/g,'');
   if(/^\d{14}$/.test(rawNi))lid=rawNi;
  }
  if(!lid&&li>=0){
   const name=String(r[li]??'').trim().toLowerCase();
   if(name)lid='name:'+name;
  }
  if(lid)g.labelerSet.add(lid);

  const mod=mi<0?'':String(r[mi]||'').toLowerCase().replace(/[\s_-]+/g,'');
  const pass=pi<0?'':String(r[pi]||'').trim().toUpperCase();
  const prefix=mod==='lidar'?'lidar':(mod==='laneline'||mod==='lane')?'lane':'';
  if(prefix&&(pass==='FP'||pass==='QA')){
   const cat=prefix+pass;
   if(cat==='lidarFP')g.lidarFP++;
   else if(cat==='lidarQA')g.lidarQA++;
   else if(cat==='laneFP')g.laneFP++;
   else if(cat==='laneQA')g.laneQA++;
  }
 });

 return [...groups.values()].map(g=>{
  const uniqueLabelers=g.labelerSet.size;
  const avgSubmit=uniqueLabelers>0?(g.totalSubmit/uniqueLabelers):0;
  return {
   ...g,
   shifts:[...g.shifts].sort(),
   uniqueLabelers,
   avgSubmit,
   avgSubmitStr:avgSubmit.toFixed(1)
  };
 });
}

function exportQtcFloorCSV(items){
 if(!items||!items.length){
  showToast('No QTC & Floor data to export.');
  return;
 }
 const headers=['QTC Name','Floor','Shifts','Lidar FP Submit','Lidar QA Submit','Lane Line FP Submit','Lane Line QA Submit','Total Submit','Unique Labelers','Avg Submit / Labeler'];
 const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 const rows=items.map(q=>[
  q.qtc,
  q.floor,
  q.shifts.join('; '),
  q.lidarFP,
  q.lidarQA,
  q.laneFP,
  q.laneQA,
  q.totalSubmit,
  q.uniqueLabelers,
  q.avgSubmitStr
 ]);
 const csv=[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
 downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'MEEG_QTC_Floor_Performance_'+cairoToday()+'.csv');
}

function renderQtcFloorPerformance(){
 const page=$('uxQtcFloor');
 if(!page||page.hidden)return;

 const rows=rowsInView();
 const allGroups=qtcFloorAggregateData(rows);

 const distinctQtcs=[...new Set(allGroups.map(g=>g.qtc))].sort();
 const distinctFloors=[...new Set(allGroups.map(g=>g.floor))].sort();
 const distinctShifts=[...new Set(allGroups.flatMap(g=>g.shifts))].sort();

 const q=qtcFloorFilters.query.toLowerCase().trim();
 const filtered=allGroups.filter(g=>{
  if(q&&![g.qtc,g.floor,...g.shifts].some(v=>v.toLowerCase().includes(q)))return false;
  if(qtcFloorFilters.qtc&&g.qtc!==qtcFloorFilters.qtc)return false;
  if(qtcFloorFilters.floor&&g.floor!==qtcFloorFilters.floor)return false;
  if(qtcFloorFilters.shift&&!g.shifts.includes(qtcFloorFilters.shift))return false;
  if(qtcFloorFilters.category){
   if(qtcFloorFilters.category==='lidarFP'&&g.lidarFP<=0)return false;
   if(qtcFloorFilters.category==='lidarQA'&&g.lidarQA<=0)return false;
   if(qtcFloorFilters.category==='laneFP'&&g.laneFP<=0)return false;
   if(qtcFloorFilters.category==='laneQA'&&g.laneQA<=0)return false;
  }
  return true;
 });

 filtered.sort((a,b)=>{
  const col=qtcFloorFilters.sortCol;
  let va=a[col],vb=b[col];
  if(typeof va==='string')return qtcFloorFilters.sortAsc?va.localeCompare(vb):vb.localeCompare(va);
  va=Number(va)||0;vb=Number(vb)||0;
  return qtcFloorFilters.sortAsc?va-vb:vb-va;
 });

 const pageSize=qtcFloorFilters.pageSize||25;
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 qtcFloorFilters.page=Math.min(qtcFloorFilters.page,totalPages-1);
 const visible=filtered.slice(qtcFloorFilters.page*pageSize,(qtcFloorFilters.page+1)*pageSize);

 const totalSubmissions=filtered.reduce((s,g)=>s+g.totalSubmit,0);
 const totalUniqueLabelers=new Set(filtered.flatMap(g=>[...g.labelerSet])).size;
 const overallAvg=totalUniqueLabelers>0?(totalSubmissions/totalUniqueLabelers).toFixed(1):'0';
 const totalUniqueQtcs=new Set(filtered.map(g=>g.qtc)).size;
 const totalUniqueFloors=new Set(filtered.map(g=>g.floor)).size;

 page.innerHTML='<div class="ux-overview">'
  +'<div class="ux-heading">'
   +'<div>'
    +'<div class="ux-eyebrow">Workforce & Area Breakdown</div>'
    +'<h2>Performance per QTC & Floor</h2>'
    +'<p>Submissions, unique labelers, and average throughput broken down by QC & Floor.</p>'
   +'</div>'
   +renderHeaderControlsHTML('qfloor')
  +'</div>'
  +'<div class="an-overall-bar">'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Total Submissions</span><strong class="an-overall-val highlight">'+totalSubmissions.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Unique QTCs</span><strong class="an-overall-val">'+totalUniqueQtcs.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Unique Floors</span><strong class="an-overall-val">'+totalUniqueFloors.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Unique Labelers</span><strong class="an-overall-val">'+totalUniqueLabelers.toLocaleString()+'</strong></div>'
   +'<div class="an-overall-item"><span class="an-overall-lbl">Overall Avg Submit</span><strong class="an-overall-val highlight">'+overallAvg+'</strong></div>'
  +'</div>'
  +'<div class="queues-controls">'
   +'<label>Search QTC / Floor / Shift:<input type="search" id="qfSearch" placeholder="Filter by name..." value="'+esc(qtcFloorFilters.query)+'"></label>'
   +'<label>Filter by QTC:<select id="qfQtc"><option value="">All QTCs</option>'+distinctQtcs.map(q=>'<option value="'+esc(q)+'" '+(qtcFloorFilters.qtc===q?'selected':'')+'>'+esc(q)+'</option>').join('')+'</select></label>'
   +'<label>Filter by Floor:<select id="qfFloor"><option value="">All Floors</option>'+distinctFloors.map(f=>'<option value="'+esc(f)+'" '+(qtcFloorFilters.floor===f?'selected':'')+'>'+esc(f)+'</option>').join('')+'</select></label>'
   +'<label>Filter by Shift:<select id="qfShift"><option value="">All Shifts</option>'+distinctShifts.map(s=>'<option value="'+esc(s)+'" '+(qtcFloorFilters.shift===s?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'
   +'<label>Stage:<select id="qfCategory"><option value="">All Stages</option><option value="lidarFP" '+(qtcFloorFilters.category==='lidarFP'?'selected':'')+'>Lidar FP</option><option value="lidarQA" '+(qtcFloorFilters.category==='lidarQA'?'selected':'')+'>Lidar QA</option><option value="laneFP" '+(qtcFloorFilters.category==='laneFP'?'selected':'')+'>Lane Line FP</option><option value="laneQA" '+(qtcFloorFilters.category==='laneQA'?'selected':'')+'>Lane Line QA</option></select></label>'
   +'<div style="display:flex;gap:8px;align-self:flex-end">'
    +'<button class="btn" id="qfReset">Reset</button>'
    +'<button class="btn btn-c" id="qfExportCSV">↓ Export CSV</button>'
   +'</div>'
  +'</div>'
  +'<section class="ux-panel">'
   +'<div class="perf-table">'
    +'<table>'
     +'<thead><tr>'
      +'<th data-qf-sort="qtc">QTC Name ↕</th>'
      +'<th data-qf-sort="floor">Floor / Unit ↕</th>'
      +'<th>Shifts</th>'
      +'<th data-qf-sort="lidarFP" style="color:#7258f5">Lidar FP ↕</th>'
      +'<th data-qf-sort="lidarQA" style="color:#15b8a6">Lidar QA ↕</th>'
      +'<th data-qf-sort="laneFP" style="color:#ed9a35">Lane Line FP ↕</th>'
      +'<th data-qf-sort="laneQA" style="color:#e9689e">Lane Line QA ↕</th>'
      +'<th data-qf-sort="totalSubmit">Total Submit ↕</th>'
      +'<th data-qf-sort="uniqueLabelers">Unique Labelers ↕</th>'
      +'<th data-qf-sort="avgSubmit">Avg Submit ↕</th>'
     +'</tr></thead>'
     +'<tbody>'
      +visible.map(g=>'<tr>'
       +'<td><b style="color:var(--accent)">'+esc(g.qtc)+'</b></td>'
       +'<td><span class="q-badge q-floor">'+esc(g.floor)+'</span></td>'
       +'<td>'+(g.shifts.length?g.shifts.map(s=>'<span class="q-badge q-shift">'+esc(s)+'</span>').join(''):'—')+'</td>'
       +'<td><b class="q-val-lidar-fp">'+g.lidarFP.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lidar-qa">'+g.lidarQA.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lane-fp">'+g.laneFP.toLocaleString()+'</b></td>'
       +'<td><b class="q-val-lane-qa">'+g.laneQA.toLocaleString()+'</b></td>'
       +'<td><strong class="q-val-total">'+g.totalSubmit.toLocaleString()+'</strong></td>'
       +'<td><b>'+g.uniqueLabelers.toLocaleString()+'</b></td>'
       +'<td><span class="q-val-avg">'+g.avgSubmitStr+'</span></td>'
      +'</tr>').join('')
     +'</tbody>'
    +'</table>'
    +(!filtered.length?'<div class="ux-empty">No records match your filters.</div>':'')
   +'</div>'
   +'<div class="perf-pagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">'
    +'<button class="btn" id="qfPrev" '+(qtcFloorFilters.page===0?'disabled':'')+'>Previous</button>'
    +'<span class="ux-note">Page '+(qtcFloorFilters.page+1)+' of '+totalPages+' ('+filtered.length.toLocaleString()+' pairs)</span>'
    +'<button class="btn" id="qfNext" '+(qtcFloorFilters.page>=totalPages-1?'disabled':'')+'>Next</button>'
   +'</div>'
  +'</section>'
 +'</div>';

 bindHeaderControls(page,'qfloor');

 page.querySelectorAll('th[data-qf-sort]').forEach(th=>{
  const col=th.dataset.qfSort;
  th.onclick=()=>{
   if(qtcFloorFilters.sortCol===col)qtcFloorFilters.sortAsc=!qtcFloorFilters.sortAsc;
   else{qtcFloorFilters.sortCol=col;qtcFloorFilters.sortAsc=col==='qtc'||col==='floor';}
   renderQtcFloorPerformance();
  };
 });

 const searchInp=$('qfSearch');
 if(searchInp){
  searchInp.oninput=()=>{
   qtcFloorFilters.query=searchInp.value;
   qtcFloorFilters.page=0;
   renderQtcFloorPerformance();
   const el=$('qfSearch');
   if(el){el.focus();el.selectionStart=el.selectionEnd=el.value.length;}
  };
 }
 $('qfQtc')?.addEventListener('change',e=>{qtcFloorFilters.qtc=e.target.value;qtcFloorFilters.page=0;renderQtcFloorPerformance();});
 $('qfFloor')?.addEventListener('change',e=>{qtcFloorFilters.floor=e.target.value;qtcFloorFilters.page=0;renderQtcFloorPerformance();});
 $('qfShift')?.addEventListener('change',e=>{qtcFloorFilters.shift=e.target.value;qtcFloorFilters.page=0;renderQtcFloorPerformance();});
 $('qfCategory')?.addEventListener('change',e=>{qtcFloorFilters.category=e.target.value;qtcFloorFilters.page=0;renderQtcFloorPerformance();});
 $('qfReset')?.addEventListener('click',()=>{
  Object.assign(qtcFloorFilters,{query:'',qtc:'',floor:'',shift:'',category:'',sortCol:'totalSubmit',sortAsc:false,page:0});
  renderQtcFloorPerformance();
 });
 $('qfExportCSV')?.addEventListener('click',()=>exportQtcFloorCSV(filtered));
 $('qfPrev')?.addEventListener('click',()=>{if(qtcFloorFilters.page>0){qtcFloorFilters.page--;renderQtcFloorPerformance();}});
 $('qfNext')?.addEventListener('click',()=>{if(qtcFloorFilters.page<totalPages-1){qtcFloorFilters.page++;renderQtcFloorPerformance();}});
}

renderAllSections=function(){

 if(!root.hidden)oldRender.apply(this,arguments);

 renderSharedPeriods();

 renderOverview();

 renderAnalysis();
 renderQueuesAnalysis();

 renderPerformance();
 renderQtcFloorPerformance();

 renderDailyReport();

};



// Immediate instant hydration check on script load

try{

 idbGet('csv').then(cached=>{

   if(cached&&cached.v===AUTH_VER&&cached.text&&!rawRows.length){

     parseCSVAsync(cached.text).then(table=>{

       if(!rawRows.length&&table&&table.length){

         onCsvTable(table);

         renderAllSections();

       }

     }).catch(()=>{});

   }

 }).catch(()=>{});

}catch(e){}



renderOverview();
renderSharedPeriods();
if(location.hash==='#queues-analysis'&&typeof renderQueuesAnalysis==='function')renderQueuesAnalysis();
else if(location.hash==='#analysis-overview'&&typeof renderAnalysis==='function')renderAnalysis();
else if(location.hash==='#performance-labelers'&&typeof renderPerformance==='function')renderPerformance();
else if(location.hash==='#performance-qtc-floor'&&typeof renderQtcFloorPerformance==='function')renderQtcFloorPerformance();
else if(location.hash==='#daily-report'&&typeof renderDailyReport==='function')renderDailyReport();
})();

