/* Longshot 3D · spot.js · spotting (hold the crosshair on someone to tag them) and distractions (car alarms, bottles) */
'use strict';
const SPOT={p:null,t:0,scan:0};
function spotCandidate(){ // the person nearest the crosshair line, within about a body-width, and actually visible
  camera.updateMatrixWorld(); const fwd=V3().set(0,0,-1).applyQuaternion(camera.quaternion); let best=null,bs=1e9;
  for(const p of people){ if(!alive(p)||p.state==='gone'||p.spotted) continue; const c=V3().set(p.x,p.y+1.3,p.z), v=c.clone().sub(EYE), d=v.length(); if(d<3) continue;
    const a=v.normalize().angleTo(fwd), lim=Math.max(.0035,.75/d); if(a<lim&&a/lim<bs){ bs=a/lim; best=p; } }
  return best&&los(best.x,best.y+1.5,best.z)?best:null; }
function spotTick(dt){
  if(state!=='play'||!scoped||M.range){ SPOT.t=0; SPOT.p=null; return; }
  SPOT.scan-=dt; if(SPOT.scan<=0){ SPOT.scan=.1; const c=spotCandidate(); if(c!==SPOT.p){ SPOT.p=c; SPOT.t=0; } }
  if(!SPOT.p) return; SPOT.t+=dt;
  if(SPOT.t>=1){ const p=SPOT.p; p.spotted=true; SPOT.p=null; SPOT.t=0; snd.click();
    if(p.hostile){ if(p.mesh.mk) p.mesh.mk.visible=true; pops.push({w:V3().set(p.x,p.y+2.5,p.z),t:0,txt:p.hvt?'SPOTTED · HIGH-VALUE TARGET':p.sniper?'SPOTTED · SNIPER':'SPOTTED · HOSTILE',c:'#ff6b5b'}); }
    else pops.push({w:V3().set(p.x,p.y+2.3,p.z),t:0,txt:'CIVILIAN',c:'#cfd6dc'}); }
}
function drawSpot(c,cx,cy){ if(!SPOT.p||SPOT.t<.15) return; const k=Math.min(1,SPOT.t);
  c.save(); c.strokeStyle='rgba(235,230,216,.85)'; c.lineWidth=2.5; c.beginPath(); c.arc(cx,cy,26,-Math.PI/2,-Math.PI/2+k*TAU); c.stroke();
  c.font='11px "Share Tech Mono",monospace'; c.textAlign='center'; c.fillStyle='rgba(235,230,216,.8)'; c.fillText('SPOTTING',cx,cy-34); c.restore(); }

/* distractions: noise-makers near some hostiles; shooting one pulls guards over to look without raising the alarm */
let DIS=[];
const disMarkTex=(()=>{const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.lineWidth=7; x.strokeStyle='#f2efe6'; x.beginPath(); x.arc(32,32,20,0,TAU); x.stroke(); x.fillStyle='#f2efe6'; x.font='bold 30px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('!',32,34); return new THREE.CanvasTexture(c);})();
const disMarkMat=new THREE.SpriteMaterial({map:disMarkTex,depthTest:false,fog:false,sizeAttenuation:false,transparent:true,opacity:.85});
const GROUND_T=['street','plaza','road','yard','aisle','quay','lot'];
function distractSetup(r){
  DIS=[]; if(!M||M.range||M.endless||M.fight||M.mode||!city) return;
  const hs=people.filter(p=>p.hostile&&!p.sniper&&!p.hvt).sort(()=>r()-.5);
  for(const h of hs){ if(DIS.length>=2) break;
    for(let t=0;t<14;t++){ const a=r()*TAU, d=rr(r,7,13), x=clamp(h.x+Math.sin(a)*d,h.rect.x0,h.rect.x1), z=clamp(h.z+Math.cos(a)*d,h.rect.z0,h.rect.z1);
      if(Math.hypot(x-h.x,z-h.z)<5||blockedAt(x,z,h.y,1.2)||!los(x,h.y+.8,z)||!aimable(x,h.y,z)) continue;
      const car=GROUND_T.includes(h.type)&&!h.door, g=new THREE.Group(); g.position.set(x,h.y,z); let hitM;
      if(car){ const col=pick(r,CARS), b=new THREE.Mesh(CG.body,mat(col)); b.position.y=.75; const cab=new THREE.Mesh(CG.glass,mat(0x1d2630)); cab.position.set(0,1.6,-.2); g.add(b,cab); g.rotation.y=r()*TAU;
        const ls=[]; for(const sx of [-.7,.7]){ const l=new THREE.Mesh(new THREE.BoxGeometry(.3,.15,.05),new THREE.MeshBasicMaterial({color:0x553300})); l.position.set(sx,.85,2.21); g.add(l); ls.push(l); } hitM=b; ob(x-2.4,x+2.4,z-2.4,z+2.4,h.y,h.y+1.8); g.userData.lamps=ls; }
      else { const tbl=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.5),mat(0x5a4330)); tbl.position.y=.45; const bot=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.38,8),new THREE.MeshLambertMaterial({color:0x2f8a4a,transparent:true,opacity:.85})); bot.position.y=1.09; g.add(tbl,bot); hitM=bot; g.userData.bottle=bot; ob(x-.4,x+.4,z-.3,z+.3,h.y,h.y+.9); }
      const mk=new THREE.Sprite(disMarkMat); mk.position.y=car?2.6:1.7; mk.scale.set(.04,.04,1); mk.renderOrder=10; mk.visible=markOn(); g.add(mk); marks.push(mk);
      g.traverse(o=>{ if(o.isMesh){ o.userData.own=true; o.userData.dis=DIS.length; } }); world.add(g); solid.push(hitM);
      DIS.push({g,hitM,car,x,z,y:h.y,used:false,mk,t:0}); break; } }
}
function distractImpact(b,hit){
  const o=hit.object; if(!o||o.userData.dis==null) return false; const D=DIS[o.userData.dis]; if(!D) return false;
  if(D.used){ puff(hit.point,.5,false); return true; }
  D.used=true; D.mk.visible=false; const dist=EYE.distanceTo(hit.point);
  if(D.car){ D.t=12; if(snd.ok()) for(let i=0;i<14;i++){ tone(dist/343+i*.42,1350,1350,.18,.12); tone(dist/343+i*.42+.21,950,950,.18,.12); } }
  else { D.g.userData.bottle.visible=false; puff(hit.point,.45,false); if(snd.ok()) noise(dist/343,.25,'highpass',4200,.35,.2); }
  let n=0; for(const p of people){ if(!p.hostile||!alive(p)||p.sniper||p.state==='alert'||Math.abs(p.y-D.y)>2) continue; const d=Math.hypot(p.x-D.x,p.z-D.z); if(d>(D.car?45:25)) continue;
    const a=MR()*TAU; p.goal={x:clamp(D.x+Math.sin(a)*2.5,p.rect.x0,p.rect.x1),z:clamp(D.z+Math.cos(a)*2.5,p.rect.z0,p.rect.z1)}; if(!pathClear(p.x,p.z,p.goal.x,p.goal.z,p.y)) continue; p.state='walk'; p.investigate=7; n++; }
  pops.push({w:V3().set(D.x,D.y+3,D.z),t:0,txt:n?(D.car?'CAR ALARM · ':'BOTTLE · ')+n+' going to look':(D.car?'CAR ALARM':'BOTTLE'),c:'#f2efe6'});
  return true;
}
function distractTick(dt){ for(const D of DIS){ if(D.t>0){ D.t-=dt; const on=Math.floor(D.t*2.4)%2===0; for(const l of D.g.userData.lamps||[]) l.material.color.setHex(on&&D.t>0?0xffb020:0x553300); } } }
