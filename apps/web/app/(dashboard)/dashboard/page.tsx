'use client'

import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useTodayRounds } from '@/lib/hooks/useRounds'
import { useTodayBetsSummary } from '@/lib/hooks/useBets'
import { useTodayIncome } from '@/lib/hooks/useIncome'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Countdown } from '@/components/shared/Countdown'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatThaiDate } from '@/lib/utils'
import { Trophy, Ticket, Ban, TrendingUp, FileText, DollarSign, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; variant: 'success' | 'destructive' | 'default' | 'warning' }> = {
  open: { label: 'เปิดรับ', variant: 'success' },
  closed: { label: 'ปิดรับ', variant: 'warning' },
  resulted: { label: 'ออกผลแล้ว', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: todayRounds, isLoading } = useTodayRounds()
  const { data: todaySummary } = useTodayBetsSummary()
  const { data: todayIncome } = useTodayIncome()

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const quickLinks = [
    { href: '/bet', label: 'คีย์หวย', icon: Ticket, color: 'bg-sky-500', desc: 'บันทึกการแทง' },
    { href: '/restrictions', label: 'เลขอั้น', icon: Ban, color: 'bg-red-500', desc: 'จัดการเลขอั้น' },
    { href: '/results', label: 'ผลหวย', icon: Trophy, color: 'bg-amber-500', desc: 'บันทึกผล' },
    { href: '/income', label: 'รายได้', icon: TrendingUp, color: 'bg-green-500', desc: 'ดูยอดรายได้' },
  ]

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`สวัสดี, ${user?.name ?? 'Admin'}`}
        description={`${formatThaiDate(today)} — ภาพรวมระบบหวยวันนี้`}
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

      {/* Today's Summary */}
      {(todaySummary || todayIncome) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">จำนวนบิล</p>
                <p className="text-xl font-bold tabular-nums text-slate-900">
                  {todaySummary?.billCount?.toLocaleString() ?? '—'} <span className="text-sm font-normal text-slate-500">บิล</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <DollarSign className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">ยอดรับ</p>
                <p className="text-xl font-bold tabular-nums text-sky-600">
                  {formatCurrency(todayIncome?.totalReceived ?? todaySummary?.totalAmount ?? '0')} <span className="text-sm font-normal text-slate-500">บาท</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">ยอดจ่าย</p>
                <p className="text-xl font-bold tabular-nums text-red-500">
                  {formatCurrency(todayIncome?.totalPayout ?? '0')} <span className="text-sm font-normal text-slate-500">บาท</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${todayIncome?.isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
                <TrendingUp className={`h-5 w-5 ${todayIncome?.isProfitable ? 'text-green-600' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">กำไร/ขาดทุน</p>
                <p className={`text-xl font-bold tabular-nums ${todayIncome?.isProfitable ? 'text-green-600' : 'text-red-500'}`}>
                  {todayIncome ? `${todayIncome.isProfitable ? '+' : ''}${formatCurrency(todayIncome.profit)}` : '—'} <span className="text-sm font-normal text-slate-500">บาท</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">งวดวันนี้ ({formatThaiDate(today)})</CardTitle>
        </CardHeader>
        <CardContent>
          {!todayRounds || todayRounds.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">ไม่มีงวดในวันนี้</p>
          ) : (
            <div className="space-y-3">
              {todayRounds.map((round) => {
                const st = statusLabel[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <div
                    key={round.id}
                    className="flex items-center justify-between p-3 bg-sky-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{round.lottery_type?.name}</p>
                      <p className="text-xs text-slate-400">ปิดรับ {round.close_at ? new Date(round.close_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">ปิดรับใน</p>
                        <Countdown closeAt={round.close_at} />
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
