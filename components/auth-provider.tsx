'use client';

/**
 * AuthContext and AuthProvider
 * Manages user authentication via one-time access codes
 * Provides UID and session mode throughout the application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@/lib/types';

interface AuthContextType {
  uid: string | null;
  isAuthenticated: boolean;
  session: Session | null;
  login: (uid: string) => void;
  updateSession: (updates: Partial<Session>) => void;
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
      // Ensure cookies are in sync with sessionStorage
      document.cookie = `auth-token=${storedUid}; path=/; SameSite=Strict`;
      document.cookie = `user-id=${storedUid}; path=/; SameSite=Strict`;
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newUid: string) => {
    sessionStorage.setItem('lms_uid', newUid);
    document.cookie = `auth-token=${newUid}; path=/; SameSite=Strict`;
    document.cookie = `user-id=${newUid}; path=/; SameSite=Strict`;
    setUid(newUid);
    setSession({
      uid: newUid,
      mode: null as any,
      startTime: new Date(),
      currentProblemId: 1,
      completedProblems: [],
    });
  }, []);

  const updateSession = useCallback((updates: Partial<Session>) => {
    setSession((prev) => {
      if (prev) return { ...prev, ...updates };
      // If no session yet, create one with the updates
      return { uid: uid || '', mode: null as any, startTime: new Date(), currentProblemId: 1, completedProblems: [], ...updates };
    });
  }, [uid]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('lms_uid');
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = 'user-id=; path=/; max-age=0';
    setUid(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        uid,
        isAuthenticated: !!uid,
        session,
        login,
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
