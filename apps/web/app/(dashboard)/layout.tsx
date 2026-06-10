'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppLogo } from '@/components/shared/AppLogo'
import { BottomNav } from '@/components/layout/BottomNav'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { dayjs, formatThaiDate } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import api from '@/lib/api'

function Spinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">กำลังโหลดระบบ...</p>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (user) {
      setIsChecking(false)
      return
    }

    let cancelled = false

    async function tryRefresh() {
      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken
        if (!storedRefreshToken) throw new Error('No refresh token')
        const { data } = await api.post(
          '/auth/refresh',
          { refreshToken: storedRefreshToken },
          { timeout: 5_000 },
        )
        if (!cancelled && data.accessToken) {
          setAuth(data.accessToken, data.refreshToken, data.user)
        }
      } catch {
        // interceptor handles redirect on 401
      } finally {
        if (!cancelled) setIsChecking(false)
      }
    }

    tryRefresh()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isChecking && !user) {
      router.replace('/login')
    }
  }, [isChecking, user, router])

  if (isChecking) return <Spinner />
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-card border-b border-border shadow-sm shadow-black/20">
          <div className="lg:hidden">
            <AppLogo size="sm" showText={false} />
          </div>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {formatThaiDate(dayjs().format('YYYY-MM-DD'))}
            </span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
