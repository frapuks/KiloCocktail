import { useCallback, useEffect, useRef, useState } from 'react'
import { annulerTap, cumulerTap, DUREE_CUMUL_MS, type Cumul } from '../../domain/cumul'

// Cumul « +N » / « −N » d'une carte : effacé DUREE_CUMUL_MS après le dernier tap.
export function useCumul(): { cumul: Cumul; taper(signe: 1 | -1): void; annuler(): void } {
  const [cumul, setCumul] = useState<Cumul>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const taper = useCallback((signe: 1 | -1) => {
    setCumul((c) => cumulerTap(c, signe, Date.now()))
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => setCumul(null), DUREE_CUMUL_MS)
  }, [])

  const annuler = useCallback(() => setCumul((c) => annulerTap(c)), [])

  useEffect(() => () => clearTimeout(minuteur.current), [])

  return { cumul, taper, annuler }
}
