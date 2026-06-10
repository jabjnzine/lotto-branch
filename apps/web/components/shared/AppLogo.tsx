import { cn } from '@/lib/utils'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: 30,
  md: 42,
  lg: 64,
} as const

export function AppLogo({ size = 'md', showText = true, className }: AppLogoProps) {
  const px = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: px, height: px }}
      >
        <img
          src="/logo.svg"
          alt="ระบบหวย"
          width={px}
          height={px}
          className="h-full w-full object-contain"
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
