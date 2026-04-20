/**
 * ClimaSUS Portal — Main entry point
 * Orchestrates theme, i18n, dynamic data loading, and interactions.
 */

import { initTheme, toggleTheme } from './theme.js';
import { initI18n, setLang, t } from './i18n.js';

const DS_BASE = 'https://climasus.github.io/design-system/data';

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme (no flash — applied synchronously from localStorage)
  initTheme();

  // 2. i18n — async, applied after DOM is ready
  const lang = await initI18n();

  // 3. Load dynamic data from design-system in parallel
  await Promise.allSettled([
    loadTeam(lang),
    loadRepos(lang),
    loadArchitecture(lang),
    loadRoadmap(lang),
    loadFooter(lang),
    loadFunding(lang),
  ]);

  // 4. Bind interactions
  bindThemeToggle();
  bindLangSwitcher();
  bindNavScroll();
  bindParticles();
  countUpStats();

  // 5. Re-render dynamic sections on language change
  document.addEventListener('climasus:langchange', (e) => {
    const l = e.detail.lang;
    loadTeam(l);
    loadRepos(l);
    loadArchitecture(l);
    loadRoadmap(l);
    loadFooter(l);
    loadFunding(l);
  });
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
async function loadTeam(lang = 'pt') {
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
              ? `<img src="${m.photo}" alt="${m.name}" loading="lazy"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
              : ''
            }
            <div class="team-avatar-fallback" style="${m.photo ? 'display:none' : ''}">
              ${m.name.split(' ').map(n => n[0]).slice(0,2).join('')}
            </div>
          </div>
          <h3 class="team-name">${m.name}</h3>
          <p class="team-role">${m['role_' + lang] || m.role}</p>
          ${m.institution_logo
            ? `<div class="team-inst-logo"><img src="${m.institution_logo}" alt="${m.institution}" loading="lazy"></div>`
            : ''
          }
          <p class="team-institution">${m.institution}</p>
          <div class="team-links">
            ${m.github   ? `<a href="${m.github}"   target="_blank" rel="noopener" aria-label="GitHub">GH</a>`    : ''}
            ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">LI</a>` : ''}
            ${m.email    ? `<a href="mailto:${m.email}" aria-label="Email">✉</a>` : ''}
          </div>
        </div>
      `).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load team data:', e.message);
    container.innerHTML = '<p style="color:var(--text-3)">Team data temporarily unavailable.</p>';
  }
}

// ── Load repositories (portal_visible = true) ──────────────────────────────
async function loadRepos(lang = 'pt') {
  const container = document.getElementById('packages-grid');
  if (!container) return;

  try {
    const repos = await fetch(`${DS_BASE}/project/repositories.json`).then(r => r.json());

    const visible = repos
      .filter(r => r.portal_visible === true)
      .sort((a, b) => a.order - b.order);

    const docsLabel = lang === 'es' ? 'Documentación' : lang === 'en' ? 'Documentation' : 'Documentação';
    const ghLabel   = lang === 'es' ? 'Ver en GitHub' : lang === 'en' ? 'View on GitHub' : 'Ver no GitHub';

    container.innerHTML = visible.map(r => {
      const desc = r[`description_${lang}`] || r.description;
      return `
        <div class="package-card">
          <div class="package-header">
            <span class="package-icon">${r.icon || '📦'}</span>
            <div>
              <h3 class="package-name">${r.name}</h3>
              <span class="badge badge-${r.badge_color || 'green'}">${r.language}</span>
              <span class="badge badge-green" style="margin-left:.25rem">${lang === 'es' ? 'activo' : lang === 'en' ? 'active' : 'ativo'}</span>
            </div>
          </div>
          <p class="package-desc">${desc}</p>
          <div class="package-links">
            ${r.docs_url
              ? `<a href="${r.docs_url}" class="btn-sm btn-primary" target="_blank" rel="noopener">${docsLabel}</a>`
              : ''}
            <a href="${r.url}" class="btn-sm btn-outline" target="_blank" rel="noopener">${ghLabel}</a>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load repos:', e.message);
    container.innerHTML = '<p style="color:var(--text-3)">Packages temporarily unavailable.</p>';
  }
}

// ── Load architecture layers ───────────────────────────────────────────────
async function loadArchitecture(lang = 'pt') {
  const container = document.getElementById('arch-layers');
  if (!container) return;

  try {
    const data = await fetch(`${DS_BASE}/project/architecture.json`).then(r => r.json());
    const layers = [...data.layers].sort((a, b) => b.level - a.level); // top layer first

    container.innerHTML = layers.map(l => {
      const desc = l[`description_${lang}`] || l.description_en;
      return `
        <div class="arch-layer">
          <span class="arch-level" style="color:${l.color}">${l.level}</span>
          <div>
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
              <span style="font-size:1.4rem">${l.icon}</span>
              <span class="arch-title">${l[`title_${lang}`] || l.title}</span>
            </div>
            <p class="arch-desc">${desc}</p>
          </div>
          <div class="arch-tags">
            ${l.components.map(c => `<span class="arch-tag">${c}</span>`).join('')}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load architecture:', e.message);
    container.innerHTML = '<p style="color:var(--text-3)">Architecture data temporarily unavailable.</p>';
  }
}

// ── Load roadmap ───────────────────────────────────────────────────────────
async function loadRoadmap(lang = 'pt') {
  const container = document.getElementById('roadmap-grid');
  if (!container) return;

  const statusClass = { released: 'badge-released', in_progress: 'badge-in-progress', planned: 'badge-planned' };

  try {
    const items = await fetch(`${DS_BASE}/project/roadmap.json`).then(r => r.json());
    const statusKey = {
      released:    `roadmap.status.released`,
      in_progress: `roadmap.status.in_progress`,
      planned:     `roadmap.status.planned`,
    };

    container.innerHTML = items
      .sort((a, b) => a.order - b.order)
      .map(item => {
        const title    = item[`title_${lang}`]       || item.title;
        const desc     = item[`description_${lang}`] || item.description;
        const hlKey    = `highlights_${lang}`;
        const hl       = Array.isArray(item[hlKey]) ? item[hlKey] : [];
        const stLabel  = t(statusKey[item.status], item.status);
        return `
          <div class="roadmap-card">
            <div class="roadmap-header">
              <span>${item.version}</span>
              <span class="badge ${statusClass[item.status] || 'badge-planned'}">${stLabel}</span>
            </div>
            <div class="roadmap-version">${item.quarter}</div>
            <h3 class="roadmap-title">${title}</h3>
            <p class="roadmap-desc">${desc}</p>
            ${hl.length ? `<ul class="roadmap-highlights">${hl.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
          </div>`;
      }).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load roadmap:', e.message);
    container.innerHTML = '<p style="color:var(--text-3)">Roadmap temporarily unavailable.</p>';
  }
}

// ── Load footer links from design-system ──────────────────────────────────
async function loadFooter(lang = 'pt') {
  try {
    const data = await fetch(`${DS_BASE}/docs/footer.json`).then(r => r.json());

    const nav = document.getElementById('footer-links');
    if (nav) {
      nav.innerHTML = data.links.map(l =>
        `<a href="${l.href}" ${l.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${l.label}</a>`
      ).join('');
    }

    const copy = document.getElementById('footer-copy');
    if (copy) {
      copy.textContent = data[`copyright_${lang}`] || data.copyright_en;
    }
  } catch (e) {
    console.warn('[ClimaSUS] Could not load footer:', e.message);
  }
}

// ── Load funding logos from organization.json ──────────────────────────────
async function loadFunding(lang = 'pt') {
  const container = document.getElementById('funding-logos');
  if (!container) return;

  try {
    const org = await fetch(`${DS_BASE}/project/organization.json`).then(r => r.json());
    if (!Array.isArray(org.funding)) return;

    container.innerHTML = org.funding.map(f => `
      <div class="funding-logo-item">
        ${f.logo
          ? `<img src="${f.logo}" alt="${f.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
             <span style="display:none" class="logo-text">${f.name}</span>`
          : `<span class="logo-text">${f.name}</span>`
        }
      </div>`).join('');
  } catch (e) {
    console.warn('[ClimaSUS] Could not load funding:', e.message);
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
