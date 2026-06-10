import { useQuery } from '@tanstack/react-query'
import api from '../api'
import { IncomeSummaryResponse } from '@lotto/shared'

export interface TodayIncome {
  totalReceived: string
  totalPayout: string
  totalHouseCommission: string
  totalAgentCommission: string
  netAmount: string
  profit: string
  isProfitable: boolean
  byType: {
    typeCode: string
    typeName: string
    received: string
    payout: string
    houseCommission: string
    agentCommission: string
    netAmount: string
    profit: string
  }[]
}

export interface HouseIncomeSummary {
  houseId: string | null
  houseName: string
  received: string
  houseCommission: string
  agentCommission: string
  netAmount: string
}

export function useTodayIncome() {
  return useQuery<TodayIncome>({
    queryKey: ['income', 'today'],
    queryFn: () => api.get('/income/today').then((r) => r.data),
  })
}

export function useIncomeSummary(roundId: string | null) {
  return useQuery<IncomeSummaryResponse>({
    queryKey: ['income', 'summary', roundId],
    queryFn: () => api.get(`/income/summary?roundId=${roundId}`).then((r) => r.data),
    enabled: !!roundId,
  })
}

export function useIncomePerHouse(roundId: string | null) {
  return useQuery<HouseIncomeSummary[]>({
    queryKey: ['income', 'per-house', roundId],
    queryFn: () => api.get(`/income/summary/per-house?roundId=${roundId}`).then((r) => r.data),
    enabled: !!roundId,
  })
}
