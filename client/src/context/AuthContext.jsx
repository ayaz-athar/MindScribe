import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken as getFirebaseIdToken,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config.js';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Monitor Firebase Auth State and Redirect Results
  useEffect(() => {
    // 1. Check for saved demo session in local development
    const savedDemoUser = localStorage.getItem('mindscribe_demo_user');
    if (savedDemoUser) {
      try {
        const user = JSON.parse(savedDemoUser);
        setCurrentUser(user);
        setIdToken(`demo-token:${user.uid}:${user.email}`);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('mindscribe_demo_user');
      }
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // 2. Handle Google redirect login if popup was blocked
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const token = await result.user.getIdToken();
          setCurrentUser(result.user);
          setIdToken(token);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result warning:', err);
      });

    // 3. Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setIdToken(token);
        } catch (err) {
          console.error('Failed to retrieve Firebase ID token:', err);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Returns a fresh Firebase ID Token
   */
  const getToken = async (forceRefresh = false) => {
    if (currentUser?.isDemo) {
      const token = `demo-token:${currentUser.uid}:${currentUser.email}`;
      setIdToken(token);
      return token;
    }

    if (auth.currentUser) {
      const token = await getFirebaseIdToken(auth.currentUser, forceRefresh);
      setIdToken(token);
      return token;
    }
    return null;
  };

  /**
   * Instant Demo / Dev Sign In
   */
  const loginAsDemoUser = (email = 'demo.user@example.com', name = 'Demo User') => {
    const demoUid = 'demo-uid-' + Math.random().toString(36).substring(2, 9);
    const demoUser = {
      uid: demoUid,
      email: email.trim(),
      displayName: name || email.split('@')[0],
      emailVerified: true,
      isDemo: true,
      photoURL: null,
    };

    localStorage.setItem('mindscribe_demo_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    const mockToken = `demo-token:${demoUid}:${demoUser.email}`;
    setIdToken(mockToken);
    return demoUser;
  };

  /**
   * Google Sign-In with Popup and Redirect fallback
   */
  const loginWithGoogle = async (useRedirect = false) => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      return loginAsDemoUser('google.user@example.com', 'Google Demo User');
    }

    if (useRedirect) {
      return signInWithRedirect(auth, googleProvider);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setIdToken(token);
      return result.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);

      // If popup was blocked by browser, try redirect flow
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        console.warn('Popup blocked, attempting redirect sign-in...');
        return signInWithRedirect(auth, googleProvider);
      }

      setAuthError(error.message);
      throw error;
    }
  };

  /**
   * Email/Password Sign-In
   */
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      return loginAsDemoUser(email || 'user@example.com', email?.split('@')[0]);
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await result.user.getIdToken();
      setIdToken(token);
      return result.user;
    } catch (error) {
      console.error('Email Login Error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  /**
   * Email/Password Sign-Up
   */
  const signupWithEmail = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      return loginAsDemoUser(email || 'new.user@example.com', email?.split('@')[0]);
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const token = await result.user.getIdToken();
      setIdToken(token);
      return result.user;
    } catch (error) {
      console.error('Sign-Up Error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    setAuthError(null);
    localStorage.removeItem('mindscribe_demo_user');
    setCurrentUser(null);
    setIdToken(null);

    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Sign-Out Error:', error);
      }
    }
  };

  const value = {
    currentUser,
    idToken,
    loading,
    authError,
    isConfigured: isFirebaseConfigured,
    getToken,
    loginAsDemoUser,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
