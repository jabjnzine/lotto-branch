import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
} as const

export function AppLogo({ size = 'md', showText = true, className }: AppLogoProps) {
  const px = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-xl"
        style={{ width: px, height: px }}
      >
        <Image
          src="/logo.png"
          alt="ระบบหวย"
          width={px}
          height={px}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {showText && (
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight">ระบบหวย</h2>
          <p className="text-xs text-primary font-medium">Back Office</p>
        </div>
      )}
    </div>
  )
}
