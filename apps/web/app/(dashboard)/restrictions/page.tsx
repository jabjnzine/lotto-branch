'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useRestrictions, useCreateRestriction, useDeleteRestriction } from '@/lib/hooks/useRestrictions'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LotteryTypeSelector } from '@/components/lottery/LotteryTypeSelector'
import {
  BET_TYPE_DIGIT_COUNT,
  BET_TYPE_LABEL,
  LOTTERY_TYPE_BET_TYPES,
  BetType,
  RestrictionType,
  type BetTypeGroupId,
  groupBetTypesForUi,
} from '@lotto/shared'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Trash2, Plus, RefreshCw, Ban, ShieldCheck } from 'lucide-react'

const POS_BLUE = '#ff9824'

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
  const [activeBetGroupId, setActiveBetGroupId] = useState<BetTypeGroupId | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: currentRound } = useCurrentRound(selectedTypeId)
  const { data: restrictions, isLoading: restrictLoading, refetch } = useRestrictions(currentRound?.id ?? null)
  const createRestriction = useCreateRestriction(currentRound?.id ?? '')
  const deleteRestriction = useDeleteRestriction()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId(lotteryTypes[0].id)
    }
  }, [selectedTypeId, lotteryTypes])

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)
  const allowedBetTypes = useMemo(
    () => (selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []),
    [selectedType],
  )

  const betTypeGroups = useMemo(() => groupBetTypesForUi(allowedBetTypes), [allowedBetTypes])

  const resolvedTabGroupId = activeBetGroupId ?? betTypeGroups[0]?.groupId ?? null
  const activeBetGroup =
    betTypeGroups.find((g) => g.groupId === resolvedTabGroupId) ?? betTypeGroups[0] ?? null

  useEffect(() => {
    if (!selectedTypeId || !betTypeGroups.length) {
      setActiveBetGroupId(null)
      return
    }
    const firstBt = allowedBetTypes[0]
    const grp = betTypeGroups.find((g) => g.betTypes.includes(firstBt))
    setActiveBetGroupId(grp?.groupId ?? betTypeGroups[0].groupId)
  }, [selectedTypeId, betTypeGroups, allowedBetTypes])

  useEffect(() => {
    if (!activeBetGroupId) return
    const group = betTypeGroups.find((g) => g.groupId === activeBetGroupId)
    if (!group) return
    if (!group.betTypes.includes(betType)) {
      setBetType(group.betTypes[0])
      setNumber('')
    }
  }, [activeBetGroupId, betTypeGroups, betType])

  const maxLength = BET_TYPE_DIGIT_COUNT[betType] ?? 2

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

  const isClosed = !currentRound || (!!currentRound?.close_at && new Date(currentRound.close_at) < new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      <PageHeader title="เลขอั้น">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          รีเฟรช
        </Button>
      </PageHeader>

      {lotteryTypes && lotteryTypes.length > 0 && (
        <LotteryTypeSelector
          lotteryTypes={lotteryTypes}
          selectedTypeId={selectedTypeId}
          onSelect={(id) => {
            const lt = lotteryTypes.find((t) => t.id === id)
            setSelectedTypeId(id)
            const types = LOTTERY_TYPE_BET_TYPES[lt?.code ?? ''] ?? []
            setBetType(types[0] ?? BetType.THREE_TOP)
          }}
        />
      )}

      {!selectedTypeId && (
        <div className="rounded-xl border border-dashed border-border bg-primary/5 py-16 text-center text-muted-foreground">
          <Ban className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-lg">เลือกประเภทหวยเพื่อเริ่มจัดการเลขอั้น</p>
        </div>
      )}

      {selectedTypeId && (
        <>
          {currentRound && (
            <>
              {/* เพิ่มเลขอั้น */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-foreground">
                  เพิ่มเลขอั้น
                </h3>

                <p className="mb-2 text-xs font-medium text-muted-foreground">ประเภทการแทง</p>
                {betTypeGroups.length > 0 && (
                  <div className="mb-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {betTypeGroups.map((group) => {
                        const tabOn = resolvedTabGroupId === group.groupId
                        return (
                          <button
                            key={group.groupId}
                            type="button"
                            onClick={() => {
                              setActiveBetGroupId(group.groupId)
                              setBetType(group.betTypes[0])
                              setNumber('')
                            }}
                            className={cn(
                              'flex-1 rounded-lg border py-2.5 text-center text-sm font-semibold transition-colors',
                              tabOn
                                ? 'border-[#ff9824] bg-primary text-primary-foreground font-bold border border-primary'
                                : 'border border-[#444444] bg-secondary text-foreground font-semibold hover:border-primary/60 hover:bg-[#333333] active:scale-[0.98]',
                            )}
                          >
                            {group.title}
                          </button>
                        )
                      })}
                    </div>

                    {activeBetGroup && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {activeBetGroup.betTypes.map((bt) => {
                          const isSel = betType === bt
                          return (
                            <button
                              key={bt}
                              type="button"
                              disabled={isClosed}
                              onClick={() => {
                                setBetType(bt)
                                setNumber('')
                              }}
                              className={cn(
                                'flex min-h-[52px] w-full overflow-hidden rounded-lg border text-left text-sm font-semibold transition-colors disabled:opacity-50',
                                isSel
                                  ? 'border-[#ff9824] bg-primary text-primary-foreground font-bold border border-primary'
                                  : 'border border-[#444444] bg-secondary text-foreground font-semibold hover:border-primary/60 hover:bg-[#333333] active:scale-[0.98]',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex flex-1 items-center px-3 py-2 leading-tight',
                                  isSel ? 'text-white' : 'text-foreground',
                                )}
                              >
                                {BET_TYPE_LABEL[bt]}
                              </span>
                              <span
                                className={cn(
                                  'flex w-[4.25rem] shrink-0 items-center justify-center border-l px-2 py-2 font-mono text-sm',
                                  isSel
                                    ? 'border-white/25 bg-[#ea580c] text-white'
                                    : 'border-border bg-primary/10 text-foreground',
                                )}
                              >
                                {BET_TYPE_DIGIT_COUNT[bt]} หลัก
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <p className="mb-2 text-xs font-medium text-muted-foreground">ประเภทการอั้น</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[RestrictionType.CLOSED, RestrictionType.LIMITED, RestrictionType.HALF_PAY].map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      disabled={isClosed}
                      onClick={() => setRestrictionType(rt)}
                      className={cn(
                        'flex-1 rounded-lg border py-2.5 text-center text-sm font-semibold transition-colors disabled:opacity-50',
                        restrictionType === rt
                          ? 'border-red-500 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'border-red-500/40 bg-secondary text-red-400 shadow-sm hover:border-red-500/70 hover:bg-red-500/10 hover:text-red-300 active:scale-[0.98]',
                      )}
                    >
                      {restrictionTypeLabel[rt]?.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">เลข ({maxLength} หลัก)</span>
                    </div>
                    <input
                      value={number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, maxLength)
                        setNumber(val)
                      }}
                      inputMode="numeric"
                      maxLength={maxLength}
                      placeholder={'0'.repeat(maxLength)}
                      disabled={isClosed}
                      className="h-11 rounded-md border border-border px-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {restrictionType === RestrictionType.LIMITED ? 'วงเงิน (บาท)' : '—'}
                    </span>
                    <input
                      value={limitAmount}
                      onChange={(e) => setLimitAmount(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      placeholder={restrictionType === RestrictionType.LIMITED ? 'วงเงินสูงสุด' : 'ไม่ระบุ'}
                      disabled={isClosed || restrictionType !== RestrictionType.LIMITED}
                      className="h-11 rounded-md border border-border px-3 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted disabled:text-muted-foreground"
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={isClosed || !number || createRestriction.isPending}
                  className="mt-4 h-11 w-full gap-2 bg-[#ff9824] text-base font-semibold hover:bg-[#ea580c]"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มเลขอั้น
                </Button>
              </div>

              {/* รายการเลขอั้น */}
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: POS_BLUE }}
                >
                  <span>รายการเลขอั้น</span>
                  <span className="text-xs font-normal opacity-95">
                    {restrictions?.length ?? 0} รายการ
                  </span>
                </div>

                {restrictLoading ? (
                  <LoadingSpinner className="py-8" />
                ) : !restrictions || restrictions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    ไม่มีเลขอั้น
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {restrictions.map((r: {
                      id: string
                      number: string
                      bet_type: string
                      restriction_type: string
                      limit_amount?: string | null
                    }) => {
                      const rType = restrictionTypeLabel[r.restriction_type] ?? { label: r.restriction_type, variant: 'default' as const }
                      return (
                        <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/50">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg font-bold tabular-nums text-foreground">{r.number}</span>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {BET_TYPE_LABEL[r.bet_type as BetType] ?? r.bet_type}
                            </Badge>
                            <Badge variant={rType.variant}>{rType.label}</Badge>
                            {r.limit_amount && (
                              <span className="text-xs text-muted-foreground">
                                วงเงิน {Number(r.limit_amount).toLocaleString()} บาท
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setDeleteTarget(r.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#ff9824] transition-colors hover:bg-primary/10 hover:text-red-600"
                            aria-label="ลบเลขอั้น"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {!currentRound && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                ไม่มีงวดที่เปิดรับสำหรับประเภทนี้
              </CardContent>
            </Card>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="ลบเลขอั้น"
        message="คุณแน่ใจหรือไม่ที่จะลบเลขอั้นรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบทันที"
        onConfirm={() => {
          if (deleteTarget) {
            deleteRestriction.mutate(deleteTarget)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
