'use client'

import { LotteryTypeCard } from '@/components/lottery/LotteryTypeCard'
import { cn } from '@/lib/utils'
import type { LotteryType } from '@/lib/hooks/useLotteryTypes'

interface LeadingOption {
  id: string
  label: string
  subtitle?: string
  selected: boolean
  onSelect: () => void
}

interface LotteryTypeSelectorProps {
  lotteryTypes: LotteryType[]
  selectedTypeId: string | null
  onSelect: (id: string) => void
  leadingOption?: LeadingOption
}

function LeadingOptionCard({ option }: { option: LeadingOption }) {
  return (
    <button
      type="button"
      onClick={option.onSelect}
      className={cn(
        'relative h-[120px] w-[227px] shrink-0 rounded-[16px] bg-[#121212] p-5 text-left transition-all duration-200',
        'hover:brightness-110 active:scale-[0.98]',
        option.selected
          ? 'border-[3px] border-[#ff8e34] shadow-[0_0_0_1px_rgba(255,142,52,0.3)]'
          : 'border border-[#444444]',
      )}
    >
      <div className="flex h-full flex-col justify-center">
        <p className="text-base font-bold text-white">{option.label}</p>
        {option.subtitle && (
          <p className="mt-1 text-[10px] font-normal text-white/70">{option.subtitle}</p>
        )}
      </div>
    </button>
  )
}

export function LotteryTypeSelector({
  lotteryTypes,
  selectedTypeId,
  onSelect,
  leadingOption,
}: LotteryTypeSelectorProps) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2">
      {leadingOption && (
        <div className="snap-start">
          <LeadingOptionCard option={leadingOption} />
        </div>
      )}
      {lotteryTypes.map((lt) => (
        <div key={lt.id} className="snap-start">
          <LotteryTypeCard
            lotteryType={lt}
            selected={selectedTypeId === lt.id}
            onSelect={() => onSelect(lt.id)}
          />
        </div>
      ))}
    </div>
  )
}
