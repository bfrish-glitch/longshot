/* Longshot 3D · maps2.js · five more maps and contracts: snow base, desert compound, stadium, suburb, night bridge */
'use strict';
Object.assign(CQ_TXT,{
  snow:` You're dug in on a ridge above a mountain base. Snow is falling and the valley wind is strong: watch the flags on the radar mast.`,
  desert:` You're on a rock outcrop over a walled compound. The air is dead calm low down and gusty up high; the heat makes the far wall shimmer.`,
  stadium:` You're up in a floodlight gantry over a packed stadium. Thousands of fans: be very sure before you fire.`,
  suburb:` You're on the catwalk of a water tower above a quiet suburb. Fences, hedges and trampolines everywhere.`,
  bridge:` You're on top of a bridge tower at night. Traffic never stops on the deck below; cars block your shots as they pass.`
});
Object.assign(CIVT,{snow:['base'],desert:['court','roof'],stadium:['stand','stand','field'],suburb:['yard','street'],bridge:['walk']});
Object.assign(SNT,{snow:['tower'],desert:['roof'],bridge:['walk']});
MISSIONS.push(
  {n:'Whiteout',pal:'day',map:'snow',hos:5,civ:6,wind:6,move:.45,time:160,esc:6,band:[220,640],types:['base','base','tower'],civT:['base'],sn:1,ch:['long','heads','quiet']},
  {n:'Dust Devil',pal:'dusk',map:'desert',hos:5,hvt:1,civ:8,wind:4,move:.5,time:160,esc:5.5,band:[300,700],types:['court','court','roof'],civT:['court'],ch:['long','acc','accident']},
  {n:'Final Whistle',pal:'night',map:'stadium',hos:4,civ:17,wind:1,move:.25,time:150,esc:6,band:[60,260],types:['stand','stand','field'],civT:['stand','stand','field'],ch:['heads','acc','quiet']},
  {n:'Cul-de-Sac',pal:'day',map:'suburb',hos:5,civ:10,wind:2,move:.5,time:150,esc:6,band:[90,380],types:['yard','yard','street'],civT:['yard','street'],ch:['quiet','mover','heads']},
  {n:'Midnight Crossing',pal:'night',map:'bridge',hos:5,civ:10,wind:4,move:.5,time:160,esc:6,band:[120,520],types:['walk'],civT:['walk'],ch:['mover','heads','fast']}
);
REC.push(['bolt','Long, windy, cold: the steadiest rifle.'],['fifty','Flat trajectory for the long range, and it punches through mud walls.'],['bolt','A precise single shot into a crowd.'],['semi','Mid-range targets that scatter fast.'],['fifty','Long range at night with cars in the way; the .50 keeps its speed and goes through doors.']);
function m2Base(seed,palKey,rain,eye,yaw,pmin,pmax,groundCol){
  const B=worldBase(seed,palKey,rain); EYE.set(...eye); YAW_LIM=yaw; PITCH_MIN=pmin; PITCH_MAX=pmax;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:groundCol!=null?groundCol:B.P.ground,map:grainTex(700)})); ground.userData.own=true; ground.userData.noCast=true; world.add(ground); solid.push(ground);
  B.add=(m,isSolid)=>{if(!m) return; world.add(m); if(isSolid) solid.push(m);}; B.lk=palKey==='night'?.5:palKey==='dusk'?.78:1; return B;
}
function mounts(add,r,col,n,d0,d1,h0,h1,snowCap){ const g=Col(), cap=Col();
  for(let i=0;i<n;i++){ const a=rr(r,-1.6,1.6), d=rr(r,d0,d1), rad0=rr(r,h0,h1)*rr(r,1.2,2), rad=Math.min(rad0,d-800), h=Math.min(rr(r,h0,h1),rad); if(rad<120) continue; const x=Math.sin(a)*d, z=-Math.cos(a)*d; addGeo(g,new THREE.ConeGeometry(rad,h,7),x,h/2,z); if(snowCap) addGeo(cap,new THREE.ConeGeometry(rad*.36,h*.36,7),x,h*.82+.5,z); }
  add(toMesh(g,new THREE.MeshLambertMaterial({color:col})),false); if(snowCap) add(toMesh(cap,new THREE.MeshLambertMaterial({color:0xf4f7fa})),false); }
function boxB(col,x,z,w,d,h,y){ addBox(col,w,h,d,x,(y||0)+h/2,z,[0,1,2,4,5]); ob(x-w/2,x+w/2,z-d/2,z+d/2,y||0,(y||0)+h); }

/* ---------- snow base ---------- */
function buildSnow(seed,palKey,rain){
  const {r,P,sd,add,lk}=m2Base(seed,palKey,rain,[0,57.7,0],1.0,-.55,.2,0xb8c2cb);
  scene.fog.color.set(0xd5dee6); scene.fog.near=200; scene.fog.far=1700; renderer.setClearColor(0xd5dee6);
  const rock=Col(), wall=Col(), roofC=Col(), dark=Col(), red=Col(), fence=Col(), road=Col(), metal=Col();
  boxB(rock,0,6,14,14,56); addBox(rock,10,3,6,0,55,-4,[0,1,2,4,5]);
  mounts(add,r,0x8d969e,30,1000,1650,180,420,true); // keep every peak's footprint well clear of the base (they used to swallow it)
  for(let i=0;i<40;i++){ const x=rr(r,-500,500), z=rr(r,-120,-900); if(Math.abs(x)<260&&z<-200&&z>-720) continue; addGeo(rock,new THREE.ConeGeometry(rr(r,20,60),rr(r,20,70),6),x,10,z); }
  const cx=0, cz=-450, bases=[];
  addBox(road,14,.05,700,0,.03,-350,[2]); addBox(road,300,.05,12,cx,.04,cz+20,[2]);
  for(let i=0;i<8;i++){ const x=cx+(i%4-1.5)*52, z=cz+(i<4?-60:70)+rr(r,-6,6); boxB(wall,x,z,34,12,6); addBox(roofC,35,1,13,x,6.5,z,[2,0,1,4,5]); for(let k=-3;k<=3;k++) addBox(dark,1.6,1.4,.1,x+k*4.5,3.2,z+6.05,[4]); }
  boxB(red,cx-110,cz,10,10,14); boxB(red,cx-96,cz+6,10,10,10); // fuel tanks
  for(const [x,z] of [[cx+120,cz-120],[cx-120,cz+120],[cx+120,cz+120],[cx-120,cz-120]]){ for(const sx of [-1.5,1.5]) for(const sz of [-1.5,1.5]) addBox(metal,.3,8,.3,x+sx,4,z+sz,[0,1,4,5]); addBox(wall,4,.4,4,x,8.2,z,[2,3,0,1,4,5]); addBox(wall,4,1.1,.2,x,9,z-1.9,[4,5]); /* rail on the far side: a front rail hid the tower sniper and ate every shot */ bases.push({x0:x-1.3,x1:x+1.3,z0:z-1.3,z1:z+1.3,y:8.4,tower:true}); }
  for(let z=cz-150;z<=cz+150;z+=6){ addBox(fence,.12,2.4,.12,cx-150,1.2,z,[0,1,4,5]); addBox(fence,.12,2.4,.12,cx+150,1.2,z,[0,1,4,5]); }
  for(let x=cx-150;x<=cx+150;x+=6){ addBox(fence,.12,2.4,.12,x,1.2,cz-150,[0,1,4,5]); addBox(fence,.12,2.4,.12,x,1.2,cz+150,[0,1,4,5]); }
  addBox(metal,1.2,40,1.2,cx+60,20,cz+5,[0,1,4,5]); addGeo(metal,new THREE.SphereGeometry(7,12,6,0,TAU,0,Math.PI/2).rotateX(-Math.PI/3),cx+60,40,cz+5);
  for(let i=0;i<6;i++){ const x=cx+rr(r,-120,120), z=cz+rr(r,-20,20); const c=Col(); addBox(c,2.5,2.6,6,x,1.5,z,[0,1,2,4,5]); add(toMesh(c,new THREE.MeshLambertMaterial({color:pick(r,[0x3e4a36,0x5a5f66,0x2f3a46])})),true); ob(x-1.4,x+1.4,z-3.1,z+3.1,0,3); }
  add(toMesh(rock,new THREE.MeshLambertMaterial({color:0x6d747b,map:grainTex(1)})),true);
  add(toMesh(wall,new THREE.MeshLambertMaterial({color:0x7c8a6a})),true); add(toMesh(roofC,new THREE.MeshLambertMaterial({color:0xf1f4f7})),true);
  add(toMesh(dark,new THREE.MeshLambertMaterial({color:0x1d2228})),false); add(toMesh(red,new THREE.MeshLambertMaterial({color:0xb8423a})),true);
  add(toMesh(fence,new THREE.MeshLambertMaterial({color:0x4a4d52})),false); add(toMesh(road,new THREE.MeshLambertMaterial({color:0xb7bfc6})),false); add(toMesh(metal,new THREE.MeshLambertMaterial({color:0x8a9096})),true);
  flagAt(cx+60,0,cz+10,r); flagAt(cx-60,0,cz-110,r);
  scene.updateMatrixWorld(true);
  const yard={x0:cx-145,x1:cx+145,z0:cz-145,z1:cz+145,y:.05};
  city={kind:'snow',P,pal:palKey,sunDir:sd.clone(),snow:true,spots:{ base:()=>({pos:randIn(yard,MR),rect:yard,y:yard.y}), tower:()=>{const R=pick(MR,bases); return {pos:randIn(R,MR),rect:R,y:R.y};} }};
}

/* ---------- desert compound ---------- */
function buildDesert(seed,palKey,rain){
  const {r,P,sd,add,lk}=m2Base(seed,palKey,rain,[0,42,0],.95,-.5,.2,0xc9a46a);
  scene.fog.color.lerp(new THREE.Color(0xe0b47a),.5);
  const rock=Col(), mud=Col(), mud2=Col(), roofC=Col(), dark=Col(), palmT=Col(), palmL=Col(), dune=Col();
  boxB(rock,0,5,16,14,40); addGeo(rock,new THREE.ConeGeometry(30,40,7),0,20,25);
  for(let i=0;i<60;i++){ const x=rr(r,-900,900), z=rr(r,-80,-1400); if(Math.abs(x)<200&&z<-280&&z>-720) continue; addGeo(dune,new THREE.SphereGeometry(rr(r,20,70),10,5,0,TAU,0,Math.PI/2).scale(1,.18,1.2),x,0,z); }
  mounts(add,r,0xa47a4e,18,1200,2000,120,300,false);
  const cx=0, cz=-500, S=130, roofs=[];
  for(const [w,d,x,z] of [[S*2,2,cx,cz-S],[S*2,2,cx,cz+S],[2,S*2,cx-S,cz],[2,S*2,cx+S,cz]]) { if(w>2&&z===cz+S){ boxB(mud,cx-S/2-8,z,S-16,d,4); boxB(mud,cx+S/2+8,z,S-16,d,4);} else boxB(mud,x,z,w,d,4); }
  for(let i=0;i<10;i++){ const w=rr(r,14,26), d=rr(r,10,20), h=rr(r,4,8), x=cx+rr(r,-S+20,S-20), z=cz+rr(r,-S+20,S-30);
    if(roofs.some(R=>Math.abs(R.x-x)<(R.w+w)/2+6&&Math.abs(R.z-z)<(R.d+d)/2+6)) continue; boxB(i%2?mud:mud2,x,z,w,d,h); addBox(roofC,w+.6,.6,d+.6,x,h+.3,z,[0,1,2,4,5]); for(let k=-1;k<=1;k++) addBox(dark,1.2,1.6,.1,x+k*w/3.2,h*.55,z+d/2+.05,[4]);
    roofs.push({x,z,w,d,h}); }
  for(let i=0;i<14;i++){ const x=cx+rr(r,-S+8,S-8), z=cz+rr(r,-S+8,S-8); if(obst.some(o=>x>o.x0-2&&x<o.x1+2&&z>o.z0-2&&z<o.z1+2)) continue; const h=rr(r,6,10); addBox(palmT,.5,h,.5,x,h/2,z,[0,1,4,5]); addGeo(palmL,new THREE.ConeGeometry(3.4,1.6,7).rotateX(Math.PI),x,h+.2,z); ob(x-.4,x+.4,z-.4,z+.4,0,h); }
  add(toMesh(rock,new THREE.MeshLambertMaterial({color:0x8a6a4a,map:grainTex(1)})),true); add(toMesh(dune,new THREE.MeshLambertMaterial({color:0xd2ad72})),true);
  add(toMesh(mud,new THREE.MeshLambertMaterial({color:0xb48a5c,map:grainTex(1)})),true); add(toMesh(mud2,new THREE.MeshLambertMaterial({color:0xc49b6a,map:grainTex(1)})),true);
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:0xa98157})),true); add(toMesh(dark,new THREE.MeshLambertMaterial({color:0x2a1d14})),false);
  add(toMesh(palmT,new THREE.MeshLambertMaterial({color:0x6b4c2e})),false); add(toMesh(palmL,new THREE.MeshLambertMaterial({color:0x4f6b2e,side:THREE.DoubleSide})),false);
  flagAt(cx,4,cz-S,r); flagAt(cx-S,4,cz+20,r);
  scene.updateMatrixWorld(true);
  const court={x0:cx-S+3,x1:cx+S-3,z0:cz-S+3,z1:cz+S-3,y:.05};
  const rr2=roofs.map(R=>({x0:R.x-R.w/2+1,x1:R.x+R.w/2-1,z0:R.z-R.d/2+1,z1:R.z+R.d/2-1,y:R.h+.6}));
  city={kind:'desert',P,pal:palKey,sunDir:sd.clone(),heat:true,spots:{ court:()=>({pos:randIn(court,MR),rect:court,y:court.y}), roof:()=>{const R=pick(MR,rr2); return {pos:randIn(R,MR),rect:R,y:R.y};} }};
}

/* ---------- stadium ---------- */
function buildStadium(seed,palKey,rain){
  const {r,P,sd,add,lk}=m2Base(seed,palKey,rain,[0,44,-6],.9,-.75,.25);
  world.add(new THREE.AmbientLight(0xf4f7ff,.85));
  const grass=Col(), lines=Col(), tier=Col(), tier2=Col(), seatC=Col(), steel=Col(), lamp=Col(), board=Col(), track=Col();
  const cz=-150, FW=70, FL=110;
  addBox(track,FW+30,.1,FL+30,0,.05,cz,[2]); addBox(grass,FW,.12,FL,0,.08,cz,[2]);
  for(const z of [cz-FL/2,cz,cz+FL/2]) addBox(lines,FW,.02,.3,0,.15,z,[2]); for(const x of [-FW/2,FW/2]) addBox(lines,.3,.02,FL,x,.15,cz,[2]);
  // stands: 14 stepped tiers on all four sides
  const stands=[];
  for(let t=0;t<14;t++){ const y=2+t*1.6, off=t*2.4+4;
    for(const [w,d,x,z,ax] of [[FW+30+off*2,2.4,0,cz-FL/2-15-off,'x'],[FW+30+off*2,2.4,0,cz+FL/2+15+off,'x'],[2.4,FL+30,-(FW/2+15+off),cz,'z'],[2.4,FL+30,FW/2+15+off,cz,'z']]){
      addBox(t%2?tier:tier2,w,y,d,x,y/2,z,[2,0,1,4,5]); addBox(seatC,ax==='x'?w-1:.5,.45,ax==='x'?.5:d-1,x,y+.22,z,[2,4,5,0,1]);
      if(z!==cz+FL/2+15+off) stands.push(ax==='x'?{x0:x-w/2+3,x1:x+w/2-3,z0:z-.6,z1:z+.6,y}:{x0:x-.6,x1:x+.6,z0:z-d/2+3,z1:z+d/2-3,y}); } }
  // seated crowd: one instanced mesh, decoration only (the real people on the stands are the spotable ones)
  {const N=2600, im=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.75,.45),new THREE.MeshLambertMaterial({color:0xffffff}),N), o=new THREE.Object3D(), c=new THREE.Color(); let n=0;
   for(let t=1;t<14&&n<N;t+=1){ const y=2+t*1.6+.6, off=t*2.4+4;
     for(const [ax,x0,z0,len] of [['x',-(FW/2+15+off),cz-FL/2-15-off,FW+30+off*2],['z',-(FW/2+15+off),cz-(FL+30)/2,FL+30],['z',FW/2+15+off,cz-(FL+30)/2,FL+30]])
       for(let u=1.5;u<len-1.5&&n<N;u+=.75){ if(MR()<.42) continue; const x=ax==='x'?x0+u:x0, z=ax==='x'?z0:z0+u; o.position.set(x,y,z); o.rotation.y=ax==='x'?0:(x<0?Math.PI/2:-Math.PI/2); o.updateMatrix(); im.setMatrixAt(n,o.matrix); c.setHSL(MR(),.5,.35+MR()*.3); im.setColorAt(n,c); n++; } }
   im.count=n; im.userData.own=true; im.userData.noCast=true; world.add(im);}
  for(const [x,z] of [[-75,cz-110],[75,cz-110],[-75,cz+110],[75,cz+110]]){ addBox(steel,2,46,2,x,23,z,[0,1,4,5]); addBox(lamp,12,5,1,x,47,z+(z<cz?2:-2),[z<cz?4:5]); }
  addBox(board,30,12,1,0,36,cz-FL/2-62,[4]);
  add(toMesh(grass,new THREE.MeshLambertMaterial({color:0x3f8f3a,map:grainTex(40)})),true); add(toMesh(track,new THREE.MeshLambertMaterial({color:0xa04a32})),true);
  add(toMesh(lines,new THREE.MeshBasicMaterial({color:0xeef2f0})),false);
  add(toMesh(tier,new THREE.MeshLambertMaterial({color:0x5c6068})),true); add(toMesh(tier2,new THREE.MeshLambertMaterial({color:0x666a72})),true);
  add(toMesh(seatC,new THREE.MeshLambertMaterial({color:0x1f4fa8})),false); add(toMesh(steel,new THREE.MeshLambertMaterial({color:0x8a9096})),true);
  add(toMesh(lamp,new THREE.MeshBasicMaterial({color:0xffffff})),false); add(toMesh(board,new THREE.MeshBasicMaterial({color:0x13306b})),false);
  scene.updateMatrixWorld(true);
  const field={x0:-FW/2+2,x1:FW/2-2,z0:cz-FL/2+2,z1:cz+FL/2-2,y:.15};
  city={kind:'stadium',P,pal:palKey,sunDir:sd.clone(),startPitch:-.32,spots:{ stand:()=>{const R=pick(MR,stands); return {pos:randIn(R,MR),rect:R,y:R.y+.05};}, field:()=>({pos:randIn(field,MR),rect:field,y:field.y}) }};
}

/* ---------- suburb ---------- */
function buildSuburb(seed,palKey,rain){
  const {r,P,sd,add,lk}=m2Base(seed,palKey,rain,[0,36,0],1.05,-.6,.2,0x6a8a4a);
  const roadC=Col(), walls=[Col(),Col(),Col(),Col()], roofC=Col(), fenceC=Col(), hedge=Col(), pool=Col(), dark=Col(), tank=Col(), trunk=Col(), canopy=Col();
  addBox(tank,10,.5,10,0,33,0,[2,0,1,4,5]); for(const sx of [-4,4]) for(const sz of [-4,4]) addBox(tank,.4,33,.4,sx,16.5,sz,[0,1,4,5]); addBox(tank,10,1.1,.12,0,34.1,-5,[4,5]); addGeo(tank,new THREE.CylinderGeometry(4.2,4.2,8,16),0,38,5);
  const yards=[], streets=[];
  for(let j=0;j<5;j++){ const zc=-90-j*80; addBox(roadC,700,.06,9,0,.03,zc,[2]); streets.push({x0:-320,x1:320,z0:zc-3.6,z1:zc+3.6,y:.06}); }
  for(let k=-3;k<=3;k++) addBox(roadC,9,.06,400,k*95,.03,-250,[2]);
  for(let j=0;j<5;j++) for(let k=-3;k<3;k++) for(const side of [-1,1]) for(let h=0;h<3;h++){
    const zc=-90-j*80+side*21, xc=k*95+18+h*29; if(Math.abs(Math.atan2(xc,-zc))>1.15) continue;
    const w=rr(r,10,14), d=rr(r,9,11), x=xc, z=zc-side*0, wi=Math.floor(r()*4);
    boxB(walls[wi],x,z,w,d,5.5); const rf=new THREE.CylinderGeometry(0,Math.hypot(w,d)/2*1.02,3.2,4,1).rotateY(Math.PI/4).scale(w/Math.hypot(w,d)*1.42,1,d/Math.hypot(w,d)*1.42); addGeo(roofC,rf,x,7.1,z);
    for(let q=-1;q<=1;q+=2) addBox(dark,1.6,1.4,.1,x+q*w/4,3.4,z+side*(d/2+.05),[side>0?4:5]);
    const yz=z+side*(d/2+7); for(let fx=x-14;fx<=x+14;fx+=2) addBox(fenceC,.1,1.6,.1,fx,.8,yz+side*6,[0,1,4,5]);
    if(r()<.35){ addBox(pool,7,.1,4,x,.06,yz,[2]); ob(x-3.6,x+3.6,yz-2.1,yz+2.1,0,.5); } else if(r()<.5){ addBox(hedge,6,1.6,1.4,x+rr(r,-5,5),.8,yz,[0,1,2,4,5]); }
    if(r()<.5){ const tx=x+rr(r,-12,12), tz=yz+rr(r,-4,4); addBox(trunk,.5,3,.5,tx,1.5,tz,[0,1,4,5]); addGeo(canopy,puffyCanopy(2.4,j*7+k+h),tx,4.5,tz); ob(tx-.4,tx+.4,tz-.4,tz+.4,0,5); }
    yards.push({x0:x-13,x1:x+13,z0:yz-4.5,z1:yz+4.5,y:.05}); }
  const wc=[0xe8e2d4,0xc9d6e2,0xd8c7a8,0xa9b8a0];
  walls.forEach((w,i)=>add(toMesh(w,new THREE.MeshLambertMaterial({color:wc[i],map:grainTex(1)})),true));
  add(toMesh(roofC,new THREE.MeshLambertMaterial({color:0x6a4a3e})),true); add(toMesh(roadC,new THREE.MeshLambertMaterial({color:0x3a3c40})),false);
  add(toMesh(fenceC,new THREE.MeshLambertMaterial({color:0xefeae0})),false); add(toMesh(hedge,new THREE.MeshLambertMaterial({color:0x2f5a2a})),true);
  add(toMesh(pool,new THREE.MeshPhongMaterial({color:0x3aa6d8,shininess:90,specular:0xffffff})),false); add(toMesh(dark,new THREE.MeshLambertMaterial({color:0x26313a})),false);
  add(toMesh(tank,new THREE.MeshLambertMaterial({color:0x7f9aa8,map:grainTex(3)})),true); add(toMesh(trunk,new THREE.MeshLambertMaterial({color:0x5a3e28})),false); add(toMesh(canopy,new THREE.MeshLambertMaterial({color:0x3f6b30})),true);
  scene.updateMatrixWorld(true);
  city={kind:'suburb',P,pal:palKey,sunDir:sd.clone(),startPitch:-.12,spots:{ yard:()=>{const R=pick(MR,yards); return {pos:randIn(R,MR),rect:R,y:R.y};}, street:()=>{const R=pick(MR,streets); return {pos:randIn(R,MR),rect:R,y:R.y};} }};
}

/* ---------- night bridge ---------- */
function buildBridge(seed,palKey,rain){
  const {r,P,sd,add,lk}=m2Base(seed,palKey,rain,[-7,79.2,-10],1.05,-.9,.25,0x101418);
  const deckC=Col(), towerC=Col(), cable=Col(), lamp=Col(), rail=Col(), walkC=Col();
  const water=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshPhongMaterial({color:0x0b1624,shininess:70,specular:0x666666,map:(()=>{const t=grainTex(260); waterTex.push(t); return t;})()})); water.position.y=.5; water.userData.own=true; water.userData.noCast=true; world.add(water);
  const L=900, DY=30;
  addBox(deckC,22,1.6,L,0,DY,-L/2+40,[2,3,0,1]); for(const sx of [-1,1]){ addBox(walkC,3,.3,L,sx*12.5,DY+.95,-L/2+40,[2,0,1]); addBox(rail,.12,1.1,L,sx*14,DY+1.6,-L/2+40,[0,1,2]); }
  for(const tz of [-10,-560]){ for(const sx of [-1,1]) addBox(towerC,4,80,4,sx*12,40,tz,[0,1,4,5]); addBox(towerC,28,3,4,0,76,tz,[2,3,4,5]); addBox(towerC,28,3,4,0,DY+12,tz,[3,4,5]); }
  for(let z=-10;z>=-560;z-=10){ const t=(z+10)/-550, sag=Math.pow(2*t-1,2), y=DY+6+(76-DY-6)*sag; for(const sx of [-1,1]){ addBox(cable,.3,.3,10,sx*12,y,z-5,[0,1,2,3]); addBox(cable,.06,y-DY,.06,sx*12,(y+DY)/2,z,[0,1]); } }
  for(let z=0;z>-L+40;z-=30) for(const sx of [-1,1]){ addBox(rail,.15,6,.15,sx*14,DY+3,z,[0,1,4,5]); addBox(lamp,.6,.3,.6,sx*13.6,DY+6,z,[3,0,1,4,5]); }
  {const fac=Col(); for(let i=0;i<70;i++){ const x=rr(r,-1600,1600), z=rr(r,-900,-1800), w=rr(r,30,70), h=rr(r,40,220); addBox(fac,w,h,w,x,h/2,z,[0,1,4,5]); } const t=facadeTex(r,'#272c39',P); add(toMesh(fac,new THREE.MeshLambertMaterial({map:t.map,emissive:0xffffff,emissiveMap:t.em,emissiveIntensity:1})),false);}
  add(toMesh(deckC,new THREE.MeshLambertMaterial({color:0x3a3d42})),true); add(toMesh(walkC,new THREE.MeshLambertMaterial({color:0x6a6d72})),true);
  add(toMesh(towerC,new THREE.MeshLambertMaterial({color:0x8a3a2a})),true); add(toMesh(cable,new THREE.MeshLambertMaterial({color:0x9a4a36})),false);
  add(toMesh(rail,new THREE.MeshLambertMaterial({color:0x8a8d92})),false); add(toMesh(lamp,new THREE.MeshBasicMaterial({color:0xffd59a})),false);
  // traffic: cars both ways on the deck, solid to bullets
  const traffic=[]; for(let i=0;i<16;i++){ const lane=i%4, x=[-7.5,-2.5,2.5,7.5][lane], dir=lane<2?1:-1, g=new THREE.Group(); const b=new THREE.Mesh(CG.body,mat(pick(r,CARS))); b.position.y=.75; b.userData.own=true; const cab=new THREE.Mesh(CG.glass,mat(0x1d2630)); cab.position.set(0,1.6,-.2); g.add(b,cab);
    const hl=new THREE.Mesh(new THREE.BoxGeometry(1.4,.15,.05),new THREE.MeshBasicMaterial({color:dir>0?0xfff1c8:0xff3a2a})); hl.position.set(0,.85,-2.22); g.add(hl); g.rotation.y=dir>0?Math.PI:0; g.position.set(x,DY+.8,-rr(r,0,L-80)); world.add(g); solid.push(b); traffic.push({g,dir,v:rr(r,11,17)}); }
  scene.updateMatrixWorld(true);
  const walks=[-1,1].map(sx=>({x0:sx*12.5-1,x1:sx*12.5+1,z0:-L+60,z1:-30,y:DY+1.1}));
  city={kind:'bridge',P,pal:palKey,sunDir:sd.clone(),startPitch:-.18,lakeLvl:.5,
    tick:dt=>{ for(const c of traffic){ c.g.position.z+=c.dir*-c.v*dt; if(c.g.position.z<-L+40) c.g.position.z=40; if(c.g.position.z>40) c.g.position.z=-L+40; } },
    spots:{ walk:()=>{const R=pick(MR,walks); return {pos:randIn(R,MR),rect:R,y:R.y};} }};
}
normSave();
