import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { CreateBetDto } from '@lotto/shared'
import { useToastStore } from '@/lib/stores/useToastStore'

export interface RoundSummary {
  totalBets: number
  wonCount: number
  lostCount: number
  cancelledCount: number
  totalReceived: number
  totalPayout: number
  profit: number
}

export interface TodayBetsSummary {
  billCount: number
  totalAmount: string
}

export function useRoundSummary(roundId: string | null) {
  return useQuery<RoundSummary>({
    queryKey: ['bets', 'round-summary', roundId],
    queryFn: () => api.get(`/bets/round-summary/${roundId}`).then((r) => r.data),
    enabled: !!roundId,
  })
}

export interface TodayAllBets {
  date: string
  totalBets: number
  totalAmount: number
  page: number
  pageSize: number
  totalPages: number
  groups: Array<{
    typeId: string
    typeName: string
    typeCode: string
    roundId: string
    drawDate: string
    bets: Array<{
      id: string
      created_at: string
      buyer_name?: string | null
      note?: string | null
      total_amount: string
      status: string
      items: Array<{ id: string; number: string; bet_type: string; amount: string; payout_rate?: string }>
    }>
    totalAmount: number
    betCount: number
    itemCount: number
  }>
}

export function useTodayAllBets(page = 1, pageSize = 20, search?: string) {
  return useQuery<TodayAllBets>({
    queryKey: ['bets', 'today-all', page, pageSize, search],
    queryFn: () => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      return api.get(`/bets/today-all?page=${page}&pageSize=${pageSize}${searchParam}`).then((r) => r.data)
    },
  })
}

export function useTodayBetsSummary() {
  return useQuery<TodayBetsSummary>({
    queryKey: ['bets', 'today-summary'],
    queryFn: () => api.get('/bets/today-summary').then((r) => r.data),
  })
}

export function useBets(roundId: string | null, page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ['bets', roundId, page, pageSize, search],
    queryFn: () => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      return api
        .get(`/bets?roundId=${roundId}&page=${page}&pageSize=${pageSize}${searchParam}`)
        .then((r) => r.data)
    },
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

export function useCalculateWinners() {
  const qc = useQueryClient()
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: (roundId: string) => api.post(`/bets/calculate/${roundId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] })
      qc.invalidateQueries({ queryKey: ['income'] })
      toast({ title: 'คำนวณเสร็จสิ้น', description: 'คำนวณถูก-ผิดเรียบร้อยแล้ว', variant: 'success' })
    },
    onError: (err: Error) => {
      toast({ title: 'คำนวณล้มเหลว', description: err.message, variant: 'destructive' })
    },
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
