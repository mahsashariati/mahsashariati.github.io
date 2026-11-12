(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ───────── Sprache (DE / EN) ───────── */
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
    updateClock();
  }
  langBtn.addEventListener('click', () => setLang(root.lang === 'de' ? 'en' : 'de'));

  /* ───────── Farbschema ───────── */
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById('themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('theme', next);
  });

  /* ───────── Menü (mobil) ───────── */
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const closeMenu = () => { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', String(menu.classList.toggle('open')));
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ───────── Aktiver Menüpunkt ───────── */
  const links = [...menu.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach(s => navIO.observe(s));
  }

  /* ───────── Einblenden beim Scrollen ───────── */
  const revealEls = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ───────── Projekte: Akkordeon ───────── */
  document.querySelectorAll('.proj-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.proj');
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ───────── Uhrzeit Wuppertal ───────── */
  const clock = document.getElementById('clock');
  function updateClock() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat(root.lang === 'en' ? 'en-GB' : 'de-DE',
        { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }
  updateClock();
  setInterval(updateClock, 30000);

  /* ───────── Name: Buchstaben reagieren auf den Cursor (Schriftstärke) ───────── */
  const name = document.getElementById('name');
  const BASE = 300, MAX = 620;
  if (name) {
    let n = 0;
    name.querySelectorAll('.ln').forEach(ln => {
      const words = ln.textContent.trim().split(/\s+/);
      ln.textContent = '';
      words.forEach((word, wi) => {
        const w = document.createElement('span');
        w.className = 'w';
        [...word].forEach(c => {
          const ch = document.createElement('span');
          ch.className = 'ch'; ch.textContent = c; ch.style.setProperty('--i', n++);
          w.appendChild(ch);
        });
        ln.appendChild(w);
        if (wi < words.length - 1) ln.appendChild(document.createTextNode(' '));
      });
    });
    requestAnimationFrame(() => requestAnimationFrame(() => name.classList.add('ready')));

    if (!reduceMotion) {
      const chars = [...name.querySelectorAll('.ch')];
      const cur = chars.map(() => BASE);
      let px = -1e5, py = -1e5, raf = 0, hold = false;
      const radius = () => parseFloat(getComputedStyle(name).fontSize) * 1.15;

      const frame = () => {
        const R = radius();
        let moving = false;
        for (let i = 0; i < chars.length; i++) {
          const r = chars[i].getBoundingClientRect();
          const dx = r.left + r.width / 2 - px, dy = (r.top + r.height / 2 - py) * .55;
          const target = BASE + (MAX - BASE) * Math.exp(-(dx * dx + dy * dy) / (2 * R * R * .5));
          cur[i] += (target - cur[i]) * .12;
          if (Math.abs(target - cur[i]) > .6) moving = true;
          chars[i].style.fontWeight = Math.round(cur[i]);
        }
        raf = (moving || hold) ? requestAnimationFrame(frame) : 0;
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

      if (finePointer) {
        window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; kick(); }, { passive: true });
        document.addEventListener('pointerleave', () => { px = py = -1e5; kick(); });
      }

      // Begrüßung: eine Welle läuft einmal durch den Namen
      const wave = () => {
        const b = name.getBoundingClientRect();
        const t0 = performance.now(), dur = 1900;
        hold = true;
        const tick = now => {
          const k = Math.min(1, (now - t0) / dur);
          px = b.left - 120 + (b.width + 240) * (1 - Math.pow(1 - k, 2));
          py = b.top + b.height * .45;
          if (k < 1) requestAnimationFrame(tick);
          else { hold = false; px = py = -1e5; kick(); }
        };
        requestAnimationFrame(tick); kick();
      };
      setTimeout(wave, 900);
    }
  }

  /* gespeicherte Sprache zuletzt anwenden */
  if (store.get('lang') === 'en') setLang('en');
})();
