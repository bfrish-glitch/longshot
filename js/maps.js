/* Longshot 3D · maps.js · map builders: city, forest, farm, harbor, office, garage; spot finding */
'use strict';
/* ---------- city ---------- */
let world=null, city=null, solid=[], hitList=[], people=[], cars=[], flags=[], fx=[], tvs=[], fogs=[], vents=[], steam=[], rainOn=false;
function dispose(o){
  o.traverse(n=>{ if(n.isMesh||n.isPoints||n.isSprite){ if(n.userData.own){ n.geometry&&n.geometry.dispose(); const ms=Array.isArray(n.material)?n.material:[n.material]; for(const m of ms){ if(!m) continue; for(const k of ['map','emissiveMap']) if(m[k]&&m[k]!==glowTex&&m[k]!==puffTex&&m[k]!==baseGrad) m[k].dispose(); m.dispose(); } } } });
}
function facadeTex(r,wall,P){
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  const e=document.createElement('canvas'); e.width=e.height=512; const ex=e.getContext('2d');
  const g=document.createElement('canvas'); g.width=g.height=512; const gx=g.getContext('2d'); gx.fillStyle='rgb(0,235,0)'; gx.fillRect(0,0,512,512); // G = roughness, B = metalness
  x.fillStyle=wall; x.fillRect(0,0,512,512); ex.fillStyle='#000'; ex.fillRect(0,0,512,512);
  for(let i=0;i<1600;i++){x.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},${r()*.05})`; x.fillRect(r()*512,r()*512,3,3);}
  const style=Math.floor(r()*3);
  for(let row=0;row<8;row++) for(let col=0;col<8;col++){
    const cx=col*64, cy=row*64;
    x.fillStyle='rgba(0,0,0,.16)'; x.fillRect(cx,cy+58,64,6);
    const ww=style===2?52:style===1?30:40, wh=style===1?40:36, wx=cx+(64-ww)/2, wy=cy+12;
    const on=r()<P.litP;
    x.fillStyle=on?P.lit:P.glass; x.fillRect(wx,wy,ww,wh); gx.fillStyle=on?'rgb(0,150,0)':`rgb(0,${12+Math.floor(r()*30)},${120+Math.floor(r()*60)})`; gx.fillRect(wx,wy,ww,wh); gx.fillStyle='rgb(0,200,40)'; gx.fillRect(wx+ww/2-1,wy,2,wh);
    if(!on&&!P.em){x.fillStyle=`rgba(255,255,255,${.04+r()*.12})`; x.fillRect(wx,wy,ww,wh*.45);}
    x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(wx+ww/2-1,wy,2,wh); x.fillRect(wx,wy+wh-3,ww,3);
    if(on&&P.em){ex.globalAlpha=.55+r()*.45; ex.fillStyle=P.lit; ex.fillRect(wx,wy,ww,wh); ex.globalAlpha=1;}
  }
  const mk=cv=>{const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=ANISO; return t;};
  const map=mk(c); map.userData={pbr:mk(g)}; return {map,em:P.em?mk(e):null};
}
function shopTex(r,P){
  const c=document.createElement('canvas'); c.width=512; c.height=128; const x=c.getContext('2d');
  const e=document.createElement('canvas'); e.width=512; e.height=128; const ex=e.getContext('2d'); ex.fillStyle='#000'; ex.fillRect(0,0,512,128);
  const signs=['#b8322a','#1f5f8b','#2f7d4f','#c58b22','#6b3a7a','#20262e','#a5552a'];
  x.fillStyle='#2b2826'; x.fillRect(0,0,512,128);
  for(let sI=0;sI<4;sI++){
    const ox=sI*128, sc=pick(r,signs);
    x.fillStyle=sc; x.fillRect(ox+4,4,120,20);
    x.fillStyle='rgba(255,255,255,.85)'; let tx=ox+14; const nl=4+Math.floor(r()*5); for(let i=0;i<nl;i++){const lw=6+r()*6; x.fillRect(tx,9,lw,10); tx+=lw+3; if(tx>ox+112) break;}
    if(r()<.6){const ac=pick(r,signs); for(let i=0;i<10;i++){x.fillStyle=i%2?ac:'#e9e4d8'; x.fillRect(ox+6+i*11.6,26,11.6,10);} }
    const lit=P.em&&r()<.8;
    x.fillStyle=lit?'#ffe0a6':P.em?'#151820':'#4d6475'; x.fillRect(ox+8,40,112,80);
    if(!lit&&!P.em){x.fillStyle='rgba(255,255,255,.12)'; x.fillRect(ox+8,40,112,30);}
    x.fillStyle='#111'; const dx=r()<.5?ox+10:ox+96; x.fillRect(dx,52,22,68); x.fillRect(ox+8,40,112,3); x.fillRect(ox+62,40,3,80);
    if(P.em){ex.fillStyle=sc; ex.globalAlpha=.9; ex.fillRect(ox+4,4,120,20); ex.globalAlpha=1; ex.fillStyle='#fff'; ex.fillRect(ox+14,9,80,10); if(lit){ex.fillStyle='#ffd99a'; ex.globalAlpha=.75; ex.fillRect(ox+8,40,112,80); ex.globalAlpha=1;}}
  }
  const mk=cv=>{const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=ANISO; return t;};
  return {map:mk(c),em:P.em?mk(e):null};
}
function boardTex(word,bg){
  const c=document.createElement('canvas'); c.width=256; c.height=100; const x=c.getContext('2d');
  x.fillStyle=bg; x.fillRect(0,0,256,100); x.strokeStyle='rgba(255,255,255,.85)'; x.lineWidth=4; x.strokeRect(6,6,244,88);
  x.fillStyle='#fff'; x.font='bold 44px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(word,128,52);
  const t=new THREE.CanvasTexture(c); t.anisotropy=ANISO; return t;
}
function ob(x0,x1,z0,z1,y0,y1){obst.push({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y0,y1});}
function obC(x,z,r,y0,y1){ob(x-r,x+r,z-r,z+r,y0,y1);}
function blockedAt(x,z,y,m){m=m==null?.45:m; for(const o of obst){ if(x>o.x0-m&&x<o.x1+m&&z>o.z0-m&&z<o.z1+m&&o.y1>y+.25&&o.y0<y+1.7) return true; } return false;}
function pathClear(x0,z0,x1,z1,y){const L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(L/.8)); for(let i=1;i<=n;i++){const k=i/n; if(blockedAt(x0+(x1-x0)*k,z0+(z1-z0)*k,y)) return false;} return true;}
let glassMeshes=[];
function worldBase(seed,palKey,rain){
  obst=[];
  if(world){scene.remove(world); dispose(world);}
  for(const p of people) if(p.mesh) scene.remove(p.mesh.root);
  marks.length=0;
  for(const f of fx) scene.remove(f.s); fx=[];
  people=[]; cars=[]; flags=[]; solid=[]; tvs=[]; fogs=[]; vents=[]; steam=[]; rainOn=!!rain; glassMeshes=[];
  const r=mulberry(seed), P=PAL[palKey];
  world=new THREE.Group(); scene.add(world);
  scene.fog=new THREE.Fog(P.fog,P.fogN*(rain?.6:1),P.fogF*(rain?.62:1)); renderer.setClearColor(P.fog);
  const hemi=new THREE.HemisphereLight(P.hemiS,P.hemiG,P.hemiI); world.add(hemi);
  const sd=new THREE.Vector3(...P.sunDir).normalize();
  const sun=new THREE.DirectionalLight(P.sun,P.sunI); sun.position.copy(sd).multiplyScalar(500); world.add(sun); world.add(sun.target);
  sun.castShadow=true; const ms=Math.min(W,H)<500?1024:2048; sun.shadow.mapSize.set(ms,ms); sun.shadow.bias=-.0015; sun.shadow.normalBias=.09; sun.shadow.camera.near=1; sun.shadow.camera.far=1500; sunLight=sun;
  waterTex.length=0; clouds.length=0;
  {const cc=palKey==='night'?0x2a3350:palKey==='dusk'?0xffb89a:0xffffff;
   for(let i=0;i<24;i++){const a=rr(r,-1.5,1.5), d=rr(r,1500,2600); const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:cc,transparent:true,opacity:rr(r,.3,.6)*(rain?1.4:1),depthWrite:false,fog:false})); sp.userData.own=true; sp.position.set(Math.sin(a)*d,rr(r,380,950),-Math.cos(a)*d); const w=rr(r,600,1400); sp.scale.set(w,w*rr(r,.22,.35),1); sp.renderOrder=-1; world.add(sp); clouds.push(sp);}}

  // sky dome
  {const m=new THREE.Mesh(new THREE.SphereGeometry(3000,48,24),skyMaterial(P,sd,palKey)); m.userData.own=true; m.renderOrder=-2; world.add(m);
   const disc=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:P.disc,fog:false,depthWrite:false,transparent:true})); disc.userData.own=true; disc.position.copy(sd).multiplyScalar(2800); const ds=palKey==='dusk'?520:palKey==='night'?180:320; disc.scale.set(ds,ds,1); world.add(disc);
   if(palKey==='night'){const sp=[]; for(let i=0;i<500;i++){const a=r()*TAU, e=rr(r,.05,1.4); sp.push(Math.cos(a)*Math.cos(e)*2900,Math.sin(e)*2900,Math.sin(a)*Math.cos(e)*2900);} const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); const st=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:.8})); st.userData.own=true; world.add(st);}
  }

  return {r,P,sd};
}
function buildCity(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); EYE.set(0,71.7,-.5); YAW_LIM=.95; PITCH_MIN=-.55; PITCH_MAX=.22;
  const facMats=P.walls.map(w=>{const t=facadeTex(r,w,P); return new THREE.MeshLambertMaterial({map:t.map,emissive:t.em?0xffffff:0x000000,emissiveMap:t.em,emissiveIntensity:P.em||0});});
  const roofMat=new THREE.MeshLambertMaterial({color:P.roof}), stuffMat=new THREE.MeshLambertMaterial({color:new THREE.Color(P.roof).multiplyScalar(.75)});
  const trimMat=new THREE.MeshLambertMaterial({color:new THREE.Color(P.roof).multiplyScalar(1.3)}), metalMat=new THREE.MeshLambertMaterial({color:0x1e1f22});
  const shopT=shopTex(r,P), shopMat=new THREE.MeshLambertMaterial({map:shopT.map,emissive:shopT.em?0xffffff:0x000000,emissiveMap:shopT.em,emissiveIntensity:P.em?.9:0});
  const trim={}, shop={}, metal={}, aoC=Col();
  const fac={}, roofs={}, stuff={}, pave=Col(), grass=Col(), trunk=Col(), canopy=Col(), lamps=Col();
  const band=z=>Math.floor(-z/260);
  const getC=(o,k)=>o[k]||(o[k]=Col());
  const buildings=[];
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  function addBuilding(x0,x1,z0,z1,h,v){
    const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2,b=band(cz), ou=r(), ow=r();
    addBox(getC(fac,v+'_'+b),w,h,d,cx,h/2,cz,[0,1,4,5],f=>f<2?[d/32,h/28,ou]:[w/32,h/28,ow]);
    addBox(getC(roofs,b),w,h,d,cx,h/2,cz,[2],()=>[w/7,d/7,ou]);
    const B={x0,x1,z0,z1,h,cx,cz,hut:null,ow,ac:[]};
    addBox(aoC,w+.95,2.4,d+.95,cx,1.2,cz,[0,1,4,5]);
    const dist=Math.hypot(cx,cz), tr=getC(trim,b), floors=Math.round(h/3.5);
    addBox(tr,w+.7,.55,d+.7,cx,h-.4,cz,[0,1,2,4,5]);
    if(dist<650&&h>8){ addBox(getC(shop,b),w+.8,4.5,d+.8,cx,2.25,cz,[0,1,4,5],f=>f<2?[d/32,1,r()]:[w/32,1,r()]); addBox(tr,w+1.3,.3,d+1.3,cx,4.65,cz,[0,1,2,4,5]); }
    if(h>30&&r()<.45) for(let y=21;y<h-6;y+=21) addBox(tr,w+.4,.3,d+.4,cx,y,cz,[0,1,2,4,5]);
    if(dist<460&&floors>=4&&floors<=11&&w>14&&r()<.4){
      const ex=cx+rr(r,-w/2+4,w/2-4), mc=getC(metal,b);
      for(let f=1;f<floors;f++){const y=f*3.5; addBox(mc,4.6,.12,1.3,ex,y,z1+.65,[0,1,2,3,4,5]); addBox(mc,4.6,.06,.06,ex,y+.95,z1+1.28,[0,1,2,4,5]); addBox(mc,.06,.95,.06,ex+(f%2?-1.6:1.6),y+.48,z1+1.28,[0,1,4,5]);}
      const hh2=(floors-1)*3.5; addBox(mc,.08,hh2,.08,ex-2.27,3.5+hh2/2,z1+1.28,[0,1,4,5]); addBox(mc,.08,hh2,.08,ex+2.27,3.5+hh2/2,z1+1.28,[0,1,4,5]);
    }
    const ph=.9, pt=.35, sc=getC(stuff,b);
    addBox(sc,w,ph,pt,cx,h+ph/2,z0+pt/2,[0,1,2,4,5]); addBox(sc,w,ph,pt,cx,h+ph/2,z1-pt/2,[0,1,2,4,5]);
    addBox(sc,pt,ph,d-2*pt,x0+pt/2,h+ph/2,cz,[0,1,2,4,5]); addBox(sc,pt,ph,d-2*pt,x1-pt/2,h+ph/2,cz,[0,1,2,4,5]);
    if(w*d>260&&r()<.75){
      const hx=r()<.5?x0+4:x1-4, hz=r()<.5?z0+3.5:z1-3.5;
      addBox(getC(stuff,b),4,3,3.4,hx,h+1.5,hz,[0,1,2,4,5]);
      const dx=Math.sign(cx-hx), dz=Math.sign(cz-hz);
      B.hut={x0:hx-2.4,x1:hx+2.4,z0:hz-2.1,z1:hz+2.1,door:{x:hx+dx*2.8,z:hz+dz*2.6}}; ob(hx-2,hx+2,hz-1.7,hz+1.7,h-1,h+3);
    }
    const nac=Math.floor(r()*3); for(let i=0;i<nac;i++){const ax=rr(r,x0+2,x1-2), az=rr(r,z0+2,z1-2); addBox(getC(stuff,b),1.6,1.1,1.2,ax,h+.55,az,[0,1,2,4,5]); B.ac.push({x:ax,y:h+1.2,z:az}); ob(ax-.8,ax+.8,az-.6,az+.6,h-1,h+1.1);}
    if(r()<.14&&w>12&&d>12){const tx=rr(r,x0+4,x1-4),tz=rr(r,z0+4,z1-4); obC(tx,tz,1.9,h-1,h+6); const cy=new THREE.CylinderGeometry(1.9,1.9,3.4,12); addGeo(getC(stuff,b),cy,tx,h+3.4,tz); cy.dispose(); const co=new THREE.ConeGeometry(2.1,1.3,12); addGeo(getC(stuff,b),co,tx,h+5.75,tz); co.dispose(); for(const [lx,lz] of [[-1,-1],[1,1],[-1,1],[1,-1]]) addBox(getC(stuff,b),.25,1.7,.25,tx+lx*1.3,h+.85,tz+lz*1.3,[0,1,4,5]);}
    buildings.push(B); return B;
  }
  // player's building + parapet
  addBox(getC(stuff,0),40,70,32,0,35,15.5,[0,1,2,4,5]);
  const parapet=new THREE.Mesh(new THREE.BoxGeometry(40,1.05,.35),new THREE.MeshLambertMaterial({color:new THREE.Color(P.roof).multiplyScalar(1.15)})); parapet.userData.own=true; parapet.position.set(0,70.5,-.95); world.add(parapet); solid.push(parapet);
  // plaza
  addBox(grass,300,.3,110,0,.15,-100,[2,4]);
  addBox(pave,40,.35,110,0,.17,-100,[2]); addBox(pave,300,.35,10,0,.17,-100,[2]);
  {const f=new THREE.CylinderGeometry(7,7.5,.9,24); addGeo(pave,f,0,.45,-100); f.dispose(); obC(0,-100,7.3,-1,1);}
  for(let i=0;i<34;i++){const tx=rr(r,-140,140), tz=rr(r,-152,-48); if(Math.abs(tx)<24||Math.abs(tz+100)<9) continue; const s=rr(r,.8,1.3); obC(tx,tz,.45,-1,4); const tg=new THREE.CylinderGeometry(.25*s,.35*s,4*s,6); addGeo(trunk,tg,tx,2*s,tz); tg.dispose(); const cg=new THREE.IcosahedronGeometry(3.2*s,0); addGeo(canopy,cg,tx,5.3*s,tz); cg.dispose();}
  // blocks: low-rise near, mid-rise further out, one downtown tower cluster, parks and parking mixed in
  const DT={x:rr(r,-120,160),z:rr(r,-780,-900),r:210};
  const lot=Col();
  for(let j=-1;j<=10;j++){
    for(let k=-7;k<=7;k++){
      const x0=k*106+8, x1=x0+90; let z1=-176-j*86, z0=z1-70;
      if(j===-1){z1=-40; z0=-160; if(x1>-160&&x0<160) continue;}
      const cx=(x0+x1)/2, cz=(z0+z1)/2, dist=Math.hypot(cx,cz);
      if(Math.abs(Math.atan2(cx,-cz))>1.4) continue;
      const inDT=Math.hypot(cx-DT.x,cz-DT.z)<DT.r, roll=r();
      if(!inDT&&roll<.15){
        addBox(grass,88,.3,z1-z0-2,cx,.15,cz,[2,4]);
        const nt=6+Math.floor(r()*8);
        for(let i=0;i<nt;i++){const tx=rr(r,x0+5,x1-5),tz=rr(r,z0+5,z1-5),sc=rr(r,.8,1.3); const tg=new THREE.CylinderGeometry(.25*sc,.35*sc,4*sc,6); addGeo(trunk,tg,tx,2*sc,tz); tg.dispose(); const cg=new THREE.IcosahedronGeometry(3.2*sc,0); addGeo(canopy,cg,tx,5.3*sc,tz); cg.dispose();}
        continue;
      }
      if(!inDT&&roll<.25){ addBox(lot,88,.25,z1-z0-2,cx,.12,cz,[2,4]); continue; }
      addBox(pave,90,.2,z1-z0,cx,.1,cz,[2,4,0,1],()=>[90/5,(z1-z0)/5,0]);
      const pat=inDT?(r()<.5?1:2):(r()<.4?1:r()<.8?2:3);
      let ax=x0+2;
      for(let a=0;a<pat;a++){
        const lw=(86-(pat-1)*4)/pat;
        const depth=Math.min(z1-z0-4,(z1-z0)*rr(r,.5,.92)), front=r()<.7;
        const bz1=front?z1-2:z0+2+depth, bz0=bz1-depth;
        let floors;
        if(inDT) floors=Math.round(rr(r,22,48));
        else if(dist<300) floors=Math.round(rr(r,2,7));
        else if(dist<650) floors=Math.round(rr(r,4,14));
        else floors=Math.round(rr(r,3,10));
        const bw=lw*rr(r,.82,1);
        addBuilding(ax,ax+bw,bz0,bz1,floors*3.5,Math.floor(r()*facMats.length));
        ax+=lw+4;
      }
    }
  }
  add(toMesh(lot,new THREE.MeshLambertMaterial({color:new THREE.Color(P.ground).multiplyScalar(1.35)})),true);
  // distant skyline
  for(let i=0;i<26;i++){const x=rr(r,-2400,2400), z=rr(r,-1500,-2300), w=rr(r,50,110), d=rr(r,40,90), h=rr(r,40,200); const v=Math.floor(r()*facMats.length); addBox(getC(fac,v+'_far'),w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(getC(roofs,'far'),w,h,d,x,h/2,z,[2]);}
  // street lamps (glow heads)
  if(P.lamp){
    for(let j=-1;j<=8;j++){const zc=-254-j*86; for(let x=-900;x<=900;x+=32){ if(Math.abs(Math.atan2(x,-zc))>1.6) continue; addBox(lamps,.6,.25,.6,x,7,zc-7.4,[2]); addBox(lamps,.6,.25,.6,x+16,7,zc+7.4,[2]);}}
    for(let k=-5;k<=5;k++){const xc=k*106; for(let z=-170;z>-1100;z-=32){addBox(lamps,.6,.25,.6,xc-7.4,7,z,[2]); addBox(lamps,.6,.25,.6,xc+7.4,7,z-16,[2]);}}
  }
  // street furniture: lamp posts, lane paint, crosswalks, traffic lights
  {const poles=Col(), paintW=Col(), paintY=Col(), tlHead=Col(), tlRed=Col(), tlGrn=Col(), inView=(x,z,lim)=>Math.abs(Math.atan2(x,-z))<lim&&Math.hypot(x,z)<950;
   for(let j=-1;j<=8;j++){const zc=-254-j*86; for(let x=-900;x<=900;x+=32){ if(!inView(x,zc,1.5)) continue; addBox(poles,.16,7,.16,x,3.5,zc-7.6,[0,1,4,5]); addBox(poles,.16,7,.16,x+16,3.5,zc+7.6,[0,1,4,5]); if(!P.lamp){ addBox(poles,.5,.18,.5,x,7.05,zc-7.4,[0,1,2,4,5]); addBox(poles,.5,.18,.5,x+16,7.05,zc+7.4,[0,1,2,4,5]); } }}
   for(let k=-5;k<=5;k++){const xc=k*106; for(let z=-170;z>-1100;z-=32){ if(!inView(xc,z,1.5)) continue; addBox(poles,.16,7,.16,xc-7.6,3.5,z,[0,1,4,5]); addBox(poles,.16,7,.16,xc+7.6,3.5,z-16,[0,1,4,5]); if(!P.lamp){ addBox(poles,.5,.18,.5,xc-7.4,7.05,z,[0,1,2,4,5]); addBox(poles,.5,.18,.5,xc+7.4,7.05,z-16,[0,1,2,4,5]); } }}
   const nearX=x=>Math.abs(x-Math.round(x/106)*106)<9;
   for(let j=-1;j<=8;j++){const zc=-254-j*86; for(let x=-900;x<=900;x+=9){ if(nearX(x)||!inView(x,zc,1.4)) continue; addBox(paintY,3.2,.04,.16,x,.04,zc,[2]); }}
   for(let k=-5;k<=5;k++){const xc=k*106; for(let z=-170;z>-1100;z-=9){ const zz=-254-Math.round((-254-z)/86)*86; if(Math.abs(z-zz)<9||!inView(xc,z,1.4)) continue; addBox(paintY,.16,.04,3.2,xc,.04,z,[2]); }}
   for(let j=-1;j<=8;j++) for(let k=-5;k<=5;k++){ const zc=-254-j*86, xc=k*106; if(!inView(xc,zc,1.3)) continue;
     for(const sx of [-1,1]){ const cx=xc+sx*9; for(let z=zc-4.6;z<=zc+4.7;z+=1.05) addBox(paintW,3,.04,.52,cx,.04,z,[2]); addBox(paintW,.4,.04,4.6,xc+sx*11.2,.04,zc+sx*2.4,[2]); }
     for(const sz of [-1,1]){ const cz=zc+sz*9; for(let x=xc-4.6;x<=xc+4.7;x+=1.05) addBox(paintW,.52,.04,3,x,.04,cz,[2]); addBox(paintW,4.6,.04,.4,xc-sz*2.4,.04,zc+sz*11.2,[2]); }
     if(Math.hypot(xc,zc)<650){ for(const [sx,sz,rx] of [[1,1,0],[-1,-1,1]]){ const px=xc+sx*6.9, pz=zc+sz*6.9; addBox(poles,.22,5.6,.22,px,2.8,pz,[0,1,4,5]); addBox(poles,sx*-3.2,.16,.16,px-sx*1.6,5.4,pz,[0,1,2,3,4,5]);
         const hx=px-sx*3.2; addBox(tlHead,.42,1.15,.42,hx,4.95,pz,[0,1,2,3,4,5]); const lit=(j+k+rx)%2===0; addBox(lit?tlGrn:tlRed,.26,.26,.05,hx,lit?4.6:5.3,pz+sz*.23,[0,1,4,5]); } } }
   const paintMat=c=>new THREE.MeshLambertMaterial({color:c,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
   const pm=toMesh(paintW,paintMat(new THREE.Color(0xdedbd2).multiplyScalar(P.em?.55:1))); if(pm){pm.userData.noCast=true; world.add(pm);}
   const py=toMesh(paintY,paintMat(new THREE.Color(0xd9a92a).multiplyScalar(P.em?.55:1))); if(py){py.userData.noCast=true; world.add(py);}
   add(toMesh(poles,new THREE.MeshLambertMaterial({color:0x2b2e33})),false); add(toMesh(tlHead,new THREE.MeshLambertMaterial({color:0x1b1d20})),false);
   add(toMesh(tlRed,new THREE.MeshBasicMaterial({color:0xff3b2a})),false); add(toMesh(tlGrn,new THREE.MeshBasicMaterial({color:0x3dff7a})),false);
  }
  // ground
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:P.ground,map:grainTex(700)})); ground.userData.own=true; ground.userData.noCast=true; world.add(ground); solid.push(ground);
  for(const key in fac) add(toMesh(fac[key],facMats[+key.split('_')[0]]),true);
  for(const key in roofs) add(toMesh(roofs[key],roofMat),true);
  for(const key in stuff) add(toMesh(stuff[key],stuffMat),true);
  for(const key in trim) add(toMesh(trim[key],trimMat),true);
  {const am=toMesh(aoC,new THREE.MeshBasicMaterial({map:baseGrad,transparent:true,depthWrite:false})); if(am){am.userData.noCast=true; world.add(am);}}
  for(const key in shop) add(toMesh(shop[key],shopMat),true);
  for(const key in metal) add(toMesh(metal[key],metalMat),false);
  // rooftop billboards
  {const words=['DINER','HOTEL','PIZZA','RADIO 98','COFFEE','TAXI','CINEMA','BAKERY','DELI'], bgs=['#b8322a','#1f5f8b','#2f7d4f','#c58b22','#6b3a7a'];
   const bc=buildings.filter(B=>{const d=Math.hypot(B.cx,B.cz); return d>180&&d<750&&B.h<EYE.y-4&&(B.x1-B.x0)>16&&Math.abs(Math.atan2(B.cx,-B.cz))<1.0;});
   for(let i=0;i<5&&bc.length;i++){const B=bc.splice(Math.floor(r()*bc.length),1)[0]; B.bb=true; const tex=boardTex(pick(r,words),pick(r,bgs));
     const m=new THREE.Mesh(new THREE.PlaneGeometry(12,4.7),new THREE.MeshLambertMaterial({map:tex,emissive:P.em?0xffffff:0x000000,emissiveMap:P.em?tex:null,emissiveIntensity:.55})); m.userData.own=true;
     m.position.set(B.cx,B.h+6.4,B.z1-1.25); world.add(m);
     const back=new THREE.Mesh(new THREE.BoxGeometry(12.2,4.9,.2),metalMat); back.userData.own=true; back.position.set(B.cx,B.h+6.4,B.z1-1.72); world.add(back);
     for(const lx of [-4,4]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.25,4,.25),metalMat); leg.userData.own=true; leg.position.set(B.cx+lx,B.h+2,B.z1-1.8); world.add(leg);}}
  }
  // TV flicker in windows at night
  if(P.em){const tc=buildings.filter(B=>{const d=Math.hypot(B.cx,B.cz); return d<540&&B.h>10&&(B.x1-B.x0)>10&&Math.abs(Math.atan2(B.cx,-B.cz))<1.1;});
    for(let i=0;i<36&&tc.length;i++){const B=pick(r,tc), w=B.x1-B.x0, nf=Math.round(B.h/3.5); if(nf<3) continue;
      const m0=Math.ceil(B.ow*8-.5), nb=Math.floor(w/4); const m=m0+Math.floor(r()*nb), x=B.x0+((m+.5)/8-B.ow)*32;
      if(x<B.x0+1.5||x>B.x1-1.5) continue; const fl=2+Math.floor(r()*(nf-2)), y=fl*3.5+1.86; if(y>B.h-2) continue;
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.9),new THREE.MeshBasicMaterial({color:0x5577ff})); pl.userData.own=true; pl.position.set(x,y,B.z1+.3); world.add(pl);
      tvs.push({m:pl,ph:r()*50,hue:rr(r,.52,.68)});}}
  // drifting fog banks
  for(let i=0;i<7;i++){const m=new THREE.SpriteMaterial({map:puffTex,color:P.fog,transparent:true,depthWrite:false,opacity:rr(r,.05,.1)*(rain?1.5:1)}); const sp=new THREE.Sprite(m); sp.userData.own=true; sp.position.set(rr(r,-850,850),rr(r,4,16),rr(r,-700,-1400)); const sc=rr(r,160,320); sp.scale.set(sc,sc*.32,1); world.add(sp); fogs.push({s:sp,v:rr(r,1.5,4)});}
  // roof vents with steam
  {const vc=[]; for(const B of buildings){const d=Math.hypot(B.cx,B.cz); if(d<620&&B.h<EYE.y) for(const a of B.ac) vc.push(a);} for(let i=0;i<6&&vc.length;i++){const a=vc.splice(Math.floor(r()*vc.length),1)[0]; vents.push({x:a.x,y:a.y,z:a.z,t:r()*2});}
   if(vents.length) makeSteamPool(24);}
  add(toMesh(pave,new THREE.MeshLambertMaterial({color:P.pave,map:grainTex(1)})),true);
  add(toMesh(grass,new THREE.MeshLambertMaterial({color:P.grass})),true);
  add(toMesh(trunk,new THREE.MeshLambertMaterial({color:P.trunk})),false);
  add(toMesh(canopy,new THREE.MeshLambertMaterial({color:P.tree})),false);
  add(toMesh(lamps,new THREE.MeshBasicMaterial({color:0xffe2a0})),false);
  for(const m of facMats) if(!world.children.some(c=>c.material===m)) {m.map.dispose(); m.emissiveMap&&m.emissiveMap.dispose(); m.dispose();}
  scene.updateMatrixWorld(true);

  // spots
  const roofCands=buildings.filter(b=>!b.bb&&b.h<EYE.y-4&&Math.abs(Math.atan2(b.cx,-b.cz))<YAW_LIM+.1&&(b.x1-b.x0)>7&&(b.z1-b.z0)>7);
  const walks=[];
  for(let j=-1;j<=11;j++){const zc=-254-j*86; walks.push({ax:'x',c:zc-6.3,a0:-900,a1:900},{ax:'x',c:zc+6.3,a0:-900,a1:900});}
  for(let k=-6;k<=6;k++){const xc=k*106; walks.push({ax:'z',c:xc-6.3,a0:-1300,a1:-172},{ax:'z',c:xc+6.3,a0:-1300,a1:-172});}
  city={kind:'city',P,pal:palKey,sunDir:sd.clone(),buildings,roofCands,walks,plaza:{x0:-140,x1:140,z0:-150,z1:-50,y:.3}};

  // cars
  const carLanes=[];
  for(let k=-4;k<=4;k++) carLanes.push({ax:'z',c:k*106-3,dir:1},{ax:'z',c:k*106+3,dir:-1});
  for(let j=-1;j<=7;j++) carLanes.push({ax:'x',c:-254-j*86-3,dir:1},{ax:'x',c:-254-j*86+3,dir:-1});
  for(let i=0;i<34;i++){
    const L=pick(r,carLanes), col=pick(r,CARS), g=new THREE.Group();
    const body=new THREE.Mesh(CG.body,mat(col)); body.position.y=.75; const cab=new THREE.Mesh(CG.cab,mat(col)); cab.position.set(0,1.55,-.2); const gl=new THREE.Mesh(CG.glass,mat(0x1d2630)); gl.position.set(0,1.6,-.2);
    g.add(body,gl,cab); cab.visible=false;
    const c={g,L,s:L.ax==='z'?rr(r,-1250,-180):rr(r,-850,850),v:rr(r,9,15)};
    g.rotation.y=L.ax==='z'?(L.dir>0?0:Math.PI):(L.dir>0?Math.PI/2:-Math.PI/2);
    world.add(g); cars.push(c);
  }
  // flags
  const fc=roofCands.slice().sort(()=>r()-.5).slice(0,9);
  for(const b of fc){
    const g=new THREE.Group(); const fx0=rr(r,b.x0+2,b.x1-2), fz0=rr(r,b.z0+2,b.z1-2);
    g.position.set(fx0,b.h,fz0);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,7,6),new THREE.MeshLambertMaterial({color:0xcfcfcf})); pole.position.y=3.5; pole.userData.own=true;
    const geo=new THREE.PlaneGeometry(2.4,1.4,12,1).translate(1.2,-.7,0);
    const cloth=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:pick(r,[0xd8352a,0xf2b322,0x2b6fd8,0xeeeeee]),side:THREE.DoubleSide})); cloth.userData.own=true; cloth.position.y=6.9;
    const piv=new THREE.Group(); piv.position.y=0; piv.add(cloth);
    g.add(pole,piv); world.add(g);
    flags.push({g,piv,cloth,base:Float32Array.from(geo.attributes.position.array),ph:r()*6});
  }
}
function makeSteamPool(n){for(let i=0;i<n;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xe2e2e2,transparent:true,depthWrite:false,opacity:0})); sp.userData.own=true; sp.visible=false; world.add(sp); steam.push({s:sp,t:0,life:1,on:false,vx:0,vy:0,sz:1});}}
function flagAt(x,y,z,r){
  const g=new THREE.Group(); g.position.set(x,y,z);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,7,6),new THREE.MeshLambertMaterial({color:0xcfcfcf})); pole.position.y=3.5; pole.userData.own=true;
  const geo=new THREE.PlaneGeometry(2.4,1.4,12,1).translate(1.2,-.7,0);
  const cloth=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:pick(r,[0xd8352a,0xf2b322,0x2b6fd8,0xeeeeee]),side:THREE.DoubleSide})); cloth.userData.own=true; cloth.position.y=6.9;
  const piv=new THREE.Group(); piv.add(cloth); g.add(pole,piv); world.add(g);
  flags.push({g,piv,cloth,base:Float32Array.from(geo.attributes.position.array),ph:r()*6});
}
function gableGeo(w,d,h){
  const x=w/2,z=d/2, v=[-x,0,z, x,0,z, 0,h,z,  x,0,-z, -x,0,-z, 0,h,-z,  -x,0,z, 0,h,z, 0,h,-z,  -x,0,z, 0,h,-z, -x,0,-z,  x,0,z, x,0,-z, 0,h,-z,  x,0,z, 0,h,-z, 0,h,z];
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(v.length/3*2).fill(0),2)); g.computeVertexNormals(); return g;
}
const sstep=x=>{x=clamp(x,0,1); return x*x*(3-2*x);};

function buildForest(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=.95; PITCH_MIN=-.55; PITCH_MAX=.22;
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const lk=palKey==='night'?.38:palKey==='dusk'?.68:1;
  const lake={x:(r()<.5?-1:1)*rr(r,200,380),z:rr(r,-430,-620),r:rr(r,80,115)};
  const camp={x:rr(r,-80,100),z:rr(r,-250,-330)};
  const ftw={x:(lake.x>0?-1:1)*rr(r,90,250),z:rr(r,-640,-760)};
  const meadows=[]; for(let i=0;i<3;i++){let m; for(let t=0;t<30;t++){m={x:rr(r,-360,360),z:rr(r,-160,-700),r:rr(r,30,46)}; if(Math.hypot(m.x-camp.x,m.z-camp.z)>130&&Math.hypot(m.x-lake.x,m.z-lake.z)>lake.r+70&&Math.hypot(m.x,m.z)>140&&Math.abs(Math.atan2(m.x,-m.z))<.9) break;} meadows.push(m);}
  const base=(x,z)=>{let h=16*Math.sin(x*.0055+1.3)*Math.cos(z*.0042+.4)+8*Math.sin(x*.013+z*.009+2)+3.5*Math.sin(x*.037-z*.029)+1.2*Math.sin(x*.09+z*.07);
    h+=28*Math.exp(-(x*x+z*z)/24200); h-=16*Math.exp(-((z+330)**2)/51200); h-=34*Math.exp(-((x-lake.x)**2+(z-lake.z)**2)/(2*lake.r*lake.r)); return h;};
  const flats=[]; const flat=(x,z,rad)=>{flats.push({x,z,r:rad,h:base(x,z)});};
  flat(camp.x,camp.z,58); flat(ftw.x,ftw.z,16); for(const m of meadows) flat(m.x,m.z,m.r);
  const gY=(x,z)=>{let h=base(x,z); for(const f of flats){const d=Math.hypot(x-f.x,z-f.z); if(d<f.r*1.3){const w=sstep((f.r*1.3-d)/(f.r*.7)); h=h*(1-w)+f.h*w;}} return h;};
  const lakeLvl=base(lake.x,lake.z)+15;
  const gHit=(x,z)=>{const h=gY(x,z); return (Math.hypot(x-lake.x,z-lake.z)<lake.r*1.8&&h<lakeLvl)?lakeLvl:h;};

  // player's fire lookout
  const g0=gY(0,0), top=g0+24; EYE.set(0,top+1.7,0);
  const wood=Col(), dark=Col(), logs=Col(), roofC=Col(), deckC=Col(), winC=Col(), dirt=Col(), stone=Col();
  for(const [lx,lz] of [[-2.3,-2.3],[2.3,-2.3],[-2.3,2.3],[2.3,2.3]]) addBox(dark,.3,top-g0+1,.3,lx,(top+g0)/2-.5,lz,[0,1,4,5]);
  addBox(wood,5.4,.3,5.4,0,top-.15,0,[0,1,2,3,4,5]);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(5.4,.12,.12),new THREE.MeshLambertMaterial({color:0x5a4330})); rail.userData.own=true; rail.position.set(0,top+.62,-2.6); world.add(rail);
  for(const px of [-2.6,-1.3,0,1.3,2.6]){const pst=new THREE.Mesh(new THREE.BoxGeometry(.1,.62,.1),rail.material); pst.position.set(px,top+.31,-2.6); world.add(pst);}

  // terrain
  {const N=200,S=1800,g=new THREE.PlaneGeometry(S,S,N,N).rotateX(-Math.PI/2).translate(0,0,-650), pos=g.attributes.position, cols=[];
   const cG=new THREE.Color(P.grass).multiplyScalar(1), cF=new THREE.Color(0x3c5228).multiplyScalar(lk), cD=new THREE.Color(0x6b5639).multiplyScalar(lk), c=new THREE.Color();
   for(let i=0;i<pos.count;i++){const x=pos.getX(i), z=pos.getZ(i), y=gY(x,z); pos.setY(i,y);
     const n=.5+.5*Math.sin(x*.031)*Math.sin(z*.027+1), fl=flats.some(f=>Math.hypot(x-f.x,z-f.z)<f.r*.9);
     c.copy(cF).lerp(cG,fl?1:n*.6); if(fl&&Math.sin(x*.4)*Math.sin(z*.37)>.4) c.lerp(cD,.5); if(y<lakeLvl+1.2&&Math.hypot(x-lake.x,z-lake.z)<lake.r*1.9) c.copy(cD);
     cols.push(c.r,c.g,c.b);}
   g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); g.computeVertexNormals();
   const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,map:grainTex(170)})); m.userData.own=true; m.userData.noCast=true; world.add(m);
   const o=new THREE.PlaneGeometry(7000,7000,60,60).rotateX(-Math.PI/2).translate(0,0,-1200), op=o.attributes.position;
   for(let i=0;i<op.count;i++){const x=op.getX(i), z=op.getZ(i); let y=gY(x,z)*.8; if(Math.abs(x)<890&&z<240&&z>-1540) y-=6; op.setY(i,y);} o.computeVertexNormals();
   const om=new THREE.Mesh(o,new THREE.MeshLambertMaterial({color:cF})); om.userData.own=true; om.userData.noCast=true; world.add(om);
   const wm=new THREE.Mesh(new THREE.CircleGeometry(lake.r*1.85,48).rotateX(-Math.PI/2),new THREE.MeshPhongMaterial({color:palKey==='night'?0x0d1a2a:palKey==='dusk'?0x4b4a66:0x3a6a84,shininess:80,specular:0x777777,map:(()=>{const t=grainTex(14); waterTex.push(t); return t;})()})); wm.userData.own=true; wm.userData.noCast=true; wm.position.set(lake.x,lakeLvl,lake.z); world.add(wm);
  }
  // mountains
  {const mc=Col(); for(let i=0;i<18;i++){const a=rr(r,-1.4,1.4), d=rr(r,1900,2600), h=rr(r,220,520), cg=new THREE.ConeGeometry(rr(r,350,650),h,7); addGeo(mc,cg,Math.sin(a)*d,h/2-40,-Math.cos(a)*d); cg.dispose();}
   add(toMesh(mc,new THREE.MeshLambertMaterial({color:new THREE.Color(0x56606e).multiplyScalar(lk)})),false);}

  // road
  const pts=[]; for(let i=0;i<=11;i++){const z=-70-i*95; let x=camp.x+Math.sin(i*.8+seed)*150*(i/11+.3); if(Math.abs(z-camp.z)<70) x=camp.x+20; if(Math.hypot(x-lake.x,z-lake.z)<lake.r*1.5) x+=(x>lake.x?1:-1)*lake.r*1.2; pts.push({x,z});}
  const roads=[]; for(let i=0;i<pts.length-1;i++) roads.push({a:pts[i],b:pts[i+1]});
  for(const s of roads){const L=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z), n=Math.ceil(L/8), nx=-(s.b.z-s.a.z)/L*2.8, nz=(s.b.x-s.a.x)/L*2.8;
    for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n, ax=s.a.x+(s.b.x-s.a.x)*t0, az=s.a.z+(s.b.z-s.a.z)*t0, bx=s.a.x+(s.b.x-s.a.x)*t1, bz=s.a.z+(s.b.z-s.a.z)*t1, base0=dirt.p.length/3;
      for(const [x,z] of [[ax-nx,az-nz],[ax+nx,az+nz],[bx-nx,bz-nz],[bx+nx,bz+nz]]){dirt.p.push(x,gY(x,z)+.18,z); dirt.n.push(0,1,0); dirt.u.push(0,0);}
      dirt.i.push(base0,base0+2,base0+1,base0+1,base0+2,base0+3);}}
  const roadDist=(x,z)=>{let m=1e9; for(const s of roads){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz),0,1); m=Math.min(m,Math.hypot(x-s.a.x-dx*t,z-s.a.z-dz*t));} return m;};

  // cabins
  const decks=[], cabins=[];
  function cabin(x,z,w,d){
    const y0=gY(x,z), fl=y0+.7;
    addBox(dark,w,.9,d,x,y0+.25,z,[0,1,4,5]);
    addBox(logs,w,3,d,x,fl+1.5,z,[0,1,2,4,5]);
    const rg=gableGeo(w+1.2,d+1.2,2.3); addGeo(roofC,rg,x,fl+3,z); rg.dispose();
    addBox(stone,.9,3.2,.9,x+w*.3,fl+3.6,z-d*.2,[0,1,2,4,5]);
    addBox(deckC,w,.2,2.6,x,fl-.1,z+d/2+1.3,[0,1,2,4,5]);
    addBox(dark,.12,2.6,.12,x-w/2+.2,fl+1.2,z+d/2+2.5,[0,1,4,5]); addBox(dark,.12,2.6,.12,x+w/2-.2,fl+1.2,z+d/2+2.5,[0,1,4,5]);
    addBox(roofC,w+.4,.15,2.9,x,fl+2.55,z+d/2+1.35,[2,3]);
    addBox(dark,1.1,2.1,.15,x-w*.22,fl+1.05,z+d/2+.08,[4]);
    addBox(winC,1.2,.9,.15,x+w*.2,fl+1.6,z+d/2+.08,[4]);
    decks.push({x0:x-w/2+.5,x1:x+w/2-.5,z0:z+d/2+.6,z1:z+d/2+2.2,y:fl,door:{x:x-w*.22,z:z+d/2+.4}});
    ob(x-w/2,x+w/2,z-d/2,z+d/2,y0-1,fl+5); ob(x-w/2,x+w/2,z+d/2,z+d/2+2.6,y0-1,fl-.05);
    vents.push({x:x+w*.3,y:fl+5.3,z:z-d*.2,t:r()*2});
    cabins.push({x,z,r:Math.max(w,d)});
  }
  const nc=5; for(let i=0;i<nc;i++){const a=-1.1+i*.55+rr(r,-.1,.1), rad=rr(r,26,36); cabin(camp.x+Math.sin(a)*rad,camp.z-Math.cos(a)*rad*.7-6,rr(r,7,10),rr(r,5.5,7.5));}
  for(const m of meadows.slice(0,2)) cabin(m.x+rr(r,-.4,.4)*m.r,m.z-m.r*.45,rr(r,7,9),rr(r,5.5,7));
  // camp props: sawmill shed, log piles, trucks, fire pit
  {const sx=camp.x-14,sz=camp.z+12,sy=gY(sx,sz); for(const [ox,oz] of [[-6,-4],[6,-4],[-6,4],[6,4]]){ addBox(dark,.3,4,.3,sx+ox,sy+2,sz+oz,[0,1,4,5]); obC(sx+ox,sz+oz,.2,sy-1,sy+4);} addBox(roofC,13,.25,9,sx,sy+4.1,sz,[0,1,2,3,4,5]);
   for(let j=0;j<3;j++){const lx=camp.x+rr(r,-20,20), lz=camp.z+rr(r,-5,18), ly=gY(lx,lz); ob(lx-3.6,lx+3.6,lz-1.1,lz+1.6,ly-1,ly+1.6); for(let k=0;k<6;k++){const cg=new THREE.CylinderGeometry(.35,.35,7,8).rotateZ(Math.PI/2); addGeo(logs,cg,lx,ly+.35+Math.floor(k/3)*.62,lz+(k%3)*.7-.7+(k>2?.35:0)); cg.dispose();}}
   const fx0=camp.x+6, fz0=camp.z+8, fy=gY(fx0,fz0); obC(fx0,fz0,1.5,fy-1,fy+.6); for(let k=0;k<8;k++){const a=k/8*TAU; addBox(stone,.5,.35,.5,fx0+Math.cos(a)*1.2,fy+.17,fz0+Math.sin(a)*1.2,[0,1,2,4,5]);}
   vents.push({x:fx0,y:fy+.6,z:fz0,t:0,big:true});
   if(palKey!=='day'){const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff9a40,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); gl.userData.own=true; gl.position.set(fx0,fy+1.2,fz0); gl.scale.set(9,9,1); world.add(gl);}
   for(let t=0;t<2;t++){const tx=camp.x+rr(r,-25,25), tz=camp.z+rr(r,14,24), g=new THREE.Group(), col=pick(r,CARS); const bd=new THREE.Mesh(CG.body,mat(col)); bd.position.y=.75; const gl2=new THREE.Mesh(CG.glass,mat(0x1d2630)); gl2.position.set(0,1.6,-.6); g.add(bd,gl2); g.position.set(tx,gY(tx,tz),tz); g.rotation.y=r()*TAU; world.add(g); obC(tx,tz,2.4,gY(tx,tz)-1,gY(tx,tz)+2);}
   flagAt(camp.x-2,gY(camp.x-2,camp.z+16),camp.z+16,r);
   flagAt(ftw.x+3,gY(ftw.x+3,ftw.z+3),ftw.z+3,r);
  }
  // far fire tower
  const fty=gY(ftw.x,ftw.z), ftop=fty+20;
  for(const [lx,lz] of [[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]]) addBox(dark,.3,20,.3,ftw.x+lx,fty+10,ftw.z+lz,[0,1,4,5]);
  addBox(wood,5.2,.3,5.2,ftw.x,ftop-.15,ftw.z,[0,1,2,3,4,5]);
  for(const [w2,d2,ox,oz] of [[5.2,.1,0,-2.55],[.1,5.2,-2.55,0],[.1,5.2,2.55,0]]) addBox(dark,w2,.08,d2,ftw.x+ox,ftop+.95,ftw.z+oz,[0,1,2,4,5]);

  const wm=palKey==='night';
  add(toMesh(wood,new THREE.MeshLambertMaterial({color:new THREE.Color(0x8a6a48).multiplyScalar(lk)})),true);
  add(toMesh(dark,new THREE.MeshLambertMaterial({color:new THREE.Color(0x3a2c20).multiplyScalar(lk)})),true);
  add(toMesh(logs,new THREE.MeshLambertMaterial({color:new THREE.Color(0x7a5434).multiplyScalar(lk)})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:new THREE.Color(0x4a3a35).multiplyScalar(lk),side:THREE.DoubleSide})),true);
  add(toMesh(deckC,new THREE.MeshLambertMaterial({color:new THREE.Color(0x9a7a55).multiplyScalar(lk)})),true);
  add(toMesh(stone,new THREE.MeshLambertMaterial({color:new THREE.Color(0x7a7670).multiplyScalar(lk)})),true);
  add(toMesh(dirt,new THREE.MeshLambertMaterial({color:new THREE.Color(0x7a6444).multiplyScalar(lk)})),false);
  add(toMesh(winC,wm||palKey==='dusk'?new THREE.MeshBasicMaterial({color:0xffc46a}):new THREE.MeshLambertMaterial({color:0x2a3440})),false);

  // pines
  const trees=[];
  {const NT=2600, fol=geoOf([[new THREE.ConeGeometry(2.6,5,7),0,4.6,0],[new THREE.ConeGeometry(2.0,4.2,7),0,6.9,0],[new THREE.ConeGeometry(1.3,3.2,7),0,8.9,0]]), tr=new THREE.CylinderGeometry(.22,.32,3.4,6).translate(0,1.7,0);
   const fm=new THREE.InstancedMesh(fol,new THREE.MeshLambertMaterial({color:0xffffff}),NT), tm=new THREE.InstancedMesh(tr,new THREE.MeshLambertMaterial({color:new THREE.Color(0x4a3524).multiplyScalar(lk)}),NT);
   const o=new THREE.Object3D(), c=new THREE.Color(); let n=0;
   for(let t=0;t<16000&&n<NT;t++){
     const x=rr(r,-880,880), z=rr(r,220,-1520);
     if(Math.hypot(x,z)<40) continue;
     if(Math.sin(x*.021+1)*Math.sin(z*.017)<-.55&&r()<.7) continue;
     if(flats.some(f=>Math.hypot(x-f.x,z-f.z)<f.r*1.05)) continue;
     if(cabins.some(cb=>Math.hypot(x-cb.x,z-cb.z)<cb.r+3)) continue;
     if(roadDist(x,z)<6.5) continue;
     const y=gY(x,z); if(y<lakeLvl+.6&&Math.hypot(x-lake.x,z-lake.z)<lake.r*2) continue;
     const s=rr(r,.75,1.45);
     o.position.set(x,y-.2,z); o.rotation.set(0,r()*TAU,0); o.scale.set(s,s*rr(r,.9,1.15),s); o.updateMatrix();
     fm.setMatrixAt(n,o.matrix); tm.setMatrixAt(n,o.matrix);
     c.setRGB(rr(r,.16,.24),rr(r,.3,.4),rr(r,.16,.22)).multiplyScalar(lk*1.15); fm.setColorAt(n,c);
     trees.push({x,z,y,s}); n++;
   }
   fm.count=tm.count=n; fm.instanceMatrix.needsUpdate=tm.instanceMatrix.needsUpdate=true; if(fm.instanceColor) fm.instanceColor.needsUpdate=true;
   fm.frustumCulled=tm.frustumCulled=false; fm.userData.own=tm.userData.own=true; world.add(fm,tm);}

  // drifting mist over the valley
  for(let i=0;i<6;i++){const m=new THREE.SpriteMaterial({map:puffTex,color:P.fog,transparent:true,depthWrite:false,opacity:rr(r,.06,.12)*(rain?1.5:1)}); const sp=new THREE.Sprite(m); sp.userData.own=true; const x=rr(r,-700,700), z=rr(r,-500,-1300); sp.position.set(x,gY(x,z)+rr(r,6,18),z); const sc=rr(r,160,300); sp.scale.set(sc,sc*.3,1); world.add(sp); fogs.push({s:sp,v:rr(r,1.5,4)});}
  makeSteamPool(24);
  scene.updateMatrixWorld(true);
  city={kind:'forest',P,pal:palKey,sunDir:sd.clone(),gY,gHit,trees,decks,roads,lakeLvl,
    camp:{x0:camp.x-34,x1:camp.x+34,z0:camp.z-24,z1:camp.z+30},
    meadows:meadows.map(m=>({x0:m.x-m.r*.7,x1:m.x+m.r*.7,z0:m.z-m.r*.7,z1:m.z+m.r*.7})),
    ftower:{x0:ftw.x-2,x1:ftw.x+2,z0:ftw.z-2,z1:ftw.z+2,y:ftop}};
}
function terrainBlock(o,t){
  if(!city||!city.gY) return false;
  const L=o.distanceTo(t), n=Math.ceil(L/5);
  for(let i=1;i<n;i++){const k=i/n, x=o.x+(t.x-o.x)*k, y=o.y+(t.y-o.y)*k, z=o.z+(t.z-o.z)*k; if(y<city.gY(x,z)-.2) return true;}
  return false;
}
function treeBlock(o,t){
  if(!city||!city.trees) return false;
  const dx=t.x-o.x, dz=t.z-o.z, L2=dx*dx+dz*dz;
  for(const tr of city.trees){
    const k=((tr.x-o.x)*dx+(tr.z-o.z)*dz)/L2; if(k<.02||k>.985) continue;
    const px=o.x+dx*k-tr.x, pz=o.z+dz*k-tr.z, yl=o.y+(t.y-o.y)*k, hh=yl-tr.y;
    if(hh<0||hh>10.5*tr.s) continue;
    const rad=hh<2.4*tr.s?.4*tr.s:2.4*tr.s*(1-(hh-2.4*tr.s)/(8.5*tr.s))+.2;
    if(px*px+pz*pz<rad*rad) return true;
  }
  return false;
}
function terrainRange(o,dir,maxD){
  if(!city||!city.gHit) return 0;
  for(let t=4;t<maxD;t+=3){const x=o.x+dir.x*t,y=o.y+dir.y*t,z=o.z+dir.z*t; if(y<city.gHit(x,z)) return t;}
  return 0;
}
function findSpotForest(type,band,r){
  const c=city;
  for(let i=0;i<260;i++){
    let pos,rect=null,seg=null,y,door=null,ground=true;
    if(type==='camp'){rect=c.camp; pos=randIn(rect,r);}
    else if(type==='meadow'){rect=pick(r,c.meadows); pos=randIn(rect,r);}
    else if(type==='deck'){const d=pick(r,c.decks); rect=d; pos=randIn(rect,r); y=d.y; door=d.door; ground=false;}
    else if(type==='tower'){rect=c.ftower; pos=randIn(rect,r); y=rect.y; ground=false;}
    else {seg=pick(r,c.roads); const t=r(); pos={x:seg.a.x+(seg.b.x-seg.a.x)*t,z:seg.a.z+(seg.b.z-seg.a.z)*t};}
    if(ground) y=c.gY(pos.x,pos.z);
    const d=Math.hypot(pos.x,pos.z);
    if(d<band[0]||d>band[1]) continue;
    if(Math.abs(Math.atan2(pos.x,-pos.z))>YAW_LIM+.12) continue;
    if(blockedAt(pos.x,pos.z,y,.6)||!aimable(pos.x,y,pos.z)) continue;
    if(!los(pos.x,y+1.6,pos.z)||!los(pos.x,y+1.0,pos.z)) continue;
    return {pos,rect,seg,y,door,type,d,ground};
  }
  return null;
}
/* ---------- shared map helpers ---------- */
function terrainMesh(gY,colFn,S,N,cz){
  const g=new THREE.PlaneGeometry(S,S,N,N).rotateX(-Math.PI/2).translate(0,0,cz), pos=g.attributes.position, cols=[], c=new THREE.Color();
  for(let i=0;i<pos.count;i++){const x=pos.getX(i), z=pos.getZ(i), y=gY(x,z); pos.setY(i,y); colFn(x,z,y,c); cols.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,map:grainTex(170)})); m.userData.own=true; m.userData.noCast=true; world.add(m); return m;
}
function outerTerrain(gY,col,S,cz,inner){
  const o=new THREE.PlaneGeometry(7000,7000,60,60).rotateX(-Math.PI/2).translate(0,0,-1200), op=o.attributes.position;
  for(let i=0;i<op.count;i++){const x=op.getX(i), z=op.getZ(i); let y=gY(x,z)*.8; if(Math.abs(x)<inner/2-10&&Math.abs(z-cz)<inner/2-10) y-=6; op.setY(i,y);} o.computeVertexNormals();
  const om=new THREE.Mesh(o,new THREE.MeshLambertMaterial({color:col})); om.userData.own=true; om.userData.noCast=true; world.add(om);
}
function ribbon(col,pts,width,gY,lift){
  const segs=[];
  for(let i=0;i<pts.length-1;i++){const s={a:pts[i],b:pts[i+1]}; segs.push(s);
    const L=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z), n=Math.max(1,Math.ceil(L/8)), nx=-(s.b.z-s.a.z)/L*width/2, nz=(s.b.x-s.a.x)/L*width/2;
    for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n, ax=s.a.x+(s.b.x-s.a.x)*t0, az=s.a.z+(s.b.z-s.a.z)*t0, bx=s.a.x+(s.b.x-s.a.x)*t1, bz=s.a.z+(s.b.z-s.a.z)*t1, b0=col.p.length/3;
      for(const [x,z] of [[ax-nx,az-nz],[ax+nx,az+nz],[bx-nx,bz-nz],[bx+nx,bz+nz]]){col.p.push(x,gY(x,z)+lift,z); col.n.push(0,1,0); col.u.push(0,0);}
      col.i.push(b0,b0+2,b0+1,b0+1,b0+2,b0+3);}}
  return segs;
}
function segDist(segs,x,z){let m=1e9; for(const s of segs){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz),0,1); m=Math.min(m,Math.hypot(x-s.a.x-dx*t,z-s.a.z-dz*t));} return m;}
function railRing(top,rad,col){for(const x of [-2.6,-1.3,0,1.3,2.6]) addBox(col,.07,.6,.07,x,top+.3,EYE.z-rad,[0,1,4,5]); addBox(col,5.3,.07,.07,0,top+.6,EYE.z-rad,[2,4]);}
function stoneSpot(rect,y){return {pos:randIn(rect,MR),rect,y};}
function litMat(P,day,night){return P.em?new THREE.MeshBasicMaterial({color:night}):new THREE.MeshLambertMaterial({color:day});}

/* ---------- farm ---------- */
function buildFarm(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=.95; PITCH_MIN=-.6; PITCH_MAX=.22;
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const lk=palKey==='night'?.38:palKey==='dusk'?.68:1;
  const steads=[{x:rr(r,-70,70),z:rr(r,-170,-230)}];
  steads.push({x:(r()<.5?-1:1)*rr(r,170,300),z:rr(r,-420,-520)});
  steads.push({x:-Math.sign(steads[1].x)*rr(r,90,260),z:rr(r,-690,-820)});
  const base=(x,z)=>5*Math.sin(x*.0035+1)*Math.cos(z*.003+.5)+2.6*Math.sin(x*.009+z*.007+2)+.8*Math.sin(x*.025-z*.02);
  const flats=[{x:0,z:0,r:24,h:base(0,0)}]; for(const s of steads){s.h=base(s.x,s.z); flats.push({x:s.x,z:s.z,r:62,h:s.h});}
  const gY=(x,z)=>{let h=base(x,z); for(const f of flats){const d=Math.hypot(x-f.x,z-f.z); if(d<f.r*1.3){const w=sstep((f.r*1.3-d)/(f.r*.7)); h=h*(1-w)+f.h*w;}} return h;};
  const grass=new THREE.Color(P.grass), dirtC=new THREE.Color(0x7a6444).multiplyScalar(lk);
  terrainMesh(gY,(x,z,y,c)=>{c.copy(grass).multiplyScalar(.9+.15*Math.sin(x*.03)*Math.sin(z*.02)); if(steads.some(s=>Math.hypot(x-s.x,z-s.z)<40)) c.lerp(dirtC,.6);},1900,190,-650);
  outerTerrain(gY,new THREE.Color(P.grass).multiplyScalar(.85),1900,-650,1900);
  // mountains + far tree line
  {const mc=Col(); for(let i=0;i<14;i++){const a=rr(r,-1.4,1.4), d=rr(r,2200,2800), h=rr(r,160,360), cg=new THREE.ConeGeometry(rr(r,400,700),h,7); addGeo(mc,cg,Math.sin(a)*d,h/2-40,-Math.cos(a)*d); cg.dispose();}
   add(toMesh(mc,new THREE.MeshLambertMaterial({color:new THREE.Color(0x66707a).multiplyScalar(lk)})),false);}
  // roads
  const dirt=Col();
  const county=[]; for(let i=0;i<=12;i++){const x=-950+i*160; county.push({x,z:-340+Math.sin(i*.9+seed)*40});}
  const lanes=[[{x:0,z:-22},{x:steads[0].x*.5,z:-110},{x:steads[0].x,z:steads[0].z+20}],[{x:steads[1].x,z:steads[1].z+30},{x:steads[1].x*.9,z:-340}],[{x:steads[2].x,z:steads[2].z+30},{x:steads[2].x*.8,z:-560},{x:steads[2].x*.6,z:-345}]];
  let roads=ribbon(dirt,county,7,gY,.35); for(const l of lanes) roads=roads.concat(ribbon(dirt,l,4.5,gY,.38));
  // fields
  const cropDefs=[['#c9a64a','#a8862f'],['#4f7a2e','#2f4f1c'],['#6b4e33','#4e3824'],['#7d9c45','#6c8a3b']];
  const fieldCols=cropDefs.map(()=>Col()), fields=[];
  for(let fx=-900;fx<900;fx+=170) for(let fz=60;fz>-1400;fz-=130){
    const x0=fx+6, x1=fx+164, z1=fz-6, z0=fz-124, cx=(x0+x1)/2, cz=(z0+z1)/2;
    if(Math.hypot(cx,cz)<70) continue;
    if(steads.some(s=>Math.abs(cx-s.x)<130&&Math.abs(cz-s.z)<110)) continue;
    if(r()<.1) continue;
    const t=Math.floor(r()*4), w=x1-x0, d=z1-z0, sw=Math.ceil(w/12), sdv=Math.ceil(d/12);
    const g=new THREE.PlaneGeometry(w,d,sw,sdv).rotateX(-Math.PI/2); const ps=g.attributes.position, uv=g.attributes.uv;
    for(let i=0;i<ps.count;i++){const x=ps.getX(i)+cx, z=ps.getZ(i)+cz; ps.setXYZ(i,x,gY(x,z)+.45,z); uv.setXY(i,uv.getX(i)*w/12,uv.getY(i)*d/12);}
    if(r()<.5){for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getY(i),uv.getX(i));}
    addGeo(fieldCols[t],g,0,0,0); g.dispose();
    if(segDist(roads,cx,cz)>40) fields.push({x0:x0+6,x1:x1-6,z0:z0+6,z1:z1-6,crop:t});
  }
  fieldCols.forEach((col,i)=>{const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.fillStyle=cropDefs[i][0]; x.fillRect(0,0,64,64); x.fillStyle=cropDefs[i][1]; for(let k=0;k<8;k++) x.fillRect(k*8,0,i===3?1:3,64); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=ANISO;
    add(toMesh(col,new THREE.MeshLambertMaterial({map:t,color:new THREE.Color(1,1,1).multiplyScalar(lk)})),false);});
  // structures
  const white=Col(), red=Col(), roofC=Col(), metal=Col(), dark=Col(), hay=Col(), wood=Col(), winC=Col(), yards=[], doors=[];
  const gbl=(col,w,d,h,x,y,z)=>{const g=gableGeo(w,d,h); addGeo(col,g,x,y,z); g.dispose();};
  const cyl=(col,rt,rb,h,x,y,z,seg=16)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg); addGeo(col,g,x,y,z); g.dispose();};
  const vent=[];
  for(const s of steads){
    const y=s.h;
    addBox(dark,58,.15,46,s.x,y+.08,s.z,[2]);
    // house
    const hx=s.x-16, hz=s.z+8; addBox(white,12,6,9,hx,y+3,hz,[0,1,4,5]); ob(hx-6,hx+6,hz-4.5,hz+4.5,y-1,y+9); gbl(roofC,13.2,10.2,3.4,hx,y+6,hz); addBox(dark,1.2,2.2,.15,hx-2,y+1.1,hz+4.55,[4]); addBox(winC,1.4,1.2,.15,hx+3,y+3.4,hz+4.55,[4]); addBox(winC,1.4,1.2,.15,hx-3.5,y+3.4,hz+4.55,[4]);
    addBox(white,1,3,1,hx+3,y+8,hz-2,[0,1,2,4,5]); vent.push({x:hx+3,y:y+9.7,z:hz-2,t:r()*2});
    // barn
    const bx=s.x+10, bz=s.z-6; addBox(red,18,8,26,bx,y+4,bz,[0,1,4,5]); ob(bx-9,bx+9,bz-13,bz+13,y-1,y+14); gbl(roofC,19.4,27.4,6,bx,y+8,bz); addBox(dark,6,6.5,.2,bx,y+3.25,bz+13.05,[4]); addBox(white,2.8,2,.2,bx,y+11,bz+13.05,[4]);
    doors.push({x:bx,z:bz+14});
    // silos
    for(const ox of [-1,1]){const sx=s.x+22+ox*4.5, sz=s.z-14; obC(sx,sz,3.2,y-1,y+21); cyl(metal,3.2,3.2,18,sx,y+9,sz); const dg=new THREE.SphereGeometry(3.2,16,8,0,TAU,0,Math.PI/2); addGeo(metal,dg,sx,y+18,sz); dg.dispose();}
    // tractor
    {const tx=s.x+rr(r,-6,6), tz=s.z+16; ob(tx-1.3,tx+1.3,tz-2,tz+2,y-1,y+3.7); addBox(red,2.2,1.4,3.6,tx,y+1.4,tz,[0,1,2,4,5]); addBox(dark,1.8,1.6,1.6,tx,y+2.9,tz-.6,[0,1,2,4,5]); for(const [wx,wz,rad] of [[-1.25,-1,1],[1.25,-1,1],[-1.15,1.3,.6],[1.15,1.3,.6]]){const g=new THREE.CylinderGeometry(rad,rad,.5,12).rotateZ(Math.PI/2); addGeo(dark,g,tx+wx,y+rad,tz+wz); g.dispose();}}
    // hay bales
    for(let k=0;k<6;k++) addBox(hay,1.2,.9,2.4,s.x-4+k%3*1.3,y+.45+Math.floor(k/3)*.9,s.z+16,[0,1,2,4,5]); ob(s.x-4.7,s.x-1.5,s.z+14.8,s.z+17.2,y-1,y+1.8);
    // fence
    for(let fx=-28;fx<=28;fx+=4){addBox(wood,.15,1.2,.15,s.x+fx,y+.6,s.z+23,[0,1,4,5]); addBox(wood,.15,1.2,.15,s.x+fx,y+.6,s.z-23,[0,1,4,5]);}
    addBox(wood,56,.12,.1,s.x,y+.9,s.z+23,[2,4,5]); addBox(wood,56,.12,.1,s.x,y+.9,s.z-23,[2,4,5]);
    yards.push({x0:s.x-26,x1:s.x+26,z0:s.z-20,z1:s.z+21});
  }
  // round bales in fields
  for(let k=0;k<70;k++){const f=pick(r,fields); if(!f||f.crop!==0) continue; const x=rr(r,f.x0,f.x1), z=rr(r,f.z0,f.z1); const g=new THREE.CylinderGeometry(.8,.8,1.3,12).rotateZ(Math.PI/2); addGeo(hay,g,x,gY(x,z)+.8,z); g.dispose();}
  // player silo
  const g0=gY(0,0); cyl(metal,4,4,24,0,g0+12,4,20); addBox(dark,5.5,.25,4,0,g0+24.1,-1.2,[0,1,2,3,4,5]); EYE.set(0,g0+24.25+1.7,-1.5);
  const rails=Col(); railRing(g0+24.25,3.4,rails); add(toMesh(rails,new THREE.MeshLambertMaterial({color:new THREE.Color(0x777b80).multiplyScalar(lk)})),false);
  // windmill
  {const wx=steads[0].x+30, wz=steads[0].z+18, wy=gY(wx,wz); obC(wx,wz,.5,wy-1,wy+14); addBox(metal,.5,14,.5,wx,wy+7,wz,[0,1,4,5]); for(let k=0;k<6;k++){const a=k/6*TAU; addBox(metal,.35,.35,.1,wx+Math.cos(a)*1.4,wy+14+Math.sin(a)*1.4,wz+.4,[4]);} flagAt(wx+3,wy,wz,r);}
  flagAt(steads[1].x-20,steads[1].h,steads[1].z+22,r); flagAt(steads[2].x+20,steads[2].h,steads[2].z+22,r);
  const C=(c)=>new THREE.Color(c).multiplyScalar(lk);
  add(toMesh(white,new THREE.MeshLambertMaterial({color:C(0xe8e2d4)})),true);
  add(toMesh(red,new THREE.MeshLambertMaterial({color:C(0xa1322a)})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:C(0x4a4642),side:THREE.DoubleSide})),true);
  add(toMesh(metal,new THREE.MeshLambertMaterial({color:C(0xb7bcc2)})),true);
  add(toMesh(dark,new THREE.MeshLambertMaterial({color:C(0x3a3028)})),true);
  add(toMesh(hay,new THREE.MeshLambertMaterial({color:C(0xd8b45a)})),true);
  add(toMesh(wood,new THREE.MeshLambertMaterial({color:C(0x8a6a48)})),false);
  add(toMesh(dirt,new THREE.MeshLambertMaterial({color:C(0x8a7250)})),false);
  add(toMesh(winC,litMat(P,C(0x2a3440),0xffc46a)),false);
  // tree lines
  const trees=[];
  {const NT=700, can=geoOf([[new THREE.IcosahedronGeometry(3.4,1),0,7,0],[new THREE.IcosahedronGeometry(2.4,1),1.6,8.4,.6]]), tr=new THREE.CylinderGeometry(.3,.45,5,6).translate(0,2.5,0);
   const fm=new THREE.InstancedMesh(can,new THREE.MeshLambertMaterial({color:0xffffff}),NT), tm=new THREE.InstancedMesh(tr,new THREE.MeshLambertMaterial({color:C(0x4a3524)}),NT), o=new THREE.Object3D(), c=new THREE.Color(); let n=0;
   const lines=[]; for(let i=0;i<9;i++){const vertical=r()<.5, fx=-900+170*Math.floor(r()*11), fz=60-130*Math.floor(r()*11); lines.push(vertical?{a:{x:fx,z:fz},b:{x:fx,z:fz-rr(r,200,500)}}:{a:{x:fx,z:fz},b:{x:fx+rr(r,200,500),z:fz}});}
   for(const s of steads) for(let k=0;k<10;k++) lines.push({a:{x:s.x-34+k*7,z:s.z-30},b:{x:s.x-34+k*7+1,z:s.z-30}});
   for(const L of lines){const len=Math.hypot(L.b.x-L.a.x,L.b.z-L.a.z), cnt=Math.max(1,Math.floor(len/9)); for(let k=0;k<cnt&&n<NT;k++){const t=k/cnt, x=L.a.x+(L.b.x-L.a.x)*t+rr(r,-2,2), z=L.a.z+(L.b.z-L.a.z)*t+rr(r,-2,2); if(Math.hypot(x,z)<170||segDist(roads,x,z)<6) continue; const y=gY(x,z), s=rr(r,.8,1.3);
     o.position.set(x,y-.2,z); o.rotation.set(0,r()*TAU,0); o.scale.set(s,s,s); o.updateMatrix(); fm.setMatrixAt(n,o.matrix); tm.setMatrixAt(n,o.matrix); c.setRGB(rr(r,.2,.3),rr(r,.36,.46),rr(r,.16,.22)).multiplyScalar(lk*1.1); fm.setColorAt(n,c); trees.push({x,z,y,s:s*1.15}); n++;}}
   fm.count=tm.count=n; fm.instanceMatrix.needsUpdate=tm.instanceMatrix.needsUpdate=true; if(fm.instanceColor) fm.instanceColor.needsUpdate=true; fm.frustumCulled=tm.frustumCulled=false; fm.userData.own=tm.userData.own=true; world.add(fm,tm);}
  for(const v of vent) vents.push(v);
  makeSteamPool(16);
  for(let i=0;i<5;i++){const m=new THREE.SpriteMaterial({map:puffTex,color:P.fog,transparent:true,depthWrite:false,opacity:rr(r,.05,.1)*(rain?1.5:1)}); const sp=new THREE.Sprite(m); sp.userData.own=true; const x=rr(r,-700,700), z=rr(r,-600,-1300); sp.position.set(x,gY(x,z)+rr(r,4,12),z); const sc=rr(r,180,320); sp.scale.set(sc,sc*.28,1); world.add(sp); fogs.push({s:sp,v:rr(r,1.5,4)});}
  scene.updateMatrixWorld(true);
  city={kind:'farm',county,P,pal:palKey,sunDir:sd.clone(),gY,gHit:gY,trees,lakeLvl:-999,spots:{
    yard:()=>{const i=Math.floor(MR()*yards.length); const R=yards[i]; return {pos:randIn(R,MR),rect:R,ground:true,door:doors[i]};},
    field:()=>{const R=pick(MR,fields); return R?{pos:randIn(R,MR),rect:R,ground:true}:null;},
    road:()=>{const s=pick(MR,roads), t=MR(); return {pos:{x:s.a.x+(s.b.x-s.a.x)*t,z:s.a.z+(s.b.z-s.a.z)*t},seg:s,ground:true};}
  }};
}

/* ---------- harbor ---------- */
function buildHarbor(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=1.0; PITCH_MIN=-.6; PITCH_MAX=.22;
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const lk=palKey==='night'?.38:palKey==='dusk'?.68:1, C=c=>new THREE.Color(c).multiplyScalar(lk), Y=3;
  const water=new THREE.Mesh(new THREE.PlaneGeometry(7000,7000).rotateX(-Math.PI/2),new THREE.MeshPhongMaterial({color:palKey==='night'?0x0b1624:palKey==='dusk'?0x40405a:0x2f5d78,shininess:70,specular:0x666666,map:(()=>{const t=grainTex(260); waterTex.push(t); return t;})()})); water.userData.own=true; water.userData.noCast=true; world.add(water);
  const conc=Col(), steelC=Col(), yel=Col(), whiteC=Col(), hullC=Col(), dark=Col(), winC=Col(), wh=Col(), roofC=Col();
  addBox(conc,800,6,430,0,Y-3,-175,[0,1,2,4,5],()=>[800/6,430/6,0]);
  addBox(conc,1400,6,230,0,Y-3,-680,[0,1,2,4,5],()=>[1400/6,230/6,0]);
  addBox(conc,40,6,180,-420,Y-3,-470,[0,1,2,4,5]);
  // containers
  const cCols=[0xb8342b,0x2b5f9e,0x2f8a4e,0xd28a1f,0x7b7f84,0x8a3b6b], ccol=cCols.map(()=>Col()), stacks=[];
  const corr=(()=>{const c=document.createElement('canvas'); c.width=64; c.height=16; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,64,16); x.fillStyle='rgba(0,0,0,.28)'; for(let k=0;k<16;k++) x.fillRect(k*4,0,2,16); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=ANISO; return t;})();
  const aisles=[];
  for(let bx=-280;bx<=280;bx+=64) for(let bz=-90;bz>=-350;bz-=46){
    if(Math.abs(bx)<30&&bz>-100) continue;
    for(let i=0;i<3;i++) for(let j=0;j<6;j++){
      if(r()<.3) continue; const hgt=1+Math.floor(r()*r()*3.2);
      const x=bx+(i-1)*12.5, z=bz-j*2.6;
      for(let k=0;k<hgt;k++){const ci=Math.floor(r()*cCols.length); addBox(ccol[ci],12.2,2.59,2.44,x,Y+1.3+k*2.6,z,[0,1,2,4,5],f=>f<2?[1,1,0]:[4,1,0]);}
      stacks.push({x,z,h:hgt});
    }
    aisles.push({x0:bx-18.5,x1:bx+18.5,z0:bz-21,z1:bz-17.5});
    aisles.push({x0:bx+20,x1:bx+27,z0:bz-17,z1:bz+2});
  }
  ccol.forEach((col,i)=>add(toMesh(col,new THREE.MeshLambertMaterial({map:corr,color:C(cCols[i])})),true));
  // gantry cranes
  const crane=(x,z,h,boom)=>{for(const [lx,lz] of [[-9,-7],[9,-7],[-9,7],[9,7]]) addBox(yel,1.4,h,1.4,x+lx,Y+h/2,z+lz,[0,1,4,5]); addBox(yel,20,2.2,16,x,Y+h,z,[0,1,2,3,4,5]); if(boom) addBox(yel,4,2.4,boom,x,Y+h+3,z-boom/2+10,[0,1,2,3,4,5]); addBox(whiteC,5,3.5,5,x+5,Y+h-3,z,[0,1,2,4,5]);};
  for(const cx of [-260,-120,120,260]) crane(cx,-372,44,70);
  // player crane
  for(const [lx,lz] of [[-9,6],[9,6],[-9,22],[9,22]]) addBox(yel,1.4,40,1.4,lx,Y+20,lz,[0,1,4,5]);
  addBox(yel,22,1.6,18,0,Y+40.8,14,[0,1,2,3,4,5]); addBox(yel,3.4,.25,8,0,Y+41.7,3,[0,1,2,3,4,5]); EYE.set(0,Y+41.8+1.7,1.5);
  const rails=Col(); railRing(Y+41.8,2.6,rails); add(toMesh(rails,new THREE.MeshLambertMaterial({color:C(0x3a3d42)})),false);
  // ship
  const shx=rr(r,-140,140), shz=-544, deckY=11;
  addBox(hullC,200,14,28,shx,deckY-7,shz,[0,1,2,4,5]); addBox(dark,200,2,28.2,shx,1.2,shz,[0,1,4,5]);
  const bridgeX=shx+(r()<.5?1:-1)*80; addBox(whiteC,22,16,24,bridgeX,deckY+8,shz,[0,1,2,4,5]); ob(bridgeX-11,bridgeX+11,shz-12,shz+12,deckY-1,deckY+16); for(let k=0;k<4;k++) addBox(winC,20,1,.2,bridgeX,deckY+4+k*3.4,shz+12.05,[4]);
  {const g=new THREE.CylinderGeometry(2.4,2.8,9,14); addGeo(dark,g,bridgeX+(bridgeX>shx?6:-6),deckY+20,shz); g.dispose();}
  const shipDeck={x0:shx-90,x1:shx+90,z0:shz-10,z1:shz+11};
  const ccol2=cCols.map(()=>Col()); for(let k=0;k<26;k++){const x=shx-85+Math.floor(r()*14)*12.6; if(Math.abs(x-bridgeX)<16) continue; const z=shz-9+Math.floor(r()*7)*2.6, ci=Math.floor(r()*cCols.length); ob(x-6.1,x+6.1,z-1.22,z+1.22,deckY,deckY+2.6); addBox(ccol2[ci],12.2,2.59,2.44,x,deckY+1.3,z,[0,1,2,4,5],f=>f<2?[1,1,0]:[4,1,0]);}
  ccol2.forEach((col,i)=>add(toMesh(col,new THREE.MeshLambertMaterial({map:corr,color:C(cCols[i])})),true));
  // warehouses on far quay
  const doors=[];
  for(let k=0;k<5;k++){const wx=-480+k*240+rr(r,-20,20), wz=-720; addBox(wh,120,14,60,wx,Y+7,wz,[0,1,2,4,5]); const g=gableGeo(122,62,5); addGeo(roofC,g,wx,Y+14,wz); g.dispose();
    for(let d=0;d<3;d++){addBox(dark,8,7,.2,wx-36+d*36,Y+3.5,wz+30.05,[4]); doors.push({x:wx-36+d*36,z:wz+31});}
    addBox(winC,100,1.2,.2,wx,Y+11,wz+30.05,[4]);}
  // light towers
  for(const [lx,lz] of [[-330,-60],[330,-60],[-330,-360],[330,-360],[-600,-600],[600,-600]]){addBox(steelC,.8,32,.8,lx,Y+16,lz,[0,1,4,5]); addBox(winC,4,1.5,1.5,lx,Y+32,lz,[0,1,2,4,5]);}
  // lighthouse + breakwater
  addBox(conc,600,5,14,-200,1,-1150,[0,1,2,4,5]); {const g=new THREE.CylinderGeometry(4,6,32,14); addGeo(whiteC,g,90,19,-1150); g.dispose(); addBox(winC,6,4,6,90,37,-1150,[0,1,2,4,5]);}
  // far city skyline across the water
  {const fac={}; const mats=P.walls.slice(0,3).map(w=>{const t=facadeTex(r,w,P); return new THREE.MeshLambertMaterial({map:t.map,emissive:t.em?0xffffff:0x000000,emissiveMap:t.em,emissiveIntensity:P.em||0});});
   for(let i=0;i<40;i++){const x=rr(r,-1600,1600), z=rr(r,-1500,-2100), w=rr(r,40,90), d=rr(r,40,80), h=rr(r,40,220), v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]);}
   for(const k in fac) add(toMesh(fac[k],mats[+k]),false);}
  add(toMesh(conc,new THREE.MeshLambertMaterial({color:C(0x9a9890),map:grainTex(1)})),true);
  add(toMesh(steelC,new THREE.MeshLambertMaterial({color:C(0x50545a)})),true);
  add(toMesh(yel,new THREE.MeshLambertMaterial({color:C(0xe2b11e)})),true);
  add(toMesh(whiteC,new THREE.MeshLambertMaterial({color:C(0xe9e7e1)})),true);
  add(toMesh(hullC,new THREE.MeshLambertMaterial({color:C(pick(r,[0x1f3a5a,0x6a1f1f,0x2b2f33]))})),true);
  add(toMesh(dark,new THREE.MeshLambertMaterial({color:C(0x24262a)})),true);
  add(toMesh(wh,new THREE.MeshLambertMaterial({color:C(0x8c949a)})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:C(0x55575b),side:THREE.DoubleSide})),true);
  add(toMesh(winC,litMat(P,C(0x30404c),0xffd38a)),false);
  flagAt(shx-60,deckY,shz,r); flagAt(-300,Y,-560,r); flagAt(300,Y,-570,r);
  vents.push({x:bridgeX+(bridgeX>shx?6:-6),y:deckY+24.5,z:shz,t:0,big:true}); makeSteamPool(14);
  for(let i=0;i<5;i++){const m=new THREE.SpriteMaterial({map:puffTex,color:P.fog,transparent:true,depthWrite:false,opacity:rr(r,.05,.1)*(rain?1.5:1)}); const sp=new THREE.Sprite(m); sp.userData.own=true; sp.position.set(rr(r,-800,800),rr(r,4,14),rr(r,-800,-1400)); const sc=rr(r,180,320); sp.scale.set(sc,sc*.28,1); world.add(sp); fogs.push({s:sp,v:rr(r,1.5,4)});}
  scene.updateMatrixWorld(true);
  const quayB={x0:-650,x1:650,z0:-688,z1:-570};
  city={kind:'harbor',P,pal:palKey,sunDir:sd.clone(),gY:()=>-4,gHit:()=>0,lakeLvl:0,spots:{
    stack:()=>{const s=pick(MR,stacks.filter(q=>q.h>=1)); return {pos:{x:s.x+rr(MR,-5,5),z:s.z},rect:{x0:s.x-5.5,x1:s.x+5.5,z0:s.z-.6,z1:s.z+.6},y:Y+s.h*2.6};},
    aisle:()=>{const R=pick(MR,aisles); return {pos:randIn(R,MR),rect:R,y:Y};},
    quay:()=>{const i=Math.floor(MR()*doors.length); return {pos:randIn(quayB,MR),rect:quayB,y:Y,door:doors[i]};},
    ship:()=>({pos:randIn(shipDeck,MR),rect:shipDeck,y:deckY})
  }};
}

/* ---------- office ---------- */
function buildOffice(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=1.0; PITCH_MIN=-1.15; PITCH_MAX=.45;
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const lk=palKey==='night'?.4:palKey==='dusk'?.7:1, C=c=>new THREE.Color(c).multiplyScalar(lk), EY=61.7;
  EYE.set(0,EY,-1.45); // leaning out past the ledge so the street below is visible
  world.add(new THREE.AmbientLight(0xfff2dd,palKey==='night'?.55:palKey==='dusk'?.3:.15));
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:P.ground,map:grainTex(700)})); ground.userData.own=true; ground.userData.noCast=true; world.add(ground); solid.push(ground);
  const pave=Col(), slab=Col(), core=Col(), desk=Col(), band=Col(), mull=Col(), lights=Col(), roofC=Col(), stuff=Col();
  // player's building + parapet
  addBox(stuff,40,60,30,0,30,14.5,[0,1,2,4,5]);
  const parapet=new THREE.Mesh(new THREE.BoxGeometry(40,1.05,.35),new THREE.MeshLambertMaterial({color:new THREE.Color(P.roof).multiplyScalar(1.15)})); parapet.userData.own=true; parapet.position.set(0,60.5,-.95); world.add(parapet); solid.push(parapet);
  // street
  addBox(pave,1400,.2,8,0,.1,-4,[2]); addBox(pave,1400,.2,8,0,.1,-46,[2]);
  const walks=[{x0:-300,x1:300,z0:-6,z1:-3},{x0:-300,x1:300,z0:-48,z1:-44}];
  const floorSpots=[], towers=[];
  const glassMat=new THREE.MeshPhongMaterial({color:palKey==='night'?0x223344:0x9fc4dc,transparent:true,opacity:palKey==='night'?.07:.17,shininess:90,specular:0xffffff,depthWrite:false});
  function tower(x0,x1,z0,z1,floors,fh){
    const w=x1-x0, d=z1-z0, cx=(x0+x1)/2, cz=(z0+z1)/2, h=floors*fh;
    addBox(core,w*.3,h,d*.32,cx,h/2,z0+d*.2,[0,1,2,4,5]); ob(cx-w*.15,cx+w*.15,z0+d*.04,z0+d*.36,0,h);
    addBox(core,w,h,.5,cx,h/2,z0+.25,[4]);
    for(let f=0;f<=floors;f++){
      const y=f*fh; addBox(slab,w,.45,d,cx,y+.22,cz,[2,3]); addBox(band,w+.3,.9,d+.3,cx,y+.1,cz,[0,1,4,5]);
      if(f===floors) break;
      for(let c=0;c<Math.floor(w/8);c++) for(const rz of [z1-4.5,z1-9.5]){const dx=x0+4+c*8+rr(r,-.5,.5); ob(dx-.8,dx+.8,rz-.4,rz+.4,y+.45,y+1.3); addBox(desk,1.6,.75,.8,dx,y+.45+.375,rz,[0,1,2,4,5]); addBox(band,.55,.38,.06,dx,y+.45+.95,rz-.2,[4]);}
      for(const lz of [z1-3,z1-8,z1-13]) addBox(lights,w*.75,.06,.6,cx,y+fh-.1,lz,[3]);
      floorSpots.push({x0:x0+2.5,x1:x1-2.5,z0:z1-13,z1:z1-1.6,y:y+.45,door:{x:cx,z:z0+d*.38}});
    }
    for(let mx=x0;mx<=x1+.01;mx+=3) addBox(mull,.14,h,.18,mx,h/2,z1+.1,[0,1,4]);
    const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glassMat); glassMeshes.push(g); g.userData.own=true; g.position.set(cx,h/2,cz); g.renderOrder=2; world.add(g);
    towers.push({x0,x1,z0,z1,h});
  }
  const fhs=3.8;
  tower(-36,36,-96,-66,18,fhs);
  tower(68,128,-188,-150,30,fhs);
  tower(-152,-96,-252,-214,20,fhs);
  tower(-50,34,-450,-410,38,fhs);
  tower(160,226,-372,-330,26,fhs);
  // filler buildings with regular facades
  const fac={}, roofs=[], mats=P.walls.map(w=>{const t=facadeTex(r,w,P); return new THREE.MeshLambertMaterial({map:t.map,emissive:t.em?0xffffff:0x000000,emissiveMap:t.em,emissiveIntensity:P.em||0});});
  for(let i=0;i<60;i++){
    const w=rr(r,22,46), d=rr(r,20,40), x=rr(r,-520,520), z=rr(r,-90,-760), h=r()<.6?rr(r,14,52):rr(r,60,140);
    const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
    if(towers.some(t=>x1>t.x0-6&&x0<t.x1+6&&z1>t.z0-6&&z0<t.z1+6)) continue;
    if(z1>-56&&Math.abs(x)<70) continue;
    if(roofs.some(b=>x1>b.x0-4&&x0<b.x1+4&&z1>b.z0-4&&z0<b.z1+4)) continue;
    const v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]);
    addBox(stuff,w+.6,.9,.35,x,h+.45,z1-.17,[0,1,2,4,5]);
    roofs.push({x0,x1,z0,z1,h});
  }
  for(let i=0;i<40;i++){const x=rr(r,-2000,2000), z=rr(r,-1100,-1900), w=rr(r,40,90), d=rr(r,40,80), h=rr(r,60,260), v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]);}
  for(const k in fac) add(toMesh(fac[k],mats[+k]),true);
  add(toMesh(pave,new THREE.MeshLambertMaterial({color:P.pave,map:grainTex(1)})),true);
  add(toMesh(slab,new THREE.MeshLambertMaterial({color:C(0xb9b6ae)})),true);
  add(toMesh(core,new THREE.MeshLambertMaterial({color:C(0xd6d2c8)})),true);
  add(toMesh(desk,new THREE.MeshLambertMaterial({color:C(0x8a7458)})),true);
  add(toMesh(band,new THREE.MeshLambertMaterial({color:C(0x3a3f46)})),true);
  add(toMesh(mull,new THREE.MeshLambertMaterial({color:C(0x2c3036)})),false);
  add(toMesh(lights,new THREE.MeshBasicMaterial({color:palKey==='night'?0xfff1cf:palKey==='dusk'?0xd9d3c4:0xe8ecee})),false);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:P.roof})),true);
  add(toMesh(stuff,new THREE.MeshLambertMaterial({color:new THREE.Color(P.roof).multiplyScalar(.85)})),true);
  // cars on the street below
  for(let i=0;i<10;i++){const lane=i%2, g=new THREE.Group(), col=pick(r,CARS); const bd=new THREE.Mesh(CG.body,mat(col)); bd.position.y=.75; const gl=new THREE.Mesh(CG.glass,mat(0x1d2630)); gl.position.set(0,1.6,-.2); g.add(bd,gl); g.rotation.y=lane?Math.PI/2:-Math.PI/2; world.add(g); cars.push({g,L:{ax:'x',c:lane?-21:-29,dir:lane?1:-1},s:rr(r,-850,850),v:rr(r,8,13)});}
  const roofCands=roofs.filter(b=>b.h<EY-4&&Math.abs(Math.atan2((b.x0+b.x1)/2,-(b.z0+b.z1)/2))<YAW_LIM+.1);
  for(const b of roofCands.slice(0,4)) flagAt((b.x0+b.x1)/2,b.h,(b.z0+b.z1)/2,r);
  scene.updateMatrixWorld(true);
  city={kind:'office',P,pal:palKey,sunDir:sd.clone(),spots:{
    floor:()=>{const R=pick(MR,floorSpots); return {pos:randIn(R,MR),rect:R,y:R.y,door:R.door};},
    street:()=>{const R=pick(MR,walks); return {pos:randIn(R,MR),rect:R,y:.2};},
    roof:()=>{const b=pick(MR,roofCands); if(!b) return null; const R={x0:b.x0+1.5,x1:b.x1-1.5,z0:b.z0+1.5,z1:b.z1-1.5}; return {pos:randIn(R,MR),rect:R,y:b.h};}
  }};
}
function buildGarage(seed,palKey,rain){
  const {r,P,sd}=worldBase(seed,palKey,rain); YAW_LIM=1.05; PITCH_MIN=-.95; PITCH_MAX=.4;
  const add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);};
  const lk=palKey==='night'?.45:palKey==='dusk'?.72:1, C=c=>new THREE.Color(c).multiplyScalar(lk);
  const LH=3.2, NL=5, TOPB=NL*LH;            // garage B: ground + 5 decks, roof deck at 16 m
  const AY=6*LH;                             // your garage: roof deck at 19.2 m
  EYE.set(0,AY+1.55,-1.25);
  world.add(new THREE.AmbientLight(0xfff2dd,palKey==='night'?.5:palKey==='dusk'?.28:.12));
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:P.ground,map:grainTex(700)})); ground.userData.own=true; ground.userData.noCast=true; world.add(ground); solid.push(ground);
  const conc=Col(), slab=Col(), barrier=Col(), asph=Col(), paint=Col(), lights=Col(), stair=Col(), roofC=Col(), stuff=Col(), yel=Col();
  // ---- your garage (A): only the roof edge matters
  addBox(stuff,70,AY,44,0,AY/2,21.6,[0,1,4,5]); addBox(slab,70,.4,44,0,AY-.2,21.6,[2]);
  for(let f=1;f<6;f++) addBox(conc,70.4,.5,.3,0,f*LH,-.42,[4,5,2,3]);
  const parapet=new THREE.Mesh(new THREE.BoxGeometry(70,.95,.3),new THREE.MeshLambertMaterial({color:C(0xa9a59c)})); parapet.userData.own=true; parapet.position.set(0,AY+.47,-.55); world.add(parapet); solid.push(parapet);
  addBox(yel,70,.02,.25,0,AY+.01,-2.4,[2]);
  // ---- the lot between the garages
  const LZ0=-6, LZ1=-38;
  addBox(asph,150,.12,40,0,.06,-22,[2]);
  const lotCars=[];
  for(const rz of [-12,-30]) for(let x=-54;x<=54;x+=3.1){ addBox(paint,.12,.02,5,x-1.55,.13,rz,[2]); if(r()<.55){lotCars.push({x,z:rz,rot:rz>-20?0:Math.PI});} }
  // ---- garage B: open decks, pillars, barriers, parked cars
  const BX0=-48, BX1=48, BZ0=-72, BZ1=-42, bcx=(BX0+BX1)/2, bcz=(BZ0+BZ1)/2, BW=BX1-BX0, BD=BZ1-BZ0;
  const decks=[];
  for(let f=0;f<=NL;f++){
    const y=f*LH;
    if(f>0){ addBox(slab,BW,.38,BD,bcx,y-.19,bcz,[2,3]); addBox(conc,BW+.2,.55,BD+.2,bcx,y-.3,bcz,[0,1,4,5]); }
    else addBox(slab,BW,.1,BD,bcx,.05,bcz,[2]);
    if(f<NL){ for(let x=BX0+1;x<=BX1-1+.01;x+=9.4) for(const z of [BZ1-1,bcz,BZ0+1]){ addBox(conc,.7,LH,.7,x,y+LH/2,z,[0,1,4,5]); ob(x-.45,x+.45,z-.45,z+.45,y,y+LH); }
      for(const lz of [BZ1-6,bcz,BZ0+6]) addBox(lights,BW*.8,.05,.25,bcx,y+LH-.42,lz,[3]); }
    if(f>0){ addBox(barrier,BW,.82,.22,bcx,y+.41,BZ1-.11,[0,1,2,4,5]); addBox(barrier,BW,.82,.22,bcx,y+.41,BZ0+.11,[0,1,2,4,5]); addBox(barrier,.22,.82,BD,BX0+.11,y+.41,bcz,[0,1,2,4,5]); }
    // stripe and parking bays
    addBox(yel,BW-4,.02,.18,bcx,y+.02,bcz-.1,[2]);
    for(const rz of [BZ1-4.4,BZ0+4.4]) for(let x=BX0+3;x<=BX1-3;x+=3.1){ addBox(paint,.1,.02,4.6,x-1.55,y+.03,rz,[2]); if(r()<(f===NL?.35:.6)) lotCars.push({x,z:rz,y,rot:rz>bcz?0:Math.PI}); }
    decks.push({x0:BX0+2,x1:BX1-2,z0:BZ0+1.8,z1:BZ1-1.8,y:y+(f===0?.1:0)});
  }
  // ramp tower on the east end, stair core on the west
  for(let f=0;f<NL;f++){ const m=new THREE.Mesh(new THREE.BoxGeometry(7,.35,BD*1.02),new THREE.MeshLambertMaterial({color:C(0x8f8b84)})); m.userData.own=true; m.position.set(BX1+4,f*LH+LH/2,bcz); m.rotation.x=(f%2?1:-1)*Math.atan(LH/BD); world.add(m); solid.push(m); }
  addBox(barrier,.25,TOPB+.8,BD,BX1+7.6,(TOPB+.8)/2,bcz,[0,1,2,4,5]);
  addBox(stair,6,TOPB+3.4,6,BX0-3,(TOPB+3.4)/2,BZ1-3,[0,1,2,4,5]); ob(BX0-6,BX0,BZ1-6,BZ1,0,TOPB+3.4);
  // level signs on the front barrier
  const signMat=f=>{const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'); x.fillStyle='#1f5fa8'; x.fillRect(0,0,256,128); x.fillStyle='#fff'; x.font='bold 92px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('P'+f,128,68); return new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),emissive:P.em?0xffffff:0,emissiveMap:P.em?new THREE.CanvasTexture(c):null,emissiveIntensity:.5});};
  for(let f=1;f<=NL;f++) for(const sx of [-30,30]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),signMat(f)); m.userData.own=true; m.position.set(sx,f*LH+.42,BZ1+.02); world.add(m); }
  // pay booth and boom gate at the lot entrance
  addBox(stuff,2.4,2.6,2.4,58,1.3,-8,[0,1,2,4,5]); ob(56.8,59.2,-9.2,-6.8,0,2.6);
  addBox(yel,7,.12,.12,62,1.1,-4,[0,1,2,3,4,5]);
  // parked cars (shared geometry, merged per colour)
  const carCols={}, cGlass=Col(), cTire=Col(), cLamp=Col();
  for(const c of lotCars){ const y=c.y||0, k=pick(r,CARS), f=c.rot?1:-1; carCols[k]=carCols[k]||Col();
    addBox(carCols[k],1.8,.7,4.4,c.x,y+.62,c.z,[0,1,2,4,5]); addBox(carCols[k],1.66,.08,2.1,c.x,y+1.66,c.z-f*.25,[2]);
    addBox(cGlass,1.62,.62,2.2,c.x,y+1.3,c.z-f*.25,[0,1,4,5]);
    for(const [wx,wz] of [[-.86,1.35],[.86,1.35],[-.86,-1.35],[.86,-1.35]]) addBox(cTire,.24,.62,.62,c.x+wx,y+.31,c.z+wz,[0,1,4,5]);
    addBox(cLamp,1.5,.14,.04,c.x,y+.78,c.z+f*2.21,[4,5]);
    ob(c.x-1,c.x+1,c.z-2.3,c.z+2.3,y,y+1.7); }
  add(toMesh(cGlass,new THREE.MeshPhongMaterial({color:0x1b232c,shininess:80,specular:0x8899aa})),true);
  add(toMesh(cTire,new THREE.MeshLambertMaterial({color:0x111111})),false);
  add(toMesh(cLamp,new THREE.MeshBasicMaterial({color:P.em?0xff5544:0x9a2a22})),false);
  for(const k in carCols) add(toMesh(carCols[k],new THREE.MeshLambertMaterial({color:C(+k)})),true);
  // ---- surroundings
  addBox(asph,1400,.1,12,0,.05,-82,[2]); addBox(asph,12,.1,1400,80,.05,-300,[2]);
  const fac={}, roofs=[], mats=P.walls.map(w=>{const t=facadeTex(r,w,P); return new THREE.MeshLambertMaterial({map:t.map,emissive:t.em?0xffffff:0x000000,emissiveMap:t.em,emissiveIntensity:P.em||0});});
  for(let i=0;i<70;i++){
    const w=rr(r,18,40), d=rr(r,16,34), x=rr(r,-420,420), z=rr(r,-96,-640), h=r()<.6?rr(r,10,36):rr(r,40,110);
    const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
    if(z1>-90&&x0<88&&x1>-90) continue; if(x0<88&&x1>72) continue;
    if(roofs.some(b=>x1>b.x0-4&&x0<b.x1+4&&z1>b.z0-4&&z0<b.z1+4)) continue;
    const v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]);
    roofs.push({x0,x1,z0,z1,h});
  }
  for(const sx of [-1,1]) for(let i=0;i<5;i++){ const w=rr(r,20,34), d=rr(r,20,30), h=rr(r,14,40), x=sx*rr(r,100,180), z=rr(r,-10,-80); const v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]); }
  for(let i=0;i<40;i++){const x=rr(r,-2000,2000), z=rr(r,-900,-1700), w=rr(r,40,90), d=rr(r,40,80), h=rr(r,50,220), v=Math.floor(r()*mats.length); fac[v]=fac[v]||Col(); addBox(fac[v],w,h,d,x,h/2,z,[0,1,4,5],f=>f<2?[d/32,h/28,r()]:[w/32,h/28,r()]); addBox(roofC,w,h,d,x,h/2,z,[2]);}
  for(const k in fac) add(toMesh(fac[k],mats[+k]),true);
  add(toMesh(conc,new THREE.MeshLambertMaterial({color:C(0xb4afa6),map:grainTex(1)})),true);
  add(toMesh(slab,new THREE.MeshLambertMaterial({color:C(0x8e8b86),map:grainTex(1)})),true);
  add(toMesh(barrier,new THREE.MeshLambertMaterial({color:C(0xc4bfb5),map:grainTex(1)})),true);
  add(toMesh(asph,new THREE.MeshLambertMaterial({color:C(0x3a3b3e),map:grainTex(1)})),true);
  add(toMesh(paint,new THREE.MeshLambertMaterial({color:C(0xe9e7df)})),false);
  add(toMesh(yel,new THREE.MeshLambertMaterial({color:C(0xe2b11e)})),false);
  add(toMesh(stair,new THREE.MeshLambertMaterial({color:C(0x6f6a62)})),true);
  add(toMesh(stuff,new THREE.MeshLambertMaterial({color:C(0x77736c)})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:P.roof})),true);
  add(toMesh(lights,new THREE.MeshBasicMaterial({color:palKey==='night'?0xfff3d6:palKey==='dusk'?0xf4ead2:0xe6eaec})),false);
  const roofCands=roofs.filter(b=>b.h<AY+20&&Math.abs(Math.atan2((b.x0+b.x1)/2,-(b.z0+b.z1)/2))<YAW_LIM);
  for(const b of roofCands.slice(0,3)) flagAt((b.x0+b.x1)/2,b.h,(b.z0+b.z1)/2,r);
  scene.updateMatrixWorld(true);
  const lot={x0:-56,x1:56,z0:LZ1+1,z1:LZ0-1,y:.12};
  city={kind:'garage',P,pal:palKey,sunDir:sd.clone(),spots:{
    level:()=>{const R=pick(MR,decks.slice(1)); return {pos:randIn(R,MR),rect:R,y:R.y};},
    lot:()=>({pos:randIn(lot,MR),rect:lot,y:lot.y}),
    ground:()=>{const R=decks[0]; return {pos:randIn(R,MR),rect:R,y:R.y};}
  }};
}
function aimable(x,y,z){ const d=Math.hypot(x-EYE.x,z-EYE.z), pt=Math.atan2(y+1.2-EYE.y,d); return pt>PITCH_MIN+.08&&pt<PITCH_MAX-.05&&Math.abs(Math.atan2(x-EYE.x,-(z-EYE.z)))<YAW_LIM-.04; }
function findSpotGeneric(type,band,r){
  const gen=city.spots[type]; if(!gen) return null;
  for(let i=0;i<300;i++){
    const s=gen(r); if(!s) continue;
    if(s.ground) s.y=city.gY(s.pos.x,s.pos.z);
    const dx=s.pos.x-EYE.x, dz=s.pos.z-EYE.z, d=Math.hypot(dx,dz);
    if(d<band[0]||d>band[1]) continue;
    if(Math.abs(Math.atan2(dx,-dz))>YAW_LIM+.1) continue;
    if(blockedAt(s.pos.x,s.pos.z,s.y,.6)||!aimable(s.pos.x,s.y,s.pos.z)) continue;
    if(!los(s.pos.x,s.y+1.6,s.pos.z)||!los(s.pos.x,s.y+1.0,s.pos.z)) continue;
    s.type=type; s.d=d; return s;
  }
  return null;
}

function buildWorld(map,seed,pal,rain){ ({forest:buildForest,farm:buildFarm,harbor:buildHarbor,office:buildOffice,garage:buildGarage,range:buildRange,warehouse:buildWarehouse,hotel:buildHotel,subway:buildSubway,apartments:buildApartments,snow:buildSnow,desert:buildDesert,stadium:buildStadium,suburb:buildSuburb,bridge:buildBridge}[map]||buildCity)(seed,pal,rain); finalizeShadows(); if(FX()) upgradeWorld(); }
function finalizeShadows(){
  world.traverse(o=>{ if(!o.isMesh) return; const m=o.material; const skip=!m||m.isMeshBasicMaterial||m.transparent||m.isShaderMaterial;
    o.receiveShadow=!skip; o.castShadow=!skip&&!o.userData.noCast; });
}
const _sf=new THREE.Vector3();
function updateShadow(){
  if(!sunLight||!renderer.shadowMap.enabled||!city) return;
  const fwd=V3().set(0,0,-1).applyQuaternion(camera.quaternion);
  let size;
  if(state==='killcam'&&kc){ _sf.set(kc.p.x,kc.p.y,kc.p.z); size=30; }
  else if(scoped&&state==='play'){ const d=Math.min(lastRange||250,1400); _sf.copy(camera.position).addScaledVector(fwd,d); size=clamp(d*Math.tan(camera.fov*Math.PI/360)*2.4,14,110); }
  else { _sf.copy(camera.position).addScaledVector(fwd,150); _sf.y=Math.max(0,_sf.y-40); size=175; }
  const tx=size*2/sunLight.shadow.mapSize.x; _sf.x=Math.round(_sf.x/tx)*tx; _sf.z=Math.round(_sf.z/tx)*tx; _sf.y=Math.round(_sf.y/tx)*tx;
  sunLight.target.position.copy(_sf); sunLight.position.copy(_sf).addScaledVector(city.sunDir,700); sunLight.target.updateMatrixWorld();
  const c=sunLight.shadow.camera; if(Math.abs(c.right-size)>.5){c.left=c.bottom=-size; c.right=c.top=size; c.updateProjectionMatrix();}
}
function los(x,y,z){
  const t=new THREE.Vector3(x,y,z), d=t.clone().sub(EYE), L=d.length();
  RC.set(EYE,d.divideScalar(L)); RC.near=0; RC.far=L-.5;
  if(RC.intersectObjects(solid,false).length) return false;
  if(city&&city.gY&&(terrainBlock(EYE,t)||treeBlock(EYE,t))) return false;
  return true;
}
const RC=new THREE.Raycaster();

