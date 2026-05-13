import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders an input with placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="ค้นหาเลข..." />)
    expect(screen.getByPlaceholderText('ค้นหาเลข...')).toBeInTheDocument()
  })

  it('renders with default placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('ค้นหา...')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const fn = vi.fn()
    render(<SearchInput value="" onChange={fn} />)
    fireEvent.change(screen.getByPlaceholderText('ค้นหา...'), {
      target: { value: '12' },
    })
    expect(fn).toHaveBeenCalledWith('12')
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    const buttons = screen.queryAllByRole('button')
    expect(buttons).toHaveLength(0)
  })

  it('shows clear button when value is non-empty', () => {
    render(<SearchInput value="12" onChange={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('clicking clear button calls onChange with empty string', () => {
    const fn = vi.fn()
    render(<SearchInput value="12" onChange={fn} />)
    fireEvent.click(screen.getByRole('button'))
    expect(fn).toHaveBeenCalledWith('')
  })
})
