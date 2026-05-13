import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export interface LotteryRound {
  id: string
  lottery_type_id: string
  draw_date: string
  open_at: string
  close_at: string
  status: string
  lottery_type: {
    id: string
    name: string
    code: string
  }
}

export function useCurrentRound(lotteryTypeId: string | null) {
  return useQuery<LotteryRound | null>({
    queryKey: ['round', 'current', lotteryTypeId],
    queryFn: () =>
      api.get(`/rounds/current?lotteryTypeId=${lotteryTypeId}`).then((r) => r.data),
    enabled: !!lotteryTypeId,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useRounds(lotteryTypeId?: string, status?: string) {
  return useQuery<LotteryRound[]>({
    queryKey: ['rounds', lotteryTypeId, status],
    queryFn: () => {
      const params = new URLSearchParams()
      if (lotteryTypeId) params.set('lotteryTypeId', lotteryTypeId)
      if (status) params.set('status', status)
      return api.get(`/rounds?${params}`).then((r) => r.data)
    },
  })
}

export function useCancelRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/rounds/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rounds'] }),
  })
}

export function useFetchThaiResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/rounds/fetch-thai').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds'] })
      qc.invalidateQueries({ queryKey: ['result'] })
    },
  })
}

export function useGenerateRounds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/rounds/generate').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds'] })
      qc.invalidateQueries({ queryKey: ['round'] })
    },
  })
}
