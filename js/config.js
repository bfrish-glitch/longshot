/* Longshot 3D · config.js · constants, missions, upgrades, save + cloud save */
'use strict';
const $=s=>document.querySelector(s);
if(!window.THREE){ $('#loading').textContent='Could not load the 3D engine. Check your connection and reload.'; throw new Error('three.js missing'); }
const TAU=Math.PI*2, clamp=(v,a,b)=>v<a?a:v>b?b:v, MR=Math.random;
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rr=(r,a,b)=>a+(b-a)*r(), pick=(r,a)=>a[Math.floor(r()*a.length)];

/* ---------- constants ---------- */
const EYE=new THREE.Vector3(0,71.7,-.5);
let V0=850, BOLT=.85, MIN_ZOOM=4, CD=7e-4, GRAV=9.81; const KW=.6, ZERO=300, BASE_FOV=55, SCOPE_REF=36;
/* exterior ballistics: real gravity + quadratic air drag (a = -CD·|v_air|·v_air). CD per rifle sets how fast the round bleeds speed:
   a .308 leaves at 850 m/s and arrives at 800 m doing about 480 m/s, 1.3 s later. Wind enters as the air's own velocity, so drift
   grows with time of flight the way it really does. */
const _tc=new Map(), SIGHT_H=.055; // scope sits 5.5 cm above the bore
function trajLOS(d,p,theta,wl){ // bullet fired at angle p+theta above horizontal; returns deviation from the line of sight at slant range d
  const key=Math.round(d)+'|'+Math.round(p*400)+'|'+Math.round(theta*1e5)+'|'+Math.round(wl*20)+'|'+V0+'|'+CD+'|'+GRAV; const hit=_tc.get(key); if(hit) return hit;
  const cu=Math.cos(p), su=Math.sin(p), a=p+theta; let x=SIGHT_H*su,y=-SIGHT_H*cu,z=0,vx=V0*Math.cos(a),vy=V0*Math.sin(a),vz=0,t=0; const h=1/600;
  while(t<4){ const s=Math.hypot(vx,vy,vz-wl); vx-=CD*s*vx*h; vy-=(CD*s*vy+GRAV)*h; vz-=CD*s*(vz-wl)*h; if(!CD) vz+=KW*wl*h; x+=vx*h; y+=vy*h; z+=vz*h; t+=h; if(x*cu+y*su>=d) break; }
  const r={up:-(-x*su+y*cu)/d*1000, side:z/d*1000, t}; if(_tc.size>4000) _tc.clear(); _tc.set(key,r); return r; }
function zeroAt(R){ let lo=0,hi=.08; for(let i=0;i<40;i++){ const m=(lo+hi)/2; if(trajLOS(R,0,m,0).up>0) lo=m; else hi=m; } return (lo+hi)/2; }
let THETA0=0, DIAL=ZERO;
const GUNS={
  bolt:{name:'Longshot .308',desc:'Bolt-action. Steady and accurate.',drag:7e-4,v0:850,cd:.85,sway:1,magAdd:0,kick:1,cost:0,stock:0x4b4f3c},
  semi:{name:'Marksman DMR',desc:'Semi-auto: fire again in 0.3 s. More sway, slower round that sheds speed faster, 3 extra rounds.',drag:8.6e-4,v0:790,cd:.3,sway:1.35,magAdd:3,kick:.7,cost:1200,auto:true,stock:0x1c1d1f},
  fifty:{name:'Breacher .50',desc:'Heavy round punches through parapets, thin walls and doors, and holds its speed best. Slow bolt, big kick.',drag:3.9e-4,v0:900,cd:1.4,sway:1.15,magAdd:-1,kick:1.5,cost:2500,pen:1.15,stock:0x8a7650},
  ghost:{name:'Whisper .338',desc:'Built-in suppressor with no speed loss, the steadiest rifle made, fast bolt, flat long-range round. Made for quiet runs.',drag:5e-4,v0:880,cd:.7,sway:.8,magAdd:0,kick:.85,cost:12000,quiet:true,stock:0x2e3236}
};
const FIN={ // rifle finishes: cosmetic money sinks
  factory:{n:'Factory',cost:0},
  desert:{n:'Desert tan',cost:1500,stock:0xb39a6c,metal:0x5b4f40},
  od:{n:'OD green',cost:1500,stock:0x4a5233,metal:0x2f3328},
  woodland:{n:'Woodland camo',cost:4000,camo:['#566238','#34401f','#6e5c3c','#1f2216']},
  arctic:{n:'Arctic camo',cost:4000,camo:['#e6eaec','#b9c1c6','#8b959c','#d2d7da'],metal:0x9aa1a6},
  digital:{n:'Urban digital',cost:6000,camo:['#5a5f66','#3a3e44','#8b9097','#24272b'],pix:true},
  carbon:{n:'Carbon fiber',cost:8000,carbon:true,metal:0x1d1f22},
  tiger:{n:'Tiger stripe',cost:10000,camo:['#a8752e','#1c1a14','#c99a4a','#3b2e1c'],stripe:true},
  gold:{n:'24k gold',cost:30000,stock:0x3b2414,metal:0xd9a93b,gold:true}
};
const finTexCache={};
function finTex(k){ const f=FIN[k]; if(!f||!(f.camo||f.carbon)) return null; if(finTexCache[k]) return finTexCache[k];
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'), R=mulberry(k.length*97+7);
  if(f.carbon){ for(let i=0;i<16;i++) for(let j=0;j<16;j++){ x.fillStyle=(i+j)%2?'#26282c':'#141518'; x.fillRect(i*8,j*8,8,8); x.fillStyle='rgba(255,255,255,.06)'; x.fillRect(i*8,j*8,(i+j)%2?8:2,(i+j)%2?2:8);} }
  else { x.fillStyle=f.camo[0]; x.fillRect(0,0,128,128);
    if(f.pix){ for(let n=1;n<4;n++) for(let i=0;i<70;i++){ x.fillStyle=f.camo[n]; const bx=Math.floor(R()*16)*8, by=Math.floor(R()*16)*8; x.fillRect(bx,by,8*(1+Math.floor(R()*3)),8*(1+Math.floor(R()*2))); } }
    else if(f.stripe){ for(let i=0;i<14;i++){ x.fillStyle=f.camo[1+i%3]; x.beginPath(); const y=R()*128; x.moveTo(0,y); for(let t=0;t<=128;t+=16) x.lineTo(t,y+Math.sin(t*.08+i)*6+R()*4); for(let t=128;t>=0;t-=16) x.lineTo(t,y+5+Math.sin(t*.05+i)*3); x.fill(); } }
    else for(let n=1;n<4;n++) for(let i=0;i<9;i++){ x.fillStyle=f.camo[n]; x.beginPath(); const cx=R()*128, cy=R()*128; x.moveTo(cx,cy); for(let a=0;a<6.3;a+=.7){ const rr2=8+R()*16; x.lineTo(cx+Math.cos(a)*rr2*1.6,cy+Math.sin(a)*rr2); } x.fill(); } }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,3); finTexCache[k]={tex:t,url:c.toDataURL()}; return finTexCache[k]; }
function finSwatch(k){ const f=FIN[k], ft=finTex(k); if(ft) return `background:url(${ft.url}) center/48px`; const st=f.stock!=null?f.stock:0x4b4f3c, mt=f.metal!=null?f.metal:0x24272b; const h=v=>'#'+v.toString(16).padStart(6,'0'); return `background:linear-gradient(135deg,${h(st)} 0 55%,${h(mt)} 55%)`; }
const SUP_COST=600;
const gun=()=>GUNS[(save.guns&&save.guns.eq)||'bolt']||GUNS.bolt;
const supOn=()=>!!(gun().quiet||(save.guns&&save.guns.supOwned&&save.guns.sup));
function applyGun(){ const g=gun(); V0=g.v0*(supOn()&&!g.quiet?.96:1); BOLT=g.cd; const arc=!!(save.opts&&save.opts.arcade); GRAV=arc?6:9.81; CD=arc?0:(g.drag||7e-4); THETA0=zeroAt(DIAL); if(typeof rifle!=='undefined'&&rifle.userData.style) rifle.userData.style(); }
let YAW_LIM=.95, PITCH_MIN=-.55, PITCH_MAX=.22;

const PAL={
  day:{skyTop:0x4f86c6,skyHor:0xdbe5ea,fog:0xc9d5de,fogN:380,fogF:2700,hemiS:0xe8f2ff,hemiG:0x6b6458,hemiI:.95,sun:0xfff3dc,sunI:.85,sunDir:[.45,.62,.2],walls:['#c98a6a','#e0c9a0','#86a9bf','#d9d2c0','#b07a68','#9fb59a','#e3b47c'],glass:'#5d7487',lit:'#9fb6c8',litP:0,em:0,roof:0x6f6f6b,ground:0x3e4145,pave:0x8b8a84,grass:0x6b9a42,tree:0x4c8636,trunk:0x4a3626,disc:0xfffbe8,lamp:0},
  dusk:{skyTop:0x1d2850,skyHor:0xf09460,fog:0xa77567,fogN:300,fogF:2100,hemiS:0xffc9a6,hemiG:0x2d2533,hemiI:.72,sun:0xff9a5c,sunI:1.0,sunDir:[.55,.1,-.8],walls:['#7a5a5e','#8c6a55','#5a5268','#9a7c68','#6a5a4c','#5d6a62'],glass:'#262433',lit:'#ffcf7a',litP:.36,em:.75,roof:0x4a4048,ground:0x2a272c,pave:0x57525a,grass:0x3d4a2e,tree:0x2a3424,trunk:0x2a2018,disc:0xffc07a,lamp:1},
  night:{skyTop:0x02040a,skyHor:0x1b2647,fog:0x0e1528,fogN:240,fogF:1800,hemiS:0x7080b4,hemiG:0x22222c,hemiI:1.05,sun:0xa8b9ff,sunI:.55,sunDir:[-.3,.55,-.6],walls:['#272c39','#2e2b34','#202531','#34312f','#25272f'],glass:'#0b0e16',lit:'#ffd38a',litP:.34,em:1,roof:0x1d1f26,ground:0x111317,pave:0x23252c,grass:0x1a2416,tree:0x141c12,trunk:0x1a140f,disc:0xe8eeff,lamp:1}
};
const SKIN=[0xf1c7a3,0xdba57e,0xb07a52,0x83522f,0x5c3820];
const HAIR=[0x2b1d12,0x5a3a1e,0x0f0f0f,0xa87a3f,0xd9c08a,0x6b6b6b];
const TOPS=[0xe45b4f,0x4f8fe4,0xf2c94c,0x6fcf97,0xbb6bd9,0xf2994a,0x56ccf2,0xf4f1e8,0x9b51e0,0x2fa3a0,0xe86fa1];
const PANTS=[0x2d3a5a,0x3d3d40,0x6b5b45,0x1f4e79,0x7a7a7a,0xb8a07a,0x4a3b5c];
const CARS=[0xc0392b,0x2c3e50,0xecf0f1,0xf1c40f,0x16a085,0x7f8c8d,0x2980b9,0xe67e22,0x1b1b1b];

const MISSIONS=[
  {n:'Morning Watch',pal:'day',hos:2,civ:6,wind:0,move:0,time:120,esc:7,band:[120,320],types:['roof','plaza'],ch:['heads','fast']},
  {n:'Timber Line',pal:'day',map:'forest',hos:3,civ:9,wind:0,move:.4,time:130,esc:6.5,band:[120,460],types:['camp','meadow','road','deck'],ch:['quiet','acc']},
  {n:'Crosswind',pal:'dusk',map:'farm',hos:3,civ:8,wind:3,move:.35,time:130,esc:6,band:[160,560],types:['yard','field','road'],ch:['heads','long','accident']},
  {n:'Rooftop Party',pal:'dusk',hos:4,civ:12,wind:2.5,move:.4,time:130,esc:6,band:[200,450],types:['roof'],civT:['roof','street'],ch:['quiet','fast','acc']},
  {n:'Fire Watch',pal:'dusk',map:'forest',hos:3,civ:7,wind:4,move:.25,time:150,esc:6.5,band:[300,820],types:['tower','meadow','camp','road'],ch:['long','heads','acc']},
  {n:'Dockside',pal:'day',map:'harbor',hos:4,civ:12,wind:3,move:.5,time:140,esc:6,band:[100,620],types:['stack','aisle','quay','ship'],ch:['mover','quiet','accident']},
  {n:'Night Shift',pal:'night',map:'office',hos:4,civ:12,wind:2,move:.4,time:140,esc:5.5,band:[50,320],types:['floor','street'],ch:['heads','quiet','acc']},
  {n:'Moonlight Camp',pal:'night',map:'forest',hos:5,civ:10,wind:4,move:.3,time:150,esc:5,band:[150,680],types:['camp','deck','road','meadow'],ch:['quiet','mover','heads']},
  {n:'The Courier',pal:'dusk',map:'harbor',hos:4,civ:12,wind:5,move:.6,time:150,esc:5.5,hvt:1,band:[150,700],types:['stack','aisle','quay','ship'],ch:['long','acc','accident']},
  {n:'Gusts',pal:'day',map:'farm',hos:5,civ:10,wind:7,move:.5,time:160,esc:5.5,band:[250,850],types:['yard','field','road'],ch:['long','heads','quiet']},
  {n:'Blackout',pal:'night',hos:6,civ:14,wind:6,move:.6,time:170,esc:5,band:[150,820],types:['roof','street','plaza'],ch:['quiet','acc','mover']},
  {n:'Last Call',pal:'night',map:'office',hos:6,civ:16,wind:4,move:.6,time:180,esc:4.5,hvt:1,band:[50,480],types:['floor','street','roof'],ch:['heads','accident','fast']},
  {n:'Escort',pal:'day',mode:'escort',hos:6,civ:12,wind:1.5,move:.4,time:180,esc:9,band:[180,430],types:['street'],ch:['heads','acc','fast']},
  {n:'Getaway',pal:'dusk',map:'farm',mode:'getaway',hos:2,civ:8,wind:3,move:.3,time:150,esc:6,band:[180,560],types:['yard','field'],ch:['mover','long','heads']},
  {n:'Level Three',pal:'night',map:'garage',hos:6,civ:7,wind:0,move:.7,time:120,esc:8,band:[25,95],types:['level','level','level','lot'],civT:['level','lot','lot'],fight:true,hp:3,minZoom:1.5,ch:['heads','fast','acc']}
];
[[4,1],[7,1],[8,1],[9,1],[10,1],[11,2],[13,1]].forEach(([i,n])=>MISSIONS[i].sn=n);
const SNT={city:['roof'],forest:['tower','deck','meadow'],farm:['yard','field'],harbor:['stack','ship'],office:['roof','floor']};
const CIVT={city:['street','plaza'],forest:['road','camp'],farm:['road','yard','field'],harbor:['aisle','quay'],office:['floor','street'],garage:['level','lot']};
const chLong=m=>Math.round(m.band[1]*.7/50)*50;
const CH={
  heads:{t:()=>'Every kill is a headshot',ok:()=>stats.kills>0&&stats.heads===stats.kills},
  quiet:{t:()=>'No hostile raises the alarm',ok:()=>!stats.alerted},
  fast:{t:()=>'Finish with half the clock left',ok:()=>timeLeft>=M.time*.5},
  acc:{t:()=>'No missed shots',ok:()=>stats.shots===stats.hits},
  long:{t:m=>`A kill from ${chLong(m)} m or farther`,ok:()=>stats.longest>=chLong(M)},
  mover:{t:()=>'Take down a moving target',ok:()=>stats.moving},
  accident:{t:()=>'Make one kill look like an accident',ok:()=>stats.accidents>0}
};
MISSIONS[6].rain=MISSIONS[10].rain=true;
const UPG={
  zoom:{name:'Optic',desc:'Maximum scope magnification',vals:[10,14,18,24,30,36],fmt:v=>v+'x'},
  stab:{name:'Grip & bipod',desc:'Less sway, longer breath hold',vals:[1,.72,.52,.36,.27,.2],fmt:(v,i)=>(3+i)+'s hold'},
  mag:{name:'Magazine',desc:'More rounds, faster reload',vals:[4,5,7,9,10,12],fmt:v=>v+' rnd'}
};
const COST=[300,700,1400,5000,12000], RELOAD=[2.1,1.8,1.5,1.2,1.0,.85], UPMAX=COST.length;

const SKEY='longshot3d-save-v1';
let save={unlocked:1,stars:{},ch:{},cash:0,vstars:{},vbest:{},daily:{},endless:{wave:0,kills:0,score:0},fin:{owned:['factory'],eq:'factory'},guns:{owned:['bolt'],eq:'bolt',supOwned:false,sup:false},up:{zoom:0,stab:0,mag:0},opts:{snd:true,inv:false,hold:true,hq:false,mark:true,sens:1,fireUp:false,shadows:true,markCol:'orange'}};
try{const s=JSON.parse(localStorage.getItem(SKEY)||'null'); if(s&&s.up){save=Object.assign(save,s); save.ch=save.ch||{}; save.guns=Object.assign({owned:['bolt'],eq:'bolt',supOwned:false,sup:false},save.guns||{}); save.up=Object.assign({zoom:0,stab:0,mag:0},s.up); save.opts=Object.assign({snd:true,inv:false,hold:true,hq:false,mark:true,sens:1,fireUp:false,shadows:true,markCol:'orange'},s.opts||{});}}catch(e){}
const cloud={db:null,ref:null,timer:null,ok:false,last:0};
function persist(){ save.t=Date.now(); try{localStorage.setItem(SKEY,JSON.stringify(save));}catch(e){} cloudPush(); if(typeof lbPush==='function') lbPush(); if(window.__achReady) try{ achCollect(); }catch(e){} }
function cloudPush(){ if(!cloud.ref) return; clearTimeout(cloud.timer); cloud.timer=setTimeout(()=>{ cloud.ref.set({v:1,t:save.t||Date.now(),json:JSON.stringify(save)}).then(()=>{cloud.last=Date.now(); syncLabel();}).catch(()=>{cloud.ok=false; syncLabel();}); },1200); }
function normSave(){ { let hi=-1; for(const k in (save.stars||{})) if(save.stars[k]>0) hi=Math.max(hi,+k); save.unlocked=Math.max(save.unlocked||1,Math.min(MISSIONS.length,hi+2)); }
  save.vstars=save.vstars||{}; save.vbest=save.vbest||{}; save.daily=save.daily||{}; save.endless=Object.assign({wave:0,kills:0,score:0},save.endless||{}); save.fin=Object.assign({owned:['factory'],eq:'factory'},save.fin||{}); }
normSave();
function adoptSave(s2){ const base={unlocked:1,stars:{},ch:{},cash:0,guns:{owned:['bolt'],eq:'bolt',supOwned:false,sup:false},up:{zoom:0,stab:0,mag:0},opts:save.opts};
  save=Object.assign(base,s2); save.ch=save.ch||{}; save.up=Object.assign({zoom:0,stab:0,mag:0},s2.up||{}); save.guns=Object.assign({owned:['bolt'],eq:'bolt',supOwned:false,sup:false},s2.guns||{}); save.opts=Object.assign({},base.opts,s2.opts||{}); normSave();
  try{localStorage.setItem(SKEY,JSON.stringify(save));}catch(e){} }
function syncLabel(){ const e=document.getElementById('mSync'), i=document.getElementById('saveInfo'); if(!e) return;
  e.textContent=cloud.ok?'CLOUD SAVE ON':'SAVED ON THIS DEVICE'; e.classList.toggle('on',cloud.ok);
  if(i) i.textContent=cloud.ok?'Progress saves to your Claude account automatically, so updates, cleared browsers and other devices keep your place. Save codes still work as a backup.':'Progress saves on this device. Copy a save code to back it up or move it to another phone.'; }
async function cloudInit(){
  try{
    const C=window.claude; if(!C||!C.use) return;
    const [db,user]=await Promise.all([C.use('db'),C.use('user')]); if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    cloud.ref=db.doc('data/users/'+uid+'/longshot'); const snap=await cloud.ref.get(); cloud.ok=true;
    if(snap.exists){ const d=snap.data(); let remote=null; try{remote=JSON.parse(d.json);}catch(e){}
      if(remote&&(remote.t||0)>(save.t||0)){ adoptSave(remote); if(state==='menu') buildMenu(); }
      else if((save.t||0)>(remote&&remote.t||0)) cloudPush(); }
    else cloudPush();
  }catch(e){ cloud.ok=false; }
  syncLabel();
}
const maxZoom=()=>UPG.zoom.vals[save.up.zoom];

