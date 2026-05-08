// ============ NAV scroll state ============
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ============ Mobile menu ============
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ============ i18n ============
const I18N = window.__I18N__ || {};
const langButtons = document.querySelectorAll('[data-lang]');

function applyLang(lang) {
  const dict = I18N[lang]; if (!dict) return;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  langButtons.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  try { localStorage.setItem('lr14_lang', lang); } catch (e) {}
  document.dispatchEvent(new CustomEvent('lr14:lang-change', { detail: { lang } }));
}

langButtons.forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

let initLang = 'ca';
try {
  const stored = localStorage.getItem('lr14_lang');
  if (stored === 'ca' || stored === 'es') initLang = stored;
} catch (e) {}
applyLang(initLang);

// ============ WhatsApp links — language-aware prefilled message ============
(function () {
  const PHONE = '34644719115';
  const PREFILL = {
    ca: 'Hola, escric des de la web…',
    es: 'Hola, escribo desde la web…'
  };
  function refreshWaLinks() {
    const lang = document.documentElement.lang || 'ca';
    const text = PREFILL[lang] || PREFILL.ca;
    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
    document.querySelectorAll('.wa-band-link, .wa-fab').forEach(a => { a.href = url; });
  }
  refreshWaLinks();
  document.addEventListener('lr14:lang-change', refreshWaLinks);
})();

// ============ Reveal on scroll (IntersectionObserver) ============
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

// home selectors
document.querySelectorAll('.about-text, .about-img-block, .acc-item, .prod, .find-info, .find-map-wrap').forEach(el => {
  el.classList.add('reveal');
  obs.observe(el);
});

// inject home reveal css
const style = document.createElement('style');
style.textContent = `
  .reveal { opacity: 0; transform: translateY(18px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
  .reveal.in-view { opacity: 1; transform: translateY(0); }
  .acc-item.reveal { transition-delay: 0s; }
`;
document.head.appendChild(style);

// generic reveal-on-scroll (used by serveis.html and nosaltres.html)
document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));

// ============ Animated stat counters ============
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function animateCounter(el) {
  const target = parseInt(el.dataset.counter, 10);
  if (Number.isNaN(target)) return;
  const prefix = el.dataset.counterPrefix || '';
  const suffix = el.dataset.counterSuffix || '';
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const value = Math.round(target * easeOutCubic(t));
    el.textContent = prefix + value + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-counter]').forEach(el => counterObs.observe(el));

// ============ Timeline progress (scroll-driven) ============
(function () {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const progress = timeline.querySelector('.timeline-progress');
  const items = Array.from(timeline.querySelectorAll('.tl-item'));
  if (!progress || !items.length) return;

  const isHorizontal = () => window.matchMedia('(min-width: 769px)').matches;

  let ticking = false;
  function update() {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    // Fixed viewport-based span — independent of timeline content height
    // (so CA and ES with different text wrap behave identically)
    const startPx = vh * 0.85;
    const endPx = vh * 0.25;
    const span = startPx - endPx;     // 60% of viewport
    const passed = startPx - rect.top;
    const ratio = Math.max(0, Math.min(1, passed / span));

    if (isHorizontal()) {
      progress.style.width = (ratio * 80) + '%';
      progress.style.height = '1px';
    } else {
      progress.style.height = (ratio * 100) + '%';
      progress.style.width = '1px';
    }

    // Items activate when progress line passes their dot.
    // Dots are at 10/30/50/70/90% of timeline width (line spans 80%).
    // Mapping ratio→dot: i=0 at 0.05, i=1 at 0.25, i=2 at 0.45, i=3 at 0.65, i=4 at 0.85.
    items.forEach((it, i) => {
      const itemRatio = i * 0.20 + 0.05;
      it.classList.toggle('is-active', ratio >= itemRatio);
    });
  }
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

// ============ Services scroll-spy (sidebar highlight) ============
(function () {
  const indexLinks = Array.from(document.querySelectorAll('.service-index a[href^="#"]'));
  if (!indexLinks.length) return;
  const sections = indexLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const spyObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        indexLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-30% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => spyObs.observe(s));

  // smooth scroll with offset for sticky header
  indexLinks.forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      const headerOffset = 90;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ============ Generic page-toc scroll-spy + animated indicator ============
(function () {
  const tocs = Array.from(document.querySelectorAll('.page-toc'));
  if (!tocs.length) return;

  tocs.forEach(toc => {
    const links = Array.from(toc.querySelectorAll('.toc-list a[href^="#"]'));
    if (!links.length) return;
    const sections = links
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length) return;
    const indicator = toc.querySelector('.toc-indicator');

    function updateIndicator() {
      if (!indicator) return;
      const active = toc.querySelector('.toc-list a.active');
      if (!active) {
        indicator.classList.remove('is-on');
        return;
      }
      const tocRect = toc.getBoundingClientRect();
      const linkRect = active.getBoundingClientRect();
      const offsetY = linkRect.top - tocRect.top + linkRect.height / 2 - 4.5; // 4.5 = half of 9px dot
      indicator.style.transform = `translateY(${offsetY}px)`;
      indicator.classList.add('is-on');
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = '#' + e.target.id;
          // Activate matching ToC link in this page-toc
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
          // Also activate matching progress-rail stop (right-edge minimal indicator)
          document.querySelectorAll('.rail-stop').forEach(s => {
            s.classList.toggle('active', s.getAttribute('href') === id);
          });
          updateIndicator();
        }
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

    sections.forEach(s => obs.observe(s));

    // Smooth scroll with header offset
    links.forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    // Recompute indicator position on resize (toc reflow)
    window.addEventListener('resize', updateIndicator, { passive: true });
  });

  // Smooth-scroll handler for progress-rail stops
  document.querySelectorAll('.rail-stop[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
