import { useState, useEffect } from 'react'
import { dayjs } from '../utils'

export function useCountdown(closeAt: string | null | undefined) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0)

  useEffect(() => {
    if (!closeAt) return

    const tick = () => {
      const diff = dayjs(closeAt).diff(dayjs(), 'second')
      setSecondsLeft(Math.max(0, diff))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [closeAt])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300
  const isClosed = secondsLeft === 0

  return { secondsLeft, mm, ss, isUrgent, isClosed }
}
