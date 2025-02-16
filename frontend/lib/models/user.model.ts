export interface User {
  id: string
  email: string | null
  notificationEmail?: string
  emailNotifications: boolean
  inAppNotifications: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateSettings: (settings: Partial<User>) => Promise<void>
} 