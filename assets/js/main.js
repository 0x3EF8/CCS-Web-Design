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
    setupNavbar();
    setActiveNavLink();
    setupScrollReveal();
    setupBackToTop();
    setupCounters();
    setupProgramTabs();
    setupContactForm();

    // Auto copyright year
    const yr = document.getElementById('copy-year');
    if (yr) yr.textContent = new Date().getFullYear();
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
     7. PROGRAM DETAIL TABS (programs.html only)
  ────────────────────────────────────────────────────────────── */
  function setupProgramTabs() {
    const tabs = document.querySelectorAll('.pd-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateTab(tab); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') focusAdjacentTab(tab, 1);
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   focusAdjacentTab(tab, -1);
      });
    });

    function activateTab(tab) {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('pd-tab--active', active);
        t.setAttribute('aria-selected', String(active));
        t.setAttribute('tabindex',       active ? '0' : '-1');
      });
      document.querySelectorAll('.pd-panel').forEach(panel => {
        const show = panel.id === target;
        panel.classList.toggle('pd-panel--hidden', !show);
        panel.setAttribute('aria-hidden', String(!show));
      });
    }

    function focusAdjacentTab(current, dir) {
      const arr = Array.from(tabs);
      const next = arr[(arr.indexOf(current) + dir + arr.length) % arr.length];
      next.focus();
      activateTab(next);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     8. CONTACT FORM (contact.html only)
  ────────────────────────────────────────────────────────────── */
  function setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const alert  = form.querySelector('.form-alert');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (submit) {
        submit.disabled    = true;
        submit.textContent = 'Sending…';
      }
      setTimeout(() => {
        if (alert)  { alert.removeAttribute('hidden'); }
        form.reset();
        if (submit) { submit.disabled = false; submit.textContent = 'Send Message'; }
        setTimeout(() => { if (alert) alert.setAttribute('hidden', ''); }, 5000);
      }, 1200);
    });
  }

  /* ── Hero Carousel ─────────────────────────────────────────── */
  const heroCarousel = document.getElementById('np-hero-carousel');
  if (heroCarousel) {
    const slides = [
      {
        img: '../assets/images/IT.jpg',
        badge: 'Featured', live: 'Latest',
        headline: 'CCS Opens Enrollment for A.Y. 2025&mdash;2026:<br>Slots Strictly Limited for BSCS &amp; BSIT',
        excerpt: 'The College of Computing Studies is now accepting applications for both programs. Prospective students are urged to apply early &mdash; entrance examinations are scheduled throughout March and April 2026.',
        avatar: 'CO', author: 'CCS Office', datetime: '2026-02-20', date: 'Feb 20, 2026', read: '8 min read'
      },
      {
        img: '../assets/images/CCS/PhilNITS.jpg',
        badge: 'Achievement', live: '',
        headline: 'CCS Students Clinch Top 3 at Regional E-Thesis Competition 2026',
        excerpt: 'Three CCS teams swept the top placements, showcasing research in AI health diagnostics, smart agriculture IoT systems, and blockchain-based academic credentialing.',
        avatar: 'JR', author: 'J. Reyes', datetime: '2026-02-15', date: 'Feb 15, 2026', read: '4 min read'
      },
      {
        img: '../assets/images/CCS/teachers.jpg',
        badge: 'Research', live: '',
        headline: 'Faculty Publishes AI-Driven Curriculum Framework in Peer-Reviewed Journal',
        excerpt: 'A landmark publication from the CCS faculty introduces an AI-driven framework for computing education, now cited in three international journals.',
        avatar: 'FA', author: 'Faculty Affairs', datetime: '2026-02-10', date: 'Feb 10, 2026', read: '6 min read'
      },
      {
        img: '../assets/images/CCS/CCS Gov.jpg',
        badge: 'Program', live: '',
        headline: 'New Specialization Track Launched: Cloud &amp; DevOps Engineering',
        excerpt: 'Starting 2nd semester, students can enroll in the new Cloud &amp; DevOps Engineering track, co-designed with industry partners.',
        avatar: 'CO', author: 'CCS Office', datetime: '2026-02-05', date: 'Feb 05, 2026', read: '3 min read'
      },
      {
        img: '../assets/images/CCS/ccs dean.jpg',
        badge: 'Announcement', live: '',
        headline: 'Peer Tutoring Program Opens Applications for 2nd Semester',
        excerpt: 'The CCS Peer Tutoring Program is now accepting applications for student tutors and tutees for the upcoming 2nd semester.',
        avatar: 'CO', author: 'CCS Office', datetime: '2026-01-28', date: 'Jan 28, 2026', read: '2 min read'
      }
    ];

    let current = 0;
    let timer;

    const heroImg       = document.getElementById('np-hero-img');
    const heroBadge     = document.getElementById('np-hero-badge');
    const heroLive      = document.getElementById('np-hero-live');
    const heroHeadline  = document.getElementById('np-hero-headline');
    const heroExcerpt   = document.getElementById('np-hero-excerpt');
    const heroAvatar    = document.getElementById('np-hero-avatar');
    const heroAuthor    = document.getElementById('np-hero-author-name');
    const heroDate      = document.getElementById('np-hero-date');
    const heroRead      = document.getElementById('np-hero-read-time');
    const slideCur      = document.getElementById('np-slide-cur');
    const slideTotal    = document.getElementById('np-slide-total');
    const thumbItems    = heroCarousel.querySelectorAll('.np-thumb-item');

    if (slideTotal) slideTotal.textContent = slides.length;

    function goTo(idx) {
      current = (idx + slides.length) % slides.length;
      const s = slides[current];

      heroImg.style.opacity = '0';
      setTimeout(() => {
        heroImg.src = s.img;
        heroImg.alt = s.badge + ' — ' + s.date;
        heroImg.style.opacity = '1';
      }, 200);

      heroBadge.textContent = s.badge;
      heroLive.textContent  = s.live;
      heroLive.style.display = s.live ? '' : 'none';
      heroHeadline.innerHTML = s.headline;
      heroExcerpt.innerHTML  = s.excerpt;
      heroAvatar.textContent = s.avatar;
      heroAuthor.textContent = s.author;
      heroDate.setAttribute('datetime', s.datetime);
      heroDate.textContent = s.date;
      heroRead.textContent = s.read;
      if (slideCur) slideCur.textContent = current + 1;

      thumbItems.forEach((t, i) => {
        const slideIdx = parseInt(t.dataset.slide, 10);
        t.classList.toggle('is-active', slideIdx === current);
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

})();
