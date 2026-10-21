import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ListeReordonnable } from './ListeReordonnable'

const elements = [
  { id: 'a', nom: 'Mojito' },
  { id: 'b', nom: 'Spritz' },
]

function rendreListe() {
  render(<ListeReordonnable libelle="Avec alcool" elements={elements} rendre={(e) => e.nom} onDeplacer={() => {}} />)
  return screen.getAllByRole('button', { name: 'Déplacer' })
}

it('donne les consignes de déplacement en français', () => {
  const [poignee] = rendreListe()
  expect(poignee).toHaveAccessibleDescription(
    'Pour déplacer un élément, appuie sur Espace ou Entrée, utilise les flèches pour le déplacer, puis appuie de nouveau sur Espace ou Entrée pour le déposer, ou sur Échap pour annuler.',
  )
})

it('annonce la saisie et l’annulation en français', async () => {
  const [poignee] = rendreListe()
  await act(async () => {
    fireEvent.keyDown(poignee, { code: 'Space', key: ' ' })
  })
  expect(screen.getByRole('status')).toHaveTextContent('Élément saisi.')
  await act(async () => {
    // Le capteur clavier n'écoute les touches suivantes qu'après un tour de boucle.
    await new Promise((r) => setTimeout(r, 0))
    fireEvent.keyDown(poignee, { code: 'Escape', key: 'Escape' })
  })
  expect(screen.getByRole('status')).toHaveTextContent('Déplacement annulé.')
})
