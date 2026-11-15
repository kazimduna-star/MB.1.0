// Замок, боссы, ультимейт-синематик, частицы. Подключается из game.js
import*as THREE from"three";
import{GLTFLoader}from"https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=t=>(t=cl(t,0,1))*t*(3-2*t),V=(x,y,z)=>new THREE.Vector3(x,y,z);
export function initExtra(G){const{scene,P,cam,enemies,say}=G,$=i=>document.getElementById(i);
const X={ts:1,E:0,on:false,sk:0},bosses=[];let tm=0;
const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...o}),GL=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.4}),
AD=(c,o={})=>new THREE.MeshBasicMaterial({color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,...o});
// ---------- UI ----------
const st=document.createElement("style");st.textContent=`.bar{position:fixed;left:0;right:0;height:0;background:#000;z-index:6;transition:height .6s;pointer-events:none}#bt1{top:0}#bt2{bottom:0}.cin .bar{height:13vh}.cin #hud,.cin #ctl{opacity:0}#hud,#ctl{transition:opacity .4s}
#fl{position:fixed;inset:0;background:#fff;opacity:0;z-index:7;pointer-events:none}#ut{position:fixed;z-index:7;left:0;right:0;top:17vh;text-align:center;font:italic 700 clamp(24px,7vw,54px) Georgia,serif;color:#fff;text-shadow:0 0 22px #ff9a4d,0 0 50px #ff4d6d;opacity:0;transition:opacity .4s;pointer-events:none;letter-spacing:.08em}.cin #ut{opacity:1}
#bb{position:fixed;z-index:3;top:max(env(safe-area-inset-top),64px);left:50%;transform:translateX(-50%);width:min(440px,82vw);text-align:center;display:none;font:600 14px Georgia,serif;text-shadow:0 0 8px #000}#bb div{height:12px;border-radius:8px;background:#0006;border:1px solid #fff6;margin-top:4px;overflow:hidden}#bb i{display:block;height:100%;background:linear-gradient(90deg,#ff3d6e,#ffb36b);transition:width .2s}`;document.head.append(st);
document.body.insertAdjacentHTML("beforeend",`<div class="bar" id="bt1"></div><div class="bar" id="bt2"></div><div id="fl"></div><div id="ut">Фарфоровый Апокалипсис</div><div id="bb"><span id="bn"></span><div><i id="bh"></i></div></div>`);
// ---------- замок ----------
const C=new THREE.Group();C.position.set(0,0,-70);scene.add(C);
const stone=M(0x8791a8,{roughness:.9}),roof=M(0x6b2f7a,{roughness:.5}),gold=M(0xffd36e,{metalness:.8,roughness:.3});
const bx=(w,h,d,x,y,z,m=stone)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);o.castShadow=o.receiveShadow=true;C.add(o);return o};
bx(48,.04,42,0,-.02,0,M(0x4a5470));bx(46,8,2,0,0,-20);bx(2,8,40,-23,0,0);bx(2,8,40,23,0,0);bx(17,8,2,-14.5,0,20);bx(17,8,2,14.5,0,20);bx(12,2,2,0,6,20);
for(let i=-22;i<=22;i+=3){bx(1.6,1.2,2.2,i,8,-20);if(Math.abs(i)>7)bx(1.6,1.2,2.2,i,8,20)}for(let i=-17;i<=17;i+=3){bx(2.2,1.2,1.6,-23,8,i);bx(2.2,1.2,1.6,23,8,i)}
for(const[x,z]of[[-23,-20],[23,-20],[-23,20],[23,20]]){const t=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.8,16,14),stone);t.position.set(x,8,z);t.castShadow=true;C.add(t);const r=new THREE.Mesh(new THREE.ConeGeometry(4.7,7.5,14),roof);r.position.set(x,19.7,z);C.add(r);const f=new THREE.Mesh(new THREE.ConeGeometry(.12,2,6),gold);f.position.set(x,24.4,z);C.add(f);for(const y of[7,12]){const w=new THREE.Mesh(new THREE.BoxGeometry(.8,1.8,.3),GL(0xffc86b));w.position.set(x*.9,y,z+(z>0?3.4:-3.4));C.add(w)}}
bx(16,22,9,0,0,-15.5);const kr=new THREE.Mesh(new THREE.ConeGeometry(11.5,11,4),roof);kr.position.set(0,27.5,-15.5);kr.rotation.y=Math.PI/4;C.add(kr);
for(const x of[-4,0,4]){const w=new THREE.Mesh(new THREE.BoxGeometry(1.4,3,.3),GL(0xff9aa8));w.position.set(x,13,-10.9);C.add(w)}
for(const x of[-6,6]){bx(2.2,11,2.2,x,0,20);const t=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),GL(0xff8a3d));t.position.set(x,11.8,20);C.add(t)}
for(let i=0;i<10;i++){const a=i/10*6.283,c=new THREE.Mesh(new THREE.OctahedronGeometry(.5),GL(0xb48cff));c.position.set(Math.cos(a)*9,1.2,Math.sin(a)*9-3);c.scale.y=2;c.userData.a=a;C.add(c);(C.u||(C.u=[])).push(c)}
// ---------- боссы ----------
function boss(name,c,lx,lz,s,hp){const g=new THREE.Group(),bm=M(c,{roughness:.35,metalness:.35,emissive:0xffffff,emissiveIntensity:0}),em=GL(0xff3d6e),body=new THREE.Mesh(new THREE.DodecahedronGeometry(1.5,0),bm),head=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),bm);body.position.y=2.4;head.position.y=4.2;body.castShadow=true;g.add(body,head);
const arms=[];for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),em);e.position.set(sx*.3,4.3,.68);const h=new THREE.Mesh(new THREE.ConeGeometry(.22,1.3,8),gold);h.position.set(sx*.6,5.1,0);h.rotation.z=-sx*.5;const f=new THREE.Mesh(new THREE.SphereGeometry(.65,12,10),bm);f.position.set(sx*2.3,2.2,.4);g.add(e,h,f);arms.push(f)}
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,.09,8,48),GL(c));ring.position.y=2.4;ring.rotation.x=1.25;g.add(ring);g.scale.setScalar(s);const wx=C.position.x+lx,wz=C.position.z+lz;g.position.set(wx,0,wz);scene.add(g);
bosses.push({g,name,hp,max:hp,s,x:wx,z:wz,hit:0,dead:false,k:0,aggro:false,w:-1,did:false,cd:2,oc:2,ph:Math.random()*6,body,ring,arms,bm})}
boss("Страж Лунных Врат",0x4b6cff,0,12,1.1,45);boss("Королева Теней",0xa23cff,0,-4,1.5,90);
// ---------- пулы эффектов (создаются заранее — нет фризов при первом ударе) ----------
const sw=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.88,1,48),AD(0xff6a8a));m.rotation.x=-Math.PI/2;m.scale.setScalar(1e-4);scene.add(m);return{m,l:0,x:0,z:0,hit:false,R:9}});
const orbs=Array.from({length:6},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.45,12,8),AD(0xd06bff));m.scale.setScalar(1e-4);scene.add(m);return{m,l:0,vx:0,vz:0}});
const PN=500,pg=new THREE.BufferGeometry(),pp=new Float32Array(PN*3).fill(-999),pc=new Float32Array(PN*3),pv=new Float32Array(PN*3),pl=new Float32Array(PN);pg.setAttribute("position",new THREE.BufferAttribute(pp,3));pg.setAttribute("color",new THREE.BufferAttribute(pc,3));
const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.45,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));pts.frustumCulled=false;scene.add(pts);let pi=0;
const PAL=[[1,.8,.4],[1,.45,.25],[1,1,1],[.6,.85,1]];
X.burst=(x,y,z,n,sp)=>{for(let k=0;k<n;k++){const i=pi++%PN,a=Math.random()*6.283,u=Math.random()*2-1,r=Math.sqrt(1-u*u),s=sp*(.4+Math.random());pp.set([x,y,z],i*3);pv.set([Math.cos(a)*r*s,u*s+sp*.3,Math.sin(a)*r*s],i*3);pc.set(PAL[Math.random()*4|0],i*3);pl[i]=.5+Math.random()*.7}};
// ультимейт-объекты
const porc=M(0xf4f8ff,{roughness:.12,metalness:.1,emissive:0x6fa8ff,emissiveIntensity:.35}),vase=new THREE.Group();
vase.add(new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.32,0],[.48,.2],[.62,.55],[.5,.95],[.27,1.12],[.3,1.35],[.44,1.5]].map(p=>new THREE.Vector2(p[0],p[1])),28),porc));
const band=new THREE.Mesh(new THREE.TorusGeometry(.6,.05,8,32),M(0x2b5fd9,{emissive:0x2b5fd9,emissiveIntensity:.6}));band.rotation.x=Math.PI/2;band.position.y=.55;vase.add(band);vase.scale.setScalar(1e-4);scene.add(vase);
const ball=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),AD(0xff8a3d,{opacity:0})),core=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),AD(0xffffff,{opacity:0})),beam=new THREE.Mesh(new THREE.CylinderGeometry(1,1,50,20,1,true),AD(0x9fe8ff,{opacity:0})),
r1=new THREE.Mesh(new THREE.RingGeometry(.9,1,64),AD(0xffd36e)),r2=new THREE.Mesh(new THREE.RingGeometry(.9,1,64),AD(0xff5a5a)),aura=new THREE.Mesh(new THREE.RingGeometry(.7,1,6),AD(0x9fe8ff)),aura2=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),AD(0xffd36e));
for(const o of[ball,core,beam,r1,r2,aura,aura2]){o.scale.setScalar(1e-4);scene.add(o);o.frustumCulled=false}for(const o of[r1,r2,aura,aura2])o.rotation.x=-Math.PI/2;
// ---------- боссы: логика ----------
const bhurt=()=>{X.sk=Math.max(X.sk,.6);G.hurt()};
X.dmg=(b,n)=>{b.hp-=n;b.hit=.18;b.aggro=true;X.E=Math.min(100,X.E+4);X.burst(b.x,3*b.s,b.z,24,7);if(b.hp<=0&&!b.dead){b.dead=true;b.k=1.8;X.sk=1;X.burst(b.x,3,b.z,120,12);say(b.name+" повержен!");X.E=100}};
X.hitBoss=(range,dmg,cone)=>{const fx=Math.sin(P.face),fz=Math.cos(P.face);for(const b of bosses){if(b.dead)continue;const dx=b.x-P.x,dz=b.z-P.z,d=Math.hypot(dx,dz);if(d<range+1.8*b.s&&(dx*fx+dz*fz)/Math.max(d,.01)>cone)X.dmg(b,dmg)}};
X.gain=n=>{X.E=Math.min(100,X.E+n)};
function bossUpd(b,dt){const u=b.body;if(b.dead){if(b.k>0){b.k-=dt;b.g.scale.setScalar(Math.max(1e-3,b.s*b.k/1.8));b.g.rotation.y+=dt*8;if(b.k<=0)b.g.visible=false}return}
b.hit=Math.max(0,b.hit-dt);b.bm.emissiveIntensity=b.hit>0?.7:0;b.ring.rotation.z+=dt*2.2;u.position.y=2.4+Math.sin(tm*2+b.ph)*.15;b.arms.forEach((a,i)=>a.position.y=2.2+Math.sin(tm*2.4+i*2+b.ph)*.25);
const dx=P.x-b.x,dz=P.z-b.z,d=Math.hypot(dx,dz);if(d<42)b.aggro=true;if(!b.aggro)return;b.g.rotation.y=Math.atan2(dx,dz);b.cd-=dt;const p2=b.hp<b.max/2;
if(b.w>=0){b.w+=dt/1.05;b.g.scale.y=b.s*(1+.3*Math.sin(Math.min(b.w,1)*Math.PI*.9));if(b.w>.7&&!b.did){b.did=true;const s=sw.find(x=>x.l<=0);if(s){s.l=.8;s.x=b.x;s.z=b.z;s.hit=false;s.R=b.s*9}X.sk=.7}if(b.w>=1.1){b.w=-1;b.cd=p2?2:3;b.g.scale.y=b.s}}
else{if(d>5){const s=(p2?3.4:2.4)*dt;b.x+=dx/d*s;b.z+=dz/d*s;b.g.position.x=b.x;b.g.position.z=b.z}if(d<8&&b.cd<=0){b.w=0;b.did=false}}
if(p2){b.oc-=dt;if(b.oc<=0){b.oc=2.4;for(let k=-1;k<=1;k++){const o=orbs.find(x=>x.l<=0);if(!o)break;const a=Math.atan2(dx,dz)+k*.3;o.l=4;o.vx=Math.sin(a)*9;o.vz=Math.cos(a)*9;o.m.position.set(b.x,2.6,b.z);o.m.scale.setScalar(1)}}}}
function fxUpd(dt){for(const s of sw){if(s.l<=0)continue;s.l-=dt;const u=1-s.l/.8,r=1+u*s.R;s.m.position.set(s.x,.15,s.z);s.m.scale.setScalar(r);s.m.material.opacity=1-u;const d=Math.hypot(P.x-s.x,P.z-s.z);if(!s.hit&&Math.abs(d-r)<1.1&&P.y<1.1){s.hit=true;bhurt()}if(s.l<=0)s.m.scale.setScalar(1e-4)}
for(const o of orbs){if(o.l<=0)continue;o.l-=dt;o.m.position.x+=o.vx*dt;o.m.position.z+=o.vz*dt;o.m.scale.setScalar(.8+.2*Math.sin(tm*20));if(Math.hypot(P.x-o.m.position.x,P.z-o.m.position.z)<1.1&&P.y<2.2){o.l=0;bhurt()}if(o.l<=0)o.m.scale.setScalar(1e-4)}
let any=false;for(let i=0;i<PN;i++)if(pl[i]>0){pl[i]-=dt;any=true;pv[i*3+1]-=9*dt;for(let k=0;k<3;k++)pp[i*3+k]+=pv[i*3+k]*dt;if(pl[i]<=0)pp[i*3+1]=-999}if(any){pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true}}
// ---------- ультимейт ----------
const U={t:0,boom:false,bt:0,tx:0,tz:0,px:0,pz:0,cp:V(0,0,0),lp:V(0,0,0),cd:V(0,0,0),ld:V(0,0,0),vs:V(0,0,0)};
X.ult=()=>{if(X.on||X.E<100||!G.go())return;X.on=true;U.t=0;U.boom=false;U.bt=0;X.E=0;U.px=P.x;U.pz=P.z;let bd=1e9,t=null;for(const b of bosses)if(!b.dead){const d=Math.hypot(b.x-P.x,b.z-P.z);if(d<40&&d<bd){bd=d;t=b}}if(!t)for(const e of enemies)if(e.dead<=0){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<25&&d<bd){bd=d;t=e}}
const f=t?Math.atan2(t.x-P.x,t.z-P.z):P.face,dist=t?Math.min(bd,26):10;P.face=f;U.tx=P.x+Math.sin(f)*dist;U.tz=P.z+Math.cos(f)*dist;P.did=true;P.inv=99;document.body.classList.add("cin");U.cp.copy(cam.position);U.lp.set(P.x,P.y+1.4,P.z);U.cd.copy(U.cp);U.ld.copy(U.lp);vase.scale.setScalar(1e-4)};
function ultUpd(dt){const t=U.t+=dt,f=[Math.sin(P.face),Math.cos(P.face)],sd=[f[1],-f[0]],rd=dt/X.ts;P.x=U.px;P.z=U.pz;P.inv=99;P.did=true;
if(t<2.2){P.vy=0;const k=sm(t/1.5);P.y=3.4*k;
if(t<1.5){P.skl=.05+.4*k;vase.position.set(P.x+f[0]*.2,P.y+2.2+Math.sin(t*5)*.1,P.z+f[1]*.2);vase.scale.setScalar(.9*k+1e-3);vase.rotation.y+=dt*5;vase.rotation.z=Math.sin(t*3)*.2;
aura.position.set(P.x,.12,P.z);aura.scale.setScalar(.6+3.2*k);aura.rotation.z+=dt*2;aura.material.opacity=k;aura2.position.set(P.x,.14,P.z);aura2.scale.setScalar(.5+2.4*k);aura2.rotation.z-=dt*3;aura2.material.opacity=k*.8;beam.position.set(P.x,25,P.z);beam.scale.set(.5+k,1,.5+k);beam.material.opacity=.35*k;if(Math.random()<.6)X.burst(P.x+(Math.random()-.5)*3,.3,P.z+(Math.random()-.5)*3,2,3);
const a=P.face+.7-1.1*k;U.cd.set(P.x+Math.sin(a)*2.7,P.y+1.7,P.z+Math.cos(a)*2.7);U.ld.set(P.x,P.y+1.55+.4*k,P.z)}
else{const q=(t-1.5)/.7;P.skl=.45+.4*sm(q);U.vs.set(P.x,P.y+2.2,P.z);vase.position.lerpVectors(U.vs,V(U.tx,1,U.tz),q*q);vase.position.y+=Math.sin(q*Math.PI)*3;vase.rotation.x+=dt*14;vase.scale.setScalar(.9);aura.scale.multiplyScalar(1-dt*2);aura2.scale.multiplyScalar(1-dt*2);beam.material.opacity*=.9;X.burst(vase.position.x,vase.position.y,vase.position.z,3,2);
U.cd.set(P.x+sd[0]*8-f[0]*2,P.y+3,P.z+sd[1]*8-f[1]*2);U.ld.copy(vase.position)}}
else if(!U.boom){U.boom=true;U.bt=0;X.ts=.4;P.skl=-1;vase.scale.setScalar(1e-4);aura.scale.setScalar(1e-4);aura2.scale.setScalar(1e-4);$("fl").style.transition="none";$("fl").style.opacity=1;requestAnimationFrame(()=>{$("fl").style.transition="opacity 1.4s";$("fl").style.opacity=0});X.sk=1.6;
G.aoe(U.tx,U.tz,17,99);for(const b of bosses)if(!b.dead&&Math.hypot(b.x-U.tx,b.z-U.tz)<19)X.dmg(b,35);X.burst(U.tx,2,U.tz,300,22);X.burst(U.tx,1,U.tz,200,12);r1.position.set(U.tx,.2,U.tz);r2.position.set(U.tx,.5,U.tz);ball.position.set(U.tx,2,U.tz);core.position.set(U.tx,2,U.tz);beam.position.set(U.tx,25,U.tz);beam.material.opacity=.8;say("💥 БАБАХ!")}
if(U.boom){const bt=U.bt+=rd,e=sm(bt/1.2);ball.scale.setScalar(.1+16*e);ball.material.opacity=Math.max(0,.9-bt/1.6);core.scale.setScalar(.1+9*e);core.material.opacity=Math.max(0,1-bt);r1.scale.setScalar(1+30*e);r1.material.opacity=Math.max(0,1-bt/1.4);r2.scale.setScalar(1+20*sm(bt/.9));r2.material.opacity=Math.max(0,1-bt);const bw=Math.max(.001,2.2-bt);beam.scale.set(bw,1,bw);beam.material.opacity=Math.max(0,.8-bt/1.5);
U.cd.set(U.tx+f[1]*14-f[0]*5,7+bt*2,U.tz-f[0]*14-f[1]*5);U.ld.set(U.tx,3,U.tz);X.ts=bt<1.3?.4:lerp(.4,1,sm((bt-1.3)/.6));
if(bt>2.1){X.on=false;X.ts=1;P.inv=.8;P.skl=-1;document.body.classList.remove("cin");for(const o of[ball,core,r1,r2,beam])o.scale.setScalar(1e-4)}}
const k=1-Math.exp(-rd*(U.boom?3:5));U.cp.lerp(U.cd,k);U.lp.lerp(U.ld,k)}
X.camFx=dt=>{if(X.on){cam.position.copy(U.cp);cam.lookAt(U.lp)}X.sk=Math.max(0,X.sk-dt*1.6);if(X.sk>0)cam.position.add(V((Math.random()-.5)*X.sk*.5,(Math.random()-.5)*X.sk*.5,(Math.random()-.5)*X.sk*.5))};
X.update=dt=>{tm+=dt;X.collide();if(!X.on)X.E=Math.min(100,X.E+dt*4);for(const c of C.u||[]){c.rotation.y+=dt*2;c.position.y=1.2+Math.sin(tm*2+c.userData.a*3)*.35}
let nb=null,bd=1e9;for(const b of bosses){bossUpd(b,dt);if(b.aggro&&!b.dead){const d=Math.hypot(b.x-P.x,b.z-P.z);if(d<bd){bd=d;nb=b}}}$("bb").style.display=nb?"block":"none";if(nb){$("bn").textContent=nb.name;$("bh").style.width=nb.hp/nb.max*100+"%"}
fxUpd(dt);if(X.on)ultUpd(dt);const u=$("ult");u.style.opacity=X.E>=100?1:.5;u.classList.toggle("rdy",X.E>=100);u.querySelector("small").textContent=X.E>=100?"R":Math.floor(X.E)+"%"};
// ---------- коллизии: стены замка и дома больше не проходимы ----------
const COL=[],box2=(x0,z0,x1,z1)=>COL.push([Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)]);
const cz=C.position.z;box2(-24,cz-21,24,cz-19);box2(-24,cz-20,-22,cz+20);box2(22,cz-20,24,cz+20);box2(-24,cz+19,-6,cz+21);box2(6,cz+19,24,cz+21);box2(-8,cz-20,8,cz-11);
for(const[x,z]of[[-23,-20],[23,-20],[-23,20],[23,20]])box2(x-3.4,cz+z-3.4,x+3.4,cz+z+3.4);
X.collide=()=>{const r=.5;for(const c of COL){if(P.x>c[0]-r&&P.x<c[2]+r&&P.z>c[1]-r&&P.z<c[3]+r){const l=P.x-(c[0]-r),rr=c[2]+r-P.x,t=P.z-(c[1]-r),b=c[3]+r-P.z,m=Math.min(l,rr,t,b);if(m===l)P.x=c[0]-r;else if(m===rr)P.x=c[2]+r;else if(m===t)P.z=c[1]-r;else P.z=c[3]+r}}};
// ---------- деревня из Medieval Village MegaKit (glTF, оригинальные текстуры без сжатия) ----------
(async()=>{try{const L=new GLTFLoader(),VB=await fetch("village/Prop_Crate.gltf",{method:"HEAD"}).then(r=>r.ok?"village/":"").catch(()=>""),M={},N="Wall_Plaster_Straight Wall_Plaster_Door_Flat Wall_Plaster_Window_Wide_Flat Wall_UnevenBrick_Straight Corner_Exterior_Wood Floor_WoodDark Roof_2x4_RoundTile Prop_Chimney Prop_Wagon Prop_Crate Prop_WoodenFence_Single".split(" ");
await Promise.all(N.map(async n=>{const g=await L.loadAsync(VB+n+".gltf");g.scene.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});M[n]=g.scene}));
const put=(n,x,y,z,ry,par)=>{const o=M[n].clone();o.position.set(x,y,z);o.rotation.y=ry;par.add(o);return o};
function house(x,z,ry,alt){const g=new THREE.Group(),w=alt?"Wall_UnevenBrick_Straight":"Wall_Plaster_Straight";put("Wall_Plaster_Door_Flat",-1,0,1,0,g);put("Wall_Plaster_Window_Wide_Flat",1,0,1,0,g);put(w,-1,0,-1,Math.PI,g);put(w,1,0,-1,Math.PI,g);put("Wall_Plaster_Window_Wide_Flat",-2,0,0,-Math.PI/2,g);put(w,2,0,0,Math.PI/2,g);
for(const[cx,cz2]of[[-2,-1],[2,-1],[-2,1],[2,1]])put("Corner_Exterior_Wood",cx,0,cz2,0,g);put("Floor_WoodDark",-1,.02,0,0,g);put("Floor_WoodDark",1,.02,0,0,g);put("Roof_2x4_RoundTile",0,3.12,0,Math.PI/2,g);put("Prop_Chimney",1.3,2.6,-.4,0,g);
g.scale.setScalar(1.4);g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);const sw=Math.abs(Math.sin(ry))>.5,hx=(sw?1.7:2.9),hz=(sw?2.9:1.7);box2(x-hx,z-hz,x+hx,z+hz)}
[[-12,-24,1],[-12,-38,0],[-12,-52,1],[12,-26,0],[12,-40,1],[12,-54,0]].forEach(([x,z,k])=>house(x,z,x<0?Math.PI/2:-Math.PI/2,k));
put("Prop_Wagon",4.5,0,-30,.6,scene);box2(3,-33,6,-28);for(const[x,z]of[[-4,-20],[-3.2,-20.4],[4,-22],[-5,-44]]){put("Prop_Crate",x,0,z,x,scene);box2(x-.6,z-.6,x+.6,z+.6)}
for(let i=0;i<7;i++){put("Prop_WoodenFence_Single",-5.2,0,-18-i*2.06,Math.PI/2,scene);put("Prop_WoodenFence_Single",5.2,0,-60+i*2.06,Math.PI/2,scene)}
G.R.compile(scene,cam)}catch(err){console.warn("[village] не загрузилась:",err)}})();
G.R.compile(scene,cam);return X}
