import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import { App } from './App'

it('affiche le nom de l’appli', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getByText('KiloCocktail')).toBeInTheDocument()
})
