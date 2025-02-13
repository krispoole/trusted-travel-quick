import { create } from "zustand"

interface User {
  id: string
  email: string
  notificationEmail?: string
  emailNotifications: boolean
  inAppNotifications: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  updateSettings: (settings: Partial<User>) => void
}

// Stub auth store - will be replaced with Firebase later
export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    set({
      user: {
        id: "1",
        email,
        emailNotifications: true,
        inAppNotifications: true,
      },
      isLoading: false,
    })
  },
  signOut: () => {
    set({ user: null })
  },
  updateSettings: (settings) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...settings } : null,
    }))
  },
}))

