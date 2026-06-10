'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  Ban,
  Trophy,
  DollarSign,
  BarChart2,
  Home,
  Settings,
  LogOut,
} from 'lucide-react'
import { AppLogo } from '@/components/shared/AppLogo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import api from '@/lib/api'

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/bet', label: 'คีย์หวย', icon: Ticket },
  { href: '/restrictions', label: 'เลขอั้น', icon: Ban },
  { href: '/results', label: 'ผลหวย', icon: Trophy },
  { href: '/income', label: 'รายได้', icon: DollarSign },
  { href: '/reports', label: 'รายงาน', icon: BarChart2 },
  { href: '/houses', label: 'บ้าน', icon: Home },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    await api.post('/auth/logout')
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:min-h-screen bg-card border-r border-border">
      <div className="p-5 border-b border-border">
        <AppLogo size="md" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-muted-foreground font-medium hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
