'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useResult, useSaveResult } from '@/lib/hooks/useResults'
import { useFetchThaiResult, useFetchLaoResult } from '@/lib/hooks/useRounds'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate } from '@/lib/utils'
import { ResultStructure } from '@lotto/shared'
import { CheckCircle, Download } from 'lucide-react'

const roundStatusBadge: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  open: { label: 'เปิดรับ', variant: 'success' },
  closed: { label: 'ปิดรับ', variant: 'warning' },
  resulted: { label: 'ออกผลแล้ว', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

function ResultForm({
  roundId,
  resultStructure,
}: {
  roundId: string
  resultStructure: string
}) {
  const { data: result } = useResult(roundId)
  const saveResult = useSaveResult(roundId)

  const [firstPrize, setFirstPrize] = useState('')
  const [threeTop, setThreeTop] = useState('')
  const [threeFront, setThreeFront] = useState('')
  const [threeBack, setThreeBack] = useState('')
  const [twoLast, setTwoLast] = useState('')
  const [twoDigit1, setTwoDigit1] = useState('')
  const [twoDigit2, setTwoDigit2] = useState('')
  const [twoDigit3, setTwoDigit3] = useState('')
  const [twoDigit4, setTwoDigit4] = useState('')
  const [twoDigit5, setTwoDigit5] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFirstPrize(result?.first_prize ?? '')
    setThreeTop(result?.three_top ?? '')
    setThreeFront(Array.isArray(result?.three_front) ? result.three_front.join(', ') : '')
    setThreeBack(Array.isArray(result?.three_back) ? result.three_back.join(', ') : '')
    setTwoLast(result?.two_last ?? '')
    if (Array.isArray(result?.three_front)) {
      setTwoDigit1(result.three_front[0] ?? '')
      setTwoDigit2(result.three_front[1] ?? '')
      setTwoDigit3(result.three_front[2] ?? '')
      setTwoDigit4(result.three_front[3] ?? '')
      setTwoDigit5(result.three_front[4] ?? '')
    }
    setSaved(false)
  }, [result?.first_prize, result?.three_top, result?.three_front, result?.three_back, result?.two_last, roundId])

  const handleSave = async () => {
    const parseNumbers = (s: string) =>
      s
        .split(/[, ]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0)

    await saveResult.mutateAsync({
      first_prize: firstPrize || null,
      three_top: threeTop || null,
      three_front: isThaiFull ? parseNumbers(threeFront) : isLao52 ? [twoDigit1, twoDigit2, twoDigit3, twoDigit4, twoDigit5].filter((n) => n.length > 0) : undefined,
      three_back: isThaiFull ? parseNumbers(threeBack) : undefined,
      two_last: twoLast || null,
      source: 'manual',
      is_official: false,
    })
    setSaved(true)
  }

  const isThaiFull = resultStructure === ResultStructure.THAI_FULL
  const isLaoFull = resultStructure === ResultStructure.LAO_FULL
  const isLao52 = resultStructure === ResultStructure.LAO_5_2

  return (
    <div className="space-y-3">
      {(isThaiFull || isLaoFull) && (
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            {isThaiFull ? 'รางวัลที่ 1 (6 หลัก)' : 'เลขท้าย 4 ตัว'}
          </label>
          <input
            value={firstPrize}
            onChange={(e) => setFirstPrize(e.target.value.replace(/\D/g, '').slice(0, isThaiFull ? 6 : 4))}
            inputMode="numeric"
            placeholder={isThaiFull ? '------' : '----'}
            className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
          />
          {isLaoFull && firstPrize.length === 4 && (
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>3 ตัวบน = <strong className="text-slate-800 font-mono">{firstPrize.slice(-3)}</strong></span>
              <span>2 ตัวบน = <strong className="text-slate-800 font-mono">{firstPrize.slice(-2)}</strong></span>
            </div>
          )}
        </div>
      )}
      {isThaiFull && (
        <>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              เลขหน้า 3 ตัว (คั่นด้วยช่องว่างหรือจุลภาค)
            </label>
            <input
              value={threeFront}
              onChange={(e) => setThreeFront(e.target.value)}
              placeholder="เช่น 267, 318"
              className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-xl font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              เลขท้าย 3 ตัว (คั่นด้วยช่องว่างหรือจุลภาค)
            </label>
            <input
              value={threeBack}
              onChange={(e) => setThreeBack(e.target.value)}
              placeholder="เช่น 065, 153"
              className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-xl font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
            />
          </div>
        </>
      )}
      {isLao52 && (
        <div>
          <label className="text-xs text-slate-500 block mb-1">ผล 5 ชุด 2 ตัว</label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { val: twoDigit1, set: setTwoDigit1 },
              { val: twoDigit2, set: setTwoDigit2 },
              { val: twoDigit3, set: setTwoDigit3 },
              { val: twoDigit4, set: setTwoDigit4 },
              { val: twoDigit5, set: setTwoDigit5 },
            ].map((item, i) => (
              <input
                key={i}
                value={item.val}
                onChange={(e) => item.set(e.target.value.replace(/\D/g, '').slice(0, 2))}
                inputMode="numeric"
                placeholder="--"
                maxLength={2}
                className="h-12 border-2 border-slate-200 rounded-lg px-2 text-xl font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
              />
            ))}
          </div>
        </div>
      )}
      {!isLao52 && (
      <div>
        <label className="text-xs text-slate-500 block mb-1">2 ตัวล่าง</label>
        <input
          value={twoLast}
          onChange={(e) => setTwoLast(e.target.value.replace(/\D/g, '').slice(0, 2))}
          inputMode="numeric"
          placeholder="--"
          className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
        />
      </div>
      )}
      {result && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge variant={result.is_official ? 'success' : 'secondary'}>
            {result.is_official ? 'Official' : 'Manual'}
          </Badge>
          <span>บันทึกแล้ว</span>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>บันทึกผลสำเร็จ</span>
        </div>
      )}
      <Button onClick={handleSave} disabled={saveResult.isPending} className="w-full">
        {saveResult.isPending ? 'กำลังบันทึก...' : 'บันทึกผล'}
      </Button>
    </div>
  )
}

export default function ResultsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined)
  const fetchThai = useFetchThaiResult()
  const fetchLao = useFetchLaoResult()

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)

  const sortedRounds = useMemo(() => {
    if (!rounds) return []
    const statusOrder: Record<string, number> = { open: 0, closed: 1, resulted: 2, cancelled: 3 }
    return [...rounds].sort((a, b) => {
      const s = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      if (s !== 0) return s
      if (a.status === 'open') {
        return new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime()
      }
      return new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    })
  }, [rounds])

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="ผลหวย" />

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              setSelectedRoundId(null)
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

      {selectedType?.code === 'TH' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchThai.mutate()}
          disabled={fetchThai.isPending}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {fetchThai.isPending ? 'กำลังดึง...' : 'ดึงผลหวยรัฐบาลอัตโนมัติ'}
        </Button>
      )}
      {(selectedType?.code === 'LAO' || selectedType?.code === 'LAO_PATTHANA') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLao.mutate()}
          disabled={fetchLao.isPending}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {fetchLao.isPending ? 'กำลังดึง...' : 'ดึงผลหวยลาวอัตโนมัติ'}
        </Button>
      )}
      {fetchThai.data && (
        <p className="text-sm text-green-600">{fetchThai.data.message}</p>
      )}
      {fetchLao.data && (
        <p className="text-sm text-green-600">{fetchLao.data.message}</p>
      )}

      {selectedTypeId && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Round List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">เลือกงวด</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {sortedRounds.map((round) => {
                const rStatus = roundStatusBadge[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      selectedRoundId === round.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{formatThaiDate(round.draw_date)}</p>
                      <Badge variant={rStatus.variant} className="text-[10px] px-1.5 py-0">
                        {rStatus.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{round.lottery_type?.name}</p>
                  </button>
                )
              })}
              {(!rounds || rounds.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-6">ไม่มีงวด</p>
              )}
            </CardContent>
          </Card>

          {/* Result Form */}
          {selectedRoundId && selectedType && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">บันทึกผล</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultForm
                  key={selectedRoundId}
                  roundId={selectedRoundId}
                  resultStructure={selectedType.result_structure}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
