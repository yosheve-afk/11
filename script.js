/* =========================================================
   Nadia Rahma, CPA | interactions (vanilla JS, no dependencies)
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.add('js');

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Marquees: fill the width, then duplicate for a seamless loop ---------- */
  const buildMarquees = () => {
    $$('.marquee-track').forEach((track) => {
      const group = $('.marquee-group', track);
      if (!group) return;

      const originals = Array.from(group.children);
      let guard = 0;
      while (group.scrollWidth < window.innerWidth * 1.6 && guard < 12) {
        originals.forEach((node) => group.appendChild(node.cloneNode(true)));
        guard += 1;
      }

      const copy = group.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
  };
  buildMarquees();

  /* ---------- Nav: scrolled state, progress bar, active link, mobile menu ---------- */
  const nav = $('#nav');
  const bar = $('.progress');
  const toggle = $('.nav-toggle');
  const menuLinks = $$('.menu a');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 24);
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  menuLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 860) setMenu(false);
  });

  if ('IntersectionObserver' in window) {
    const linkFor = new Map(
      menuLinks
        .filter((a) => !a.classList.contains('menu-cta'))
        .map((a) => [a.getAttribute('href').slice(1), a])
    );
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          linkFor.forEach((a) => a.removeAttribute('aria-current'));
          const active = linkFor.get(entry.target.id);
          if (active) active.setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    $$('main section[id]').forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- Scroll reveal (staggered inside [data-stagger] groups) ---------- */
  $$('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--d', `${Math.min(i, 5) * 90}ms`);
    });
  });

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 3D tilt + glare ---------- */
  const MAX_TILT = 10;
  if (!reduceMotion) {
    $$('[data-tilt]').forEach((el) => {
      let frame = 0;

      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        el.classList.add('is-active');
      });

      el.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const rect = el.getBoundingClientRect();
        const px = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        const py = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          el.style.setProperty('--rx', `${((0.5 - py) * MAX_TILT * 2).toFixed(2)}deg`);
          el.style.setProperty('--ry', `${((px - 0.5) * MAX_TILT * 2).toFixed(2)}deg`);
          el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
          el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
          el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
          el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        });
      });

      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        el.classList.remove('is-active');
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach((wrap) => {
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        wrap.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`;
      });
      wrap.addEventListener('pointerleave', () => {
        wrap.style.transition = 'transform .6s cubic-bezier(.34, 1.56, .64, 1)';
        wrap.style.transform = '';
        setTimeout(() => { wrap.style.transition = ''; }, 600);
      });
    });
  }

  /* ---------- Confetti ---------- */
  const COLORS = ['#FF4F9A', '#CBFF3F', '#3B5BFF', '#FFD43B', '#35E0B2', '#FF7A3D'];
  const burst = (x, y, count = 28) => {
    if (reduceMotion) return;
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('i');
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 150;
      piece.className = 'confetti';
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.setProperty('--dx', `${(Math.cos(angle) * dist).toFixed(0)}px`);
      piece.style.setProperty('--dy', `${(Math.sin(angle) * dist + 60).toFixed(0)}px`);
      piece.style.setProperty('--rot', `${(Math.random() * 720 - 360).toFixed(0)}deg`);
      piece.addEventListener('animationend', () => piece.remove());
      document.body.appendChild(piece);
    }
  };

  $$('[data-confetti]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const r = el.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    });
  });

  /* ---------- Contact form ---------- */
  const form = $('#contact-form');
  const status = $('#form-status');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('was-validated');
      status.classList.remove('is-error');

      if (!form.checkValidity()) {
        status.classList.add('is-error');
        status.textContent = 'Almost there. Fill in your name, topic and a valid email.';
        const firstInvalid = $(':invalid', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = form.elements.namedItem('name').value.trim();

      /* TODO: send the data to your backend here, for example:
         fetch('https://formspree.io/f/your-id', {
           method: 'POST',
           headers: { Accept: 'application/json' },
           body: new FormData(form)
         });
      */

      const btn = $('button[type="submit"]', form).getBoundingClientRect();
      burst(btn.left + btn.width / 2, btn.top + btn.height / 2, 36);

      status.textContent = `Sent! Thanks, ${name}. I'll reply within 24 hours.`;
      form.reset();
      form.classList.remove('was-validated');
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    root.classList.add('has-cursor');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let visible = false;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        root.classList.add('cursor-on');
      }
    }, { passive: true });

    const follow = () => {
      const ease = reduceMotion ? 1 : 0.2;
      rx += (x - rx) * ease;
      ry += (y - ry) * ease;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();

    const HOVER_SEL = 'a, button, select, label, [data-cursor], summary';
    const TEXT_SEL = 'input:not([type="submit"]), textarea';

    document.addEventListener('pointerover', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      root.classList.toggle('cursor-text', Boolean(target.closest(TEXT_SEL)));
      root.classList.toggle('cursor-hover', Boolean(target.closest(HOVER_SEL)) && !target.closest(TEXT_SEL));
    });
    document.addEventListener('pointerdown', () => root.classList.add('cursor-down'));
    document.addEventListener('pointerup', () => root.classList.remove('cursor-down'));
    root.addEventListener('mouseleave', () => root.classList.remove('cursor-on'));
    root.addEventListener('mouseenter', () => { if (visible) root.classList.add('cursor-on'); });
  }
})();
