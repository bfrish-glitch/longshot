/* Longshot 3D · social.js · shared leaderboard (one doc per player at scores/<id>; everyone reads, each writes only their own) */
'use strict';
const LB={db:null,user:null,me:null,docs:[],unsub:null,canWrite:null,ro:false,off:false,tab:'daily',last:'',timer:null,names:{}};
async function lbInit(){
  try{
    const C=window.claude; if(!C||!C.use){ LB.off=true; lbRender(); return; }
    const [db,user]=await Promise.all([C.use('db'),C.use('user')]);
    if(!db||!user){ LB.off=true; lbRender(); return; }
    LB.db=db; LB.user=user; LB.me=await user.id(); LB.canWrite=await user.can('data.write');
    LB.unsub=db.collection('scores').limit(300).onSnapshot(s=>{ LB.docs=s.docs.filter(d=>d.exists).map(d=>Object.assign({},d.data(),{id:d.id})); lbRender(); },()=>{ LB.off=true; lbRender(); });
    lbPush();
  }catch(e){ LB.off=true; lbRender(); }
}
function lbMine(){
  const k=dayKey(), D=save.daily[k]||{best:0,stars:0}, E=save.endless;
  const golds=Object.values(save.vstars||{}).filter(v=>v>=3).length, vtot=Object.values(save.vbest||{}).reduce((a,b)=>a+b,0);
  return {cs:(save.cs||'').slice(0,16),daily:{key:k,score:D.best||0,stars:D.stars||0},endless:{wave:E.wave||0,kills:E.kills||0,score:E.score||0},vet:{golds,total:vtot,cleared:Object.keys(save.vstars||{}).length}};
}
function lbPush(){ // debounced, only when the numbers changed
  if(!LB.db||!LB.me||LB.ro) return; clearTimeout(LB.timer);
  LB.timer=setTimeout(async()=>{ const m=lbMine(), j=JSON.stringify(m); if(j===LB.last) return;
    if(!m.cs&&!m.daily.score&&!m.endless.wave&&!m.vet.cleared) return;
    try{ await LB.db.doc('scores/'+LB.me).set(Object.assign({t:Date.now()},m)); LB.last=j; }
    catch(e){ if(e&&e.code==='invalid_argument'){ LB.ro=true; lbRender(); } } },1200);
}
function lbRows(tab){
  const k=dayKey(), mine=lbMine(), docs=LB.docs.filter(d=>d.id!==LB.me); if(LB.me) docs.push(Object.assign({id:LB.me},mine));
  if(tab==='daily') return docs.filter(d=>d.daily&&d.daily.key===k&&d.daily.score>0).sort((a,b)=>b.daily.score-a.daily.score).map(d=>({d,v:d.daily.score.toLocaleString(),sub:['','BRONZE','SILVER','GOLD'][d.daily.stars||0]}));
  if(tab==='endless') return docs.filter(d=>d.endless&&d.endless.wave>0).sort((a,b)=>b.endless.wave-a.endless.wave||b.endless.score-a.endless.score).map(d=>({d,v:d.endless.wave+' waves',sub:d.endless.kills+' kills'}));
  return docs.filter(d=>d.vet&&d.vet.cleared>0).sort((a,b)=>b.vet.golds-a.vet.golds||b.vet.total-a.vet.total).map(d=>({d,v:d.vet.golds+' gold',sub:d.vet.cleared+'/'+MISSIONS.length+' cleared'}));
}
function lbRank(tab){ const rows=lbRows(tab), i=rows.findIndex(r=>r.d.id===LB.me); return i<0?'':`#${i+1} of ${rows.length} on the ${tab==='daily'?'daily':'endless'} board`+(rows.length<2?'. Share the link to get some competition.':'.'); }
async function lbRender(){
  const el=document.getElementById('lb'), note=document.getElementById('lbNote'); if(!el) return;
  document.querySelectorAll('#lbSeg button').forEach(b=>b.classList.toggle('on',b.dataset.t===LB.tab));
  const cs=document.getElementById('lbCs'); if(cs&&document.activeElement!==cs) cs.value=save.cs||'';
  if(LB.off){ el.innerHTML=''; const p=document.createElement('p'); p.className='tag'; p.textContent='The leaderboard needs Claude sign-in. Your scores still save on this device.'; el.appendChild(p); note.textContent=''; return; }
  const rows=lbRows(LB.tab).slice(0,25);
  let ps={}; try{ if(LB.user&&rows.length) ps=await LB.user.profiles(rows.map(r=>r.d.id)); }catch(e){}
  el.innerHTML='';
  if(!rows.length){ const p=document.createElement('p'); p.className='tag'; p.textContent=LB.tab==='daily'?'Nobody has finished today’s daily yet. Be first.':LB.tab==='endless'?'No endless runs posted yet.':'No veteran clears posted yet.'; el.appendChild(p); }
  rows.forEach((r,i)=>{ const pr=ps[r.d.id]||{}, row=document.createElement('div'); row.className='lbr'+(r.d.id===LB.me?' me':'');
    const rk=document.createElement('b'); rk.className='rk'; rk.textContent=i+1;
    const av=document.createElement('img'); av.className='av'; av.alt=''; if(pr.avatarUrl) av.src=pr.avatarUrl; else av.style.background=pr.color||'#333';
    const nm=document.createElement('span'); nm.className='who'; nm.textContent=(r.d.cs||pr.name||'Agent')+(r.d.id===LB.me?' (you)':'');
    const v=document.createElement('span'); v.className='val'; v.textContent=r.v; const sb=document.createElement('small'); sb.textContent=r.sub; v.appendChild(sb);
    row.append(rk,av,nm,v); el.appendChild(row); });
  note.textContent=LB.ro||LB.canWrite===false?'You can see the board, but posting scores needs edit access to this game. Ask whoever shared it to invite you as an editor.':LB.me?'Scores post automatically when you finish a Daily, an Endless run or a Veteran contract.':'';
}
document.getElementById('lbSeg').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; LB.tab=b.dataset.t; lbRender();});
document.getElementById('lbSave').addEventListener('click',()=>{ const v=(document.getElementById('lbCs').value||'').replace(/[<>]/g,'').trim().slice(0,16); save.cs=v; persist(); lbRender(); });
