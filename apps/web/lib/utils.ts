import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(buddhistEra)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('th')
dayjs.tz.setDefault('Asia/Bangkok')

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatThaiDate(date: string | Date) {
  return dayjs(date).format('D MMMM BBBB')
}

export function formatThaiDateTime(date: string | Date) {
  return dayjs(date).format('D MMM BBBB HH:mm')
}

export function formatCurrency(amount: string | number) {
  return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  })
}

/** แสดงเวลานับถอยหลังแบบ นาทีรวม:วินาที เช่น 8585:34 */
export function formatCountdownDisplay(secondsLeft: number): string {
  const totalMin = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  return `${totalMin}:${String(s).padStart(2, '0')}`
}

export { dayjs }
