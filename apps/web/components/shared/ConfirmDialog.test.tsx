import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่?"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument()
    expect(screen.getByText('คุณแน่ใจหรือไม่?')).toBeInTheDocument()
  })

  it('renders confirm and cancel buttons', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Test"
        message="Message"
        onConfirm={() => {}}
        confirmLabel="ลบทันที"
        cancelLabel="ปิด"
      />,
    )
    expect(screen.getByText('ลบทันที')).toBeInTheDocument()
    expect(screen.getByText('ปิด')).toBeInTheDocument()
  })

  it('renders default labels', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Test"
        message="Message"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('ยืนยัน')).toBeInTheDocument()
    expect(screen.getByText('ยกเลิก')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel clicked', () => {
    const fn = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={fn}
        title="Test"
        message="Message"
        onConfirm={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('ยกเลิก'))
    expect(fn).toHaveBeenCalledWith(false)
  })

  it('calls onConfirm when confirm clicked', () => {
    const fn = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Test"
        message="Message"
        onConfirm={fn}
      />,
    )
    fireEvent.click(screen.getByText('ยืนยัน'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('shows loading text and disables buttons when loading', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Test"
        message="Message"
        onConfirm={() => {}}
        confirmLabel="ลบ"
        loading={true}
      />,
    )
    expect(screen.getByText('กำลังดำเนินการ...')).toBeInTheDocument()
    expect(screen.getByText('กำลังดำเนินการ...').closest('button')).toBeDisabled()
    expect(screen.getByText('ยกเลิก').closest('button')).toBeDisabled()
  })

  it('does not render content when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Test"
        message="Message"
        onConfirm={() => {}}
      />,
    )
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })
})
