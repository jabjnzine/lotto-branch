'use client'

import { useCountdown } from '@/lib/hooks/useCountdown'
import { cn } from '@/lib/utils'

interface Props {
  closeAt: string | null | undefined
  className?: string
}

export function Countdown({ closeAt, className }: Props) {
  const { mm, ss, isUrgent, isClosed } = useCountdown(closeAt)

  if (!closeAt) {
    return <span className={cn('text-slate-400 text-sm', className)}>ไม่มีงวด</span>
  }

  if (isClosed) {
    return (
      <span className={cn('text-red-600 font-bold text-sm', className)}>
        ปิดรับแล้ว
      </span>
    )
  }

  return (
    <span
      className={cn(
        'font-mono font-bold text-base tabular-nums',
        isUrgent ? 'text-red-500 animate-pulse' : 'text-green-600',
        className,
      )}
    >
      {mm}:{ss}
    </span>
  )
}
