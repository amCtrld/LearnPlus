'use client';

/**
 * AuthContext and AuthProvider
 * Manages user authentication via one-time access codes
 * Provides UID and session mode throughout the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@/lib/types';

interface AuthContextType {
  uid: string | null;
  isAuthenticated: boolean;
  session: Session | null;
  updateSession: (session: Partial<Session>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUid = sessionStorage.getItem('lms_uid');
    if (storedUid) {
      setUid(storedUid);
      // In a real app, we'd fetch the session from Firestore here
      // For now, session will be loaded when user navigates to authenticated pages
    }
    setIsLoading(false);
  }, []);

  const updateSession = (updates: Partial<Session>) => {
    setSession((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const logout = () => {
    sessionStorage.removeItem('lms_uid');
    setUid(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        uid,
        isAuthenticated: !!uid,
        session,
        updateSession,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
