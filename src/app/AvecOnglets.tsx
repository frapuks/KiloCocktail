import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import { BarreOnglets } from '../ui/BarreOnglets'

export function AvecOnglets() {
  return (
    <>
      <Box sx={{ pb: '4.5rem' }}>
        <Outlet />
      </Box>
      <BarreOnglets />
    </>
  )
}
