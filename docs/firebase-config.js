// ─── FILL IN YOUR FIREBASE PROJECT CREDENTIALS ───────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open existing)
// 3. Project Settings → Your apps → Add web app → copy the config below
// 4. Enable Realtime Database: Build → Realtime Database → Create database
//    Choose "Start in test mode" (you can secure it later)
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey:            "AIzaSyAqxuRTPv8mmpACGzlmCTv0_qkIBx2-89U",
    authDomain:        "road-bb205.firebaseapp.com",
    databaseURL:       "https://road-bb205-default-rtdb.firebaseio.com",
    projectId:         "road-bb205",
    storageBucket:     "road-bb205.firebasestorage.app",
    messagingSenderId: "103059548552",
    appId:             "1:103059548552:web:50d8016fdc9cd4a9b4b23d"
};

try {
    firebase.initializeApp(firebaseConfig);
    window.firebaseDB = firebase.database();
    window.firebaseReady = true;
} catch (e) {
    window.firebaseDB = null;
    window.firebaseReady = false;
    console.warn('Firebase not configured — using local storage only.', e);
}
