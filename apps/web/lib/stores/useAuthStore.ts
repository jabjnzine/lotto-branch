import { create } from 'zustand'
import { UserRole } from '@lotto/shared'

interface AuthUser {
  id: string
  name: string
  role: UserRole
}

interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
  clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
}))
