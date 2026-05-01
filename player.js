// ============================================
// ANIMESTREAM — Video Player
// ============================================

let currentAnime  = null;
let currentEp     = 1;
let currentServer = 0;
let progressTimer = null;

function initPlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get('id');
  const ep      = parseInt(params.get('ep')) || 1;

  currentEp = ep;
  currentAnime = window.ANIME_DATA?.find(a => a.id === animeId);

  if (!currentAnime) {
    window.location.href = '/';
    return;
  }

  renderPlayerUI();
  loadEpisode(ep);
}

function renderPlayerUI() {
  const anime = currentAnime;

  // Update page title
  document.title = `${anime.title} — EP ${currentEp} | AnimeStream`;

  // Breadcrumb
  const breadcrumb = document.getElementById('playerBreadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="/" style="color:var(--text-muted);text-decoration:none">Início</a>
      <span style="color:var(--text-muted)"> › </span>
      <a href="catalog.html?genre=${anime.genre[0]}" style="color:var(--text-muted);text-decoration:none">${anime.genre[0]}</a>
      <span style="color:var(--text-muted)"> › </span>
      <span style="color:var(--text-primary)">${anime.title}</span>`;
  }

  // Anime info
  const info = document.getElementById('playerAnimeInfo');
  if (info) {
    info.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;margin-top:16px;flex-wrap:wrap">
        <img src="${anime.cover}" alt="${anime.title}" style="width:80px;border-radius:8px;flex-shrink:0">
        <div>
          <h1 style="font-size:1.4rem;font-weight:700;margin-bottom:4px">${anime.title}</h1>
          <p style="color:var(--text-muted);font-size:.8rem;margin-bottom:8px">${anime.titleJp}</p>
          <div class="flex gap-8 flex-wrap">
            <span class="hero-tag">EP ${currentEp}</span>
            ${anime.dub ? '<span class="hero-tag">DUB</span>' : ''}
            ${anime.sub ? '<span class="hero-tag">LEG</span>' : ''}
            <span class="hero-meta-item rating" style="display:inline-flex">★ ${anime.rating}</span>
          </div>
        </div>
      </div>`;
  }

  // Server buttons
  const servers = document.getElementById('serverBtns');
  if (servers) {
    servers.innerHTML = (anime.servers || []).map((s, i) => `
      <button class="server-btn ${i === 0 ? 'active' : ''}" onclick="switchServer(${i})">
        ${s.name}
      </button>`).join('');
  }

  // Language switch
  const langs = document.getElementById('langBtns');
  if (langs) {
    langs.innerHTML = `
      ${anime.dub ? '<button class="server-btn active" onclick="switchLang(\'dub\',this)">🔊 Dublado</button>' : ''}
      ${anime.sub ? '<button class="server-btn" onclick="switchLang(\'sub\',this)">💬 Legendado</button>' : ''}`;
  }

  // Build episode sidebar
  renderEpisodeSidebar();

  // Next/prev episode
  updateEpNavBtns();
}

function loadEpisode(ep) {
  currentEp = ep;
  const anime = currentAnime;
  const serverUrl = anime.servers?.[currentServer]?.url || '';

  // Show loader
  const loader = document.getElementById('playerLoader');
  const iframe  = document.getElementById('playerIframe');
  if (loader) loader.style.display = 'flex';
  if (iframe) iframe.style.display = 'none';

  // Build embed URL (real implementation would have per-episode URLs)
  const embedUrl = serverUrl + (serverUrl.includes('?') ? '&' : '?') + `ep=${ep}`;
  if (iframe) {
    iframe.src = embedUrl;
    iframe.onload = () => {
      if (loader) loader.style.display = 'none';
      iframe.style.display = 'block';
      startProgressTracking();
      window.AnimeAuth?.addToHistory(anime.id, { title: anime.title, cover: anime.cover }, ep);
    };
  }

  // Update active ep in sidebar
  document.querySelectorAll('.ep-item').forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.ep) === ep);
  });
  document.querySelectorAll('.ep-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.ep) === ep);
  });

  updateEpNavBtns();

  // Update URL without reload
  const url = new URL(window.location);
  url.searchParams.set('ep', ep);
  history.pushState({}, '', url);

  document.title = `${anime.title} — EP ${ep} | AnimeStream`;
}

function renderEpisodeSidebar() {
  const sidebar = document.getElementById('episodeSidebar');
  if (!sidebar) return;

  const anime = currentAnime;
  const episodes = Array.from({ length: Math.min(anime.episodes, 50) }, (_, i) => i + 1);

  sidebar.innerHTML = `
    <div class="ep-sidebar-title">
      📺 Episódios
      <span style="color:var(--text-muted);font-size:.75rem;font-weight:400">${anime.episodes} total</span>
    </div>
    <div id="epList" style="overflow-y:auto;max-height:calc(100vh - 200px)">
      ${episodes.map(ep => `
        <div class="ep-item ${ep === currentEp ? 'active' : ''}" data-ep="${ep}" onclick="loadEpisode(${ep})">
          <div class="ep-thumb">
            <img src="${anime.cover}" alt="EP ${ep}" loading="lazy">
          </div>
          <div class="ep-details">
            <div class="ep-num">EPISÓDIO ${ep}</div>
            <div class="ep-title-small">${anime.title} — Episódio ${ep}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function switchServer(index) {
  currentServer = index;
  document.querySelectorAll('.server-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  loadEpisode(currentEp);
}

function switchLang(lang, btn) {
  document.querySelectorAll('#langBtns .server-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // In real implementation, switch server/URL based on language
  showToast('info', lang === 'dub' ? '🔊 Mudando para dublado...' : '💬 Mudando para legendado...');
  loadEpisode(currentEp);
}

function updateEpNavBtns() {
  const prev = document.getElementById('prevEpBtn');
  const next = document.getElementById('nextEpBtn');
  if (prev) {
    prev.disabled = currentEp <= 1;
    prev.onclick = () => loadEpisode(currentEp - 1);
  }
  if (next) {
    next.disabled = currentEp >= currentAnime.episodes;
    next.onclick = () => loadEpisode(currentEp + 1);
  }
}

function startProgressTracking() {
  clearInterval(progressTimer);
  let seconds = 0;
  progressTimer = setInterval(() => {
    seconds += 5;
    window.AnimeAuth?.saveProgress(currentAnime.id, currentEp, seconds, 1440);
    window.AnimeAuth?.incrementGuestWatch(5);
  }, 5000);
}

// Auto next episode
function autoNextEpisode() {
  if (currentEp < currentAnime.episodes) {
    showToast('info', `▶ Próximo episódio em 5 segundos...`);
    setTimeout(() => loadEpisode(currentEp + 1), 5000);
  }
}

// Make functions global
window.initPlayerPage  = initPlayerPage;
window.loadEpisode     = loadEpisode;
window.switchServer    = switchServer;
window.switchLang      = switchLang;
window.autoNextEpisode = autoNextEpisode;
