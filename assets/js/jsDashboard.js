// líneas animadas
document.querySelectorAll(".line").forEach(p=>{
  let l=p.getTotalLength();
  p.style.strokeDasharray=l;
  p.style.strokeDashoffset=l;

  setInterval(()=>{
    p.style.transition="2s linear";
    p.style.strokeDashoffset="0";
    setTimeout(()=>{
      p.style.transition="none";
      p.style.strokeDashoffset=l;
    },2000);
  },3000);
});

// radar fake
const r=document.getElementById("radar").getContext("2d");
r.fillStyle="#00f0ff";
r.beginPath();
r.arc(100,100,80,0,Math.PI*2);
r.stroke();

// barras fake
const b=document.getElementById("bars").getContext("2d");
for(let i=0;i<5;i++){
  b.fillStyle="#a855f7";
  b.fillRect(i*40,150-Math.random()*100,20,100);
}