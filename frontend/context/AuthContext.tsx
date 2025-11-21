import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void; // Changed to accept partial updates
  refreshUser: () => Promise<void>; // Added to refresh user data from API
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          console.log('🔄 Initializing auth with stored token...');
          const userData = await api.auth.getProfile();
          setUser(userData);
          console.log('✅ User initialized:', userData);
        } catch (error) {
          console.error('❌ Failed to initialize auth:', error);
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (token: string, userData: User) => {
    console.log('🔐 AuthContext login called with:', { 
      token: token ? token.substring(0, 20) + '...' : 'empty', 
      userData 
    });
    localStorage.setItem('access_token', token);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    console.log('🚪 AuthContext logout called');
    localStorage.removeItem('access_token');
    setUser(null);
    
    // Optional: Clear any other user-related storage
    // localStorage.removeItem('user_preferences');
    // sessionStorage.clear();
  };

  // Update user with partial data (supports all User fields)
  const updateUser = (userData: Partial<User>) => {
    console.log('📝 AuthContext updateUser called with:', userData);
    
    if (user) {
      // Merge existing user data with new partial data
      const updatedUser: User = {
        ...user,
        ...userData,
        // Ensure required fields are preserved
        id: user.id,
        name: userData.name || user.name,
        email: userData.email || user.email,
        skills: userData.skills || user.skills,
        profileCompletion: userData.profileCompletion || user.profileCompletion,
      };
      
      setUser(updatedUser);
      console.log('✅ User updated successfully:', updatedUser);
    } else {
      console.warn('⚠️ Cannot update user: no user is currently logged in');
    }
  };

  // Refresh user data from API
  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user data from API...');
      const userData = await api.auth.getProfile();
      setUser(userData);
      console.log('✅ User data refreshed:', userData);
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};