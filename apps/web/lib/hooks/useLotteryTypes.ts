import { useQuery } from '@tanstack/react-query'
import api from '../api'

export interface LotteryType {
  id: string
  name: string
  code: string
  draw_time: string
  draw_schedule_type: string
  draw_days: number[] | string[]
  result_structure: string
  close_before_minutes: number
  is_active: boolean
}

export function useLotteryTypes() {
  return useQuery<LotteryType[]>({
    queryKey: ['lottery-types'],
    queryFn: () => api.get('/lottery-types').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePrizeRates(lotteryTypeId: string | null) {
  return useQuery({
    queryKey: ['prize-rates', lotteryTypeId],
    queryFn: () =>
      api.get(`/lottery-types/${lotteryTypeId}/prize-rates`).then((r) => r.data),
    enabled: !!lotteryTypeId,
    staleTime: 5 * 60 * 1000,
  })
}
