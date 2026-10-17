import { Outlet } from 'react-router-dom'
import { BarreOnglets } from '../ui/BarreOnglets'

export function AvecOnglets() {
  return (
    <>
      <div style={{ paddingBottom: '4.5rem' }}>
        <Outlet />
      </div>
      <BarreOnglets />
    </>
  )
}
