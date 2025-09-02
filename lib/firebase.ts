import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function hasFirebaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

export function getFirebase() {
  if (!hasFirebaseConfig()) {
    return { app: null, auth: null, db: null };
  }
  if (!app) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    } as const;
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0]!;
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db } as { app: FirebaseApp; auth: Auth; db: Firestore } | { app: null; auth: null; db: null };
}

export async function ensureAnonymousUser() {
  const { auth } = getFirebase();
  if (!auth) return;
  if (!auth.currentUser) await signInAnonymously(auth);
}
