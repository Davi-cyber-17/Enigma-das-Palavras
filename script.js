const LEVELS=[
 {l:"AMOR",c:"#a855f7",w:["AMOR","ROMA","MAR","ORA"],x:["AMO","ARO"]},
 {l:"TERRA",c:"#22c55e",w:["TERRA","ARTE","RETA","ERRA"],x:["ERA","ARRE"]},
 {l:"PLANETA",c:"#fb923c",w:["PLANETA","PLANTA","PLENA","PANELA","PALETA"],x:["LATA","PATA","PENA","TELA","ANEL","PELA","NATA","LENTA","ANTA"]},
 {l:"CAMINHO",c:"#22d3ee",w:["CAMINHO","MINHOCA","NICHO","MACHO"],x:["MINA","COMA","CIMA","MICO","CHAMO"]},
 {l:"ESTRELA",c:"#f472b6",w:["ESTRELA","LESTE","ESTAR","RESTA"],x:["TELAS","REAL","ERAS","ARTES","RETAS","SALTE","TRELA","SELA"]},
 {l:"FLORESTA",c:"#facc15",w:["FLORESTA","FLORES","FRESTA","ASTRO","LOTES"],x:["FATOR","FLORA","FORTE","FORTES","SOLTE","ROSA","TOSA"]},
 {l:"BORBOLETA",c:"#ef4444",w:["BORBOLETA","BOLERO","BOTAR","LOBO","BOBO"],x:["BOLO","OBRA","BOLETA","BELO","BOTA","ABRO","LOBA","ROLO","ORBE","BORLA","BROTO"]},
 {l:"CHOCOLATE",c:"#b45309",w:["CHOCOLATE","COLCHA","TOCHA","CHOCA","COLETA","CACHO"],x:["COCO","COCA","LOTE","TACO","CHATO","LOCA","COTA"]},
 {l:"COMPUTADOR",c:"#38bdf8",w:["COMPUTADOR","COMUTAR","DOUTOR","COMPOR","PRATO","TAMPO"],x:["PORTA","PODAR","MOTOR","CAMPO","TROCA","COPA","MUDAR","PUDOR","MURO","CORPO"]},
 {l:"PROFESSORA",c:"#34d399",w:["PROFESSORA","PROFESSOR","PRESSA","FOSSA","SOPRO"],x:["PROSA","ROSAS","PORRA","FORRO","ERROS","PARES","PASSO","ROSA","SORO"]}
];
const $=id=>document.getElementById(id);
let save={level:0,gems:250,bonus:0};
try{const s=JSON.parse(localStorage.getItem("wow")||"null");if(s)save=Object.assign(save,s)}catch(e){}
function persist(){try{localStorage.setItem("wow",JSON.stringify(save))}catch(e){}}

let R=1,C=1,lv,placed,cells,found,extras,letters,path=[],dragging=false,pt=null;

function layout(words){
  const sorted=[...words].sort((a,b)=>b.length-a.length);
  for(let t=0;t<300;t++){
    const order=t?[sorted[0],...sorted.slice(1).sort(()=>Math.random()-.5)]:sorted;
    const g=new Map(),res=[];
    const get=(r,c)=>g.get(r+","+c);
    const fits=(w,r,c,d)=>{
      const dr=d?1:0,dc=d?0:1;let inter=0;
      if(get(r-dr,c-dc)||get(r+dr*w.length,c+dc*w.length))return -1;
      for(let i=0;i<w.length;i++){
        const rr=r+dr*i,cc=c+dc*i,ex=get(rr,cc);
        if(ex){if(ex!==w[i])return -1;inter++}
        else if(get(rr+dc,cc+dr)||get(rr-dc,cc-dr))return -1;
      }
      return inter;
    };
    let ok=true;
    order.forEach((w,i)=>{
      if(!ok)return;
      if(i===0){place(w,0,0,0);return}
      let best=null;
      for(const p of res)for(let a=0;a<p.w.length;a++)for(let b=0;b<w.length;b++){
        if(p.w[a]!==w[b])continue;
        const d=1-p.d;
        const r=p.r+(p.d?a:0)-(d?b:0),c=p.c+(p.d?0:a)-(d?0:b);
        if(fits(w,r,c,d)===1&&(!best||Math.random()<.3))best={r,c,d};
      }
      if(best)place(w,best.r,best.c,best.d);else ok=false;
    });
    function place(w,r,c,d){
      for(let i=0;i<w.length;i++)g.set((r+(d?i:0))+","+(c+(d?0:i)),w[i]);
      res.push({w,r,c,d});
    }
    if(ok)return res;
  }
  return null;
}

function start(){
  lv=LEVELS[save.level%LEVELS.length];
  document.documentElement.style.setProperty("--a",lv.c);
  $("line").setAttribute("stroke",lv.c);
  placed=layout(lv.w);
  const placedSet=new Set(placed.map(p=>p.w));
  extras=new Set([...lv.x,...lv.w.filter(w=>!placedSet.has(w))]);
  found=new Set();cells=new Map();
  let minR=0,minC=0,maxR=0,maxC=0;
  placed.forEach(p=>{for(let i=0;i<p.w.length;i++){
    const r=p.r+(p.d?i:0),c=p.c+(p.d?0:i);
    minR=Math.min(minR,r);minC=Math.min(minC,c);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c);
    const k=r+","+c;if(!cells.has(k))cells.set(k,{ch:p.w[i],r,c,state:0});
  }});
  R=maxR-minR+1;C=maxC-minC+1;
  const grid=$("grid");grid.innerHTML="";
  for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
    const d=document.createElement("div"),cell=cells.get(r+","+c);
    d.className="c"+(cell?"":" e");
    if(cell)cell.el=d;
    grid.appendChild(d);
  }
  fit();
  // wheel
  letters=lv.l.split("").sort(()=>Math.random()-.5);
  buildWheel();
  $("lvl").textContent=save.level+1;$("gems").textContent=save.gems;$("bonus").textContent=save.bonus;
  msg("");
}

function fit(){
  const wrap=$("gridWrap"),gap=5;
  const w=wrap.clientWidth,h=wrap.clientHeight;
  const s=Math.max(20,Math.min(64,Math.floor((w-(C-1)*gap)/C),Math.floor((h-(R-1)*gap)/R)));
  const grid=$("grid");
  grid.style.gridTemplateColumns=`repeat(${C},${s}px)`;
  grid.style.setProperty("--s",s+"px");
}
window.addEventListener("resize",fit);
window.addEventListener("orientationchange",()=>setTimeout(fit,200));
if(window.ResizeObserver)new ResizeObserver(fit).observe($("gridWrap"));

function buildWheel(){
  const w=$("wheel");w.querySelectorAll(".L").forEach(e=>e.remove());
  const n=letters.length,R=n<=3?70:n<=4?88:104,cx=145,cy=145;
  letters.forEach((ch,i)=>{
    const a=-Math.PI/2+i*2*Math.PI/n;
    const el=document.createElement("div");el.className="L";el.textContent=ch;
    const x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);
    el.style.left=((x-29)/290*100)+"%";el.style.top=((y-29)/290*100)+"%";
    el._x=x;el._y=y;w.appendChild(el);
  });
}

function msg(t){$("msg").textContent=t}
function bubble(txt,cls){const b=$("bubble");b.className=(txt?"show ":"")+(cls||"");b.textContent=txt}

function reveal(cell,hint){
  if(cell.state)return;
  cell.state=hint?2:1;cell.el.textContent=cell.ch;cell.el.classList.add(hint?"hint":"on");
}
function checkAuto(){
  placed.forEach(p=>{
    if(found.has(p.w))return;
    let all=true;
    for(let i=0;i<p.w.length;i++)if(!cells.get((p.r+(p.d?i:0))+","+(p.c+(p.d?0:i))).state)all=false;
    if(all)found.add(p.w);
  });
  if(found.size===placed.length)setTimeout(win,700);
}

function submit(){
  const w=path.map(i=>letters[i]).join("");
  const sel=document.querySelectorAll(".L");sel.forEach(e=>e.classList.remove("sel"));
  path=[];$("line").setAttribute("points","");
  if(w.length<2){bubble("");return}
  const p=placed.find(p=>p.w===w);
  if(p){
    if(found.has(w)){bubble(w,"bad");msg("Já encontrada!");setTimeout(()=>bubble(""),700);return}
    found.add(w);
    for(let i=0;i<w.length;i++)reveal(cells.get((p.r+(p.d?i:0))+","+(p.c+(p.d?0:i))),false);
    bubble(w,"ok");setTimeout(()=>bubble(""),500);msg("");
    checkAuto();
  }else if(extras.has(w)&&!found.has(w)){
    found.add(w);save.bonus++;save.gems+=5;persist();
    $("bonus").textContent=save.bonus;$("gems").textContent=save.gems;
    bubble(w,"ok");msg("Palavra bônus! +5💎");setTimeout(()=>bubble(""),700);
  }else if(found.has(w)){
    bubble(w,"bad");msg("Já encontrada!");setTimeout(()=>bubble(""),700);
  }else{
    bubble(w,"bad");msg("");setTimeout(()=>bubble(""),600);
  }
}

function win(){
  save.gems+=20;persist();$("gems").textContent=save.gems;
  $("ovt").textContent="+20💎 pela fase concluída";
  $("ov").classList.add("show");
}
$("next").onclick=()=>{$("ov").classList.remove("show");save.level++;persist();start()};

// wheel input
function localPos(e){const r=$("wheel").getBoundingClientRect(),k=290/r.width;return{x:(e.clientX-r.left)*k,y:(e.clientY-r.top)*k}}
function hit(p){const els=document.querySelectorAll(".L");for(let i=0;i<els.length;i++){if(Math.hypot(els[i]._x-p.x,els[i]._y-p.y)<30)return i}return -1}
function draw(){
  const els=document.querySelectorAll(".L");
  let pts=path.map(i=>els[i]._x+","+els[i]._y);
  if(dragging&&pt&&path.length)pts.push(pt.x+","+pt.y);
  $("line").setAttribute("points",pts.join(" "));
}
function show(){bubble(path.map(i=>letters[i]).join(""))}
const wheel=$("wheel");
wheel.addEventListener("pointerdown",e=>{
  if(e.target.id==="shuf")return;
  const p=localPos(e),i=hit(p);if(i<0)return;
  dragging=true;wheel.setPointerCapture(e.pointerId);
  path=[i];pt=p;document.querySelectorAll(".L")[i].classList.add("sel");show();draw();
});
wheel.addEventListener("pointermove",e=>{
  if(!dragging)return;
  pt=localPos(e);const i=hit(pt),els=document.querySelectorAll(".L");
  if(i>=0){
    if(path.length>1&&i===path[path.length-2]){els[path.pop()].classList.remove("sel");show()}
    else if(!path.includes(i)){path.push(i);els[i].classList.add("sel");show()}
  }
  draw();
});
function end(){if(!dragging)return;dragging=false;submit()}
wheel.addEventListener("pointerup",end);
wheel.addEventListener("pointercancel",end);

$("shuf").onclick=()=>{letters.sort(()=>Math.random()-.5);buildWheel()};

function useGems(cost){
  if(save.gems<cost){msg("Diamantes insuficientes");return false}
  save.gems-=cost;persist();$("gems").textContent=save.gems;return true;
}
function hidden(){return [...cells.values()].filter(c=>!c.state)}
$("hintBtn").onclick=()=>{
  const h=hidden();if(!h.length)return;
  // reveal a letter of an unfound word
  const p=placed.filter(p=>!found.has(p.w));
  const list=[];
  p.forEach(q=>{for(let i=0;i<q.w.length;i++){const c=cells.get((q.r+(q.d?i:0))+","+(q.c+(q.d?0:i)));if(!c.state)list.push(c)}});
  if(!list.length||!useGems(50))return;
  reveal(list[Math.floor(Math.random()*list.length)],true);checkAuto();
};
$("revBtn").onclick=()=>{
  const p=placed.find(p=>!found.has(p.w));if(!p)return;
  if(!useGems(30))return;
  for(let i=0;i<p.w.length;i++){const c=cells.get((p.r+(p.d?i:0))+","+(p.c+(p.d?0:i)));if(!c.state){reveal(c,true);break}}
  checkAuto();
};
start();
