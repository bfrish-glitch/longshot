/* Longshot 3D · ui.js · overlay, HUD, input, menu, loop, boot */
'use strict';
/* ---------- overlay ---------- */
function pxPerMil(){return (H/2)/Math.tan(camera.fov*Math.PI/360)*.001;}
function scopeR(){return Math.min(W,H)*.47;}
let rfPerson=null, hintMsg='', hintT=0;
function rangefind(){
  camera.updateMatrixWorld(); const fwd=V3().set(0,0,-1).applyQuaternion(camera.quaternion);
  RC.set(EYE,fwd); RC.near=0; RC.far=3000; const h=RC.intersectObjects(hitList,false)[0];
  rfPerson=h&&h.object.userData&&h.object.userData.p&&alive(h.object.userData.p)?h.object.userData.p:null;
  let d=h?h.distance:0; const tg=terrainRange(EYE,fwd,2500); if(tg&&(!d||tg<d)) d=tg;
  return Math.round(d);
}
const _pv=V3();
const drops=Array.from({length:150},()=>({x:Math.random(),y:Math.random(),l:.4+Math.random()*.6,v:.9+Math.random()*.6}));
function drawSnow(dt){ // big slow flakes near the lens, drifting with the wind
  const c=octx, sl=wind*.06; c.fillStyle='rgba(245,248,252,.75)'; c.beginPath();
  for(const d of drops){ d.y+=d.v*dt*.16; d.x+=(sl+Math.sin(T*1.3+d.l*9)*.02)*dt; if(d.y>1.05){d.y=-.05; d.x=Math.random();} if(d.x>1) d.x-=1; if(d.x<0) d.x+=1; const x=d.x*W, y=d.y*H, R=1+d.l*2.2; c.moveTo(x+R,y); c.arc(x,y,R,0,TAU); }
  c.fill(); }
function drawRain(dt){
  const c=octx, sl=wind*.035; c.strokeStyle='rgba(190,205,230,.32)'; c.lineWidth=1.1; c.beginPath();
  for(const d of drops){d.y+=d.v*dt*1.6; d.x+=sl*d.v*dt*1.6; if(d.y>1.05){d.y=-.05; d.x=Math.random();} if(d.x>1) d.x-=1; if(d.x<0) d.x+=1;
    const x=d.x*W, y=d.y*H, L=d.l*H*.07; c.moveTo(x,y); c.lineTo(x+sl*L*1.4,y+L);}
  c.stroke();
}
function drawGlare(cx,cy,R){
  if(!city||city.P.em===1) return;
  _pv.copy(city.sunDir).multiplyScalar(1500).add(EYE).project(camera); if(_pv.z>1) return;
  const sx=(_pv.x*.5+.5)*W, sy=(-_pv.y*.5+.5)*H, dd=Math.hypot(sx-cx,sy-cy); if(!isFinite(dd)||!(R>0)||dd>R*1.6) return;
  const c=octx, s=1-Math.min(1,dd/(R*1.6));
  c.save(); c.beginPath(); c.arc(cx,cy,R,0,TAU); c.clip(); c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(sx,sy,0,sx,sy,R*.9); g.addColorStop(0,`rgba(255,235,200,${.55*s})`); g.addColorStop(1,'rgba(255,235,200,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(const [t,r0,col] of [[.55,.08,'120,200,255'],[1.25,.05,'255,170,90'],[1.6,.13,'160,255,180']]){const gx=sx+(cx-sx)*t, gy=sy+(cy-sy)*t; c.fillStyle=`rgba(${col},${.16*s})`; c.beginPath(); c.arc(gx,gy,R*r0,0,TAU); c.fill();}
  c.restore();
}
function drawOverlay(dt){
  const c=octx; c.setTransform(ODPR,0,0,ODPR,0,0); c.clearRect(0,0,W,H);
  if(rainOn&&(state==='play'||state==='killcam'||state==='brief')) drawRain(dt||.016);
  else if(city&&city.snow&&(state==='play'||state==='brief')) drawSnow(dt||.016);
  for(const p of pops){
    _pv.copy(p.w).project(camera); if(_pv.z>1) continue;
    const sx=(_pv.x*.5+.5)*W, sy=(-_pv.y*.5+.5)*H-p.t*30, a=Math.max(0,Math.min(1,2.4-p.t*1.4));
    c.globalAlpha=a; c.font='600 20px "Barlow Condensed",sans-serif'; c.textAlign='center';
    c.fillStyle='rgba(0,0,0,.65)'; c.fillText(p.txt,sx+1,sy+1); c.fillStyle=p.c; c.fillText(p.txt,sx,sy); c.globalAlpha=1;
  }
  if(state==='killcam') drawKC();
  else if(state==='play'){ if(scoped&&fov<BASE_FOV*.7) drawScope(); else drawHip(); drawSniperWarn(); }
  if(hurt>0){const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7); g.addColorStop(0,'rgba(200,0,0,0)'); g.addColorStop(1,`rgba(200,0,0,${hurt*.6})`); c.fillStyle=g; c.fillRect(0,0,W,H);}
  if(flash>0){c.fillStyle=`rgba(255,240,210,${flash*.25})`; c.fillRect(0,0,W,H);}
  if(blink>0){c.fillStyle=`rgba(0,0,0,${blink})`; c.fillRect(0,0,W,H);}
}
function drawSniperWarn(){
  const c=octx, cx=W/2, cy=H/2;
  for(const p of people){ if(!(p.sniper||p.gunner)||!alive(p)||p.snPhase!=='aim') continue;
    const k=clamp(1-p.snT/(p.aimDur||SN_AIM),0,1), R=Math.min(W,H)*(.62-.46*k);
    _pv.set(p.x,p.y+1.5,p.z).project(camera); let ang=Math.atan2(-_pv.y,_pv.x); if(_pv.z>1) ang+=Math.PI;
    c.save(); c.strokeStyle=`rgba(255,60,40,${.45+.45*k})`; c.lineWidth=3; c.setLineDash([10,8]); c.beginPath(); c.arc(cx,cy,R,0,TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle='#ff3b2f'; c.translate(cx+Math.cos(ang)*R,cy+Math.sin(ang)*R); c.rotate(ang); c.beginPath(); c.moveTo(14,0); c.lineTo(-6,-10); c.lineTo(-6,10); c.closePath(); c.fill(); c.restore();
    c.font='600 15px "Share Tech Mono",monospace'; c.textAlign='center'; c.fillStyle=`rgba(255,80,60,${.6+.4*Math.sin(T*12)})`; c.fillText(p.gunner?'HOSTILE AIMING':'SNIPER AIMING',cx,Math.min(cy+R+22,H*.62));
  }
}
function drawHip(){
  const c=octx,cx=W/2,cy=H/2;
  c.strokeStyle='rgba(255,178,46,.95)'; c.lineWidth=2; c.beginPath();
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){c.moveTo(cx+dx*8,cy+dy*8); c.lineTo(cx+dx*20,cy+dy*20);} c.stroke();
  c.beginPath(); c.arc(cx,cy,30,0,TAU); c.strokeStyle='rgba(255,178,46,.35)'; c.lineWidth=1; c.stroke();
}
function drawScope(){
  const c=octx,cx=W/2,cy=H/2,R=scopeR();
  c.fillStyle='#030403'; c.beginPath(); c.rect(0,0,W,H); c.arc(cx,cy,R,0,TAU); c.fill('evenodd');
  const g=c.createRadialGradient(cx,cy,R*.72,cx,cy,R); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.8,'rgba(0,0,0,.25)'); g.addColorStop(1,'rgba(0,0,0,.96)');
  c.fillStyle=g; c.beginPath(); c.arc(cx,cy,R,0,TAU); c.fill();
  const lg=c.createLinearGradient(cx-R,cy-R,cx+R*.2,cy+R*.2); lg.addColorStop(0,'rgba(170,200,255,.07)'); lg.addColorStop(.5,'rgba(255,255,255,0)'); c.fillStyle=lg; c.beginPath(); c.arc(cx,cy,R,0,TAU); c.fill();
  drawGlare(cx,cy,R);
  c.strokeStyle='rgba(255,255,255,.13)'; c.lineWidth=3; c.beginPath(); c.arc(cx,cy,R*.95,Math.PI*1.08,Math.PI*1.38); c.stroke();
  c.strokeStyle='#1d221f'; c.lineWidth=6; c.beginPath(); c.arc(cx,cy,R+3,0,TAU); c.stroke();
  const ms=pxPerMil(), inner=Math.min(ms*5.5,R*.8);
  c.strokeStyle='rgba(6,6,6,.9)'; c.lineWidth=5; c.beginPath();
  c.moveTo(cx-R,cy); c.lineTo(cx-inner,cy); c.moveTo(cx+inner,cy); c.lineTo(cx+R,cy); c.moveTo(cx,cy+inner); c.lineTo(cx,cy+R); c.stroke();
  c.lineWidth=1.3; c.beginPath(); c.moveTo(cx-inner,cy); c.lineTo(cx+inner,cy); c.moveTo(cx,cy-R); c.lineTo(cx,cy+inner); c.stroke();
  c.fillStyle='#ffb22e';
  if(ms>=4) for(let i=1;i<=5;i++){const o=i*ms; if(o>inner) break; if(ms<9&&i%2) continue; for(const [dx,dy] of [[o,0],[-o,0],[0,o]]){c.beginPath(); c.arc(cx+dx,cy+dy,i%2===0?2.6:1.8,0,TAU); c.fill();}}
  if(ms>12){c.font='11px "Share Tech Mono",monospace'; c.textAlign='center'; c.fillStyle='rgba(255,178,46,.85)'; for(const i of [2,4]){if(i*ms>inner) continue; c.fillText(i,cx-i*ms,cy-8); c.fillText(i,cx+i*ms,cy-8); c.textAlign='left'; c.fillText(i,cx+7,cy+i*ms+4); c.textAlign='center';}}
  c.beginPath(); c.arc(cx,cy,1.6,0,TAU); c.fillStyle='#ff5442'; c.fill();
  if(++rfTick%3===0){rangeNow=rangefind(); if(rangeNow) lastRange=rangeNow;}
  drawSpot(c,cx,cy);
  const ry=cy+R*.48; c.font='14px "Share Tech Mono",monospace'; c.textAlign='center';
  const lines=[(rangeNow?`RNG ${rangeNow} m`:lastRange?`RNG ${lastRange} m (last)`:'RNG ---')+(DIAL!==ZERO?` · DIAL ${DIAL}`:'')];
  if(save.opts.hold&&lastRange&&!(M&&M.range&&RG&&RG.drill==='wind')){const h=holdFor(lastRange); const u=Math.abs(h.up)<.05?'':`${Math.abs(h.up).toFixed(1)} ${h.up>0?'UP':'DOWN'}`, s=Math.abs(h.side)<.05?'':`${Math.abs(h.side).toFixed(1)} ${h.side>0?'LEFT':'RIGHT'}`; lines.push('HOLD '+([u,s].filter(Boolean).join(' · ')||'CENTER')); if(Math.abs(h.up)>4.5) lines.push('TAP DIAL FOR '+Math.round(lastRange/25)*25+' m');
    if(rfPerson&&Math.hypot(rfPerson.vx,rfPerson.vz)>.6){ const right=V3().set(1,0,0).applyQuaternion(camera.quaternion), lat=rfPerson.vx*right.x+rfPerson.vz*right.z, mil=Math.abs(lat)*tofAt(lastRange)/lastRange*1000; if(mil>.15) lines.push(`LEAD ${mil.toFixed(1)} ${lat>0?'RIGHT':'LEFT'}`); }}
  lines.push(`${zoom.toFixed(zoom<10?1:0).replace('.0','')}x`);
  const tw=Math.max(...lines.map(l=>c.measureText(l).width))+18;
  c.fillStyle='rgba(0,0,0,.55)'; c.fillRect(cx-tw/2,ry-16,tw,lines.length*18+6);
  lines.forEach((l,i)=>{c.fillStyle=i===0&&!rangeNow?'rgba(255,178,46,.6)':'#ffb22e'; c.fillText(l,cx,ry+i*18);});
  const bw=Math.min(140,R*.6), by=cy+R*.84;
  c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(cx-bw/2,by,bw,4);
  c.fillStyle=breathOut>0?'#ff5442':holding?'#86d39a':'rgba(235,230,216,.7)'; c.fillRect(cx-bw/2,by,bw*breath,4);
  if(cooldown>0||reloadT>0){c.font='12px "Share Tech Mono",monospace'; c.fillStyle='rgba(235,230,216,.7)'; c.fillText(reloadT>0?'RELOADING':'CHAMBERING',cx,cy-R*.62);}
}
function drawKC(){
  const c=octx, bar=H*.1; c.fillStyle='#000'; c.fillRect(0,0,W,bar); c.fillRect(0,H-bar,W,bar);
  c.font='600 15px "Share Tech Mono",monospace'; c.textAlign='left'; c.fillStyle='#ffb22e'; c.fillText('● BULLET CAM',16,bar/2+5);
  c.textAlign='right'; c.fillStyle='#ebe6d8'; c.fillText(`${Math.round(kc.p.d)} m`,W-16,bar/2+5);
}

/* ---------- HUD ---------- */
const el={hpw:$('#cHpW'),hp:$('#cHp'),score:$('#cScore'),obj:$('#cObj'),time:$('#cTime'),tw:$('#cTimeWrap'),wind:$('#cWind'),ammo:$('#cAmmo'),fire:$('#bFire'),scope:$('#bScope'),breath:$('#bBreath'),therm:$('#bTherm'),zs:$('#bZstep'),dial:$('#bDial'),zt:$('#zoomTrack'),zk:$('#zoomKnob'),alert:$('#alertBar'),hint:$('#hint'),name:$('#cName')};
function setT(e,v){if(e._v!==v){e._v=v; e.textContent=v;}}
function hudSetup(){setT(el.name,M.range?'RANGE · '+DRILLS[RUN.drill||'free'].n.toUpperCase():M.endless?`ENDLESS · WAVE ${RUN.wave}`:M.daily?M.n.toUpperCase():(M.vet?'VET ':'')+'C-'+String(mi+1).padStart(2,'0')+' · '+M.n.toUpperCase()); el.scope.classList.toggle('on',scoped); el.scope.textContent=scoped?'EXIT':'SCOPE';}
function hud(){
  if(!stats) return;
  $('#hud').hidden=state==='killcam';
  el.hpw.hidden=!(M.sn||M.fight); el.hpw.classList.toggle('warn',playerHp<2); {const mx=M.hp||2, hp=clamp(playerHp,0,mx); setT(el.hp,'●'.repeat(hp)+'○'.repeat(mx-hp));}
  setT(el.obj,`${stats.kills}/${totalHos}`); setT(el.score,stats.score.toLocaleString()+(stats.combo>1&&T-stats.lastKill<5?` ×${stats.combo}`:''));
  setT(el.time,fmt(timeLeft)); el.tw.classList.toggle('warn',timeLeft<20);
  setT(el.wind,Math.abs(wind)<.05?'CALM':`${Math.abs(wind).toFixed(1)} m/s ${wind>0?'→':'←'}`);
  if(M.range){ setT(el.obj,rangeObj()); setT(el.time,rangeTimeText()); el.tw.classList.toggle('warn',!!(RG&&RG.drill==='speed'&&RG.clock<8)); }
  setT(el.ammo,reloadT>0?'···':`${ammo}/${magSize}`);
  el.fire.classList.toggle('cool',cooldown>0||reloadT>0);
  el.breath.hidden=!scoped; el.zt.hidden=!scoped; el.therm.hidden=!scoped; el.zs.hidden=!scoped; el.dial.hidden=!scoped; el.dial.classList.toggle('on',DIAL!==ZERO); if(el.dial._d!==DIAL){ el.dial._d=DIAL; el.dial.innerHTML='DIAL<br>'+DIAL; } el.therm.classList.toggle('on',thermOn); setT(el.zs,Math.round(zoom)+'x'); el.breath.classList.toggle('on',holding);
  const mz=maxZoom(), k=(zoom-MIN_ZOOM)/(mz-MIN_ZOOM||1), th=el.zt.clientHeight||170;
  el.zk.style.top=((1-k)*(th-40)+3)+'px'; setT(el.zk,Math.round(zoom)+'x');
  const fl=people.filter(p=>p.hostile&&p.state==='alert');
  if(fl.length&&!endInfo){el.alert.hidden=false; setT(el.alert,`HOSTILE FLEEING · ${Math.max(0,Math.min(...fl.map(p=>p.escT))).toFixed(1)}s`);} else el.alert.hidden=true;
  let hint='';
  if(M.range){ if(RG&&RG.shots===0&&!endInfo) hint=scoped?(RG.drill==='free'?'Pick any plate. Range it, then use HOLD or tap DIAL.':RG.drill==='wind'?'No HOLD readout: judge the wind from the flags.':'Your plate has the orange dot. Range it, then HOLD or DIAL.'):'Tap SCOPE. Plates every 100 m, signs show the distance.'; }
  else if(mi===0&&stats.kills===0&&!endInfo) hint=scoped?'Drag to aim. Black jacket, red armband, rifle. Tap FIRE.':'Tap SCOPE to look through the optic.';
  else if(mi===2&&stats.shots===0&&scoped) hint='Wind! Read HOLD under the crosshair, or watch the rooftop flags.';
  else if(mi===4&&stats.shots===0&&scoped) hint='Long range. HOLD UP means aim that many dots above the target.';
  if(hintT>0){hintT-=1/60; hint=hintMsg;}
  el.hint.hidden=!hint; setT(el.hint,hint);
}

/* ---------- input ---------- */
let dragId=null,lx=0,ly=0;
ov.addEventListener('pointerdown',e=>{unlockAudio(); if(state==='killcam'&&kc){ if(kc.phase===0) kc.ts=Math.max(kc.ts,.6); else kc.t=99; return; } if(state!=='play'||dragId!==null) return; dragId=e.pointerId; lx=e.clientX; ly=e.clientY; try{ov.setPointerCapture(e.pointerId);}catch(_){}});
ov.addEventListener('pointermove',e=>{
  if(e.pointerId!==dragId||state!=='play') return;
  const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
  const zd=scoped?clamp(1-(zoom-MIN_ZOOM)/Math.max(1,maxZoom()-MIN_ZOOM)*.35,.6,1):1;
  const rpp=(camera.fov*Math.PI/180)/H*(save.opts.inv?-1:1)*(scoped?.9:1.1)*(save.opts.sens||1)*zd;
  yaw=clamp(yaw-dx*rpp,-YAW_LIM,YAW_LIM); pitch=clamp(pitch-dy*rpp,PITCH_MIN,PITCH_MAX);
});
const endDrag=e=>{if(e.pointerId===dragId) dragId=null;};
ov.addEventListener('pointerup',endDrag); ov.addEventListener('pointercancel',endDrag);
ov.addEventListener('contextmenu',e=>{e.preventDefault(); if(state==='play') toggleScope();});
ov.addEventListener('wheel',e=>{if(state!=='play'||!scoped) return; e.preventDefault(); zoom=clamp(zoom*(e.deltaY<0?1.12:1/1.12),MIN_ZOOM,maxZoom());},{passive:false});
function toggleScope(){if(state!=='play') return; scoped=!scoped; blink=.85; el.scope.classList.toggle('on',scoped); el.scope.textContent=scoped?'EXIT':'SCOPE'; if(!scoped) holding=false; snd.click();}
const press=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault(); unlockAudio(); fn(e);});
press('#bScope',toggleScope); press('#bReload',doReload);
press('#bTherm',()=>{thermOn=!thermOn; snd.click();});
press('#bDial',()=>{ const R=lastRange?clamp(Math.round(lastRange/25)*25,100,1200):ZERO; setDial(Math.abs(R-DIAL)<13&&DIAL!==ZERO?ZERO:R); snd.click(); });
press('#bZstep',()=>{const lv=[...new Set([MIN_ZOOM,8,Math.round((8+maxZoom())/2),maxZoom()])].filter(v=>v<=maxZoom()).sort((a,b)=>a-b); zoom=lv.find(v=>v>zoom+.5)||lv[0]; snd.click();});
const downPtrs=new Set(); for(const ev of ['pointerdown','pointerup','pointercancel']) document.addEventListener(ev,e=>{ if(ev==='pointerdown') downPtrs.add(e.pointerId); else downPtrs.delete(e.pointerId); },true);
{const bf=$('#fireWrap'); let armed=null, tapId=null, pend=0; // the real tap lands on a hidden iOS switch over the button, which gives iPhones a haptic tick
 bf.addEventListener('pointerdown',e=>{unlockAudio();
  if(iosTick()){ if(downPtrs.size>1){ fire(); return; } tapId=e.pointerId; return; } // another finger down (breath, aiming): iOS won't flip the switch, so shoot now
  if(save.opts.fireUp){armed=e.pointerId; try{bf.setPointerCapture(e.pointerId);}catch(_){}} else fire();});
 const inside=e=>{const r=bf.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;};
 bf.addEventListener('pointerup',e=>{
  if(tapId===e.pointerId){ tapId=null; if(!inside(e)) return; const my=++pend; setTimeout(()=>{ if(pend===my){ pend=0; fire(); } },90); return; } // fallback if the click never comes
  if(armed!==e.pointerId) return; armed=null; if(inside(e)) fire();});
 bf.addEventListener('pointercancel',()=>{armed=null; tapId=null;});
 window.__fireTap=()=>{ if(pend){ pend=0; fire(); } };}
const bb=$('#bBreath');
bb.addEventListener('pointerdown',e=>{e.preventDefault(); if(breathOut<=0&&breath>.05) holding=true; try{bb.setPointerCapture(e.pointerId);}catch(_){}});
for(const ev of ['pointerup','pointercancel','lostpointercapture']) bb.addEventListener(ev,()=>{holding=false;});
let zId=null;
function zoomFrom(e){const r=el.zt.getBoundingClientRect(); const k=1-clamp((e.clientY-r.top-20)/(r.height-40),0,1); zoom=MIN_ZOOM+k*(maxZoom()-MIN_ZOOM);}
el.zt.addEventListener('pointerdown',e=>{e.preventDefault(); zId=e.pointerId; try{el.zt.setPointerCapture(e.pointerId);}catch(_){} zoomFrom(e);});
el.zt.addEventListener('pointermove',e=>{if(e.pointerId===zId) zoomFrom(e);});
el.zt.addEventListener('pointerup',()=>zId=null); el.zt.addEventListener('pointercancel',()=>zId=null);
addEventListener('keydown',e=>{
  if(state!=='play'){if(e.key==='Escape'&&state==='paused') resume(); return;}
  if(e.code==='Space'){e.preventDefault(); if(!e.repeat) fire();}
  else if(e.key==='Shift'){if(breathOut<=0&&scoped) holding=true;}
  else if('eEqQ'.includes(e.key)) toggleScope();
  else if(e.key==='r'||e.key==='R') doReload();
  else if(e.key==='t'||e.key==='T') thermOn=!thermOn;
  else if(e.key==='Escape') pause();
});
addEventListener('keyup',e=>{if(e.key==='Shift') holding=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'&&!endInfo) pause();});
function pause(){if(state!=='play'||endInfo) return; state='paused'; holding=false; dragId=null; $('#pNo').textContent='C-'+String(mi+1).padStart(2,'0'); show('pauseM');}
function resume(){state='play'; show('hud'); hudSetup();}
$('#bPause').addEventListener('click',pause);
$('#pResume').addEventListener('click',resume);
$('#pRestart').addEventListener('click',()=>{prep(mi); start();});
$('#pQuit').addEventListener('click',toMenu);
$('#bStart').addEventListener('click',()=>{unlockAudio(); start();});
$('#bBack').addEventListener('click',toMenu);
$('#rRetry').addEventListener('click',()=>openBrief(mi,RUN.kind));
$('#rNext').addEventListener('click',()=>openBrief(mi+1));
$('#rMenu').addEventListener('click',toMenu);
function toMenu(){ try{ achRender(); }catch(e){} rainSound(false); state='menu'; scoped=false; stats=null; bulletObj.visible=false; menuCity(); show('menu');}
const oS=$('#optSnd'),oI=$('#optInv'),oH=$('#optHold'),oQ=$('#optHq');
oS.checked=save.opts.snd; oI.checked=save.opts.inv; oH.checked=save.opts.hold; oQ.checked=save.opts.hq;
oS.addEventListener('change',()=>{save.opts.snd=oS.checked; persist(); if(oS.checked) unlockAudio(); else if(silentEl) silentEl.pause();});
$('#bTestSnd').addEventListener('click',()=>{ if(!save.opts.snd){save.opts.snd=true; oS.checked=true; persist();} unlockAudio(); setTimeout(()=>snd.gun(),60); });
oI.addEventListener('change',()=>{save.opts.inv=oI.checked; persist();});
oH.addEventListener('change',()=>{save.opts.hold=oH.checked; persist();});
oQ.addEventListener('change',()=>{save.opts.hq=oQ.checked; persist(); resize();});
const oFx=$('#optFx'); oFx.checked=FX(); oFx.addEventListener('change',()=>{save.opts.fx=oFx.checked; persist();});
const oAr=$('#optArcade'); oAr.checked=!!save.opts.arcade; oAr.addEventListener('change',()=>{save.opts.arcade=oAr.checked; persist(); applyGun();});
// haptics: Android has navigator.vibrate; iPhone (iOS 18+) gives a haptic tick when a hidden switch control is toggled during a tap
const HAP=(()=>{ const lb=document.createElement('label'); lb.setAttribute('aria-hidden','true'); lb.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const ip=document.createElement('input'); ip.type='checkbox'; ip.setAttribute('switch',''); ip.tabIndex=-1; lb.appendChild(ip); document.body.appendChild(lb); return lb; })();
function haptic(ms){ if(save.opts.haptic===false) return; try{ if(navigator.vibrate){ navigator.vibrate(ms); return; } if(!document.getElementById('fireHap')) HAP.click(); }catch(e){} }
addEventListener('scroll',()=>{ if(scrollX||scrollY) scrollTo(0,0); }); // iOS ignores overflow:hidden on the page; never let the HUD drift off-screen
function iosTick(){ return !navigator.vibrate&&save.opts.haptic!==false; } // iPhone with vibration on: the shot goes on release, when the switch flips and ticks
$('#fireHap').addEventListener('click',e=>{ if(save.opts.haptic===false||state!=='play'){ e.preventDefault(); return; } if(iosTick()) __fireTap(); });
const oHp=$('#optHaptic'); oHp.checked=save.opts.haptic!==false; oHp.addEventListener('change',()=>{save.opts.haptic=oHp.checked; persist(); if(oHp.checked) haptic(30);});
const oSh=$('#optShadow'); oSh.checked=save.opts.shadows!==false; oSh.addEventListener('change',()=>{save.opts.shadows=oSh.checked; persist(); renderer.shadowMap.enabled=oSh.checked; scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});});
const oF=$('#optFireUp'),oSe=$('#optSens'); oF.checked=save.opts.fireUp; oSe.value=save.opts.sens; oF.addEventListener('change',()=>{save.opts.fireUp=oF.checked; persist();}); oSe.addEventListener('input',()=>{save.opts.sens=+oSe.value; persist();});
const oMC=$('#optMarkCol'); oMC.value=save.opts.markCol||'orange'; oMC.addEventListener('change',()=>{save.opts.markCol=oMC.value; persist(); const old=markMat.map; markMat.map=markTexFor(oMC.value); markMat.needsUpdate=true; old.dispose();});
const oM=$('#optMark'); oM.checked=save.opts.mark; oM.addEventListener('change',()=>{save.opts.mark=oM.checked; persist(); for(const p of people) if(p.mesh&&p.mesh.mk) p.mesh.mk.visible=save.opts.mark&&alive(p); for(const h of hazards) if(!h.done) h.g.traverse(o=>{if(o.isSprite&&o.material===hzMarkMat) o.visible=save.opts.mark;});});

/* ---------- menu ---------- */
function gunCards(){
  const G=save.guns, bar=v=>`<div class="bar"><i style="width:${Math.round(clamp(v,0,1)*100)}%"></i></div>`;
  const cards=Object.entries(GUNS).map(([k,g])=>{const own=G.owned.includes(k), eq=G.eq===k;
    const btn=eq?'<button class="buy" disabled>EQUIPPED</button>':own?`<button class="buy" data-g="${k}" data-a="eq">EQUIP</button>`:`<button class="buy" data-g="${k}" data-a="buy" ${save.cash<g.cost?'disabled':''}>$${g.cost.toLocaleString()}</button>`;
    return `<div class="gc${eq?' eq':''}"><div class="nm">${g.name}</div><div class="d">${g.desc}</div>
      <div class="st"><span>VELOCITY</span>${bar((g.v0-700)/250)}<span>FIRE RATE</span>${bar(1-(g.cd-.2)/1.3)}<span>STABILITY</span>${bar(1.6-g.sway)}<span>PENETRATION</span>${bar(g.pen?1:.1)}</div>${btn}</div>`;});
  const sb=G.supOwned?`<button class="buy" data-a="sup">${G.sup?'ON · TAP TO REMOVE':'OFF · TAP TO FIT'}</button>`:`<button class="buy" data-a="supbuy" ${save.cash<SUP_COST?'disabled':''}>$${SUP_COST}</button>`;
  cards.push(`<div class="gc${G.supOwned&&G.sup?' eq':''}"><div class="nm">Suppressor</div><div class="d">Fits any rifle. Kills and misses alert hostiles in a much smaller radius, and there is no muzzle flash. Rounds fly about 4% slower.</div>${sb}</div>`);
  return cards.join('');
}
let menuView='c', menuTab='play';
try{ const t=localStorage.getItem('longshot-tab'); if(['play','loadout','ranks','settings'].includes(t)) menuTab=t; }catch(e){}
function applyTab(){ document.querySelectorAll('#menu section[data-tab]').forEach(x=>x.hidden=x.dataset.tab!==menuTab);
  document.querySelectorAll('#mTabs button').forEach(b=>{ const on=b.dataset.tab===menuTab; b.classList.toggle('on',on); b.setAttribute('aria-selected',on); }); }
function nextUp(){ // what the Continue card should launch
  const PALN={day:'DAY',dusk:'DUSK',night:'NIGHT'}, place=m=>(m.map||'city').toUpperCase()+' · '+PALN[m.pal];
  for(let i=0;i<Math.min(save.unlocked,MISSIONS.length);i++) if(!(save.stars[i]>0)) return {i,k:'c',tag:'CONTINUE · C-'+String(i+1).padStart(2,'0'),n:MISSIONS[i].n,d:place(MISSIONS[i])};
  if(save.unlocked>3&&!save.daily[dayKey()]){ const dm=dailyMission(); return {i:0,k:'d',tag:'TODAY’S DAILY',n:dm.n,d:place(dm)+' · 1.5× cash'}; }
  for(let i=0;i<MISSIONS.length;i++) if(save.stars[i]>0&&!(save.vstars[i]>0)) return {i,k:'v',tag:'NEXT VETERAN · C-'+String(i+1).padStart(2,'0'),n:MISSIONS[i].n,d:'No markers, one hit · 2× cash'};
  return {i:0,k:'e',tag:'ENDLESS',n:'Beat your best run',d:`Best so far: ${save.endless.wave||0} waves`};
}
function buildMenu(){
  $('#rifles').innerHTML=gunCards(); lbRender(); applyTab();
  {const u=nextUp(); $('#contK').textContent=u.tag; $('#contN').textContent=u.n; $('#contD').textContent=u.d; $('#bCont').dataset.i=u.i; $('#bCont').dataset.k=u.k;}
  $('#mCash').textContent='$'+save.cash.toLocaleString();
  const modesOpen=save.unlocked>3, dk=dayKey(), D=save.daily[dk], dm=dailyMission(), E=save.endless;
  $('#modes').innerHTML=`<button class="cc mode daily${modesOpen?'':' locked'}" data-m="d"><div class="row"><span class="no" style="color:#38e1ff">DAILY</span><span>${modesOpen?(dm.map||'city').toUpperCase()+' · '+{day:'DAY',dusk:'DUSK',night:'NIGHT'}[dm.pal]:'BEAT C-03'}</span></div><div class="nm">${dm.n}</div><div class="d">New setup every day. 1.5× cash.</div><div class="row"><span>${D?'BEST '+D.best.toLocaleString():'NOT PLAYED TODAY'}</span><span class="pips">${[0,1,2].map(k=>`<span class="pip${D&&k<D.stars?' on':''}"></span>`).join('')}</span></div></button>`
   +`<button class="cc mode endless${modesOpen?'':' locked'}" data-m="e"><div class="row"><span class="no">ENDLESS</span><span>${modesOpen?'RANDOM MAP':'BEAT C-03'}</span></div><div class="nm">Endless</div><div class="d">Waves until the clock runs out. Kills add time.</div><div class="row"><span>BEST ${E.wave} WAVES · ${E.kills} KILLS</span><span></span></div></button>`
   +`<button class="cc mode range" data-m="r"><div class="row"><span class="no" style="color:#86d39a">RANGE</span><span>100–1,000 M</span></div><div class="nm">Target Range</div><div class="d">Steel plates, wind flags, six drills. Learn the drop and DIAL.</div><div class="row"><span>${Object.keys(save.range||{}).length} DRILL BESTS</span><span></span></div></button>`;
  const vet=menuView==='v'; $('#grid').classList.toggle('vet',vet); $('#vNote').hidden=!vet;
  $('#vSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===menuView));
  $('#grid').innerHTML=MISSIONS.map((m,i)=>{
    const lock=vet?!(save.stars[i]>0):i+1>save.unlocked, st=(vet?save.vstars[i]:save.stars[i])||0;
    return `<button class="cc${lock?' locked':''}" data-i="${i}" ${lock?'aria-disabled="true"':''}>
      <div class="row"><span class="no">${vet?'VET ':''}C-${String(i+1).padStart(2,'0')}</span><span>${lock?(vet?'BEAT IT FIRST':'LOCKED'):(m.map||'city').toUpperCase()+' · '+{day:'DAY',dusk:'DUSK',night:'NIGHT'}[m.pal]}</span></div>
      <div class="nm">${m.n}</div>
      <div class="row"><span>${vet?(save.vbest[i]?'BEST '+save.vbest[i].toLocaleString():'×2 CASH'):`${m.hos+(m.hvt?1:0)} TGT · ${(save.ch[i]||[]).length}/${(m.ch||[]).length} CH`}</span><span class="pips">${[0,1,2].map(k=>`<span class="pip${k<st?' on':''}"></span>`).join('')}</span></div>
    </button>`;}).join('');
  $('#finishes').innerHTML=Object.entries(FIN).map(([k,f])=>{ const own=save.fin.owned.includes(k), eq=save.fin.eq===k;
    return `<div class="fin${eq?' eq':''}"><div class="sw" style="${finSwatch(k)}"></div><div class="nm">${f.n}</div>${eq?'<button class="buy" disabled>EQUIPPED</button>':own?`<button class="buy" data-f="${k}" data-a="eq">EQUIP</button>`:`<button class="buy" data-f="${k}" data-a="buy" ${save.cash<f.cost?'disabled':''}>$${f.cost.toLocaleString()}</button>`}</div>`;}).join('');
  $('#armory').innerHTML=Object.entries(UPG).map(([k,u])=>{
    const lv=save.up[k], max=lv>=UPMAX, cost=COST[lv];
    return `<div class="ar"><div><div class="t">${u.name} <span class="v">${u.fmt(u.vals[lv],lv)}</span></div><div class="d">${u.desc}${lv>=3&&!max?' · <span style="color:var(--amber)">pro tier</span>':''}</div></div>
      <div class="lvw"><div class="lv">${u.vals.map((_,j)=>`<i class="${j<=lv?'on':''}"></i>`).join('')}</div></div>
      <button class="buy" data-k="${k}" ${max||save.cash<cost?'disabled':''}>${max?'MAXED':'$'+cost.toLocaleString()}</button></div>`;}).join('');
}
$('#grid').addEventListener('click',e=>{const b=e.target.closest('.cc'); if(!b||b.classList.contains('locked')) return; unlockAudio(); openBrief(+b.dataset.i,menuView);});
$('#modes').addEventListener('click',e=>{const b=e.target.closest('.cc'); if(!b||b.classList.contains('locked')) return; unlockAudio(); openBrief(0,b.dataset.m);});
$('#mTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; menuTab=b.dataset.tab; try{localStorage.setItem('longshot-tab',menuTab);}catch(_){} applyTab(); $('#menu').scrollTop=0;});
$('#bCont').addEventListener('click',()=>{ const b=$('#bCont'); unlockAudio(); openBrief(+b.dataset.i,b.dataset.k); });
$('#vSeg').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; menuView=b.dataset.v; buildMenu();});
$('#finishes').addEventListener('click',e=>{const b=e.target.closest('.buy'); if(!b||b.disabled) return; const k=b.dataset.f, F=save.fin;
  if(b.dataset.a==='buy'&&!F.owned.includes(k)&&save.cash>=FIN[k].cost){ save.cash-=FIN[k].cost; F.owned.push(k); F.eq=k; } else if(b.dataset.a==='eq') F.eq=k;
  persist(); rifle.userData.style(); buildMenu();});
$('#rifles').addEventListener('click',e=>{const b=e.target.closest('.buy'); if(!b||b.disabled) return; const G=save.guns, a=b.dataset.a, k=b.dataset.g;
  if(a==='buy'&&!G.owned.includes(k)&&save.cash>=GUNS[k].cost){save.cash-=GUNS[k].cost; G.owned.push(k); G.eq=k;}
  else if(a==='eq') G.eq=k;
  else if(a==='supbuy'&&save.cash>=SUP_COST){save.cash-=SUP_COST; G.supOwned=true; G.sup=true;}
  else if(a==='sup') G.sup=!G.sup;
  persist(); applyGun(); buildMenu();});
$('#armory').addEventListener('click',e=>{const b=e.target.closest('.buy'); if(!b||b.disabled) return; const k=b.dataset.k, lv=save.up[k]; if(lv>=UPMAX||save.cash<COST[lv]) return; save.cash-=COST[lv]; save.up[k]=lv+1; persist(); buildMenu();});

/* ---------- loop ---------- */
let last=performance.now();
function frame(now){
  const rdt=Math.min(.05,(now-last)/1000); last=now;
  if(state==='play'||state==='killcam'){
    const ts=state==='killcam'&&kc?(kc.phase===0?kc.ts:.3):1;
    update(rdt*ts,rdt); hud();
  } else if(state!=='paused'&&state!=='loading'){
    T+=rdt; wind=windBase; updatePeople(rdt); updateCars(rdt); updateFlags(); updateAmbient(rdt); updateFx(rdt);
  }
  updateCamera(rdt);
  renderFrame();
  drawOverlay(rdt);
  requestAnimationFrame(frame);
}
$('#bCopySave').addEventListener('click',()=>{ const code='LS1.'+btoa(unescape(encodeURIComponent(JSON.stringify(save)))); const m=$('#saveMsg');
  const fallback=()=>{ const i=$('#inSave'); i.value=code; i.select(); m.textContent='Save code selected. Copy it and keep it somewhere safe.'; };
  try{ navigator.clipboard.writeText(code).then(()=>{m.textContent='Save code copied. Paste it into Notes to keep a backup.';},fallback); }catch(e){ fallback(); } });
$('#bLoadSave').addEventListener('click',()=>{ const m=$('#saveMsg'), v=$('#inSave').value.trim();
  try{ if(!v.startsWith('LS1.')) throw 0; const s2=JSON.parse(decodeURIComponent(escape(atob(v.slice(4))))); if(!s2||typeof s2.unlocked!=='number') throw 0; adoptSave(s2); persist(); buildMenu(); $('#inSave').value=''; m.textContent=`Save loaded: ${save.unlocked} contracts unlocked, $${(save.cash||0).toLocaleString()}.`; }
  catch(e){ m.textContent='That code didn’t work. Paste the whole code, starting with LS1.'; } });
try{ window.claude?.hot?.snapshot?.(()=>({mi,kind:RUN.kind,inMission:state==='play'||state==='paused'||state==='killcam'})); }catch(e){}
const boot=(hd)=>{ try{ menuCity(); state='menu'; show('menu'); syncLabel();
    if(hd&&hd.inMission&&typeof hd.mi==='number'&&hd.mi<save.unlocked){ openBrief(hd.mi,['v','d','e','r'].includes(hd.kind)?hd.kind:'c'); hintMsg=''; const b=$('#bIntel'); if(b) b.insertAdjacentHTML('afterbegin','<b style="color:var(--green)">The game just updated. Tap Take position to resume this contract.</b><br>'); }
  }catch(err){ $('#loading').textContent='Something broke loading the city: '+err.message; return; } $('#loading').hidden=true; cloudInit(); lbInit(); try{ window.__achReady=true; achSave(); achRender(); achCollect(); }catch(e){ console.warn(e); } };
const bootWith=d=>loadChars().catch(e=>{ console.warn('characters unavailable, using basic people',e); }).finally(()=>setTimeout(()=>boot(d||{}),30));
if(window.claude?.hot?.ready) window.claude.hot.ready(bootWith); else bootWith(window.claude?.hot?.data??{});
requestAnimationFrame(frame);
