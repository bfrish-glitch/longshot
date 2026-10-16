/* Longshot 3D · cq.js · close-quarters maps and contracts: warehouse, hotel atrium, subway platform, apartments */
'use strict';
const CQ_TXT={
  warehouse:` You're lying at a roof skylight, looking straight down into a warehouse. Crates, pallet racks and thin office walls everywhere: <b>the Breacher .50 shoots through them</b>. Once the shooting starts they fire back up at the skylight.`,
  hotel:` You're on a 5th-floor balcony inside a hotel atrium. Targets are on the facing balconies and in the lobby below. Glass balcony rails nudge your rounds off line. They fire back once alerted.`,
  subway:` You're at a maintenance window above the platforms. The target in the <b>white suit</b> is somewhere in the rush-hour crowd. <b>A train arrives in about 45 seconds</b>; if he's still alive when the doors close, he's gone.`,
  apartments:` You're inside a dark apartment, rifle back from the window. Across the street, a whole building of lit rooms. Targets move between rooms: wait for them to cross a window.`
};
Object.assign(CIVT,{warehouse:['wfloor'],hotel:['balc','lobby'],subway:['plat','plat2'],apartments:['room','street']});
MISSIONS.push(
  {n:'Warehouse Breach',pal:'day',map:'warehouse',hos:6,civ:3,wind:0,move:.6,time:120,esc:8,band:[6,70],types:['wfloor'],civT:['wfloor'],fight:true,hp:3,minZoom:1.5,ch:['heads','fast','acc']},
  {n:'Room Service',pal:'night',map:'hotel',hos:6,civ:10,wind:0,move:.6,time:130,esc:8,band:[10,70],types:['balc','balc','lobby'],civT:['balc','lobby'],fight:true,hp:3,minZoom:1.5,ch:['heads','fast','quiet']},
  {n:'Rush Hour',pal:'night',map:'subway',mode:'train',hos:2,hvt:1,civ:14,wind:0,move:.3,time:120,esc:7,band:[10,135],types:['plat','plat2'],civT:['plat','plat2'],minZoom:1.5,ch:['quiet','heads','acc']},
  {n:'Across the Street',pal:'night',map:'apartments',hos:4,civ:10,wind:1,move:.55,time:150,esc:6,band:[28,90],types:['room','room','room','street'],civT:['room','street'],minZoom:1.5,ch:['quiet','heads','fast']}
);
REC.push(['fifty','Crates, racks and office walls: the .50 goes straight through.'],['semi','Six shooters across an atrium; quick follow-ups.'],['bolt','One precise shot into a crowd; nothing fancy.'],['bolt','Short windows of opportunity reward a steady, precise rifle.']);
const CQ=(c,lk)=>new THREE.Color(c).multiplyScalar(lk);
function cqBase(seed,palKey,rain,eye,yaw,pmin,pmax){
  const B=worldBase(seed,palKey,rain); EYE.set(...eye); YAW_LIM=yaw; PITCH_MIN=pmin; PITCH_MAX=pmax;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:B.P.ground,map:grainTex(700)})); ground.userData.own=true; ground.userData.noCast=true; world.add(ground); solid.push(ground);
  B.add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);}; B.lk=palKey==='night'?.55:palKey==='dusk'?.75:1; return B;
}
function cqCrateStack(col,x,z,h,r){ for(let k=0;k<h;k++){ const s=rr(r,1,1.25); addBox(col,s,s*.95,s,x+rr(r,-.08,.08),k*1.2+s*.475,z+rr(r,-.08,.08),[0,1,2,4,5]); } ob(x-.7,x+.7,z-.7,z+.7,0,h*1.2); }

/* ---------- warehouse: shooting down through a roof skylight ---------- */
function buildWarehouse(seed,palKey,rain){
  const {r,P,sd,add,lk}=cqBase(seed,palKey,rain,[0,15.5,-12.3],1.25,-1.5,-.05);
  world.add(new THREE.AmbientLight(0xfff4e0,.32));
  const conc=Col(), wall=Col(), roof=Col(), crate=Col(), crate2=Col(), rack=Col(), shelf=Col(), part=Col(), lamp=Col(), yel=Col(), fork=Col();
  const X0=-32,X1=32,Z0=-64,Z1=-8,HT=14;
  addBox(conc,X1-X0,.2,Z1-Z0,0,.1,(Z0+Z1)/2,[2]);
  for(const [w,d,x,z] of [[X1-X0,.4,0,Z1],[X1-X0,.4,0,Z0],[.4,Z1-Z0,X0,(Z0+Z1)/2],[.4,Z1-Z0,X1,(Z0+Z1)/2]]) addBox(wall,w,HT,d,x,HT/2,z,[0,1,4,5]);
  // roof with a long skylight opening in front of you
  const hx0=-9,hx1=9,hz0=-24,hz1=-11.2;
  for(const [a0,a1,b0,b1] of [[X0,X1,hz1,Z1],[X0,X1,Z0,hz0],[X0,hx0,hz0,hz1],[hx1,X1,hz0,hz1]]) addBox(roof,a1-a0,.35,b1-b0,(a0+a1)/2,HT,(b0+b1)/2,[2,3,0,1,4,5]);
  for(const x of [hx0,hx1]) addBox(yel,.25,.5,hz1-hz0,x,HT+.25,(hz0+hz1)/2,[0,1,2]);
  // pallet racks (cover rows), crates, a thin-walled office, forklifts
  for(const rx of [-22,-12,12,22]) for(const [z0,z1] of [[-58,-44],[-38,-26]]){ const cz=(z0+z1)/2, L=z1-z0;
    for(const sx of [-.95,.95]) for(let z=z0;z<=z1+.01;z+=L/3) addBox(rack,.12,6,.12,rx+sx,3,z,[0,1,4,5]);
    for(const y of [.15,2.1,4.05]) addBox(shelf,2.1,.08,L,rx,y,cz,[2,3,0,1,4,5]);
    for(const y of [.2,2.15]) for(let z=z0+1.2;z<z1-1;z+=rr(r,1.6,3)) if(r()<.75) addBox(r()<.5?crate:crate2,1.6,rr(r,.9,1.5),1.2,rx,y+.6,z,[0,1,2,4,5]);
    ob(rx-1.1,rx+1.1,z0,z1,0,6); }
  for(let i=0;i<16;i++){ const x=rr(r,-28,28), z=rr(r,-60,-14); if(obst.some(o=>x>o.x0-2&&x<o.x1+2&&z>o.z0-2&&z<o.z1+2)) continue; cqCrateStack(r()<.5?crate:crate2,x,z,1+Math.floor(r()*3),r); }
  // office: thin plywood walls in the back corner (door gap)
  const ox0=18,ox1=30,oz0=-62,oz1=-50;
  addBox(part,ox1-ox0,3,.12,(ox0+ox1)/2,1.5,oz1,[0,1,2,4,5]); addBox(part,.12,3,(oz1-oz0)-3,ox0,1.5,(oz0+oz1)/2-1.5,[0,1,2,4,5]);
  ob(ox0,ox1,oz1-.1,oz1+.1,0,3); ob(ox0-.1,ox0+.1,oz0,oz1-3,0,3);
  for(const [x,z] of [[-4,-30],[6,-52]]){ addBox(fork,1.2,1.3,2.4,x,.85,z,[0,1,2,4,5]); addBox(fork,1.1,1,.2,x,2.1,z+.5,[0,1,2,4,5]); addBox(yel,.1,3,.1,x-.5,1.5,z-1.3,[0,1,4,5]); addBox(yel,.1,3,.1,x+.5,1.5,z-1.3,[0,1,4,5]); ob(x-.7,x+.7,z-1.6,z+1.3,0,2.5); }
  for(let z=-58;z<=-14;z+=11) for(const x of [-16,0,16]) addBox(lamp,1.4,.12,.5,x,HT-1.6,z,[3]);
  for(const x of [-6,6]) addBox(yel,.15,.02,52,x,.22,-36,[2]);
  add(toMesh(conc,new THREE.MeshLambertMaterial({color:CQ(0x9a978f,lk),map:grainTex(1)})),true);
  add(toMesh(wall,new THREE.MeshLambertMaterial({color:CQ(0x7d8288,lk),map:grainTex(1)})),true);
  add(toMesh(roof,new THREE.MeshLambertMaterial({color:CQ(0x5d6166,lk)})),true);
  add(toMesh(crate,new THREE.MeshLambertMaterial({color:CQ(0xa47b4a,lk),map:grainTex(1)})),true);
  add(toMesh(crate2,new THREE.MeshLambertMaterial({color:CQ(0x8b6a44,lk),map:grainTex(1)})),true);
  add(toMesh(rack,new THREE.MeshLambertMaterial({color:CQ(0x2f5fa0,lk)})),false);
  add(toMesh(shelf,new THREE.MeshLambertMaterial({color:CQ(0xd4892a,lk)})),true);
  add(toMesh(part,new THREE.MeshLambertMaterial({color:CQ(0xc8b79a,lk)})),true);
  add(toMesh(fork,new THREE.MeshLambertMaterial({color:CQ(0xe0a21e,lk)})),true);
  add(toMesh(yel,new THREE.MeshLambertMaterial({color:CQ(0xe2b11e,lk)})),false);
  add(toMesh(lamp,new THREE.MeshBasicMaterial({color:0xfff6dc})),false);
  // neighbourhood around the roof edge
  {const fac=Col(); for(let i=0;i<24;i++){ const a=rr(r,-1.4,1.4), d=rr(r,120,420), w=rr(r,20,40), h=rr(r,10,40); addBox(fac,w,h,w,Math.sin(a)*d,h/2,-Math.cos(a)*d-60,[0,1,2,4,5]); } add(toMesh(fac,new THREE.MeshLambertMaterial({color:CQ(0x8d8a84,lk)})),true);}
  scene.updateMatrixWorld(true);
  const fl={x0:X0+2,x1:X1-2,z0:Z0+2,z1:-13,y:.2};
  city={kind:'warehouse',startPitch:-.62,P,pal:palKey,sunDir:sd.clone(),spots:{ wfloor:()=>({pos:randIn(fl,MR),rect:fl,y:fl.y}) }};
}

/* ---------- hotel atrium: balcony to balcony ---------- */
function buildHotel(seed,palKey,rain){
  const {r,P,sd,add,lk}=cqBase(seed,palKey,rain,[0,21.65,-13.35],1.15,-1.15,.5);
  world.add(new THREE.AmbientLight(0xffe6c4,.45));
  const slab=Col(), wallC=Col(), door=Col(), rail=Col(), floor=Col(), wood=Col(), green=Col(), lamp=Col(), gold=Col(), pot=Col();
  const X0=-20,X1=20,Z0=-50,Z1=-10,FH=4,NF=9,BD=4;
  addBox(floor,X1-X0,.2,Z1-Z0,0,.1,(Z0+Z1)/2,[2]);
  for(let f=1;f<=NF;f++){ const y=f*FH;
    // balconies on left, right, far (and your own side at z near Z1)
    for(const [x0,x1,z0,z1] of [[X0,X0+BD,Z0,Z1],[X1-BD,X1,Z0,Z1],[X0+BD,X1-BD,Z0,Z0+BD],[X0+BD,X1-BD,Z1-BD,Z1]]) addBox(slab,x1-x0,.4,z1-z0,(x0+x1)/2,y-.2,(z0+z1)/2,[2,3,0,1,4,5]);
    // rails: thin metal top rail + glass panes (glass registered for bullet deflection)
    for(const [x,z,w,d] of [[X0+BD,(Z0+Z1)/2,.08,Z1-Z0-2*BD],[X1-BD,(Z0+Z1)/2,.08,Z1-Z0-2*BD],[0,Z0+BD,X1-X0-2*BD,.08],[0,Z1-BD,X1-X0-2*BD,.08]]) addBox(rail,w+.06,.08,d+.06,x,y+1.05,z,[0,1,2,3,4,5]);
    // room doors along the back walls
    for(let z=Z0+6;z<Z1-3;z+=5){ addBox(door,.05,2.2,1.1,X0+.03,y+1.1,z,[0]); addBox(door,.05,2.2,1.1,X1-.03,y+1.1,z,[1]); addBox(gold,.05,.12,.12,X0+.06,y+1.1,z+.4,[0]); }
    for(let x=X0+7;x<X1-5;x+=5) addBox(door,1.1,2.2,.05,x,y+1.1,Z0+.03,[4]);
    for(const [x,z] of [[X0+BD-.2,-30],[X1-BD+.2,-30],[0,Z0+BD-.2]]) addBox(lamp,.3,.3,.3,x,y+2.6,z,[0,1,2,3,4,5]);
  }
  {const glassMat=new THREE.MeshPhongMaterial({color:0x9fc4dc,transparent:true,opacity:.14,shininess:90,specular:0xffffff,depthWrite:false,side:THREE.DoubleSide});
   for(let f=1;f<=NF;f++){ const y=f*FH+.5; for(const [x,z,w,d] of [[X0+BD,(Z0+Z1)/2,.03,Z1-Z0-2*BD],[X1-BD,(Z0+Z1)/2,.03,Z1-Z0-2*BD],[0,Z0+BD,X1-X0-2*BD,.03]]){ const g=new THREE.Mesh(new THREE.BoxGeometry(w,1,d),glassMat); g.position.set(x,y,z); g.userData.own=true; g.renderOrder=2; world.add(g); glassMeshes.push(g);} } }
  for(const [w,d,x,z] of [[X1-X0,.4,0,Z0],[.4,Z1-Z0,X0,(Z0+Z1)/2],[.4,Z1-Z0,X1,(Z0+Z1)/2],[X1-X0,.4,0,Z1]]) addBox(wallC,w,(NF+1)*FH,d,x,(NF+1)*FH/2,z,[0,1,4,5]);
  // lobby: fountain, lounge chairs, planters, a reception desk
  {const fz=-30; addBox(pot,6,.8,6,0,.4,fz,[0,1,2,4,5]); addBox(pot,1,2.2,1,0,1.1,fz,[0,1,2,4,5]); ob(-3,3,fz-3,fz+3,0,2.2);
   for(let i=0;i<10;i++){ const x=rr(r,-12,12), z=rr(r,-44,-16); if(Math.hypot(x,z-fz)<5) continue; if(r()<.5){ addBox(wood,1.4,.7,1.4,x,.35,z,[0,1,2,4,5]); ob(x-.8,x+.8,z-.8,z+.8,0,.7);} else { addBox(pot,.9,.9,.9,x,.45,z,[0,1,2,4,5]); addGeo(green,new THREE.SphereGeometry(.9,7,5),x,1.5,z); ob(x-.5,x+.5,z-.5,z+.5,0,2); } }
   addBox(wood,7,1.1,1.2,0,.55,-46,[0,1,2,4,5]); ob(-3.5,3.5,-46.6,-45.4,0,1.1);}
  // glass roof skylight frame
  for(let x=X0;x<=X1;x+=5) addBox(gold,.15,.3,Z1-Z0,x,(NF+1)*FH,(Z0+Z1)/2,[3]);
  add(toMesh(slab,new THREE.MeshLambertMaterial({color:CQ(0xd9d0bf,lk)})),true);
  add(toMesh(wallC,new THREE.MeshLambertMaterial({color:CQ(0xb59b7c,lk),map:grainTex(1)})),true);
  add(toMesh(door,new THREE.MeshLambertMaterial({color:CQ(0x5a3a24,lk)})),false);
  add(toMesh(rail,new THREE.MeshPhongMaterial({color:0x8d8a80,shininess:60,specular:0x888888})),false);
  add(toMesh(floor,new THREE.MeshLambertMaterial({color:CQ(0xe8e1d2,lk),map:grainTex(1)})),true);
  add(toMesh(wood,new THREE.MeshLambertMaterial({color:CQ(0x6b4a30,lk)})),true);
  add(toMesh(green,new THREE.MeshLambertMaterial({color:CQ(0x3f7a3a,lk)})),false);
  add(toMesh(pot,new THREE.MeshLambertMaterial({color:CQ(0xcfc6b4,lk)})),true);
  add(toMesh(gold,new THREE.MeshLambertMaterial({color:CQ(0xc9a24a,lk)})),false);
  add(toMesh(lamp,new THREE.MeshBasicMaterial({color:0xffe2a8})),false);
  // two glass elevators gliding on the far wall
  scene.updateMatrixWorld(true);
  const balc=[]; for(let f=1;f<=NF;f++){ const y=f*FH+.02; balc.push({x0:X0+.6,x1:X0+BD-.6,z0:Z0+BD+.4,z1:Z1-BD-.4,y},{x0:X1-BD+.6,x1:X1-.6,z0:Z0+BD+.4,z1:Z1-BD-.4,y},{x0:X0+BD+.4,x1:X1-BD-.4,z0:Z0+.6,z1:Z0+BD-.6,y}); }
  const lob={x0:X0+BD+1,x1:X1-BD-1,z0:Z0+BD+1,z1:Z1-BD-1,y:.2};
  city={kind:'hotel',startPitch:-.2,P,pal:palKey,sunDir:sd.clone(),
    spots:{ balc:()=>{const R=pick(MR,balc); return {pos:randIn(R,MR),rect:R,y:R.y};}, lobby:()=>({pos:randIn(lob,MR),rect:lob,y:lob.y}) }};
}

/* ---------- subway: crowd on the platforms, a train on a timer ---------- */
function buildSubway(seed,palKey,rain){
  const {r,P,sd,add,lk}=cqBase(seed,palKey,rain,[0,6.3,-6.2],.55,-.75,.2);
  world.add(new THREE.AmbientLight(0xe6f0ff,.55));
  const tile=Col(), plat=Col(), edge=Col(), track=Col(), col=Col(), lamp=Col(), ceil=Col(), bench=Col(), sign=Col(), dark=Col();
  const L=145, Z0=-5-L, HT=7.5;
  addBox(track,6,.3,L,0,.15,-5-L/2,[2]); for(const x of [-1.2,1.2]) addBox(edge,.12,.12,L,x,.36,-5-L/2,[0,1,2]);
  for(let z=-6;z>Z0;z-=1.2) addBox(dark,4.2,.08,.3,0,.32,z,[2]);
  for(const sx of [-1,1]){ addBox(plat,7,1.2,L,sx*6.5,.6,-5-L/2,[2,0,1]); addBox(edge,.5,.02,L,sx*3.25,1.21,-5-L/2,[2]);
    for(let z=-14;z>Z0+8;z-=12){ addBox(col,.7,HT,.7,sx*5.4,HT/2,z,[0,1,4,5]); ob(sx*5.4-.4,sx*5.4+.4,z-.4,z+.4,0,HT); if(z%24===-14||true){ addBox(bench,2.2,.5,.6,sx*8.6,1.45,z-5,[0,1,2,4,5]); ob(sx*8.6-1.1,sx*8.6+1.1,z-5.3,z-4.7,1.2,1.7);} }
    addBox(tile,.4,HT,L,sx*10,HT/2,-5-L/2,[sx>0?1:0]);
    for(let z=-12;z>Z0+5;z-=24) addBox(sign,.05,1.2,4,sx*9.78,4.2,z,[sx>0?1:0]); }
  addBox(ceil,20,.3,L,0,HT,-5-L/2,[3]); for(let z=-8;z>Z0;z-=6) for(const x of [-6.5,6.5]) addBox(lamp,.3,.06,3,x,HT-.2,z,[3]);
  // end walls: yours with the maintenance window, the far one with the tunnel mouth
  addBox(tile,7,HT,.4,-6.5,HT/2,-4.6,[5]); addBox(tile,7,HT,.4,6.5,HT/2,-4.6,[5]); addBox(tile,6,HT-3.4,.4,0,(HT+3.4)/2,-4.6,[5]); addBox(tile,7,HT,.4,-6.5,HT/2,Z0,[4]); addBox(tile,7,HT,.4,6.5,HT/2,Z0,[4]); addBox(tile,6,3,.4,0,HT-1.5,Z0,[4]);
  add(toMesh(tile,new THREE.MeshLambertMaterial({color:CQ(0xd8d4c6,1),map:grainTex(1)})),true);
  add(toMesh(plat,new THREE.MeshLambertMaterial({color:CQ(0x8c8a84,1),map:grainTex(1)})),true);
  add(toMesh(edge,new THREE.MeshLambertMaterial({color:0xe8c21a})),false);
  add(toMesh(track,new THREE.MeshLambertMaterial({color:0x3a342e})),true);
  add(toMesh(dark,new THREE.MeshLambertMaterial({color:0x2a2622})),false);
  add(toMesh(col,new THREE.MeshLambertMaterial({color:CQ(0x2f6e8c,1)})),true);
  add(toMesh(ceil,new THREE.MeshLambertMaterial({color:0x4a4d52})),true);
  add(toMesh(bench,new THREE.MeshLambertMaterial({color:0x6b4a30})),true);
  add(toMesh(sign,new THREE.MeshBasicMaterial({color:0x1f5fa8})),false);
  add(toMesh(lamp,new THREE.MeshBasicMaterial({color:0xf2f7ff})),false);
  // the train: six cars, solid to bullets, waits in the tunnel
  const train=new THREE.Group(); const body=new THREE.MeshLambertMaterial({color:0xb9c0c6}), win=new THREE.MeshBasicMaterial({color:0xfff3d0}), stripe=new THREE.MeshLambertMaterial({color:0xc0392b});
  for(let c=0;c<6;c++){ const z=-c*20.5; const b=new THREE.Mesh(new THREE.BoxGeometry(5.6,3.6,20),body); b.position.set(0,2.2,z); b.userData.own=true; train.add(b); solid.push(b);
    for(const sx of [-1,1]){ const w=new THREE.Mesh(new THREE.BoxGeometry(.04,1,17),win); w.position.set(sx*2.82,2.9,z); train.add(w); const s=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,20),stripe); s.position.set(sx*2.82,1.6,z); train.add(s); } }
  const head=new THREE.Mesh(new THREE.BoxGeometry(5,.6,.1),win); head.position.set(0,2.8,10.05); train.add(head);
  train.position.set(0,0,Z0-140); world.add(train);
  const T0=45, STOP=-15;
  const tr={g:train,z:Z0-140,v:0,phase:'wait',t:0};
  scene.updateMatrixWorld(true);
  const p1={x0:-9.4,x1:-3.8,z0:-12,z1:Z0+6,y:1.2}, p2={x0:3.8,x1:9.4,z0:-12,z1:Z0+6,y:1.2};
  for(const p of [p1,p2]){ const t=p.z0; p.z0=Math.min(p.z0,p.z1); p.z1=Math.max(t,p.z1); }
  city={kind:'subway',startPitch:-.12,P,pal:palKey,sunDir:sd.clone(),train:tr,
    tick:dt=>{ if(state!=='play'||endInfo) return; tr.t+=dt;
      if(tr.phase==='wait'&&tr.t>=T0){ tr.phase='in'; tr.v=22; hintMsg='Train arriving.'; hintT=3; if(snd.ok()) noise(0,7,'lowpass',180,.55,6); }
      if(tr.phase==='in'){ const left=STOP-tr.z; tr.v=Math.max(1.2,Math.min(22,Math.sqrt(Math.max(0,2*2.4*left)))); tr.z+=tr.v*dt; if(tr.z>=STOP){ tr.z=STOP; tr.phase='stop'; tr.t2=0; hintMsg='Doors open. You have about 12 seconds.'; hintT=3; } }
      else if(tr.phase==='stop'){ tr.t2+=dt; if(tr.t2>12){ tr.phase='out'; const h=people.find(p=>p.hvt&&alive(p)); if(h){ h.state='gone'; h.mesh.root.visible=false; rebuildHits(); fail('The target boarded the train.'); } } }
      else if(tr.phase==='out'&&tr.z<400){ tr.v=Math.min(24,tr.v+3*dt); tr.z+=tr.v*dt; }
      tr.g.position.z=tr.z; },
    spots:{ plat:()=>({pos:randIn(p1,MR),rect:p1,y:p1.y}), plat2:()=>({pos:randIn(p2,MR),rect:p2,y:p2.y}) }};
}

/* ---------- apartments: window to window across a narrow street ---------- */
function buildApartments(seed,palKey,rain){
  const {r,P,sd,add,lk}=cqBase(seed,palKey,rain,[0,10.3,-.95],.95,-.9,.45);
  world.add(new THREE.AmbientLight(0xffe7c8,.3));
  const facB=Col(), slabC=Col(), room=Col(), sofa=Col(), lampC=Col(), curtain=Col(), frame=Col(), pave=Col(), road=Col(), mine=Col(), facN=Col(), wood=Col(), dark=Col();
  const FZ=-34, D=6, NF=5, FH=3.4, NW=6, WW=2.4, WHt=1.8, X0=-17, X1=17, colW=(X1-X0)/NW;
  // your apartment: window frame around you, dark room behind
  // your side: a facade with one window you shoot from (eye sits half a metre inside the room)
  for(const [x0,x1,y0,y1] of [[-60,-1.3,0,24],[1.3,60,0,24],[-1.3,1.3,0,9.85],[-1.3,1.3,11.25,24]]) addBox(facN,x1-x0,y1-y0,10,(x0+x1)/2,(y0+y1)/2,3.6,[5]);
  addBox(frame,2.8,.1,.35,0,9.86,-1.5,[2,5]); addBox(mine,4,.2,4,0,8.95,0,[2]); addBox(mine,4,.2,4,0,11.4,0,[3]);
  // street, sidewalks, parked cars
  addBox(road,400,.06,22,0,.03,FZ/2,[2]); for(const z of [-3.5,FZ+3.5]) addBox(pave,400,.25,5,0,.12,z,[2,4,5]);
  for(let x=-60;x<=60;x+=7.5) if(r()<.6){ const z=r()<.5?-7:FZ+7, c=pick(r,CARS); const cc=Col(); addBox(cc,4.2,1,1.8,x,.75,z,[0,1,2,4,5]); addBox(cc,2.2,.6,1.6,x,1.55,z,[0,1,2,4,5]); add(toMesh(cc,new THREE.MeshLambertMaterial({color:CQ(c,lk)})),true); ob(x-2.2,x+2.2,z-1,z+1,0,1.7); }
  // the building across: facade with window holes, a room behind each window
  const rooms=[]; const lit=[]; const glassMat=new THREE.MeshPhongMaterial({color:0x9fb6c8,transparent:true,opacity:.1,shininess:90,specular:0xffffff,depthWrite:false});
  for(let f=0;f<NF;f++){ const y0=f*FH+(f===0?0:0), yW=y0+1.1;
    addBox(slabC,X1-X0,.25,D,0,y0+.12,FZ-D/2,[2]); addBox(slabC,X1-X0,.25,D,0,y0+FH-.12,FZ-D/2,[3]);
    addBox(room,X1-X0,FH,.2,0,y0+FH/2,FZ-D,[4]);
    for(let w=0;w<NW;w++){ const cx=X0+colW*(w+.5);
      // facade pieces around the window
      addBox(facB,colW,yW-y0,.4,cx,y0+(yW-y0)/2,FZ,[4,2]); addBox(facB,colW,y0+FH-(yW+WHt),.4,cx,(yW+WHt+y0+FH)/2,FZ,[4,3]);
      addBox(facB,(colW-WW)/2,WHt,.4,cx-WW/2-(colW-WW)/4,yW+WHt/2,FZ,[4,0,1]); addBox(facB,(colW-WW)/2,WHt,.4,cx+WW/2+(colW-WW)/4,yW+WHt/2,FZ,[4,0,1]);
      addBox(frame,WW+.2,.12,.5,cx,yW,FZ+.05,[2,4]);
      if(w>0) addBox(room,.15,FH,D,cx-colW/2,y0+FH/2,FZ-D/2,[0,1]);
      const on=r()<(P.em?.7:.3); const R={x0:cx-colW/2+.5,x1:cx+colW/2-.5,z0:FZ-D+.6,z1:FZ-.7,y:y0+.25,cx,yW,lit:on};
      rooms.push(R);
      if(on) addBox(lampC,.3,.4,.3,cx+rr(r,-1.5,1.5),y0+FH-.5,FZ-D/2,[3,0,1,4,5]);
      if(r()<.6){ const sx=cx+rr(r,-1.2,1.2); addBox(sofa,1.8,.7,.8,sx,y0+.6,FZ-D+.7,[0,1,2,4]); ob(sx-.9,sx+.9,FZ-D+.3,FZ-D+1.1,y0,y0+1); }
      if(r()<.5){ const tx=cx+rr(r,-1,1), tz=FZ-D/2+rr(r,-.5,.5); addBox(wood,1,.75,.7,tx,y0+.62,tz,[0,1,2,4,5]); ob(tx-.5,tx+.5,tz-.35,tz+.35,y0,y0+.8); }
      if(r()<.45){ const side=r()<.5?-1:1; addBox(curtain,WW*.42,WHt+.1,.04,cx+side*WW*.29,yW+WHt/2,FZ-.25,[4]); }
      const g=new THREE.Mesh(new THREE.BoxGeometry(WW,WHt,.02),glassMat); g.position.set(cx,yW+WHt/2,FZ-.1); g.userData.own=true; g.renderOrder=2; world.add(g); glassMeshes.push(g);
    } }
  addBox(facB,X1-X0+2,1,1,0,NF*FH+.5,FZ-.3,[2,4]);
  for(const sx of [-1,1]){ addBox(facN,40,26,12,sx*(X1+20.5),13,FZ-6,[4]); }
  const flr=new THREE.MeshLambertMaterial({color:CQ(0x7a6a5a,lk)});
  add(toMesh(facB,new THREE.MeshLambertMaterial({color:CQ(0x9a6f55,lk),map:grainTex(1)})),true);
  add(toMesh(slabC,flr),true);
  add(toMesh(room,new THREE.MeshLambertMaterial({color:CQ(P.em?0xe8d7b4:0xcfc7b8,lk),emissive:P.em?0x3a2c18:0})),true);
  add(toMesh(sofa,new THREE.MeshLambertMaterial({color:CQ(0x4a5a7a,lk)})),true);
  add(toMesh(wood,new THREE.MeshLambertMaterial({color:CQ(0x6b4a30,lk)})),true);
  add(toMesh(curtain,new THREE.MeshLambertMaterial({color:CQ(0xb0453a,lk),emissive:P.em?0x2a0c08:0})),true);
  add(toMesh(lampC,new THREE.MeshBasicMaterial({color:0xffe0a0})),false);
  add(toMesh(frame,new THREE.MeshLambertMaterial({color:CQ(0xe9e4d8,lk)})),false);
  add(toMesh(pave,new THREE.MeshLambertMaterial({color:P.pave,map:grainTex(1)})),true);
  add(toMesh(road,new THREE.MeshLambertMaterial({color:CQ(0x2c2d30,1)})),false);
  add(toMesh(facN,new THREE.MeshLambertMaterial({color:CQ(0x7c6a5e,lk)})),true);
  add(toMesh(mine,new THREE.MeshLambertMaterial({color:0x2a2724})),true);
  scene.updateMatrixWorld(true);
  const walk={x0:-40,x1:40,z0:FZ+1.8,z1:FZ+5,y:.25};
  city={kind:'apartments',P,pal:palKey,sunDir:sd.clone(),
    spots:{ room:()=>{const R=pick(MR,rooms); return {pos:randIn(R,MR),rect:R,y:R.y};}, street:()=>({pos:randIn(walk,MR),rect:walk,y:walk.y}) }};
}
normSave();
