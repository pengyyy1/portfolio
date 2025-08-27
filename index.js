const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const map   = (v, inMin, inMax, outMin, outMax) => {
  if (inMax === inMin) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamp(t, 0, 1));
};

(function themeInit(){
  const saved = localStorage.getItem('theme') || 'violet';
  document.body.setAttribute('data-theme', saved);
  document.querySelector('#themeLabel').textContent =
    saved[0].toUpperCase() + saved.slice(1);
})();

(function hudMenus(){
  const themeBtn = document.getElementById('themeBtn');
  const themeMenu = document.getElementById('themeMenu');
  const themeLabel = document.getElementById('themeLabel');

  function adjustMenuPosition(btn, menuWrap){
    const list = menuWrap.querySelector('.menu-list');
    const btnRect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    menuWrap.classList.remove('menu--flip');
    list.style.left = '';
    list.style.right = '0px';

    const estimatedWidth = Math.min(Math.max(240, list.offsetWidth || 260), 320);
    const spaceRight = vw - btnRect.right;
    const spaceLeft = btnRect.left;

    if (spaceRight < estimatedWidth && spaceLeft > spaceRight){
      menuWrap.classList.add('menu--flip');
      list.style.right = '';
      list.style.left = '0px';
    }

    requestAnimationFrame(()=>{
      const r = list.getBoundingClientRect();
      const margin = 8;
      let dx = 0;
      if (r.left < margin) dx = margin - r.left;
      else if (r.right > vw - margin) dx = (vw - margin) - r.right;
      if (dx !== 0){
        list.style.transform = `translateY(0) translateX(${dx}px)`;
      }else{
        list.style.transform = 'translateY(0)';
      }
    });
  }

  function openMenu(btn, menu){
    closeMenus();
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-expanded', 'true');
    adjustMenuPosition(btn, menu);
  }
  function toggleMenu(btn, menu){
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) closeMenus(); else openMenu(btn, menu);
  }
  function closeMenus(){
    [themeBtn].forEach(b=>b.setAttribute('aria-expanded','false'));
    [themeMenu].forEach(m=>{
      m.setAttribute('aria-expanded','false');
      const list = m.querySelector('.menu-list');
      if (list) list.style.transform = '';
    });
  }
  themeBtn.addEventListener('click', ()=> toggleMenu(themeBtn, themeMenu));

  const recompute = ()=>{
    if (themeBtn.getAttribute('aria-expanded') === 'true') adjustMenuPosition(themeBtn, themeMenu);
  };
  window.addEventListener('resize', recompute);
  window.addEventListener('scroll', recompute, { passive:true });

  themeMenu.querySelectorAll('[data-theme]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.getAttribute('data-theme');
      document.body.setAttribute('data-theme', t);
      themeLabel.textContent = t[0].toUpperCase() + t.slice(1);
      localStorage.setItem('theme', t);
      closeMenus();
    });
  });

  document.addEventListener('pointerdown', (e)=>{
    if(!e.target.closest('.hud')) closeMenus();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeMenus();
  });
})();

(function cueHide(){
  const cue = document.getElementById('scrollCue');
  let hidden = false;
  function hide(){
    if (hidden) return;
    hidden = true;
    cue.style.transition = 'opacity .35s var(--ease), transform .35s var(--ease)';
    cue.style.opacity = '0';
    cue.style.transform = 'translateY(12px)';
  }
  window.addEventListener('scroll', hide, { passive:true });
  window.addEventListener('pointerdown', hide);
  window.addEventListener('keydown', hide);
})();

(function introStage(){
  const section = document.querySelector('.stage--intro');
  const pin = section.querySelector('.pin');
  const lines = [...section.querySelectorAll('.line')];
  const stack = section.querySelector('.stack');

  function update(){
    const rect = pin.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    const raw = clamp(1 - rect.bottom / vh, 0, 1);
    const p = Math.pow(raw, 0.85);

    const stackY = map(p, 0, 1, 18, -10);
    stack.style.transform = `translate3d(0, ${stackY}px, 0)`;

    lines.forEach((el, i)=>{
      const start = parseFloat(el.dataset.from || '0');
      const end   = parseFloat(el.dataset.to   || '1');
      const t = clamp((p - start) / Math.max(0.0001, (end - start)), 0, 1);
      const ease = 1 - Math.pow(1 - t, 2);

      const y = map(ease, 0, 1, 32, 0);
      const alpha = map(ease, 0, 1, 0, 1);
      const drift = Math.sin((p + i)*1.6) * 1.2;
      el.style.transform = `translate3d(${drift}px, ${y}px, 0)`;
      el.style.opacity = alpha.toFixed(3);
    });
  }

  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
})();

(function warpStage(){
  const stage = document.querySelector('.stage--warp');
  const pin = stage.querySelector('.pin');

  const ringsCanvas = document.getElementById('warpRings');
  const starsCanvas = document.getElementById('warpStars');
  const ctxR = ringsCanvas.getContext('2d', { alpha: true });
  const ctxS = starsCanvas.getContext('2d', { alpha: true });

  const portal = document.getElementById('portal');
  const portfolio = document.getElementById('portfolio');

  let dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize(){
    const rect = pin.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    [ringsCanvas, starsCanvas].forEach(c=>{
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    });
    ctxR.setTransform(dpr,0,0,dpr,0,0);
    ctxS.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  const RINGS = 22;
  const ringBase = Array.from({length:RINGS}, (_,i)=>({
    idx: i,
    hue: lerp(200, 270, i/(RINGS-1))
  }));

  const STAR_COUNT = 160;
  const stars = Array.from({length:STAR_COUNT}, ()=>({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    s: Math.random()*0.8 + 0.2
  }));

  let ticking = false;
  function draw(){
    const rRect = pin.getBoundingClientRect();
    const w = ringsCanvas.width / dpr;
    const h = ringsCanvas.height / dpr;
    const cx = w/2, cy = h/2;

    const p = clamp(1 - rRect.bottom / (rRect.height || 1), 0, 1);

    ctxR.clearRect(0,0,w,h);
    ctxS.clearRect(0,0,w,h);

    const starSpeed = lerp(0.003, 0.028, p);
    const stretch = lerp(1, 3.2, p);
    const zoom = lerp(1, 1.25, p);

    const grad = ctxS.createRadialGradient(cx, cy, Math.min(w,h)*0.1, cx, cy, Math.max(w,h)*0.8);
    grad.addColorStop(0, 'rgba(8,10,16,1)');
    grad.addColorStop(1, 'rgba(4,6,10,1)');
    ctxS.fillStyle = grad;
    ctxS.fillRect(0,0,w,h);

    ctxS.save();
    ctxS.translate(cx, cy);
    ctxS.scale(zoom, zoom);

    for (let i=0;i<STAR_COUNT;i++){
      const st = stars[i];
      st.z -= starSpeed * (0.5 + st.s);
      if (st.z <= 0) st.z += 1;

      const scale = 1 / (st.z*1.6 + 0.2);
      const x = (st.x - 0.5) * w * 0.9 * scale;
      const y = (st.y - 0.5) * h * 0.9 * scale;

      const alpha = clamp(lerp(0.2, 1, 1 - st.z), 0, 1);
      const cA = clamp(alpha * 0.7, 0, 1);
      const size = st.s * 1.4;

      ctxS.save();
      ctxS.translate(x, y);
      ctxS.scale(1, stretch);
      ctxS.globalAlpha = cA * 0.7; ctxS.fillStyle = 'rgba(120,160,255,0.9)';
      ctxS.fillRect(-size-0.8, -size, size*2, size*2);
      ctxS.globalAlpha = cA * 0.6; ctxS.fillStyle = 'rgba(200,120,255,0.9)';
      ctxS.fillRect(-size+0.8, -size, size*2, size*2);
      ctxS.globalAlpha = alpha; ctxS.fillStyle = 'rgba(220,230,255,1)';
      ctxS.fillRect(-size, -size, size*2, size*2);
      ctxS.restore();
    }
    ctxS.restore();

    ctxR.save();
    ctxR.translate(cx, cy);

    const baseRadius = Math.min(w, h) * 0.10;
    const depth = lerp(0, 1.2, p);
    const spin = lerp(0, Math.PI*2.2, p);
    const wobble = Math.sin(p * Math.PI * 2) * 0.06;

    for (let i=0;i<RINGS;i++){
      const rInfo = ringBase[i];
      const t = i / (RINGS - 1);
      const z = (t + depth) % 1;
      const radius = baseRadius * (1 + z * 7);
      const alpha = clamp(lerp(0.06, 0.7, 1 - z), 0.05, 0.75);
      const hue = rInfo.hue + Math.sin(p*6 + i*0.3)*4;

      ctxR.save();
      ctxR.rotate(spin + t * 0.25 + wobble);

      ctxR.globalAlpha = alpha;
      ctxR.lineWidth = 1.2 + (1 - z)*1.2;

      ctxR.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
      ctxR.beginPath();
      ctxR.arc(0, 0, radius, 0, Math.PI*2);
      ctxR.stroke();

      ctxR.globalAlpha = alpha * 0.35;
      ctxR.lineWidth += 2;
      ctxR.strokeStyle = `hsla(${hue+8}, 95%, 75%, ${alpha*0.6})`;
      ctxR.beginPath();
      ctxR.arc(0, 0, radius*0.996, 0, Math.PI*2);
      ctxR.stroke();

      ctxR.restore();
    }

    ctxR.restore();

    const portalVisible = p > 0.65;
    portal.setAttribute('data-visible', portalVisible ? 'true' : 'false');

    const enterT = clamp(map(p, 0.72, 0.98, 0, 1), 0, 1);
    if (enterT > 0){
      portfolio.classList.add('portfolio-enter-active');
    }

    ticking = false;
  }

  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', ()=>{ resize(); draw(); });
})();

(function blackStage(){
  const section = document.querySelector('.stage--black');
  const pin = section.querySelector('.pin');
  const cue = document.getElementById('scrollCue');

  function update(){
    const rect = pin.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const p = clamp(1 - rect.bottom / vh, 0, 1);
    cue.style.opacity = (1 - p*1.4).toFixed(3);
  }
  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
})();

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById("contactBtn").addEventListener("click", () => {
  const socials = document.getElementById("contacts");
  const aList = socials.querySelectorAll("a");
  if (aList.length >= 2) {
    aList[0].scrollIntoView({ behavior: "smooth", block: "center" });
    aList[0].classList.add("highlight");
    aList[1].classList.add("highlight");
    setTimeout(() => {
      aList[0].classList.remove("highlight");
      aList[1].classList.remove("highlight");
    }, 1500);
  }
});