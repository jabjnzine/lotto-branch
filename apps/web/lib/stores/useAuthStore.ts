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
  setToken: (token: string) => void
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  setToken: (accessToken) => set({ accessToken }),
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}))
