/* Longshot 3D · gear.js · three more rifles, per-mission gear bought on the contract page, and the air strike */
'use strict';
Object.assign(GUNS,{
  lever:{name:'Ranch .45-70',desc:'Lever-action. Big, slow round that drops fast past 200 m, quick follow-ups, 2 extra rounds, punches through car doors. Made for close work.',drag:1.3e-3,v0:620,cd:.42,sway:.95,magAdd:2,kick:1.25,cost:3500,pen:.5,stock:0x6b4527},
  carbine:{name:'Shadow 9 carbine',desc:'Integrally suppressed and semi-auto, 0.12 s between shots, 8 extra rounds. Subsonic: falls like a stone past 150 m.',drag:2.2e-3,v0:420,cd:.12,sway:1.1,magAdd:8,kick:.4,cost:6000,auto:true,quiet:true,stock:0x23262a},
  amr:{name:'Hammer .50 BMG',desc:'Semi-auto anti-materiel rifle. Goes through two walls, stops an engine block dead. Heavy sway and a brutal kick.',drag:3.6e-4,v0:860,cd:.55,sway:1.45,magAdd:-1,kick:2.1,cost:18000,pen:2.4,amr:true,auto:true,stock:0x3a3f36}
});
REC[13]=['amr','Put a .50 BMG through the engine block and the car stops for good.'];
REC[14]=['carbine','Short range, fast fights, and the suppressor keeps the garage guessing.'];
REC[18]=['lever','Window to window at 40 m: fast, heavy, and it goes through car doors.'];

/* per-mission gear: picked on the contract page, paid for when you take position, gone when the mission ends */
const GEAR={
  drone:{n:'Recon drone',d:'Tags every hostile as the mission starts, even in Veteran.',$:400},
  match:{n:'Match ammo',d:'8% more muzzle velocity: less drop, less drift.',$:300},
  loader:{n:'Speed loader',d:'Reloads twice as fast.',$:200},
  medkit:{n:'Medkit',d:'Shrugs off the first hit you take.',$:500},
  strike:{n:'Air strike',d:'One drone strike: mark a spot in the scope, it lands 4 s later and levels everything within 9 m. Civilians too.',$:2500}
};
const GR={}; // live gear for the current mission
function gearSel(){ return save.gearSel||(save.gearSel={}); }
window.__gear=(k,i,kind)=>{ const S=gearSel(); S[k]=!S[k]; persist(); openBrief(i,kind); };
function gearHtml(i){ if(!M||M.range) return ''; const S=gearSel(); let tot=0;
  const rows=Object.entries(GEAR).map(([k,g])=>{ const on=!!S[k]; if(on) tot+=g.$;
    return `<button class="gear${on?' on':''}" onclick="window.__gear('${k}',${i},'${RUN.kind}')"><span class="gk">${on?'✓':'+'}</span><b>${g.n}</b><small>$${g.$.toLocaleString()}</small><span class="gd">${g.d}</span></button>`; }).join('');
  const short=tot>save.cash;
  return `<div class="gearc"><div class="gh"><small>GEAR · THIS MISSION ONLY</small><small class="${short?'bad':''}">${tot?`$${tot.toLocaleString()} at the start`:'None'}${short?' · not enough cash':''}</small></div>${rows}</div>`; }
function gearStart(){ for(const k in GR) delete GR[k]; if(!M||M.range) return; const S=gearSel(), got=[];
  for(const k of Object.keys(GEAR)) if(S[k]){ if(save.cash>=GEAR[k].$){ save.cash-=GEAR[k].$; GR[k]=k==='strike'?1:true; got.push(GEAR[k].n); } }
  if(got.length) persist();
  if(GR.match){ V0*=1.08; THETA0=zeroAt(DIAL); }
  if(GR.drone){ let n=0; for(const p of people) if(p.hostile&&alive(p)){ p.spotted=true; if(p.mesh.mk) p.mesh.mk.visible=true; n++; } pops.push({w:EYE.clone().add(V3().set(0,0,-60)),t:0,txt:`DRONE · ${n} HOSTILES TAGGED`,c:'#38e1ff'}); }
  if(gun().amr&&getaway){ const body=getaway.g.children[0]; body.userData.feat='engine'; if(!solid.includes(body)) solid.push(body); }
  if(got.length){ hintMsg='Gear: '+got.join(', ')+'.'; hintT=3.5; }
  STK.on=null; gearHud(); }
const gearReload=()=>GR.loader?.5:1;
function gearShield(){ if(!GR.medkit) return false; GR.medkit=false; snd.crack(); hurt=.6; kick=1.2; hintMsg='Medkit used. The next hit counts.'; hintT=3.5; return true; }
function gearImpact(b,hit){ const o=hit.object; if(!o||o.userData.feat!=='engine'||!getaway) return false;
  if(gun().amr&&!getaway.dead){ getaway.dead=true; getaway.v=0; puff(hit.point,1.2,false); snd.impact(EYE.distanceTo(hit.point),false); hintMsg='Engine block. The car is dead in the road.'; hintT=3.5;
    getaway.g.children[0].material.color.setHex(0x111a26); try{ achGet('engine'); }catch(e){} return true; }
  puff(hit.point,.5,false); return true; }

/* air strike */
const STK={on:null};
const stkMat=new THREE.SpriteMaterial({map:glowTex,color:0xff2a1a,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false,sizeAttenuation:false});
function gearHud(){ const b=$('#bStrike'); if(!b) return; b.hidden=!(GR.strike>0&&scoped&&state==='play'&&!STK.on); }
function callStrike(){ if(state!=='play'||!(GR.strike>0)||STK.on) return;
  camera.updateMatrixWorld(); const fwd=V3().set(0,0,-1).applyQuaternion(camera.quaternion);
  RC.set(EYE.clone(),fwd); RC.near=0; RC.far=1600; const h=RC.intersectObjects(solid,false)[0];
  if(!h){ hintMsg='No ground under the crosshair to mark.'; hintT=2.5; return; }
  GR.strike--; const pt=h.point.clone(); const s=new THREE.Sprite(stkMat); s.position.copy(pt).add(V3().set(0,.6,0)); s.scale.set(.06,.06,1); s.renderOrder=11; scene.add(s);
  STK.on={pt,t:4,s,dist:EYE.distanceTo(pt),last:5}; snd.click(); hintMsg='Strike marked. Inbound in 4 seconds.'; hintT=3; gearHud(); }
function strikeTick(dt){ const S=STK.on; if(!S) return; if(state!=='play'&&state!=='killcam'){ if(state!=='paused'){ scene.remove(S.s); STK.on=null; } return; }
  S.t-=dt; const sec=Math.ceil(S.t); S.s.material.opacity=.55+.45*Math.sin(S.t*14); S.s.scale.setScalar(.05+.02*Math.sin(S.t*14));
  if(sec<S.last&&sec>0){ S.last=sec; pops.push({w:S.pt.clone().add(V3().set(0,4,0)),t:0,txt:`STRIKE · ${sec}`,c:'#ff5442'}); }
  if(S.t<1.4&&!S.whistle){ S.whistle=true; if(snd.ok()) try{ tone(0,1900,500,1.4,.12); }catch(e){} }
  if(S.t<=0){ scene.remove(S.s); STK.on=null; strikeBoom(S.pt,S.dist); } }
function strikeBoom(pt,dist){
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffa040,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); fl.position.copy(pt).add(V3().set(0,2,0)); scene.add(fl);
  fx.push({s:fl,vx:0,vy:0,vz:0,t:0,life:.8,sz:22,op:1,g:1.4});
  for(let i=0;i<26;i++){ const m=new THREE.SpriteMaterial({map:puffTex,color:i<9?0x553322:0x3a3a3a,transparent:true,depthWrite:false,opacity:.9}); const s=new THREE.Sprite(m); s.position.copy(pt); scene.add(s); fx.push({s,vx:(MR()-.5)*14,vy:MR()*9+2,vz:(MR()-.5)*14,t:0,life:2.6+MR(),sz:5+MR()*5,op:.9,g:-1.2}); }
  snd.boom(dist); snd.boom(dist*.8); kick=Math.max(kick,1.2);
  let n=0; achLastB=null;
  for(const p of people.slice()){ if(!alive(p)) continue; const d=Math.hypot(p.x-pt.x,(p.y+1)-pt.y,p.z-pt.z); if(d<9){ if(p.hostile) n++; kill(p,'body',V3().set(p.x,p.y+1,p.z),dist,null,false); } }
  for(const p of people){ if(alive(p)&&!p.hostile&&Math.hypot(p.x-pt.x,p.z-pt.z)<45) try{ panicP(p,pt); }catch(e){} }
  try{ disturb(pt,'kill'); }catch(e){}
  pops.push({w:pt.clone().add(V3().set(0,6,0)),t:0,txt:n?`AIR STRIKE · ${n} DOWN`:'AIR STRIKE',c:'#ff8a00'});
  if(n>=2) try{ achGet('danger'); }catch(e){}
  if(n>=1) try{ achGet('strike1'); }catch(e){} }
