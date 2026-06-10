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
import { StatCardGridSkeleton } from '@/components/shared/StatCardSkeleton'
import { formatCurrency, formatThaiDate } from '@/lib/utils'
import { Trophy, Ban, TrendingUp, PenLine, FileText, DollarSign, TrendingDown } from 'lucide-react'
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
  const { data: todaySummary, isLoading: summaryLoading } = useTodayBetsSummary()
  const { data: todayIncome, isLoading: incomeLoading } = useTodayIncome()

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const quickLinks = [
    { href: '/bet', label: 'คีย์หวย', icon: PenLine, desc: 'บันทึกการแทง' },
    { href: '/restrictions', label: 'เลขอั้น', icon: Ban, desc: 'จัดการเลขอั้น' },
    { href: '/results', label: 'ผลหวย', icon: Trophy, desc: 'บันทึกผล' },
    { href: '/income', label: 'รายได้', icon: TrendingUp, desc: 'ดูยอดรายได้' },
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
        {quickLinks.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full border-border">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today's Summary */}
      {(summaryLoading || incomeLoading) ? (
        <StatCardGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">จำนวนบิล</p>
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {(todaySummary?.billCount ?? 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">บิล</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ยอดรับ</p>
                <p className="text-xl font-bold tabular-nums text-primary">
                  {formatCurrency(todayIncome?.totalReceived ?? todaySummary?.totalAmount ?? '0')} <span className="text-sm font-normal text-muted-foreground">บาท</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ยอดจ่าย</p>
                <p className="text-xl font-bold tabular-nums text-red-500">
                  {formatCurrency(todayIncome?.totalPayout ?? '0')} <span className="text-sm font-normal text-muted-foreground">บาท</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${todayIncome && Number(todayIncome.profit) > 0 ? 'bg-green-50' : todayIncome && Number(todayIncome.profit) < 0 ? 'bg-red-50' : 'bg-muted'}`}>
                <TrendingUp className={`h-5 w-5 ${todayIncome && Number(todayIncome.profit) > 0 ? 'text-green-600' : todayIncome && Number(todayIncome.profit) < 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">กำไร/ขาดทุน</p>
                <p className={`text-xl font-bold tabular-nums ${todayIncome && Number(todayIncome.profit) > 0 ? 'text-green-600' : todayIncome && Number(todayIncome.profit) < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {todayIncome ? `${todayIncome.isProfitable ? '+' : ''}${formatCurrency(todayIncome.profit)}` : formatCurrency(0)} <span className="text-sm font-normal text-muted-foreground">บาท</span>
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
            <p className="text-sm text-muted-foreground text-center py-4">ไม่มีงวดในวันนี้</p>
          ) : (
            <div className="space-y-3">
              {todayRounds.map((round) => {
                const st = statusLabel[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <div
                    key={round.id}
                    className="flex items-center justify-between p-3 bg-primary/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{round.lottery_type?.name}</p>
                      <p className="text-xs text-muted-foreground">ปิดรับ {round.close_at ? new Date(round.close_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} น.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">ปิดรับใน</p>
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
