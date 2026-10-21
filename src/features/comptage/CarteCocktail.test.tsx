import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CarteCocktail } from './CarteCocktail'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

type Props = Parameters<typeof CarteCocktail>[0]

function rendreCarte(p: Partial<Props> = {}) {
  const onPlus = vi.fn()
  const onMoins = vi.fn(() => true)
  const onAnnulerPlus = vi.fn()
  render(
    <CarteCocktail
      nom="Nojito"
      sousTitre={null}
      total={5}
      variante="avec"
      onPlus={onPlus}
      onAnnulerPlus={onAnnulerPlus}
      onMoins={onMoins}
      {...p}
    />,
  )
  return {
    onPlus,
    onMoins,
    onAnnulerPlus,
    carte: screen.getByRole('button', { name: 'Nojito' }),
    moins: screen.getByRole('button', { name: 'Retirer un Nojito' }),
  }
}
const avancer = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

it('ajoute 1 au toucher et affiche +1', () => {
  const { carte, onPlus } = rendreCarte()
  fireEvent.pointerDown(carte)
  expect(onPlus).toHaveBeenCalledTimes(1)
  expect(screen.getByText('+1')).toBeVisible()
})

it('cumule les taps rapprochés', () => {
  const { carte } = rendreCarte()
  for (let i = 0; i < 3; i++) {
    fireEvent.pointerDown(carte)
    avancer(200)
  }
  expect(screen.getByText('+3')).toBeInTheDocument()
})

it('efface le cumul 1,3 s après le dernier tap', () => {
  const { carte } = rendreCarte()
  fireEvent.pointerDown(carte)
  fireEvent.pointerDown(carte)
  fireEvent.pointerDown(carte)
  avancer(1299)
  expect(screen.getByText('+3')).toBeInTheDocument()
  avancer(1)
  expect(screen.queryByText('+3')).not.toBeInTheDocument()
})

it('compte chaque tap d’une rafale', () => {
  const { carte, onPlus } = rendreCarte()
  for (let i = 0; i < 10; i++) {
    fireEvent.pointerDown(carte)
    avancer(90)
  }
  expect(onPlus).toHaveBeenCalledTimes(10)
  expect(screen.getByText('+10')).toBeInTheDocument()
})

it('retire 1 avec le bouton − et cumule −N', () => {
  const { carte, moins, onMoins } = rendreCarte()
  fireEvent.pointerDown(moins)
  fireEvent.pointerDown(moins)
  expect(onMoins).toHaveBeenCalledTimes(2)
  expect(screen.getByText('−2')).toBeInTheDocument()
  fireEvent.pointerDown(carte)
  expect(screen.getByText('+1')).toBeInTheDocument()
})

it('le bouton − ne déclenche pas le +1', () => {
  const { moins, onPlus } = rendreCarte()
  fireEvent.pointerDown(moins)
  expect(onPlus).not.toHaveBeenCalled()
})

it('désactive le bouton − à 0', () => {
  const { moins } = rendreCarte({ total: 0 })
  expect(moins).toBeDisabled()
})

it('affiche nom, sous-titre et total accordé', () => {
  const { unmount } = render(
    <CarteCocktail nom="Nojito" sousTitre="sans alcool" total={1} variante="sans" onPlus={() => {}} onAnnulerPlus={() => {}} onMoins={() => true} />,
  )
  expect(screen.getByText('Nojito')).toBeInTheDocument()
  expect(screen.getByText('sans alcool')).toBeInTheDocument()
  // Compteur de servis : le parent du libellé « servi(s) ».
  const servis = () => screen.getByText(/^servis?$/).parentElement as HTMLElement
  expect(servis()).toHaveTextContent('1 servi')
  const ordre = (a: Node, b: Node) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
  expect(ordre(screen.getByText('Nojito'), screen.getByText('sans alcool'))).toBeTruthy()
  expect(ordre(screen.getByText('sans alcool'), servis())).toBeTruthy()
  unmount()
  render(<CarteCocktail nom="Mojito" sousTitre={null} total={14} variante="avec" onPlus={() => {}} onAnnulerPlus={() => {}} onMoins={() => true} />)
  expect(servis()).toHaveTextContent('14 servis')
})

it('nomme la carte et le bouton − avec le sous-titre', () => {
  render(
    <CarteCocktail nom="Mojito" sousTitre="sans alcool" total={1} variante="sans" onPlus={() => {}} onAnnulerPlus={() => {}} onMoins={() => true} />,
  )
  expect(screen.getByRole('button', { name: 'Mojito, sans alcool' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retirer un Mojito sans alcool' })).toBeInTheDocument()
})

it('un tap sur le − désactivé (total 0) n’affiche rien et ne déclenche rien', () => {
  const { moins, onMoins, onPlus } = rendreCarte({ total: 0 })
  fireEvent.pointerDown(moins)
  expect(onMoins).not.toHaveBeenCalled()
  expect(onPlus).not.toHaveBeenCalled()
  expect(screen.queryByText('−1')).not.toBeInTheDocument()
})

it('n’affiche −N que pour les retraits acceptés', () => {
  const { moins, onMoins } = rendreCarte()
  onMoins.mockReturnValueOnce(true).mockReturnValue(false)
  fireEvent.pointerDown(moins)
  fireEvent.pointerDown(moins)
  expect(screen.getByText('−1')).toBeInTheDocument()
})

it('annule le +1 quand le navigateur prend le geste pour un défilement', () => {
  const { carte, onPlus, onAnnulerPlus } = rendreCarte()
  fireEvent.pointerDown(carte, { pointerId: 7 })
  fireEvent.pointerCancel(carte, { pointerId: 7 })
  expect(onPlus).toHaveBeenCalledTimes(1)
  expect(onAnnulerPlus).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('+1')).not.toBeInTheDocument()
  fireEvent.pointerCancel(carte, { pointerId: 7 })
  expect(onAnnulerPlus).toHaveBeenCalledTimes(1)
})

it('n’annule que le dernier tap d’un cumul', () => {
  const { carte, onAnnulerPlus } = rendreCarte()
  fireEvent.pointerDown(carte, { pointerId: 1 })
  fireEvent.pointerDown(carte, { pointerId: 2 })
  fireEvent.pointerCancel(carte, { pointerId: 2 })
  expect(onAnnulerPlus).toHaveBeenCalledTimes(1)
  expect(screen.getByText('+1')).toBeInTheDocument()
})

it('ignore l’annulation d’un autre pointeur que celui du dernier +1', () => {
  const { carte, onAnnulerPlus } = rendreCarte()
  fireEvent.pointerDown(carte, { pointerId: 1 })
  fireEvent.pointerDown(carte, { pointerId: 2 })
  fireEvent.pointerCancel(carte, { pointerId: 1 })
  expect(onAnnulerPlus).not.toHaveBeenCalled()
  expect(screen.getByText('+2')).toBeInTheDocument()
})
