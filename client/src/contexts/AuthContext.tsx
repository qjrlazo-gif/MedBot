import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export type UserRole = 'nurse' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: UserRole, department?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isNurse: boolean;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('🔐 Login successful, updating lastLogin for user:', user.uid);
      
      // Update last login time with merge to preserve existing fields
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ LastLogin updated successfully');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole, 
    department?: string
  ): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        department: department || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Creating user profile in Firestore:', userProfile);
      
      try {
        await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
        console.log('User profile created successfully in Firestore');
      } catch (firestoreError) {
        console.error('Firestore profile creation failed:', firestoreError);
        throw new Error(`Failed to create user profile: ${firestoreError}`);
      }
      
      console.log('Registration successful:', user.email);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserProfile(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const fetchUserProfile = async (user: User): Promise<UserProfile> => {
    console.log('🔍 FETCH USER PROFILE START:', user.uid, user.email);
    
    // ALWAYS return a profile - never return null
    const createDefaultProfile = (): UserProfile => {
      // Use email prefix as display name if available, otherwise use a more friendly default
      const emailPrefix = user.email?.split('@')[0] || '';
      const displayName = user.displayName || emailPrefix || 'New User';
      
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName,
        role: 'admin', // Always admin
        department: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    };
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('📄 Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        console.log('✅ EXISTING PROFILE FOUND:', profileData);
        return profileData;
      } else {
        console.log('❌ NO PROFILE FOUND - CREATING DEFAULT');
        const defaultProfile = createDefaultProfile();
        
        try {
          await setDoc(doc(db, 'users', user.uid), defaultProfile);
          console.log('✅ DEFAULT PROFILE CREATED');
          return defaultProfile;
        } catch (createError) {
          console.error('❌ ERROR CREATING PROFILE:', createError);
          console.log('🔄 RETURNING DEFAULT PROFILE ANYWAY');
          return defaultProfile;
        }
      }
    } catch (error) {
      console.error('❌ FIRESTORE ERROR:', error);
      console.log('🔄 RETURNING DEFAULT PROFILE DUE TO ERROR');
      return createDefaultProfile();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed, user:', user);
      
      setLoading(true); // Set loading to true when auth state changes
      
      try {
        if (user) {
          setCurrentUser(user);
          console.log('👤 Fetching profile for user:', user.uid, user.email, user.displayName);
          
          const profile = await fetchUserProfile(user);
          console.log('📋 Profile fetched:', profile);
          
          setUserProfile(profile);
          console.log('✅ Profile set successfully:', {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            role: profile.role,
            department: profile.department
          });
        } else {
          console.log('👋 No user, clearing state');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        // Create fallback profile on error
        if (user) {
          const emailPrefix = user.email?.split('@')[0] || '';
          const displayName = user.displayName || emailPrefix || 'New User';
          
          const fallbackProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName,
            role: 'admin' as UserRole,
            department: '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
          console.log('🔄 Using fallback profile due to error:', fallbackProfile);
        }
      } finally {
        console.log('✅ Loading complete, setting loading to false');
        setLoading(false); // Always set loading to false after all operations
      }
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === 'admin';
  const isNurse = userProfile?.role === 'nurse';

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isNurse
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};