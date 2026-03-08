/*!
 * CCS Department — Main JS
 * Version: 4.0 — Multi-Page
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     1. DOM-READY GATE
  ────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupPageTransition();
    setupBootScreen();
    setupCustomCursor();
    setupNavbar();
    setActiveNavLink();
    setupScrollReveal();
    setupBackToTop();
    setupCounters();
    setupContactForm();
    setupFaqAccordion();
    setupLoadMore();
    setupCourseComparison();
    setupProgramPicker();

    // Auto copyright year
    const yr = document.getElementById('copy-year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ──────────────────────────────────────────────────────────────
     BOOT SCREEN — Linux-style, first visit per session
  ────────────────────────────────────────────────────────────── */
  function setupBootScreen() {
    if (sessionStorage.getItem('ccs_booted')) return;

    // Resolve asset base path (works from root or pages/ subfolder)
    var base = (function() {
      var s = document.querySelector('link[href*="assets/css/styles.css"]');
      return (s && s.getAttribute('href').indexOf('../') === 0) ? '../assets/images/' : 'assets/images/';
    })();

    var screen = document.createElement('div');
    screen.id = 'boot-screen';
    screen.innerHTML = [
      '<div class="bl-inner">',
      '  <div class="bl-coin-wrap">',
      '    <div class="bl-coin">',
      '      <div class="bl-face bl-face--front">',
      '        <img src="' + base + 'ccs_logo.png" alt="CCS" draggable="false" />',
      '      </div>',
      '      <div class="bl-face bl-face--back">',
      '        <img src="' + base + 'sjc_logo.png" alt="SJC" draggable="false" />',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <p class="bl-label">College of Computer Studies</p>',
      '  <p class="bl-sub">Saint Joseph College &middot; Maasin City</p>',
      '  <div class="bl-bar-wrap"><div class="bl-bar" id="boot-bar"></div></div>',
      '  <p class="bl-status" id="boot-status">Initializing...</p>',
      '</div>'
    ].join('');

    document.body.appendChild(screen);
    document.body.style.overflow = 'hidden';

    var bar      = document.getElementById('boot-bar');
    var statusEl = document.getElementById('boot-status');

    var steps = [
      { pct: 18,  msg: 'Initializing...',          delay: 300  },
      { pct: 38,  msg: 'Loading modules...',        delay: 550  },
      { pct: 62,  msg: 'Connecting to database...', delay: 650  },
      { pct: 80,  msg: 'Preparing interface...',    delay: 500  },
      { pct: 94,  msg: 'Almost ready...',           delay: 420  },
      { pct: 100, msg: 'Welcome!',                  delay: 380  }
    ];

    var totalDelay = 0;
    steps.forEach(function(step) {
      totalDelay += step.delay;
      (function(s, d) {
        setTimeout(function() {
          bar.style.width = s.pct + '%';
          statusEl.textContent = s.msg;
          if (s.pct === 100) {
            setTimeout(function() {
              screen.classList.add('boot-screen--out');
              sessionStorage.setItem('ccs_booted', '1');
              document.documentElement.classList.remove('ccs-first-visit');
              document.body.style.overflow = '';
              setTimeout(function() { screen.remove(); }, 700);
            }, 480);
          }
        }, d);
      })(step, totalDelay);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     PAGE TRANSITION — top progress bar on every page nav
  ────────────────────────────────────────────────────────────── */
  function setupPageTransition() {
    // Inject loader bar
    var loader = document.createElement('div');
    loader.id = 'page-loader';
    document.body.appendChild(loader);

    // Complete the bar on every page arrival
    function completeLoader() {
      loader.classList.remove('is-loading');
      loader.classList.add('is-complete');
      setTimeout(function() { loader.classList.remove('is-complete'); }, 600);
    }

    // Entrance animation on main content
    var mainEl = document.querySelector('main, .page-main, [role="main"]');
    if (mainEl) {
      mainEl.classList.add('page-enter');
      mainEl.addEventListener('animationend', function() {
        mainEl.classList.remove('page-enter');
      }, { once: true });
    }

    // Complete loader when page is visible
    if (document.readyState === 'complete') {
      completeLoader();
    } else {
      window.addEventListener('load', completeLoader, { once: true });
    }
    // Also handle back/forward cache restored pages
    window.addEventListener('pageshow', function(e) {
      if (e.persisted) completeLoader();
    });

    // Intercept internal link clicks → show loader
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;

      var skip = href.startsWith('#') ||
                 href.startsWith('mailto:') ||
                 href.startsWith('tel:') ||
                 href.startsWith('javascript') ||
                 link.target === '_blank' ||
                 (href.startsWith('http') && !href.includes(window.location.hostname));
      if (skip) return;

      loader.classList.remove('is-complete');
      loader.classList.add('is-loading');
    });
  }

  /* ──────────────────────────────────────────────────────────────
     2. NAVBAR — sticky style + hamburger toggle
  ────────────────────────────────────────────────────────────── */
  function setupNavbar() {
    const navbar  = document.querySelector('.navbar');
    const toggle  = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navbar) return;

    // Scroll behaviour — identical on every page: transparent at top, dark glass when scrolled
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hamburger
    if (toggle && navMenu) {
      toggle.addEventListener('click', () => {
        const open = navMenu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      // Close on nav link click (mobile)
      navMenu.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on outside click
      document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) {
          navMenu.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ──────────────────────────────────────────────────────────────
     3. ACTIVE NAV LINK — URL-based (multi-page)
  ────────────────────────────────────────────────────────────── */
  function setActiveNavLink() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-item[href]').forEach(link => {
      const href = link.getAttribute('href');
      const isHome = (page === '' || page === 'index.html') && (href === 'index.html' || href === './');
      const isMatch = href === page || isHome;
      link.classList.toggle('active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'page');
    });
  }

  /* ──────────────────────────────────────────────────────────────
     4. SCROLL REVEAL — IntersectionObserver
  ────────────────────────────────────────────────────────────── */
  function setupScrollReveal() {
    const items = document.querySelectorAll('.js-reveal, .js-reveal-left, .js-reveal-right');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    items.forEach(el => obs.observe(el));
  }

  /* ──────────────────────────────────────────────────────────────
     5. BACK-TO-TOP BUTTON
  ────────────────────────────────────────────────────────────── */
  function setupBackToTop() {
    const btn = document.querySelector('.back-top');
    if (!btn) return;

    const toggle = () => btn.toggleAttribute('hidden', window.scrollY < 360);
    btn.setAttribute('hidden', '');
    window.addEventListener('scroll', toggle, { passive: true });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ──────────────────────────────────────────────────────────────
     6. ANIMATED COUNTERS
  ────────────────────────────────────────────────────────────── */
  function setupCounters() {
    const counters = document.querySelectorAll('.counter-value[data-target]');
    if (!counters.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const animateCounter = el => {
      const target   = parseFloat(el.dataset.target);
      const duration = 1800;
      const start    = performance.now();

      const step = now => {
        const p = Math.min((now - start) / duration, 1);
        const v = target * easeOut(p);
        el.textContent = Number.isInteger(target) ? Math.round(v) : v.toFixed(1);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target % 1 === 0 ? target : target.toFixed(1);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); } }),
      { threshold: 0.4 }
    );
    counters.forEach(el => obs.observe(el));
  }

  /* ──────────────────────────────────────────────────────────────
     7. CONTACT FORM — real-time validation + submission
  ────────────────────────────────────────────────────────────── */
  function setupContactForm() {
    const form = document.querySelector('.ct-form');
    if (!form) return;

    const notice = form.querySelector('#ct-form-notice') || form.querySelector('.ct-form-notice');
    const submit = form.querySelector('button[type="submit"]');

    // Validation rules
    const validators = {
      text:     v => v.trim().length >= 2  ? '' : 'Please enter at least 2 characters.',
      email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
      select:   v => v  ? '' : 'Please select an option.',
      textarea: v => v.trim().length >= 10 ? '' : 'Please enter at least 10 characters.',
    };

    function validateField(input) {
      const field = input.closest('.ct-field');
      const errSpan = field ? field.querySelector('.ct-field-error') : null;
      let msg = '';

      if (input.required) {
        if (input.type === 'checkbox') {
          msg = input.checked ? '' : 'You must agree to continue.';
        } else if (input.tagName === 'SELECT') {
          msg = validators.select(input.value);
        } else if (input.tagName === 'TEXTAREA') {
          msg = validators.textarea(input.value);
        } else if (input.type === 'email') {
          msg = validators.email(input.value);
        } else {
          msg = validators.text(input.value);
        }
      }

      if (errSpan) errSpan.textContent = msg;
      input.classList.toggle('ct-input--error', !!msg);
      return msg === '';
    }

    // Real-time validation on blur
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => {
        if (el.classList.contains('ct-input--error')) validateField(el);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fields = form.querySelectorAll('input, select, textarea');
      let allValid = true;
      fields.forEach(f => { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }

      setTimeout(() => {
        if (notice) {
          notice.removeAttribute('hidden');
          notice.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8l3 3 7-7"/></svg> Message sent! We\'ll respond within 24–48 hours.';
          notice.className = 'ct-form-notice ct-form-notice--success';
        }
        form.reset();
        form.querySelectorAll('.ct-input--error').forEach(el => el.classList.remove('ct-input--error'));
        if (submit) { submit.disabled = false; submit.textContent = 'Send Message'; }
        setTimeout(() => { if (notice) notice.setAttribute('hidden', ''); }, 6000);
      }, 1000);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     9. FAQ ACCORDION (enroll.html & contact.html)
  ────────────────────────────────────────────────────────────── */
  function setupFaqAccordion() {
    const faqItems = document.querySelectorAll('.en-faq-item, .ct-faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const btn = item.querySelector('button.en-faq-q, button.ct-faq-q');
      const panel = item.querySelector('.en-faq-a, .ct-faq-a');
      if (!btn || !panel) return;

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all others (accordion behavior)
        faqItems.forEach(other => {
          const ob = other.querySelector('button.en-faq-q, button.ct-faq-q');
          const op = other.querySelector('.en-faq-a, .ct-faq-a');
          if (ob && op && ob !== btn) {
            ob.setAttribute('aria-expanded', 'false');
            op.setAttribute('hidden', '');
            other.classList.remove('is-open');
          }
        });

        // Toggle current
        btn.setAttribute('aria-expanded', String(!isOpen));
        if (isOpen) {
          panel.setAttribute('hidden', '');
          item.classList.remove('is-open');
        } else {
          panel.removeAttribute('hidden');
          item.classList.add('is-open');
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     10. LOAD MORE (news.html)
  ────────────────────────────────────────────────────────────── */
  function setupLoadMore() {
    const btn = document.querySelector('.np-load-more-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Visual feedback — in a real app this would fetch more articles
      btn.textContent = 'All articles loaded';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
  }

  /* ── Hero Carousel ─────────────────────────────────────────── */
  const heroCarousel = document.getElementById('np-hero-carousel');
  if (heroCarousel) {
    // Slide content lives entirely in news.html as .np-slide elements
    const slides     = heroCarousel.querySelectorAll('.np-slide');
    const heroImg    = document.getElementById('np-hero-img');
    const slideCur   = document.getElementById('np-slide-cur');
    const slideTotal = document.getElementById('np-slide-total');
    const thumbItems = heroCarousel.querySelectorAll('.np-thumb-item');

    let current = 0;
    let timer;

    if (slideTotal) slideTotal.textContent = slides.length;

    function goTo(idx) {
      current = (idx + slides.length) % slides.length;
      const s = slides[current];

      // Swap hero image from data-img attribute on the slide
      if (heroImg && s.dataset.img) {
        heroImg.style.opacity = '0';
        setTimeout(() => {
          heroImg.src = s.dataset.img;
          heroImg.alt = s.dataset.alt || '';
          heroImg.style.opacity = '1';
        }, 200);
      }

      // Show only the active slide
      slides.forEach((el, i) => { el.style.display = i === current ? '' : 'none'; });
      if (slideCur) slideCur.textContent = current + 1;

      thumbItems.forEach(t => {
        t.classList.toggle('is-active', parseInt(t.dataset.slide, 10) === current);
      });
    }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 5000);
    }

    document.getElementById('np-next').addEventListener('click', () => { goTo(current + 1); startAuto(); });
    document.getElementById('np-prev').addEventListener('click', () => { goTo(current - 1); startAuto(); });

    thumbItems.forEach(t => {
      t.addEventListener('click', () => { goTo(parseInt(t.dataset.slide, 10)); startAuto(); });
    });

    heroImg.style.transition = 'opacity .25s ease';
    goTo(0);
    startAuto();
  }

  /* ──────────────────────────────────────────────────────────────
     CUSTOM TECH CURSOR
  ────────────────────────────────────────────────────────────── */
  function setupCustomCursor() {
    // Skip on touch / stylus-only devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // Guard against duplicate init (e.g. back-forward cache restore)
    if (document.getElementById('ccs-cursor-dot')) return;

    // Inject a high-priority <style> block — overrides any browser default
    // that restores the system cursor on mousedown/active states
    const forceStyle = document.createElement('style');
    forceStyle.id = 'ccs-cursor-style';
    forceStyle.textContent =
      '*, *::before, *::after, *:hover, *:active, *:focus, *:focus-visible, ' +
      'html, body, a, button, input, textarea, select, label, ' +
      '[role="button"], [tabindex], [draggable] { cursor: none !important; }' +
      'html, body { -webkit-user-select: none; user-select: none; }' +
      'input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; }';
    document.head.appendChild(forceStyle);

    document.documentElement.style.setProperty('cursor', 'none', 'important');
    document.body.style.setProperty('cursor', 'none', 'important');

    // Prevent text-selection cursor appearing on rapid multi-clicks
    document.addEventListener('selectstart', e => {
      if (!e.target.matches('input, textarea, [contenteditable]')) e.preventDefault();
    });
    // Prevent drag ghost cursor
    document.addEventListener('dragstart', e => e.preventDefault());

    const dot  = document.createElement('div');
    dot.id = 'ccs-cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'ccs-cursor-ring';
    // Start fully hidden until first real mouse move
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    let mx = -200, my = -200;
    let rx = -200, ry = -200;
    let rafId = null;
    let visible = false;

    function show() {
      if (visible) return;
      visible = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
    function hide() {
      visible = false;
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    }

    // Dot follows mouse instantly; reveal on first move
    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
      show();
    });

    // Ring follows with a light lerp — fast enough to feel tight, smooth enough to trail
    function animRing() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      rafId = requestAnimationFrame(animRing);
    }
    animRing();

    // Pause RAF when tab is hidden; resume and re-sync on visibility restore
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        hide();
      } else {
        // Snap ring to last known position so it doesn't drift in from -200
        rx = mx; ry = my;
        if (!rafId) animRing();
      }
    });

    // Hide when pointer truly leaves the viewport (fires on <html>, not body)
    document.documentElement.addEventListener('mouseleave', hide);
    document.documentElement.addEventListener('mouseenter', show);

    // Hover detection on interactive elements
    const HOVER_SEL = 'a, button, [role="button"], label, select, input, textarea, ' +
      '.model-nav-btn, .thumb-item, .btn, [data-tab], .news-card, .program-card, .officer-card, .faq-item';

    document.addEventListener('mouseover', e => {
      if (e.target.closest(HOVER_SEL)) {
        dot.classList.add('is-hovering');
        ring.classList.add('is-hovering');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(HOVER_SEL)) {
        dot.classList.remove('is-hovering');
        ring.classList.remove('is-hovering');
      }
    });

    // Click burst (left-click only)
    document.addEventListener('mousedown', e => {
      // Re-assert cursor:none on every click regardless of button
      if (e.target) e.target.style.setProperty('cursor', 'none', 'important');
      document.documentElement.style.setProperty('cursor', 'none', 'important');
      document.body.style.setProperty('cursor', 'none', 'important');
      if (e.button !== 0) return; // skip ripple/animation for right/middle click
      dot.classList.add('is-clicking');
      ring.classList.add('is-clicking');
      spawnClickRipple(mx, my);
    });
    document.addEventListener('mouseup', () => {
      dot.classList.remove('is-clicking');
      ring.classList.remove('is-clicking');
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Re-show immediately on any pointer activity after being hidden
    window.addEventListener('focus', () => {
      rx = mx; ry = my;
      if (!rafId) animRing();
    });

    // Click ripple burst
    function spawnClickRipple(x, y) {
      const r = document.createElement('div');
      r.className = 'ccs-cursor-ripple';
      r.style.left = x + 'px';
      r.style.top  = y + 'px';
      document.body.appendChild(r);
      r.addEventListener('animationend', () => r.remove(), { once: true });
    }
  }

  /* ──────────────────────────────────────────────────────────────
     COURSE COMPARISON  — semester tab switcher
  ────────────────────────────────────────────────────────────── */
  function setupCourseComparison() {
    const tabs   = document.querySelectorAll('.cmp-tab');
    const panels = document.querySelectorAll('.cmp-panel');
    if (!tabs.length) return;

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        const target = tab.dataset.cmp;

        // Update tab states
        tabs.forEach(function(t) {
          t.classList.remove('cmp-tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('cmp-tab--active');
        tab.setAttribute('aria-selected', 'true');

        // Show/hide panels
        panels.forEach(function(panel) {
          if (panel.id === 'cmp-' + target) {
            panel.classList.add('cmp-panel--active');
            panel.removeAttribute('hidden');
          } else {
            panel.classList.remove('cmp-panel--active');
            panel.setAttribute('hidden', '');
          }
        });
      });
    });
  }

  /* ── Program Picker (BSCS / BSIT switcher) ─────────────────── */
  function setupProgramPicker() {
    var tabs   = document.querySelectorAll('.pg-picker-tab');
    var panels = document.querySelectorAll('.pg-picker-panel');
    if (!tabs.length) return;

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var pg = tab.dataset.pg;

        tabs.forEach(function(t) {
          var active = t === tab;
          t.classList.toggle('pg-picker-tab--active', active);
          t.setAttribute('aria-selected', String(active));
        });

        panels.forEach(function(panel) {
          var show = panel.id === 'pg-panel-' + pg;
          panel.classList.toggle('pg-picker-panel--active', show);
          if (show) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        });
      });

      tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tab.click(); }
      });
    });
  }

})();
