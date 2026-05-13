'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, Ban, Trophy, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'หน้าแรก', icon: LayoutDashboard },
  { href: '/bet', label: 'คีย์หวย', icon: Ticket },
  { href: '/restrictions', label: 'เลขอั้น', icon: Ban },
  { href: '/results', label: 'ผลหวย', icon: Trophy },
  { href: '/income', label: 'รายได้', icon: DollarSign },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-sky-100 z-50">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs font-medium transition-colors',
                active ? 'text-sky-600' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
