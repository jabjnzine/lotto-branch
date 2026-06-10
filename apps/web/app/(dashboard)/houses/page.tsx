'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useHouses,
  useAgentRate,
  useCreateHouse,
  useUpdateHouse,
  useDeleteHouse,
  useUpdateAgentRate,
  type House,
} from '@/lib/hooks/useHouses'
import { Home, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

function AgentRateSection() {
  const { data, isLoading } = useAgentRate()
  const update = useUpdateAgentRate()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const currentRate = data?.agent_commission_rate ?? 0

  const handleSave = () => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 100) return
    update.mutate(num, { onSuccess: () => setEditing(false) })
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">% เจ้า (Agent Commission Rate)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={currentRate}
                onChange={(e) => setValue(e.target.value)}
                className="w-28 h-9 border border-sky-200 rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
              <span className="text-sm text-slate-500">%</span>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-sky-600">{currentRate}%</span>
              <Button size="sm" variant="outline" onClick={() => { setValue(String(currentRate)); setEditing(true) }}>
                <Pencil className="h-4 w-4 mr-1" />
                แก้ไข
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">% เจ้าคือ cap สูงสุดที่บ้านแต่ละหลังจะได้รับได้</p>
      </CardContent>
    </Card>
  )
}

function HouseRow({ house, agentRate }: { house: House; agentRate: number }) {
  const update = useUpdateHouse()
  const deleteHouse = useDeleteHouse()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(house.name)
  const [rate, setRate] = useState(house.commission_rate)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    update.mutate(
      { id: house.id, name, commission_rate: parseFloat(rate) },
      { onSuccess: () => setEditing(false) },
    )
  }

  const commissionRate = parseFloat(house.commission_rate)

  return (
    <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 h-9 border border-sky-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              min="0"
              max={agentRate}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-20 h-9 border border-sky-200 rounded-md px-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Home className="h-4 w-4 text-sky-500 shrink-0" />
          <span className="flex-1 text-sm font-medium text-slate-700">{house.name}</span>
          <span className="text-sm font-mono text-sky-600 font-semibold">{commissionRate}%</span>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="ลบบ้าน"
        message={`ต้องการลบ "${house.name}" ออกจากระบบ?`}
        onConfirm={() => deleteHouse.mutate(house.id)}
      />
    </div>
  )
}

function AddHouseForm({ agentRate, onDone }: { agentRate: number; onDone: () => void }) {
  const create = useCreateHouse()
  const [name, setName] = useState('')
  const [rate, setRate] = useState('0')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), commission_rate: parseFloat(rate) || 0 },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3 border-2 border-dashed border-sky-300 rounded-lg bg-white">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อบ้าน"
        className="flex-1 h-9 border border-sky-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.01"
          min="0"
          max={agentRate}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-20 h-9 border border-sky-200 rounded-md px-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span className="text-sm text-slate-500">%</span>
      </div>
      <Button type="submit" size="sm" disabled={create.isPending}>
        <Check className="h-4 w-4 mr-1" />
        เพิ่ม
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4" />
      </Button>
    </form>
  )
}

export default function HousesPage() {
  const { data: houses, isLoading } = useHouses()
  const { data: agentRateData } = useAgentRate()
  const [adding, setAdding] = useState(false)

  const agentRate = agentRateData?.agent_commission_rate ?? 0

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="บ้าน" description="จัดการบ้านและ % ค่าคอมมิชชั่น">
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มบ้าน
        </Button>
      </PageHeader>

      <AgentRateSection />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการบ้าน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {adding && (
            <AddHouseForm agentRate={agentRate} onDone={() => setAdding(false)} />
          )}
          {houses && houses.length > 0 ? (
            houses.map((house) => (
              <HouseRow key={house.id} house={house} agentRate={agentRate} />
            ))
          ) : (
            !adding && (
              <div className="py-12 text-center">
                <Home className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">ยังไม่มีบ้าน กด "เพิ่มบ้าน" เพื่อเริ่มต้น</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
