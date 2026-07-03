// ------------------------------------------------------------------
// PASTE YOUR FIREBASE KEYS HERE
//
// The README.md file explains step-by-step how to get these values
// (it takes about 10 minutes and is free). Until you paste them, the
// app will show a setup help screen instead of the login page.
// ------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.appspot.com',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
};

export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  String(v).includes('PASTE_')
);
