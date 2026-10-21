import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { ecouterUtilisateur, type Utilisateur } from '../data/auth'
import type { Depots } from '../data/depots'
import { DepotsProvider } from '../data/DepotsContext'

export function RouteProtegee({ fabriqueDepots }: { fabriqueDepots: (uid: string) => Depots }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null | undefined>(undefined)
  useEffect(() => ecouterUtilisateur(setUtilisateur), [])

  const uid = utilisateur?.uid
  const depots = useMemo(() => (uid ? fabriqueDepots(uid) : null), [uid, fabriqueDepots])

  const uidInitialise = useRef<string | null>(null)
  useEffect(() => {
    if (!uid || !depots || uidInitialise.current === uid) return
    uidInitialise.current = uid
    depots.types.initialiserSiVide().catch(() => {})
  }, [uid, depots])

  if (utilisateur === undefined) return null
  if (!depots) return <Navigate to="/connexion" replace />
  return (
    <DepotsProvider depots={depots}>
      <Outlet />
    </DepotsProvider>
  )
}
