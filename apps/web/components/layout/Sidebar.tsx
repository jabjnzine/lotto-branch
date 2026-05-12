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
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:min-h-screen bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-blue-600">🎯 ระบบหวย</h2>
        <p className="text-xs text-slate-400 mt-0.5">Back Office</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
