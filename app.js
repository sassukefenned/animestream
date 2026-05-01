// ============================================
// ANIMESTREAM — Main App
// ============================================

// ============================================
// SAMPLE DATA (Replace with your Firestore data or API)
// ============================================
const ANIME_DATA = [
  {
    id: 'jjk-s3',
    title: 'Jujutsu Kaisen',
    titleJp: '呪術廻戦',
    cover: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    banner: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=80',
    bannerColor: '#b429f9',
    genre: ['Ação', 'Sobrenatural', 'Escola'],
    year: 2024,
    rating: 9.1,
    episodes: 24,
    currentEp: 12,
    status: 'Em exibição',
    dub: true,
    sub: true,
    language: 'pt-br',
    description: 'Yuji Itadori é um estudante do ensino médio que possui capacidades físicas extraordinárias. Após engolir o dedo amaldiçoado de Ryomen Sukuna...',
    tags: ['NOVO', 'TRENDING'],
    servers: [
      { name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { name: 'Server 2', url: 'https://player.vimeo.com/video/76979871' }
    ]
  },
  {
    id: 'aot-final',
    title: 'Attack on Titan',
    titleJp: '進撃の巨人',
    cover: 'https://cdn.myanimelist.net/images/anime/1588/99077l.jpg',
    banner: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=1600&q=80',
    bannerColor: '#ff2d55',
    genre: ['Ação', 'Drama', 'Fantasia'],
    year: 2023,
    rating: 9.8,
    episodes: 87,
    currentEp: 87,
    status: 'Completo',
    dub: true,
    sub: true,
    language: 'pt-br',
    description: 'Centenas de anos atrás, os humanos foram quase extintos por gigantes chamados Titãs. Os Titãs são criaturas humanoides que comem humanos por prazer...',
    tags: ['COMPLETO', 'TOP'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'demon-slayer-s4',
    title: 'Demon Slayer',
    titleJp: '鬼滅の刃',
    cover: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1600&q=80',
    bannerColor: '#00d4ff',
    genre: ['Ação', 'Sobrenatural'],
    year: 2024,
    rating: 9.3,
    episodes: 12,
    currentEp: 8,
    status: 'Em exibição',
    dub: true,
    sub: true,
    language: 'pt-br',
    description: 'Tanjiro Kamado se torna um caçador de demônios para caçar o demônio que massacrou sua família e transformou sua irmã Nezuko em um demônio.',
    tags: ['NOVO'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'vinland-saga-s2',
    title: 'Vinland Saga',
    titleJp: 'ヴィンランド・サガ',
    cover: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80',
    bannerColor: '#ffd700',
    genre: ['Ação', 'Histórico', 'Drama'],
    year: 2023,
    rating: 9.5,
    episodes: 24,
    status: 'Completo',
    dub: false, sub: true,
    language: 'leg',
    description: 'Thorfinn cresceu ouvindo histórias de guerreiros e exploradores sobre uma terra lendária...',
    tags: ['TOP AVALIADO'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'one-piece',
    title: 'One Piece',
    titleJp: 'ワンピース',
    cover: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    banner: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=80',
    bannerColor: '#ff8c00',
    genre: ['Aventura', 'Fantasia', 'Ação'],
    year: 1999,
    rating: 9.0,
    episodes: 1096,
    currentEp: 1096,
    status: 'Em exibição',
    dub: true, sub: true,
    language: 'pt-br',
    description: 'Monkey D. Luffy, um jovem aventureiro que sonha em se tornar o Rei dos Piratas...',
    tags: ['CLÁSSICO'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'frieren',
    title: 'Frieren: Beyond Journey\'s End',
    titleJp: '葬送のフリーレン',
    cover: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    banner: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1600&q=80',
    bannerColor: '#00ff88',
    genre: ['Fantasia', 'Drama', 'Aventura'],
    year: 2023,
    rating: 9.4,
    episodes: 28,
    status: 'Completo',
    dub: false, sub: true,
    language: 'leg',
    description: 'Após derrotar o Rei Demônio, o grupo de heróis se dissolve. Frieren, a maga elfa do grupo, sobrevive a seus companheiros...',
    tags: ['TOP AVALIADO', 'COMPLETO'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'chainsaw-man',
    title: 'Chainsaw Man',
    titleJp: 'チェンソーマン',
    cover: 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
    banner: 'https://images.unsplash.com/photo-1589182337358-2cb63099350c?w=1600&q=80',
    bannerColor: '#ff2d55',
    genre: ['Ação', 'Sobrenatural', 'Gore'],
    year: 2022,
    rating: 8.9,
    episodes: 12,
    status: 'Completo',
    dub: true, sub: true,
    language: 'pt-br',
    description: 'Denji tem uma vida extremamente miserável. Com uma dívida impagável com a Yakuza, ele e seu demônio-parceiro Pochita...',
    tags: [],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  },
  {
    id: 'dandadan',
    title: 'DAN DA DAN',
    titleJp: 'ダンダダン',
    cover: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    banner: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80',
    bannerColor: '#b429f9',
    genre: ['Ação', 'Comédia', 'Sobrenatural'],
    year: 2024,
    rating: 8.8,
    episodes: 12,
    currentEp: 12,
    status: 'Completo',
    dub: true, sub: true,
    language: 'pt-br',
    description: 'Okarun é um menino que acredita em extraterrestres mas não em fantasmas. Momo acredita em fantasmas mas não em ETs. Após um encontro sobrenatural...',
    tags: ['NOVO', 'TRENDING'],
    servers: [{ name: 'Server 1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }]
  }
];

const GENRES = [
  { id: 'acao',        label: 'Ação',       icon: '⚔️' },
  { id: 'aventura',    label: 'Aventura',   icon: '🗺️' },
  { id: 'romance',     label: 'Romance',    icon: '💕' },
  { id: 'comedia',     label: 'Comédia',    icon: '😂' },
  { id: 'drama',       label: 'Drama',      icon: '🎭' },
  { id: 'fantasia',    label: 'Fantasia',   icon: '🧙' },
  { id: 'terror',      label: 'Terror',     icon: '👹' },
  { id: 'esportes',    label: 'Esportes',   icon: '⚽' },
  { id: 'sobrenatural',label: 'Sobrenatural',icon:'👻' },
  { id: 'mecha',       label: 'Mecha',      icon: '🤖' },
  { id: 'historico',   label: 'Histórico',  icon: '📜' },
  { id: 'school',      label: 'Escola',     icon: '🎓' },
];

// ============================================
// HERO BANNER
// ============================================
class HeroBanner {
  constructor() {
    this.data = ANIME_DATA.filter(a => a.banner).slice(0, 5);
    this.current = 0;
    this.timer = null;
    this.init();
  }

  init() {
    const container = document.getElementById('heroSlides');
    const dots = document.getElementById('heroDots');
    if (!container || !this.data.length) return;

    // Build slides
    this.data.forEach((anime, i) => {
      const slide = document.createElement('div');
      slide.className = `hero-slide ${i === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <div class="hero-slide-bg" style="background-image:url('${anime.banner}')"></div>
        <div class="hero-gradient"></div>
        <div class="hero-particle-overlay"></div>`;
      container.appendChild(slide);
    });

    // Build dots
    this.data.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
      dot.onclick = () => this.goTo(i);
      dots.appendChild(dot);
    });

    this.updateContent();
    this.start();

    document.getElementById('heroPrev')?.addEventListener('click', () => this.prev());
    document.getElementById('heroNext')?.addEventListener('click', () => this.next());
  }

  updateContent() {
    const anime = this.data[this.current];
    const content = document.getElementById('heroContent');
    if (!content) return;
    content.innerHTML = `
      <div class="hero-badge fade-in">
        <span class="dot"></span>
        ${anime.status === 'Em exibição' ? '● AO VIVO' : '✦ DESTAQUE'}
      </div>
      <h1 class="hero-title fade-in fade-in-2">
        <span class="title-jp">${anime.titleJp}</span>
        <span class="title-glow">${anime.title}</span>
      </h1>
      <div class="hero-meta fade-in fade-in-2">
        <span class="hero-meta-item rating">★ ${anime.rating}</span>
        <span class="hero-meta-item">${anime.year}</span>
        <span class="hero-meta-item">${anime.episodes} eps</span>
        ${anime.dub ? '<span class="hero-tag">DUB</span>' : ''}
        ${anime.sub ? '<span class="hero-tag">LEG</span>' : ''}
        ${anime.genre.slice(0,3).map(g => `<span class="hero-tag">${g}</span>`).join('')}
      </div>
      <p class="hero-desc fade-in fade-in-3">${anime.description}</p>
      <div class="hero-actions fade-in fade-in-4">
        <a href="player.html?id=${anime.id}&ep=1" class="btn-play">
          ▶ Assistir Agora
        </a>
        <button class="btn-info" onclick="openAnimeModal('${anime.id}')">
          ℹ Mais Informações
        </button>
      </div>`;
  }

  goTo(index) {
    document.querySelectorAll('.hero-slide')[this.current].classList.remove('active');
    document.querySelectorAll('.hero-dot')[this.current].classList.remove('active');
    this.current = index;
    document.querySelectorAll('.hero-slide')[this.current].classList.add('active');
    document.querySelectorAll('.hero-dot')[this.current].classList.add('active');
    this.updateContent();
    this.restart();
  }

  next() { this.goTo((this.current + 1) % this.data.length); }
  prev() { this.goTo((this.current - 1 + this.data.length) % this.data.length); }

  start() {
    this.timer = setInterval(() => this.next(), 6000);
  }
  restart() {
    clearInterval(this.timer);
    this.start();
  }
}

// ============================================
// ANIME CARD BUILDER
// ============================================
function buildAnimeCard(anime, showProgress = false) {
  const progress = showProgress ? Math.floor(Math.random() * 80) + 10 : 0;
  const isFav = window.AnimeAuth?.isFavorite(anime.id) || false;

  return `
  <div class="anime-card" data-id="${anime.id}">
    <div class="card-thumb">
      <img src="${anime.cover}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/0f0f1a/b429f9?text=ANIME'">
      <div class="card-overlay">
        <div class="card-play-btn">▶</div>
      </div>
      <div class="card-badges">
        ${anime.tags?.includes('NOVO') ? '<span class="card-badge new">Novo</span>' : ''}
        <span class="card-badge ep">EP ${anime.currentEp || anime.episodes}</span>
        ${anime.dub ? '<span class="card-badge dub">DUB</span>' : ''}
      </div>
      <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="handleFav(event,'${anime.id}')" title="Favoritar">
        ${isFav ? '♥' : '♡'}
      </button>
      ${showProgress ? `<div class="card-progress"><div class="card-progress-bar" style="width:${progress}%"></div></div>` : ''}
    </div>
    <div class="card-info">
      <div class="card-title">${anime.title}</div>
      <div class="card-meta">
        <span class="rating">★ ${anime.rating}</span>
        <span>${anime.year}</span>
        <span>${anime.genre[0]}</span>
      </div>
    </div>
  </div>`;
}

function buildContinueCard(anime) {
  const ep = anime.currentEp || 1;
  const progress = Math.floor(Math.random() * 70) + 20;
  return `
  <div class="continue-card" onclick="goToPlayer('${anime.id}', ${ep})">
    <div class="continue-thumb">
      <img src="${anime.banner || anime.cover}" alt="${anime.title}" loading="lazy">
      <div class="continue-overlay"></div>
      <div class="continue-ep">Episódio ${ep}</div>
    </div>
    <div class="continue-info">
      <div class="continue-title">${anime.title}</div>
      <div class="continue-progress">
        <div class="continue-bar" style="width:${progress}%"></div>
      </div>
      <div class="continue-time">EP ${ep} • ${progress}% assistido</div>
    </div>
  </div>`;
}

// ============================================
// RENDER SECTIONS
// ============================================
function renderSection(containerId, items, type = 'card', showProgress = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (type === 'card') {
    container.innerHTML = items.map(a => buildAnimeCard(a, showProgress)).join('');
  } else if (type === 'continue') {
    container.innerHTML = items.map(a => buildContinueCard(a)).join('');
  }

  // Click handlers
  container.querySelectorAll('.anime-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-fav-btn')) return;
      openAnimeModal(card.dataset.id);
    });
  });
}

function renderGenres() {
  const container = document.getElementById('genresGrid');
  if (!container) return;
  container.innerHTML = GENRES.map(g => `
    <a href="catalog.html?genre=${g.id}" class="genre-chip">
      <span class="genre-icon">${g.icon}</span>
      ${g.label}
    </a>`).join('');
}

// ============================================
// ANIME MODAL
// ============================================
function openAnimeModal(animeId) {
  const anime = ANIME_DATA.find(a => a.id === animeId);
  if (!anime) return;

  const modal = document.getElementById('animeModal');
  if (!modal) return;

  const episodes = Array.from({ length: anime.episodes }, (_, i) => i + 1);
  const epGrid = episodes.slice(0, 24).map(ep => `
    <button class="ep-btn ${ep === anime.currentEp ? 'active' : ''}" onclick="goToPlayer('${anime.id}',${ep})">
      ${ep}
    </button>`).join('');

  modal.querySelector('.modal-body').innerHTML = `
    <h2 class="modal-title">${anime.title}</h2>
    <div class="hero-meta">
      <span class="hero-meta-item rating">★ ${anime.rating}</span>
      <span class="hero-meta-item">${anime.year}</span>
      <span class="hero-meta-item">${anime.episodes} episódios</span>
      <span class="hero-meta-item ${anime.status === 'Em exibição' ? 'new' : ''}">${anime.status}</span>
    </div>
    <div class="flex gap-8 mt-8 flex-wrap">
      ${anime.genre.map(g => `<span class="hero-tag">${g}</span>`).join('')}
      ${anime.dub ? '<span class="hero-tag">DUBLADO</span>' : ''}
      ${anime.sub ? '<span class="hero-tag">LEGENDADO</span>' : ''}
    </div>
    <p style="color:var(--text-secondary);font-size:.9rem;line-height:1.7;margin:16px 0">${anime.description}</p>
    <div class="modal-actions">
      <a href="player.html?id=${anime.id}&ep=1" class="btn-play">▶ Assistir</a>
      <button class="btn-info" onclick="handleFav(event,'${anime.id}')">♡ Favoritar</button>
    </div>
    <div style="margin-top:16px">
      <div class="section-title" style="font-size:1rem;margin-bottom:12px">Episódios</div>
      <div class="episodes-grid">${epGrid}</div>
      ${anime.episodes > 24 ? `<p style="text-align:center;color:var(--text-muted);font-size:.78rem;margin-top:8px">Mostrando 24 de ${anime.episodes} episódios</p>` : ''}
    </div>`;

  modal.querySelector('.modal-banner').innerHTML = `
    <img src="${anime.banner || anime.cover}" alt="${anime.title}">
    <div class="gradient"></div>
    <button class="close-btn" onclick="closeModal('animeModal')">✕</button>`;

  openModal('animeModal');
}

// ============================================
// MODAL HELPERS
// ============================================
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') ||
      e.target.classList.contains('popup-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open, .popup-overlay.open, .search-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});

// ============================================
// FAVORITES HANDLER
// ============================================
async function handleFav(event, animeId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const anime = ANIME_DATA.find(a => a.id === animeId);
  if (!anime) return;

  if (!window.AnimeAuth?.currentUser) {
    openModal('authModal');
    showToast('info', '🔒 Faça login para favoritar');
    return;
  }

  const isNowFav = await window.AnimeAuth.toggleFavorite(animeId, {
    id: anime.id, title: anime.title, cover: anime.cover, rating: anime.rating
  });

  // Update all fav buttons for this anime
  document.querySelectorAll(`[data-id="${animeId}"] .card-fav-btn`).forEach(b => {
    b.classList.toggle('active', isNowFav);
    b.innerHTML = isNowFav ? '♥' : '♡';
  });
}

// ============================================
// PLAYER NAVIGATION
// ============================================
function goToPlayer(animeId, episode = 1) {
  if (!window.AnimeAuth?.checkGuestLimit()) {
    showLimitPopup();
    return;
  }
  window.location.href = `player.html?id=${animeId}&ep=${episode}`;
}

// ============================================
// SEARCH
// ============================================
class SearchSystem {
  constructor() {
    this.overlay = document.getElementById('searchOverlay');
    this.input   = document.getElementById('searchInput');
    this.results = document.getElementById('searchResultsGrid');
    this.init();
  }

  init() {
    document.getElementById('searchBtn')?.addEventListener('click', () => this.open());
    document.getElementById('searchClose')?.addEventListener('click', () => this.close());
    this.input?.addEventListener('input', () => this.search(this.input.value));

    // Filter buttons
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        this.search(this.input?.value || '');
      });
    });
  }

  open() {
    this.overlay?.classList.add('open');
    setTimeout(() => this.input?.focus(), 100);
  }
  close() {
    this.overlay?.classList.remove('open');
  }

  search(query) {
    if (!this.results) return;
    const q = query.toLowerCase().trim();
    if (!q) { this.results.innerHTML = ''; return; }

    const filters = [...document.querySelectorAll('.filter-btn.active')].map(b => b.dataset.filter);

    let results = ANIME_DATA.filter(a => {
      const matchQuery = a.title.toLowerCase().includes(q) ||
                         a.titleJp.includes(q) ||
                         a.genre.some(g => g.toLowerCase().includes(q));
      const matchDub = !filters.includes('dub') || a.dub;
      const matchSub = !filters.includes('leg') || a.sub;
      return matchQuery && matchDub && matchSub;
    });

    if (!results.length) {
      this.results.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px 0">Nenhum resultado para "${query}"</p>`;
      return;
    }

    this.results.innerHTML = results.map(a => buildAnimeCard(a)).join('');
    this.results.querySelectorAll('.anime-card').forEach(card => {
      card.addEventListener('click', () => {
        this.close();
        openAnimeModal(card.dataset.id);
      });
    });
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(type, message, duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// Make global
window.showToast = showToast;
window.showLimitPopup = () => openModal('limitPopup');

// ============================================
// NAVBAR SCROLL
// ============================================
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  nav?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ============================================
// AUTH MODAL TABS
// ============================================
function initAuthModal() {
  const loginTab    = document.getElementById('tabLogin');
  const registerTab = document.getElementById('tabRegister');
  const loginForm   = document.getElementById('formLogin');
  const regForm     = document.getElementById('formRegister');

  loginTab?.addEventListener('click', () => {
    loginTab.classList.add('active'); registerTab.classList.remove('active');
    loginForm.style.display = 'block'; regForm.style.display = 'none';
  });
  registerTab?.addEventListener('click', () => {
    registerTab.classList.add('active'); loginTab.classList.remove('active');
    regForm.style.display = 'block'; loginForm.style.display = 'none';
  });

  document.getElementById('btnGoogleLogin')?.addEventListener('click', () => window.AnimeAuth?.loginWithGoogle());
  document.getElementById('btnDiscordLogin')?.addEventListener('click', () => window.AnimeAuth?.loginWithDiscord());

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass  = document.getElementById('loginPass').value;
    window.AnimeAuth?.loginWithEmail(email, pass);
  });

  regForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass  = document.getElementById('regPass').value;
    window.AnimeAuth?.registerWithEmail(email, pass, name);
  });
}

// ============================================
// USER DROPDOWN
// ============================================
function initUserDropdown() {
  const menu = document.getElementById('userMenuDropdown');
  document.getElementById('userAvatarBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    menu?.classList.toggle('open');
  });
  document.addEventListener('click', () => menu?.classList.remove('open'));
  document.getElementById('btnLogout')?.addEventListener('click', () => window.AnimeAuth?.logout());
}

// ============================================
// HOMEPAGE INIT
// ============================================
function initHomePage() {
  // Hero
  new HeroBanner();

  // Sections
  const trending = [...ANIME_DATA].sort((a,b) => b.rating - a.rating);
  const newest   = [...ANIME_DATA].filter(a => a.tags?.includes('NOVO') || a.status === 'Em exibição');
  const topRated = [...ANIME_DATA].sort((a,b) => b.rating - a.rating);
  const continueList = ANIME_DATA.filter(a => a.currentEp).slice(0, 6);

  renderSection('continuingRow',  continueList, 'continue');
  renderSection('trendingRow',    trending,     'card');
  renderSection('newestRow',      newest,       'card');
  renderSection('topRatedRow',    topRated,     'card');
  renderSection('recommendedRow', ANIME_DATA.slice().reverse(), 'card');
  renderGenres();

  // Search
  new SearchSystem();
  initAuthModal();
  initUserDropdown();
}

// ============================================
// PAGE DETECTION & INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home')    initHomePage();
  if (page === 'player')  initPlayerPage();
  if (page === 'auth')    initAuthPage();
  if (page === 'admin')   initAdminPage();
});
