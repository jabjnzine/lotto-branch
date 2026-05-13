import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { CreateBetDto } from '@lotto/shared'
import { useToastStore } from '@/lib/stores/useToastStore'

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

export function useExportBets() {
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await api.get('/bets/export', {
        params: { roundId },
        responseType: 'blob',
      })
      const disposition = res.headers['content-disposition'] as string | undefined
      const filenameMatch = disposition?.match(/filename\*=UTF-8''(.+)/) ?? disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'bills.xlsx'
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: Error) => {
      toast({ title: 'ส่งออกล้มเหลว', description: err.message, variant: 'destructive' })
    },
  })
}
