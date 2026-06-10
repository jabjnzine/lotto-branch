import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { useToastStore } from '../stores/useToastStore'

export interface House {
  id: string
  name: string
  commission_rate: string
  created_at: string
}

function getErrorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  return msg ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export function useHouses() {
  return useQuery<House[]>({
    queryKey: ['houses'],
    queryFn: () => api.get('/houses').then((r) => r.data),
  })
}

export function useAgentRate() {
  return useQuery<{ agent_commission_rate: number }>({
    queryKey: ['houses', 'agent-rate'],
    queryFn: () => api.get('/houses/config/agent-rate').then((r) => r.data),
  })
}

export function useCreateHouse() {
  const qc = useQueryClient()
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: (data: { name: string; commission_rate: number }) =>
      api.post('/houses', data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['houses'] })
      toast({ title: 'เพิ่มบ้านสำเร็จ', description: vars.name, variant: 'success' })
    },
    onError: (err: unknown) => {
      toast({ title: 'เพิ่มบ้านไม่สำเร็จ', description: getErrorMessage(err), variant: 'destructive' })
    },
  })
}

export function useUpdateHouse() {
  const qc = useQueryClient()
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; commission_rate?: number }) =>
      api.patch(`/houses/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['houses'] })
      toast({ title: 'บันทึกสำเร็จ', variant: 'success' })
    },
    onError: (err: unknown) => {
      toast({ title: 'บันทึกไม่สำเร็จ', description: getErrorMessage(err), variant: 'destructive' })
    },
  })
}

export function useDeleteHouse() {
  const qc = useQueryClient()
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: (id: string) => api.delete(`/houses/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['houses'] })
      toast({ title: 'ลบบ้านสำเร็จ', variant: 'success' })
    },
    onError: (err: unknown) => {
      toast({ title: 'ลบบ้านไม่สำเร็จ', description: getErrorMessage(err), variant: 'destructive' })
    },
  })
}

export function useUpdateAgentRate() {
  const qc = useQueryClient()
  const toast = useToastStore((s) => s.toast)
  return useMutation({
    mutationFn: (rate: number) =>
      api.patch('/houses/config/agent-rate', { agent_commission_rate: rate }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['houses', 'agent-rate'] })
      toast({ title: 'บันทึก % เจ้าสำเร็จ', variant: 'success' })
    },
    onError: (err: unknown) => {
      toast({ title: 'บันทึก % เจ้าไม่สำเร็จ', description: getErrorMessage(err), variant: 'destructive' })
    },
  })
}
