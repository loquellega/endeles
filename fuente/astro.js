/* Endeles · reloj del I Ching: Sol, Tierra y Luna en las 64 puertas (rueda de Human Design), tirada de milenrama.
   Fórmulas de baja precisión (Sol ±0.01°, Luna ±0.3°): una línea mide 0.9375°, una puerta 5.625°. */
(function(){
const R=Math.PI/180,norm=a=>((a%360)+360)%360;
const days=t=>(t-Date.UTC(2000,0,1,12))/864e5;
function sunLon(t){const d=days(t),T=d/36525,M=(357.52911+35999.05029*T)*R,L0=280.46646+36000.76983*T;
  const C=(1.914602-.004817*T)*Math.sin(M)+(.019993-.000101*T)*Math.sin(2*M)+.000289*Math.sin(3*M);
  const om=(125.04-1934.136*T)*R;return norm(L0+C-.00569-.00478*Math.sin(om));}
function moonLon(t){const d=days(t);
  const L=218.3164477+13.17639648*d,D=(297.8501921+12.19074912*d)*R,M=(357.5291092+.98560028*d)*R,Mm=(134.9633964+13.06499295*d)*R,F=(93.272095+13.22935024*d)*R;
  let l=L+6.288774*Math.sin(Mm)+1.274027*Math.sin(2*D-Mm)+.658314*Math.sin(2*D)+.213618*Math.sin(2*Mm)-.185116*Math.sin(M)-.114332*Math.sin(2*F)
   +.058793*Math.sin(2*D-2*Mm)+.057066*Math.sin(2*D-M-Mm)+.053322*Math.sin(2*D+Mm)+.045758*Math.sin(2*D-M)-.040923*Math.sin(M-Mm)-.03472*Math.sin(D)
   -.030383*Math.sin(M+Mm)+.015327*Math.sin(2*D-2*F)-.012528*Math.sin(Mm+2*F)+.01098*Math.sin(Mm-2*F)+.010675*Math.sin(4*D-Mm)+.010034*Math.sin(3*Mm)
   +.008548*Math.sin(4*D-2*Mm)-.007888*Math.sin(2*D+M-Mm)-.006766*Math.sin(2*D+M)-.005163*Math.sin(D-Mm);
  return norm(l);}
// orden de las puertas desde 2°00' de Acuario (302° de longitud eclíptica)
const ORDEN=[41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
const G=5.625,L6=G/6,START=302;
function puerta(lon){const a=norm(lon-START),k=Math.floor(a/G),f=a-k*G,line=Math.floor(f/L6)+1;return{gate:ORDEN[k],line,lon,
  restoLinea:L6*line-f,restoPuerta:G-f,grado:lon%30,signo:Math.floor(lon/30)};}
const SIGNOS=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const fmtLon=lon=>{const g=Math.floor(lon%30),m=Math.floor((lon%1)*60);return g+'°'+String(m).padStart(2,'0')+'′ '+SIGNOS[Math.floor(lon/30)];};
// trigramas por bits (línea inferior = bit 0) y tabla del rey Wen [superior][inferior]
const T={qian:7,dui:3,li:5,zhen:1,xun:6,kan:2,gen:4,kun:0};
const KW={};const tab={
 qian:{qian:1,zhen:25,kan:6,gen:33,kun:12,xun:44,li:13,dui:10},zhen:{qian:34,zhen:51,kan:40,gen:62,kun:16,xun:32,li:55,dui:54},
 kan:{qian:5,zhen:3,kan:29,gen:39,kun:8,xun:48,li:63,dui:60},gen:{qian:26,zhen:27,kan:4,gen:52,kun:23,xun:18,li:22,dui:41},
 kun:{qian:11,zhen:24,kan:7,gen:15,kun:2,xun:46,li:36,dui:19},xun:{qian:9,zhen:42,kan:59,gen:53,kun:20,xun:57,li:37,dui:61},
 li:{qian:14,zhen:21,kan:64,gen:56,kun:35,xun:50,li:30,dui:38},dui:{qian:43,zhen:17,kan:47,gen:31,kun:45,xun:28,li:49,dui:58}};
const BITS=[];for(const u in tab)for(const l in tab[u]){const n=tab[u][l],b=T[l]|(T[u]<<3);KW[b]=n;BITS[n]=b;}
const lineas=n=>{const b=BITS[n];return[0,1,2,3,4,5].map(i=>(b>>i)&1);};          // 1 = yang, de abajo hacia arriba
const desdeLineas=ls=>KW[ls.reduce((a,v,i)=>a|((v?1:0)<<i),0)];
const trigramas=n=>{const b=BITS[n];return{inf:b&7,sup:b>>3};};
// hexagrama nuclear (互卦): líneas 2-3-4 forman el trigrama de abajo y 3-4-5 el de arriba
const nuclear=n=>{const l=lineas(n);return desdeLineas([l[1],l[2],l[3],l[2],l[3],l[4]]);};
// tirada de milenrama: 6, 7, 8, 9 con probabilidades 1, 5, 7, 3 de 16
function azar(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}catch(e){return Math.random();}}
function tirada(){const v=[];for(let i=0;i<6;i++){const r=Math.floor(azar()*16);v.push(r<1?6:r<6?7:r<13?8:9);}
  const prim=desdeLineas(v.map(x=>x===7||x===9)),cambia=v.map(x=>x===6||x===9),rel=cambia.some(Boolean)?desdeLineas(v.map(x=>x===7||x===6)):null;
  return{valores:v,primario:prim,cambia,relacionado:rel};}
// diseño: el momento en que el Sol estaba 88° antes de su posición natal
function diseno(t){const target=norm(sunLon(t)-88);let x=t-88.5*864e5;for(let i=0;i<8;i++){let d=norm(sunLon(x)-target);if(d>180)d-=360;x-=d/0.98565*864e5;}return x;}
// hora local de una zona horaria → instante UTC
function zonaOffset(utc,tz){try{const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(utc));
  const g=k=>+p.find(x=>x.type===k).value;return Date.UTC(g('year'),g('month')-1,g('day'),g('hour')%24,g('minute'),g('second'))-utc;}catch(e){return 0;}}
function localAUTC(y,mo,d,h,mi,tz){const w=Date.UTC(y,mo-1,d,h,mi);let u=w-zonaOffset(w,tz);u=w-zonaOffset(u,tz);return u;}
window.ASTRO={sunLon,moonLon,puerta,fmtLon,lineas,desdeLineas,trigramas,nuclear,tirada,diseno,localAUTC,zonaOffset,ORDEN,BITS};
})();
