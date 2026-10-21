import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BarreOnglets } from './BarreOnglets'
import { themeMui } from './themeMui'

const ongletActif = (route: string) => {
  render(
    <ThemeProvider theme={themeMui}>
      <MemoryRouter initialEntries={[route]}>
        <BarreOnglets />
      </MemoryRouter>
    </ThemeProvider>,
  )
  return screen.getAllByRole('link').find((l) => l.classList.contains('Mui-selected'))?.textContent ?? null
}

describe('BarreOnglets', () => {
  it.each([
    ['/', 'Prestas'],
    ['/prestas/nouvelle', 'Prestas'],
    ['/prestas/p1/resultats', 'Prestas'],
    ['/cocktails', 'Cocktails'],
    ['/reglages', 'Réglages'],
  ])('surligne l’onglet de %s', (route, onglet) => {
    expect(ongletActif(route)).toBe(onglet)
  })
})
