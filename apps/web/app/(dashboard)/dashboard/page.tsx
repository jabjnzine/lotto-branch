'use client'

import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Countdown } from '@/components/shared/Countdown'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate } from '@/lib/utils'
import { Trophy, Ticket, Ban, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; variant: 'success' | 'destructive' | 'default' | 'warning' }> = {
  open: { label: 'เปิดรับ', variant: 'success' },
  closed: { label: 'ปิดรับ', variant: 'warning' },
  resulted: { label: 'ออกผลแล้ว', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(undefined, 'open')

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const quickLinks = [
    { href: '/bet', label: 'คีย์หวย', icon: Ticket, color: 'bg-blue-500', desc: 'บันทึกการแทง' },
    { href: '/restrictions', label: 'เลขอั้น', icon: Ban, color: 'bg-red-500', desc: 'จัดการเลขอั้น' },
    { href: '/results', label: 'ผลหวย', icon: Trophy, color: 'bg-amber-500', desc: 'บันทึกผล' },
    { href: '/income', label: 'รายได้', icon: TrendingUp, color: 'bg-green-500', desc: 'ดูยอดรายได้' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`สวัสดี, ${user?.name ?? 'Admin'}`}
        description="ภาพรวมระบบหวยวันนี้"
      />

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(({ href, label, icon: Icon, color, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`${color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">งวดที่เปิดรับอยู่</CardTitle>
        </CardHeader>
        <CardContent>
          {!rounds || rounds.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">ไม่มีงวดที่เปิดรับ</p>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => {
                const status = statusLabel[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <div
                    key={round.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{round.lottery_type?.name}</p>
                      <p className="text-xs text-slate-400">{formatThaiDate(round.draw_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">ปิดรับใน</p>
                        <Countdown closeAt={round.close_at} />
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lottery Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ประเภทหวย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lotteryTypes?.map((lt) => (
              <div key={lt.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{lt.name}</p>
                  <p className="text-xs text-slate-400">ปิด {lt.close_before_minutes} นาทีก่อนออกผล</p>
                </div>
                <Badge variant={lt.is_active ? 'success' : 'secondary'}>
                  {lt.is_active ? 'เปิด' : 'ปิด'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
