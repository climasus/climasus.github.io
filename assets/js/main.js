/**
 * ClimaSUS Portal — Main entry point
 * Orchestrates theme, i18n, dynamic data loading, and interactions.
 */

import { initTheme, toggleTheme } from './theme.js';
import { initI18n, setLang } from './i18n.js';

const DS_BASE = 'https://climasus.github.io/design-system/data';

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme (no flash — applied synchronously from localStorage)
  initTheme();

  // 2. i18n — async, applied after DOM is ready
  await initI18n();

  // 3. Load dynamic data (team + repos) from design-system
  await Promise.allSettled([loadTeam(), loadRepos()]);

  // 4. Bind interactions
  bindThemeToggle();
  bindLangSwitcher();
  bindNavScroll();
  bindParticles();
  countUpStats();
});

// ── Theme toggle ────────────────────────────────────────────────────────────
function bindThemeToggle() {
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

// ── Language switcher ───────────────────────────────────────────────────────
function bindLangSwitcher() {
  document.querySelectorAll('[data-lang-option]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.langOption));
  });
}

// ── Sticky glass navbar on scroll ──────────────────────────────────────────
function bindNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const observer = new IntersectionObserver(
    ([entry]) => navbar.classList.toggle('glass-nav', !entry.isIntersecting),
    { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
  );
  const sentinel = document.getElementById('nav-sentinel');
  if (sentinel) observer.observe(sentinel);
}

// ── Animated stats counter ─────────────────────────────────────────────────
function countUpStats() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.countTo, 10);
      const duration = 1200;
      const step = Math.ceil(target / (duration / 16));
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString('pt-BR');
        if (current >= target) clearInterval(timer);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => observer.observe(el));
}

// ── Load team from design-system ───────────────────────────────────────────
async function loadTeam() {
  const container = document.getElementById('team-grid');
  if (!container) return;

  try {
    const members = await fetch(`${DS_BASE}/team/members.json`).then(r => r.json());

    container.innerHTML = members
      .filter(m => m.active)
      .sort((a, b) => a.order - b.order)
      .map(m => `
        <div class="team-card">
          <div class="team-avatar">
            ${m.photo
              ? `<img src="${m.photo}" alt="${m.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
              : ''
            }
            <div class="team-avatar-fallback" style="${m.photo ? 'display:none' : ''}">
              ${m.name.split(' ').map(n => n[0]).slice(0,2).join('')}
            </div>
          </div>
          <div class="team-info">
            <h3 class="team-name">${m.name}</h3>
            <p class="team-role">${m.role_pt}</p>
            <p class="team-institution">${m.institution}</p>
            <div class="team-links">
              ${m.github   ? `<a href="${m.github}"   target="_blank" rel="noopener" aria-label="GitHub">GH</a>`   : ''}
              ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">LI</a>` : ''}
              ${m.email    ? `<a href="mailto:${m.email}" aria-label="Email">✉</a>` : ''}
            </div>
          </div>
        </div>
      `).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load team data:', e.message);
    container.innerHTML = '<p class="text-muted">Dados da equipe temporariamente indisponíveis.</p>';
  }
}

// ── Load repositories from design-system ───────────────────────────────────
async function loadRepos() {
  const container = document.getElementById('packages-grid');
  if (!container) return;

  try {
    const repos = await fetch(`${DS_BASE}/project/repositories.json`).then(r => r.json());
    const lang = localStorage.getItem('climasus-lang') || 'pt';

    container.innerHTML = repos
      .filter(r => r.type === 'library' || r.type === 'pipeline')
      .sort((a, b) => a.order - b.order)
      .map(r => {
        const desc = r[`description_${lang}`] || r.description;
        return `
          <div class="package-card">
            <div class="package-header">
              <span class="package-icon">${r.icon || '📦'}</span>
              <div>
                <h3 class="package-name">${r.name}</h3>
                <span class="package-lang badge badge-${r.badge_color || 'green'}">${r.language}</span>
              </div>
            </div>
            <p class="package-desc">${desc}</p>
            <div class="package-links">
              ${r.docs_url ? `<a href="${r.docs_url}" class="btn btn-sm btn-primary" target="_blank">Docs</a>` : ''}
              <a href="${r.url}" class="btn btn-sm btn-outline" target="_blank">GitHub</a>
            </div>
          </div>
        `;
      }).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load repos data:', e.message);
  }
}

// ── Minimal particle background ────────────────────────────────────────────
function bindParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 40;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function Particle() {
    this.x  = Math.random() * canvas.width;
    this.y  = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r  = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.4 + 0.1;
    this.color = Math.random() > 0.5 ? '0,255,136' : '168,85,247';
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
}
