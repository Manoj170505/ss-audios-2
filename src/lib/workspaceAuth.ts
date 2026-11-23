import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
] as const;

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of WORKSPACE_SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'select_account' });

// Strict in-memory token cache (never written to localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

export function initWorkspaceAuth(
  onAuthSuccess?: (user: User, accessToken: string) => void,
  onAuthSignedOut?: () => void,
) {
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      cachedIdToken = null;
      onAuthSignedOut?.();
    }
  });
}

export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string;
  idToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Workspace access token from sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    cachedIdToken = await result.user.getIdToken();
    return {
      user: result.user,
      accessToken: cachedAccessToken,
      idToken: cachedIdToken,
    };
  } finally {
    isSigningIn = false;
  }
}

export function getWorkspaceAccessToken(): string | null {
  return cachedAccessToken;
}

export function getFirebaseIdToken(): string | null {
  return cachedIdToken;
}

export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser;
}

export async function signOutGoogleWorkspace(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
  cachedIdToken = null;
}
