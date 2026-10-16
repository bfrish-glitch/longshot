/* Longshot 3D · feat.js · one twist per original contract (C-01..C-15), applied on top of the base mission */
'use strict';
let FT=null; // live feature state for this run
const FEAT={
  // C-01: briefing photos of each target; in Veteran they wear plain clothes, so the photos are the only ID
  0:{ brief(){ return '<div class="photos" id="bPhotos"></div>'; }, after(){ renderPhotos(); } },
  // C-02: a log truck grinds along the forest road and blocks shots while it passes
  1:{ setup(r){ const rd=city.roads||[]; if(!rd.length) return; const seg=rd.reduce((a,s)=>{const L=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z); return L>a.L?{s,L}:a;},{s:rd[0],L:0}).s;
        const g=new THREE.Group(), m=(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c})); o.position.set(x,y,z); o.userData.own=true; g.add(o); solid.push(o); return o;};
        m(2.4,2.2,2.4,0xb8342a,0,1.6,3.2); m(2.4,.5,8,0x2a2a2a,0,.7,-1.6); for(let i=0;i<3;i++) for(let j=0;j<3;j++) m(.62,.62,8,0x8a6038,-.7+i*.7,1.3+j*.62,-1.6);
        world.add(g); FT.truck={g,seg,t:rr(r,0,1),dir:1}; },
      tick(dt){ const T2=FT.truck; if(!T2) return; const s=T2.seg, L=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z); T2.t+=T2.dir*dt*5/L; if(T2.t>1||T2.t<0){T2.dir*=-1; T2.t=clamp(T2.t,0,1);} const x=s.a.x+(s.b.x-s.a.x)*T2.t, z=s.a.z+(s.b.z-s.a.z)*T2.t; T2.g.position.set(x,city.gY(x,z),z); T2.g.rotation.y=Math.atan2(s.b.x-s.a.x,s.b.z-s.a.z)+(T2.dir<0?Math.PI:0); } },
  // C-03: gust warnings; the wind jumps for a few seconds
  2:{ setup(){ FT.gT=rr(MR,10,16); FT.base=windBase; }, tick(dt){ FT.gT-=dt; if(FT.gT<2&&!FT.warned){ FT.warned=true; hintMsg='GUST INCOMING'; hintT=2; }
        if(FT.gT<=0&&!FT.gust){ FT.gust=rr(MR,3,5); windBase=FT.base*rr(MR,1.9,2.4); }
        if(FT.gust){ FT.gust-=dt; if(FT.gust<=0){ FT.gust=0; windBase=FT.base; FT.gT=rr(MR,14,22); FT.warned=false; } } } },
  // C-04: a speaker stack on the party roof; shoot it and the crowd scatters
  3:{ setup(r){ const hs=people.filter(p=>p.hostile); if(!hs.length) return; const R=hs[0].rect, y=hs[0].y; const x=clamp((R.x0+R.x1)/2,R.x0+1,R.x1-1), z=R.z1-1;
        const sp=new THREE.Group(); const box=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.8,.9),new THREE.MeshLambertMaterial({color:0x151515})); box.position.y=.9; box.userData.feat='speaker'; sp.add(box);
        for(const yy of [.5,1.3]){ const c=new THREE.Mesh(new THREE.CircleGeometry(.3,16),new THREE.MeshBasicMaterial({color:0x3a3a3a})); c.position.set(0,yy,.46); sp.add(c); }
        sp.position.set(x,y,z); world.add(sp); solid.push(box); FT.speaker={box,R,y}; },
      impact(b,hit){ if(hit.object&&hit.object.userData.feat==='speaker'&&!FT.blown){ FT.blown=true; puff(hit.point,1.2,false); hintMsg='The music cuts. The crowd scatters.'; hintT=3;
          for(const p of people) if(!p.hostile&&alive(p)&&Math.abs(p.y-FT.speaker.y)<1.5) panicP(p,{x:FT.speaker.box.getWorldPosition(V3()).x,z:FT.speaker.box.getWorldPosition(V3()).z}); return true; } return false; } },
  // C-05: wildfire smoke drifts across the valley in banks
  4:{ setup(r){ FT.smoke=[]; for(let i=0;i<9;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0x8f8a82,transparent:true,opacity:.0,depthWrite:false})); const d=rr(r,250,700); s.position.set(rr(r,-400,400),rr(r,20,60),-d); s.scale.set(rr(r,120,200),rr(r,50,80),1); world.add(s); FT.smoke.push({s,v:rr(r,3,6),ph:r()*6}); } },
      tick(dt){ for(const k of FT.smoke){ k.s.position.x+=k.v*dt; if(k.s.position.x>450) k.s.position.x=-450; k.ph+=dt*.08; k.s.material.opacity=.38*Math.max(0,Math.sin(k.ph)); } } },
  // C-06: a gantry crane swings a container across the yard; it stops rounds
  5:{ setup(r){ const g=new THREE.Group(); const c=new THREE.Mesh(new THREE.BoxGeometry(12,2.6,2.5),new THREE.MeshLambertMaterial({color:0x2b6fd8})); c.userData.own=true; g.add(c); solid.push(c);
        const cab=new THREE.Mesh(new THREE.BoxGeometry(.08,14,.08),new THREE.MeshLambertMaterial({color:0x222222})); cab.position.y=8.3; g.add(cab); g.position.set(-140,22,-260); world.add(g); FT.crane={g,t:0}; },
      tick(dt){ const k=FT.crane; k.t+=dt; k.g.position.x=Math.sin(k.t*.11)*150; k.g.rotation.z=Math.sin(k.t*.7)*.04; } },
  // C-07: floor by floor the office lights die; switch to thermal
  6:{ setup(){ FT.cut=40; FT.lights=[]; world.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshBasicMaterial&&o.material.color&&o.material.color.getHex()===0xfff1cf) FT.lights.push(o); }); },
      tick(dt){ if(FT.cut>0){ FT.cut-=dt; if(FT.cut<=0){ hintMsg='Power cut. Switch to THERMAL.'; hintT=4; for(const o of FT.lights){ o.material=o.material.clone(); o.material.color.setHex(0x1a1c22); } world.traverse(o=>{ if(o.isAmbientLight) o.intensity*=.35; }); } } } },
  // C-08: a fuel can by the campfire; shoot it and the hostiles come to look
  7:{ setup(r){ const hs=people.filter(p=>p.hostile); if(!hs.length) return; const h=hs[0]; const x=h.x+2.5, z=h.z+1.5, y=city.gY?city.gY(x,z):h.y;
        const can=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.6,10),new THREE.MeshLambertMaterial({color:0xc0392b,emissive:0x220000})); can.position.set(x,y+.3,z); can.userData.feat='can'; world.add(can); solid.push(can); FT.can=can; },
      impact(b,hit){ if(hit.object&&hit.object===FT.can&&!FT.boom){ FT.boom=true; FT.can.visible=false; const pt=hit.point; puff(pt,2.2,false); snd.ok()&&snd.boom(EYE.distanceTo(pt));
          const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff8a3a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); fl.position.copy(pt).add(V3().set(0,1.5,0)); fl.scale.set(9,9,1); world.add(fl); FT.flare=fl;
          for(const p of people) if(p.hostile&&alive(p)&&p.state!=='alert'&&Math.hypot(p.x-pt.x,p.z-pt.z)<70){ p.goal={x:pt.x+rr(MR,-3,3),z:pt.z+rr(MR,-3,3)}; p.state='walk'; p.moving=true; }
          hintMsg='They are coming to look.'; hintT=3; return true; } return false; },
      tick(dt){ if(FT.flare){ const k=1+Math.sin(T*17)*.12+Math.sin(T*7)*.1; FT.flare.scale.set(9*k,11*k,1); } } },
  // C-09: a decoy in an identical suit meets the courier and takes the case: follow the man, not the case
  8:{ setup(r){ const h=people.find(p=>p.hvt); if(!h) return; const a=r()*TAU, s={pos:{x:clamp(h.x+Math.sin(a)*12,h.rect.x0,h.rect.x1),z:clamp(h.z+Math.cos(a)*12,h.rect.z0,h.rect.z1)},rect:h.rect,y:h.y,d:h.d};
        const d=newPerson(r,false,false,h.type,s,1,{decoy:true}); d.moving=false; FT.decoy=d; FT.h=h; FT.swapT=rr(r,28,38); },
      tick(dt){ const d=FT.decoy,h=FT.h; if(!d||!h||FT.swapped) return; FT.swapT-=dt; if(FT.swapT<=0&&alive(h)&&alive(d)){ if(d.state!=='walk'){ d.goal={x:h.x+.9,z:h.z}; d.state='walk'; h.wait=6; h.state='idle'; }
          if(Math.hypot(d.x-h.x,d.z-h.z)<1.3){ FT.swapped=true; if(h.caseObj&&d.rig){ attach(d.rig,'RightHand',h.caseObj,new THREE.Vector3(-.88,1.3,0)); } d.moving=true; h.moving=true; hintMsg='The case just changed hands. Your target is the courier, not the case.'; hintT=4; } } } },
  // C-10: dust storms roll through, visibility collapses for ten seconds
  9:{ setup(){ FT.dT=25; FT.fog=[scene.fog.near,scene.fog.far,scene.fog.color.clone()]; },
      tick(dt){ FT.dT-=dt; const f=scene.fog; if(FT.dT<3&&FT.dT>0&&!FT.w){ FT.w=true; hintMsg='Dust storm coming.'; hintT=2.5; }
        const on=FT.dT<=0&&FT.dT>-10, k=on?Math.min(1,-FT.dT/1.5,(FT.dT+10)/1.5):0;
        f.near=FT.fog[0]*(1-k)+20*k; f.far=FT.fog[1]*(1-k)+170*k; f.color.copy(FT.fog[2]).lerp(new THREE.Color(0xb39a72),k); renderer.setClearColor(f.color);
        if(FT.dT<=-10){ FT.dT=rr(MR,45,60); FT.w=false; } } },
  // C-11: the power comes back on mid-contract and everyone stops to look up
  10:{ setup(){ FT.on=rr(MR,40,55); FT.mats=[]; world.traverse(o=>{ if(o.isMesh&&o.material&&o.material.emissiveMap){ FT.mats.push([o.material,o.material.emissiveIntensity]); o.material.emissiveIntensity=0; } }); },
       tick(dt){ if(FT.on>0){ FT.on-=dt; if(FT.on<=0){ for(const [m,v] of FT.mats) m.emissiveIntensity=v; hintMsg='Power is back. Everyone looks up.'; hintT=3; for(const p of people) if(alive(p)&&(p.state==='idle'||p.state==='walk')&&!p.sniper){ p.startT=rr(MR,2,3.5); p.lookY=0; } } } } },
  // C-12: the target is heading for the elevator
  11:{ setup(){ FT.el=rr(MR,75,90); }, tick(dt){ const h=people.find(p=>p.hvt&&alive(p)); if(!h) return; FT.el-=dt; if(FT.el<15&&!FT.w){ FT.w=true; hintMsg='The target is calling the elevator. 15 seconds.'; hintT=3; }
        if(FT.el<=0&&state==='play'&&!endInfo){ h.state='gone'; h.mesh.root.visible=false; rebuildHits(); fail('The target took the elevator.'); } } },
  // C-13: the VIP's car pulls up; keep him alive until he's in
  12:{ setup(){ FT.pick=false; }, tick(dt){ if(!escort||FT.pick) return; if(escort.pending<=0&&!people.some(p=>p.hunter&&alive(p))&&alive(escort.vip)){ FT.pick=true; hintMsg='Pickup car arriving. Cover the VIP.'; hintT=3; } } },
  // C-14: shoot a tire and the getaway car limps
  13:{ setup(){ if(!getaway) return; FT.tires=[]; getaway.g.children.forEach(o=>{ if(o.geometry&&o.geometry.type==='CylinderGeometry'){ o.userData.feat='tire'; solid.push(o); FT.tires.push(o);} }); },
       impact(b,hit){ if(hit.object&&hit.object.userData.feat==='tire'&&getaway&&!getaway.flat){ getaway.flat=true; puff(hit.point,.6,false); hintMsg='Tire blown. He is crawling now.'; hintT=3; return true; } return false; } },
};
const FEAT_NOTE={0:' Photos of each target are below. Check them against the faces in your scope.',1:' A log truck works the forest road. It blocks shots while it passes.',2:' Gusts: when GUST INCOMING shows, the wind roughly doubles for a few seconds. Fire between gusts.',
  3:' A speaker stack is pumping music on the party roof. Shoot it and the civilians scatter, clearing your lanes.',4:' Smoke from a wildfire drifts across the valley in banks. Wait for gaps.',5:' A crane is swinging a container across the yard. It stops rounds.',
  6:' The building is losing power floor by floor. When the lights die, switch to THERMAL.',7:' There is a red fuel can by the campfire. Shoot it and the hostiles come out to look.',8:' The courier will meet a man in an identical suit and hand him the case. Your target is the courier, not the case.',
  9:' Dust storms roll through about once a minute. You get a warning; visibility drops for ten seconds.',10:' The power is out. Somewhere mid-contract it comes back, and everyone stops to look up.',11:' The target is waiting for an elevator. When it arrives, he is gone.',
  12:' When the attackers are down, the VIP\'s pickup car arrives.',13:' Shoot a tire and he can barely move.'};
function featFor(){ if(!M||M.range||M.endless) return null; return FEAT[mi]||null; }
function featSetup(r){ FT={}; const f=featFor(); if(f&&f.setup) f.setup(r); }
function featTick(dt){ const f=featFor(); if(f&&f.tick&&FT&&state==='play') f.tick(dt); }
function featImpact(b,hit){ const f=featFor(); return !!(f&&f.impact&&FT&&f.impact(b,hit)); }
// portrait photos for the briefing: each target rendered close up into a small canvas
function renderPhotos(){
  const el=document.getElementById('bPhotos'); if(!el) return; el.innerHTML='';
  const hs=people.filter(p=>p.hostile&&p.mesh); if(!hs.length) return;
  const S=96, rtp=new THREE.WebGLRenderTarget(S,S), cam=new THREE.PerspectiveCamera(26,1,.1,60), buf=new Uint8Array(S*S*4);
  const hidden=[]; scene.traverse(o=>{ if(o.isSprite&&o.visible){ o.visible=false; hidden.push(o); } });
  for(const p of hs){ const m=p.mesh, wasB=m.body.visible, wasL=m.lod&&m.lod.visible; m.body.visible=true; if(m.lod) m.lod.visible=false;
    const h=p.heading, d=2.4; cam.position.set(p.x+Math.sin(h)*d,p.y+1.62,p.z+Math.cos(h)*d); cam.lookAt(p.x,p.y+1.42,p.z); cam.updateMatrixWorld();
    m.root.updateMatrixWorld(true); renderer.setRenderTarget(rtp); renderer.clear(); renderer.render(scene,cam); renderer.readRenderTargetPixels(rtp,0,0,S,S,buf); renderer.setRenderTarget(null);
    m.body.visible=wasB; if(m.lod) m.lod.visible=wasL;
    const c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'), id=x.createImageData(S,S);
    for(let row=0;row<S;row++) id.data.set(buf.subarray((S-1-row)*S*4,(S-row)*S*4),row*S*4); x.putImageData(id,0,0);
    const fig=document.createElement('figure'); fig.appendChild(c); const cap=document.createElement('figcaption'); cap.textContent=(p.hvt?'HVT · ':'')+Math.round(p.d)+' m'; fig.appendChild(cap); el.appendChild(fig); }
  for(const o of hidden) o.visible=true; rtp.dispose();
}
