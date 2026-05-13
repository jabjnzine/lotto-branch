import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { CreateBetDto } from '@lotto/shared'

export interface TodayBetsSummary {
  billCount: number
  totalAmount: string
}

export function useTodayBetsSummary() {
  return useQuery<TodayBetsSummary>({
    queryKey: ['bets', 'today-summary'],
    queryFn: () => api.get('/bets/today-summary').then((r) => r.data),
  })
}

export function useBets(roundId: string | null, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['bets', roundId, page, pageSize],
    queryFn: () =>
      api
        .get(`/bets?roundId=${roundId}&page=${page}&pageSize=${pageSize}`)
        .then((r) => r.data),
    enabled: !!roundId,
  })
}

export function useCreateBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBetDto) => api.post('/bets', dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets'] }),
  })
}

export function useCancelBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets'] }),
  })
}
