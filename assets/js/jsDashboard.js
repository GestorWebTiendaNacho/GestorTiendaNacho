const paths = document.querySelectorAll(".hud-lines path");

paths.forEach(p => {
  let length = p.getTotalLength();

  p.style.strokeDasharray = length;
  p.style.strokeDashoffset = length;

  setInterval(() => {
    p.style.transition = "stroke-dashoffset 2s linear";
    p.style.strokeDashoffset = "0";

    setTimeout(() => {
      p.style.transition = "none";
      p.style.strokeDashoffset = length;
    }, 2000);

  }, 2500);
});