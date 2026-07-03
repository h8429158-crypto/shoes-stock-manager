// DEMO mock of the firebase/auth functions used by the app.
import { demoAuth } from './demoStore';

export function getReactNativePersistence() {
  return {};
}

export function initializeAuth() {
  return demoAuth;
}

export function getAuth() {
  return demoAuth;
}

export function onAuthStateChanged(_auth, cb) {
  return demoAuth.subscribe(cb);
}

export async function signInWithEmailAndPassword(_auth, email) {
  demoAuth.signIn(email);
  return { user: demoAuth.currentUser };
}

export async function createUserWithEmailAndPassword(_auth, email) {
  demoAuth.signIn(email);
  return { user: demoAuth.currentUser };
}

export async function signOut() {
  demoAuth.signOut();
}
