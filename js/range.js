/* Longshot 3D · range.js · target practice: steel plates 100-1000 m, free practice and five scored drills */
'use strict';
const DRILLS={
  free:{n:'Free practice',d:'Every plate is live. Each shot tells you where it landed. Quit from pause when done.'},
  cold:{n:'Cold Bore',d:'One shot at one plate between 400 and 900 m. Best: longest cold-bore hit.'},
  ladder:{n:'Ladder',d:'Hit 100 m, then 200 m, all the way to 1,000 m. 30 rounds. Best: fastest climb.'},
  wind:{n:'Wind Call',d:'Gusting crosswind and no HOLD readout: read the flags. 10 rounds at 6 plates. Best: most hits.'},
  mover:{n:'Mover',d:'A plate slides on a rail at 400 m. 8 rounds. Lead it. Best: most hits.'},
  speed:{n:'Speed',d:'Five plates from 200 to 600 m against a 30-second clock. Best: fastest clear.'}
};
let RG=null; // live range state
function rangeMission(){ return {n:'Target Range',range:true,map:'range',pal:'day',hos:0,civ:0,civT:[],wind:0,move:0,time:36000,esc:9,band:[100,1000],types:[],ch:[],seed:4242}; }
function buildRange(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=.62; PITCH_MIN=-.25; PITCH_MAX=.2;
  EYE.set(0,4.1,0);
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x6f7d4a,map:grainTex(700)})); grass.userData.own=true; grass.userData.noCast=true; world.add(grass); solid.push(grass);
  const dirt=Col(), wood=Col(), steelPost=Col(), roofC=Col(), lane=Col();
  // firing shed: bench, roof, rear wall
  addBox(wood,8,2.4,4,0,1.2,2.2,[0,1,2,4,5]); addBox(roofC,9,.2,5.5,0,6.4,1.8,[2,3]); for(const x of [-4.2,4.2]) addBox(wood,.25,6.4,.25,x,3.2,-.6,[0,1,4,5]);
  addBox(wood,2.4,.12,1,0,2.45,-.2,[0,1,2,4,5]);
  // mowed lane and side berms
  addBox(lane,90,.03,1020,0,.015,-520,[2]);
  for(const sx of [-1,1]) addBox(dirt,6,3,1000,sx*60,1.5,-520,[0,1,2,4,5]);
  addBox(dirt,160,14,10,0,7,-1065,[0,1,2,4,5]);
  add(toMesh(dirt,new THREE.MeshLambertMaterial({color:0x8a7352,map:grainTex(60)})),true);
  add(toMesh(wood,new THREE.MeshLambertMaterial({color:0x6e5238})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:0x4a4d52,side:THREE.DoubleSide})),true);
  {const lm=toMesh(lane,new THREE.MeshLambertMaterial({color:0x7f8f52,polygonOffset:true,polygonOffsetFactor:-1})); if(lm){lm.userData.noCast=true; world.add(lm);}}
  // distant hills and tree lines for depth
  for(let i=0;i<14;i++){const g=new THREE.Mesh(new THREE.ConeGeometry(rr(r,120,260),rr(r,60,140),7),new THREE.MeshLambertMaterial({color:new THREE.Color(0x6b7a5a).lerp(new THREE.Color(P.fog),.35)})); g.userData.own=true; g.position.set(rr(r,-1600,1600),0,rr(r,-1400,-2200)); world.add(g);}
  {const tr=Col(), cn=Col(); for(let i=0;i<160;i++){const sx=r()<.5?-1:1, x=sx*rr(r,72,140), z=-rr(r,40,1050), s=rr(r,.8,1.4); addBox(tr,.4*s,3*s,.4*s,x,1.5*s,z,[0,1,4,5]); addGeo(cn,new THREE.ConeGeometry(2.2*s,7*s,6),x,3*s+3.5*s,z);}
   add(toMesh(tr,new THREE.MeshLambertMaterial({color:0x4a3524})),false); add(toMesh(cn,new THREE.MeshLambertMaterial({color:0x3f5f33})),false);}
  // wind flags every 200 m along the left berm
  for(let d=200;d<=1000;d+=200) flagAt(-52,0,-d,r);
  const D=[100,200,300,400,500,600,700,800,900,1000];
  const plates=D.map((d,i)=>{ const x=Math.sin(i*2.1+.7)*Math.min(38,d*.06), size=d<=300?.45:d<=600?.6:.8;
    const g=new THREE.Group(); g.position.set(x,0,-d); world.add(g);
    addBox(steelPost,.12,1.7,.12,-size*.55,.85,0,[0,1,4,5]); addBox(steelPost,.12,1.7,.12,size*.55,.85,0,[0,1,4,5]); // posts (merged later, so offset by group position)
    const hinge=new THREE.Group(); hinge.position.set(0,1.7,0); g.add(hinge);
    const plate=new THREE.Mesh(new THREE.BoxGeometry(size,size*1.25,.03),new THREE.MeshLambertMaterial({color:0xf2efe6})); plate.position.y=-size*.65; plate.userData.own=true; hinge.add(plate);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),new THREE.MeshLambertMaterial({map:(()=>{const c=document.createElement('canvas'); c.width=128; c.height=64; const x2=c.getContext('2d'); x2.fillStyle='#f5f1e6'; x2.fillRect(0,0,128,64); x2.fillStyle='#1b1d20'; x2.font='bold 40px sans-serif'; x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText(String(d),64,34); return new THREE.CanvasTexture(c);})()})); sign.position.set(size+1.6,.6,0); sign.userData.own=true; g.add(sign);
    const berm=new THREE.Mesh(new THREE.BoxGeometry(size*6+3,2.2,2),new THREE.MeshLambertMaterial({color:0x8a7352})); berm.position.set(0,1.1,-6); berm.userData.own=true; g.add(berm); solid.push(berm);
    const P2={d,x,size,g,hinge,plate,swing:0,mark:null}; plate.userData.plate=P2; solid.push(plate); return P2; });
  // steel posts need world positions: rebuild with offsets
  steelPost.p.length=0; steelPost.n.length=0; steelPost.u.length=0; steelPost.i.length=0;
  for(const p of plates){ addBox(steelPost,.12,1.7,.12,p.x-p.size*.55,.85,-p.d,[0,1,4,5]); addBox(steelPost,.12,1.7,.12,p.x+p.size*.55,.85,-p.d,[0,1,4,5]); addBox(steelPost,p.size*1.2,.1,.1,p.x,1.72,-p.d,[0,1,2,4,5]); }
  add(toMesh(steelPost,new THREE.MeshLambertMaterial({color:0x3a3d42})),false);
  // mover on a rail at 400 m
  const mg=new THREE.Group(); mg.position.set(0,0,-400); world.add(mg);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(44,.12,.25),new THREE.MeshLambertMaterial({color:0x3a3d42})); rail.position.y=.3; rail.userData.own=true; mg.add(rail);
  const mh=new THREE.Group(); mh.position.set(0,1.75,0); mg.add(mh);
  const mp=new THREE.Mesh(new THREE.BoxGeometry(.6,.75,.03),new THREE.MeshLambertMaterial({color:0xff8a2a})); mp.position.y=-.4; mp.userData.own=true; mh.add(mp);
  const mpost=new THREE.Mesh(new THREE.BoxGeometry(.1,1.5,.1),new THREE.MeshLambertMaterial({color:0x3a3d42})); mpost.position.y=-1; mpost.userData.own=true; mh.add(mpost);
  const mover={d:400,x:0,size:.6,g:mg,hinge:mh,plate:mp,swing:0,mover:true,t:0}; mp.userData.plate=mover; solid.push(mp); mg.visible=false;
  scene.updateMatrixWorld(true);
  RG={plates,mover,impacts:[]};
  city={kind:'range',P,pal:palKey,sunDir:sd.clone(),gY:()=>0,gHit:()=>0,lakeLvl:-999,spots:{}};
}
const rangeMarkMat=new THREE.SpriteMaterial({map:radialTex('rgba(255,178,46,1)','rgba(255,178,46,0)'),depthTest:false,fog:false,sizeAttenuation:false,transparent:true});
function rangeSetup(r){
  const dr=RUN.drill||'free', R=RG; R.drill=dr; R.shots=0; R.hits=0; R.t=0; R.done=false; R.queue=[]; R.active=null; R.last='';
  R.mover.g.visible=dr==='mover'||dr==='free'; R.mover.plate.visible=R.mover.g.visible;
  if(dr==='cold'){ const c=R.plates.filter(p=>p.d>=400&&p.d<=900); R.queue=[c[Math.floor(MR()*c.length)]]; R.limit=1; }
  else if(dr==='ladder'){ R.queue=R.plates.slice(); R.limit=30; }
  else if(dr==='wind'){ R.queue=R.plates.filter(p=>p.d>=300&&p.d<=800).sort(()=>MR()-.5); R.limit=10; }
  else if(dr==='mover'){ R.queue=[R.mover]; R.limit=8; }
  else if(dr==='speed'){ R.queue=R.plates.filter(p=>p.d>=200&&p.d<=600).sort(()=>MR()-.5).slice(0,5); R.limit=40; R.clock=30; }
  else R.limit=1e9;
  windBase=dr==='wind'?(MR()<.5?-1:1)*rr(MR,4.5,7.5):dr==='free'?(MR()<.5?-1:1)*rr(MR,0,4):(MR()<.5?-1:1)*rr(MR,0,3); wind=windBase;
  rangeActivate();
}
function rangeActivate(){ const R=RG; if(R.mark){ R.mark.parent&&R.mark.parent.remove(R.mark); R.mark=null; }
  const p=R.drill==='free'?null:(R.drill==='wind'||R.drill==='mover'||R.drill==='cold')?R.queue[0]:R.queue[0]; R.active=p||null;
  if(p){ const s=new THREE.Sprite(rangeMarkMat); s.scale.set(.03,.03,1); s.position.set(0,.5,0); s.renderOrder=10; p.hinge.add(s); R.mark=s; marks.push(s); } }
function rangeFire(b,dir){ const R=RG; if(!R) return; R.shots++; b.rgStart=EYE.clone();
  // which plate was this shot meant for: the one closest to the aim line
  // which plate was this shot meant for: of the plates near the crosshair, the one whose distance matches the rangefinder
  let best=null,bs=1e9; const rf=rangeNow||lastRange||0;
  for(const p of R.plates.concat(R.mover.g.visible?[R.mover]:[])){ const c=V3(); p.plate.getWorldPosition(c); const D=c.distanceTo(EYE), a=c.clone().sub(EYE).normalize().angleTo(dir); if(a>.035) continue;
    const sc=(rf?Math.abs(D-rf)/40:0)+a/Math.max(.001,p.size/D)*.2; if(sc<bs){bs=sc; best=p;} }
  b.rgAim=best; }
function rangeTrack(b){ // when the round reaches the aimed plate's distance, record how far off it was, in mils
  const p=b.rgAim; if(!p||b.rgDone) return; const c=V3(); p.plate.getWorldPosition(c); const D=c.distanceTo(EYE), d=b.pos.distanceTo(EYE); if(d<D) return;
  b.rgDone=true; const fwd=c.clone().sub(EYE).normalize(), right=V3().crossVectors(fwd,V3().set(0,1,0)).normalize(), up=V3().crossVectors(right,fwd);
  const off=b.pos.clone().sub(c); b.rgOff={up:off.dot(up)/D*1000,side:off.dot(right)/D*1000,D};
}
function rangeHit(p,b,pt){
  const R=RG, dist=EYE.distanceTo(pt); p.swing=1; snd.ok()&&(tone(Math.min(3,dist/343),2100,1900,.5,.22),tone(Math.min(3,dist/343)+.02,3150,3000,.35,.12));
  pops.push({w:pt.clone().add(V3().set(0,1.2,0)),t:0,txt:`HIT · ${Math.round(dist)} m`,c:'#86d39a'});
  const good=R.drill==='free'||p===R.active; if(!good){ R.last=`Wrong plate (${p.d} m)`; return; }
  R.hits++; stats.hits++; stats.kills++; stats.longest=Math.max(stats.longest,dist);
  if(R.drill==='cold'){ R.coldHit=p.d; rangeEnd(true); return; }
  if(R.drill==='ladder'||R.drill==='speed'||R.drill==='wind'){ R.queue.shift(); if(!R.queue.length){ rangeEnd(true); return; } rangeActivate(); }
}
function rangeMissNote(b,pt){ let o=b.rgOff; if(!o&&pt){ const c=V3(); b.rgAim.plate.getWorldPosition(c); const D=c.distanceTo(EYE), f=c.clone().sub(EYE).normalize(), r2=V3().crossVectors(f,V3().set(0,1,0)).normalize(), u=V3().crossVectors(r2,f), q=pt.clone().sub(EYE).normalize(); o={up:Math.min(-.2,q.dot(u)*1000),side:q.dot(r2)*1000,short:true}; } if(!o) return; const v=Math.abs(o.up)<.15?'':`${Math.abs(o.up).toFixed(1)} ${o.up>0?'HIGH':'LOW'}`, h=Math.abs(o.side)<.15?'':`${Math.abs(o.side).toFixed(1)} ${o.side>0?'RIGHT':'LEFT'}`;
  const txt='MISS · '+([v,h].filter(Boolean).join(' · ')||'JUST OFF')+(o.short?' · LANDED SHORT':' (mils)'); const p=b.rgAim, c=V3(); p.plate.getWorldPosition(c); pops.push({w:c.add(V3().set(0,1.4,0)),t:0,txt,c:'#ffb22e'}); RG.last=txt; }
function rangeImpact(b,hit){ if(!RG) return false; const u=hit.object&&hit.object.userData;
  if(u&&u.plate){ rangeHit(u.plate,b,hit.point); rangeAfterShot(); return true; }
  if(b.rgAim&&!b.rgOff){ rangeTrack(b); } if(b.rgAim) rangeMissNote(b,hit.point); rangeAfterShot(); return false; }
function rangeAfterShot(){ const R=RG; if(R.done) return;
  if(R.drill==='cold'&&R.shots>=1) rangeEnd(false);
  else if(R.shots>=R.limit) rangeEnd(R.drill==='wind'||R.drill==='mover'); }
function rangeEnd(ok){ const R=RG; if(R.done) return; R.done=true; endInfo={ok:true,range:true,clean:ok}; endT=1.4; }
function rangeUpdate(dt){ const R=RG; if(!R) return; if(state==='play'&&!R.done){ R.t+=dt; if(R.drill==='speed'){ R.clock-=dt; if(R.clock<=0){ R.clock=0; rangeEnd(false);} } }
  for(const p of R.plates.concat([R.mover])){ if(p.swing>0){ p.swing=Math.max(0,p.swing-dt*.9); p.hinge.rotation.x=-Math.sin((1-p.swing)*14)*p.swing*.9; } }
  if(R.mover.g.visible){ R.mover.t+=dt; const x=Math.sin(R.mover.t*.16)*19; const vx=Math.cos(R.mover.t*.16)*19*.16; R.mover.hinge.position.x=x; R.mover.vx=vx; } }
function rangeObj(){ const R=RG; if(!R) return ''; if(R.drill==='free') return `${R.hits} hits / ${R.shots}`;
  if(R.drill==='cold') return R.active?`${R.active.d} m`:'';
  if(R.drill==='ladder') return `${10-R.queue.length}/10`;
  if(R.drill==='speed') return `${5-R.queue.length}/5`;
  return `${R.hits}/${R.limit}`; }
function rangeTimeText(){ const R=RG; if(!R) return ''; if(R.drill==='speed') return R.clock.toFixed(1)+'s'; return fmt(R.t); }
function rangeFinish(){
  const R=RG, dr=R.drill, B=save.range||(save.range={}); let line='', best='', isBest=false;
  const acc=R.shots?Math.round(R.hits/R.shots*100):0;
  if(dr==='cold'){ if(R.coldHit){ isBest=R.coldHit>(B.cold||0); if(isBest) B.cold=R.coldHit; line=`Cold-bore hit at ${R.coldHit} m.`; } else line=`Missed at ${R.queue[0]?R.queue[0].d:''} m. ${R.last||''}`; best=B.cold?`Best: ${B.cold} m`:''; }
  else if(dr==='ladder'){ if(!R.queue.length){ const t=Math.round(R.t*10)/10; isBest=!B.ladder||t<B.ladder; if(isBest) B.ladder=t; line=`Climbed 100 to 1,000 m in ${t}s with ${R.shots} rounds.`; } else line=`Out of rounds at ${R.queue[0].d} m.`; best=B.ladder?`Best: ${B.ladder}s`:''; }
  else if(dr==='speed'){ if(!R.queue.length){ const t=Math.round((30-R.clock)*10)/10; isBest=!B.speed||t<B.speed; if(isBest) B.speed=t; line=`Five plates in ${t}s.`; } else line=`Clock ran out with ${R.queue.length} plate${R.queue.length>1?'s':''} standing.`; best=B.speed?`Best: ${B.speed}s`:''; }
  else if(dr==='wind'||dr==='mover'){ isBest=R.hits>(B[dr]||0); if(isBest) B[dr]=R.hits; line=`${R.hits} hits from ${R.shots} rounds.`; best=`Best: ${B[dr]||0}`; }
  else line=`${R.hits} hits from ${R.shots} rounds (${acc}%).`;
  const cash=dr==='free'?0:Math.min(300,R.hits*25); save.cash+=cash; persist();
  $('#rNo').textContent='TARGET RANGE · '+DRILLS[dr].n.toUpperCase(); const hd=$('#rHead'); hd.textContent=isBest?'New best':'Drill complete'; hd.className=isBest||R.hits?'ok':'bad';
  $('#rReason').textContent=line+(best?' '+best+'.':''); $('#rStars').innerHTML=''; $('#rCh').innerHTML='';
  $('#rT').textContent=String(R.hits); $('#rH').textContent=String(R.shots); $('#rA').textContent=acc+'%'; $('#rC').textContent='$'+cash;
  $('#rNext').hidden=true; $('#rRetry').textContent='Again'; show('result');
}
function rangeBriefHtml(){ const B=save.range||{}, cur=RUN.drill||'free';
  const bestOf={cold:B.cold?B.cold+' m':'',ladder:B.ladder?B.ladder+'s':'',wind:B.wind!=null?B.wind+' hits':'',mover:B.mover!=null?B.mover+' hits':'',speed:B.speed?B.speed+'s':''};
  return `<b style="color:#86d39a">TARGET RANGE.</b> Steel plates every 100 m out to 1,000 m, wind flags every 200 m, no civilians and no fail. Every miss tells you how far off it was in mils, so you can see the drop and wind for yourself. Practice DIAL here before taking it into a contract.`
   +`<div class="drills">`+Object.entries(DRILLS).map(([k,v])=>`<button class="drill${k===cur?' on':''}" onclick="window.__drill('${k}')"><b>${v.n}</b><span>${v.d}</span>${bestOf[k]?`<small>BEST ${bestOf[k]}</small>`:''}</button>`).join('')+`</div>`; }
window.__drill=k=>{ RUN.drill=k; openBrief(0,'r'); };
