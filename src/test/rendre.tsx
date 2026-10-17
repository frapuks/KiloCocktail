import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { Depots } from '../data/depots'
import { DepotsProvider } from '../data/DepotsContext'

export function rendre(
  ui: ReactElement,
  { depots, route = '/' }: { depots: Depots; route?: string },
): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DepotsProvider depots={depots}>{ui}</DepotsProvider>
    </MemoryRouter>,
  )
}
