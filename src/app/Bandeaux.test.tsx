import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { suivreEcriture } from '../data/erreurs'
import { Bandeaux } from './Bandeaux'

const { updateServiceWorker, etat } = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(async () => {}),
  etat: { needRefresh: false },
}))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [etat.needRefresh, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker,
  }),
}))

afterEach(() => {
  etat.needRefresh = false
  updateServiceWorker.mockClear()
})

it('affiche le bandeau d’erreur d’écriture', async () => {
  render(<Bandeaux />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await act(async () => {
    suivreEcriture(Promise.reject(new Error('refusé')))
  })
  expect(screen.getByText("Une modification n'a pas pu être sauvegardée")).toBeInTheDocument()
})

it('propose de recharger quand une nouvelle version est prête', async () => {
  etat.needRefresh = true
  render(<Bandeaux />)
  expect(screen.getByText('Nouvelle version disponible')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Recharger' }))
  expect(updateServiceWorker).toHaveBeenCalledWith(true)
})

it('ne recharge jamais tout seul', () => {
  etat.needRefresh = true
  render(<Bandeaux />)
  expect(updateServiceWorker).not.toHaveBeenCalled()
})

it('n’affiche rien sans nouvelle version', () => {
  render(<Bandeaux />)
  expect(screen.queryByText('Nouvelle version disponible')).not.toBeInTheDocument()
})
