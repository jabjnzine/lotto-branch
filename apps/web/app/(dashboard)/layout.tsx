'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { dayjs, formatThaiDate } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import api from '@/lib/api'

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (user) {
      setIsChecking(false)
      return
    }

    let cancelled = false

    async function tryRefresh() {
      try {
        const { data } = await api.post('/auth/refresh', {})
        if (!cancelled && data.accessToken) {
          setAuth(data.accessToken, data.user)
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

  if (isChecking) return <Spinner />

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="flex min-h-screen bg-sky-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b-2 border-sky-100 shadow-sm">
          <span className="text-sm font-semibold text-sky-600 lg:hidden">ระบบหวย</span>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="h-4 w-4 text-sky-500" />
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
