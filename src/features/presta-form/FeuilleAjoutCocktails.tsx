import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Cocktail, Ligne } from '../../domain/types'
import { FeuilleModale } from '../../ui/FeuilleModale'
import { useBases } from '../../data/hooks'
import { FiltreAlcool, gardeAlcool } from '../../ui/FiltreAlcool'
import { basesProposees, FiltreBase, filtreApplique, gardeBase, TOUTES } from '../../ui/FiltreBase'
import { SelecteurCocktails } from './SelecteurCocktails'

interface Props {
  // Cocktails pas encore sur la carte, à cocher.
  options: Cocktail[]
  onAjouter(lignes: Ligne[]): void
  onAnnuler(): void
}

// Feuille « Ajouter des cocktails », commune à la création et à la modification d'une presta.
// Les filtres ne font que masquer : un cocktail coché reste coché en changeant de filtre.
export function FeuilleAjoutCocktails({ options, onAjouter, onAnnuler }: Props) {
  const bases = useBases()
  const [ajout, setAjout] = useState<Ligne[]>([])
  const [filtre, setFiltre] = useState<FiltreAlcool>('tous')
  const [filtreBase, setFiltreBase] = useState<FiltreBase>(TOUTES)
  const basesFiltre = basesProposees(bases ?? [], options)
  const base = filtreApplique(filtreBase, basesFiltre)
  const deLaBase = options.filter(gardeBase(base))
  const visibles = deLaBase.filter(gardeAlcool[filtre])

  return (
    <FeuilleModale libelle="Ajouter des cocktails" onFermer={onAnnuler}>
      <Typography variant="h2">Ajouter des cocktails</Typography>
      {options.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <FiltreAlcool valeur={filtre} onChange={setFiltre} cocktails={deLaBase} />
            <FiltreBase valeur={base} onChange={setFiltreBase} bases={basesFiltre} />
          </Box>
          <SelecteurCocktails options={visibles} lignes={ajout} onChange={setAjout} />
        </>
      ) : (
        <Typography color="text.secondary">Tous les cocktails actifs sont déjà sur la carte.</Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={() => onAjouter(ajout)}>
          Ajouter
        </Button>
        <Button variant="outlined" color="inherit" onClick={onAnnuler}>
          Annuler
        </Button>
      </Box>
    </FeuilleModale>
  )
}
