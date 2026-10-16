/* Longshot 3D · fx.js · lens pass, bloom + color grade, PBR upgrade */
'use strict';
/* ---------- lens pass ---------- */
const postScene=new THREE.Scene(), postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const RTC=renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
const rt=new RTC(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,stencilBuffer:true}); // stencil forces a 24-bit depth buffer; the default 16-bit one loses depth at long range
const postMat=new THREE.ShaderMaterial({
  uniforms:{tex:{value:rt.texture},res:{value:new THREE.Vector2(2,2)},rad:{value:1},gain:{value:1},therm:{value:0},lensOn:{value:1},fxOn:{value:0},bloomT:{value:null},bloom:{value:.4},lift:{value:new THREE.Vector3()},gainC:{value:new THREE.Vector3(1,1,1)},sat:{value:1},con:{value:1}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tex; uniform vec2 res; uniform float rad; uniform float gain; uniform float therm; varying vec2 vUv;
  uniform float lensOn, fxOn, bloom, sat, con; uniform sampler2D bloomT; uniform vec3 lift, gainC;
  vec3 grade(vec3 col, vec2 uv){
    col+=texture2D(bloomT,uv).rgb*bloom;
    col=col*gainC+lift*(1.-col);
    float l=dot(col,vec3(.2126,.7152,.0722)); col=mix(vec3(l),col,sat);
    col=clamp((col-.5)*con+.5,0.,1.);
    col=col*col*(3.-2.*col)*.35+col*.65;
    vec2 q=uv-.5; col*=1.-dot(q,q)*.55;
    return col;
  }
  void main(){
    if(lensOn<.5){ vec3 col=texture2D(tex,vUv).rgb; gl_FragColor=vec4(fxOn>.5?grade(col,vUv):col,1.); return; }
    vec2 c=res*.5; vec2 d=(vUv*res-c)/rad; float r=length(d);
    vec2 base=c+d*rad*(1.-.07*r*r);
    vec2 dir=r>0.001?d/r:vec2(0.);
    float ca=smoothstep(.5,1.,r)*3.5;
    vec3 col=vec3(texture2D(tex,(base+dir*ca)/res).r,texture2D(tex,base/res).g,texture2D(tex,(base-dir*ca)/res).b);
    float bl=smoothstep(.7,1.,r)*5.;
    if(bl>.05){vec3 acc=col; for(int i=0;i<6;i++){float a=float(i)*1.0472; acc+=texture2D(tex,(base+vec2(cos(a),sin(a))*bl)/res).rgb;} col=acc/7.;}
    float hot=smoothstep(.45,.85,col.g-max(col.r,col.b));
    col*=gain; col=col/(1.+col*(gain-1.)*.35);
    if(therm>.5){float l=dot(col,vec3(.3,.59,.11)); col=vec3(l*.3)+vec3(hot);}
    else if(fxOn>.5) col=grade(col,base/res);
    gl_FragColor=vec4(col,1.);
  }`,depthTest:false,depthWrite:false});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));
const _sz=new THREE.Vector2();
/* ---------- high-fidelity pass: bloom + color grade, always on when FX ---------- */
const BL=[0,1].map(()=>new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false}));
const fsq=new THREE.Mesh(new THREE.PlaneGeometry(2,2)); const fsScene=new THREE.Scene(); fsScene.add(fsq);
postMat.uniforms.bloomT.value=BL[0].texture;
const VS='varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}';
const brightMat=new THREE.ShaderMaterial({uniforms:{tex:{value:rt.texture},px:{value:new THREE.Vector2()},th:{value:.75}},vertexShader:VS,depthTest:false,depthWrite:false,
  fragmentShader:`uniform sampler2D tex; uniform vec2 px; uniform float th; varying vec2 vUv;
  vec3 b(vec2 o){vec3 c=texture2D(tex,vUv+o*px).rgb; float l=max(c.r,max(c.g,c.b)); return c*smoothstep(th,th+.25,l);}
  void main(){gl_FragColor=vec4((b(vec2(-1.,-1.))+b(vec2(1.,-1.))+b(vec2(-1.,1.))+b(vec2(1.,1.)))*.25,1.);}`});
const blurMat=new THREE.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,
  fragmentShader:`uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
  void main(){vec3 c=texture2D(tex,vUv).rgb*.2270;
    c+=(texture2D(tex,vUv+dir*1.3846).rgb+texture2D(tex,vUv-dir*1.3846).rgb)*.3162;
    c+=(texture2D(tex,vUv+dir*3.2308).rgb+texture2D(tex,vUv-dir*3.2308).rgb)*.0703;
    gl_FragColor=vec4(c,1.);}`});
const GRADE={ // lift (shadow tint), gain (highlight tint), saturation, contrast, bloom amount, bloom threshold
  day:  {lift:[.01,.016,.03], gain:[1.0,.97,.92], sat:1.16, con:1.14, bloom:.32, th:.82},
  dusk: {lift:[.03,.012,.03],  gain:[1.08,.98,.88], sat:1.12, con:1.12, bloom:.55, th:.62},
  night:{lift:[.006,.012,.03], gain:[1.0,.98,1.04], sat:1.05, con:1.08, bloom:.9, th:.45}};
function skyMaterial(P,sd,palKey){
  const glow=palKey==='dusk'?1.4:palKey==='night'?.25:.8;
  return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(P.skyTop)},hor:{value:new THREE.Color(P.skyHor)},gnd:{value:new THREE.Color(P.ground).lerp(new THREE.Color(P.fog),.55)},sun:{value:sd.clone()},sunC:{value:new THREE.Color(P.disc).lerp(new THREE.Color(P.sun),.5)},glow:{value:glow}},
    vertexShader:'varying vec3 vD; void main(){vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 top,hor,gnd,sun,sunC; uniform float glow; varying vec3 vD;
    void main(){ vec3 d=normalize(vD); float y=d.y;
      vec3 c=mix(hor,top,pow(clamp(y/.5,0.,1.),.55));
      c=mix(c,hor*1.04,exp(-max(y,0.)*22.)*.55);
      c=mix(c,gnd,smoothstep(0.,-.12,y));
      float s=max(dot(d,normalize(sun)),0.);
      c+=sunC*glow*(pow(s,6.)*.18+pow(s,40.)*.35+pow(s,600.)*1.2);
      gl_FragColor=linearToOutputTexel(vec4(c,1.)); }`});
}
const pmrem=new THREE.PMREMGenerator(renderer); let envRT=null;
const FX=()=>save.opts.fx!==false;
function upgradeWorld(){
  // image-based lighting: a blurred copy of this map's sky lights and reflects off every surface
  const P=city.P, es=new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),skyMaterial(P,city.sunDir,city.pal)));
  if(envRT) envRT.dispose(); envRT=pmrem.fromScene(es,.03); scene.environment=envRT.texture;
  const night=city.pal==='night', cache=new Map(), isWater=m=>m.map&&waterTex.includes(m.map);
  const conv=m=>{
    if(!m||cache.has(m)) return cache.get(m)||m;
    let n=null;
    const base={color:m.color,map:m.map,side:m.side,vertexColors:m.vertexColors,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,fog:m.fog};
    if(m.emissive) Object.assign(base,{emissive:m.emissive,emissiveMap:m.emissiveMap,emissiveIntensity:m.emissiveIntensity});
    if(m.isMeshLambertMaterial) n=new THREE.MeshStandardMaterial(Object.assign(base,{roughness:.9,metalness:0,envMapIntensity:night?1:.55}));
    else if(m.isMeshPhongMaterial){
      if(isWater(m)) n=new THREE.MeshStandardMaterial(Object.assign(base,{color:m.color.clone().multiplyScalar(.75),roughness:.3,metalness:0,envMapIntensity:.7}));
      else if(m.transparent) n=new THREE.MeshStandardMaterial(Object.assign(base,{roughness:.04,metalness:.4,envMapIntensity:2,opacity:Math.min(.45,m.opacity*2.2)}));
      else n=new THREE.MeshStandardMaterial(Object.assign(base,{roughness:clamp(1-m.shininess/100,.25,.85),metalness:.55,envMapIntensity:1}));
    }
    if(n&&m.map&&m.map.userData&&m.map.userData.pbr){ const t=m.map.userData.pbr; n.roughnessMap=t; n.metalnessMap=t; n.roughness=1; n.metalness=1; n.envMapIntensity=night?1.2:1.05; } // glass panes reflect, walls stay matte
    if(n){ if(n.map) n.map.anisotropy=ANISO; m.dispose(); }
    cache.set(m,n||m); return n||m;
  };
  world.traverse(o=>{ if(o.isMesh) o.material=Array.isArray(o.material)?o.material.map(conv):conv(o.material);
    if(o.isHemisphereLight) o.intensity*=night?.55:.42; if(o.isAmbientLight) o.intensity*=.5; if(o.isDirectionalLight) o.intensity*=night?1:1.12; });
  const G=GRADE[city.pal]||GRADE.day; brightMat.uniforms.th.value=G.th*(rainOn?1.05:1);
  const u=postMat.uniforms; u.lift.value.set(...G.lift); u.gainC.value.set(...G.gain); u.sat.value=rainOn?G.sat*.82:G.sat; u.con.value=G.con; u.bloom.value=G.bloom;
}
// rifle: PBR metal so it picks up the sky
{const rc=new Map(); rifle.traverse(o=>{ if(!o.isMesh||!o.material.isMeshPhongMaterial) return; const m=o.material; let n=rc.get(m);
  if(!n){n=new THREE.MeshStandardMaterial({color:m.color,emissive:m.emissive,roughness:clamp(1-m.shininess/90,.22,.8),metalness:m.shininess>40?.8:.25,envMapIntensity:1.1}); rc.set(m,n);} if(FX()) o.material=n; });}
rifle.userData.style();
function renderFrame(){
  const lens=state==='play'&&scoped&&fov<BASE_FOV*.7, fx=FX()&&!!city;
  if(!lens&&!fx){ renderer.render(scene,camera); return; }
  renderer.getDrawingBufferSize(_sz);
  if(rt.width!==_sz.x||rt.height!==_sz.y){rt.setSize(_sz.x,_sz.y); postMat.uniforms.res.value.copy(_sz);
    const bw=Math.max(2,_sz.x>>2), bh=Math.max(2,_sz.y>>2); BL.forEach(b=>b.setSize(bw,bh)); brightMat.uniforms.px.value.set(1/_sz.x,1/_sz.y);}
  const u=postMat.uniforms;
  u.lensOn.value=lens?1:0;
  u.rad.value=lens?scopeR()*renderer.getPixelRatio():1;
  u.therm.value=lens&&thermApplied?1:0;
  u.gain.value=lens?(city?(city.pal==='night'?2.2:city.pal==='dusk'?1.25:1):1):1;
  u.fxOn.value=fx?1:0;
  renderer.setRenderTarget(rt); renderer.render(scene,camera);
  if(fx&&!(lens&&thermApplied)){
    fsq.material=brightMat; renderer.setRenderTarget(BL[0]); renderer.render(fsScene,postCam);
    fsq.material=blurMat; blurMat.uniforms.tex.value=BL[0].texture; blurMat.uniforms.dir.value.set(1/BL[0].width,0); renderer.setRenderTarget(BL[1]); renderer.render(fsScene,postCam);
    blurMat.uniforms.tex.value=BL[1].texture; blurMat.uniforms.dir.value.set(0,1/BL[0].height); renderer.setRenderTarget(BL[0]); renderer.render(fsScene,postCam);
    blurMat.uniforms.tex.value=BL[0].texture; blurMat.uniforms.dir.value.set(2/BL[0].width,0); renderer.setRenderTarget(BL[1]); renderer.render(fsScene,postCam);
    blurMat.uniforms.tex.value=BL[1].texture; blurMat.uniforms.dir.value.set(0,2/BL[0].height); renderer.setRenderTarget(BL[0]); renderer.render(fsScene,postCam);
  }
  renderer.setRenderTarget(null); renderer.render(postScene,postCam);
}

