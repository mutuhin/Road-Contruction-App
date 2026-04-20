// ─── FILL IN YOUR FIREBASE PROJECT CREDENTIALS ───────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open existing)
// 3. Project Settings → Your apps → Add web app → copy the config below
// 4. Enable Realtime Database: Build → Realtime Database → Create database
//    Choose "Start in test mode" (you can secure it later)
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId:             "YOUR_APP_ID"
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
