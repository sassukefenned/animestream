// ============================================
// ANIMESTREAM — Firebase Config & Auth
// ============================================
// Replace with your Firebase project config:

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ============================================
// FIREBASE INITIALIZATION
// ============================================
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged,
         signInWithPopup, signOut,
         GoogleAuthProvider,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword }             from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc,
         updateDoc, arrayUnion, arrayRemove,
         collection, query, orderBy,
         limit, getDocs, increment,
         serverTimestamp }                        from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ============================================
// AUTH STATE
// ============================================
let currentUser = null;
let userProfile = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    userProfile = await loadUserProfile(user);
    updateNavUI(user, userProfile);
    document.dispatchEvent(new CustomEvent('authReady', { detail: { user, profile: userProfile } }));
  } else {
    userProfile = null;
    updateNavUI(null, null);
    document.dispatchEvent(new CustomEvent('authReady', { detail: null }));
  }
});

async function loadUserProfile(user) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  // Create new profile
  const profile = {
    uid:       user.uid,
    email:     user.email,
    name:      user.displayName || user.email.split('@')[0],
    photo:     user.photoURL || '',
    isVIP:     false,
    plan:      'free',
    favorites: [],
    watchHistory: [],
    dailyWatchSeconds: 0,
    dailyWatchDate:    new Date().toDateString(),
    createdAt: serverTimestamp()
  };
  await setDoc(ref, profile);
  return profile;
}

function updateNavUI(user, profile) {
  const loginBtn   = document.getElementById('loginBtn');
  const userMenu   = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  const vipBadge   = document.getElementById('vipBadge');

  if (user && profile) {
    if (loginBtn)   loginBtn.style.display   = 'none';
    if (userMenu)   userMenu.style.display   = 'flex';
    if (userAvatar) userAvatar.src           = profile.photo || `https://ui-avatars.com/api/?name=${profile.name}&background=b429f9&color=fff`;
    if (vipBadge)   vipBadge.style.display   = profile.isVIP ? 'flex' : 'none';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// ============================================
// AUTH METHODS
// ============================================
async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    showToast('success', '✓ Login realizado com sucesso!');
    closeModal('authModal');
  } catch (e) {
    showToast('error', 'Erro ao fazer login: ' + e.message);
  }
}

async function loginWithDiscord() {
  // Discord OAuth via Cloudflare Worker redirect
  window.location.href = '/api/discord-auth';
}

async function loginWithEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('success', '✓ Login realizado!');
    closeModal('authModal');
  } catch (e) {
    showToast('error', 'Credenciais inválidas');
  }
}

async function registerWithEmail(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, 'users', cred.user.uid), { name });
    showToast('success', '✓ Conta criada com sucesso!');
    closeModal('authModal');
  } catch (e) {
    showToast('error', 'Erro ao criar conta: ' + e.message);
  }
}

async function logout() {
  await signOut(auth);
  showToast('info', 'Até mais!');
  window.location.href = '/';
}

// ============================================
// FAVORITES
// ============================================
async function toggleFavorite(animeId, animeData) {
  if (!currentUser) {
    openModal('authModal');
    showToast('info', 'Faça login para favoritar');
    return false;
  }
  const ref = doc(db, 'users', currentUser.uid);
  const isFav = userProfile.favorites?.includes(animeId);

  if (isFav) {
    await updateDoc(ref, { favorites: arrayRemove(animeId) });
    userProfile.favorites = userProfile.favorites.filter(id => id !== animeId);
    showToast('info', 'Removido dos favoritos');
    return false;
  } else {
    await updateDoc(ref, { favorites: arrayUnion(animeId) });
    // Store minimal data for favorites page
    await setDoc(doc(db, 'users', currentUser.uid, 'favoritesData', animeId), animeData);
    userProfile.favorites = [...(userProfile.favorites || []), animeId];
    showToast('success', '♥ Adicionado aos favoritos');
    return true;
  }
}

function isFavorite(animeId) {
  return userProfile?.favorites?.includes(animeId) || false;
}

// ============================================
// WATCH PROGRESS
// ============================================
async function saveProgress(animeId, episodeId, progress, duration) {
  if (!currentUser) return;
  const key = `${animeId}_${episodeId}`;
  await setDoc(doc(db, 'users', currentUser.uid, 'progress', key), {
    animeId, episodeId, progress, duration,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function getProgress(animeId, episodeId) {
  if (!currentUser) return 0;
  const key = `${animeId}_${episodeId}`;
  const snap = await getDoc(doc(db, 'users', currentUser.uid, 'progress', key));
  return snap.exists() ? snap.data().progress : 0;
}

async function addToHistory(animeId, animeData, episodeId) {
  if (!currentUser) return;
  const ref = doc(db, 'users', currentUser.uid);
  await updateDoc(ref, {
    watchHistory: arrayUnion({ animeId, episodeId, watchedAt: new Date().toISOString() })
  });
  // Update view count
  await setDoc(doc(db, 'animes', animeId), { views: increment(1) }, { merge: true });
}

// ============================================
// DAILY LIMIT (for non-logged users)
// ============================================
const DAILY_LIMIT_SECONDS = 7200; // 2 hours

function checkGuestLimit() {
  if (currentUser) return true; // No limit for logged users
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('guestWatch') || '{}');
  if (stored.date !== today) {
    localStorage.setItem('guestWatch', JSON.stringify({ date: today, seconds: 0 }));
    return true;
  }
  return stored.seconds < DAILY_LIMIT_SECONDS;
}

function incrementGuestWatch(seconds) {
  if (currentUser) return;
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('guestWatch') || '{}');
  const current = stored.date === today ? stored.seconds : 0;
  const newSeconds = current + seconds;
  localStorage.setItem('guestWatch', JSON.stringify({ date: today, seconds: newSeconds }));
  if (newSeconds >= DAILY_LIMIT_SECONDS) {
    showLimitPopup();
  }
}

function showLimitPopup() {
  openModal('limitPopup');
}

// ============================================
// VIP SYSTEM
// ============================================
async function checkVIPStatus(userId) {
  const snap = await getDoc(doc(db, 'vipUsers', userId));
  if (snap.exists()) {
    const data = snap.data();
    if (data.expiresAt.toDate() > new Date()) {
      await updateDoc(doc(db, 'users', userId), { isVIP: true, plan: 'vip' });
      return true;
    }
  }
  return false;
}

// ============================================
// EXPORT
// ============================================
window.AnimeAuth = {
  loginWithGoogle,
  loginWithDiscord,
  loginWithEmail,
  registerWithEmail,
  logout,
  toggleFavorite,
  isFavorite,
  saveProgress,
  getProgress,
  addToHistory,
  checkGuestLimit,
  incrementGuestWatch,
  get currentUser() { return currentUser; },
  get userProfile() { return userProfile; },
  db, auth
};
