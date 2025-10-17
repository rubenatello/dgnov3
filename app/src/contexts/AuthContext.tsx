import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User, UserRole } from '../types/models';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Role checking functions
  isReader: () => boolean;
  isWriter: () => boolean;
  isEditor: () => boolean;
  isAdmin: () => boolean;
  isDev: () => boolean;
  isSuperUser: () => boolean;
  isStaff: () => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() } as User);
      } else {
        // User document doesn't exist yet
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // User data will be fetched automatically by onAuthStateChanged
  };

  // Sign up
  const signUp = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const newUser: User = {
      id: user.uid,
      email: user.email!,
      displayName,
      roles: ['reader'], // Default role
      isStaff: false,
      isActive: true,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', user.uid), newUser);
    setUserData(newUser);
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return userData?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const isReader = () => hasRole('reader');
  const isWriter = () => hasRole('writer');
  const isEditor = () => hasRole('editor');
  const isAdmin = () => hasRole('admin');
  const isDev = () => hasRole('dev');
  const isSuperUser = () => hasRole('superuser');
  const isStaff = () => userData?.isStaff ?? false;

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
