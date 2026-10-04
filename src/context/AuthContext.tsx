import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin' | null;
  rating?: number;
  completedJobs?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  skills?: string[];
  bio?: string;
  experience?: string;
  photoURL?: string;
  createdAt: string;
  savedPlaces?: {
    home?: string;
    work?: string;
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: 'customer' | 'provider' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Fetch profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // New user, but don't create profile yet (let login handle it)
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateRole = async (role: 'customer' | 'provider' | 'admin') => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const updatedData = {
      role,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(profileRef, updatedData, { merge: true });
    // Update local state (onSnapshot could also handle this)
    setProfile(prev => prev ? { ...prev, role } : null);
  };

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const profileRef = doc(db, 'users', fbUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const newProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || 'User',
          email: fbUser.email || '',
          role: null, // Force role selection
          rating: 5,
          completedJobs: 0,
          isVerified: false,
          photoURL: fbUser.photoURL || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, {
          ...newProfile,
          createdAt: serverTimestamp()
        });
        setProfile(newProfile);
      } else {
        setProfile(profileSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggingIn, login, logout, updateRole }}>
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
