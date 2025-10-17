import { useEffect, useState } from 'react';
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
import { AuthContext, type AuthContextType } from './AuthContextBase';

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
    const userRoles = userData?.roles?.map(r => r.toLowerCase()) ?? [];
    const staffRoles: UserRole[] = ['writer', 'editor', 'admin', 'dev', 'superuser'];
    // Derive staff from roles first; fall back to stored flag for legacy users
    return userRoles.some((r) => staffRoles.includes(r)) || (userData?.isStaff ?? false);
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
