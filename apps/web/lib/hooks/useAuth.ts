import { useQuery, useMutation } from '@tanstack/react-query'
import { UserRole } from '@lotto/shared'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import api from '../api'

interface LoginDto {
  email: string
  password: string
}

interface Profile {
  id: string
  name: string
  role: UserRole
  email: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const { accessToken, refreshToken } = await api
        .post<{ accessToken: string; refreshToken: string }>('/auth/login', dto)
        .then((r) => r.data)
      const profile = await api.get<Profile>('/auth/me').then((r) => r.data)
      setAuth(accessToken, refreshToken, profile)
      return { accessToken, refreshToken, profile }
    },
  })
}

export function useProfile() {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/auth/me').then((r) => r.data),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
