// ============================================
// ANIMESTREAM — Main App (Cinematic Version)
// ============================================

const FALLBACK_ANIME_DATA = [
  {
    id: 'jjk-s3', title: 'Jujutsu Kaisen', titleJp: '呪術廻戦',
    cover: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    banner: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=80',
    genre: ['Ação', 'Sobrenatural'], year: 2024, rating: 9.1, episodes: 24, currentEp: 12,
    status: 'Em exibição', dub: true, sub: true,
    description: 'Yuji Itadori é um estudante com capacidades físicas extraordinárias. Após engolir o dedo de Ryomen Sukuna, ele se torna o hospedeiro de uma maldição letal...',
    tags: ['NOVO', 'TRENDING']
  },
  {
    id: 'aot-final', title: 'Attack on Titan', titleJp: '進撃の巨人',
    cover: 'https://cdn.myanimelist.net/images/anime/1588/99077l.jpg',
    banner: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=1600&q=80',
    genre: ['Ação', 'Drama'], year: 2023, rating: 9.8, episodes: 87, currentEp: 87,
    status: 'Completo', dub: true, sub: true,
    description: 'Centenas de anos atrás, humanos quase foram extintos por Titãs. Eren Yeager jura vingança após sua mãe ser devorada.',
    tags: ['COMPLETO', 'TOP']
  },
  {
    id: 'naruto-pain', title: 'Naruto Shippuden', titleJp: 'ナルト 疾風伝',
    cover: 'https://cdn.myanimelist.net/images/anime/5/17407l.jpg',
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80',
    genre: ['Ação', 'Ninja'], year: 2007, rating: 9.5, episodes: 500, currentEp: 167,
    status: 'Completo', dub: true, sub: true,
    description: 'Conheça a dor. Aqueles que não conhecem a dor, nunca entenderão a verdadeira paz. Pain ataca a Vila da Folha.',
    tags: ['CLÁSSICO']
  }
];

window.ANIME_DATA = FALLBACK_ANIME_DATA;

async function loadAnimesFromFirestore() {
  if (!window.AnimeAuth?.db) {
    return { animes: FALLBACK_ANIME_DATA, heroData: FALLBACK_ANIME_DATA.slice(0, 3) };
  }
  try {
    const { collection, getDocs, doc, getDoc, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const q = query(collection(window.AnimeAuth.db, "animes"), orderBy("title"));
    const snap = await getDocs(q);
    const animes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const bannersSnap = await getDoc(doc(window.AnimeAuth.db, "settings", "banners"));
    const bannerIds = bannersSnap.exists() ? (bannersSnap.data().animeIds || []) : [];
    const heroData = bannerIds.length
      ? bannerIds.map((id) => animes.find((a) => a.id === id)).filter(Boolean)
      : animes.slice(0, 3);

    return { animes, heroData };
  } catch (e) {
    console.error("Firestore load failed, using fallback:", e);
    return { animes: FALLBACK_ANIME_DATA, heroData: FALLBACK_ANIME_DATA.slice(0, 3) };
  }
}

class HeroBanner {
  constructor(heroList) {
    this.data = (heroList && heroList.length ? heroList : window.ANIME_DATA).slice(0, 6);
    this.current = 0;
    this.timer = null;
    this.init();
  }

  init() {
    const hero = document.getElementById('heroBanner');
    if (!hero) return;

    let slidesHtml = '';
    let dotsHtml = '';

    this.data.forEach((anime, i) => {
      slidesHtml += `
        <div class="hero-slide ${i === 0 ? 'active' : ''}" id="slide-${i}">
          <div class="hero-bg" style="background-image: url('${anime.banner}')"></div>
          <div class="hero-gradient"></div>
          <div class="vertical-title-jp">${anime.titleJp}</div>
          <div class="hero-content">
            <div class="hero-ep-indicator">0${i+1} / 0${this.data.length} • ${anime.status}</div>
            <h1 class="hero-title"><span class="glow">${anime.title}</span></h1>
            <p class="hero-desc">${anime.description}</p>
            <a href="pages/player.html?id=${anime.id}&ep=1" class="btn-play-pill">▶ PLAY NOW</a>
          </div>
        </div>`;
      dotsHtml += `<div class="dot ${i === 0 ? 'active' : ''}" onclick="window.heroBanner.goTo(${i})"></div>`;
    });

    hero.innerHTML = `
      ${slidesHtml}
      <div class="hero-indicators">${dotsHtml}</div>
    `;

    this.start();
  }

  goTo(index) {
    document.getElementById(`slide-${this.current}`).classList.remove('active');
    document.querySelectorAll('.dot')[this.current].classList.remove('active');
    this.current = index;
    document.getElementById(`slide-${this.current}`).classList.add('active');
    document.querySelectorAll('.dot')[this.current].classList.add('active');
    this.restart();
  }

  next() { this.goTo((this.current + 1) % this.data.length); }
  start() { this.timer = setInterval(() => this.next(), 6000); }
  restart() { clearInterval(this.timer); this.start(); }
}

function buildAnimeCard(anime) {
  const tags = Array.isArray(anime.tags) ? anime.tags : [];
  return `
  <div class="anime-card" onclick="window.location.href='pages/player.html?id=${anime.id}&ep=1'">
    <div class="card-thumb">
      <img src="${anime.cover}" alt="${anime.title}">
      <div class="card-overlay">
        <div class="card-badges">
          ${tags.includes('NOVO') ? '<span class="card-badge new">NOVO</span>' : ''}
          <span class="card-badge">EP ${anime.currentEp || anime.episodes}</span>
        </div>
        <div class="card-title">${anime.title}</div>
        <div class="card-meta">★ ${anime.rating} • ${anime.year}</div>
      </div>
    </div>
  </div>`;
}

function initHomePage() {
  loadAnimesFromFirestore().then(({ animes, heroData }) => {
    window.ANIME_DATA = Array.isArray(animes) && animes.length ? animes : FALLBACK_ANIME_DATA;
    window.heroBanner = new HeroBanner(heroData);
    const trendingRow = document.getElementById('trendingRow');
    if (trendingRow) {
      trendingRow.innerHTML = window.ANIME_DATA.map(buildAnimeCard).join('');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'home') initHomePage();
});