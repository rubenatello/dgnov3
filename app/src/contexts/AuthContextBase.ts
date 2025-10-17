import { createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, UserRole } from '../types/models';

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
