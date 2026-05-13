import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useLotteryTypes(includeInactive = false) {
  return useQuery<LotteryType[]>({
    queryKey: ['lottery-types', { all: includeInactive }],
    queryFn: () =>
      api
        .get('/lottery-types', { params: includeInactive ? { all: 'true' } : undefined })
        .then((r) => r.data),
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

export function useUpdateLotteryType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Partial<LotteryType>) =>
      api.patch(`/lottery-types/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lottery-types'] })
    },
  })
}

export function useUpdatePrizeRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; payout_rate?: number; max_per_number?: number | null }) =>
      api.patch(`/prize-rates/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prize-rates'] })
    },
  })
}
