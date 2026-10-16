/* Longshot 3D · render.js · renderer, shared textures, player rifle */
'use strict';
/* ---------- renderer ---------- */
const app=$('#app'), glc=$('#gl'), ov=$('#ov'), octx=ov.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'});
renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=save.opts.shadows!==false; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
let sunLight=null; const waterTex=[], clouds=[];
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(BASE_FOV,1,.35,3600); camera.rotation.order='YXZ'; scene.add(camera);
let W=1,H=1,ODPR=1;
function resize(){
  const r=app.getBoundingClientRect(); W=Math.max(1,r.width); H=Math.max(1,r.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,save.opts.hq?2:(Math.min(W,H)<500?1.15:1.3)));
  renderer.setSize(W,H,false);
  ODPR=Math.min(2,window.devicePixelRatio||1); ov.width=Math.round(W*ODPR); ov.height=Math.round(H*ODPR);
  camera.aspect=W/H; camera.updateProjectionMatrix();
}
addEventListener('resize',resize); resize();
const ANISO=Math.min(8,renderer.capabilities.getMaxAnisotropy());

/* ---------- shared assets ---------- */
function radialTex(inner,outer){
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,inner); g.addColorStop(1,outer); x.fillStyle=g; x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
const GRAIN=(()=>{const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,256,256);
  const R=mulberry(99); for(let i=0;i<260;i++){const rr2=4+R()*28; x.fillStyle=`rgba(0,0,0,${.01+R()*.025})`; x.beginPath(); x.arc(R()*256,R()*256,rr2,0,TAU); x.fill();}
  for(let i=0;i<9000;i++){x.fillStyle=R()<.5?`rgba(0,0,0,${R()*.12})`:`rgba(255,255,255,${R()*.1})`; x.fillRect(R()*256,R()*256,1.5,1.5);}
  return c;})();
/* lawn detail for green ground: clover-dark patches, sun-bleached spots, a field of short blade strokes */
const GRASS=(()=>{const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='rgb(196,204,188)'; x.fillRect(0,0,256,256);
  const R=mulberry(41); const spot=(cx,cy,rad,col)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,rad); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; for(const ox of [-256,0,256]) for(const oy of [-256,0,256]){ x.beginPath(); x.arc(cx+ox,cy+oy,rad,0,TAU); x.fill(); } };
  for(let i=0;i<26;i++) spot(R()*256,R()*256,20+R()*46,R()<.5?'rgba(60,90,30,.22)':'rgba(255,240,170,.22)');
  for(let i=0;i<5200;i++){ const px=R()*256, py=R()*256, l=2+R()*4, v=R(); x.strokeStyle=v<.5?`rgba(30,60,20,${.1+R()*.2})`:`rgba(255,255,230,${.08+R()*.2})`; x.lineWidth=1; x.beginPath(); x.moveTo(px,py); x.lineTo(px+(R()-.5)*1.6,py-l); x.stroke(); }
  return c;})();
/* paving for light grey ground: square slabs with worn joints and a few stains */
const PAVE=(()=>{const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'), R=mulberry(77); x.fillStyle='rgb(214,212,206)'; x.fillRect(0,0,256,256);
  for(let i=0;i<8;i++) for(let j=0;j<8;j++){ const v=R()*18-9; x.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?240:0},${Math.abs(v)/100})`; x.fillRect(i*32,j*32,32,32); }
  x.fillStyle='rgba(60,55,50,.35)'; for(let i=0;i<=8;i++){ x.fillRect(i*32-1,0,2,256); x.fillRect(0,i*32-1,256,2); }
  for(let i=0;i<14;i++){ const g=x.createRadialGradient(0,0,0,0,0,10+R()*20); g.addColorStop(0,'rgba(70,60,50,.12)'); g.addColorStop(1,'rgba(70,60,50,0)'); x.save(); x.translate(R()*256,R()*256); x.fillStyle=g; x.fillRect(-30,-30,60,60); x.restore(); }
  for(let i=0;i<3000;i++){ x.fillStyle=R()<.5?`rgba(0,0,0,${R()*.08})`:`rgba(255,255,255,${R()*.08})`; x.fillRect(R()*256,R()*256,1.5,1.5); }
  return c;})();
function grainTex(rep){const t=new THREE.CanvasTexture(GRAIN); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep); t.anisotropy=ANISO; return t;}
const baseGrad=(()=>{const c=document.createElement('canvas'); c.width=4; c.height=64; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.6)'); x.fillStyle=g; x.fillRect(0,0,4,64); return new THREE.CanvasTexture(c);})();
/* toy-like tree crowns: a cluster of smooth lobes instead of one faceted ball */
function puffyCanopy(R,seed){ const rnd=mulberry(seed||7), parts=[[new THREE.IcosahedronGeometry(R*.78,1),0,0,0]];
  for(let i=0;i<2;i++){ const a=i*3.14+rnd()*.8, rr2=R*(.5+rnd()*.14); parts.push([new THREE.IcosahedronGeometry(rr2,1),Math.cos(a)*R*.52,(rnd()-.35)*R*.42,Math.sin(a)*R*.52]); }
  parts.push([new THREE.IcosahedronGeometry(R*.5,1),0,R*.52,0]); return geoOf(parts); }
/* storybook cumulus: stacked soft lobes, white on top, a cool shaded belly */
const cloudTexes=[11,23,37].map(seed=>{ const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'), R=mulberry(seed);
  const blob=(cx,cy,rad)=>{ const g=x.createRadialGradient(cx,cy,0,cx,cy,rad); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.62,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,rad,0,TAU); x.fill(); };
  for(let i=0;i<9;i++){ const t=i/8; blob(40+t*176+(R()-.5)*16,78-Math.sin(t*Math.PI)*26+(R()-.5)*10,22+Math.sin(t*Math.PI)*22+R()*8); }
  for(let i=0;i<5;i++) blob(60+R()*136,92+R()*8,18+R()*8);
  x.globalCompositeOperation='source-atop'; const sh=x.createLinearGradient(0,30,0,120); sh.addColorStop(0,'rgba(255,255,255,0)'); sh.addColorStop(.55,'rgba(150,165,190,.25)'); sh.addColorStop(1,'rgba(110,125,155,.55)'); x.fillStyle=sh; x.fillRect(0,0,256,128);
  const t=new THREE.CanvasTexture(c); return t; });
const puffTex=radialTex('rgba(255,255,255,1)','rgba(255,255,255,0)');
const glowTex=radialTex('rgba(255,255,255,1)','rgba(255,255,255,0)');
const alertTex=(()=>{const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.fillStyle='#ff4436'; x.beginPath(); x.arc(32,32,28,0,TAU); x.fill(); x.fillStyle='#fff'; x.font='bold 46px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('!',32,35); return new THREE.CanvasTexture(c);})();
const alertMat=new THREE.SpriteMaterial({map:alertTex,depthTest:false,fog:false,sizeAttenuation:false});
const MARKCOL={orange:'#ff8a00',red:'#ff3b2f',cyan:'#19d3ff',white:'#f6f6f6'};
function markTexFor(col){const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.beginPath(); x.moveTo(9,11); x.lineTo(55,11); x.lineTo(32,53); x.closePath(); x.lineJoin='round'; x.lineWidth=9; x.strokeStyle='#000'; x.stroke(); x.fillStyle=MARKCOL[col]||MARKCOL.orange; x.fill(); x.lineWidth=2.5; x.strokeStyle=col==='white'?'#000':'#fff'; x.stroke(); return new THREE.CanvasTexture(c);}
const markMat=new THREE.SpriteMaterial({map:markTexFor(save.opts.markCol||'orange'),depthTest:false,fog:false,sizeAttenuation:false,transparent:true});
const marks=[];
const MAT=new Map();
function mat(c){let m=MAT.get(c); if(!m){m=new THREE.MeshLambertMaterial({color:c}); MAT.set(c,m);} return m;}
const HBMAT=new THREE.MeshBasicMaterial({visible:false});
/* merged-geometry helpers (shared by the rifle, people and every map) */
function Col(){return {p:[],n:[],u:[],i:[]};}
function addBox(col,w,h,d,x,y,z,faces,uvf){
  const g=new THREE.BoxGeometry(w,h,d), pos=g.attributes.position, nor=g.attributes.normal, uv=g.attributes.uv, idx=g.index;
  for(const f of faces){
    const base=col.p.length/3, s=uvf?uvf(f):null;
    for(let v=f*4;v<f*4+4;v++){
      col.p.push(pos.getX(v)+x,pos.getY(v)+y,pos.getZ(v)+z); col.n.push(nor.getX(v),nor.getY(v),nor.getZ(v));
      let U=uv.getX(v),V=uv.getY(v); if(s){U=U*s[0]+s[2]; V=V*s[1];} col.u.push(U,V);
    }
    for(let k=f*6;k<f*6+6;k++) col.i.push(idx.getX(k)-f*4+base);
  }
  g.dispose();
}
function addGeo(col,g,x,y,z){
  const pos=g.attributes.position, nor=g.attributes.normal, uv=g.attributes.uv, base=col.p.length/3;
  for(let v=0;v<pos.count;v++){col.p.push(pos.getX(v)+x,pos.getY(v)+y,pos.getZ(v)+z); col.n.push(nor.getX(v),nor.getY(v),nor.getZ(v)); col.u.push(uv?uv.getX(v):0,uv?uv.getY(v):0);}
  if(g.index) for(let k=0;k<g.index.count;k++) col.i.push(g.index.getX(k)+base); else for(let k=0;k<pos.count;k++) col.i.push(base+k);
}
function toMesh(col,m){
  if(!col.i.length) return null;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(col.p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(col.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(col.u,2));
  g.setIndex(col.i); g.computeBoundingSphere(); g.computeBoundingBox();
  const mesh=new THREE.Mesh(g,m); mesh.userData.own=true; mesh.matrixAutoUpdate=false; mesh.updateMatrix();
  return mesh;
}

let obst=[];
function geoOf(parts){const c=Col(); for(const [g,x,y,z] of parts){addGeo(c,g,x,y,z); g.dispose();} const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(c.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(c.n,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(c.u,2)); g.setIndex(c.i); g.computeBoundingSphere(); return g;}
const cyl=(rt,rb,len,seg=8)=>new THREE.CylinderGeometry(rt,rb,len,seg).translate(0,-len/2,0);
const PG={
  thigh:cyl(.08,.058,.45),
  shin:geoOf([[cyl(.055,.042,.43),0,0,0],[new THREE.BoxGeometry(.1,.07,.25),0,-.465,.05]]),
  pelvis:new THREE.BoxGeometry(.32,.2,.2),
  torso:new THREE.CylinderGeometry(.2,.155,.52,10).scale(1,1,.62),
  head:geoOf([[new THREE.SphereGeometry(.105,14,10).scale(1,1.12,1.05),0,0,0],[new THREE.CylinderGeometry(.05,.055,.12,8),0,-.14,0]]),
  cap:new THREE.SphereGeometry(.112,14,6,0,TAU,0,Math.PI*.5).scale(1,1.1,1.07),
  upper:cyl(.048,.04,.3),
  fore:geoOf([[cyl(.04,.032,.27),0,0,0],[new THREE.SphereGeometry(.042,8,6),0,-.29,0]]),
  rifle:new THREE.BoxGeometry(.05,.07,1.0),
  band:new THREE.BoxGeometry(.11,.07,.11),
  bcase:new THREE.BoxGeometry(.1,.3,.42),
  tie:new THREE.BoxGeometry(.06,.3,.02),
  hbH:new THREE.SphereGeometry(.14,8,6),
  hbB:new THREE.BoxGeometry(.46,1.5,.34),
  hbH2:new THREE.SphereGeometry(.18,8,6), hbB2:new THREE.BoxGeometry(.5,1.36,.36),
  rifleC:new THREE.BoxGeometry(.07,.1,1.3),
  akMetal:null, akWood:null, bandC:new THREE.CylinderGeometry(.075,.075,.1,10).rotateZ(Math.PI/2),
  beanieC:new THREE.SphereGeometry(.4,16,8,0,Math.PI*2,0,Math.PI*.5).scale(1.02,.72,1.02), caseC:new THREE.BoxGeometry(.12,.35,.5)
};
const CG={body:new THREE.BoxGeometry(1.8,.95,4.4),cab:new THREE.BoxGeometry(1.6,.7,2.3),glass:new THREE.BoxGeometry(1.62,.5,2.32)};

PG.akMetal=geoOf([[new THREE.BoxGeometry(.05,.075,.32),0,0,.02],[new THREE.CylinderGeometry(.011,.011,.46,8).rotateX(Math.PI/2),0,.008,-.37],[new THREE.CylinderGeometry(.009,.009,.26,8).rotateX(Math.PI/2),0,.038,-.26],
  [new THREE.BoxGeometry(.012,.045,.015),0,.035,-.58],[new THREE.BoxGeometry(.034,.16,.07).rotateX(.32),0,-.11,-.04],[new THREE.BoxGeometry(.034,.08,.07).rotateX(.55),0,-.2,-.09],[new THREE.BoxGeometry(.012,.03,.06),0,.05,.06]]);
PG.akWood=geoOf([[new THREE.BoxGeometry(.06,.065,.2),0,.005,-.2],[new THREE.BoxGeometry(.045,.085,.3).rotateX(-.12),0,-.035,.33],[new THREE.BoxGeometry(.035,.09,.045).rotateX(.4),0,-.075,.14]]);
/* player's rifle: bolt-action with scope, bipod and polymer stock, built from parts */
const cylZ=(r1,r2,len,seg)=>new THREE.CylinderGeometry(r1,r2,len,seg||14).rotateX(Math.PI/2);
const rifle=new THREE.Group();
{const metalM=new THREE.MeshPhongMaterial({color:0x24272b,specular:0x6a6f76,shininess:70,emissive:0x0b0c0d});
 const polyM=new THREE.MeshPhongMaterial({color:0x4b4f3c,specular:0x262626,shininess:14,emissive:0x0a0b08});
 const rubM=new THREE.MeshLambertMaterial({color:0x121212,emissive:0x050505});
 const metal=geoOf([
  [cylZ(.0125,.0095,.62),0,0,-.43],[cylZ(.017,.017,.07),0,0,-.775],[cylZ(.019,.019,.01),0,0,-.742],[new THREE.BoxGeometry(.006,.02,.04),.017,0,-.775],[new THREE.BoxGeometry(.006,.02,.04),-.017,0,-.775],
  [new THREE.BoxGeometry(.046,.05,.26),0,0,0],[cylZ(.021,.021,.09),0,0,.16],[new THREE.BoxGeometry(.03,.012,.22),0,.031,0],
  [cylZ(.024,.024,.022),0,.064,-.07],[cylZ(.024,.024,.022),0,.064,.07],[new THREE.BoxGeometry(.03,.024,.022),0,.044,-.07],[new THREE.BoxGeometry(.03,.024,.022),0,.044,.07],
  [cylZ(.0185,.0185,.30),0,.064,0],[cylZ(.019,.031,.06),0,.064,-.18],[cylZ(.031,.031,.05),0,.064,-.235],[cylZ(.025,.019,.07),0,.064,.185],[cylZ(.025,.025,.03),0,.064,.235],
  [new THREE.CylinderGeometry(.013,.013,.028,14),0,.096,0],[new THREE.CylinderGeometry(.013,.013,.028,14).rotateZ(Math.PI/2),.032,.064,0],[new THREE.CylinderGeometry(.009,.009,.02,10).rotateZ(Math.PI/2),-.028,.064,.02],
  [new THREE.TorusGeometry(.022,.0045,6,14,Math.PI).rotateY(Math.PI/2).rotateX(Math.PI),0,-.03,.035],
  [cylZ(.004,.004,.2,6),.012,-.05,-.33],[cylZ(.004,.004,.2,6),-.012,-.05,-.33],[new THREE.BoxGeometry(.04,.015,.02),0,-.04,-.44]
 ]);
 const poly=geoOf([
  [new THREE.BoxGeometry(.056,.05,.34),0,-.014,-.27],[cylZ(.027,.027,.34,12).scale(1,.75,1),0,-.035,-.27],
  [new THREE.BoxGeometry(.036,.095,.046).rotateX(.38),0,-.072,.135],
  [new THREE.BoxGeometry(.05,.075,.3),0,-.028,.33],[new THREE.BoxGeometry(.044,.03,.17),0,.024,.33],[new THREE.BoxGeometry(.042,.065,.2).rotateX(-.28),0,-.075,.35]
 ]);
 const rub=geoOf([[new THREE.BoxGeometry(.056,.115,.025),0,-.03,.49]]);
 const metalMesh=new THREE.Mesh(metal,metalM), polyMesh=new THREE.Mesh(poly,polyM); rifle.add(metalMesh,polyMesh,new THREE.Mesh(rub,rubM));
 const lens=new THREE.Mesh(new THREE.CircleGeometry(.021,20),new THREE.MeshBasicMaterial({color:0x14243a})); lens.position.set(0,.064,.2505); rifle.add(lens);
 const glint=new THREE.Mesh(new THREE.CircleGeometry(.006,10),new THREE.MeshBasicMaterial({color:0x8fb3e0,transparent:true,opacity:.6})); glint.position.set(.008,.072,.251); rifle.add(glint);
 const bolt=new THREE.Group(); bolt.position.set(0,0,.1);
 bolt.add(new THREE.Mesh(geoOf([[new THREE.CylinderGeometry(.005,.005,.06,8).rotateZ(Math.PI/2+.5),.028,-.008,0],[new THREE.SphereGeometry(.012,12,8),.055,-.022,0]]),metalM)); rifle.add(bolt);
 const magM=new THREE.Mesh(new THREE.BoxGeometry(.034,.07,.085),metalM); magM.position.set(0,-.058,-.02); rifle.add(magM);
 const flashS=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffc070,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); flashS.position.set(0,0,-.84); flashS.scale.set(.22,.22,1); flashS.visible=false; rifle.add(flashS);
 const supM=new THREE.Mesh(cylZ(.021,.021,.2,14),new THREE.MeshPhongMaterial({color:0x151617,specular:0x333333,shininess:30})); supM.position.set(0,0,-.9); supM.visible=false; rifle.add(supM);
 const brake=new THREE.Mesh(geoOf([[new THREE.BoxGeometry(.06,.04,.09),0,0,0],[new THREE.BoxGeometry(.065,.012,.012),0,0,-.02],[new THREE.BoxGeometry(.065,.012,.012),0,0,.02]]),metalM); brake.position.set(0,0,-.8); brake.visible=false; rifle.add(brake);
 const longMag=new THREE.Mesh(new THREE.BoxGeometry(.034,.12,.085),metalM); longMag.position.set(0,-.08,-.02); longMag.visible=false; rifle.add(longMag);
 rifle.userData={bolt,mag:magM,flash:flashS,sup:supM,
   style(){ const g=gun(), s=supOn(), f=FIN[(save.fin&&save.fin.eq)||'factory']||FIN.factory, ft=finTex((save.fin&&save.fin.eq)||'factory');
     const pm=polyMesh.material, mm=metalMesh.material;
     pm.color.setHex(ft?0xffffff:(f.stock!=null?f.stock:g.stock)); pm.map=ft?ft.tex:null; pm.needsUpdate=true;
     mm.color.setHex(f.metal!=null?f.metal:0x24272b);
     if(mm.isMeshStandardMaterial){ mm.metalness=f.gold?1:.8; mm.roughness=f.gold?.18:.35; } else { mm.shininess=f.gold?110:70; mm.specular&&mm.specular.setHex(f.gold?0xffe4a0:0x6a6f76); }
     supM.material.color.setHex(f.gold?0xb8892c:0x151617); supM.visible=s; brake.visible=!s&&!!g.pen; flashS.position.z=s?-1.0:g.pen?-.86:-.84;
     const lm=!!g.auto; longMag.visible=lm; rifle.userData.mag=lm?longMag:magM; magM.visible=!lm; bolt.visible=!g.auto; }};
 rifle.position.set(.17,-.2,-.5); rifle.rotation.set(.02,.07,0); camera.add(rifle);}

/* bullet for bullet cam */
const bulletObj=new THREE.Group();
{const b=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,.09,10).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xd9a441}));
 const tr=new THREE.Mesh(new THREE.ConeGeometry(.04,2.4,10,1,true).rotateX(-Math.PI/2).translate(0,0,-1.25),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false}));
 bulletObj.add(b,tr); bulletObj.visible=false; scene.add(bulletObj);}

