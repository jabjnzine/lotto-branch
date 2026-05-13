'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import api from '@/lib/api'

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}
