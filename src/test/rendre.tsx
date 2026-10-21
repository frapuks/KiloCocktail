import { ThemeProvider } from '@mui/material/styles'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { Depots } from '../data/depots'
import { DepotsProvider } from '../data/DepotsContext'
import { themeMui } from '../ui/themeMui'

export function rendre(
  ui: ReactElement,
  { depots, route = '/' }: { depots: Depots; route?: string },
): RenderResult {
  return render(
    <ThemeProvider theme={themeMui}>
      <MemoryRouter initialEntries={[route]}>
        <DepotsProvider depots={depots}>{ui}</DepotsProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}
