import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CarteCocktail } from './CarteCocktail'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

type Props = Parameters<typeof CarteCocktail>[0]

function rendreCarte(p: Partial<Props> = {}) {
  const onPlus = vi.fn()
  const onMoins = vi.fn()
  render(
    <CarteCocktail nom="Nojito" sousTitre={null} total={5} variante="avec" onPlus={onPlus} onMoins={onMoins} {...p} />,
  )
  return {
    onPlus,
    onMoins,
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
    <CarteCocktail nom="Nojito" sousTitre="sans alcool" total={1} variante="sans" onPlus={() => {}} onMoins={() => {}} />,
  )
  expect(screen.getByText('Nojito')).toBeInTheDocument()
  expect(screen.getByText('sans alcool')).toBeInTheDocument()
  expect(screen.getByText('1 servi')).toBeInTheDocument()
  unmount()
  render(<CarteCocktail nom="Mojito" sousTitre={null} total={14} variante="avec" onPlus={() => {}} onMoins={() => {}} />)
  expect(screen.getByText('14 servis')).toBeInTheDocument()
})
