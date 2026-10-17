import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { suivreEcriture } from '../data/erreurs'
import { Bandeaux } from './Bandeaux'

it('affiche le bandeau d’erreur d’écriture', async () => {
  render(<Bandeaux />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await act(async () => {
    suivreEcriture(Promise.reject(new Error('refusé')))
  })
  expect(screen.getByText("Une modification n'a pas pu être sauvegardée")).toBeInTheDocument()
})
