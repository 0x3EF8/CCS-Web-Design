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

    // Scrolled shadow
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

})();
