import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = window.AnimeAuth?.db;
const authApi = window.AnimeAuth;

let state = {
  animes: [],
  episodes: [],
  selectedAnimeId: "",
  bannerIds: [],
  editingAnimeId: "",
  editingEpisodeId: ""
};

const el = (id) => document.getElementById(id);

function toast(type, message) {
  const wrap = el("toastWrap");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = `toast ${type || "info"}`;
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

async function isAdminEmail(email) {
  const hardcodedAdmins = ["admin@animestream.com"];
  if (hardcodedAdmins.includes((email || "").toLowerCase())) return true;
  try {
    const ref = doc(db, "settings", "admins");
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const admins = snap.data()?.emails || [];
    return admins.map(e => String(e).toLowerCase()).includes(String(email).toLowerCase());
  } catch {
    return false;
  }
}

async function guardAdmin() {
  const current = authApi?.currentUser;
  if (current) {
    return isAdminEmail(current.email).then((ok) => {
      if (!ok) {
        toast("error", "Acesso negado: usuario nao admin.");
        setTimeout(() => window.location.href = "../index.html", 800);
      }
      return ok;
    });
  }
  return new Promise((resolve) => {
    document.addEventListener("authReady", async (ev) => {
      const user = ev.detail?.user || authApi?.currentUser;
      if (!user) {
        window.location.href = "../index.html";
        resolve(false);
        return;
      }
      const ok = await isAdminEmail(user.email);
      if (!ok) {
        toast("error", "Acesso negado: usuario nao admin.");
        setTimeout(() => window.location.href = "../index.html", 800);
        resolve(false);
        return;
      }
      resolve(true);
    }, { once: true });
  });
}

function bindTabs() {
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      el(`panel-${tab}`)?.classList.add("active");
    });
  });
}

function animePayloadFromForm() {
  const title = el("title").value.trim();
  const payload = {
    title,
    titleJp: el("titleJp").value.trim(),
    cover: el("cover").value.trim(),
    banner: el("banner").value.trim(),
    genre: el("genres").value.split(",").map(s => s.trim()).filter(Boolean),
    year: Number(el("year").value || 0),
    rating: Number(el("rating").value || 0),
    episodes: Number(el("episodes").value || 0),
    status: el("status").value,
    dub: el("dub").checked,
    sub: el("sub").checked,
    description: el("description").value.trim(),
    tags: el("tags").value.split(",").map(s => s.trim()).filter(Boolean),
    currentEp: 1
  };
  return payload;
}

function resetAnimeForm() {
  el("animeForm").reset();
  el("animeId").value = "";
  state.editingAnimeId = "";
  el("animeFormTitle").textContent = "Adicionar anime";
}

function fillAnimeForm(anime) {
  el("animeId").value = anime.id;
  state.editingAnimeId = anime.id;
  el("title").value = anime.title || "";
  el("titleJp").value = anime.titleJp || "";
  el("cover").value = anime.cover || "";
  el("banner").value = anime.banner || "";
  el("genres").value = (anime.genre || []).join(", ");
  el("year").value = anime.year || "";
  el("rating").value = anime.rating || "";
  el("episodes").value = anime.episodes || "";
  el("status").value = anime.status || "Em exibicao";
  el("dub").checked = !!anime.dub;
  el("sub").checked = !!anime.sub;
  el("description").value = anime.description || "";
  el("tags").value = (anime.tags || []).join(", ");
  el("animeFormTitle").textContent = `Editando: ${anime.title}`;
}

async function loadAnimes() {
  const q = query(collection(db, "animes"), orderBy("title"));
  const snap = await getDocs(q);
  state.animes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAnimeTable();
  renderAnimeSelect();
  renderBannerChecks();
}

function renderAnimeTable() {
  const body = el("animeTableBody");
  body.innerHTML = state.animes.map((a) => `
    <tr>
      <td>${a.title || "-"}</td>
      <td>${a.year || "-"}</td>
      <td>${a.status || "-"}</td>
      <td>${a.rating || "-"}</td>
      <td>${a.episodes || 0}</td>
      <td>
        <div class="inline-actions">
          <button class="admin-btn" data-edit-anime="${a.id}">Editar</button>
          <button class="admin-btn danger" data-del-anime="${a.id}">Deletar</button>
        </div>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit-anime]").forEach((b) => {
    b.addEventListener("click", () => {
      const anime = state.animes.find(x => x.id === b.dataset.editAnime);
      if (anime) fillAnimeForm(anime);
    });
  });
  body.querySelectorAll("[data-del-anime]").forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.dataset.delAnime;
      if (!confirm("Deletar anime? Esta acao nao remove episodios automaticamente.")) return;
      await deleteDoc(doc(db, "animes", id));
      toast("success", "Anime deletado.");
      await loadAll();
    });
  });
}

function renderAnimeSelect() {
  const select = el("episodeAnimeSelect");
  select.innerHTML = `<option value="">Selecione...</option>` + state.animes.map((a) =>
    `<option value="${a.id}" ${a.id === state.selectedAnimeId ? "selected" : ""}>${a.title}</option>`
  ).join("");
}

async function loadEpisodes(animeId) {
  if (!animeId) {
    state.episodes = [];
    renderEpisodeTable();
    return;
  }
  state.selectedAnimeId = animeId;
  const q = query(collection(db, "animes", animeId, "episodes"), orderBy("number"));
  const snap = await getDocs(q);
  state.episodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderEpisodeTable();
}

function renderEpisodeTable() {
  const body = el("episodeTableBody");
  body.innerHTML = state.episodes.map((ep) => `
    <tr>
      <td>${ep.number || "-"}</td>
      <td>${ep.title || "-"}</td>
      <td>${(ep.servers || []).length}</td>
      <td>
        <div class="inline-actions">
          <button class="admin-btn" data-edit-ep="${ep.id}">Editar</button>
          <button class="admin-btn danger" data-del-ep="${ep.id}">Deletar</button>
        </div>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit-ep]").forEach((b) => {
    b.addEventListener("click", () => {
      const ep = state.episodes.find(x => x.id === b.dataset.editEp);
      if (!ep) return;
      state.editingEpisodeId = ep.id;
      el("episodeDocId").value = ep.id;
      el("epNumber").value = ep.number || "";
      el("epTitle").value = ep.title || "";
      el("epServers").value = JSON.stringify(ep.servers || [], null, 2);
      el("episodeFormTitle").textContent = `Editando episodio #${ep.number}`;
    });
  });
  body.querySelectorAll("[data-del-ep]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (!state.selectedAnimeId) return;
      if (!confirm("Deletar episodio?")) return;
      await deleteDoc(doc(db, "animes", state.selectedAnimeId, "episodes", b.dataset.delEp));
      toast("success", "Episodio deletado.");
      await loadEpisodes(state.selectedAnimeId);
      await updateAnimeEpisodeCount(state.selectedAnimeId);
    });
  });
}

function resetEpisodeForm() {
  el("episodeForm").reset();
  state.editingEpisodeId = "";
  el("episodeDocId").value = "";
  el("episodeFormTitle").textContent = "Adicionar episodio";
}

function renderBannerChecks() {
  const wrap = el("bannerCheckList");
  wrap.innerHTML = state.animes.map((a) => `
    <label class="check-item">
      <input type="checkbox" value="${a.id}" ${state.bannerIds.includes(a.id) ? "checked" : ""}>
      <div>
        <div>${a.title}</div>
        <div class="muted">${a.status || ""} • ${a.year || ""}</div>
      </div>
    </label>
  `).join("");
}

async function loadBannerSettings() {
  const snap = await getDoc(doc(db, "settings", "banners"));
  state.bannerIds = snap.exists() ? (snap.data().animeIds || []) : [];
  renderBannerChecks();
}

async function updateAnimeEpisodeCount(animeId) {
  const snap = await getDocs(collection(db, "animes", animeId, "episodes"));
  await updateDoc(doc(db, "animes", animeId), { episodes: snap.size });
}

async function loadDashboard() {
  const animesSnap = await getDocs(collection(db, "animes"));
  const usersSnap = await getDocs(collection(db, "users"));
  let episodesTotal = 0;
  for (const animeDoc of animesSnap.docs) {
    const eps = await getDocs(collection(db, "animes", animeDoc.id, "episodes"));
    episodesTotal += eps.size;
  }
  el("statAnimes").textContent = animesSnap.size;
  el("statEps").textContent = episodesTotal;
  el("statUsers").textContent = usersSnap.size;
}

function bindActions() {
  el("refreshAllBtn").addEventListener("click", async () => {
    await loadAll();
    toast("success", "Dados atualizados.");
  });
  el("logoutAdminBtn").addEventListener("click", async () => {
    await authApi.logout();
  });
  el("cancelAnimeEdit").addEventListener("click", resetAnimeForm);
  el("cancelEpisodeEdit").addEventListener("click", resetEpisodeForm);

  el("animeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = animePayloadFromForm();
    if (!payload.title) {
      toast("error", "Titulo obrigatorio.");
      return;
    }
    if (state.editingAnimeId) {
      await updateDoc(doc(db, "animes", state.editingAnimeId), payload);
      toast("success", "Anime atualizado.");
    } else {
      const id = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      await setDoc(doc(db, "animes", id || `anime-${Date.now()}`), payload, { merge: true });
      toast("success", "Anime criado.");
    }
    resetAnimeForm();
    await loadAll();
  });

  el("episodeAnimeSelect").addEventListener("change", async (e) => {
    await loadEpisodes(e.target.value);
  });

  el("episodeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.selectedAnimeId) {
      toast("error", "Selecione um anime primeiro.");
      return;
    }
    let servers = [];
    try {
      const raw = el("epServers").value.trim();
      servers = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(servers)) throw new Error("invalid");
    } catch {
      toast("error", "Servers JSON invalido.");
      return;
    }
    const payload = {
      number: Number(el("epNumber").value || 1),
      title: el("epTitle").value.trim(),
      servers
    };
    if (!payload.title) {
      toast("error", "Titulo do episodio obrigatorio.");
      return;
    }
    if (state.editingEpisodeId) {
      await updateDoc(doc(db, "animes", state.selectedAnimeId, "episodes", state.editingEpisodeId), payload);
      toast("success", "Episodio atualizado.");
    } else {
      await addDoc(collection(db, "animes", state.selectedAnimeId, "episodes"), payload);
      toast("success", "Episodio adicionado.");
    }
    resetEpisodeForm();
    await loadEpisodes(state.selectedAnimeId);
    await updateAnimeEpisodeCount(state.selectedAnimeId);
    await loadDashboard();
  });

  el("saveBannersBtn").addEventListener("click", async () => {
    const ids = Array.from(document.querySelectorAll("#bannerCheckList input[type='checkbox']:checked")).map(c => c.value);
    await setDoc(doc(db, "settings", "banners"), { animeIds: ids }, { merge: true });
    state.bannerIds = ids;
    toast("success", "Banners salvos.");
  });
}

async function loadAll() {
  await loadAnimes();
  await loadBannerSettings();
  await loadDashboard();
  if (state.selectedAnimeId) {
    await loadEpisodes(state.selectedAnimeId);
  } else {
    renderEpisodeTable();
  }
}

async function init() {
  if (!db || !authApi) {
    alert("Firebase nao inicializado.");
    return;
  }
  bindTabs();
  bindActions();
  const ok = await guardAdmin();
  if (!ok) return;
  await loadAll();
}

document.addEventListener("DOMContentLoaded", init);