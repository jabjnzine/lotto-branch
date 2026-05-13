'use client'

import { useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useBets } from '@/lib/hooks/useBets'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate, formatCurrency } from '@/lib/utils'
import { BET_TYPE_LABEL, BetType } from '@lotto/shared'
import { Download } from 'lucide-react'

export default function ReportsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined)
  const { data: betsData, isLoading: betsLoading } = useBets(selectedRoundId, page, 20)

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="รายงาน">
        {selectedRoundId && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        )}
      </PageHeader>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
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
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {selectedTypeId && (
        <div className="grid md:grid-cols-4 gap-4">
          {/* Round List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">เลือกงวด</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {rounds?.map((round) => (
                <button
                  key={round.id}
                  onClick={() => {
                    setSelectedRoundId(round.id)
                    setPage(1)
                  }}
                  className={`w-full text-left px-3 py-2 border-b border-slate-50 text-xs hover:bg-slate-50 ${
                    selectedRoundId === round.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                >
                  {formatThaiDate(round.draw_date)}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Bets Table */}
          <div className="md:col-span-3">
            {betsLoading && <LoadingSpinner />}
            {betsData && !betsLoading && (
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
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">เวลา</th>
                          <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">หมายเหตุ</th>
                          <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">ยอด</th>
                          <th className="text-center px-4 py-2.5 text-xs text-slate-500 font-medium">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {betsData.items.map((bet: {
                          id: string
                          created_at: string
                          note?: string | null
                          total_amount: string
                          status: string
                        }) => (
                          <tr key={bet.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-xs text-slate-400">
                              {new Date(bet.created_at).toLocaleTimeString('th-TH')}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{bet.note ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right font-medium">
                              {formatCurrency(bet.total_amount)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Badge
                                variant={
                                  bet.status === 'won'
                                    ? 'success'
                                    : bet.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {bet.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {betsData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="text-sm text-slate-600">
                        {page} / {betsData.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === betsData.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        ถัดไป
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {!selectedRoundId && !betsLoading && (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                เลือกงวดเพื่อดูรายงาน
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
