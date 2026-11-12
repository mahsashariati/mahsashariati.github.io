(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ───────── Language (DE / EN) ───────── */
  const i18nEls = [...document.querySelectorAll('[data-en]')];
  i18nEls.forEach(el => { el.dataset.de = el.innerHTML; });
  const altEls = [...document.querySelectorAll('[data-en-alt]')];
  altEls.forEach(el => { el.dataset.deAlt = el.getAttribute('alt'); });
  const labelEls = [...document.querySelectorAll('[data-en-label]')];
  labelEls.forEach(el => { el.dataset.deLabel = el.getAttribute('aria-label'); });
  const langBtn = document.getElementById('langBtn');
  const titles = {
    de: 'Mahsa Shariati Najafabadi – Software-Entwicklerin',
    en: 'Mahsa Shariati Najafabadi – Software Developer'
  };

  function setLang(lang) {
    i18nEls.forEach(el => { el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.de; });
    altEls.forEach(el => el.setAttribute('alt', lang === 'en' ? el.dataset.enAlt : el.dataset.deAlt));
    labelEls.forEach(el => el.setAttribute('aria-label', lang === 'en' ? el.dataset.enLabel : el.dataset.deLabel));
    root.lang = lang;
    document.title = titles[lang];
    langBtn.querySelectorAll('[data-l]').forEach(s => s.classList.toggle('on', s.dataset.l === lang));
    store.set('lang', lang);
  }
  langBtn.addEventListener('click', () => setLang(root.lang === 'de' ? 'en' : 'de'));
  if (store.get('lang') === 'en') setLang('en');

  /* ───────── Theme ───────── */
  const themeBtn = document.getElementById('themeBtn');
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('theme', next);
    window.dispatchEvent(new Event('themechange'));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => window.dispatchEvent(new Event('themechange')));

  /* ───────── Mobile menu ───────── */
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const closeMenu = () => { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ───────── Active nav link ───────── */
  const links = [...menu.querySelectorAll('a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => {
            if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navIO.observe(s));
  }

  /* ───────── Time bars (mini Gantt on experience) ───────── */
  const START = 2016, SPAN_MONTHS = 11 * 12; // 2016-01 … 2026-12
  const monthIndex = s => { const [y, m] = s.split('-').map(Number); return (y - START) * 12 + (m - 1); };
  document.querySelectorAll('[data-from][data-to]').forEach(el => {
    const b = el.querySelector('.track b');
    if (!b) return;
    const from = monthIndex(el.dataset.from);
    const to = monthIndex(el.dataset.to) + 1;
    b.style.left = (from / SPAN_MONTHS * 100) + '%';
    b.style.width = Math.max(2.2, (to - from) / SPAN_MONTHS * 100) + '%';
  });

  /* ───────── Reveal on scroll ───────── */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ───────── Hero: living supply-chain network ───────── */
  const canvas = document.getElementById('net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    let W = 0, H = 0, nodes = [], edges = [], packets = [], colors = {};
    const mouse = { x: -9999, y: -9999 };
    let running = false, raf = 0;

    const readColors = () => {
      const cs = getComputedStyle(root);
      colors = {
        line: cs.getPropertyValue('--graph-line').trim(),
        node: cs.getPropertyValue('--graph-node').trim(),
        acc: cs.getPropertyValue('--accent').trim(),
        acc2: cs.getPropertyValue('--accent-2').trim()
      };
    };

    const build = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(54, Math.max(16, (W * H) / 20000)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: 1.8 + Math.random() * 2.2, hub: i % 7 === 0
      }));
      const seen = new Set(); edges = [];
      nodes.forEach((a, i) => {
        nodes.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .filter(o => o.j !== i).sort((p, q) => p.d - q.d).slice(0, a.hub ? 3 : 2)
          .forEach(o => { const k = i < o.j ? i + '-' + o.j : o.j + '-' + i; if (!seen.has(k)) { seen.add(k); edges.push([i, o.j]); } });
      });
      packets = edges.filter((_, i) => i % 3 === 0).map(e => ({ e, t: Math.random(), s: .0015 + Math.random() * .003, dir: Math.random() < .5 ? 1 : -1 }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.line;
      ctx.beginPath();
      edges.forEach(([i, j]) => { ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); });
      ctx.stroke();

      packets.forEach(p => {
        const a = nodes[p.e[0]], b = nodes[p.e[1]];
        const t = p.dir === 1 ? p.t : 1 - p.t;
        ctx.fillStyle = colors.acc2;
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2.6, 0, 6.283); ctx.fill();
      });

      nodes.forEach(n => {
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const near = d < 150;
        if (near) {
          ctx.strokeStyle = colors.acc; ctx.globalAlpha = (1 - d / 150) * .8;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = near || n.hub ? colors.acc : colors.node;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (n.hub ? 1.7 : 1) * (near ? 1.5 : 1), 0, 6.283); ctx.fill();
        if (n.hub) { ctx.strokeStyle = colors.acc; ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3.2, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
      });
    };

    const step = () => {
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      packets.forEach(p => { p.t += p.s; if (p.t >= 1) { p.t = 0; p.dir = Math.random() < .5 ? 1 : -1; } });
      draw();
      raf = running ? requestAnimationFrame(step) : 0;
    };
    const start = () => { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(step); } };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

    readColors(); build(); draw();
    let resizeT;
    window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { build(); draw(); }, 150); });
    window.addEventListener('themechange', () => { readColors(); draw(); });
    host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(host);
    } else { start(); }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }
})();
