import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export interface LotteryResult {
  id: string
  round_id: string
  first_prize: string | null
  three_top: string | null
  three_front: string[] | null
  three_back: string[] | null
  two_last: string | null
  is_official: boolean
  source: string
  created_at: string
}

export function useResult(roundId: string | null) {
  return useQuery<LotteryResult | null>({
    queryKey: ['result', roundId],
    queryFn: () => api.get(`/rounds/${roundId}/result`).then((r) => r.data),
    enabled: !!roundId,
  })
}

export function useSaveResult(roundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: Partial<LotteryResult>) =>
      api.post(`/rounds/${roundId}/result`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['result', roundId] })
      qc.invalidateQueries({ queryKey: ['rounds'] })
    },
  })
}
