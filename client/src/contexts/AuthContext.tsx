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
      
      console.log('Login successful, updating lastLogin for user:', user.uid);
      
      // Update last login time with merge to preserve existing fields
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      console.log('LastLogin updated successfully');
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
        department,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Creating user profile in Firestore:', userProfile);
      
      try {
        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log('User profile created successfully in Firestore');
        
        // Wait a moment for Firestore to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the profile was created
        const verifyDoc = await getDoc(doc(db, 'users', user.uid));
        if (verifyDoc.exists()) {
          const data = verifyDoc.data();
          console.log('Profile verification successful:', data);
          
          // Check if all required fields are present
          const requiredFields = ['uid', 'email', 'displayName', 'role', 'createdAt', 'lastLogin'];
          const missingFields = requiredFields.filter(field => !data[field]);
          
          if (missingFields.length > 0) {
            console.error('Profile created but missing fields:', missingFields);
            console.error('Actual profile data:', data);
          } else {
            console.log('Profile created with all required fields');
          }
        } else {
          console.error('Profile verification failed - document not found after creation');
        }
      } catch (firestoreError) {
        console.error('Firestore profile creation failed:', firestoreError);
        console.error('Error details:', firestoreError);
        
        // Try to create the profile again with a simpler approach
        console.log('Retrying profile creation...');
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: role,
            department: department || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
          console.log('Retry profile creation successful');
        } catch (retryError) {
          console.error('Retry profile creation also failed:', retryError);
          throw new Error(`Failed to create user profile: ${retryError}`);
        }
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

  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      console.log('Fetching profile for user:', user.uid, user.email);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        console.log('Fetched existing user profile:', profileData);
        return profileData;
      } else {
        console.log('No user profile found for user:', user.uid, 'Creating default profile...');
        
        // Create a default profile if none exists
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          role: 'nurse', // Default role
          department: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        try {
          console.log('Attempting to create default profile:', defaultProfile);
          await setDoc(doc(db, 'users', user.uid), defaultProfile);
          console.log('Successfully created default profile');
          
          // Verify the profile was created
          const verifyDoc = await getDoc(doc(db, 'users', user.uid));
          if (verifyDoc.exists()) {
            console.log('Profile creation verified:', verifyDoc.data());
            return defaultProfile;
          } else {
            console.error('Profile creation failed - document not found after creation');
            return null;
          }
        } catch (createError) {
          console.error('Error creating default profile:', createError);
          console.error('Create error details:', createError);
          
          // If profile creation fails due to permissions, return a temporary profile
          // This allows the user to continue but they won't have persistent data
          console.log('Returning temporary profile due to creation failure');
          return defaultProfile;
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Fetch error details:', error);
      
      // If there's a permission error or network issue, create a temporary profile
      const tempProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        role: 'nurse',
        department: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      console.log('Returning temporary profile due to fetch error');
      return tempProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user);
      if (user) {
        setCurrentUser(user);
        console.log('Fetching profile for user:', user.uid, user.email, user.displayName);
        const profile = await fetchUserProfile(user);
        console.log('Setting user profile:', profile);
        setUserProfile(profile);
        
        // Additional debugging
        if (profile) {
          console.log('Profile details:', {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            role: profile.role,
            department: profile.department
          });
        } else {
          console.error('Profile is null after fetchUserProfile');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
