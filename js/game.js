/* Longshot 3D · game.js · audio, state, flow, modes, shooting, update, camera */
'use strict';
/* ---------- audio ---------- */
let AC=null,NB=null;
let silentEl=null;
const SILENT_WAV='data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
function unlockAudio(){
  if(!save.opts.snd) return;
  // iOS: ask for the "playback" audio session so sound plays even with the ring/silent switch on
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  if(!silentEl){ try{ silentEl=new Audio(SILENT_WAV); silentEl.loop=true; silentEl.setAttribute('playsinline',''); silentEl.volume=.01; }catch(e){} }
  if(silentEl&&silentEl.paused){ const pr=silentEl.play(); if(pr&&pr.catch) pr.catch(()=>{}); }
  if(!AC){ try{AC=new (window.AudioContext||window.webkitAudioContext)(); const len=AC.sampleRate; NB=AC.createBuffer(1,len,AC.sampleRate); const d=NB.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;}catch(e){AC=null; return;} }
  if(AC.state!=='running'){ const pr=AC.resume(); if(pr&&pr.catch) pr.catch(()=>{}); }
  if(!AC._kicked){ try{ const b=AC.createBuffer(1,1,22050), s2=AC.createBufferSource(); s2.buffer=b; s2.connect(AC.destination); s2.start(0); AC._kicked=true; }catch(e){} }
}
for(const ev of ['touchend','click','keydown']) addEventListener(ev,()=>unlockAudio(),{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&AC&&AC.state!=='running'&&save.opts.snd){ const pr=AC.resume(); if(pr&&pr.catch) pr.catch(()=>{}); } });
function noise(delay,dur,type,freq,gain,decay){const t=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(); s.buffer=NB; f.type=type; f.frequency.value=freq; g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(.001,t+decay); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t+dur);}
function tone(delay,f0,f1,dur,gain){const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain(); o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(.001,t+dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+dur+.02);}
let rainNode=null;
function rainSound(on){
  if(rainNode){try{rainNode.stop();}catch(e){} rainNode=null;}
  if(!on||!AC||!save.opts.snd) return;
  const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(); s.buffer=NB; s.loop=true; f.type='lowpass'; f.frequency.value=1400; g.gain.value=.07; s.connect(f).connect(g).connect(AC.destination); s.start(); rainNode=s;
}
const snd={
  ok:()=>AC&&save.opts.snd,
  gun(){if(!this.ok())return; if(supOn()){ noise(0,.4,'lowpass',900,.45,.25); noise(0,.08,'highpass',3000,.15,.05); tone(0,120,50,.15,.35); return; } if(gun().pen){ noise(0,1.6,'lowpass',1300,1,1.3); tone(0,110,26,.45,1); noise(0,.15,'highpass',3800,.5,.09); return; } noise(0,1.2,'lowpass',1900,.9,.9); noise(0,.12,'highpass',4500,.45,.07); tone(0,150,38,.3,.8); noise(.35,.05,'highpass',3200,.25,.03); noise(.58,.05,'highpass',2600,.3,.035);},
  impact(dist,flesh){if(!this.ok())return; const dl=Math.min(2.5,dist/340); if(flesh){tone(dl,110,48,.16,.35); noise(dl,.15,'lowpass',700,.25,.12);} else noise(dl,.2,'bandpass',900,.18,.15);},
  click(){if(!this.ok())return; noise(0,.04,'highpass',3000,.25,.03);},
  crack(){if(!this.ok())return; noise(0,.3,'highpass',2200,.9,.18); tone(0,900,200,.12,.4); noise(.05,1,'lowpass',900,.4,.8);},
  boom(dist){if(!this.ok())return; const dl=Math.min(2.5,dist/340); noise(dl,2.2,'lowpass',420,1,1.8); tone(dl,70,28,.9,.9); noise(dl,.3,'bandpass',1200,.5,.25);},
  thud(dist){if(!this.ok())return; const dl=Math.min(2.5,dist/340); tone(dl,90,35,.4,.8); noise(dl,.5,'lowpass',500,.6,.4);},
  reload(){if(!this.ok())return; noise(0,.05,'highpass',2400,.3,.04); noise(.25,.05,'highpass',1800,.3,.04); noise(.55,.05,'highpass',3200,.3,.03);}
};

/* ---------- state ---------- */
let state='loading', mi=0, M=null;
let yaw=0, pitch=-.07, scoped=false, zoom=8, fov=BASE_FOV, blink=0;
let ammo=5, magSize=5, reloadT=0, cooldown=0, breath=1, holding=false, breathOut=0;
let T=0, timeLeft=0, wind=0, windBase=0, lastRange=0, rangeNow=0, rfTick=0;
let bullets=[], pops=[], kick=0, flash=0, endT=-1, endInfo=null, kc=null, totalHos=0, stats=null;
let escort=null, getaway=null, glints=[], playerHp=2, hurt=0; const SN_AIM=3.6;

function hostilesLeft(){return people.filter(p=>p.hostile&&alive(p)).length+(escort?escort.pending:0);}
function windLat(){return wind*Math.cos(yaw);}
function holdFor(d){ return trajLOS(d,pitch,THETA0,windLat()); }
function tofAt(d){ return trajLOS(d,pitch,THETA0,0).t; }
function setDial(R){ DIAL=R; THETA0=zeroAt(DIAL); }
function swayRad(){
  if(!scoped||state!=='play') return [0,0];
  const A=1.1e-3*UPG.stab.vals[save.up.stab]*gun().sway*(holding?.1:1)*(breathOut>0?1.7:1);
  return [A*(Math.sin(T*.83)+.45*Math.sin(T*2.1+1)), A*(.8*Math.cos(T*.67)+.4*Math.sin(T*1.7+.5))];
}

/* ---------- flow ---------- */
/* ---------- modes: veteran replays, daily contract, endless waves ---------- */
let RUN={kind:'c',wave:1,spawnT:0};
const markOn=()=>!!save.opts.mark&&!(M&&M.noMark);
function dayKey(d){d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function hashStr(t){let h=2166136261; for(let i=0;i<t.length;i++){h^=t.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0;}
const POOL=()=>MISSIONS.map((m,i)=>i).filter(i=>!MISSIONS[i].mode);
function dailyMission(){
  const key=dayKey(), r=mulberry(hashStr('daily'+key)), P0=POOL(), bi=P0[Math.floor(r()*P0.length)], b=MISSIONS[bi];
  const pal=b.fight?b.pal:pick(r,['day','dusk','night']), mon=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return Object.assign({},b,{daily:key,base:bi,n:'Daily · '+mon,pal,rain:!b.fight&&pal!=='day'&&r()<.3,wind:b.fight?0:Math.round(rr(r,0,6.5)*10)/10,
    hos:b.hos+Math.floor(r()*3),hvt:r()<.4?1:0,sn:b.fight?0:(r()<.45?1:0),move:Math.min(1,(b.move||.3)+rr(r,0,.3)),time:b.time+20,ch:[],seed:hashStr('w'+key)%900000+5000});
}
function endlessMission(seed){
  const r=mulberry(seed), P0=POOL(), bi=P0[Math.floor(r()*P0.length)], b=MISSIONS[bi];
  return Object.assign({},b,{endless:true,base:bi,n:'Endless',pal:b.fight?b.pal:pick(r,['day','dusk','night']),rain:false,hos:2,hvt:0,sn:0,
    wind:b.fight?0:Math.round(rr(r,0,3.5)*10)/10,time:75,esc:Math.max(b.esc,7),ch:[],seed});
}
function missionFor(i,kind){
  const b=MISSIONS[i];
  if(kind==='v') return Object.assign({},b,{vet:true,noMark:true,plain:i===0,wind:b.fight?0:Math.max(3,Math.round((b.wind||0)*1.6*10)/10),sn:b.fight||b.mode==='escort'||b.mode==='train'?0:Math.max(1,b.sn||0),
    hp:b.fight?2:1,time:Math.round(b.time*.9),move:Math.min(1,(b.move||0)+.2),esc:b.esc*.8,ch:[],seed:1000+i*7919+31});
  if(kind==='d') return dailyMission();
  if(kind==='r') return rangeMission();
  if(kind==='e') return endlessMission((Date.now()%900000)+1);
  return b;
}
function spawnWave(){
  const w=RUN.wave, n=Math.min(6,1+w), before=people.filter(p=>p.hostile).length;
  for(let k=0;k<n;k++) addPerson(MR,true,false,M.types,M.band,Math.min(1,(M.move||.3)+w*.04));
  if(w%3===0) addPerson(MR,true,true,M.types,M.band,M.move);
  if(w>=4&&w%2===0&&!M.fight){ windBase=clamp(windBase*1.2+(windBase>=0?.6:-.6),-8,8); }
  totalHos+=people.filter(p=>p.hostile).length-before; rebuildHits(); hudSetup();
  hintMsg=`WAVE ${w} · ${n+(w%3===0?1:0)} hostiles`+(w%3===0?' incl. a high-value target':''); hintT=3;
}
// conversations: pair some standing civilians face to face, one talking with their hands
function pairUp(r){
  const free=people.filter(p=>!p.hostile&&!p.moving&&!p.seg&&p.state==='idle'&&p.pose!=='seated');
  for(const a of free){ if(a.pal||r()>.55) continue;
    for(let t=0;t<8;t++){ const ang=r()*TAU, bx=a.x+Math.sin(ang)*1.25, bz=a.z+Math.cos(ang)*1.25;
      if(bx<a.rect.x0||bx>a.rect.x1||bz<a.rect.z0||bz>a.rect.z1||blockedAt(bx,bz,a.y,.4)) continue;
      const b=free.find(q=>q!==a&&!q.pal&&Math.abs(q.y-a.y)<.5&&Math.hypot(q.x-a.x,q.z-a.z)<40); if(!b) break;
      b.x=bx; b.z=bz; b.rect=a.rect; b.y=a.y; a.pal=b; b.pal=a; a.heading=Math.atan2(bx-a.x,bz-a.z); b.heading=a.heading+Math.PI;
      a.pose='talk'; b.pose=r()<.5?'talk':pick(r,['crossed','stand','hips']); b.phase=a.phase+3.5; if(b.mesh) b.mesh.root.position.set(b.x,b.y,b.z); break; }
  }
}
function prep(i,kind){
  kind=kind||'c'; RUN={kind,wave:1,spawnT:0,drill:RUN.drill||'free'};
  thermApplied=false; thermOn=false;
  M=missionFor(i,kind); mi=M.base!=null?M.base:i;
  buildWorld(M.map||'city',M.seed||1000+i*7919,M.pal,M.rain);
  const r=mulberry(M.seed?M.seed+77:77+i*131);
  escort=null; getaway=null; glints=[];
  let esc=false; if(M.mode==='escort') esc=setupEscort(r);
  if(!esc) for(let k=0;k<M.hos;k++) addPerson(r,true,false,M.types,M.band,M.move);
  if(M.hvt) addPerson(r,true,true,M.types,M.band,M.move);
  if(M.mode==='getaway') setupGetaway(r);
  setupSnipers(r);
  const civT=M.civT||[...new Set([...M.types,...CIVT[M.map||'city']])];
  const nCiv=Math.min(34,Math.round(M.civ*2));
  for(let k=0;k<nCiv;k++) addPerson(r,false,false,civT,[Math.min(60,M.band[0]),M.band[1]+150],.5);
  pairUp(r);
  totalHos=people.filter(p=>p.hostile).length+(escort?escort.pending:0);
  windBase=M.wind?(r()<.5?-1:1)*rr(r,M.wind*.6,M.wind):0; wind=windBase;
  placeHazards(r); featSetup(r); distractSetup(r); rebuildHits(); yaw=0; pitch=city.startPitch!=null?city.startPitch:-.07;
  if(M.range) rangeSetup(r);
}
function menuCity(){
  hazards=[]; escort=null; getaway=null; glints=[];
  buildWorld('city',7,'dusk'); const r=mulberry(3);
  for(let k=0;k<30;k++) addPerson(r,false,false,['roof','street','plaza'],[60,700],.6);
  windBase=3; rebuildHits();
}
function start(){
  DIAL=ZERO; MIN_ZOOM=M.minZoom||4; state='play'; scoped=false; zoom=M.minZoom?3:Math.min(8,maxZoom()); timeLeft=M.time; fightCD=0;
  applyGun(); magSize=Math.max(2,UPG.mag.vals[save.up.mag]+gun().magAdd); ammo=magSize; reloadT=0; cooldown=0; breath=1; holding=false; breathOut=0;
  bullets=[]; pops=[]; endT=-1; endInfo=null; kc=null; kick=0; flash=0; T=0; lastRange=0;
  stats={shots:0,hits:0,heads:0,kills:0,score:0,alerted:false,longest:0,moving:false,accidents:0,combo:1,lastKill:-99};
  playerHp=M.hp||2; hurt=0; hintMsg=''; hintT=0;
  show('hud'); hudSetup(); rainSound(rainOn);
}
function fail(reason){if(endInfo) return; endInfo={ok:false,reason}; endT=1.5; holding=false;}
function win(){if(endInfo) return; endInfo={ok:true}; endT=1.3;}
function finish(){
  rainSound(false);
  state='result'; scoped=false; holding=false; bulletObj.visible=false;
  if(M.range){ rangeFinish(); return; }
  const ok=endInfo.ok, acc=stats.shots?stats.hits/stats.shots:0; let stars=0,cash=0;
  const accC=Math.min(1,acc), total=ok?stats.score+Math.round(timeLeft)*4+Math.round(accC*400):0, par=totalHos*190+250;
  if(M.endless){ const wave=RUN.wave-1, sc=stats.score, E=save.endless, newBest=wave>E.wave||(wave===E.wave&&sc>E.score);
    cash=stats.kills*90+Math.max(0,wave)*150; save.cash+=cash; if(newBest){E.wave=wave; E.score=sc;} E.kills=Math.max(E.kills,stats.kills); persist();
    $('#rNo').textContent='ENDLESS'; const hd=$('#rHead'); hd.textContent=newBest?'New best run':'Run over'; hd.className=newBest?'ok':'bad';
    $('#rReason').textContent=`${endInfo.reason||''} Waves cleared: ${wave}. Score ${sc.toLocaleString()}. Best: ${E.wave} waves.`;
    $('#rStars').innerHTML=''; $('#rCh').innerHTML='';
    $('#rT').textContent=String(stats.kills); $('#rH').textContent=stats.heads; $('#rA').textContent=Math.round(acc*100)+'%'; $('#rC').textContent='$'+cash.toLocaleString();
    {const rk=lbRank('endless'); if(rk) $('#rReason').textContent+=' '+rk;}
    try{ achFinish(false,0); }catch(e){} $('#rNext').hidden=true; $('#rRetry').textContent='New run'; show('result'); return; }
  $('#rRetry').textContent='Retry';
  if(M.vet||M.daily){
    if(ok){ stars=total>=par*1.45?3:total>=par?2:1; cash=Math.round(total*.6*(M.vet?2:1.5));
      if(M.vet){ save.vbest[mi]=Math.max(save.vbest[mi]||0,total); save.vstars[mi]=Math.max(save.vstars[mi]||0,stars); }
      else { const D=save.daily[M.daily]||{best:0,stars:0}; D.best=Math.max(D.best,total); D.stars=Math.max(D.stars,stars); save.daily={[M.daily]:D}; }
      save.cash+=cash; persist(); }
    const best=M.vet?save.vbest[mi]:(save.daily[M.daily]||{}).best;
    $('#rNo').textContent=M.vet?'VETERAN · CONTRACT '+String(mi+1).padStart(2,'0'):'DAILY CONTRACT';
    const hd=$('#rHead'); hd.textContent=ok?'Contract complete':'Contract failed'; hd.className=ok?'ok':'bad';
    $('#rReason').textContent=ok?`SCORE ${total.toLocaleString()} · ${['','BRONZE','SILVER','GOLD'][stars]} · BEST ${(best||total).toLocaleString()}`+(stars<3?` · GOLD AT ${Math.ceil(par*1.45).toLocaleString()}`:''):endInfo.reason;
    $('#rStars').innerHTML=ok?`<span class="medal m${stars}">${M.vet?'VETERAN ':''}${['','BRONZE','SILVER','GOLD'][stars]}</span>`:'';
    $('#rT').textContent=`${stats.kills}/${totalHos}`; $('#rH').textContent=stats.heads; $('#rA').textContent=Math.round(acc*100)+'%'; $('#rC').textContent='$'+cash.toLocaleString();
    if(M.daily&&ok){const rk=lbRank('daily'); if(rk) $('#rReason').textContent+=' · '+rk;}
    $('#rCh').innerHTML=''; try{ achFinish(ok,stars); }catch(e){} $('#rNext').hidden=true; show('result'); return; }
  if(ok){stars=total>=par*1.45?3:total>=par?2:1; cash=Math.round(total*.6); save.best=save.best||{}; save.best[mi]=Math.max(save.best[mi]||0,total); save.cash+=cash; save.stars[mi]=Math.max(save.stars[mi]||0,stars); if(save.unlocked<mi+2) save.unlocked=Math.min(MISSIONS.length,mi+2); persist();}
  $('#rNo').textContent='CONTRACT '+String(mi+1).padStart(2,'0');
  const hd=$('#rHead'); hd.textContent=ok?'Contract complete':'Contract failed'; hd.className=ok?'ok':'bad';
  $('#rReason').textContent=ok?`SCORE ${total.toLocaleString()} · ${['','BRONZE','SILVER','GOLD'][stars]} · BEST ${(save.best[mi]||total).toLocaleString()}`+(stars<3?` · GOLD AT ${Math.ceil(par*1.45).toLocaleString()}`:''):endInfo.reason;
  $('#rStars').innerHTML=ok?`<span class="medal m${stars}">${['','BRONZE','SILVER','GOLD'][stars]}</span>`:'';
  $('#rT').textContent=`${stats.kills}/${totalHos}`; $('#rH').textContent=stats.heads;
  $('#rA').textContent=Math.round(acc*100)+'%'; $('#rC').textContent='$'+cash.toLocaleString();
  const done=new Set(save.ch[mi]||[]); let bonus=0;
  $('#rCh').innerHTML=(M.ch||[]).map(id=>{const got=ok&&CH[id].ok(); if(got){ if(!done.has(id)) bonus+=150; done.add(id);} return `<div class="${got?'on':''}"><span>${got?'✓':'○'}</span>${CH[id].t(M)}${got?'':''}</div>`;}).join('');
  if(ok){save.ch[mi]=[...done]; save.cash+=bonus; persist(); if(bonus) $('#rC').textContent='$'+(cash+bonus).toLocaleString();}
  try{ achFinish(ok,stars); }catch(e){}
  $('#rNext').hidden=!(ok&&mi+1<MISSIONS.length);
  show('result');
}
function show(which){for(const id of ['hud','menu','brief','result','pauseM']) $('#'+id).hidden=id!==which; if(which==='menu') buildMenu();}
function fmt(t){t=Math.max(0,Math.ceil(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
const REC=[ // recommended rifle per contract, and why
  ['bolt','Steady, accurate, plenty for two targets.'],['bolt','Clearings are small; one careful shot each.'],['bolt','Wind shots reward the steadiest rifle.'],
  ['semi','Crowded roof: fast follow-ups before they scatter.'],['bolt','Long range plus a counter-sniper; precision wins.'],['semi','Four targets across the yard; quick second shots.'],
  ['fifty','Punches through the ledge and office glass.'],['fifty','Shoots straight through cabin walls and doors.'],['bolt','One clean shot on the courier.'],
  ['bolt','Big gusts; least sway helps you hold.'],['semi','Dark and busy; fire again before they find cover.'],['fifty','Two snipers behind cover; the .50 goes through it.'],
  ['semi','Six attackers in a hurry; 0.3 s between shots.'],['fifty','Fastest round, so the least lead on a moving car.'],['semi','Short range, six shooters: fast follow-ups beat raw power.']];
window.__eqRec=(g,i,k)=>{ if(!save.guns.owned.includes(g)){ if(save.cash<GUNS[g].cost) return; save.cash-=GUNS[g].cost; save.guns.owned.push(g); snd.click&&snd.click(); } save.guns.eq=g; applyGun(); persist(); openBrief(i,['d','v','e','r'].includes(k)?k:'c'); };
function openBrief(i,kind){
  prep(i,kind); i=mi; state='brief'; const m=M;
  $('#bNo').textContent=m.range?'TARGET RANGE':m.endless?'ENDLESS':m.daily?'DAILY CONTRACT':(m.vet?'VETERAN · ':'')+'CONTRACT '+String(i+1).padStart(2,'0');
  $('#bPal').textContent={day:'DAYLIGHT',dusk:'DUSK',night:'NIGHT'}[m.pal];
  $('#bName').textContent=m.n;
  $('#bHos').textContent=totalHos;
  $('#bWind').textContent=m.wind?`≤ ${m.wind} m/s`:'CALM';
  $('#bTime').textContent=fmt(m.time);
  const ds=people.filter(p=>p.hostile).map(p=>p.d);
  $('#bRange').textContent=ds.length?`${Math.round(Math.min(...ds)/10)*10}–${Math.round(Math.max(...ds)/10)*10} m`:'—';
  const where={roof:'rooftops',court:'the courtyard',base:'the base yard',stand:'the stands',walk:'the bridge walkways',balc:'hotel balconies',lobby:'the lobby',plat:'the platform',room:'the apartments',wfloor:'the warehouse floor',street:'the streets',plaza:'the plaza below',camp:'the logging camp',meadow:'the meadows',deck:'cabin porches',road:'the dirt roads',tower:'the far fire tower',yard:'farm yards',field:'the fields',stack:'container stacks',aisle:'the aisles between containers',quay:'the far quay',ship:'the cargo ship',floor:'office floors behind the glass',level:'the garage decks across from you',lot:'the parking lot below'};
  if(city&&city.kind==='snow') where.tower='the guard towers';
  // the dossier: who to shoot, the rifle, then field notes (open on a first attempt, folded after)
  const tg=[]; let photos='';
  tg.push((m.plain?`This time the targets are in <b>plain clothes</b>: no armband, no visible rifle. Match them to the photos below. Expect them on ${[...new Set(m.types.map(t=>where[t]))].join(' and ')}. `:`Hostiles wear <b>black jackets with a red armband</b> and carry rifles. Expect them on ${[...new Set(m.types.map(t=>where[t]))].join(' and ')}. `).trim());
  if(m.hvt) tg.push((`One <b>high-value target</b> wears a white suit and carries a briefcase. `).trim());
  if(m.mode==='escort'){ tg.length=0; tg.push((`Protect the <b>VIP</b> with the green marker as he walks the street. Attackers in black will close in on him one by one; drop each before he reaches the VIP. <span class="h">Hitting the VIP or any civilian ends the contract.</span>`).trim()); }
  else tg.push(`<span class="h">Everyone else is a civilian. One civilian hit ends the contract.</span>`);
  if(m.mode==='getaway') tg.push((` The target is <b>driving a dark blue car</b> along the county road from the left. Hit the driver through the windows before he leaves your view. He stops at <b>two stop signs</b> on the way: that’s your window. While he’s rolling, put the crosshair on the <b>blue diamond</b> to lead him. Spook him and he floors it and runs the signs.`).trim());
  if(m.sn) tg.push((` <b>${m.sn>1?m.sn+' counter-snipers':'A counter-sniper'}</b> in the area: watch for a scope glint. When the red ring appears he is aiming at you, and ${(m.hp||2)===1?'one hit ends':'two hits end'} the contract.`).trim());
  const notes=[];
  if(i===0) notes.push('Best played in landscape. Tap SCOPE, drag to aim, tap FIRE.');
  if(i===4) notes.push('Past 300 m the round drops. Watch the HOLD readout.');
  { const t=({forest:` You're up a fire lookout over the valley. Trees block your view, so work the clearings.`,farm:` You're on top of a grain silo. Open fields mean long, windy shots.`,harbor:` You're up a gantry crane over the container yard. Containers block sightlines, so watch the gaps.`,office:` You're on a rooftop facing glass office towers. Shoot through the windows.`,garage:` You're on the roof of one parking garage, facing another across the lot. <b>Close quarters:</b> the scope zooms out to 1.5x. Once the shooting starts, hostiles <b>run for cover and fire back</b>; a red ring shows who's aiming. Three hits and you're down.`}[m.map]||CQ_TXT[m.map]||'')||''; if(t.trim()) notes.unshift(t.trim()); }
  { const f=!m.range&&!m.endless?FEAT[i]:null; if(f){ if(FEAT_NOTE[i]) notes.push(FEAT_NOTE[i].trim()); if(f.brief) photos=f.brief(); } }
  if(DIS.length&&!m.range) notes.push((` <span style="color:var(--muted)">There ${DIS.length>1?'are '+DIS.length+' distractions':'is a distraction'} (white <b>!</b>) near the hostiles: a car alarm or a bottle. Shoot it and nearby guards walk over to look, without raising the alarm.</span>`).replace(/<\/?span[^>]*>/g,'').trim());
  let top='';
  if(m.vet) top+=(`<b style="color:#ff6b5b">VETERAN.</b> No hostile markers, stronger wind, faster targets${m.sn?', a counter-sniper':''}, and ${(m.hp||1)===1?'one hit ends it':'two hits end it'}. Double cash. `).trim()+' ';
  if(m.daily) top+=(`<b style="color:#38e1ff">TODAY'S CONTRACT.</b> A fresh setup every day, the same for everyone. Beat your best score before midnight. 1.5× cash. `).trim()+' ';
  if(m.endless) top+=(`<b style="color:#ffb22e">ENDLESS.</b> Waves keep coming. Each kill adds 6 seconds, a headshot 9. Every third wave brings a high-value target. The run ends when the clock hits zero, a hostile escapes, or you hit a civilian. Your best: ${save.endless.wave||0} waves cleared. `).trim()+' ';
  let rifle='';
  {const [rg,why]=REC[i]||['bolt',''], own=save.guns.owned.includes(rg), on=save.guns.eq===rg, cost=GUNS[rg].cost, go=`onclick="window.__eqRec('${rg}',${i},'${RUN.kind}')"`;
   const act=on?`<span class="ok">&#10003; Recommended</span>`:own?`<button class="rbtn" ${go}>EQUIP</button>`:save.cash>=cost?`<button class="rbtn" ${go}>BUY &amp; EQUIP · $${cost.toLocaleString()}</button>`:`<span class="cost">$${cost.toLocaleString()} · you have $${Math.floor(save.cash).toLocaleString()}</span>`;
   rifle=`<div class="rifle${act.startsWith('<button')?' wide':''}"><div class="rl"><small>RIFLE</small><b>${gun().name}${supOn()?' + suppressor':''}</b>${on?'':`<span class="rec">Recommended: <b>${GUNS[rg].name}</b></span>`}</div><div class="ra">${act}</div><p>${why}</p></div>`;}
  let txt=(top?`<p class="mode">${top.trim()}</p>`:'')+`<div class="tgt"><small>TARGETS</small>${tg.map(t=>`<p>${t}</p>`).join('')}${photos}</div>`+rifle;
  if(notes.length){ const first=!(save.stars&&save.stars[i]>0)&&!m.daily&&!m.endless&&!m.vet; txt+=`<details class="notes"${first?' open':''}><summary>FIELD NOTES</summary>${notes.map(t=>`<p>${t}</p>`).join('')}</details>`; }
  if(escort) $('#bRange').textContent=`${Math.round(-escort.line.c/10)*10} m`;
  $('#bHosL').textContent=m.range?'PLATES':'HOSTILES';
  if(m.range){ txt=rangeBriefHtml(); $('#bHos').textContent='10'; $('#bRange').textContent='100–1,000 m'; $('#bTime').textContent=RUN.drill==='speed'?'0:30':'NONE'; $('#bWind').textContent=RUN.drill==='wind'?'GUSTY':'LIGHT'; }
  if(!m.range&&!m.endless&&!m.daily) txt=storyHtml(i)+txt;
  $('#bIntel').innerHTML=txt; { const f=!m.range&&!m.endless?FEAT[i]:null; if(f&&f.after) try{ f.after(); }catch(e){} }
  const dn=new Set(save.ch[i]||[]); $('#bCh').innerHTML=(m.ch||[]).map(id=>`<div class="${dn.has(id)?'on':''}"><span>${dn.has(id)?'✓':'○'}</span>${CH[id].t(m)}</div>`).join('');
  show('brief');
}

/* ---------- shooting ---------- */
const V3=()=>new THREE.Vector3();
function fire(){
  if(state!=='play'||endInfo||cooldown>0||reloadT>0) return;
  if(ammo<=0){doReload(); return;}
  unlockAudio(); ammo--; cooldown=BOLT; stats.shots++;
  camera.updateMatrixWorld();
  const fwd=V3().set(0,0,-1).applyQuaternion(camera.quaternion), up=V3().set(0,1,0).applyQuaternion(camera.quaternion), right=V3().set(1,0,0).applyQuaternion(camera.quaternion);
  const dir=fwd.clone().addScaledVector(up,THETA0);
  if(!scoped){const g=()=>(MR()+MR()+MR()-1.5)*.012; dir.addScaledVector(right,g()).addScaledVector(up,g());}
  dir.normalize();
  const b={pos:EYE.clone().addScaledVector(up,-SIGHT_H).addScaledVector(dir,.5),vel:dir.clone().multiplyScalar(V0),t:0,done:false,kc:false};
  bullets.push(b); kick=gun().kick; flash=1; snd.gun(); haptic(gun().pen?70:gun().auto?22:40);
  if(M.range) rangeFire(b,dir);
  if(!supOn()) for(const p of people){ if(!alive(p)||p.driver||p.sniper) continue; const d=Math.hypot(p.x-EYE.x,p.y-EYE.y,p.z-EYE.z); if(d<1400) p.hearT=T+d/343+MR()*.3; } // sound reaches them at 343 m/s
  if(scoped&&hostilesLeft()===1){const tgt=predictKill(dir); if(tgt){b.kc=true; const flight=tgt.t; kc={b,p:tgt.p,phase:0,t:0,ts:clamp(flight/2.2,.015,.4),orbit:MR()*TAU}; state='killcam'; bulletObj.visible=true;}}
  if(ammo===0) setTimeout(()=>{if(state==='play'&&ammo===0&&reloadT<=0) doReload();},BOLT*1000);
}
function predictKill(dir){
  RC.set(EYE,dir); RC.near=0; RC.far=1500; const hs=RC.intersectObjects(solid,false); let wallD=hs.length?hs[0].distance:1e9; const tg=terrainRange(EYE,dir,1500); if(tg&&tg<wallD) wallD=tg;
  const p=people.find(q=>q.hostile&&alive(q)); if(!p) return null;
  const v=dir.clone().multiplyScalar(V0), pos=EYE.clone().addScaledVector(V3().set(0,1,0).applyQuaternion(camera.quaternion),-SIGHT_H), h=1/900;
  for(let t=0;t<2.6;t+=h){
    { const ax=v.x-wind, s=Math.hypot(ax,v.y,v.z); v.x-=CD*s*ax*h; v.y-=(CD*s*v.y+GRAV)*h; v.z-=CD*s*v.z*h; if(!CD) v.x+=KW*wind*h; pos.addScaledVector(v,h); }
    if(EYE.distanceTo(pos)>wallD+.5) return null;
    const px=p.x+p.vx*t, pz=p.z+p.vz*t;
    const dh=Math.hypot(pos.x-px,pos.y-(p.y+(p.headY||1.64)),pos.z-pz), dbx=Math.hypot(pos.x-px,pos.z-pz), by=pos.y-p.y;
    if(dh<.15||(dbx<.26&&by>.05&&by<1.47)) return {p,t};
  }
  return null;
}
function doReload(){if(state!=='play'||reloadT>0||ammo===magSize) return; reloadT=RELOAD[save.up.mag]; snd.reload();}
const _p0=V3(), _seg=V3();
function stepBullets(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i]; let rem=dt;
    while(rem>1e-6&&!b.done){
      const h=Math.min(rem,1/240); rem-=h; b.t+=h;
      _p0.copy(b.pos);
      { const v=b.vel, ax=v.x-wind, s=Math.hypot(ax,v.y,v.z); v.x-=CD*s*ax*h; v.y-=(CD*s*v.y+GRAV)*h; v.z-=CD*s*v.z*h; if(!CD) v.x+=KW*wind*h; }
      b.pos.addScaledVector(b.vel,h); if(b.rgAim) rangeTrack(b);
      _seg.copy(b.pos).sub(_p0); const L=_seg.length(); RC.set(_p0,_seg.divideScalar(L)); RC.near=0; RC.far=L;
      let hit=RC.intersectObjects(hitList,false)[0];
      // window glass: the round goes through but leaves a hole and is knocked a few milliradians off line
      if(glassMeshes.length){ const gh=RC.intersectObjects(glassMeshes,false)[0]; if(gh&&(!hit||gh.distance<hit.distance)&&!(b.glass||(b.glass=new Set())).has(gh.object)){ b.glass.add(gh.object); glassHit(gh.point); deflect(b,.004,.96); } }
      // trees: trunks stop it, leaves nudge it
      if(city.trees){ const tr=treeOnSeg(_p0,b.pos,b); if(tr&&(!hit||tr.d<hit.distance)){ hit={point:tr.point,object:null,distance:tr.d,tree:true}; } }
      if(hit&&gun().pen&&!b.penned&&!(hit.object.userData&&(hit.object.userData.p||hit.object.userData.hz))){
        const dir=_seg.clone(), far=hit.point.clone().addScaledVector(dir,gun().pen); RC.set(far,dir.clone().negate()); RC.near=0; RC.far=gun().pen;
        const back=RC.intersectObject(hit.object,false)[0];
        if(back){ b.penned=true; puff(hit.point,.7,false); b.pos.copy(back.point).addScaledVector(dir,.06); b.vel.multiplyScalar(.85); continue; }
      }
      if(hit){b.done=true; b.pos.copy(hit.point); impact(b,hit);}
      else if(city.gHit&&b.pos.y<city.gHit(b.pos.x,b.pos.z)){b.done=true; impact(b,{point:b.pos.clone(),object:null,water:b.pos.y<city.lakeLvl+.3&&city.gY(b.pos.x,b.pos.z)<city.lakeLvl});}
      else if(b.t>3.2||b.pos.y<-60){b.done=true; if(b.kc) endKC();}
    }
    traceAt(b);
    if(b.done){ if(b.tr){ b.tr.visible=false; tracePool.push(b.tr); b.tr=null; } bullets.splice(i,1); }
  }
}
// supersonic "trace": the shock wave you see through a scope; drawn as a faint streak that follows the round
const tracePool=[];
function traceAt(b){
  if(!b.tr){ b.tr=tracePool.pop(); if(!b.tr){ b.tr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xdfe6ff,transparent:true,opacity:.42,depthWrite:false,fog:false})); b.tr.renderOrder=6; scene.add(b.tr);} }
  const d=EYE.distanceTo(b.pos); b.tr.visible=scoped&&state==='play'&&b.t>.05&&d>60&&!b.done; b.tr.position.copy(b.pos); const s=Math.max(.18,d*.0035); b.tr.scale.set(s,s,1);
  b.tr.material.opacity=.42*Math.min(1,b.vel.length()/500);
}
function deflect(b,mrad,keep){ const v=b.vel, L=v.length(), n1=V3().set(-v.z,0,v.x).normalize(), n2=V3().crossVectors(v,n1).normalize();
  v.addScaledVector(n1,(MR()-.5)*2*mrad*L).addScaledVector(n2,(MR()-.5)*2*mrad*L).setLength(L*keep); }
function glassHit(pt){ puff(pt,.35,false); snd.glass&&snd.glass(EYE.distanceTo(pt)); }
function treeOnSeg(a,c,b){ // segment vs trunk cylinders and canopy cones (same shapes the sight-line test uses)
  const dx=c.x-a.x, dz=c.z-a.z, L2=dx*dx+dz*dz; if(L2<1e-6) return null; let best=null;
  for(const tr of city.trees){
    if(Math.abs(tr.x-a.x)>(Math.abs(dx)+12)||Math.abs(tr.z-a.z)>(Math.abs(dz)+12)) continue;
    const k=clamp(((tr.x-a.x)*dx+(tr.z-a.z)*dz)/L2,0,1), px=a.x+dx*k-tr.x, pz=a.z+dz*k-tr.z, yl=a.y+(c.y-a.y)*k, hh=yl-tr.y, r2=px*px+pz*pz;
    if(hh<0||hh>10.5*tr.s) continue;
    if(hh<2.6*tr.s){ const rt=.22*tr.s; if(r2<rt*rt){ const d=EYE.distanceTo(a)*0+Math.sqrt(L2)*k; if(!best||d<best.d) best={d:a.distanceTo(V3().set(a.x+dx*k,yl,a.z+dz*k)),point:V3().set(a.x+dx*k,yl,a.z+dz*k)}; } }
    else { const rad=2.4*tr.s*(1-(hh-2.4*tr.s)/(8.5*tr.s))+.2; if(r2<rad*rad&&!(b.leaf||(b.leaf=new Set())).has(tr)){ b.leaf.add(tr); deflect(b,.0015,.97); } }
  }
  return best; }
function impact(b,hit){
  if(featImpact(b,hit)) return;
  if(distractImpact(b,hit)) return;
  if(M&&M.range){ if(!rangeImpact(b,hit)){ puff(hit.point,hit.water?1.4:1,false); snd.impact(EYE.distanceTo(hit.point),false); } else puff(hit.point,.35,false); return; }
  const u=hit.object?hit.object.userData:null, dist=EYE.distanceTo(hit.point);
  if(u&&u.hz){ puff(hit.point,.7,false); triggerHazard(u.hz,dist); }
  else if(u&&u.p&&alive(u.p)){ achLastB=b; kill(u.p,u.part,hit.point,dist,b.vel); }
  else { puff(hit.point,hit.water?1.4:1,hit.water?'water':false); snd.impact(dist,false); disturb(hit.point,'miss'); }
  if(b.kc){ if(kc&&!alive(kc.p)){kc.phase=1; kc.t=0;} else endKC(); }
}
function endKC(){ if(state==='killcam'){state='play'; kc=null; bulletObj.visible=false;} }
function kill(p,part,pt,dist,vel,accident){
  if(p.hostile&&stats){ if(Math.hypot(p.vx,p.vz)>.5) stats.moving=true; stats.longest=Math.max(stats.longest,dist); }
  p.hitPart=part; p.twist=rr(MR,-.45,.45); if(vel){const h=p.mesh.root.rotation.y; p.fall=(Math.sin(h)*vel.x+Math.cos(h)*vel.z)>0?1:-1;}
  if(p.glint) p.glint.visible=false;
  p.state='dead'; p.deadT=0; if(!p.driver){p.vx=p.vz=0;} p.mesh.al.visible=false; if(p.mesh.mk) p.mesh.mk.visible=false;
  if(!accident){ puff(pt,.8,true); snd.impact(dist,true); }
  rebuildHits();
  const sp=V3().set(p.x,p.y+2.2,p.z);
  if(p.hostile){
    if(!accident) stats.hits++; stats.kills++; if(part==='head'&&!accident) stats.heads++; if(accident) stats.accidents++;
    stats.combo=(T-stats.lastKill<5)?Math.min(3,stats.combo+.5):1; stats.lastKill=T;
    const base=100+(part==='head'&&!accident?60:0)+(p.hvt?250:0)+(dist>500?50:0)+(accident?150:0), pts=Math.round(base*stats.combo); stats.score+=pts;
    const tag=accident?'ACCIDENT ':(p.hvt?'HVT ':'')+(part==='head'?'HEADSHOT ':'');
    pops.push({w:sp,t:0,txt:`${tag}+${pts}`+(stats.combo>1?` · COMBO ×${stats.combo}`:'')+(accident?'':` · ${Math.round(dist)} m`),c:accident?'#3fb8ff':part==='head'?'#ffb22e':'#ebe6d8'});
    if(!accident) disturb(pt,'kill');
    try{ achKill(p,part,dist,accident); }catch(e){}
    if(M.endless){ const add=part==='head'&&!accident?9:6; timeLeft+=add; pops.push({w:V3().set(p.x,p.y+2.9,p.z),t:0,txt:`+${add}s`,c:'#38e1ff'}); if(hostilesLeft()===0&&!endInfo){ RUN.wave++; RUN.spawnT=1.6; } }
    else if(hostilesLeft()===0) win();
  } else {
    pops.push({w:sp,t:0,txt:p.vip?'VIP DOWN':'CIVILIAN',c:'#ff5442'}); disturb(pt,'kill'); fail(p.vip?(escort&&escort.lost?'The attackers got to the VIP.':'You shot the VIP.'):accident?'A civilian was caught in the accident.':'You hit a civilian.');
  }
}
function disturb(pt,kind){
  for(const p of people){
    if(!alive(p)) continue;
    const d=Math.hypot(p.x-pt.x,(p.y+1)-pt.y,p.z-pt.z);
    const sq=supOn();
    if(p.hostile){ if(d<(kind==='kill'?(sq?13:32):(sq?2.5:6))) alertP(p); }
    else if(d<(kind==='kill'?(sq?11:26):(sq?4:9))) panicP(p,pt);
  }
}
function alertP(p){
  if(!alive(p)||p.state==='alert') return;
  if(M&&M.fight&&p.hostile&&!p.sniper){ p.state='fight'; p.mesh.al.visible=true; if(stats) stats.alerted=true; p.fPhase='move'; p.goal=coverGoal(p); p.fT=0; return; }
  if(p.sniper||p.hunter||p.driver){ if(stats) stats.alerted=true; if(p.sniper&&p.snPhase==='scan') p.snT=Math.min(p.snT,1.5); if(p.driver&&getaway) getaway.boost=true; return; }
  p.state='alert'; p.escT=M?M.esc:5; p.mesh.al.visible=true; if(stats&&p.hostile) stats.alerted=true;
  p._fixGoal=true;
  if(p.door) p.goal={x:p.door.x,z:p.door.z};
  else if(p.type==='roof'){const R=p.rect; const opts=[{x:R.x0,z:p.z},{x:R.x1,z:p.z},{x:p.x,z:R.z0},{x:p.x,z:R.z1}]; p.goal=opts.reduce((a,o)=>Math.hypot(o.x-p.x,o.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?o:a);}
  else p.goal=goalFor(p,MR);
}
// close-quarters hostiles: dash to a new spot you can still see, stop, aim (red ring), fire, repeat
let fightCD=0; const FIGHT_AIM=2.8;
function coverGoal(p){ const R=p.rect; let best=null,bs=-1e9;
  for(let i=0;i<16;i++){ const a=MR()*TAU, L=rr(MR,5,14), g={x:clamp(p.x+Math.sin(a)*L,R.x0,R.x1),z:clamp(p.z+Math.cos(a)*L,R.z0,R.z1)};
    if(blockedAt(g.x,g.z,p.y,.5)||!pathClear(p.x,p.z,g.x,g.z,p.y)||!aimable(g.x,p.y,g.z)||!los(g.x,p.y+1.5,g.z)) continue;
    const sc=Math.hypot(g.x-p.x,g.z-p.z)+MR()*4; if(sc>bs){bs=sc; best=g;} }
  return best||{x:p.x,z:p.z}; }
function panicP(p,pt){
  if(!alive(p)||p.hostile||p.state==='panic') return;
  p.state='panic'; p.panicT=rr(MR,3.5,5.5); p.duckT=rr(MR,.45,.9);
  const dx=p.x-pt.x, dz=p.z-pt.z, d=Math.hypot(dx,dz)||1, R=p.rect;
  if(p.seg){const a=goalFor(p,MR), b=goalFor(p,MR); p.goal=Math.hypot(a.x-pt.x,a.z-pt.z)>Math.hypot(b.x-pt.x,b.z-pt.z)?a:b;}
  else p.goal=fleeGoal(p,pt,30);
}
function puff(pt,size,flesh){
  const n=flesh?5:7;
  for(let i=0;i<n;i++){
    const m=new THREE.SpriteMaterial({map:puffTex,color:flesh==='water'?0xf2f6ff:flesh?0xece6da:(city&&city.kind==='forest'?0x8a7458:0xbdb2a2),transparent:true,depthWrite:false,opacity:.85});
    const s=new THREE.Sprite(m); s.position.copy(pt); scene.add(s);
    fx.push({s,vx:(MR()-.5)*1.8,vy:MR()*1.6+.2,vz:(MR()-.5)*1.8,t:0,life:rr(MR,.6,1.1),sz:size*rr(MR,.6,1.3)});
  }
}

/* ---------- update ---------- */
function stepToward(p,g,speed,dt){
  const dx=g.x-p.x, dz=g.z-p.z, d=Math.hypot(dx,dz);
  if(d<.08){p.vx=p.vz=0; return true;}
  const s=Math.min(d,speed*dt), nx=p.x+dx/d*s, nz=p.z+dz/d*s;
  if(obst.length&&blockedAt(nx,nz,p.y,.3)&&!blockedAt(p.x,p.z,p.y,.3)){ p.vx=p.vz=0; p.goal={x:p.x,z:p.z}; return true; }
  p.x=nx; p.z=nz; p.vx=dx/d*speed; p.vz=dz/d*speed; p.heading=Math.atan2(dx,dz);
  return d<.2;
}
const T0={uLx:0,uLz:0,uRx:0,uRz:0,fLx:-.2,fLz:0,fRx:-.2,fRz:0,tL:0,tR:0,sL:0,sR:0,bx:0};
function poseT(p,moving,run,sw){
  const t=Object.assign({},T0), amp=run?.8:.5;
  if(moving){ t.tL=-sw*amp; t.tR=sw*amp; t.sL=Math.max(0,sw)*amp*1.4; t.sR=Math.max(0,-sw)*amp*1.4; t.uLx=sw*amp*.7; t.uRx=-sw*amp*.7; if(run){t.fLx=t.fRx=-1.3; t.bx=.14;} }
  else switch(p.pose){
    case 'phone': t.uRx=-.35; t.uRz=.35; t.fRx=-2.5; break;
    case 'smoke': {const c=p.ptime%5, up=c>3.4&&c<4.6?1:0; p.sk+=(up-p.sk)*.1; t.uRx=-.3-.35*p.sk; t.uRz=.15; t.fRx=-.5-1.95*p.sk; break;}
    case 'crossed': t.uLx=t.uRx=-.25; t.uLz=.2; t.uRz=-.2; t.fLx=t.fRx=-1.45; break;
    case 'hips': t.uLz=-.55; t.uRz=.55; t.fLz=1.7; t.fRz=-1.7; t.fLx=t.fRx=-.3; break;
    case 'lean': t.bx=.1; t.tR=-.2; t.sR=.45; t.uLx=-.2; t.fLx=-.6; break;
  }
  if(p.hostile&&!p.hvt){t.uRx=-.45; t.uRz=0; t.fRx=-1.1; t.uLx=-1.0; t.uLz=.4; t.fLx=-.45; t.fLz=0; t.fRz=0;}
  return t;
}
function updatePeople(dt){
  for(const p of people){
    if(p.state==='gone') continue;
    const m=p.mesh;
    if(p.driver){ p.ptime+=dt; m.root.position.set(p.x,p.y,p.z); m.root.rotation.y=p.heading;
      if(p.state==='dead'){ if(p.rig){pose(p.rig,'Spine',.55,0,.15); pose(p.rig,'Head',.4,0,.3); pose(p.rig,'LeftArm',.2,0,-1.3); pose(p.rig,'RightArm',.2,0,1.3);} } else if(p.rig&&m.body.visible) animChar(p,dt,false,false);
      continue; }
    if(p.glint){ const on=alive(p); let op=0; if(on){ op=p.snPhase==='aim'?.75+.25*Math.sin(T*16):Math.pow(Math.max(0,Math.sin(T*1.3+p.phase)),10)*.55; } p.glint.material.opacity=op; p.glint.visible=op>.02; }
    if(p.state==='dead'&&p.rig){ p.deadT+=dt; deathChar(p); continue; }
    if(p.state==='dead'){
      p.deadT+=dt; const t=p.deadT, sm=x=>{x=clamp(x,0,1); return x*x*(3-2*x);};
      const k1=sm(t/.3), k2=sm((t-.24)/.6), hs=p.hitPart==='head'?sm(t/.07)*(1-k1)*.35:0;
      m.thighL.rotation.x=-1.25*k1*(1-.55*k2); m.thighR.rotation.x=-1.15*k1*(1-.5*k2);
      m.shinL.rotation.x=2.0*k1*(1-.6*k2); m.shinR.rotation.x=1.9*k1*(1-.55*k2);
      m.body.position.y=-.5*k1*(1-k2*.86);
      m.body.rotation.x=p.fall*1.42*k2-hs; m.body.rotation.z=p.twist*k2;
      m.upL.rotation.x=m.upR.rotation.x=.3*k1+p.fall*.5*k2; m.upL.rotation.z=-.25*k1; m.upR.rotation.z=.25*k1; m.foL.rotation.x=m.foR.rotation.x=-.15; m.foL.rotation.z=m.foR.rotation.z=0;
      continue;
    }
    p.vx=p.vz=0; let moving=false, run=false;
    if(p.hearT&&T>=p.hearT){ p.hearT=0; if(alive(p)&&(p.state==='idle'||p.state==='walk')&&!p.hunter&&!p.sniper){ p.startT=rr(MR,1.2,2.6); p.lookY=rr(MR,-.9,.9); if(p.state==='walk'){p.state='idle'; p.wait=p.startT+rr(MR,.3,1.2);} } }
    if(p.startT>0) p.startT-=dt;
    if(p.sniper){
      p.heading=Math.atan2(EYE.x-p.x,EYE.z-p.z);
      if(state==='play'&&!endInfo){ p.snT-=dt; if(p.snPhase==='scan'&&p.snT<=0){p.snPhase='aim'; p.snT=SN_AIM;} else if(p.snPhase==='aim'&&p.snT<=0){ sniperFire(p); p.snPhase='scan'; p.snT=rr(MR,7,10);} }
    } else if(p.hunter){
      const v=escort&&escort.vip;
      if(v&&alive(v)){ const d=Math.hypot(v.x-p.x,v.z-p.z); if(d>2.3){ if(!stepToward(p,{x:v.x,z:v.z},2.5,dt)){moving=true;} } else { p.heading=Math.atan2(v.x-p.x,v.z-p.z); p.atk=(p.atk||0)+dt; if(p.atk>1.3&&state==='play'&&!endInfo){ escort.lost=true; kill(v,'body',V3().set(v.x,v.y+1,v.z),0,null,true); } } }
    } else if(p.state==='fight'){
      if(p.fPhase==='move'){ if(!stepToward(p,p.goal,4.6,dt)){moving=true; run=true;} else { p.fPhase='hold'; p.fT=rr(MR,.4,1.2); } }
      else if(p.fPhase==='hold'){ p.heading=Math.atan2(EYE.x-p.x,EYE.z-p.z); p.fT-=dt;
        if(p.fT<=0){ if(fightCD<=0&&!people.some(q=>q.gunner&&alive(q))&&state==='play'&&!endInfo){ p.fPhase='aim'; p.gunner=true; p.snPhase='aim'; p.snT=FIGHT_AIM; p.aimDur=FIGHT_AIM; } else { p.fPhase='move'; p.goal=coverGoal(p); } } }
      else if(p.fPhase==='aim'){ p.heading=Math.atan2(EYE.x-p.x,EYE.z-p.z); if(state==='play'&&!endInfo){ p.snT-=dt; if(p.snT<=0){ p.gunner=false; p.snPhase=''; sniperFire(p); fightCD=rr(MR,2.6,4); p.fPhase='move'; p.goal=coverGoal(p); } } }
    } else if(p.state==='alert'){
      if(p._fixGoal){p._fixGoal=false; if(p.goal&&!pathClear(p.x,p.z,p.goal.x,p.goal.z,p.y)) p.goal=fleeGoal(p,{x:EYE.x,z:EYE.z},25);}
      p.escT-=dt; if(!stepToward(p,p.goal,4.2,dt)) {moving=true; run=true;}
      if(p.escT<=0){p.state='gone'; scene.remove(m.root); rebuildHits(); if(state==='play'||state==='killcam') fail(p.hvt?'The high-value target escaped.':'A hostile escaped.'); continue;}
    } else if(p.state==='panic'){
      if(p.duckT>0) p.duckT-=dt; else { p.panicT-=dt; if(!stepToward(p,p.goal,4,dt)){moving=true; run=true;} }
      if(p.panicT<=0){p.state='idle'; p.wait=rr(MR,1,3);}
    } else {
      p.wait-=dt;
      if(p.state==='walk'){ if(stepToward(p,p.goal,p.ws||1.3,dt)){p.state='idle'; p.wait=rr(MR,1,3.5);} else moving=true; }
      else if(p.wait<=0){ if(p.moving){p.goal=goalFor(p,MR); p.state='walk';} else if(p.pal&&alive(p.pal)&&p.pal.state==='idle'){ p.heading=Math.atan2(p.pal.x-p.x,p.pal.z-p.z); p.wait=rr(MR,2,5); } else {p.heading+=rr(MR,-1.6,1.6); p.wait=rr(MR,2,5);} }
    }
    if(moving) p.phase+=dt*(run?11:6.5*(p.ws||1.3)/1.3/(p.stride||1));
    p.ptime+=dt;
    if(p.ground&&moving) p.y=city.gY(p.x,p.z);
    if(p.rig){ if(m.body.visible) animChar(p,dt,moving,run); m.root.position.set(p.x,p.y+(moving?Math.abs(Math.cos(p.phase))*.03:0)-(p.duckT>0?.42:0),p.z); let dh2=p.heading-m.root.rotation.y; dh2=Math.atan2(Math.sin(dh2),Math.cos(dh2)); m.root.rotation.y+=dh2*Math.min(1,dt*8); continue; }
    const t=poseT(p,moving,run,moving?Math.sin(p.phase):0), k=Math.min(1,dt*(moving?20:5));
    const L=(o,a,v)=>{o[a]+=(v-o[a])*k;};
    L(m.thighL.rotation,'x',t.tL); L(m.thighR.rotation,'x',t.tR); L(m.shinL.rotation,'x',t.sL); L(m.shinR.rotation,'x',t.sR);
    L(m.upL.rotation,'x',t.uLx); L(m.upL.rotation,'z',t.uLz); L(m.upR.rotation,'x',t.uRx); L(m.upR.rotation,'z',t.uRz);
    L(m.foL.rotation,'x',t.fLx); L(m.foL.rotation,'z',t.fLz); L(m.foR.rotation,'x',t.fRx); L(m.foR.rotation,'z',t.fRz);
    L(m.body.rotation,'x',t.bx);
    m.root.position.set(p.x,p.y+(moving?Math.abs(Math.cos(p.phase))*.035:0),p.z);
    let dh=p.heading-m.root.rotation.y; dh=Math.atan2(Math.sin(dh),Math.cos(dh)); m.root.rotation.y+=dh*Math.min(1,dt*8);
  }
}
function updateCars(dt){
  for(const c of cars){
    c.s+=c.L.dir*c.v*dt;
    if(c.L.ax==='z'){ if(c.s>-170) c.s=-1300; if(c.s<-1300) c.s=-170; c.g.position.set(c.L.c,0,c.s); }
    else { if(c.s>900) c.s=-900; if(c.s<-900) c.s=900; c.g.position.set(c.s,0,c.L.c); }
  }
}
function updateFlags(){
  const k=Math.min(1,Math.abs(wind)/7);
  for(const f of flags){
    f.piv.rotation.y=wind>=0?0:Math.PI;
    f.cloth.rotation.z=-(1-k)*1.15-.05;
    const a=f.cloth.geometry.attributes.position, b=f.base;
    for(let i=0;i<a.count;i++){const x=b[i*3]; a.array[i*3+2]=Math.sin(x*2.6-T*(5+8*k)+f.ph)*.14*(x/2.4)*(.35+k);}
    a.needsUpdate=true;
  }
}
function update(dt,rdt){
  T+=dt;
  if(state==='play'&&!endInfo){timeLeft-=dt; if(timeLeft<=0){timeLeft=0; fail(M.endless?'The clock ran out.':'Out of time.');}}
  wind=windBase*(1+.15*Math.sin(T*.37)+.06*Math.sin(T*1.3));
  cooldown-=dt;
  if(reloadT>0){reloadT-=dt; if(reloadT<=0){reloadT=0; ammo=magSize; snd.click();}}
  const dur=3+save.up.stab;
  if(holding&&scoped&&breathOut<=0){breath-=dt/dur; if(breath<=0){breath=0; holding=false; breathOut=1.6;}}
  else breath=Math.min(1,breath+dt*.3);
  breathOut=Math.max(0,breathOut-dt);
  kick=Math.max(0,kick-dt*3); flash=Math.max(0,flash-rdt*6); blink=Math.max(0,blink-rdt*6); hurt=Math.max(0,hurt-rdt*.8);
  if(escort&&escort.pending>0&&state==='play'&&!endInfo){escort.t-=dt; if(escort.t<=0){ if(spawnHunter()){escort.pending--; escort.t=rr(MR,8,12);} else escort.t=.6; }}
  if(getaway) updateGetaway(dt);
  if(fightCD>0) fightCD-=dt;
  if(M&&M.range) rangeUpdate(dt);
  if(city&&city.tick) city.tick(dt);
  featTick(dt); spotTick(dt); distractTick(dt);
  if(M&&M.endless&&RUN.spawnT>0&&state==='play'&&!endInfo){ RUN.spawnT-=dt; if(RUN.spawnT<=0) spawnWave(); }
  stepBullets(dt);
  updatePeople(dt); updateHazards(dt); updateCars(dt); updateFlags(); updateAmbient(dt); updateFx(dt);
  for(let i=pops.length-1;i>=0;i--){pops[i].t+=rdt; if(pops[i].t>1.8) pops.splice(i,1);}
  if(state==='killcam'&&kc){kc.t+=rdt; if(kc.phase===1&&kc.t>1.7){state='play'; kc=null; bulletObj.visible=false; if(endInfo&&endInfo.ok) endT=.4;}}
  if(endInfo&&state==='play'){endT-=rdt; if(endT<=0) finish();}
}
function updateAmbient(dt){
  for(const c of clouds){c.position.x+=(2+wind*1.5)*dt; if(c.position.x>2800) c.position.x=-2800; if(c.position.x<-2800) c.position.x=2800;}
  for(const t of waterTex){t.offset.x+=dt*.004; t.offset.y+=dt*.0025;}
  for(const v of tvs){v.ph+=dt; const n=.5+.3*Math.sin(v.ph*7.3)+.2*Math.sin(v.ph*17.1+1)+(Math.sin(v.ph*.9)>.85?.3:0); v.m.material.color.setHSL(v.hue,.55,clamp(.22+.38*n,.1,.75));}
  for(const f of fogs){f.s.position.x+=(f.v+wind*.8)*dt; if(f.s.position.x>950) f.s.position.x=-950; if(f.s.position.x<-950) f.s.position.x=950;}
  for(const v of vents){v.t-=dt; if(v.t<=0){v.t=rr(MR,.6,.9); const q=steam.find(x=>!x.on); if(q){q.on=true; q.t=0; q.life=rr(MR,2.6,3.4); q.vx=wind*.35; q.vy=rr(MR,.6,1); q.sz=v.big?rr(MR,1.2,1.8):rr(MR,.6,.9); q.s.position.set(v.x+rr(MR,-.3,.3),v.y,v.z+rr(MR,-.3,.3)); q.s.visible=true;}}}
  for(const q of steam){ if(!q.on) continue; q.t+=dt; const k=q.t/q.life; if(k>=1){q.on=false; q.s.visible=false; continue;} q.s.position.x+=q.vx*dt; q.s.position.y+=q.vy*dt; const sc=q.sz*(1+k*2.6); q.s.scale.set(sc,sc,1); q.s.material.opacity=.3*(1-k);}
}
function updateFx(dt){
  for(let i=fx.length-1;i>=0;i--){const f=fx[i]; f.t+=dt; const k=f.t/f.life; f.s.position.x+=f.vx*dt; f.s.position.y+=f.vy*dt; f.s.position.z+=f.vz*dt; const s=f.sz*(1+k*(f.g||2.5)); f.s.scale.set(s,s,1); f.s.material.opacity=(f.op||.85)*(1-k); if(k>=1){scene.remove(f.s); f.s.material.dispose(); fx.splice(i,1);}}
}

/* ---------- camera ---------- */
function sizeMarks(){
  const k=2*Math.tan(camera.fov*Math.PI/360)*(Math.min(W,H)<500?.042:.032), bob=Math.sin(performance.now()/260)*.12;
  for(const g of glints){const q=k*(.55+(g.material.opacity||0)*.6); g.scale.set(q,q,1);}
  for(let i=marks.length-1;i>=0;i--){const s=marks[i]; if(!s.parent||!s.parent.parent){marks.splice(i,1); continue;} s.scale.set(k*(s.material===markMat?.8:1),k,1); if(s.material===markMat) s.center.y=-.15-bob;}
}
let menuT=0;
function updateCamera(rdt){
  if(state==='killcam'&&kc){
    rifle.visible=false;
    const p=kc.p;
    if(kc.phase===0){
      const b=kc.b, dir=b.vel.clone().normalize(), up=V3().set(0,1,0), right=dir.clone().cross(up).normalize();
      camera.position.copy(b.pos).addScaledVector(dir,-1.1).addScaledVector(up,.12).addScaledVector(right,.16);
      camera.fov=48; camera.updateProjectionMatrix(); camera.lookAt(b.pos.clone().addScaledVector(dir,4));
      bulletObj.position.copy(b.pos); bulletObj.lookAt(b.pos.clone().add(dir));
    } else {
      bulletObj.visible=false; kc.orbit+=rdt*.45;
      camera.position.set(p.x+Math.sin(kc.orbit)*4.2,p.y+1.6,p.z+Math.cos(kc.orbit)*4.2);
      camera.fov=45; camera.updateProjectionMatrix(); camera.lookAt(p.x,p.y+.6,p.z);
    }
    updateLod(); applyThermal(); updateShadow();
    return;
  }
  camera.position.copy(EYE);
  let tf=BASE_FOV;
  if(state==='play'&&scoped) tf=SCOPE_REF/zoom;
  fov=Math.exp(Math.log(fov)+(Math.log(tf)-Math.log(fov))*Math.min(1,rdt*14));
  camera.fov=fov; camera.updateProjectionMatrix();
  let y=yaw,pt=pitch;
  if(state==='play'||state==='paused'){const s=swayRad(); y+=s[0]; pt+=s[1]+kick*kick*.004*(scoped?1:4);}
  else {menuT+=rdt; y=Math.sin(menuT*.06)*.55; pt=-.06;}
  camera.rotation.set(pt,y,0);
  rifle.visible=(state==='play'||state==='paused')&&fov>30;
  sizeMarks();
  updateLod(); applyThermal(); updateShadow();
  {const u=rifle.userData, b=BOLT, bp=cooldown>0?1-cooldown/b:1, seg=(a,c)=>sm((bp-a)/(c-a));
   let lift=seg(.12,.28)-seg(.74,.88), pull=seg(.3,.48)-seg(.52,.7);
   if(gun().auto){lift*=0;}
   u.bolt.rotation.z=lift*1.15; u.bolt.position.z=.1+pull*.075;
   let tilt=0, drop=0, magY=-.058, magV=true;
   if(reloadT>0){const rp=1-reloadT/RELOAD[save.up.mag]; tilt=Math.sin(Math.PI*rp)*.45; drop=Math.sin(Math.PI*rp)*.05; if(rp<.45){magY=-.058-sm(rp/.3)*.25; magV=rp<.3;} else {magY=-.058-(1-sm((rp-.5)/.3))*.25; magV=rp>.5;}}
   u.mag.position.y=magY; u.mag.visible=magV;
   const br=Math.sin(T*1.6)*.0025;
   rifle.position.set(.17,-.2-drop+br,-.5+kick*.08); rifle.rotation.set(.02+kick*.12,.07,tilt);
   u.flash.visible=flash>.75&&!supOn(); u.flash.material.rotation=MR()*TAU;}
}

