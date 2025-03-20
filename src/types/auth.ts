/**
 * Auth types
 * 
 * Defines types for authentication system and business selection
 */

import { DefaultSession, DefaultUser } from "next-auth";

/**
 * Basic user information
 * Extends NextAuth DefaultUser with app-specific fields
 */
export interface User extends DefaultUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  emailVerified?: Date | null;
  image?: string | null;
}

/**
 * Business summary for selection UI
 */
export interface BusinessSummary {
  id: string;
  title: string;
  status: 'draft' | 'completed';
  updatedAt: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  userId: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentBusinessId: string | null;
}

/**
 * Authentication context interface
 * Includes state and methods for auth management
 */
export interface AuthContextType extends AuthState {
  setCurrentBusinessId: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * Extends NextAuth Session with additional user properties
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
    } & DefaultSession["user"];
  }
} 