import { create } from "zustand";
import { auth } from "@/lib/firebaseConfig";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { User, AuthState } from '@/lib/types/user.type';

const createUserFromFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  emailNotifications: true,
  inAppNotifications: true,
});

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: createUserFromFirebaseUser(userCredential.user), isLoading: false });
    } catch (error) {
      console.error("Error signing in:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: createUserFromFirebaseUser(userCredential.user), isLoading: false });
    } catch (error) {
      console.error("Error signing up:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
  updateSettings: async (settings) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...settings } : null,
    }));
    // Here you would typically update the user profile in Firebase
    // or your own backend if you're storing additional user data
  },
}));

// Listen for auth state changes
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    useAuth.setState({ user: createUserFromFirebaseUser(firebaseUser), isLoading: false });
  } else {
    useAuth.setState({ user: null, isLoading: false });
  }
});
