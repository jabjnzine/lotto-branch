'use client'

import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useCountdown } from '@/lib/hooks/useCountdown'
import { cn, formatCountdownDisplay, formatThaiDate } from '@/lib/utils'
import type { LotteryType } from '@/lib/hooks/useLotteryTypes'

interface LotteryTypeCardProps {
  lotteryType: LotteryType
  selected: boolean
  onSelect: () => void
}

function LotteryFlag({ code }: { code: string }) {
  const isThai = code === 'TH'

  return (
    <span className="absolute left-[161px] top-5 size-[41px] overflow-hidden rounded-full ring-1 ring-white/10">
      {isThai ? (
        <span className="block size-full">
          <span className="block h-[16%] bg-[#d01c1f]" />
          <span className="block h-[16%] bg-white" />
          <span className="block h-[36%] bg-[#241d63]" />
          <span className="block h-[16%] bg-white" />
          <span className="block h-[16%] bg-[#d01c1f]" />
        </span>
      ) : (
        <span className="relative block size-full bg-[#d51f34]">
          <span className="absolute inset-x-0 top-[26%] h-[48%] bg-[#1e3a8a]" />
          <span className="absolute left-1/2 top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </span>
      )}
    </span>
  )
}

export function LotteryTypeCard({ lotteryType, selected, onSelect }: LotteryTypeCardProps) {
  const { data: round } = useCurrentRound(lotteryType.id)
  const { secondsLeft, isClosed } = useCountdown(round?.close_at)

  const drawLabel = round ? formatThaiDate(round.draw_date) : '—'
  const countdownLabel = !round
    ? 'ไม่มีงวด'
    : isClosed
      ? 'ปิดรับแล้ว'
      : formatCountdownDisplay(secondsLeft)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative h-[120px] w-[227px] shrink-0 rounded-[16px] bg-[#121212] text-left transition-all duration-200',
        'hover:brightness-110 active:scale-[0.98]',
        selected
          ? 'border-[3px] border-[#ff8e34] shadow-[0_0_0_1px_rgba(255,142,52,0.3)]'
          : 'border border-[#444444]',
      )}
    >
      <p className="absolute left-[25px] top-5 max-w-[128px] truncate text-base font-bold leading-none text-white">
        {lotteryType.name}
      </p>
      <p className="absolute left-[25px] top-[42px] whitespace-nowrap text-[10px] font-normal leading-none text-white">
        งวด {drawLabel}
      </p>
      <p className="absolute left-[25px] top-[74px] whitespace-nowrap text-[10px] font-normal leading-none text-white">
        ปิดรับใน
      </p>
      <p
        className={cn(
          'absolute left-[25px] top-[88px] whitespace-nowrap text-base font-bold leading-none tabular-nums',
          isClosed || !round ? 'text-red-400' : 'text-[#ff8e34]',
        )}
      >
        {countdownLabel}
      </p>
      <LotteryFlag code={lotteryType.code} />
    </button>
  )
}
