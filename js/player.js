// ============================================
// ANIMESTREAM - Video Player (Firestore)
// ============================================

let currentAnime = null;
let currentEp = 1;
let currentServer = 0;
let progressTimer = null;
let episodeDocs = [];

function fallbackToast(type, msg) {
  if (typeof window.showToast === "function") {
    window.showToast(type, msg);
  } else {
    console.log(`[${type}] ${msg}`);
  }
}

async function loadPlayerData(animeId) {
  try {
    const { doc, getDoc, collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = window.AnimeAuth?.db;
    if (!db) throw new Error("db unavailable");

    const animeSnap = await getDoc(doc(db, "animes", animeId));
    if (!animeSnap.exists()) return false;
    currentAnime = { id: animeSnap.id, ...animeSnap.data() };

    const epsSnap = await getDocs(query(collection(db, "animes", animeId, "episodes"), orderBy("number")));
    episodeDocs = epsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (episodeDocs.length > 0) currentAnime.episodes = episodeDocs.length;
    if (!currentAnime.servers || !currentAnime.servers.length) {
      currentAnime.servers = episodeDocs[0]?.servers || [{ name: "Default", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }];
    }
    return true;
  } catch {
    currentAnime = window.ANIME_DATA?.find((a) => a.id === animeId);
    return !!currentAnime;
  }
}

function initPlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");
  const ep = parseInt(params.get("ep"), 10) || 1;
  currentEp = ep;

  loadPlayerData(animeId).then((ok) => {
    if (!ok) {
      window.location.href = "/";
      return;
    }
    renderPlayerUI();
    loadEpisode(currentEp);
  });
}

function renderPlayerUI() {
  const anime = currentAnime;
  document.title = `${anime.title} - EP ${currentEp} | AnimeStream`;

  const breadcrumb = document.getElementById("playerBreadcrumb");
  if (breadcrumb) {
    const firstGenre = anime.genre?.[0] || "anime";
    breadcrumb.innerHTML = `
      <a href="/" style="color:var(--text-muted);text-decoration:none">Inicio</a>
      <span style="color:var(--text-muted)"> > </span>
      <a href="#" style="color:var(--text-muted);text-decoration:none">${firstGenre}</a>
      <span style="color:var(--text-muted)"> > </span>
      <span style="color:var(--text-primary)">${anime.title}</span>`;
  }

  const info = document.getElementById("playerAnimeInfo");
  if (info) {
    info.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;margin-top:16px;flex-wrap:wrap">
        <img src="${anime.cover || ""}" alt="${anime.title}" style="width:80px;border-radius:8px;flex-shrink:0">
        <div>
          <h1 style="font-size:1.4rem;font-weight:700;margin-bottom:4px">${anime.title}</h1>
          <p style="color:var(--text-muted);font-size:.8rem;margin-bottom:8px">${anime.titleJp || ""}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span class="card-badge">EP ${currentEp}</span>
            ${anime.dub ? '<span class="card-badge">DUB</span>' : ""}
            ${anime.sub ? '<span class="card-badge">LEG</span>' : ""}
            <span class="card-badge">* ${anime.rating || "-"}</span>
          </div>
        </div>
      </div>`;
  }

  const servers = document.getElementById("serverBtns");
  if (servers) {
    servers.innerHTML = (anime.servers || []).map((s, i) => `
      <button class="btn-login ${i === 0 ? "active" : ""}" onclick="switchServer(${i})">${s.name}</button>
    `).join("");
  }

  const langs = document.getElementById("langBtns");
  if (langs) {
    langs.innerHTML = `
      ${anime.dub ? '<button class="btn-login active" onclick="switchLang(\'dub\',this)">Dublado</button>' : ""}
      ${anime.sub ? '<button class="btn-login" onclick="switchLang(\'sub\',this)">Legendado</button>' : ""}`;
  }

  renderEpisodeSidebar();
  updateEpNavBtns();
}

function loadEpisode(ep) {
  currentEp = ep;
  const anime = currentAnime;
  const epObj = episodeDocs.find((e) => Number(e.number) === Number(ep));
  const activeServers = epObj?.servers?.length ? epObj.servers : (anime.servers || []);
  const serverUrl = activeServers?.[currentServer]?.url || "";

  const loader = document.getElementById("playerLoader");
  const iframe = document.getElementById("playerIframe");
  if (loader) loader.style.display = "flex";
  if (iframe) iframe.style.display = "none";

  const embedUrl = serverUrl + (serverUrl.includes("?") ? "&" : "?") + `ep=${ep}`;
  if (iframe) {
    iframe.src = embedUrl;
    iframe.onload = () => {
      if (loader) loader.style.display = "none";
      iframe.style.display = "block";
      startProgressTracking();
      window.AnimeAuth?.addToHistory(anime.id, { title: anime.title, cover: anime.cover }, ep);
    };
  }

  document.querySelectorAll(".ep-item").forEach((item) => {
    item.classList.toggle("active", parseInt(item.dataset.ep, 10) === ep);
  });

  updateEpNavBtns();

  const url = new URL(window.location.href);
  url.searchParams.set("ep", ep);
  history.pushState({}, "", url);
  document.title = `${anime.title} - EP ${ep} | AnimeStream`;
}

function renderEpisodeSidebar() {
  const sidebar = document.getElementById("episodeSidebar");
  if (!sidebar) return;
  const anime = currentAnime;
  const episodes = episodeDocs.length
    ? episodeDocs.map((e) => Number(e.number)).sort((a, b) => a - b)
    : Array.from({ length: Math.min(anime.episodes || 1, 100) }, (_, i) => i + 1);

  sidebar.innerHTML = `
    <div class="ep-sidebar-title" style="font-weight:700;margin-bottom:8px;">
      Episodios <span style="color:var(--text-muted);font-size:.75rem;">${anime.episodes || episodes.length} total</span>
    </div>
    <div id="epList" style="display:grid;gap:8px;">
      ${episodes.map((epNum) => {
        const epData = episodeDocs.find((d) => Number(d.number) === Number(epNum));
        return `
          <div class="ep-item ${epNum === currentEp ? "active" : ""}" data-ep="${epNum}" onclick="loadEpisode(${epNum})" style="padding:10px;border:1px solid var(--border-subtle);border-radius:8px;cursor:pointer;background:var(--bg-card);">
            <div class="ep-num" style="font-weight:700;">EP ${epNum}</div>
            <div class="ep-title-small" style="color:var(--text-secondary);font-size:.9rem;">${epData?.title || `${anime.title} - Episodio ${epNum}`}</div>
          </div>`;
      }).join("")}
    </div>`;
}

function switchServer(index) {
  currentServer = index;
  loadEpisode(currentEp);
}

function switchLang(lang, btn) {
  document.querySelectorAll("#langBtns .btn-login").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  fallbackToast("info", lang === "dub" ? "Mudando para dublado..." : "Mudando para legendado...");
  loadEpisode(currentEp);
}

function updateEpNavBtns() {
  const prev = document.getElementById("prevEpBtn");
  const next = document.getElementById("nextEpBtn");
  const total = currentAnime?.episodes || 1;
  if (prev) {
    prev.disabled = currentEp <= 1;
    prev.onclick = () => loadEpisode(Math.max(1, currentEp - 1));
  }
  if (next) {
    next.disabled = currentEp >= total;
    next.onclick = () => loadEpisode(Math.min(total, currentEp + 1));
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

function autoNextEpisode() {
  if (currentEp < (currentAnime?.episodes || 1)) {
    fallbackToast("info", "Proximo episodio em 5 segundos...");
    setTimeout(() => loadEpisode(currentEp + 1), 5000);
  }
}

window.initPlayerPage = initPlayerPage;
window.loadEpisode = loadEpisode;
window.switchServer = switchServer;
window.switchLang = switchLang;
window.autoNextEpisode = autoNextEpisode;