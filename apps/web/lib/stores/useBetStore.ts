import { create } from 'zustand'
import { BetType } from '@lotto/shared'

export interface BetItem {
  id: string
  number: string
  bet_type: BetType
  amount: number
}

interface BetStore {
  draftItems: BetItem[]
  activeRoundId: string | null
  activeLotteryTypeId: string | null
  addItem: (item: BetItem) => void
  removeItem: (id: string) => void
  clearItems: () => void
  setRound: (roundId: string) => void
  setLotteryType: (lotteryTypeId: string) => void
}

export const useBetStore = create<BetStore>((set) => ({
  draftItems: [],
  activeRoundId: null,
  activeLotteryTypeId: null,
  addItem: (item) => set((s) => ({ draftItems: [...s.draftItems, item] })),
  removeItem: (id) => set((s) => ({ draftItems: s.draftItems.filter((i) => i.id !== id) })),
  clearItems: () => set({ draftItems: [] }),
  setRound: (roundId) => set({ activeRoundId: roundId }),
  setLotteryType: (lotteryTypeId) => set({ activeLotteryTypeId: lotteryTypeId }),
}))
