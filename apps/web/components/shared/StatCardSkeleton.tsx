'use client'

import { cn } from '@/lib/utils'

function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-muted', className)} />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Pulse className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Pulse className="h-3 w-14" />
          <Pulse className="h-6 w-24" />
        </div>
      </div>
    </div>
  )
}

export function StatCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}
