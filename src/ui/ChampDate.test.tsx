import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChampDate } from './ChampDate'

describe('ChampDate', () => {
  it('affiche la date au format JJ/MM/AAAA', () => {
    render(<ChampDate label="Date" valeur="2026-10-17" onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Date' }).textContent).toContain('17/10/2026')
    expect(screen.getByRole('group', { name: 'Date' }).textContent).not.toContain('samedi')
  })

  it('renvoie le jour choisi dans le calendrier, au format des données', () => {
    const onChange = vi.fn()
    render(<ChampDate label="Date" valeur="2026-10-17" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Choisir la date/ }))
    fireEvent.click(screen.getByRole('gridcell', { name: '31' }))
    expect(onChange).toHaveBeenCalledWith('2026-10-31')
  })
})
