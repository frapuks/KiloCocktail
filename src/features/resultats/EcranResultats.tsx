import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { DEPUIS_APP, ouverteDepuisApp } from '../../app/historique'
import { Confirmation } from '../../ui/Confirmation'
import { FeuilleModale } from '../../ui/FeuilleModale'
import { couleurGroupe, TitreSection } from '../../ui/TitreSection'
import { policeTitre } from '../../ui/themeMui'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { formatDate, nomLigne } from '../../domain/affichage'
import { varianteDe } from '../../domain/lignes'
import { totauxParLigne } from '../../domain/verres'

interface Props {
  // Présent : feuille ouverte depuis le comptage d'une presta en cours, qu'il suffit de refermer.
  // Absent : feuille en route, par-dessus la liste des prestas (presta terminée).
  onFermer?(): void
}

// Résultats d'une presta, en feuille. Une presta terminée ne s'affiche que par ici, jamais en comptage.
export function EcranResultats({ onFermer }: Props = {}) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const depots = useDepots()
  const presta = usePresta(id)
  const cocktails = useCocktails()
  const types = useTypes()
  const donneesVerres = useVerres(id)
  const location = useLocation()
  // Navigation à faire une fois la feuille redescendue ; non nulle = feuille en train de se fermer.
  const [sortie, setSortie] = useState<(() => void) | null>(null)
  const [repriseAConfirmer, setRepriseAConfirmer] = useState(false)

  useEffect(() => {
    if (presta === null) navigate('/', { replace: true })
  }, [presta, navigate])

  if (!presta || !cocktails || !types || !donneesVerres) return null

  const totaux = totauxParLigne(donneesVerres.verres)
  // Total = somme des lignes listées (cocktail connu), pour qu'il corresponde toujours à ce qui est affiché :
  // un verre sans ligne (orphelin d'une purge faite ailleurs) n'y entre pas.
  const total = presta.lignes
    .filter((l) => cocktails.some((c) => c.id === l.cocktailId))
    .reduce((n, l) => n + (totaux.get(l.id) ?? 0), 0)
  const type = types.find((t) => t.id === presta.typeId)
  const terminee = presta.statut === 'terminee'

  const groupe = (titre: string, variante: 'avec' | 'sans') => {
    const items = presta.lignes.flatMap((ligne) => {
      const c = cocktails.find((k) => k.id === ligne.cocktailId)
      if (!c || varianteDe(c) !== variante) return []
      // Pas de sous-titre « sans alcool » : le groupe le dit déjà.
      const { nom } = nomLigne(c)
      return [
        <ListItem key={ligne.id} divider disableGutters sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 2, py: 1 }}>
          <span>{nom}</span>
          <Typography component="span" sx={{ fontFamily: policeTitre, fontWeight: 800, fontSize: '1.5rem' }}>
            {totaux.get(ligne.id) ?? 0}
          </Typography>
        </ListItem>,
      ]
    })
    if (items.length === 0) return null
    return (
      <Box component="section" sx={{ mb: 3 }}>
        <TitreSection titre={titre} couleur={couleurGroupe(variante)} niveau="h3" />
        <List disablePadding sx={{ mt: 1 }}>
          {items}
        </List>
      </Box>
    )
  }

  // La feuille redescend d'abord, la navigation suit (onFermer).
  const partir = (navigation: () => void) => setSortie(() => navigation)

  // Presta en cours : la feuille est ouverte depuis le comptage (onFermer), sinon on y va.
  const revenirAuComptage = () => partir(onFermer ?? (() => navigate(`/prestas/${id}`, { replace: true })))

  // Presta terminée : la feuille est par-dessus la liste des prestas, on y revient.
  const revenirALaListe = () =>
    partir(() => (ouverteDepuisApp(location) ? navigate(-1) : navigate('/', { replace: true })))

  const fermer = terminee ? revenirALaListe : revenirAuComptage

  return (
    <FeuilleModale libelle="Résultats" fermee={sortie !== null} onFermer={() => sortie?.()} onDemandeFermeture={fermer}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography variant="h2">Résultats</Typography>
          <Typography color="text.secondary">{terminee ? 'Terminée' : 'En cours'}</Typography>
        </Box>
        {/* Presta terminée : la modifier sans la rouvrir, depuis le coin haut droit de la feuille. */}
        {terminee && (
          <Button variant="outlined" color="inherit" onClick={() => navigate(`/prestas/${id}/resultats/modifier`, { state: DEPUIS_APP })}>
            Modifier
          </Button>
        )}
      </Box>
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 2,
          rowGap: 0.5,
          m: 0,
          mb: 3,
          '& dt': { color: 'text.secondary' },
          '& dd': { m: 0 },
        }}
      >
        <dt>Date</dt>
        <dd>{formatDate(presta.date)}</dd>
        <dt>Client</dt>
        <dd>{presta.client?.trim() || '—'}</dd>
        <dt>Type</dt>
        <dd>{type?.nom ?? '—'}</dd>
      </Box>
      {groupe('Avec alcool', 'avec')}
      {groupe('Sans alcool', 'sans')}
      {/* Somme des lignes listées au-dessus, cocktails masqués compris. */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 2,
          pt: 1,
          mb: 3,
          borderTop: 2,
          borderColor: 'text.primary',
        }}
      >
        <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
          Total
        </Typography>
        <Typography component="span" sx={{ fontFamily: policeTitre, fontWeight: 800, fontSize: '1.75rem' }}>
          {total}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {terminee ? (
          <>
            <Button variant="contained" onClick={() => setRepriseAConfirmer(true)}>
              Reprendre
            </Button>
            <Button variant="outlined" color="inherit" onClick={fermer}>
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() =>
                // Quitter le comptage avant de changer le statut : sinon le comptage, qui ne s'affiche
                // que pour une presta en cours, redirigerait de lui-même vers les résultats.
                partir(() => {
                  navigate('/')
                  depots.prestas.changerStatut(id, 'terminee')
                })
              }
            >
              Terminer la presta
            </Button>
            {/* Presta en cours : « Annuler » referme juste la feuille sur le comptage. */}
            <Button variant="outlined" color="inherit" onClick={revenirAuComptage}>
              Annuler
            </Button>
          </>
        )}
      </Box>
      {repriseAConfirmer && (
        <Confirmation
          titre="Reprendre la presta ?"
          message="Elle repasse en cours et son comptage s’ouvre."
          onFermer={() => setRepriseAConfirmer(false)}
          actions={[
            {
              libelle: 'Reprendre',
              principale: true,
              onClick: () => {
                setRepriseAConfirmer(false)
                partir(() => {
                  depots.prestas.changerStatut(id, 'en-cours')
                  navigate(`/prestas/${id}`)
                })
              },
            },
            { libelle: 'Annuler', onClick: () => setRepriseAConfirmer(false) },
          ]}
        />
      )}
      {/* Feuille « Modifier » d'une presta terminée (route enfant), par-dessus celle-ci. */}
      {!onFermer && <Outlet />}
    </FeuilleModale>
  )
}
