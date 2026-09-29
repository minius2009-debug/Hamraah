import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'driver' | 'provider' | 'admin' | null;
  rating?: number;
  completedJobs?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  skills?: string[];
  bio?: string;
  experience?: string;
  vehicle?: string;
  photoURL?: string;
  portfolio?: string[];
  savedPlaces?: {
    home?: string;
    work?: string;
  };
  createdAt: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: 'customer' | 'provider') => Promise<void>;
  resetAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Initial fetch and setup listener
        const docRef = doc(db, 'users', user.uid);
        
        unsubscribeProfile = onSnapshot(docRef, async (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // New user or deleted doc, wait for onboarding
            const newProfileData = {
              id: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email || '',
              role: null, // Force selection
              rating: 5,
              completedJobs: 0,
              isVerified: false,
              createdAt: serverTimestamp()
            };
            await setDoc(docRef, newProfileData);
            // setProfile is handled by onSnapshot trigger
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const updateRole = async (role: 'customer' | 'provider') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role,
        updatedAt: serverTimestamp()
      });
      setProfile(prev => prev ? { ...prev, role } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const resetAccount = async () => {
    if (!user) return;
    if (!confirm("Are you sure? This will delete your current profile and roles. You will need to choose your role again.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      // onSnapshot will handle the reset
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const login = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    // Hint: For the best experience in AI Studio preview, ensure popups and 3rd party cookies are allowed.
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Detailed login error:", error);
      
      let message = "Login failed. Please try again.";
      
      if (error.code === 'auth/cancelled-popup-request') {
        message = "A login request is already in progress. Please check your open windows.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "The login window was closed before completion. Please try again and stay on the page.";
      } else if (error.code === 'auth/popup-blocked') {
        message = "The login popup was blocked by your browser.\n\nTo fix this:\n1. Click the 'Pop-up blocked' icon in your address bar.\n2. Select 'Always allow pop-ups from this site'.\n3. Refresh and try again.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network connection issue. Please check your internet and try again.";
      } else if (error.code === 'auth/internal-error' || error.message?.includes('3rd party cookies')) {
        message = "Authentication error. This usually happens if 3rd-party cookies are blocked in your browser settings.\n\nPlease enable 'Allow all cookies' or 'Allow cross-site tracking' for this preview to work correctly.";
      }
      
      alert(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, login, logout, updateRole, resetAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
