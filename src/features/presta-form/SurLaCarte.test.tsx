import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Cocktail, Ligne } from '../../domain/types'
import { SurLaCarte } from './SurLaCarte'

const cocktails: Cocktail[] = [
  { id: 'm', nom: 'Mojito', nomNormalise: 'mojito', alcool: true, archive: false },
  { id: 'n', nom: 'Nojito', nomNormalise: 'nojito', alcool: false, archive: false },
  { id: 'd', nom: 'Daiquiri', nomNormalise: 'daiquiri', alcool: true, archive: false },
]
const l = (id: string, cocktailId: string, masquee = false): Ligne => ({ id, cocktailId, masquee })

describe('SurLaCarte', () => {
  afterEach(() => vi.restoreAllMocks())

  it('regroupe et nomme les lignes', () => {
    render(
      <SurLaCarte
        lignes={[l('1', 'm'), l('2', 'n'), l('3', 'd', true)]}
        cocktails={cocktails}
        onDeplacer={() => {}}
      />,
    )
    const avec = within(screen.getByRole('list', { name: 'Avec alcool' }))
    const sans = within(screen.getByRole('list', { name: 'Sans alcool' }))
    expect(avec.getByText('Mojito')).toBeTruthy()
    expect(avec.queryByText('Daiquiri')).toBeNull()
    expect(sans.getByText('Nojito')).toBeTruthy()
    expect(sans.queryByText('sans alcool')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Retirer/ })).toBeNull()
  })

  it('n’affiche pas un groupe vide', () => {
    render(<SurLaCarte lignes={[l('1', 'd')]} cocktails={cocktails} onDeplacer={() => {}} />)
    expect(screen.queryByText('Sans alcool')).toBeNull()
  })

  it('indique une carte vide, masquées comprises', () => {
    render(<SurLaCarte lignes={[l('1', 'd', true)]} cocktails={cocktails} onDeplacer={() => {}} />)
    expect(screen.getByText('Aucun cocktail pour l’instant.')).toBeTruthy()
  })

  it('n’indique rien de vide dès qu’un cocktail est sur la carte', () => {
    render(<SurLaCarte lignes={[l('1', 'd')]} cocktails={cocktails} onDeplacer={() => {}} />)
    expect(screen.queryByText('Aucun cocktail pour l’instant.')).toBeNull()
  })

  it('déplace au clavier', async () => {
    // jsdom renvoie des rectangles vides : on donne à chaque élément une position distincte.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const li = this.closest('li')
      const index = li ? Array.from(li.parentElement!.children).indexOf(li) : 0
      const top = index * 50
      return { top, bottom: top + 50, left: 0, right: 200, width: 200, height: 50, x: 0, y: top, toJSON: () => ({}) }
    })
    const onDeplacer = vi.fn()
    render(
      <SurLaCarte lignes={[l('1', 'm'), l('2', 'd')]} cocktails={cocktails} onDeplacer={onDeplacer} />,
    )
    const poignee = screen.getAllByRole('button', { name: 'Déplacer' })[0]
    poignee.focus()
    const touche = async (key: string, code: string) => {
      await act(async () => {
        fireEvent.keyDown(poignee, { key, code })
        await new Promise((r) => setTimeout(r, 0))
      })
    }
    await touche(' ', 'Space')
    await touche('ArrowDown', 'ArrowDown')
    await touche(' ', 'Space')
    expect(onDeplacer).toHaveBeenCalledWith('avec', 0, 1)
  })
})
