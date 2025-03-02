/**
 * Auth types
 * 
 * Defines types for authentication system and business selection
 */

/**
 * Basic user information
 */
export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
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