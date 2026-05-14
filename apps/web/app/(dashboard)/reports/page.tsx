'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds, type LotteryRound } from '@/lib/hooks/useRounds'
import { useBets, useExportBets, useCancelBet, useRoundSummary, useTodayAllBets } from '@/lib/hooks/useBets'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate, formatCurrency, formatTime } from '@/lib/utils'
import { BET_TYPE_LABEL, BetType } from '@lotto/shared'
import { Receipt } from '@/components/shared/Receipt'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Download, ChevronDown, ChevronRight, User, FileText, BarChart2, CheckCircle, XCircle, DollarSign, TrendingUp, Printer } from 'lucide-react'

const roundStatusBadge: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  open: { label: 'เปิด', variant: 'success' },
  closed: { label: 'ปิด', variant: 'warning' },
  resulted: { label: 'ออกผล', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

const statusLabel: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  pending: { label: 'รอผล', variant: 'warning' },
  won: { label: 'ถูก', variant: 'success' },
  lost: { label: 'ไม่ถูก', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

export default function ReportsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [printReceipt, setPrintReceipt] = useState<{
    billNo: string
    betFullId?: string
    drawDate: string
    typeName: string
    buyerName: string
    note?: string | null
    betStatus?: string | null
    items: Array<{ number: string; bet_type: string; amount: string; payout_rate?: string | number | null }>
    totalAmount: number
    createdAt: string
  } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId && selectedTypeId !== '__all__' ? selectedTypeId : undefined)
  const { data: betsData, isLoading: betsLoading } = useBets(selectedRoundId, page, 20, debouncedSearch || undefined)
  const exportBets = useExportBets()
  const cancelBet = useCancelBet()
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const { data: todayAllBets, isLoading: todayAllLoading } = useTodayAllBets(allPage, 20, debouncedSearch || undefined)

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId('__all__')
    }
  }, [selectedTypeId, lotteryTypes])

  const selectedRound = rounds?.find((r) => r.id === selectedRoundId)
  const { data: roundSummary } = useRoundSummary(
    selectedRound && selectedRound.status === 'resulted' ? selectedRoundId : null,
  )

  const sortedRounds = useMemo(() => {
    if (!rounds) return []
    const statusOrder: Record<string, number> = { open: 0, closed: 1, resulted: 2, cancelled: 3 }
    return [...rounds].sort((a, b) => {
      const s = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      if (s !== 0) return s
      // OPEN: เรียงน้อยไปมาก (วันนี้ก่อน, งวดถัดไปตามหลัง)
      // อื่นๆ: เรียงมากไปน้อย (ล่าสุดก่อน)
      if (a.status === 'open') {
        return new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime()
      }
      return new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    })
  }, [rounds])

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
    setAllPage(1)
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const totalAmount = betsData?.items?.reduce(
    (sum: number, bet: { total_amount: string }) => sum + Number(bet.total_amount),
    0,
  ) ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="รายงาน">
        {selectedRoundId && (
          <Button
            variant="outline"
            size="sm"
            disabled={exportBets.isPending}
            onClick={() => exportBets.mutate(selectedRoundId)}
          >
            <Download className="h-4 w-4 mr-1" />
            {exportBets.isPending ? 'กำลังส่งออก...' : 'Export Excel'}
          </Button>
        )}
      </PageHeader>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-sky-200 bg-white p-3 shadow-sm">
        <button
          onClick={() => {
            setSelectedTypeId('__all__')
            setSelectedRoundId(null)
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedTypeId === '__all__'
              ? 'bg-sky-600 text-white'
              : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
          }`}
        >
          ทั้งหมด
        </button>
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              setSelectedRoundId(null)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTypeId === lt.id
                ? 'bg-sky-600 text-white'
                : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
            }`}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {/* All Types Unified View */}
      {selectedTypeId === '__all__' && (
        <div className="space-y-4">
          {todayAllLoading ? (
            <LoadingSpinner className="py-12" />
          ) : todayAllBets ? (
            <>
              {/* Grand Total KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">วันที่</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {formatThaiDate(todayAllBets.date)}
                  </p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">จำนวนบิลทั้งหมด</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                    {todayAllBets.totalBets.toLocaleString()} <span className="text-sm font-normal text-slate-500">บิล</span>
                  </p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">ยอดรับรวมทั้งวัน</p>
                  <p className="text-xl font-bold text-sky-600 tabular-nums mt-0.5">
                    {formatCurrency(todayAllBets.totalAmount)} <span className="text-sm font-normal text-slate-500">บาท</span>
                  </p>
                </div>
              </div>

              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="ค้นหาเลขหรือชื่อคนซื้อ..."
              />

              {/* Groups by Lottery Type */}
              {todayAllBets.groups.map((group) => (
                <Card key={group.typeId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{group.typeName}</Badge>
                        <span className="text-xs text-slate-400">
                          {group.betCount} บิล · {group.itemCount} รายการ
                        </span>
                      </CardTitle>
                      <span className="text-sm font-bold text-sky-600 tabular-nums">
                        {formatCurrency(group.totalAmount)} บาท
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-sky-200 bg-sky-50">
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">เวลา</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium hidden sm:table-cell">คนซื้อ</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium hidden sm:table-cell">หวย</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">เลข</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">ประเภท</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500 font-medium">ยอด</th>
                            <th className="text-center px-3 py-2 text-xs text-slate-500 font-medium">สถานะ</th>
                            <th className="text-center px-3 py-2 text-xs text-slate-500 font-medium w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.bets.map((bet) => {
                            const st = statusLabel[bet.status] ?? { label: bet.status, variant: 'default' as const }
                            return bet.items.map((item, i) => (
                              <tr key={`${bet.id}-${item.id}`} className={i === 0 ? 'border-t-2 border-sky-100' : ''}>
                                <td className="px-3 py-1.5 text-xs text-slate-500">
                                  {i === 0 ? formatTime(bet.created_at) : ''}
                                </td>
                                <td className="px-3 py-1.5 text-xs text-slate-600 hidden sm:table-cell">
                                  {i === 0 ? (bet.buyer_name ?? '—') : ''}
                                </td>
                                <td className="px-3 py-1.5 hidden sm:table-cell">
                                  {i === 0 && (
                                    <Badge className="text-[10px] bg-sky-100 text-sky-700 border-sky-200 font-medium">
                                      {group.typeName}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 font-mono text-xs font-semibold">{item.number}</td>
                                <td className="px-3 py-1.5">
                                  <Badge variant="secondary" className="text-[10px] font-normal">
                                    {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                                  </Badge>
                                </td>
                                <td className="px-3 py-1.5 text-right text-xs font-medium tabular-nums">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="px-3 py-1.5 text-center">
                                  {i === 0 && (
                                    <Badge variant={st.variant} className="text-[10px]">
                                      {st.label}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                  {i === 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPrintReceipt({
                                          billNo: bet.id.slice(-8).toUpperCase(),
                                          betFullId: bet.id,
                                          drawDate: group.drawDate,
                                          typeName: group.typeName,
                                          buyerName: bet.buyer_name ?? 'ลูกค้าทั่วไป',
                                          note: bet.note ?? null,
                                          betStatus: bet.status,
                                          items: bet.items.map((item) => ({
                                            number: item.number,
                                            bet_type: item.bet_type,
                                            amount: item.amount,
                                            payout_rate: item.payout_rate,
                                          })),
                                          totalAmount: Number(bet.total_amount),
                                          createdAt: bet.created_at,
                                        })
                                      }}
                                      className="text-slate-300 hover:text-sky-600 transition-colors"
                                      title="พิมพ์ใบเสร็จ"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {todayAllBets.groups.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-12">ไม่มีบิลในวันนี้</p>
              )}

              {todayAllBets.totalPages > 1 && (
                <Pagination page={allPage} totalPages={todayAllBets.totalPages} onPageChange={setAllPage} />
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Single Type View */}
      {selectedTypeId && selectedTypeId !== '__all__' && (
        <div className="grid md:grid-cols-4 gap-4">
          {/* Round List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">เลือกงวด</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {sortedRounds.map((round) => {
                const rStatus = roundStatusBadge[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <button
                    key={round.id}
                    onClick={() => {
                      setSelectedRoundId(round.id)
                      setPage(1)
                      setExpandedBetId(null)
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50 transition-colors ${
                      selectedRoundId === round.id
                        ? 'bg-sky-50 text-sky-700 font-medium border-l-2 border-l-sky-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatThaiDate(round.draw_date)}</span>
                      <Badge variant={rStatus.variant} className="text-[10px] px-1.5 py-0">
                        {rStatus.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{round.lottery_type?.name}</div>
                  </button>
                )
              })}
              {(!rounds || rounds.length === 0) && (
                <p className="text-center text-xs text-slate-400 py-8">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-slate-300" />
                  ไม่มีงวด
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bets Table */}
          <div className="md:col-span-3">
            {!selectedRoundId && !betsLoading && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
                <BarChart2 className="h-8 w-8 mb-2 text-slate-300" />
                เลือกงวดเพื่อดูรายงาน
              </div>
            )}

            {betsLoading && <LoadingSpinner className="py-12" />}

            {betsData && !betsLoading && (
              <>
                {/* Round Summary */}
                {selectedRound && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">งวด</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {formatThaiDate(selectedRound.draw_date)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedRound.lottery_type?.name}</p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">จำนวนบิล</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                        {betsData.total.toLocaleString()} <span className="text-sm font-normal text-slate-500">รายการ</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">ยอดรับรวม</p>
                      <p className="text-xl font-bold text-sky-600 tabular-nums mt-0.5">
                        {formatCurrency(totalAmount)} <span className="text-sm font-normal text-slate-500">บาท</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Win/Loss Summary — shown only for resulted rounds */}
                {selectedRound && selectedRound.status === 'resulted' && roundSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-green-600 font-medium">ถูก</p>
                      </div>
                      <p className="text-xl font-bold text-green-700 tabular-nums">
                        {roundSummary.wonCount} <span className="text-sm font-normal">บิล</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-red-600 font-medium">ไม่ถูก</p>
                      </div>
                      <p className="text-xl font-bold text-red-700 tabular-nums">
                        {roundSummary.lostCount} <span className="text-sm font-normal">บิล</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-slate-400">ยอดจ่าย</p>
                      </div>
                      <p className="text-xl font-bold text-red-500 tabular-nums">
                        {formatCurrency(roundSummary.totalPayout)} <span className="text-sm font-normal text-slate-500">บาท</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        <p className="text-xs text-slate-400">กำไรงวดนี้</p>
                      </div>
                      <p className="text-xl font-bold text-sky-600 tabular-nums">
                        {formatCurrency(roundSummary.profit)} <span className="text-sm font-normal text-slate-500">บาท</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="ค้นหาเลขหรือชื่อคนซื้อ..."
                  />
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        รายการบิล ({betsData.total} รายการ)
                      </CardTitle>
                      <span className="text-xs text-slate-400">
                        หน้า {page} / {betsData.totalPages}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-sky-200 bg-sky-50">
                            <th className="w-8 px-3 py-2.5" />
                            <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">เวลา</th>
                            <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">คนซื้อ</th>
                            <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">รายการ</th>
                            <th className="text-right px-3 py-2.5 text-xs text-slate-500 font-medium">ยอด</th>
                            <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {betsData.items.map((bet: {
                            id: string
                            created_at: string
                            buyer_name?: string | null
                            note?: string | null
                            total_amount: string
                            status: string
                            items?: Array<{
                              id: string
                              number: string
                              bet_type: string
                              amount: string
                              payout_rate?: string
                            }>
                          }) => {
                            const isExpanded = expandedBetId === bet.id
                            const status = statusLabel[bet.status] ?? { label: bet.status, variant: 'default' as const }
                            const itemCount = bet.items?.length ?? 0
                            return (
                              <React.Fragment key={bet.id}>
                                <tr
                                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                                  onClick={() => setExpandedBetId(isExpanded ? null : bet.id)}
                                >
                                  <td className="px-3 py-2.5 text-slate-400">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">
                                    {formatTime(bet.created_at)}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3.5 w-3.5 text-slate-300" />
                                      <span className="text-slate-700">
                                        {bet.buyer_name ?? '—'}
                                      </span>
                                    </div>
                                    {bet.note && (
                                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {bet.note}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="text-xs text-slate-500">{itemCount} รายการ</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                                    {formatCurrency(bet.total_amount)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <Badge variant={status.variant} className="text-xs">
                                      {status.label}
                                    </Badge>
                                  </td>
                                </tr>

                                {/* Expanded Items */}
                                {isExpanded && bet.items && bet.items.length > 0 && (
                                  <tr key={`${bet.id}-items`}>
                                    <td colSpan={6} className="px-0 py-0 bg-slate-50/60">
                                      <div className="px-8 py-3 border-b border-slate-100">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="text-xs text-slate-400">
                                              <th className="text-left py-1 font-normal">#</th>
                                              <th className="text-left py-1 font-normal">เลข</th>
                                              <th className="text-left py-1 font-normal">ประเภท</th>
                                              <th className="text-right py-1 font-normal">ยอด</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {bet.items.map((item, idx) => (
                                              <tr key={item.id}>
                                                <td className="py-1.5 text-xs text-slate-400">{idx + 1}</td>
                                                <td className="py-1.5 font-mono font-semibold text-slate-800">
                                                  {item.number}
                                                </td>
                                                <td className="py-1.5">
                                                  <Badge variant="secondary" className="text-xs font-normal">
                                                    {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                                                  </Badge>
                                                </td>
                                                <td className="py-1.5 text-right font-medium tabular-nums">
                                                  {formatCurrency(item.amount)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {bet.status === 'pending' && (
                                        <div className="px-8 py-2 border-t border-slate-100 flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setPrintReceipt({
                                                billNo: bet.id.slice(-8).toUpperCase(),
                                                betFullId: bet.id,
                                                drawDate: selectedRound?.draw_date ?? '',
                                                typeName: selectedRound?.lottery_type?.name ?? '',
                                                buyerName: bet.buyer_name ?? 'ลูกค้าทั่วไป',
                                                note: bet.note ?? null,
                                                betStatus: bet.status,
                                                items:
                                                  bet.items?.map((item) => ({
                                                    number: item.number,
                                                    bet_type: item.bet_type,
                                                    amount: item.amount,
                                                    payout_rate: item.payout_rate,
                                                  })) ?? [],
                                                totalAmount: Number(bet.total_amount),
                                                createdAt: bet.created_at,
                                              })
                                            }}
                                            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 text-xs"
                                          >
                                            <Printer className="h-3.5 w-3.5 mr-1" />
                                            พิมพ์ใบเสร็จ
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setCancelTarget(bet.id)
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                                          >
                                            ยกเลิกบิลนี้
                                          </Button>
                                        </div>
                                      )}
                                      {bet.status !== 'pending' && (
                                        <div className="px-8 py-2 border-t border-slate-100 flex justify-end">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setPrintReceipt({
                                                billNo: bet.id.slice(-8).toUpperCase(),
                                                betFullId: bet.id,
                                                drawDate: selectedRound?.draw_date ?? '',
                                                typeName: selectedRound?.lottery_type?.name ?? '',
                                                buyerName: bet.buyer_name ?? 'ลูกค้าทั่วไป',
                                                note: bet.note ?? null,
                                                betStatus: bet.status,
                                                items:
                                                  bet.items?.map((item) => ({
                                                    number: item.number,
                                                    bet_type: item.bet_type,
                                                    amount: item.amount,
                                                    payout_rate: item.payout_rate,
                                                  })) ?? [],
                                                totalAmount: Number(bet.total_amount),
                                                createdAt: bet.created_at,
                                              })
                                            }}
                                            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 text-xs"
                                          >
                                            <Printer className="h-3.5 w-3.5 mr-1" />
                                            พิมพ์ใบเสร็จ
                                          </Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination page={page} totalPages={betsData.totalPages} onPageChange={setPage} />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null) }}
        title="ยกเลิกบิล"
        message="คุณแน่ใจหรือไม่ที่จะยกเลิกบิลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ยกเลิกบิล"
        onConfirm={() => {
          if (cancelTarget) {
            cancelBet.mutate(cancelTarget)
            setCancelTarget(null)
          }
        }}
      />

      {/* Receipt Dialog — modal on desktop, fullscreen on mobile/print */}
      <Dialog
        open={!!printReceipt}
        onOpenChange={(open) => {
          if (!open) setPrintReceipt(null)
        }}
      >
        <DialogContent
          overlayClassName="max-sm:hidden"
          className="w-full max-w-none min-w-0 gap-0 border-0 !bg-transparent p-0 !shadow-none rounded-none max-sm:!top-0 max-sm:!left-0 max-sm:!right-0 max-sm:!h-[100dvh] max-sm:!w-full max-sm:!max-w-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!rounded-none max-sm:!max-h-none max-sm:overflow-hidden max-sm:overscroll-contain max-sm:bg-[#E3F2FD] max-sm:flex max-sm:flex-col sm:left-1/2 sm:top-1/2 sm:w-fit sm:max-w-[min(100vw,360px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none [&>button]:hidden"
        >
          <DialogTitle className="sr-only">ใบเสร็จ</DialogTitle>
          <DialogDescription className="sr-only">รายละเอียดใบเสร็จรับเงิน</DialogDescription>
          {printReceipt && (
            <Receipt
              billNo={printReceipt.billNo}
              betFullId={printReceipt.betFullId}
              drawDate={printReceipt.drawDate}
              typeName={printReceipt.typeName}
              buyerName={printReceipt.buyerName}
              note={printReceipt.note}
              betStatus={printReceipt.betStatus}
              items={printReceipt.items}
              totalAmount={printReceipt.totalAmount}
              createdAt={printReceipt.createdAt}
              onClose={() => setPrintReceipt(null)}
              onPrint={() => window.print()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
