(() => {
      // Ejecución diferida controlada para asegurar el montado en el DOM inyectado
      setTimeout(() => {
        initRadar();
        initHistogram();
      }, 50);

      function initRadar() {
        const canvas = document.getElementById("cyberInjectedRadar");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const size = 96;
        canvas.width = size; canvas.height = size;
        const cx = size/2, cy = size/2, rMax = size/2 - 4;
        let angle = 0;

        function draw() {
          ctx.clearRect(0,0,size,size);
          ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
          ctx.lineWidth = 1;
          for(let r=rMax; r>0; r-=16) {
            ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(cx-rMax, cy); ctx.lineTo(cx+rMax, cy);
          ctx.moveTo(cx, cy-rMax); ctx.lineTo(cx, cy+rMax);
          ctx.stroke();

          ctx.save();
          ctx.translate(cx,cy); ctx.rotate(angle);
          let grad = ctx.createRadialGradient(0,0,0,0,0,rMax);
          grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0, 240, 255, 0.35)");
          ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rMax,0,0.5); ctx.lineTo(0,0);
          ctx.fillStyle = grad; ctx.fill();
          ctx.restore();

          // Target crítico simulado
          ctx.beginPath(); ctx.arc(cx+16, cy-14, 3, 0, Math.PI*2);
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.abs(Math.sin(Date.now()*0.004))})`;
          ctx.fill();

          angle += 0.02;
          requestAnimationFrame(draw);
        }
        draw();
      }

      function initHistogram() {
        const canvas = document.getElementById("cyberInjectedHistogram");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 100;

        const dataPoints = [30, 45, 35, 70, 50, 85, 60, 90, 40, 95];
        const barW = 14, gap = 10, offsetBottom = 14;

        function render() {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
          ctx.beginPath(); ctx.moveTo(0, canvas.height-offsetBottom); ctx.lineTo(canvas.width, canvas.height-offsetBottom);
          ctx.stroke();

          dataPoints.forEach((val, i) => {
            const x = 15 + i * (barW + gap);
            const h = (val / 100) * (canvas.height - offsetBottom - 10);
            const y = canvas.height - offsetBottom - h;

            // Renderizado de la barra con efecto de brillo neón
            ctx.shadowBlur = 6; ctx.shadowColor = "#00f0ff";
            ctx.fillStyle = "#00f0ff";
            ctx.fillRect(x, y, barW, h);
            ctx.shadowBlur = 0;

            // Texto de identificación del eje
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "8px 'Share Tech Mono'";
            ctx.textAlign = "center";
            ctx.fillText(`P${i+1}`, x + barW/2, canvas.height - 3);
          });
        }
        render();
        window.addEventListener("resize", () => {
          if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            render();
          }
        });
      }
    })();