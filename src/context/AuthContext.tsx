import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'driver' | 'provider' | 'admin';
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
  createdAt: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // New user, default to customer
            const newProfileData = {
              id: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email || '',
              role: 'customer',
              rating: 5,
              completedJobs: 0,
              isVerified: false,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newProfileData);
            
            // Re-fetch to get Timestamp
            const freshDoc = await getDoc(doc(db, 'users', user.uid));
            setProfile(freshDoc.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("Login request already in progress.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup.");
      } else {
        console.error("Login failed:", error);
      }
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
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, login, logout }}>
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
