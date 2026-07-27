import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, UserRole } from '../types/models';
import { AuthContext, type AuthContextType } from './AuthContextBase';

interface AuthProviderProps {
  children: ReactNode;
}

let firebaseServicesPromise: Promise<{
  auth: typeof import('../config/firebase')['auth'];
  db: typeof import('../config/firebase')['db'];
  authApi: typeof import('firebase/auth');
  firestoreApi: typeof import('firebase/firestore');
}> | null = null;

const loadFirebaseServices = () => {
  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      import('../config/firebase'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([firebase, authApi, firestoreApi]) => ({
      auth: firebase.auth,
      db: firebase.db,
      authApi,
      firestoreApi,
    }));
  }

  return firebaseServicesPromise;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    let active = true;
    let started = false;
    let unsubscribe: (() => void) | undefined;
    let fallbackTimer: number | undefined;

    const removeStartListeners = () => {
      window.removeEventListener('pointerdown', startAuthentication);
      window.removeEventListener('keydown', startAuthentication);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };

    function startAuthentication() {
      if (!active || started) return;
      started = true;
      removeStartListeners();

      void loadFirebaseServices()
        .then(({ auth, db, authApi, firestoreApi }) => {
          if (!active) return;

          unsubscribe = authApi.onAuthStateChanged(auth, async (user) => {
            if (!active) return;

            setCurrentUser(user);
            if (user) {
              try {
                const userDoc = await firestoreApi.getDoc(firestoreApi.doc(db, 'users', user.uid));
                if (!active) return;
                setUserData(userDoc.exists() ? ({ id: userDoc.id, ...userDoc.data() } as User) : null);
              } catch (error) {
                console.error('Error fetching user data:', error);
                if (active) setUserData(null);
              }
            } else {
              setUserData(null);
            }
            if (active) setLoading(false);
          });
        })
        .catch((error) => {
          console.error('Error initializing authentication:', error);
          if (active) setLoading(false);
        });
    }

    const authenticationRoute = /^\/(?:login|dashboard)(?:\/|$)/.test(window.location.pathname);
    let persistedAuthHint = false;
    try {
      persistedAuthHint = Object.keys(window.localStorage)
        .some((key) => key.startsWith('firebase:authUser:'));
    } catch {
      // Storage may be unavailable in hardened privacy modes.
    }

    if (authenticationRoute || persistedAuthHint) {
      startAuthentication();
    } else {
      // Public readers should not download the Firebase authentication SDK on
      // the critical rendering path. Interaction starts it immediately; the
      // fallback still discovers signed-in staff who leave the page idle.
      window.addEventListener('pointerdown', startAuthentication, { once: true, passive: true });
      window.addEventListener('keydown', startAuthentication, { once: true });
      fallbackTimer = window.setTimeout(startAuthentication, 12_000);
    }

    return () => {
      active = false;
      removeStartListeners();
      unsubscribe?.();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    const { auth, authApi } = await loadFirebaseServices();
    await authApi.signInWithEmailAndPassword(auth, email, password);
    // User data will be fetched automatically by onAuthStateChanged
  };

  // Sign up
  const signUp = async (email: string, password: string, displayName: string) => {
    const { auth, db, authApi, firestoreApi } = await loadFirebaseServices();
    const userCredential = await authApi.createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const newUser: User = {
      id: user.uid,
      email: user.email!,
      displayName,
      roles: ['reader'], // Default role
      isStaff: false,
      isActive: true,
      createdAt: firestoreApi.Timestamp.now(),
      lastLoginAt: firestoreApi.Timestamp.now(),
    };

    await firestoreApi.setDoc(firestoreApi.doc(db, 'users', user.uid), newUser);
    setUserData(newUser);
  };

  // Sign out
  const signOut = async () => {
    const { auth, authApi } = await loadFirebaseServices();
    await authApi.signOut(auth);
    setUserData(null);
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    const userRoles = userData?.roles?.map(r => r.toLowerCase()) ?? [];
    return userRoles.includes(role.toLowerCase());
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    const userRoles = userData?.roles?.map(r => r.toLowerCase()) ?? [];
    // Superusers (and admins) implicitly satisfy any role requirement
    if (userRoles.includes('superuser') || userRoles.includes('admin')) return true;
    return roles.some((role) => userRoles.includes(role.toLowerCase()));
  };

  const isReader = () => hasRole('reader');
  const isWriter = () => hasRole('writer');
  const isEditor = () => hasRole('editor');
  const isAdmin = () => hasRole('admin');
  const isDev = () => hasRole('dev');
  const isSuperUser = () => hasRole('superuser');
  const isStaff = () => {
    const userRoles = userData?.roles ?? [];
    const staffRoles = ['writer', 'editor', 'admin', 'dev', 'superuser'];
    // Derive staff from roles first; fall back to stored flag for legacy users
    return userRoles.some((r) => staffRoles.includes(r as string)) || (userData?.isStaff ?? false);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    isReader,
    isWriter,
    isEditor,
    isAdmin,
    isDev,
    isSuperUser,
    isStaff,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
