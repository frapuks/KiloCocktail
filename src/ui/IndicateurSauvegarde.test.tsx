import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IndicateurSauvegarde } from './IndicateurSauvegarde'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const attente = (n: number) => ({ ecrituresEnAttente: true, verresEnAttente: n })
const confirme = { ecrituresEnAttente: false, verresEnAttente: 0 }
const avancer = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

it('affiche Sauvegardé sans écriture en attente', () => {
  render(<IndicateurSauvegarde etat={confirme} />)
  expect(screen.getByRole('status')).toHaveTextContent('Sauvegardé')
})

it('reste sur Sauvegardé si l’attente dure moins de 2 s', () => {
  const { rerender } = render(<IndicateurSauvegarde etat={confirme} />)
  rerender(<IndicateurSauvegarde etat={attente(3)} />)
  avancer(1500)
  expect(screen.getByRole('status')).toHaveTextContent('Sauvegardé')
  rerender(<IndicateurSauvegarde etat={confirme} />)
  avancer(5000)
  expect(screen.queryByText(/Hors connexion/)).not.toBeInTheDocument()
})

it('affiche le nombre en attente après 2 s', () => {
  const { rerender } = render(<IndicateurSauvegarde etat={confirme} />)
  rerender(<IndicateurSauvegarde etat={attente(12)} />)
  avancer(2000)
  expect(screen.getByRole('status')).toHaveTextContent('Hors connexion · 12 en attente')
})

it('revient immédiatement à Sauvegardé', () => {
  const { rerender } = render(<IndicateurSauvegarde etat={confirme} />)
  rerender(<IndicateurSauvegarde etat={attente(12)} />)
  avancer(2000)
  rerender(<IndicateurSauvegarde etat={confirme} />)
  expect(screen.getByRole('status')).toHaveTextContent('Sauvegardé')
})
