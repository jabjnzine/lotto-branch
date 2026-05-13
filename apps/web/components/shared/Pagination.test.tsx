import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} onPageChange={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders prev/next buttons and page indicator', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('ก่อนหน้า')).toBeInTheDocument()
    expect(screen.getByText('ถัดไป')).toBeInTheDocument()
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
  })

  it('disables prev button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('ก่อนหน้า').closest('button')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('ถัดไป').closest('button')).toBeDisabled()
  })

  it('both buttons enabled on middle page', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('ก่อนหน้า').closest('button')).not.toBeDisabled()
    expect(screen.getByText('ถัดไป').closest('button')).not.toBeDisabled()
  })

  it('calls onPageChange(page - 1) when prev clicked', () => {
    const fn = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={fn} />)
    fireEvent.click(screen.getByText('ก่อนหน้า'))
    expect(fn).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange(page + 1) when next clicked', () => {
    const fn = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={fn} />)
    fireEvent.click(screen.getByText('ถัดไป'))
    expect(fn).toHaveBeenCalledWith(4)
  })
})
