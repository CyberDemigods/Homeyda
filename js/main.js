// Homeyda — main script
(function () {
  'use strict';

  const I18N = window.HOMEYDA_I18N || {};
  const STORAGE_KEY = 'homeyda.lang';
  const SUPPORTED = ['fa', 'en'];

  function detectInitialLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    // language-locked standalone pages (e.g. single-language landings)
    const lock = document.documentElement.getAttribute('data-lang-lock');
    if (lock && SUPPORTED.includes(lock)) return lock;
    // /en/ pages are English by path (so the URL and content always agree)
    if (/^\/en(\/|$)/.test(location.pathname)) return 'en';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    return 'fa';
  }

  // Map current URL to its counterpart in the other language (real separate pages).
  function langUrl(lang) {
    const p = location.pathname;
    const onEn = /^\/en(\/|$)/.test(p);
    if (lang === 'en') return onEn ? null : '/en' + (p === '/' ? '/' : p);
    if (!onEn) return null;
    if (p === '/en' || p === '/en/') return '/';
    if (/^\/en\/blog(\/|$)/.test(p)) return p.replace(/^\/en/, '');
    return '/'; // other /en/ pages (e.g. landing) fall back to FA home
  }

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'fa';
    const dict = I18N[lang] || {};
    const html = document.documentElement;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const key = el.getAttribute('data-i18n-attr');
      if (dict[key] == null) return;
      const value = dict[key];
      if (el.tagName === 'TITLE') {
        el.textContent = value;
      } else if (el.hasAttribute('content')) {
        el.setAttribute('content', value);
      } else if (el.hasAttribute('placeholder')) {
        el.setAttribute('placeholder', value);
      } else if (el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', value);
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll('.lang-btn').forEach((b) => {
      const active = b.dataset.lang === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // don't let a single-language landing clobber the visitor's global preference
    if (!document.documentElement.hasAttribute('data-lang-lock')) {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  function bindLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const target = langUrl(b.dataset.lang);
        if (target) {
          localStorage.setItem(STORAGE_KEY, b.dataset.lang);
          location.href = target; // navigate to the real other-language page
        } else {
          applyLang(b.dataset.lang); // already on the right side; just apply
        }
      });
    });
  }

  function setupHamburger() {
    const topbar = document.querySelector('.topbar__inner');
    const nav = document.querySelector('.nav');
    if (!topbar || !nav) return;

    const btn = document.createElement('button');
    btn.className = 'hamburger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'primaryNav');
    btn.innerHTML = '<span></span><span></span><span></span>';

    if (!nav.id) nav.id = 'primaryNav';

    // Place hamburger at the end of topbar (after lang-switch) so it sits on the far edge
    topbar.appendChild(btn);

    function close() {
      nav.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('has-menu-open');
    }

    function open() {
      nav.classList.add('is-open');
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('has-menu-open');
    }

    btn.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) close();
      else open();
    });

    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
    });

    // Auto-close if viewport grows past mobile breakpoint
    matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
      if (e.matches) close();
    });
  }

  function setupHeroSlider() {
    const slides = Array.from(document.querySelectorAll('.hero__slide'));
    const dots = Array.from(document.querySelectorAll('.hero__dot'));
    if (slides.length < 2) return;

    let index = 0;
    let timer = null;
    const INTERVAL = 6500;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('is-active', j === index));
      dots.forEach((d, j) => d.classList.toggle('is-active', j === index));
    }

    function next() { show(index + 1); }

    function start() {
      stop();
      timer = setInterval(next, INTERVAL);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach((d) => {
      d.addEventListener('click', () => {
        const i = parseInt(d.dataset.slide, 10);
        if (!isNaN(i)) { show(i); start(); }
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    start();
  }

  function setupGalleryFilters() {
    const filters = document.querySelectorAll('.chip[data-filter]');
    const tiles = document.querySelectorAll('.gallery__tile[data-tags]');
    const grid = document.getElementById('galleryGrid');
    const showMoreBtn = document.getElementById('galleryShowMore');
    if (!filters.length || !tiles.length) return;

    const INITIAL_LIMIT = 8;

    // Mark tiles beyond the initial limit as "extra" — hidden until expanded
    tiles.forEach((tile, i) => {
      if (i >= INITIAL_LIMIT) tile.classList.add('is-extra');
    });

    function updateShowMore() {
      if (!showMoreBtn) return;
      const activeFilter = Array.from(filters).find((f) => f.classList.contains('is-active'))?.dataset.filter || 'all';
      const expanded = grid && grid.classList.contains('is-expanded');
      // Hide button when expanded, or when filter is active (filter shows all matching anyway via .is-hidden)
      const shouldShow = activeFilter === 'all' && !expanded && tiles.length > INITIAL_LIMIT;
      showMoreBtn.style.display = shouldShow ? '' : 'none';
    }

    function apply(filter) {
      tiles.forEach((tile) => {
        const tags = (tile.dataset.tags || '').split(',').map((t) => t.trim());
        const show = filter === 'all' || tags.includes(filter);
        tile.classList.toggle('is-hidden', !show);
      });
      filters.forEach((f) => f.classList.toggle('is-active', f.dataset.filter === filter));
      // When filtering by tag, ignore the initial-limit (show all matches)
      if (grid) {
        if (filter !== 'all') grid.classList.add('is-expanded');
        else grid.classList.remove('is-expanded');
      }
      updateShowMore();
    }

    filters.forEach((f) => {
      f.addEventListener('click', () => apply(f.dataset.filter));
    });

    if (showMoreBtn && grid) {
      showMoreBtn.addEventListener('click', () => {
        grid.classList.add('is-expanded');
        updateShowMore();
        // Smooth-scroll to where new tiles appeared
        const firstExtra = grid.querySelector('.gallery__tile.is-extra');
        if (firstExtra) firstExtra.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    const hashParts = location.hash.split('?');
    if (hashParts[1]) {
      const tagParam = new URLSearchParams(hashParts[1]).get('tag');
      if (tagParam) apply(tagParam);
    }

    updateShowMore();
  }

  function setupLightbox() {
    const tiles = Array.from(document.querySelectorAll('.gallery__tile[data-src]'));
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');
    const btnClose = document.getElementById('lightboxClose');
    const btnPrev = document.getElementById('lightboxPrev');
    const btnNext = document.getElementById('lightboxNext');
    if (!tiles.length || !lb || !img) return;

    let index = 0;

    function visibleTiles() {
      return tiles.filter((t) => !t.classList.contains('is-hidden'));
    }

    function show(i) {
      const list = visibleTiles();
      if (!list.length) return;
      index = (i + list.length) % list.length;
      const tile = list[index];
      const lang = document.documentElement.getAttribute('lang') || 'fa';
      const cap = lang === 'en'
        ? (tile.dataset.captionEn || tile.dataset.captionFa || '')
        : (tile.dataset.captionFa || tile.dataset.captionEn || '');
      img.src = tile.dataset.src;
      img.alt = (tile.querySelector('img') || {}).alt || '';
      caption.textContent = cap;
      counter.textContent = `${index + 1} / ${list.length}`;
    }

    function open(tile) {
      const list = visibleTiles();
      const i = list.indexOf(tile);
      if (i < 0) return;
      show(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-lightbox-open');
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-lightbox-open');
    }

    tiles.forEach((tile) => {
      tile.addEventListener('click', () => open(tile));
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(index - 1));
    btnNext.addEventListener('click', () => show(index + 1));

    // Click backdrop to close (not on inner controls/figure)
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close();
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });

    // Touch swipe
    let touchStartX = null;
    lb.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) show(index + 1);
        else show(index - 1);
      }
      touchStartX = null;
    });
  }

  function setupReveal() {
    const targets = document.querySelectorAll(
      '.hero__inner, .section-head, .card, .gallery__tile, .about__text, .pillar, .contact__card, .contact__info-block, .gallery__filters, .abroad__step, .crypto, .abroad__sanctions, .abroad__help'
    );
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      if (i % 3 === 1) el.classList.add('reveal--delay-1');
      if (i % 3 === 2) el.classList.add('reveal--delay-2');
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => io.observe(el));
  }

  function setupYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function setupAbroad() {
    const cards = document.querySelectorAll('.crypto[data-wallet]');
    if (!cards.length) return;

    const hasQR = typeof window.qrcode === 'function';

    cards.forEach((card) => {
      const wallet = (card.dataset.wallet || '').trim();
      const qrBox = card.querySelector('.crypto__qr');
      const addrEl = card.querySelector('.crypto__addr');
      const copyBtn = card.querySelector('.crypto__copy');

      if (!wallet) return; // leave placeholder UI as-is

      // Render QR
      if (qrBox && hasQR) {
        try {
          const qr = window.qrcode(0, 'M');
          qr.addData(wallet);
          qr.make();
          qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
          const svg = qrBox.querySelector('svg');
          if (svg) {
            svg.setAttribute('shape-rendering', 'crispEdges');
            svg.removeAttribute('width');
            svg.removeAttribute('height');
          }
        } catch (e) {
          // leave placeholder
        }
      }

      // Fill address
      if (addrEl) {
        addrEl.textContent = wallet;
        addrEl.removeAttribute('data-i18n');
      }

      // Enable copy
      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.addEventListener('click', async () => {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(wallet);
            } else {
              const ta = document.createElement('textarea');
              ta.value = wallet;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
            const labelEl = copyBtn.querySelector('span');
            const lang = document.documentElement.getAttribute('lang') || 'fa';
            const dict = (window.HOMEYDA_I18N || {})[lang] || {};
            const original = dict.crypto_copy_label || 'Copy';
            const done = dict.crypto_copy_done || 'Copied!';
            if (labelEl) labelEl.textContent = done;
            copyBtn.classList.add('is-done');
            setTimeout(() => {
              if (labelEl) labelEl.textContent = original;
              copyBtn.classList.remove('is-done');
            }, 1800);
          } catch (e) {
            // silent
          }
        });
      }
    });
  }

  function setupSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        const idPart = href.slice(1).split('?')[0];
        if (!idPart) return;
        const target = document.getElementById(idPart);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
        history.replaceState(null, '', href);

        // Apply ?tag= filter if present (e.g. #gallery?tag=bento)
        const queryPart = href.split('?')[1];
        if (queryPart) {
          const tag = new URLSearchParams(queryPart).get('tag');
          if (tag) {
            const chip = document.querySelector(`.chip[data-filter="${tag}"]`);
            if (chip) chip.click();
          }
        }
      });
    });
  }

  function setupScrollToTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;
    const THRESHOLD = 500;
    let ticking = false;
    const update = () => {
      btn.classList.toggle('is-visible', window.scrollY > THRESHOLD);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    update();
  }

  function init() {
    applyLang(detectInitialLang());
    bindLangSwitcher();
    setupHamburger();
    setupYear();
    setupHeroSlider();
    setupGalleryFilters();
    setupLightbox();
    setupAbroad();
    setupReveal();
    setupSmoothAnchors();
    setupScrollToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
