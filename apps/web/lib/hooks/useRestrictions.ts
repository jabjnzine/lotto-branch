import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { CreateRestrictionDto } from '@lotto/shared'

export function useRestrictions(roundId: string | null) {
  return useQuery({
    queryKey: ['restrictions', roundId],
    queryFn: () => api.get(`/rounds/${roundId}/restrictions`).then((r) => r.data),
    enabled: !!roundId,
  })
}

export function useCreateRestriction(roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRestrictionDto) =>
      api.post(`/rounds/${roundId}/restrictions`, dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restrictions', roundId] }),
  })
}

export function useDeleteRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/restrictions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restrictions'] }),
  })
}
