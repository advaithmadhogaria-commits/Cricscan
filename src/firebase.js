import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKkL2WvMwgY53QysMwqbUNiSDiooN9lO8",
  authDomain: "cricscan-5ff75.firebaseapp.com",
  projectId: "cricscan-5ff75",
  storageBucket: "cricscan-5ff75.firebasestorage.app",
  messagingSenderId: "164600531737",
  appId: "1:164600531737:web:ba706a245a2a8f9b6e1388",
  measurementId: "G-4CLKV72RGX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// ── LIVE MATCH (localStorage) ─────────────────────────────────────────────────
export const saveLiveMatch = (match) => {
  try { localStorage.setItem("cricscan_live", JSON.stringify(match)); } catch {}
};
export const getLiveMatch = () => {
  try {
    const s = localStorage.getItem("cricscan_live");
    if (!s) return null;
    const p = JSON.parse(s);
    if (p && !p.ended && p.teams?.length === 2 && p.striker && p.currentBowler) return p;
    localStorage.removeItem("cricscan_live");
  } catch { localStorage.removeItem("cricscan_live"); }
  return null;
};
export const clearLiveMatch = () => { try { localStorage.removeItem("cricscan_live"); } catch {} };

// ── MATCH HISTORY (Firestore + localStorage fallback) ─────────────────────────
export const saveMatch = async (record, userId, userEmail) => {
  // Always save locally
  try {
    const prev = JSON.parse(localStorage.getItem("cricscan_history") || "[]");
    prev.push(record);
    localStorage.setItem("cricscan_history", JSON.stringify(prev));
  } catch {}
  // Save to Firestore if logged in
  if (userId) {
    try {
      await addDoc(collection(db, "matches"), { ...record, userId, userEmail, createdAt: new Date().toISOString() });
    } catch (e) { console.log("Firestore save failed, saved locally", e); }
  }
};

export const getMatchHistory = async (userId) => {
  let local = [];
  try { local = JSON.parse(localStorage.getItem("cricscan_history") || "[]").reverse(); } catch {}
  if (!userId) return local;
  try {
    const q = query(collection(db, "matches"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const cloud = snap.docs.map(d => ({ ...d.data(), firestoreId: d.id }));
    const cloudIds = new Set(cloud.map(r => String(r.id)));
    const localOnly = local.filter(r => !cloudIds.has(String(r.id)));
    return [...cloud, ...localOnly];
  } catch (e) {
    console.log("Firestore fetch failed, using local", e);
    return local;
  }
};

export const deleteMatch = async (id, firestoreId) => {
  try {
    const prev = JSON.parse(localStorage.getItem("cricscan_history") || "[]");
    localStorage.setItem("cricscan_history", JSON.stringify(prev.filter(r => r.id !== id)));
  } catch {}
  if (firestoreId) {
    try { await deleteDoc(doc(db, "matches", firestoreId)); } catch {}
  }
};
