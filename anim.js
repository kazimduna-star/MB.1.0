// Процедурная система анимации для VRM: блендинг, ходьба по пройденной дистанции (без скольжения ног),
// наклоны от ускорения и поворотов, idle-варианты, взгляд, эмоции, привязка стоп к земле.
import*as THREE from"three";
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=t=>(t=cl(t,0,1))*t*(3-2*t),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),dmp=(a,b,dt,k)=>lerp(a,b,1-Math.exp(-dt*k));
const K=(a,v,t)=>{for(let i=1;i<t.length;i++)if(a<=t[i])return lerp(v[i-1],v[i],sm((a-t[i-1])/(t[i]-t[i-1])));return v[v.length-1]};
const KEYS="hips spine chest neck head leftUpperArm leftLowerArm leftHand rightUpperArm rightLowerArm rightHand leftUpperLeg leftLowerLeg leftFoot leftToes rightUpperLeg rightLowerLeg rightFoot rightToes upperChest leftShoulder rightShoulder".split(" ");
const mix=(a,b,w)=>{if(w<=.001)return a;const o={};for(const n of KEYS){const x=a[n]||[0,0,0],y=b[n]||x;o[n]=[lerp(x[0],y[0],w),lerp(x[1],y[1],w),lerp(x[2],y[2],w)]}o.hd=lerp(a.hd||0,b.hd??a.hd??0,w);o.bob=lerp(a.bob||0,b.bob??a.bob??0,w);return o};
export function setup(h,scene){const v=new THREE.Vector3(),b=h.b;b.leftFoot.getWorldPosition(v);const l=v.y;b.rightFoot.getWorldPosition(v);h.fy=(l+v.y)/2-h.vrm.scene.position.y;
h.A={ph:0,amp:0,lf:0,lr:0,roll:0,pv:null,pf:0,idle:{cur:0,prev:0,w:1,t:0,next:5},blink:{t:2,v:0,dbl:0},emo:["",0],em:{},w:{atk:0,skl:0,air:0,hit:0},land:0,wasAir:false,gaze:0,sacc:[0,0,0,0.5],hy:0};
analyze(h);
h.look=new THREE.Object3D();scene.add(h.look);if(h.vrm.lookAt)h.vrm.lookAt.target=h.look}
// ===== Анализ скелета: считает кости, классифицирует их и строит профиль персонажа =====
const FN=["Thumb","Index","Middle","Ring","Little"],FJ={Thumb:["Metacarpal","Proximal","Distal"]};
const fingerNames=s=>FN.flatMap(f=>(FJ[f]||["Proximal","Intermediate","Distal"]).map(j=>s+f+j));
function analyze(h){const vrm=h.vrm,all=new Set(),cls={hair:0,skirt:0,coat:0,bust:0,other:0};
vrm.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.bones.forEach(x=>all.add(x))});
for(const x of all){const n=(x.name||"").toLowerCase();if(/hair|ahoge|tail/.test(n))cls.hair++;else if(/skirt/.test(n))cls.skirt++;else if(/coat|cloak|cape|sleeve|ribbon/.test(n))cls.coat++;else if(/bust|breast/.test(n))cls.bust++;else cls.other++}
h.fb={};for(const s of["left","right"])for(const n of fingerNames(s)){const nd=vrm.humanoid.getNormalizedBoneNode(n);if(nd)h.fb[n]=nd}
const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];vrm.scene.updateMatrixWorld(true);const b=h.b;b.leftUpperLeg.getWorldPosition(v[0]);b.leftLowerLeg.getWorldPosition(v[1]);b.leftFoot.getWorldPosition(v[2]);
const legLen=v[0].distanceTo(v[1])+v[1].distanceTo(v[2]);
const sj=[];const sm_=vrm.springBoneManager;if(sm_&&sm_.joints)for(const j of sm_.joints)sj.push({j,g:j.settings.gravityPower,d:j.settings.dragForce,s:j.settings.stiffness});
h.sj=sj;
// профиль: каждый персонаж получает свою походку из собственных пропорций и одежды
h.prof={joints:all.size,fingers:Object.keys(h.fb).length,spring:sj.length,...cls,legLen:+legLen.toFixed(3),
cad:cl(.82/legLen,.7,1.45),bounce:cl(legLen*.055,.035,.075),armSw:cls.coat>6?.8:1,legTwist:cls.skirt>0?.6:1,hairSway:cl(.7+cls.hair/120,.7,1.5),skirtFlare:cls.skirt>0?1:.4,sway:cls.bust>0?1.1:.9};
(window.RIG=window.RIG||{})[h.vrm.meta?.name||h.vrm.meta?.title||Object.keys(window.RIG).length]=h.prof;console.info("[RIG]",h.prof)}
// пальцы: расслабленный изгиб, волна по пальцам, кулак в атаке, раскрытая ладонь в навыке
function fingers(h,dt,t,F,mw,fist,open,run){const A=h.A,fs=A.fs||(A.fs={}),w=1-Math.exp(-dt*14);
for(const n in h.fb){const side=n[0]==="l"?-1:1,th=n.includes("Thumb"),j=n.endsWith("Distal")?2:n.endsWith("Intermediate")?1:n.includes("Thumb")&&n.endsWith("Metacarpal")?0:n.includes("Thumb")?1:0;
const fi=FN.findIndex(f=>n.includes(f)),rel=[.16,.28,.2][j]*(1+.15*Math.sin(t*1.3+fi)),curl=rel*(1-open)*(1-fist)+fist*[1.0,1.35,1.0][j]*(th?.7:1)+run*.25+open*-.08+.04*mw*Math.sin(t*6+fi*.7+(side>0?0:1.6));
const c=fs[n]=(fs[n]||0)+(curl-(fs[n]||0))*w,nd=h.fb[n];if(th)nd.rotation.set(0,side*F*c*.5,side*F*c*.5);else nd.rotation.set(0,0,side*F*c*(-1)*-1*1)}}
// idle-варианты: каждый возвращает смещения костей
function idleP(i,t,F){const br=Math.sin(t*1.8),o={};switch(i){
case 1:{const s=Math.sin(t*.7);o.hips=[0,0,.035*s];o.spine=[0,0,-.03*s];o.leftUpperLeg=[0,0,.04*s];o.rightLowerLeg=[F*.08*Math.max(0,s),0,0];o.hd=.012;break}
case 2:{o.neck=[0,Math.sin(t*.9)*.45,0];o.head=[F*.05,Math.sin(t*.9+.6)*.35,0];o.chest=[0,Math.sin(t*.9)*.15,0];break}
case 3:{const s=sm(Math.sin(t*1.1)*.5+.5);o.chest=[-F*.08*s,0,0];o.head=[-F*.1*s,0,0];o.leftUpperArm=[0,0,F*.35*s];o.rightUpperArm=[0,0,-F*.35*s];break}
case 4:{o.rightUpperArm=[0,.5,F*-.05];o.rightLowerArm=[0,1.3+.05*br,0];o.head=[0,-.12,0];o.spine=[0,.06,0];break}
case 5:{const s=sm(Math.sin(t*.8)*.5+.5);o.leftUpperArm=[0,0,-F*1.6*s];o.rightUpperArm=[0,0,F*1.6*s];o.spine=[-F*.12*s,0,0];o.head=[-F*.2*s,0,0];break}
case 6:{const s=Math.sin(t*1.3);o.chest=[F*.06*s,F*.35*s,0];o.hips=[0,-F*.2*s,0];o.leftUpperLeg=[F*.12,0,0];o.head=[0,F*.3*s,0];break}
}return o}
function addTo(o,d,w){for(const n in d){if(n==="hd"||n==="bob"){o[n]=(o[n]||0)+d[n]*w;continue}const a=o[n]||(o[n]=[0,0,0]);for(let i=0;i<3;i++)a[i]+=d[n][i]*w}}
// S: speed, run, vy, face, turn, air, atk, skl, hit, target{x,y,z}|null, accF, accR
export function pose(h,dt,S){const b=h.b,F=h.F,A=h.A,t=(h.t+=dt),sp=(A.spd=dmp(A.spd??S.speed,S.speed,dt,14)),mw=dmp(A.mw||0,sm(sp/1.0),dt,10);A.mw=mw;const P_=h.prof,run=cl((sp-3.4)/3,0,1),spr=cl((sp-6)/2,0,1),br=Math.sin(t*1.8)+.4*Math.sin(t*2.9+1);
if(dt>0)A.ph+=sp*dt/(.9+.12*sp)*Math.PI*P_.cad*(1+spr*.12);const ph=A.ph,sw=Math.sin(ph),c=Math.cos(ph),amp=dmp(A.amp,sp>.2?cl(sp/3.4,0,1)*.45+run*.25+spr*.12:0,dt,10);A.amp=amp;
A.lf=dmp(A.lf,cl(S.accF*.012+mw*.05+run*.08+spr*.1,-.2,.3),dt,6);A.lead=dmp(A.lead||0,cl(S.turn*.12,-.5,.5)*mw,dt,7);A.lr=dmp(A.lr,cl(S.accR*.01,-.15,.15),dt,6);A.roll=dmp(A.roll,cl(S.turn*.05,-.2,.2)*mw,dt,6);
const Ar=1.22,loc={hips:[0,F*sw*.1*amp*2,A.lr*.5],spine:[F*(A.lf+.012*br),F*sw*.28*amp,A.roll+A.lr],chest:[F*.018*br,F*sw*.2*amp,A.roll*.5],neck:[0,-F*sw*.12*amp+A.lead*.4,0],head:[F*.03*Math.sin(t*1.1)-F*A.lf*.6,A.lead*.6,-A.roll*.4],
leftUpperArm:[F*sw*amp*1.1*P_.armSw,0,-F*(Ar-.025*br)],leftLowerArm:[0,-(.18+.9*run*.5+.5*amp*Math.max(0,-sw)+.5*spr),0],rightUpperArm:[-F*sw*amp*1.1*P_.armSw,0,F*(Ar-.025*br)],rightLowerArm:[0,.18+.45*run+.5*spr+.5*amp*Math.max(0,sw),0],leftHand:[0,0,.08*F],rightHand:[0,0,-.08*F],
leftUpperLeg:[-F*sw*amp*1.5,0,0],leftLowerLeg:[F*(.08*mw+amp*1.8*Math.max(0,c)),0,0],leftFoot:[F*amp*(.5*Math.max(0,sw)-.35*Math.max(0,-sw)),0,0],leftToes:[F*amp*.45*Math.max(0,sw),0,0],rightToes:[F*amp*.45*Math.max(0,-sw),0,0],leftShoulder:[0,0,F*sw*amp*.12],rightShoulder:[0,0,-F*sw*amp*.12],upperChest:[0,-F*sw*.1*amp,0],rightUpperLeg:[F*sw*amp*1.5,0,0],rightLowerLeg:[F*(.08*mw+amp*1.8*Math.max(0,-c)),0,0],rightFoot:[F*amp*(.5*Math.max(0,-sw)-.35*Math.max(0,sw)),0,0],hd:amp*.03,bob:Math.abs(c)*P_.bounce*amp*1.1+br*.004};
const lgp=p=>{const sn=Math.sin(p),cs=Math.cos(p),hip=-F*sn*amp*1.5,knee=F*(.08*mw+amp*1.8*Math.pow(Math.max(0,cs),1.3)+.25*amp*Math.pow(Math.max(0,sn),2)+.35*spr*Math.max(0,cs));return{u:[hip,F*sn*amp*.12*P_.legTwist,F*cs*amp*.03],l:[knee,0,0],f:[-(hip+knee)*.5+F*amp*.55*Math.max(0,-sn)-F*amp*.1*Math.max(0,sn),0,0],t:[F*amp*.7*Math.max(0,-sn),0,0]}},LL=lgp(ph),RL=lgp(ph+Math.PI);
Object.assign(loc,{leftUpperLeg:LL.u,leftLowerLeg:LL.l,leftFoot:LL.f,leftToes:LL.t,rightUpperLeg:RL.u,rightLowerLeg:RL.l,rightFoot:RL.f,rightToes:RL.t});loc.hips[2]+=F*c*.05*amp;
// idle (не повторяется подряд) + кроссфейд
const I=A.idle;I.t+=dt;if(I.t>I.next&&mw<.2){I.prev=I.cur;do I.cur=Math.floor(Math.random()*7);while(I.cur===I.prev);I.t=0;I.next=4+Math.random()*5;I.w=0}I.w=Math.min(1,I.w+dt/.9);
const iw=1-mw;if(iw>.01){addTo(loc,idleP(I.prev,t,F),(1-sm(I.w))*iw);addTo(loc,idleP(I.cur,t,F),sm(I.w)*iw)}
// прыжок / приземление
const W=A.w,k=x=>1-Math.exp(-dt*x);if(S.air)A.wasAir=true;else if(A.wasAir){A.wasAir=false;A.land=1}A.land=Math.max(0,A.land-dt*3.2);W.air=lerp(W.air,S.air?1:0,k(14));
let o=loc;
if(W.air>.01){const up=S.vy>0,air={...loc,leftUpperLeg:[-F*(up?.6:.25),0,0],leftLowerLeg:[F*(up?1:.3),0,0],rightUpperLeg:[F*.15,0,0],rightLowerLeg:[F*(up?1.1:.4),0,0],leftUpperArm:[0,0,-F*(up?.5:.9)],rightUpperArm:[0,0,F*(up?.5:.9)],leftLowerArm:[0,-.3,0],rightLowerArm:[0,.3,0],spine:[F*(up?.05:.12),0,0],hd:0,bob:0};o=mix(o,air,sm(W.air))}
if(A.land>0){const l=sm(A.land);o=mix(o,{...o,leftLowerLeg:[F*.9,0,0],rightLowerLeg:[F*.9,0,0],leftUpperLeg:[-F*.5,0,0],rightUpperLeg:[-F*.5,0,0],spine:[F*.3,0,0],hd:.14,bob:0},l*.9)}
// атака (замах — выпад — возврат) с блендингом входа/выхода
W.atk=lerp(W.atk,S.atk>=0?1:0,k(18));if(W.atk>.01){const a=S.atk>=0?S.atk:1,w=v=>K(a,v,[0,.3,.5,1]);
o=mix(o,{hips:[0,0,0],spine:[F*w([0,-.1,.3,0]),F*w([0,-.55,.7,0]),0],chest:[0,F*w([0,-.3,.4,0]),0],neck:[0,0,0],head:[0,F*w([0,-.2,.3,0]),0],rightUpperArm:[0,w([0,-.7,1.3,0]),F*w([Ar,-.9,.3,Ar])],rightLowerArm:[0,w([.2,1.1,.15,.2]),0],leftUpperArm:[0,w([0,.5,-.5,0]),-F*w([Ar,1,.9,Ar])],leftLowerArm:[0,-.3,0],leftHand:[0,0,0],rightHand:[0,0,0],
rightUpperLeg:[-F*w([0,.1,.6,0]),0,0],leftUpperLeg:[F*w([0,0,.4,0]),0,0],rightLowerLeg:[F*w([0,.2,.5,0]),0,0],leftLowerLeg:[F*w([0,.1,.3,0]),0,0],leftFoot:[0,0,0],rightFoot:[0,0,0],hd:.09*w([0,.3,1,0]),bob:0},sm(W.atk))}
W.skl=lerp(W.skl,S.skl>=0?1:0,k(14));if(W.skl>.01){const a=S.skl>=0?S.skl:1,w=v=>K(a,v,[0,.45,.6,1]);
o=mix(o,{hips:[0,0,0],spine:[F*w([0,-.25,.45,0]),0,0],chest:[0,0,0],neck:[0,0,0],head:[F*w([0,-.25,.2,0]),0,0],leftUpperArm:[0,w([0,-.3,-1.1,0]),F*w([-Ar,1.6,.4,-Ar])],rightUpperArm:[0,w([0,.3,1.1,0]),F*w([Ar,-1.6,-.4,Ar])],leftLowerArm:[0,-w([.2,.3,.1,.2]),0],rightLowerArm:[0,w([.2,.3,.1,.2]),0],leftHand:[0,0,0],rightHand:[0,0,0],
leftUpperLeg:[-F*w([0,.2,.2,0]),0,0],rightUpperLeg:[F*w([0,.1,.1,0]),0,0],leftLowerLeg:[F*w([0,.5,.35,0]),0,0],rightLowerLeg:[F*w([0,.5,.35,0]),0,0],leftFoot:[0,0,0],rightFoot:[0,0,0],hd:.1*w([0,.4,1,0]),bob:0},sm(W.skl))}
// реакция на удар
W.hit=lerp(W.hit,S.hit,k(20));if(W.hit>.01){const h2=W.hit;o=mix(o,{...o,spine:[-F*.5,0,.15],head:[-F*.35,.2,0],leftUpperArm:[0,0,-F*(Ar-.4)],rightUpperArm:[0,0,F*(Ar-.4)],hd:.06,bob:0},h2)}
// взгляд: голова/шея поворачиваются к цели в пределах разумного, глаза — через vrm.lookAt
const tg=S.target;let yl=0;if(tg){const d=wrap(Math.atan2(tg.x-S.px,tg.z-S.pz)-S.face);yl=Math.abs(d)<2.3?cl(d,-1.1,1.1):0;h.look.position.set(tg.x,tg.y,tg.z)}else{h.look.position.set(S.px+Math.sin(S.face)*5,1.4,S.pz+Math.cos(S.face)*5)}
const sc=A.sacc;sc[3]-=dt;if(sc[3]<0){sc[0]=(Math.random()-.5)*1.2;sc[1]=(Math.random()-.5)*.8;sc[3]=.8+Math.random()*2.2}h.look.position.x+=sc[0];h.look.position.y+=sc[1];
A.gaze=dmp(A.gaze,yl,dt,5);const gz=A.gaze*(1-W.atk*.8);addTo(o,{neck:[0,gz*.45,0],head:[0,gz*.35,0],chest:[0,gz*.15,0]},1);
const S2=A.s||(A.s={}),V2=A.v||(A.v={}),om=S.atk>=0||S.skl>=0?30:19,ex=Math.exp(-om*dt);
for(const n of KEYS)if(b[n]){const r=o[n]||[0,0,0],c=S2[n]||(S2[n]=[r[0],r[1],r[2]]),v=V2[n]||(V2[n]=[0,0,0]);
if(dt>0)for(let i=0;i<3;i++){const d=c[i]-r[i],tp=(v[i]+om*d)*dt;c[i]=r[i]+(d+tp)*ex;v[i]=(v[i]-om*tp)*ex}
b[n].rotation.set(c[0],c[1],c[2])}
fingers(h,dt,t,F,mw,W.atk*.9+W.hit*.3,W.skl*.9,run);
// вторичное движение: ветер от бега раздувает юбку и волосы, лёгкий бриз в покое
{const vx=Math.sin(S.face)*sp,vz=Math.cos(S.face)*sp,br2=Math.sin(t*.7)*.04,gx=-vx*.07+br2,gz=-vz*.07+Math.cos(t*.5)*.03,l=Math.hypot(gx,1,gz);
for(const e of h.sj){const gs=e.j.settings;gs.gravityDir.set(gx/l,-1/l,gz/l);gs.gravityPower=e.g*(1+(run+spr)*.5*P_.skirtFlare);gs.dragForce=cl(e.d/P_.hairSway,.05,.95)}}
b.hips.position.y=h.hy-(o.hd||0)+(o.bob||0);
// привязка стоп к поверхности: самая нижняя стопа всегда касается земли
if(!S.air){h.vrm.scene.updateMatrixWorld(true);const v=new THREE.Vector3();b.leftFoot.getWorldPosition(v);const l=v.y;b.rightFoot.getWorldPosition(v);const low=Math.min(l,v.y)-h.vrm.scene.position.y-h.fy;A.hy=dmp(A.hy,cl(low,-.2,.2),dt,16)}else A.hy=dmp(A.hy,0,dt,8);b.hips.position.y-=A.hy*(1-W.air);
// эмоции и моргание
const em=h.vrm.expressionManager;if(em){const E=A.emo;E[1]-=dt;const tgt={happy:0,angry:0,sad:0,relaxed:.15+.1*mw,aa:0};if(E[1]>0)tgt[E[0]]=E[0]==="surprised"?0:1,E[0]==="surprised"&&(tgt.aa=.5,tgt.sad=.4);if(S.combat&&E[1]<=0)tgt.angry=.3;if(S.skl>=0)tgt.happy=Math.max(tgt.happy,.6);
for(const n in tgt){A.em[n]=dmp(A.em[n]||0,tgt[n],dt,6);if(em.getExpression(n))em.setValue(n,A.em[n])}
const B=A.blink;B.t-=dt;if(B.t<=0){B.v=1;B.t=1.8+Math.random()*3.5;B.dbl=Math.random()<.2}if(B.v>0){B.v-=dt/.18;if(B.v<=0&&B.dbl){B.dbl=false;B.v=.7}}em.setValue("blink",Math.sin(cl(B.v,0,1)*Math.PI)>.1?Math.min(1,Math.sin(cl(B.v,0,1)*Math.PI)*1.3):0)}
h.vrm.update(dt)}
