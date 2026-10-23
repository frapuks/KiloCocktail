import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { nomAccessible } from '../../domain/affichage'
import { groupes } from '../../domain/lignes'
import type { Cocktail, Ligne, Variante } from '../../domain/types'
import { ListeReordonnable } from '../../ui/ListeReordonnable'
import { couleurGroupe, TitreSection } from '../../ui/TitreSection'

interface Props {
  lignes: Ligne[]
  cocktails: Cocktail[]
  totaux?: Map<string, number>
  onDeplacer(variante: Variante, de: number, vers: number): void
  onRetirer?(ligneId: string): void
  // Présent : bouton « + Ajouter un cocktail » sur la ligne du titre.
  onAjouter?(): void
}

const GROUPES: { variante: Variante; titre: string }[] = [
  { variante: 'avec', titre: 'Avec alcool' },
  { variante: 'sans', titre: 'Sans alcool' },
]

export function SurLaCarte({ lignes, cocktails, totaux, onDeplacer, onRetirer, onAjouter }: Props) {
  const parGroupe = groupes(lignes, cocktails)
  return (
    <Box component="section" aria-labelledby="titre-sur-la-carte">
      {/* Titre simple, sans trait : ce sont les groupes « Avec alcool » / « Sans alcool » en dessous qui en ont un. */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1, mb: 1 }}>
        <Typography variant="h2" component="h3" id="titre-sur-la-carte">
          Cocktails
        </Typography>
        {onAjouter && (
          <Button variant="outlined" color="inherit" onClick={onAjouter}>
            + Ajouter un cocktail
          </Button>
        )}
      </Box>
      {parGroupe.avec.length === 0 && parGroupe.sans.length === 0 && (
        <Typography color="text.secondary">Aucun cocktail pour l’instant.</Typography>
      )}
      {GROUPES.map(({ variante, titre }) => {
        const groupe = parGroupe[variante]
        if (groupe.length === 0) return null
        return (
          <div key={variante}>
            <Box sx={{ mt: 2, mb: 0.5 }}>
              <TitreSection titre={titre} couleur={couleurGroupe(variante)} niveau="h4" />
            </Box>
            <ListeReordonnable
              libelle={titre}
              elements={groupe}
              onDeplacer={(de, vers) => onDeplacer(variante, de, vers)}
              rendre={(ligne) => {
                const cocktail = cocktails.find((c) => c.id === ligne.cocktailId)
                if (!cocktail) return null
                // Pas de sous-titre « sans alcool » : le groupe le dit déjà.
                const nom = cocktail.nom
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>{nom}</Box>
                    {totaux && <Typography component="span" sx={{ fontWeight: 700 }}>{totaux.get(ligne.id) ?? 0}</Typography>}
                    {onRetirer && (
                      <IconButton
                        // « sans alcool » reste dans le nom accessible : deux lignes peuvent porter le même nom.
                        aria-label={`Retirer ${nomAccessible(cocktail)}`}
                        color="error"
                        onClick={() => onRetirer(ligne.id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                )
              }}
            />
          </div>
        )
      })}
    </Box>
  )
}
