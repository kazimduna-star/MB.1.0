import*as THREE from"three";
import{GLTFLoader}from"https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import{setup,pose}from"./anim.js";
import{initExtra}from"./extra.js";
import{VRMLoaderPlugin,VRMUtils}from"https://esm.sh/@pixiv/three-vrm@3.2.0?external=three";
const $=i=>document.getElementById(i),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=t=>(t=cl(t,0,1))*t*(3-2*t);
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a)),ls=(k,d)=>{try{return localStorage.getItem(k)||d}catch{return d}},ss=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const QS={low:{n:"Низкое",pr:1,sh:0},med:{n:"Среднее",pr:1.3,sh:1024},high:{n:"Высокое",pr:1.7,sh:2048},ultra:{n:"Ультра",pr:2.4,sh:4096}};
const R=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bbbe7);scene.fog=new THREE.Fog(0x9bbbe7,30,120);
const cam=new THREE.PerspectiveCamera(50,1,.05,250);scene.add(new THREE.HemisphereLight(0xc9e4ff,0x496044,1.4));
const sun=new THREE.DirectionalLight(0xffe5bd,2.4);sun.shadow.camera.left=sun.shadow.camera.bottom=-18;sun.shadow.camera.right=sun.shadow.camera.top=18;scene.add(sun,sun.target);
function applyQ(k){const q=QS[k];ss("q",k);R.setPixelRatio(Math.min(devicePixelRatio,q.pr));R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.shadowMap.enabled=!!q.sh;sun.castShadow=!!q.sh;if(q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)});document.querySelectorAll("#qual button").forEach(b=>b.classList.toggle("on",b.dataset.q===k))}
const mat=(c,r=.85)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const gr=new THREE.Mesh(new THREE.CircleGeometry(115,64),mat(0x5f9a5c));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;scene.add(gr);
const hm=mat(0x536b8c),tm=mat(0x5b4436),l1=mat(0x235c4a),l2=mat(0x387b58);
for(let i=0;i<22;i++){const a=i/22*6.283,r=72+i%4*7,h=12+i*7%17,m=new THREE.Mesh(new THREE.ConeGeometry(9,h,7),hm);m.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);scene.add(m)}
for(let i=0;i<160;i++){const a=Math.random()*6.283,r=9+Math.random()*68,x=Math.cos(a)*r,z=Math.sin(a)*r,h=2+Math.random()*2.5,t=new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,h,6),tm),c=new THREE.Mesh(new THREE.ConeGeometry(1.2+Math.random(),3.4+Math.random()*2,7),i%2?l1:l2);t.position.set(x,h/2,z);c.position.set(x,h+1.3,z);t.castShadow=c.castShadow=true;scene.add(t,c)}
const moon=new THREE.Mesh(new THREE.SphereGeometry(8,32,24),new THREE.MeshBasicMaterial({color:0xf1edda}));moon.position.set(-42,48,-95);scene.add(moon);
{const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<700;i++)p.push((Math.random()-.5)*220,15+Math.random()*90,(Math.random()-.5)*220);g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:.28})))}
const crystals=[];for(let i=0;i<8;i++){const a=i/8*6.283+.4,r=14+Math.random()*45,g=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshStandardMaterial({color:0x63eaff,emissive:0x168abf,roughness:.2}));g.position.set(Math.cos(a)*r,1.1,Math.sin(a)*r);g.scale.y=1.6;scene.add(g);crystals.push(g)}
// ---- assets (parts <=20MB for GitHub) ----
let BASE="",man;for(const p of["","assets/"]){try{const r=await fetch(p+"manifest.json");if(r.ok){BASE=p;man=await r.json();break}}catch{}}
if(!man){window.showErr("Не найден manifest.json. Положи его в папку assets рядом с файлами vrm*.part* (или в корень вместе с ними) и открой игру через ссылку GitHub Pages.");throw Error("no manifest")}
const setProg=(p,t)=>{$("boot").style.display=p>=1?"none":"block";$("bt").textContent=t+" "+Math.round(p*100)+"%";$("bi").style.width=p*100+"%"};
async function blobOf(a,cb){const bs=[];for(let i=0;i<a.parts;i++){const r=await fetch(`${BASE}${a.id}.part${String(i).padStart(3,"0")}`);if(!r.ok)throw Error(a.id);const tot=+r.headers.get("content-length")||0;if(!r.body){bs.push(await r.arrayBuffer());cb&&cb((i+1)/a.parts);continue}const rd=r.body.getReader();let got=0;for(;;){const{done,value}=await rd.read();if(done)break;bs.push(value);got+=value.length;cb&&cb((i+(tot?got/tot:0))/a.parts)}cb&&cb((i+1)/a.parts)}return new Blob(bs)}
const gl=new GLTFLoader();gl.register(p=>new VRMLoaderPlugin(p));
const BN="hips spine chest neck head leftUpperArm leftLowerArm leftHand rightUpperArm rightLowerArm rightHand leftUpperLeg leftLowerLeg leftFoot leftToes rightUpperLeg rightLowerLeg rightFoot rightToes upperChest leftShoulder rightShoulder".split(" "),cache={};
async function loadChar(i){if(cache[i])return cache[i];const url=URL.createObjectURL(await blobOf(man.chars[i],p=>setProg(p*.97,"Загрузка героя")));try{const g=await gl.loadAsync(url),vrm=g.userData.vrm;VRMUtils.removeUnnecessaryVertices(g.scene);VRMUtils.removeUnnecessaryJoints(g.scene);VRMUtils.rotateVRM0(vrm);vrm.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});
const b={};for(const n of BN)b[n]=vrm.humanoid.getNormalizedBoneNode(n);const h={vrm,b,t:0,sp:0,F:1,hy:b.hips.position.y};
// определяем, куда смотрит модель (по носкам), чтобы все повороты костей были правильными
vrm.scene.rotation.y=0;vrm.scene.updateMatrixWorld(true);const p=new THREE.Vector3(),q=new THREE.Vector3();b.leftFoot.getWorldPosition(p);
if(b.leftToes){b.leftToes.getWorldPosition(q);h.F=q.z>=p.z?1:-1}else h.F=vrm.meta?.metaVersion==="0"?-1:1;
setup(h,scene);setProg(1,"");return cache[i]=h}finally{URL.revokeObjectURL(url)}}
// ---- монстры (слизни) ----
function slime(c,big){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:c,roughness:.2,transparent:true,opacity:.92,emissive:c,emissiveIntensity:.15}),bd=new THREE.Mesh(new THREE.SphereGeometry(.7,20,14),m);bd.position.y=.55;bd.castShadow=true;g.add(bd);
for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0xffffff})),p=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0x111111}));e.position.set(s*.25,.75,.58);p.position.set(s*.25,.75,.69);g.add(e,p)}
g.userData={bd,m,c};g.scale.setScalar(big?1.6:1);return g}
const enemies=[],fx=[];let started=false,paused=false,gems=0,kills=0,keys={},yaw=0,pitch=.12,zoom=+ls("z",3.2),joy={x:0,y:0},last=performance.now(),time=0,H=null,curSp=0,demoT=0,demoN=0;
const P={x:0,z:0,y:0,vy:0,face:0,hp:5,st:100,atk:-1,skl:-1,hit:0,inv:0,cd:0,did:false};
function spawn(i){const big=i%4===3,g=slime([0x57e0a0,0x6fb2ff,0xd98cff,0xff8a7a][i%4],big),a=Math.random()*6.28,r=14+Math.random()*42,e={g,x:Math.cos(a)*r,z:Math.sin(a)*r,hp:big?5:3,max:big?5:3,hit:0,dead:0,wind:-1,cd:1+Math.random()*2,kx:0,kz:0,dx:0,dz:0,ph:Math.random()*6};g.position.set(e.x,0,e.z);scene.add(g);enemies.push(e)}
const say=t=>{$("toast").textContent=t;$("toast").classList.add("s");clearTimeout(say.t);say.t=setTimeout(()=>$("toast").classList.remove("s"),1900)};
function addFx(m,life,grow){scene.add(m);fx.push({m,life,l:life,grow})}
function slash(){const m=new THREE.Mesh(new THREE.RingGeometry(.8,1.7,28,1,0,2.4),new THREE.MeshBasicMaterial({color:0x9fe8ff,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(P.x+Math.sin(P.face)*1.2,1.15+P.y,P.z+Math.cos(P.face)*1.2);m.rotation.set(-1.2,P.face,-1.2+Math.PI/2+.4);addFx(m,.3,1.3)}
function ring(){const m=new THREE.Mesh(new THREE.RingGeometry(.6,1,48),new THREE.MeshBasicMaterial({color:0xffd36e,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(P.x,.1,P.z);addFx(m,.6,5.5)}
function hitE(range,dmg,cone){X.hitBoss(range,dmg,cone);const fx_=Math.sin(P.face),fz=Math.cos(P.face);for(const e of enemies){if(e.dead>0)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<range&&(dx*fx_+dz*fz)/Math.max(d,.01)>cone){e.hp-=dmg;e.hit=.25;X.burst(e.x,.9,e.z,16,5);e.kx=dx/d*9;e.kz=dz/d*9;if(e.hp<=0){e.dead=5;e.g.visible=false;kills++;X.gain(20);H&&(H.A.emo=["happy",2]);$("kills").textContent=kills}}}}
function aoe(x,z,r,dmg){for(const e of enemies){if(e.dead>0)continue;const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz);if(d<r){e.hit=.25;e.hp-=dmg;e.kx=dx/Math.max(d,.1)*14;e.kz=dz/Math.max(d,.1)*14;if(e.hp<=0){e.dead=5;e.g.visible=false;kills++;$("kills").textContent=kills}}}}
function attack(){if(P.atk>=0||P.skl>=0||X.on)return;P.atk=0;P.did=false}
function skill(){if(P.atk>=0||P.skl>=0||P.cd>0||X.on)return;P.skl=0;P.did=false;P.cd=6}
function tick(dt){if(P.atk>=0){P.atk+=dt/.52;if(!P.did&&P.atk>.4){P.did=true;slash();hitE(2.9,1,.1)}if(P.atk>=1)P.atk=-1}
if(P.skl>=0){P.skl+=dt/.95;if(!P.did&&P.skl>.6){P.did=true;ring();hitE(5.5,2,-2);say("Лунная волна!")}if(P.skl>=1)P.skl=-1}
P.hit=Math.max(0,P.hit-dt*2.5);P.inv=Math.max(0,P.inv-dt);P.cd=Math.max(0,P.cd-dt);
for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.l-=dt;const u=1-f.l/f.life;f.m.scale.setScalar(1+f.grow*u*(f.grow>2?1:.3));f.m.material.opacity=Math.max(0,1-u);if(f.l<=0){scene.remove(f.m);fx.splice(i,1)}}}
function hurt(){if(P.inv>0)return;P.hp--;P.inv=1.1;P.hit=1;H&&(H.A.emo=["surprised",.9]);if(P.hp<=0){P.hp=5;P.x=P.z=0;say("Герой пал… возрождение")}$("hp").style.width=P.hp/5*100+"%"}
function step(dt){const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y,r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;let wx=-Math.sin(yaw)*f+Math.cos(yaw)*r,wz=-Math.cos(yaw)*f-Math.sin(yaw)*r,l=Math.hypot(wx,wz);if(l>1){wx/=l;wz/=l;l=1}
const run=!!keys.ShiftLeft&&l>.1&&P.st>2,busy=P.atk>=0||P.skl>=0;P.st=cl(P.st+(run?-22:14)*dt,0,100);const spd=(run?6.5:3.4)*(busy?.25:1);
if(l>.05){P.x+=wx/l*l*spd*dt;P.z+=wz/l*l*spd*dt;let d=Math.atan2(wx,wz)-P.face;d=Math.atan2(Math.sin(d),Math.cos(d));P.face+=d*Math.min(1,dt*12)}curSp=busy?0:l*(run?1:.7);
const lg=Math.hypot(P.x,P.z);if(lg>100){P.x*=100/lg;P.z*=100/lg}
if(keys.Space&&P.y<=0){P.vy=7;keys.Space=false}P.vy-=17*dt;P.y=Math.max(0,P.y+P.vy*dt);if(!P.y)P.vy=0;
if(P.atk>=0&&P.atk>.3&&P.atk<.5){P.x+=Math.sin(P.face)*4*dt;P.z+=Math.cos(P.face)*4*dt}
crystals.forEach((g,i)=>{if(!g.visible)return;g.rotation.y+=dt*1.8;g.position.y=1.1+Math.sin(time*2+i)*.2;if(Math.hypot(g.position.x-P.x,g.position.z-P.z)<1.5){g.visible=false;gems++;$("gems").textContent=gems;H&&(H.A.emo=["happy",2.5]);say(gems===8?"Победа! Все кристаллы собраны!":"Кристалл найден!")}});
for(const e of enemies){const u=e.g.userData;if(e.dead>0){e.dead-=dt;if(e.dead<=0){e.dead=0;e.hp=e.max;const a=Math.random()*6.28;e.x=Math.cos(a)*(20+Math.random()*40);e.z=Math.sin(a)*(20+Math.random()*40);e.g.visible=true}continue}
const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);e.hit-=dt;e.cd-=dt;e.x+=e.kx*dt;e.z+=e.kz*dt;e.kx*=.88;e.kz*=.88;let sy=1+.06*Math.sin(time*5+e.ph),hop=0;
if(e.wind>=0){e.wind+=dt/.9;const w=e.wind;sy=w<.6?lerp(1,.5,sm(w/.6)):lerp(.5,1.25,sm((w-.6)/.2));if(w>.6&&w<.8){e.x+=e.dx*9*dt;e.z+=e.dz*9*dt;if(d<1.5)hurt()}if(w>=1){e.wind=-1;e.cd=2+Math.random()*1.5}}
else{if(d<16&&d>1.8){const s=(e.max>3?1.4:1.9)*dt;e.x+=dx/d*s;e.z+=dz/d*s;hop=Math.abs(Math.sin(time*4+e.ph))*.18}if(d<2.7&&e.cd<=0){e.wind=0;e.dx=dx/d;e.dz=dz/d}}
e.g.position.set(e.x,hop,e.z);e.g.rotation.y=Math.atan2(dx,dz);u.bd.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));u.m.emissive.setHex(e.hit>0?0xffffff:u.c);u.m.emissiveIntensity=e.hit>0?.9:.15}
$("st").style.width=P.st+"%"}
function loop(now){requestAnimationFrame(loop);const rd=Math.min(.05,(now-last)/1e3);last=now;const dt=rd*X.ts;time+=dt;
if(started&&!paused){step(dt);tick(dt);X.update(dt)}else if(!started){demoT+=dt;if(demoT>2.8){demoT=0;demoN++%2?skill():attack()}P.cd=0;P.x=P.z=0;P.face=0;curSp=0;tick(dt);yaw=Math.sin(time*.35)*.5}
if(H){const dx=P.x-(P.px??P.x),dz=P.z-(P.pz??P.z),sp=dt>0?Math.hypot(dx,dz)/dt:0,vx=dx/(dt||1),vz=dz/(dt||1),fx_=Math.sin(P.face),fz_=Math.cos(P.face),acc=dt>0?(sp-(P.ps||0))/dt:0;let df=wrapA(P.face-(P.pf??P.face));
let tg=null,bd=1e9;if(started){for(const e of enemies)if(e.dead<=0){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<12&&d<bd){bd=d;tg={x:e.x,y:.7,z:e.z}}}if(!tg)for(const g of crystals)if(g.visible){const d=Math.hypot(g.position.x-P.x,g.position.z-P.z);if(d<15&&d<bd){bd=d;tg={x:g.position.x,y:1.1,z:g.position.z}}}}else tg={x:cam.position.x,y:cam.position.y,z:cam.position.z};
H.vrm.scene.position.set(P.x,P.y,P.z);H.vrm.scene.rotation.y=P.face+(H.F>0?0:Math.PI);
pose(H,paused?0:dt,{speed:Math.min(sp,8),vy:P.vy,face:P.face,px:P.x,pz:P.z,turn:dt>0?df/dt:0,accF:acc,accR:0,air:P.y>.05,atk:P.atk,skl:P.skl,hit:P.hit,target:tg,combat:started&&bd<6});
P.px=P.x;P.pz=P.z;P.ps=sp;P.pf=P.face}
const ty=P.y+(started?1.35:1.2),cx=P.x+Math.sin(yaw)*Math.cos(pitch)*zoom,cy=Math.max(.3,ty+Math.sin(pitch)*zoom),cz=P.z+Math.cos(yaw)*Math.cos(pitch)*zoom;cam.position.lerp(new THREE.Vector3(cx,cy,cz),1-Math.exp(-dt*9));cam.lookAt(P.x,ty+.05,P.z);X.camFx(rd);
sun.position.set(P.x-20,35,P.z+18);sun.target.position.set(P.x,0,P.z);R.render(scene,cam)}
// ---- меню, выбор героя, настройки ----
let sel=-1,busy=false;
man.chars.forEach((c,i)=>{const b=document.createElement("button");b.className="card";b.innerHTML=`<i>${["🌙","⚔️","✨","🔮"][i%4]}</i>${c.name}`;b.onclick=()=>pick(i);$("cards").append(b)});
for(const k in QS){const b=document.createElement("button");b.dataset.q=k;b.textContent=QS[k].n;b.onclick=()=>applyQ(k);$("qual").append(b)}
async function pick(i){if(busy||i===sel)return;busy=true;$("start").disabled=true;try{const h=await loadChar(i);if(H)scene.remove(H.vrm.scene);H=h;scene.add(h.vrm.scene);sel=i;ss("c",i);document.querySelectorAll(".card").forEach((b,j)=>b.classList.toggle("on",j===i));$("ld").textContent=""}catch(e){setProg(1,"");console.error(e);window.showErr("Не удалось загрузить части модели ("+e.message+"). Проверь, что все файлы vrm*.part* лежат рядом с manifest.json.")}busy=false;$("start").disabled=!H}
async function audio(){try{const c=new AudioContext(),b=await blobOf(man.audio,p=>setProg(p*.97,"Загрузка музыки")),buf=await c.decodeAudioData(await b.arrayBuffer()),s=c.createBufferSource(),g=c.createGain();s.buffer=buf;setProg(1,"");s.loop=true;g.gain.value=.35;s.connect(g).connect(c.destination);s.start()}catch(e){console.warn(e)}}
function setPause(p){paused=p;$("menu").style.display=p?"flex":"none";$("start").textContent="Продолжить"}
$("start").onclick=()=>{if(!started){started=true;pitch=.2;for(let i=0;i<8;i++)spawn(i);audio();$("menu").style.display="none"}else setPause(false)};
$("pause").onclick=()=>{if(started)setPause(!paused)};
$("zoom").value=zoom;$("zoom").oninput=e=>{zoom=+e.target.value;ss("z",zoom)};
addEventListener("wheel",e=>{zoom=cl(zoom+e.deltaY*.003,1.6,8);$("zoom").value=zoom},{passive:true});
const go=()=>started&&!paused;
addEventListener("keydown",e=>{keys[e.code]=true;if(!go())return;if(e.code==="KeyJ"||e.code==="KeyF")attack();if(e.code==="KeyE")skill();if(e.code==="KeyR")X.ult();if(e.code==="Escape")setPause(true)});addEventListener("keyup",e=>keys[e.code]=false);
$("attack").onpointerdown=e=>{e.preventDefault();go()&&attack()};$("skill").onpointerdown=e=>{e.preventDefault();go()&&skill()};$("jump").onpointerdown=e=>{e.preventDefault();keys.Space=true};
const stick=$("stick"),nub=$("nub");let sid=null;function mv(e){const r=stick.getBoundingClientRect();let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const m=48,l=Math.hypot(dx,dy);if(l>m){dx*=m/l;dy*=m/l}joy.x=dx/m;joy.y=dy/m;nub.style.transform=`translate(${dx}px,${dy}px)`}
stick.onpointerdown=e=>{sid=e.pointerId;stick.setPointerCapture(sid);mv(e)};stick.onpointermove=e=>{if(e.pointerId===sid)mv(e)};const stp=()=>{sid=null;joy.x=joy.y=0;nub.style.transform=""};stick.onpointerup=stick.onpointercancel=stp;
let cid=null,px=0,py=0;R.domElement.addEventListener("pointerdown",e=>{if(cid===null){cid=e.pointerId;px=e.clientX;py=e.clientY}});const rl=e=>{if(e.pointerId===cid)cid=null};addEventListener("pointerup",rl);addEventListener("pointercancel",rl);
addEventListener("pointermove",e=>{if(e.pointerId===cid&&go()){yaw-=(e.clientX-px)*.006;pitch=cl(pitch+(e.clientY-py)*.004,-.05,1.1);px=e.clientX;py=e.clientY}});
addEventListener("resize",()=>applyQ(ls("q",matchMedia("(pointer:coarse)").matches?"med":"high")));
const X=initExtra({scene,P,cam,R,enemies,say,aoe,go,hurt:()=>hurt()});$("ult").onpointerdown=e=>{e.preventDefault();X.ult()};
applyQ(ls("q",matchMedia("(pointer:coarse)").matches?"med":"high"));requestAnimationFrame(loop);pick(Math.min(+ls("c",0),man.chars.length-1));
