import { createContext, useContext, type ReactNode } from 'react'
import type { Depots } from './depots'

const ContexteDepots = createContext<Depots | null>(null)

export function DepotsProvider({ depots, children }: { depots: Depots; children: ReactNode }) {
  return <ContexteDepots.Provider value={depots}>{children}</ContexteDepots.Provider>
}

export function useDepots(): Depots {
  const depots = useContext(ContexteDepots)
  if (!depots) throw new Error('useDepots doit être utilisé dans un DepotsProvider')
  return depots
}
