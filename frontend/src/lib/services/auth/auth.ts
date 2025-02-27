import { create } from "zustand";
import { auth } from "@/config/firebase.config";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { User, AuthState } from "@/lib/types/auth/user.type";
import { useLocations } from "@/lib/stores/locations.store";
import { getFunctions, httpsCallable } from "firebase/functions";

const createUserFromFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  emailVerified: firebaseUser.emailVerified,
  emailNotifications: true,
  inAppNotifications: true,
});

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ 
        user: createUserFromFirebaseUser(userCredential.user), 
        isLoading: false 
      });
      return userCredential.user.emailVerified;
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
      
      // User is created but email is not verified yet
      set({ 
        user: createUserFromFirebaseUser(userCredential.user), 
        isLoading: false 
      });
      
      return false; // Email not verified yet
    } catch (error) {
      console.error("Error signing up:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      // Clear locations when user signs out
      useLocations.getState().clearLocations();
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
  isEmailVerified: () => {
    const user = get().user;
    return user?.emailVerified || false;
  },
  resendVerificationEmail: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No user is currently signed in");
      }
      
      // Call the Cloud Function to resend verification email
      const functions = getFunctions();
      const resendVerificationEmailFn = httpsCallable(functions, 'resendVerificationEmail');
      const result = await resendVerificationEmailFn();
      
      return result.data as { success: boolean, message: string };
    } catch (error) {
      console.error("Error resending verification email:", error);
      throw error;
    }
  },
  refreshUserState: async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force refresh the token to get the latest claims
        await currentUser.reload();
        set({ 
          user: createUserFromFirebaseUser(currentUser),
          isLoading: false
        });
        return currentUser.emailVerified;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing user state:", error);
      return false;
    }
  }
}));

// Only initialize auth listener in browser environment
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      useAuth.setState({ 
        user: createUserFromFirebaseUser(firebaseUser), 
        isLoading: false 
      });
    } else {
      useAuth.setState({ user: null, isLoading: false });
    }
  });
}
