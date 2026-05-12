'use client'

import { useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useRestrictions, useCreateRestriction, useDeleteRestriction } from '@/lib/hooks/useRestrictions'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LOTTERY_TYPE_BET_TYPES, BET_TYPE_LABEL, BetType, RestrictionType } from '@lotto/shared'
import { Trash2, Plus, RefreshCw } from 'lucide-react'

const restrictionTypeLabel: Record<string, { label: string; variant: 'destructive' | 'warning' | 'default' }> = {
  closed: { label: 'ปิดรับ', variant: 'destructive' },
  limited: { label: 'จำกัดวงเงิน', variant: 'warning' },
  half_pay: { label: 'จ่ายครึ่ง', variant: 'default' },
}

export default function RestrictionsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [number, setNumber] = useState('')
  const [betType, setBetType] = useState<BetType>(BetType.THREE_TOP)
  const [restrictionType, setRestrictionType] = useState<RestrictionType>(RestrictionType.CLOSED)
  const [limitAmount, setLimitAmount] = useState('')

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: currentRound } = useCurrentRound(selectedTypeId)
  const { data: restrictions, isLoading: restrictLoading, refetch } = useRestrictions(currentRound?.id ?? null)
  const createRestriction = useCreateRestriction(currentRound?.id ?? '')
  const deleteRestriction = useDeleteRestriction()

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)
  const allowedBetTypes = selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []

  const handleAdd = async () => {
    if (!currentRound || !number) return
    await createRestriction.mutateAsync({
      number,
      bet_type: betType,
      restriction_type: restrictionType,
      limit_amount: restrictionType === RestrictionType.LIMITED ? parseFloat(limitAmount) : undefined,
    })
    setNumber('')
    setLimitAmount('')
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <PageHeader title="เลขอั้น">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          รีเฟรช
        </Button>
      </PageHeader>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              const types = LOTTERY_TYPE_BET_TYPES[lt.code] ?? []
              setBetType(types[0] ?? BetType.THREE_TOP)
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

      {selectedTypeId && currentRound && (
        <>
          {/* Add Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">เพิ่มเลขอั้น</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {allowedBetTypes.map((bt) => (
                  <button
                    key={bt}
                    onClick={() => setBetType(bt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      betType === bt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {BET_TYPE_LABEL[bt]}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {[RestrictionType.CLOSED, RestrictionType.LIMITED, RestrictionType.HALF_PAY].map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setRestrictionType(rt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      restrictionType === rt
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {restrictionTypeLabel[rt]?.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  placeholder="ใส่เลข"
                  className="flex-1 h-10 border border-slate-200 rounded-md px-3 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {restrictionType === RestrictionType.LIMITED && (
                  <input
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="วงเงิน (บาท)"
                    className="flex-1 h-10 border border-slate-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <Button onClick={handleAdd} disabled={!number || createRestriction.isPending}>
                  <Plus className="h-4 w-4 mr-1" />
                  เพิ่ม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">รายการเลขอั้น ({restrictions?.length ?? 0} รายการ)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {restrictLoading ? (
                <LoadingSpinner className="py-8" />
              ) : restrictions?.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">ไม่มีเลขอั้น</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {restrictions?.map((r: {
                    id: string
                    number: string
                    bet_type: string
                    restriction_type: string
                    limit_amount?: string | null
                  }) => {
                    const rType = restrictionTypeLabel[r.restriction_type] ?? { label: r.restriction_type, variant: 'default' as const }
                    return (
                      <div key={r.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-lg">{r.number}</span>
                          <Badge variant="secondary" className="text-xs">
                            {BET_TYPE_LABEL[r.bet_type as BetType] ?? r.bet_type}
                          </Badge>
                          <Badge variant={rType.variant}>{rType.label}</Badge>
                          {r.limit_amount && (
                            <span className="text-xs text-slate-500">
                              วงเงิน {Number(r.limit_amount).toLocaleString()} บาท
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteRestriction.mutate(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedTypeId && !currentRound && (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            ไม่มีงวดที่เปิดรับสำหรับประเภทนี้
          </CardContent>
        </Card>
      )}
    </div>
  )
}
