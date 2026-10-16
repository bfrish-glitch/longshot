/* Longshot 3D · people.js · people, special roles, hazards */
'use strict';
/* ---------- people ---------- */
function makePersonBasic(p){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  body.scale.set(p.bw,p.ht,p.bw);
  const limb=(geo,col,x,y)=>{const piv=new THREE.Group(); piv.position.set(x,y,0); const m=new THREE.Mesh(geo,mat(col)); piv.add(m); return piv;};
  const thighL=limb(PG.thigh,p.pants,-.095,.94), thighR=limb(PG.thigh,p.pants,.095,.94);
  const shinL=limb(PG.shin,p.pants,0,-.45), shinR=limb(PG.shin,p.pants,0,-.45); thighL.add(shinL); thighR.add(shinR);
  const pelvis=new THREE.Mesh(PG.pelvis,mat(p.pants)); pelvis.position.y=.98;
  const torso=new THREE.Mesh(PG.torso,mat(p.top)); torso.position.y=1.3;
  const upL=limb(PG.upper,p.top,-.215,1.5), upR=limb(PG.upper,p.top,.215,1.5);
  const foL=limb(PG.fore,p.fore,0,-.3), foR=limb(PG.fore,p.fore,0,-.3); upL.add(foL); upR.add(foR);
  foL.rotation.x=foR.rotation.x=-.2;
  const head=new THREE.Mesh(PG.head,mat(p.skin)); head.position.y=1.68;
  const cap=new THREE.Mesh(PG.cap,mat(p.cap)); cap.position.y=1.695;
  body.add(thighL,thighR,pelvis,torso,upL,upR,head,cap);
  if(p.hostile&&!p.hvt){
    upR.rotation.x=-.45; foR.rotation.x=-1.1; upL.rotation.x=-1.0; upL.rotation.z=.4; foL.rotation.x=-.45;
    const band=new THREE.Mesh(PG.band,mat(0xe0261b)); band.position.y=-.1; upL.children[0].add(band);
    const rf=new THREE.Mesh(PG.rifle,mat(0x0a0a0a)); rf.position.set(.06,1.3,.3); rf.rotation.x=.12; body.add(rf);
  }
  if(p.hvt){const tie=new THREE.Mesh(PG.tie,mat(0xc0392b)); tie.position.set(0,1.38,.105); body.add(tie); const bc=new THREE.Mesh(PG.bcase,mat(0x3e2a1a)); bc.position.set(0,-.4,0); foR.add(bc);}
  const hh=new THREE.Mesh(PG.hbH,HBMAT); hh.position.y=1.68; hh.userData={p,part:'head'};
  const hb=new THREE.Mesh(PG.hbB,HBMAT); hb.position.y=.78; hb.userData={p,part:'body'};
  body.add(hh,hb);
  root.traverse(o=>{if(o.isMesh&&o.material!==HBMAT){o.castShadow=true; o.receiveShadow=true;}});
  const al=new THREE.Sprite(alertMat); al.position.y=1.95; al.center.set(.5,-1.25); al.visible=false; al.renderOrder=11; root.add(al); marks.push(al);
  let mk=null; if(p.hostile){mk=new THREE.Sprite(markMat); mk.position.y=1.95; mk.center.set(.5,-.15); mk.renderOrder=10; mk.visible=markOn(); root.add(mk); marks.push(mk);}
  root.position.set(p.x,p.y,p.z); root.rotation.y=p.heading;
  const lod=new THREE.Mesh(lodGeo(p),LODMAT); lod.scale.set(p.bw,p.ht,p.bw); lod.visible=false; root.add(lod);
  scene.add(root);
  p.mesh={root,body,thighL,thighR,shinL,shinR,upL,upR,foL,foR,hh,hb,al,mk,lod};
}
let thermOn=false, thermApplied=false;
const THERMMAT=new THREE.MeshBasicMaterial({color:0x00ff00,fog:false,skinning:true});
function applyThermal(){
  const want=thermOn&&scoped&&state==='play';
  if(want===thermApplied) return; thermApplied=want;
  for(const p of people){if(!p.mesh) continue; p.mesh.root.traverse(o=>{ if(!o.isMesh||o.material===HBMAT) return; if(!o.userData.mat0) o.userData.mat0=o.material; o.material=want?THERMMAT:o.userData.mat0; });}
}
const LODMAT=new THREE.MeshLambertMaterial({vertexColors:true});
function lodGeo(p){
  const parts=[[new THREE.BoxGeometry(.3,.92,.2),0,.46,0,p.pants],[new THREE.BoxGeometry(.42,.6,.26),0,1.24,0,p.top],[new THREE.BoxGeometry(.1,.62,.12),-.26,1.2,0,p.fore],[new THREE.BoxGeometry(.1,.62,.12),.26,1.2,0,p.fore],[new THREE.SphereGeometry(.11,6,5),0,1.66,0,p.skin],[new THREE.SphereGeometry(.105,6,3,0,TAU,0,Math.PI/2),0,1.69,0,p.cap]];
  if(p.hostile&&!p.hvt) parts.push([new THREE.BoxGeometry(.06,.08,1),.06,1.3,.3,0x0a0a0a]);
  const P=[],N=[],Cc=[],I=[], c=new THREE.Color();
  for(const [g,x,y,z,col] of parts){const pos=g.attributes.position,nor=g.attributes.normal,b=P.length/3; c.set(col);
    for(let v=0;v<pos.count;v++){P.push(pos.getX(v)+x,pos.getY(v)+y,pos.getZ(v)+z); N.push(nor.getX(v),nor.getY(v),nor.getZ(v)); Cc.push(c.r,c.g,c.b);}
    for(let k=0;k<g.index.count;k++) I.push(g.index.getX(k)+b); g.dispose();}
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3)); g.setIndex(I); g.computeBoundingSphere(); return g;
}
function updateLod(){
  const k=H/(2*Math.tan(camera.fov*Math.PI/360)), cam=camera.position, kcam=state==='killcam';
  for(const p of people){const m=p.mesh; if(!m||p.state==='gone') continue;
    const far=!kcam&&!p.driver&&alive(p)&&1.75*k/Math.max(1,Math.hypot(p.x-cam.x,p.y+1-cam.y,p.z-cam.z))<30;
    if(m.body.visible===far){m.body.visible=!far; m.lod.visible=far;}}
}
// character rig helpers (tested in harness, then pasted into the game)
const CHAR={ready:false,src:null,boneNames:['Hips','Spine','Chest','UpperChest','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot']};
const _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _e=new THREE.Euler();
function rigOf(root){
  const bones={}; root.traverse(o=>{ if(o.isBone&&CHAR.boneNames.includes(o.name)) bones[o.name]=o; });
  root.updateMatrixWorld(true);
  const rinv=new THREE.Matrix4().copy(root.matrixWorld).invert(), m=new THREE.Matrix4(), p=new THREE.Vector3(), s=new THREE.Vector3();
  const rest={};
  for(const n in bones){const b=bones[n]; m.multiplyMatrices(rinv,b.matrixWorld); const W=new THREE.Quaternion(); m.decompose(p,W,s); rest[n]={L:b.quaternion.clone(),W,Wi:W.clone().invert(),pos:p.clone(),M:m.clone()};}
  return {bones,rest};
}
// rotate a bone by an euler (x,y,z) given in the character's rest axes (x = character's left, y up, z forward)
function pose(rig,name,x,y,z,order){
  const b=rig.bones[name], r=rig.rest[name]; if(!b) return;
  _e.set(x||0,y||0,z||0,order||'XYZ'); _q1.setFromEuler(_e);
  _q2.copy(r.Wi).multiply(_q1).multiply(r.W);
  b.quaternion.copy(r.L).multiply(_q2);
}
function attach(rig,bone,obj,charPos,charQuat){
  const r=rig.rest[bone], Mb=r.M, Md=new THREE.Matrix4().compose(charPos,charQuat||new THREE.Quaternion(),new THREE.Vector3(1,1,1));
  const L=new THREE.Matrix4().copy(Mb).invert().multiply(Md); L.decompose(obj.position,obj.quaternion,obj.scale); rig.bones[bone].add(obj);
}

CHAR.H=2.16; // model height after head scaling
function loadImg(src){return new Promise((res,rej)=>{const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src;});}
async function loadChars(){
  if(!THREE.GLTFLoader||!THREE.SkeletonUtils||!window.LS_CHAR_GLB) throw new Error('no loader');
  const bin=Uint8Array.from(atob(window.LS_CHAR_GLB),c=>c.charCodeAt(0)).buffer;
  const g=await new Promise((res,rej)=>new THREE.GLTFLoader().parse(bin,'',res,rej));
  let base=null; g.scene.traverse(o=>{ if(o.isMesh){ base=o.material.map.image; o.castShadow=true; o.frustumCulled=false; } });
  CHAR.src=g.scene; const rig=rigOf(g.scene); CHAR.rest=rig.rest;
  const faces=[base]; for(const k of ['skater-male','skater-female','survivor-male','survivor-female']) faces.push(await loadImg(window.LS_FACES[k]));
  CHAR.base=base; CHAR.faces=faces;
  const mk=(draw)=>{const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d',{willReadFrequently:true}); x.scale(.5,.5); draw(x); const t=new THREE.CanvasTexture(c); t.flipY=false; t.anisotropy=ANISO; const d=x.getImageData(160,400,1,1).data, d2=x.getImageData(400,440,1,1).data; return {tex:t,top:(d[0]<<16)|(d[1]<<8)|d[2],pants:(d2[0]<<16)|(d2[1]<<8)|d2[2]};};
  const recolor=(face,shirt,pants,shoes)=>mk(x=>{
    x.drawImage(base,0,0,1024,1024);
    x.globalCompositeOperation='multiply';
    x.fillStyle=shirt; x.fillRect(0,490,640,534); x.fillStyle=pants; x.fillRect(612,764,412,260); if(shoes){x.fillStyle=shoes; x.fillRect(640,0,184,524);}
    x.globalCompositeOperation='source-over';
    const f=faces[face]; for(const [sx,sy,sw,sh] of [[0,0,640,490],[824,134,200,390],[640,524,384,240]]) x.drawImage(f,sx*f.width/1024,sy*f.height/1024,sw*f.width/1024,sh*f.height/1024,sx,sy,sw,sh);
  });
  const hex=n=>'#'+n.toString(16).padStart(6,'0');
  const R=mulberry(512);
  CHAR.civ=[]; for(let i=1;i<5;i++) CHAR.civ.push(mk(x=>x.drawImage(faces[i],0,0,1024,1024)));
  for(let i=0;i<14;i++) CHAR.civ.push(recolor(Math.floor(R()*5),hex(pick(R,TOPS)),hex(pick(R,PANTS)),R()<.5?null:hex(pick(R,[0x333333,0x6b4a2c,0x2c3e50]))));
  CHAR.hos=[]; for(let i=0;i<3;i++) CHAR.hos.push(recolor(i===0?0:1+Math.floor(R()*4),'#1d1d1d','#30332d','#3a3a3a'));
  CHAR.hvt=mk(x=>x.drawImage(base,0,0,1024,1024));
  CHAR.ready=true;
}
const CHARMATS=new Map();
function charMat(skin){let m=CHARMATS.get(skin); if(!m){m=FX()?new THREE.MeshStandardMaterial({map:skin.tex,skinning:true,roughness:.78,metalness:0,envMapIntensity:.55}):new THREE.MeshLambertMaterial({map:skin.tex,skinning:true}); CHARMATS.set(skin,m);} return m;}
function CHAR_BONE_S(rig,b){const v=new THREE.Vector3(); rig.rest[b].M.decompose(new THREE.Vector3(),new THREE.Quaternion(),v); return v.x;}
function makePersonChar(p,r){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const skin=p.hvt||p.decoy?CHAR.hvt:p.hostile&&!p.plain?pick(r||MR,CHAR.hos):pick(r||MR,CHAR.civ);
  p.top=skin.top; p.pants=skin.pants; p.fore=skin.top;
  const ch=THREE.SkeletonUtils.clone(CHAR.src); const sc=1.75*p.ht/CHAR.H; ch.scale.set(sc*p.bw,sc,sc*p.bw);
  const bones={}; ch.traverse(o=>{ if(o.isBone&&CHAR.boneNames.includes(o.name)) bones[o.name]=o; if(o.isMesh){o.material=charMat(skin); o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false;} });
  const rig={bones,rest:CHAR.rest}; p.rig=rig; p.cur={};
  bones.Head.scale.setScalar(.68); bones.LeftUpLeg.scale.setScalar(1.22); bones.RightUpLeg.scale.setScalar(1.22);
  body.add(ch);
  if(p.hostile&&!p.hvt&&!p.plain){
    const rf=new THREE.Group(); rf.add(new THREE.Mesh(PG.akMetal,mat(0x1b1c1e)),new THREE.Mesh(PG.akWood,mat(0x6b4527))); rf.scale.setScalar(1.25); attach(rig,'UpperChest',rf,new THREE.Vector3(-.1,1.25,.42),new THREE.Quaternion().setFromEuler(new THREE.Euler(.1,.45,0))); rf.scale.setScalar(1.25/CHAR_BONE_S(rig,'UpperChest'));
    attach(rig,'LeftArm',new THREE.Mesh(PG.bandC,mat(0xe0261b)),new THREE.Vector3(.36,1.5,.01));
    attach(rig,'Head',new THREE.Mesh(PG.beanieC,mat(0x121212)),new THREE.Vector3(0,2.08,0));
  }
  if(p.hvt&&!p.driver){ const cs=new THREE.Mesh(PG.caseC,mat(0x3e2a1a)); attach(rig,'RightHand',cs,new THREE.Vector3(-.88,1.3,0)); p.caseObj=cs; }
  const hy=1.58*p.ht;
  const hh=new THREE.Mesh(PG.hbH2,HBMAT); hh.position.y=hy; hh.userData={p,part:'head'};
  const hb=new THREE.Mesh(PG.hbB2,HBMAT); hb.position.y=.68*p.ht; hb.scale.y=p.ht; hb.userData={p,part:'body'};
  body.add(hh,hb);
  root.traverse(o=>{if(o.isMesh&&o.material!==HBMAT){o.castShadow=true;}});
  p.headY=hy;
  return {root,body,hh,hb};
}
const sm=x=>{x=clamp(x,0,1); return x*x*(3-2*x);};
function charTargets(p,moving,run,sw){
  const t={LA:[0,0,-1.25],RA:[0,0,1.25],LF:-.15,RF:.15,LUL:0,RUL:0,LL:0,RL:0,SPx:0,SPz:0,HDy:0,HDx:0};
  const amp=(run?.75:.45)*(p.stride||1);
  if(moving){ t.LUL=-sw*amp; t.RUL=sw*amp; t.LL=Math.max(0,sw)*amp*1.5; t.RL=Math.max(0,-sw)*amp*1.5; t.LA=[sw*amp*.8,0,-1.25]; t.RA=[-sw*amp*.8,0,1.25]; if(run){t.LF=-1.2; t.RF=1.2; t.SPx=.16;} t.HDy=0; }
  else {
    t.SPx=.02*Math.sin(p.ptime*1.6); t.HDy=.4*Math.sin(p.ptime*.35+p.phase); t.HDx=.05*Math.sin(p.ptime*.5);
    t.SPz=.035*Math.sin(p.ptime*.23+p.phase); t.LUL=.05*Math.max(0,Math.sin(p.ptime*.23+p.phase)); t.RUL=.05*Math.max(0,-Math.sin(p.ptime*.23+p.phase)); // weight shift
    if(p.duckT>0){ t.SPx=.6; t.LA=[-1.4,0,-.9]; t.RA=[-1.4,0,.9]; t.LF=-2.0; t.RF=2.0; t.LUL=-1.0; t.RUL=-1.0; t.LL=1.5; t.RL=1.5; t.HDx=.35; t.HDy=0; return t; }
    if(p.startT>0){ t.HDy=p.lookY||0; t.HDx=-.12; t.SPx=-.03; }
    switch(p.startT>0&&p.pose!=='seated'?'stand':p.pose){
      case 'talk': { const g=Math.sin(p.ptime*2.3+p.phase), on=(p.ptime+p.phase)%7<3.5; t.RA=on?[-.35+.2*g,0,1.0]:[0,0,1.25]; t.RF=on?1.3+.45*Math.sin(p.ptime*3.4):.15; t.LA=on?[-.15-.1*g,0,-1.1]:[0,0,-1.25]; t.LF=on?-.9:-.15; t.HDy=(on?.12:.05)*Math.sin(p.ptime*1.1); t.HDx=on?.06*Math.sin(p.ptime*2.7):.03; break; }
      case 'phone': t.RA=[-.3,0,1.0]; t.RF=2.3; t.HDy*=.4; break;
      case 'smoke': {const c=p.ptime%5, up=c>3.4&&c<4.6?1:0; p.sk+=(up-p.sk)*.1; t.RA=[-.2*p.sk,0,1.25-.3*p.sk]; t.RF=.15+1.9*p.sk; break;}
      case 'crossed': t.LA=[0,0,-1.05]; t.RA=[0,0,1.05]; t.LF=-1.75; t.RF=1.75; break;
      case 'hips': t.LA=[0,0,-1.45]; t.RA=[0,0,1.45]; t.LF=-.35; t.RF=.35; t.SPz=.04; break;
      case 'lean': t.SPx=.12; t.SPz=.06; t.RUL=-.2; t.RL=.4; break;
      case 'seated': t.LUL=-1.5; t.RUL=-1.5; t.LL=1.55; t.RL=1.55; t.LA=[.35,-1.3,0]; t.RA=[.35,1.3,0]; t.LF=-.5; t.RF=.5; t.HDy*=.3; break;
    }
  }
  if(p.hostile&&!p.hvt&&!p.plain){ t.LA=[.5,-1.45,0]; t.LF=-.35; t.RA=[.75,1.1,0]; t.RF=1.3; if(!moving) t.HDy=.5*Math.sin(p.ptime*.3+p.phase); }
  return t;
}
function animChar(p,dt,moving,run){
  const rig=p.rig, c=p.cur, k=Math.min(1,dt*(moving?16:5));
  const t=charTargets(p,moving,run,moving?Math.sin(p.phase):0);
  const L=(key,v)=>{ if(Array.isArray(v)){ const a=c[key]||(c[key]=v.slice()); for(let i=0;i<3;i++) a[i]+=(v[i]-a[i])*k; return a;} c[key]=(c[key]===undefined?v:c[key]+(v-c[key])*k); return c[key]; };
  const la=L('LA',t.LA), ra=L('RA',t.RA);
  pose(rig,'LeftArm',la[0],la[1],la[2]); pose(rig,'RightArm',ra[0],ra[1],ra[2]);
  pose(rig,'LeftForeArm',0,L('LF',t.LF),0); pose(rig,'RightForeArm',0,L('RF',t.RF),0);
  pose(rig,'LeftUpLeg',L('LUL',t.LUL),0,0); pose(rig,'RightUpLeg',L('RUL',t.RUL),0,0);
  pose(rig,'LeftLeg',L('LL',t.LL),0,0); pose(rig,'RightLeg',L('RL',t.RL),0,0);
  pose(rig,'Spine',L('SPx',t.SPx),0,L('SPz',t.SPz)); pose(rig,'Neck',L('HDx',t.HDx),L('HDy',t.HDy)*.5,0); pose(rig,'Head',0,c.HDy*.5,0);
}
function deathChar(p){
  const m=p.mesh, rig=p.rig, t=p.deadT, k1=sm(t/.3), k2=sm((t-.24)/.6), hs=p.hitPart==='head'?sm(t/.07)*(1-k1)*.35:0;
  pose(rig,'LeftUpLeg',-1.25*k1*(1-.55*k2),0,0); pose(rig,'RightUpLeg',-1.15*k1*(1-.5*k2),0,0);
  pose(rig,'LeftLeg',2.0*k1*(1-.6*k2),0,0); pose(rig,'RightLeg',1.9*k1*(1-.55*k2),0,0);
  pose(rig,'LeftArm',.3*k1+p.fall*.5*k2,0,-1.4); pose(rig,'RightArm',.3*k1+p.fall*.5*k2,0,1.4); pose(rig,'LeftForeArm',0,-.1,0); pose(rig,'RightForeArm',0,.1,0);
  pose(rig,'Spine',.2*k1,0,0); pose(rig,'Head',.3*k1,0,0);
  m.body.position.y=-.42*k1*(1-k2*.86); m.body.rotation.x=p.fall*1.42*k2-hs; m.body.rotation.z=p.twist*k2;
}

function makePerson(p){
  if(!CHAR.ready){ makePersonBasic(p); return; }
  const m=makePersonChar(p);
  const al=new THREE.Sprite(alertMat); al.position.y=1.95; al.center.set(.5,-1.25); al.visible=false; al.renderOrder=11; m.root.add(al); marks.push(al);
  let mk=null; if(p.hostile){mk=new THREE.Sprite(markMat); mk.position.y=1.95; mk.center.set(.5,-.15); mk.renderOrder=10; mk.visible=markOn(); m.root.add(mk); marks.push(mk);}
  const lod=new THREE.Mesh(lodGeo(p),LODMAT); lod.scale.set(p.bw,p.ht,p.bw); lod.visible=false; m.root.add(lod);
  m.root.position.set(p.x,p.y,p.z); m.root.rotation.y=p.heading; scene.add(m.root);
  p.mesh=Object.assign(m,{al,mk,lod});
}
function randIn(R,r){return {x:rr(r,R.x0,R.x1),z:rr(r,R.z0,R.z1)};}
function goalRaw(p,r){ if(p.seg){const t=r(); return {x:p.seg.a.x+(p.seg.b.x-p.seg.a.x)*t,z:p.seg.a.z+(p.seg.b.z-p.seg.a.z)*t};} return randIn(p.rect,r); }
function goalFor(p,r){ for(let i=0;i<14;i++){ const g=goalRaw(p,r); if(p.hostile&&!p.hunter&&(!aimable(g.x,p.y,g.z)||!los(g.x,p.y+1.4,g.z))) continue; if(!blockedAt(g.x,g.z,p.y)&&pathClear(p.x,p.z,g.x,g.z,p.y)) return g; } return {x:p.x,z:p.z}; }
function fleeGoal(p,pt,dist){ const R=p.rect; let best=null,bd=-1;
  for(let i=0;i<10;i++){ const a=Math.atan2(p.x-pt.x,p.z-pt.z)+(MR()-.5)*2.2, L=dist*(.5+MR()*.5);
    const g={x:clamp(p.x+Math.sin(a)*L,R.x0,R.x1),z:clamp(p.z+Math.cos(a)*L,R.z0,R.z1)};
    if(blockedAt(g.x,g.z,p.y)||!pathClear(p.x,p.z,g.x,g.z,p.y)||(p.hostile&&!aimable(g.x,p.y,g.z))) continue; const d=Math.hypot(g.x-pt.x,g.z-pt.z); if(d>bd){bd=d; best=g;} }
  return best||{x:p.x,z:p.z}; }
function findSpot(type,band,r){
  if(city.spots) return findSpotGeneric(type,band,r);
  if(city.kind==='forest') return findSpotForest(type,band,r);
  const c=city;
  for(let i=0;i<260;i++){
    let pos,rect,y,door=null,b=null;
    if(type==='roof'){
      b=pick(r,c.roofCands); if(!b) return null;
      rect={x0:b.x0+1.4,x1:b.x1-1.4,z0:b.z0+1.4,z1:b.z1-1.4}; y=b.h; pos=randIn(rect,r);
      if(b.hut&&pos.x>b.hut.x0-.5&&pos.x<b.hut.x1+.5&&pos.z>b.hut.z0-.5&&pos.z<b.hut.z1+.5) continue;
      door=b.hut?b.hut.door:null;
    } else if(type==='street'){
      const w=pick(r,c.walks); const a=rr(r,w.a0,w.a1); y=0;
      if(w.ax==='x'){pos={x:a,z:w.c}; rect={x0:Math.max(w.a0,a-55),x1:Math.min(w.a1,a+55),z0:w.c,z1:w.c};}
      else {pos={x:w.c,z:a}; rect={x0:w.c,x1:w.c,z0:Math.max(w.a0,a-55),z1:Math.min(w.a1,a+55)};}
    } else { rect=c.plaza; y=c.plaza.y; pos=randIn(rect,r); if(Math.abs(pos.x)<9&&Math.abs(pos.z+100)<9) continue; }
    const d=Math.hypot(pos.x,pos.z);
    if(d<band[0]||d>band[1]) continue;
    if(Math.abs(Math.atan2(pos.x,-pos.z))>YAW_LIM+.12) continue;
    if(blockedAt(pos.x,pos.z,y,.6)||!aimable(pos.x,y,pos.z)) continue;
    if(!los(pos.x,y+1.6,pos.z)||!los(pos.x,y+1.0,pos.z)) continue;
    return {pos,rect,y,door,b,type,d,ground:false};
  }
  return null;
}
function addPerson(r,hostile,hvt,types,band,move){
  for(let t=0;t<6;t++){
    const type=pick(r,types), s=findSpot(type,band,r); if(!s) continue;
    if(people.some(o=>Math.hypot(o.x-s.pos.x,o.z-s.pos.z)<1.2&&Math.abs(o.y-s.y)<1)) continue;
    return newPerson(r,hostile,hvt,type,s,move);
  }
  return null;
}
function newPerson(r,hostile,hvt,type,s,move,extra){
    const p={hostile,hvt,type,x:s.pos.x,z:s.pos.z,y:s.y,rect:s.rect||{x0:s.pos.x,x1:s.pos.x,z0:s.pos.z,z1:s.pos.z},seg:s.seg||null,ground:!!s.ground,door:s.door,d:s.d||Math.hypot(s.pos.x-EYE.x,s.pos.z-EYE.z),heading:r()*TAU,state:'idle',wait:rr(r,.3,4),
      moving:(type==='street'||type==='road')&&!hostile?true:r()<move,phase:r()*6,vx:0,vz:0,deadT:0,fall:r()<.5?1:-1,
      skin:pick(r,SKIN),top:hostile?(hvt?0xefece2:0x18191a):pick(r,TOPS),pants:hostile?(hvt?0xdcd8cb:0x26292a):pick(r,PANTS)};
    p.cap=hostile&&!hvt?0x0c0c0c:(!hostile&&r()<.25?pick(r,TOPS):pick(r,HAIR));
    p.fore=hostile||r()<.45?p.top:p.skin; p.bw=rr(r,.9,1.1); p.ht=rr(r,.92,1.05); p.ws=rr(r,1.05,1.55); p.stride=rr(r,.85,1.15); p.hearT=0; p.duckT=0; p.startT=0;
    p.pose=hostile?(hvt?pick(r,['phone','stand']):'rifle'):pick(r,['stand','phone','smoke','crossed','hips','lean','stand','phone']); p.ptime=r()*5; p.sk=0; p.twist=0;
    if(hostile&&M&&M.plain) p.plain=true;
    if(extra) Object.assign(p,extra);
    if(p.plain) p.pose=pick(r,['stand','phone','smoke','crossed']);
    makePerson(p); people.push(p); return p;
}

/* ---------- special roles: counter-snipers, VIP escort, getaway driver ---------- */
const glintTex=radialTex('rgba(255,255,255,1)','rgba(160,200,255,0)');
const vipTex=(()=>{const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.beginPath(); x.arc(32,32,26,0,TAU); x.fillStyle='#21b35a'; x.fill(); x.lineWidth=5; x.strokeStyle='#fff'; x.stroke(); x.fillStyle='#fff'; x.font='bold 19px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('VIP',32,33); return new THREE.CanvasTexture(c);})();
const vipMat=new THREE.SpriteMaterial({map:vipTex,depthTest:false,fog:false,sizeAttenuation:false,transparent:true});
function addGlint(p){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glintTex,color:0xdfeaff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,sizeAttenuation:false,opacity:0})); s.position.set(-.1,1.52*p.ht,.42); s.renderOrder=9; p.mesh.root.add(s); p.glint=s; glints.push(s);}
function setupSnipers(r){
  const types=SNT[M.map||'city']||M.types, band=[Math.max(200,M.band[0]),Math.max(M.band[1],420)];
  for(let k=0;k<(M.sn||0);k++){
    const p=addPerson(r,true,false,types,band,0); if(!p) continue;
    p.sniper=true; p.moving=false; p.snPhase='scan'; p.snT=rr(r,10,15)+k*5; p.pose='rifle'; addGlint(p);
  }
}
function setupEscort(r){
  const W=city.walks.filter(w=>w.ax==='x'&&-w.c>M.band[0]&&-w.c<M.band[1]);
  // find the longest stretch of each sidewalk that is fully visible and aimable from the rooftop
  const runOf=w=>{let best=[0,0],cur=null; for(let x=-240;x<=240;x+=3){const ok=aimable(x,0,w.c)&&los(x,1.7,w.c)&&los(x,.9,w.c)&&!blockedAt(x,w.c,0,.6); if(ok){ if(cur===null) cur=x; if(x-cur>best[1]-best[0]) best=[cur,x]; } else cur=null;} return best;};
  let best=null,run=null;
  for(const w of W){const r2=runOf(w); if(!run||r2[1]-r2[0]>run[1]-run[0]){run=r2; best=w;}}
  if(!best||run[1]-run[0]<60) return false;
  const a0=run[0]+5, a1=run[1]-5;
  const seg={a:{x:a0,z:best.c},b:{x:a1,z:best.c}}, s={pos:{x:a0+Math.min(15,(a1-a0)*.2),z:best.c},rect:{x0:a0,x1:a1,z0:best.c,z1:best.c},seg,y:0,ground:false};
  const v=newPerson(r,false,false,'street',s,1,{vip:true}); v.moving=true; v.pose='phone';
  const vm=new THREE.Sprite(vipMat); vm.position.y=1.95; vm.center.set(.5,-.15); vm.renderOrder=10; v.mesh.root.add(vm); marks.push(vm);
  const other=city.walks.find(w=>w.ax==='x'&&Math.abs(Math.abs(w.c-best.c)-12.6)<.5);
  const orun=other?runOf(other):null;
  escort={vip:v,line:best,other:orun&&orun[1]-orun[0]>40?other:null,run:[a0,a1],orun,pending:M.hos,t:4};
  return true;
}
function spawnHunter(){
  const v=escort.vip; if(!alive(v)) return true;
  for(let i=0;i<24;i++){
    const useO=escort.other&&MR()<.5, w=useO?escort.other:escort.line, R=useO?[Math.max(escort.run[0],escort.orun[0]+3),Math.min(escort.run[1],escort.orun[1]-3)]:escort.run;
    if(R[1]-R[0]<20) continue;
    const x=clamp(v.x+(MR()<.5?-1:1)*rr(MR,35,65),R[0],R[1]);
    if(Math.abs(x-v.x)<25||!aimable(x,0,w.c)||!los(x,1.6,w.c)||blockedAt(x,w.c,0,.6)) continue;
    const s={pos:{x,z:w.c},rect:{x0:-240,x1:240,z0:w.c,z1:w.c},y:0,ground:false};
    const h=newPerson(MR,true,false,'street',s,0,{hunter:true}); h.moving=true;
    pops.push({w:V3().set(x,2.4,w.c),t:0,txt:'ATTACKER',c:'#ff8a00'}); rebuildHits(); return true;
  }
  return false;
}
function buildGetawayCar(){
  const g=new THREE.Group(), col=0x1a2f4a, m=(geo,c,o)=>{const x=new THREE.Mesh(geo,new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))); x.userData.own=true; x.castShadow=true; g.add(x); return x;};
  m(new THREE.BoxGeometry(1.9,.8,4.6),col).position.y=.7;
  const gl=m(new THREE.BoxGeometry(1.76,.56,2.4),0x9fb8cc,{transparent:true,opacity:.28,depthWrite:false}); gl.position.set(0,1.38,-.15); gl.castShadow=false;
  m(new THREE.BoxGeometry(1.78,.08,2.3),col).position.set(0,1.7,-.15);
  for(const [x,z] of [[-.88,1.15],[.88,1.15],[-.88,-.95],[.88,-.95]]) m(new THREE.BoxGeometry(.1,.62,.1),col).position.set(x,1.38,z);
  for(const [wx,wz] of [[-.92,1.4],[.92,1.4],[-.92,-1.4],[.92,-1.4]]) m(new THREE.CylinderGeometry(.37,.37,.26,12).rotateZ(Math.PI/2),0x111111).position.set(wx,.37,wz);
  world.add(g); return g;
}
function setupGetaway(r){
  const pts=city.county; if(!pts) return false;
  const g=buildGetawayCar(); let len=0; const segs=[]; for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b.x-a.x,b.z-a.z); segs.push({a,b,L,s0:len}); len+=L;}
  // two stop signs where the road is in good view; the driver halts at each unless spooked
  const sAt=x=>{for(const q of segs) if(x>=Math.min(q.a.x,q.b.x)&&x<=Math.max(q.a.x,q.b.x)) return q.s0+q.L*(x-q.a.x)/(q.b.x-q.a.x); return 0;};
  const stops=[-240,170].map(x=>({s:sAt(x),done:false,t:0}));
  for(const st of stops){ let sg=segs[0]; for(const q of segs) if(st.s<=q.s0+q.L){sg=q; break;} const k=(st.s-sg.s0)/sg.L, x=sg.a.x+(sg.b.x-sg.a.x)*k, z=sg.a.z+(sg.b.z-sg.a.z)*k;
    const sign=new THREE.Group(); const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.3,6),mat(0xbfbfbf)); pole.position.y=1.15; sign.add(pole);
    const oct=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.04,8).rotateX(Math.PI/2).rotateZ(Math.PI/8),new THREE.MeshLambertMaterial({color:0xc8221c,emissive:0x300000})); oct.position.y=2.3; sign.add(oct);
    sign.traverse(o=>o.userData.own=true); sign.position.set(x+3.2,city.gY(x,z+3.2),z+3.2); world.add(sign); }
  getaway={g,segs,len,s:390,v:6,boost:false,driver:null,stops};
  posGetaway();
  const s={pos:{x:g.position.x,z:g.position.z},y:g.position.y,ground:false};
  getaway.driver=newPerson(r,true,true,'car',s,0,{driver:true,pose:'seated'});
  getaway.driver.d=Math.hypot(0,-pts[0].z);
  getaway.driver.mesh.hh.scale.setScalar(1.6); getaway.driver.mesh.hb.scale.set(1.35,1,1.35); // through-glass shot at 400 m+: a little forgiveness
  return true;
}
function posGetaway(){
  const G=getaway; let sg=G.segs[G.segs.length-1]; for(const q of G.segs) if(G.s<=q.s0+q.L){sg=q; break;}
  const k=clamp((G.s-sg.s0)/sg.L,0,1), x=sg.a.x+(sg.b.x-sg.a.x)*k, z=sg.a.z+(sg.b.z-sg.a.z)*k, h=Math.atan2(sg.b.x-sg.a.x,sg.b.z-sg.a.z);
  G.g.position.set(x,city.gY(x,z)+.35,z); G.g.rotation.y=h; G.dir={x:Math.sin(h),z:Math.cos(h)};
}
function updateGetaway(dt){
  const G=getaway, d=G.driver; if(!d) return;
  const live=alive(d);
  let vmax=G.dead?0:G.flat?2.2:G.boost?9:6;
  if(live&&!G.boost) for(const st of G.stops){ if(st.done||G.s>st.s+.5) continue; const gap=st.s-G.s; vmax=Math.min(vmax,Math.sqrt(2*3.5*Math.max(0,gap))); if(gap<.6&&G.v<.3){ st.t+=dt; if(st.t>4.5) st.done=true; } break; }
  G.v=live?(G.v<vmax?Math.min(vmax,G.v+3*dt):Math.max(vmax,G.v-6*dt)):Math.max(0,G.v-7*dt);
  // lead marker: where to put the crosshair so the round meets the moving driver
  if(!G.lead){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.strokeStyle='#38e1ff'; x.lineWidth=6; x.beginPath(); x.moveTo(32,6); x.lineTo(58,32); x.lineTo(32,58); x.lineTo(6,32); x.closePath(); x.stroke(); x.fillStyle='#38e1ff'; x.fillRect(29,29,6,6);
    G.lead=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,depthWrite:false,fog:false,transparent:true})); G.lead.renderOrder=10; world.add(G.lead); }
  { const sp=Math.hypot(d.vx||0,d.vz||0), dist=Math.hypot(d.x-EYE.x,d.y+1-EYE.y,d.z-EYE.z), t=tofAt(dist);
    G.lead.visible=live&&sp>.4&&scoped&&state==='play'&&markOn();
    G.lead.position.set(d.x+d.vx*t,d.y+1.5,d.z+d.vz*t); const sc=dist*.006; G.lead.scale.set(sc,sc,1); }
  G.s=Math.min(G.len,G.s+G.v*dt); posGetaway();
  const h=G.g.rotation.y, cx=G.g.position.x+Math.cos(h)*-.45+Math.sin(h)*-.1, cz=G.g.position.z-Math.sin(h)*-.45+Math.cos(h)*-.1;
  d.x=cx; d.z=cz; d.y=G.g.position.y-.12; d.heading=h; d.vx=live?G.dir.x*G.v:0; d.vz=live?G.dir.z*G.v:0;
  if(live&&G.g.position.x>0&&Math.abs(Math.atan2(G.g.position.x-EYE.x,-(G.g.position.z-EYE.z)))>YAW_LIM+.08&&state==='play'&&!endInfo) fail('The target drove out of sight.');
}
function sniperFire(p){
  if(typeof gearShield==='function'&&gearShield()) return;
  snd.crack(); hurt=1; kick=1.8; playerHp--; if(navigator.vibrate&&save.opts.haptic!==false) try{navigator.vibrate([60,40,90]);}catch(e){}
  if(playerHp<=0) fail(M.fight?'You were shot.':'A counter-sniper took you out.');
  else { hintMsg=M.fight?(playerHp===1?'You were hit. One more and you’re down.':'You were hit. Drop whoever has the red ring first.'):'You were hit. One more and you’re down. Find the glint.'; hintT=4; }
}

/* ---------- environmental hazards (accident kills) ---------- */
let hazards=[];
const hzMarkTex=(()=>{const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.beginPath(); x.moveTo(32,6); x.lineTo(58,52); x.lineTo(6,52); x.closePath(); x.fillStyle='#3fb8ff'; x.fill(); x.lineWidth=4; x.strokeStyle='#04121c'; x.stroke(); x.fillStyle='#04121c'; x.font='bold 30px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('!',32,36); return new THREE.CanvasTexture(c);})();
const hzMarkMat=new THREE.SpriteMaterial({map:hzMarkTex,depthTest:false,fog:false,sizeAttenuation:false,transparent:true});
function hzMark(g,y){const s=new THREE.Sprite(hzMarkMat); s.position.y=y; s.center.set(.5,-.1); s.renderOrder=10; s.visible=markOn(); g.add(s); marks.push(s); return s;}
function addHazard(p,kind,r){
  const vx=p.x-EYE.x, vz=p.z-EYE.z, vl=Math.hypot(vx,vz)||1, side=r()<.5?-1:1, px=-vz/vl*side, pz=vx/vl*side;
  const off={boom:1.9,car:3.4,tree:4.4,drop:0}[kind];
  const g=new THREE.Group(); g.position.set(p.x+px*off,p.y,p.z+pz*off); world.add(g);
  const mk=(geo,col,par)=>{const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col})); m.userData.own=true; m.castShadow=true; (par||g).add(m); return m;};
  const box=(w,h,d,col,x,y,z,par)=>{const m=mk(new THREE.BoxGeometry(w,h,d),col,par); m.position.set(x,y,z); return m;};
  const cyl=(rt,h,col,x,y,z,par)=>{const m=mk(new THREE.CylinderGeometry(rt,rt,h,14),col,par); m.position.set(x,y,z); return m;};
  const hz={kind,g,p,done:false,x:p.x,y:p.y,z:p.z,cx:g.position.x,cz:g.position.z};
  if(kind==='boom'){
    for(let i=0;i<3;i++){const cx=(i-1)*.45, cz=(i%2)*.3; cyl(.22,1.25,0xc42a1c,cx,.62,cz); cyl(.12,.14,0x9a9a9a,cx,1.32,cz);}
    box(.5,.35,.04,0xf2d21a,0,.95,.32);
    hz.cy=p.y+.7; hz.radius=5.5;
    const hb=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.1),HBMAT); hb.position.set(0,.7,0); hb.userData={hz}; g.add(hb); hz.hb=hb;
    hzMark(g,1.6); obC(hz.cx,hz.cz,.8,p.y-1,p.y+1.4);
  } else if(kind==='car'){
    const cg=new THREE.Group(); cg.rotation.y=Math.atan2(px,pz); g.add(cg); const col=pick(r,CARS);
    box(1.85,.9,4.4,col,0,.7,0,cg); box(1.65,.62,2.3,0x1d2630,0,1.45,-.25,cg); box(1.7,.08,2.2,col,0,1.79,-.25,cg);
    for(const [wx,wz] of [[-.9,1.35],[.9,1.35],[-.9,-1.35],[.9,-1.35]]){const w=mk(new THREE.CylinderGeometry(.36,.36,.26,12).rotateZ(Math.PI/2),0x111111,cg); w.position.set(wx,.36,wz);}
    box(.06,.16,.16,0x333333,.94,.95,-1.3,cg); box(.04,.22,.3,0xff2a1a,-.94,.95,-1.3,cg);
    hz.cy=p.y+.8; hz.radius=6.5; hz.car=cg;
    const hb=new THREE.Mesh(new THREE.BoxGeometry(2,1.7,4.6),HBMAT); hb.position.y=.85; hb.userData={hz}; cg.add(hb); hz.hb=hb;
    hzMark(g,2.3); obC(hz.cx,hz.cz,2.4,p.y-1,p.y+2);
  } else if(kind==='tree'){
    g.rotation.y=Math.atan2(-px,-pz);
    const tilt=new THREE.Group(); g.add(tilt); const sc=1.35;
    const tr=mk(new THREE.CylinderGeometry(.24*sc,.36*sc,3.6*sc,8),0x4a3524,tilt); tr.position.y=1.8*sc;
    for(const [rr2,hh,yy] of [[2.6,5,4.6],[2.0,4.2,6.9],[1.3,3.2,8.9]]){const c=mk(new THREE.ConeGeometry(rr2*sc,hh*sc,8),0x2d4a26,tilt); c.position.y=yy*sc;}
    box(.5,.35,.3,0xd9b27a,0,.75,.28,tilt);
    hz.tilt=tilt; hz.ang=0; hz.w=0; hz.len=11*sc; hz.dir={x:-px,z:-pz};
    const hb=new THREE.Mesh(new THREE.BoxGeometry(1,2.6,1),HBMAT); hb.position.y=1.3; hb.userData={hz}; g.add(hb); hz.hb=hb;
    hzMark(g,3.2); obC(hz.cx,hz.cz,.6,p.y-1,p.y+14);
  } else {
    const h=8.5, qx=px*2.6, qz=pz*2.6;
    box(.25,h,.25,0x3a3d42,qx,h/2,qz); const L=2.6; const arm=box(L+.4,.22,.22,0x3a3d42,qx/2,h,qz/2); arm.rotation.y=-Math.atan2(-qz,-qx);
    const load=new THREE.Group(); load.position.set(0,5.2,0); g.add(load);
    box(1.7,1.3,1.7,0x8a6a44,0,.65,0,load); box(1.74,.12,1.74,0x2a2a2a,0,.9,0,load);
    const rope=box(.05,1,.05,0x222222,0,0,0); hz.load=load; hz.rope=rope; hz.top=h; hz.vy=0; hz.radius=2.6;
    const hb=new THREE.Mesh(new THREE.BoxGeometry(1.9,2.6,1.9),HBMAT); hb.position.y=.9; hb.userData={hz}; load.add(hb); hz.hb=hb;
    hzMark(load,2.0); obC(p.x+qx,p.z+qz,.3,p.y-1,p.y+9);
  }
  hazards.push(hz); return hz;
}
const HZPREF={city:{street:['car'],roof:['drop','boom'],plaza:['drop','boom']},forest:{camp:['tree','boom'],meadow:['tree','boom'],road:['tree','boom'],deck:['boom']},
  farm:{yard:['drop','boom'],field:['boom','drop'],road:['car']},harbor:{stack:['boom'],aisle:['drop','boom'],quay:['car','drop'],ship:['drop','boom']},office:{floor:['boom'],street:['car'],roof:['drop','boom']}};
function placeHazards(r){
  hazards=[];
  const want=1+(mi>=4?1:0)+(mi>=9?1:0), pref=HZPREF[M.map||'city']||{};
  const cands=people.filter(p=>p.hostile&&!p.hvt&&!p.sniper&&!p.hunter&&!p.driver).sort(()=>r()-.5);
  const used={};
  for(const p of cands){
    if(hazards.length>=want) break;
    const list=pref[p.type]; if(!list||!list.length) continue;
    const kind=list[((used[p.type]=(used[p.type]||0)+1)-1)%list.length];
    const n0=obst.length, hz=addHazard(p,kind,r);
    scene.updateMatrixWorld(true);
    const ty=kind==='drop'?p.y+6:kind==='tree'?p.y+1.4:p.y+.9, tx=kind==='drop'?p.x:hz.cx, tz=kind==='drop'?p.z:hz.cz;
    const mine=obst.splice(n0), bad=kind!=='drop'&&blockedAt(hz.cx,hz.cz,p.y,kind==='car'?2:.6); obst.push(...mine);
    if(bad||!los(tx,ty,tz)){ world.remove(hz.g); hazards.pop(); obst.length=n0; continue; }
    p.moving=false; p.state='idle'; if(!p.hostile||p.pose!=='rifle') p.pose=pick(r,['stand','phone','smoke']);
  }
}
function triggerHazard(hz,dist){
  if(hz.done) return; hz.done=true; hz.g.traverse(o=>{if(o.isSprite&&o.material===hzMarkMat) o.visible=false;});
  const hit=hitList.indexOf(hz.hb); if(hit>=0) hitList.splice(hit,1);
  if(hz.kind==='boom'||hz.kind==='car') detonate(hz,dist);
  else if(hz.kind==='tree'){ hz.felling=true; snd.thud(dist*.5); }
  else { hz.falling=true; snd.click(); }
}
function detonate(hz,dist){
  const pt=V3().set(hz.cx,hz.cy,hz.cz);
  if(hz.car) hz.car.traverse(o=>{if(o.isMesh&&o!==hz.hb){o.material.color.setHex(0x161412);}}); else for(const o of hz.g.children) if(o.isMesh&&o!==hz.hb) o.visible=false;
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffa040,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); fl.position.copy(pt); scene.add(fl);
  fx.push({s:fl,vx:0,vy:0,vz:0,t:0,life:.6,sz:9,op:1,g:1.2});
  for(let i=0;i<14;i++){const m=new THREE.SpriteMaterial({map:puffTex,color:i<5?0x553322:0x3a3a3a,transparent:true,depthWrite:false,opacity:.85}); const s=new THREE.Sprite(m); s.position.copy(pt); scene.add(s); fx.push({s,vx:(MR()-.5)*6,vy:MR()*5+1.5,vz:(MR()-.5)*6,t:0,life:rr(MR,1.2,2.4),sz:rr(MR,1.2,2.4),op:.85,g:2.2});}
  snd.boom(dist); accidentAt(pt,hz.radius,dist);
}
function accidentAt(pt,radius,dist){
  let anyHostile=false;
  for(const p of people){ if(!alive(p)) continue; const d=Math.hypot(p.x-pt.x,(p.y+1)-pt.y,p.z-pt.z); if(d<radius){ if(p.hostile) anyHostile=true; kill(p,'body',V3().set(p.x,p.y+1,p.z),dist,null,true); } }
  if(anyHostile&&stats) stats.hits++;
  for(const p of people){ if(alive(p)&&!p.hostile&&Math.hypot(p.x-pt.x,p.z-pt.z)<28) panicP(p,pt); }
}
function accidentLine(x,z,dir,len,width,y,dist){
  let anyHostile=false;
  for(const p of people){ if(!alive(p)||Math.abs(p.y-y)>2.5) continue; const t=(p.x-x)*dir.x+(p.z-z)*dir.z; if(t<0||t>len) continue; const d=Math.abs((p.x-x)*dir.z-(p.z-z)*dir.x); if(d<width){ if(p.hostile) anyHostile=true; kill(p,'body',V3().set(p.x,p.y+1,p.z),dist,null,true);} }
  if(anyHostile&&stats) stats.hits++;
  for(const p of people){ if(alive(p)&&!p.hostile&&Math.hypot(p.x-x,p.z-z)<25) panicP(p,{x,y,z}); }
}
function updateHazards(dt){
  for(const hz of hazards){
    if(hz.felling){ hz.w+=3.2*dt*(.35+Math.sin(hz.ang)); hz.ang=Math.min(Math.PI/2,hz.ang+hz.w*dt); hz.tilt.rotation.x=hz.ang;
      if(hz.ang>=Math.PI/2-1e-3){ hz.felling=false; const d=EYE.distanceTo(V3().set(hz.cx,hz.y,hz.cz)); for(let k=2;k<hz.len;k+=3) puff(V3().set(hz.cx+hz.dir.x*k,hz.y+.6,hz.cz+hz.dir.z*k),1.6,false); snd.thud(d); accidentLine(hz.cx,hz.cz,hz.dir,hz.len,1.7,hz.y,d);} }
    if(hz.rope&&!hz.falling&&!hz.landed){ const top=hz.top, bot=hz.load.position.y+1.3; hz.rope.scale.y=Math.max(.01,top-bot); hz.rope.position.set(0,(top+bot)/2,0); hz.load.rotation.y=Math.sin(T*.4+hz.x)*.06; }
    if(hz.falling){ hz.vy+=9.8*dt; hz.load.position.y-=hz.vy*dt; hz.rope.visible=false;
      if(hz.load.position.y<=0){ hz.load.position.y=0; hz.falling=false; hz.landed=true; const pt=V3().set(hz.cx,hz.y+.6,hz.cz); puff(pt,2.2,false); puff(pt,1.6,false); snd.thud(EYE.distanceTo(pt)); accidentAt(pt,hz.radius,EYE.distanceTo(pt)); } }
  }
}
function rebuildHits(){ hitList=solid.slice(); for(const p of people) if(alive(p)) hitList.push(p.mesh.hh,p.mesh.hb); for(const h of hazards) if(!h.done) hitList.push(h.hb); }
const alive=p=>p.state!=='dead'&&p.state!=='gone';

