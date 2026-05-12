import { create } from 'zustand'
import { UserRole } from '@lotto/shared'

interface AuthUser {
  id: string
  name: string
  role: UserRole
}

interface AuthStore {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}))
