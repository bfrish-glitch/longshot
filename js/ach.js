/* Longshot 3D · ach.js · achievements: goals across every contract, mode and the range, each paying a one-time cash bonus */
'use strict';
const ACH=[
  // shooting
  {id:'reach',c:'Shooting',n:'Reach Out',d:'Drop a hostile from 500 m or farther.',$:250},
  {id:'longarm',c:'Shooting',n:'Long Arm',d:'Drop a hostile from 650 m or farther.',$:750},
  {id:'triple',c:'Shooting',n:'Triple Crown',d:'Three headshots in one contract.',$:300},
  {id:'sweep',c:'Shooting',n:'Clean Sweep',d:'Every kill a headshot in a contract with at least 4 hostiles.',$:750},
  {id:'chain',c:'Shooting',n:'Chain Reaction',d:'Push the combo to ×3.',$:300},
  {id:'surgeon',c:'Shooting',n:'Surgeon',d:'Clear a contract without missing a shot.',$:400},
  {id:'quick',c:'Shooting',n:'In and Out',d:'Clear a contract with two thirds of the clock left.',$:400},
  // style
  {id:'glass',c:'Style',n:'Through the Glass',d:'Kill with a round that went through a window.',$:300},
  {id:'wall',c:'Style',n:'Nowhere to Hide',d:'Kill through a wall or door with the Breacher .50.',$:400},
  {id:'act',c:'Style',n:'Act of God',d:'Make a kill look like an accident.',$:250},
  {id:'luck',c:'Style',n:'Bad Luck Follows Them',d:'Ten accident kills in total.',$:750,goal:10,stat:'acc'},
  {id:'moving',c:'Style',n:'Moving Target',d:'Hit the getaway driver while the car is rolling.',$:500},
  {id:'curious',c:'Style',n:'Curiosity',d:'Drop a guard who walked over to check a distraction.',$:300},
  {id:'heat',c:'Style',n:'Heat Signature',d:'Make a kill through the thermal scope.',$:200},
  {id:'counter',c:'Style',n:'Counter-Sniper',d:'Take out an enemy sniper.',$:300},
  {id:'strike1',c:'Style',n:'Air Support',d:'Take out a hostile with an air strike.',$:300},
  {id:'danger',c:'Style',n:'Danger Close',d:'Two or more hostiles in one air strike.',$:750},
  {id:'engine',c:'Style',n:'Engine Block',d:'Stop the getaway car with the Hammer .50 BMG.',$:750},
  {id:'cowboy',c:'Style',n:'Lever Action',d:'Clear a contract with the Ranch .45-70.',$:400},
  {id:'ghost',c:'Style',n:'Ghost',d:'Clear a contract without anyone raising the alarm.',$:400},
  // career
  {id:'first',c:'Career',n:'First Contract',d:'Clear any contract.',$:100},
  {id:'century',c:'Career',n:'Century',d:'100 hostiles down in total.',$:1000,goal:100,stat:'kills'},
  {id:'legend',c:'Career',n:'Legend',d:'500 hostiles down in total.',$:3000,goal:500,stat:'kills'},
  {id:'suits',c:'Career',n:'Corner Office',d:'Ten high-value targets in total.',$:1000,goal:10,stat:'hvt'},
  {id:'network',c:'Career',n:'Network Down',d:'Clear all 24 contracts.',$:2500},
  {id:'goldmap',c:'Career',n:'Gold Rush',d:'A gold medal on every map.',$:5000},
  {id:'vet',c:'Career',n:'Veteran',d:'Clear any Veteran contract.',$:500},
  {id:'vet10',c:'Career',n:'Old Hand',d:'Clear ten different Veteran contracts.',$:3000},
  {id:'daily',c:'Career',n:'Daily Driver',d:'Clear a Daily contract.',$:300},
  {id:'wave5',c:'Career',n:'Wave Rider',d:'Clear 5 waves in Endless.',$:500},
  {id:'wave10',c:'Career',n:'Unstoppable',d:'Clear 10 waves in Endless.',$:2000},
  // armory
  {id:'rack',c:'Armory',n:'Full Rack',d:'Own every rifle.',$:3000},
  {id:'kitted',c:'Armory',n:'Fully Kitted',d:'Max out every upgrade track.',$:2000},
  {id:'midas',c:'Armory',n:'Midas',d:'Buy the 24k gold finish.',$:1000},
  // range
  {id:'cold',c:'Range',n:'Cold Bore',d:'Land a cold-bore hit at 800 m or farther.',$:500},
  {id:'km',c:'Range',n:'One Kilometer',d:'Ring the 1,000 m plate.',$:500},
  {id:'ladder',c:'Range',n:'The Ladder',d:'Climb the ladder from 100 to 1,000 m.',$:500},
  {id:'drills',c:'Range',n:'Range Master',d:'Finish every range drill.',$:1000}
];
const ACHI=Object.fromEntries(ACH.map(a=>[a.id,a]));
function achSave(){ save.ach=save.ach||{}; save.ast=Object.assign({kills:0,hvt:0,acc:0},save.ast||{}); save.drills=save.drills||{}; return save.ach; }
const achQ=[]; let achBusy=false;
function achGet(id){ const A=achSave(), a=ACHI[id]; if(!a||A[id]) return; A[id]=Date.now(); save.cash+=a.$; persist(); achQ.push(a); achToast(); try{ achRender(); }catch(e){} }
function achToast(){ if(achBusy||!achQ.length) return; const a=achQ.shift(), el=$('#achToast'); if(!el) return; achBusy=true;
  el.innerHTML=`<small>ACHIEVEMENT · +$${a.$.toLocaleString()}</small><b>${a.n}</b><span>${a.d}</span>`; el.hidden=false; void el.offsetWidth; el.classList.add('on');
  if(typeof snd!=='undefined'&&snd.ok&&snd.ok()) try{ tone(0,880,880,.12,.12); tone(.12,1320,1320,.2,.12); }catch(e){}
  setTimeout(()=>{ el.classList.remove('on'); setTimeout(()=>{ el.hidden=true; achBusy=false; achToast(); },350); },3400); }

/* hooks, called from game.js / range.js / config.js */
let achLastB=null;
function achKill(p,part,dist,accident){ if(!p.hostile||!M||M.range) return; achSave(); const S=save.ast, b=accident?null:achLastB;
  S.kills++; if(p.hvt) S.hvt++; if(accident) S.acc++;
  if(!accident&&dist>=500) achGet('reach'); if(!accident&&dist>=650) achGet('longarm');
  if(stats&&stats.heads>=3) achGet('triple'); if(stats&&stats.combo>=3) achGet('chain');
  if(b&&b.glass&&b.glass.size) achGet('glass'); if(b&&b.penned) achGet('wall');
  if(accident) achGet('act');
  if(p.driver&&typeof getaway!=='undefined'&&getaway&&getaway.v>1) achGet('moving');
  if(p.investigate>0) achGet('curious'); if(!accident&&typeof thermOn!=='undefined'&&thermOn&&scoped) achGet('heat'); if(p.sniper) achGet('counter');
  achCareer(); }
function achCareer(){ const S=save.ast; for(const a of ACH) if(a.stat&&S[a.stat]>=a.goal) achGet(a.id); }
function achFinish(ok,stars){ if(!M||M.range||!stats) return; if(M.endless){ const w=RUN.wave-1; if(w>=5) achGet('wave5'); if(w>=10) achGet('wave10'); return; } if(!ok) return;
  achGet('first'); if(save.guns.eq==='lever') achGet('cowboy'); if(stats.shots&&stats.hits>=stats.shots) achGet('surgeon'); if(timeLeft>=(M.time||120)*2/3) achGet('quick');
  if(!stats.alerted) achGet('ghost'); if(totalHos>=4&&stats.heads>=stats.kills&&stats.kills>=totalHos&&!stats.accidents) achGet('sweep');
  if(M.vet){ achGet('vet'); if(Object.values(save.vstars||{}).filter(s=>s>0).length>=10) achGet('vet10'); }
  if(M.daily) achGet('daily'); achCollect(); }
function achRange(dr,R){ achSave(); const D=save.drills; if(dr!=='free'&&R.hits) D[dr]=1;
  if(dr==='cold'&&R.coldHit>=800) achGet('cold'); if(dr==='ladder'&&!R.queue.length) achGet('ladder');
  if(Object.keys(DRILLS).filter(k=>k!=='free').every(k=>D[k])) achGet('drills'); }
function achRangeHit(d){ if(d>=990) achGet('km'); }
function achCollect(){ if(!save) return; const A=achSave();
  if(!A.network&&MISSIONS.every((m,i)=>save.stars[i]>0)) achGet('network');
  if(!A.goldmap){ const maps={}; MISSIONS.forEach((m,i)=>{ const k=m.map||'city'; maps[k]=maps[k]||save.stars[i]>=3; }); if(Object.values(maps).every(Boolean)) achGet('goldmap'); }
  if(!A.rack&&Object.keys(GUNS).every(k=>save.guns.owned.includes(k))) achGet('rack');
  if(!A.kitted&&Object.keys(save.up).every(k=>save.up[k]>=UPMAX)) achGet('kitted');
  if(!A.midas&&save.fin.owned.includes('gold')) achGet('midas');
  achCareer(); }

/* Ranks tab list */
function achRender(){ const el=$('#achList'); if(!el) return; const A=achSave(), got=ACH.filter(a=>A[a.id]).length;
  $('#achCount').textContent=`${got}/${ACH.length}`;
  let h='', cat=''; for(const a of ACH){ if(a.c!==cat){ cat=a.c; h+=`<div class="achc">${cat.toUpperCase()}</div>`; }
    const on=!!A[a.id], prog=a.stat&&!on?` · ${Math.min(save.ast[a.stat],a.goal)}/${a.goal}`:'';
    h+=`<div class="ach${on?' on':''}"><span class="ai">${on?'✓':'○'}</span><div><b>${a.n}</b><span>${a.d}${prog}</span></div><small>$${a.$.toLocaleString()}</small></div>`; }
  el.innerHTML=h; }
