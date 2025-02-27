export interface User {
  id: string
  email: string | null
  emailVerified: boolean
  notificationEmail?: string
  emailNotifications: boolean
  inAppNotifications: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  updateSettings: (settings: Partial<User>) => Promise<void>
  isEmailVerified: () => boolean
  resendVerificationEmail: () => Promise<{ success: boolean, message: string }>
  refreshUserState: () => Promise<boolean>
} 