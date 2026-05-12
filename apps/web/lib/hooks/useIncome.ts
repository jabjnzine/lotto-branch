import { useQuery } from '@tanstack/react-query'
import api from '../api'
import { IncomeSummaryResponse } from '@lotto/shared'

export function useIncomeSummary(roundId: string | null) {
  return useQuery<IncomeSummaryResponse>({
    queryKey: ['income', 'summary', roundId],
    queryFn: () => api.get(`/income/summary?roundId=${roundId}`).then((r) => r.data),
    enabled: !!roundId,
  })
}
