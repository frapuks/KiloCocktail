import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Confirmation } from './Confirmation'

describe('Confirmation', () => {
  it('affiche le titre et déclenche l’action choisie', () => {
    const onClick = vi.fn()
    const onFermer = vi.fn()
    render(
      <Confirmation
        titre="Supprimer ?"
        message="Irréversible"
        actions={[{ libelle: 'Supprimer', onClick, danger: true }, { libelle: 'Annuler', onClick: onFermer }]}
        onFermer={onFermer}
      />,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Supprimer ?')).toBeTruthy()
    expect(screen.getByText('Irréversible')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Supprimer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
