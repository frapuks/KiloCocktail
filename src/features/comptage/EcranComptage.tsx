import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useMatch, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { formatDate, nomLigne, nomPresta } from '../../domain/affichage'
import { groupes } from '../../domain/lignes'
import { dernierVerre, totauxParLigne } from '../../domain/verres'
import type { Ligne } from '../../domain/types'
import { DEPUIS_APP } from '../../app/historique'
import { PastilleType } from '../../ui/PastilleType'
import { couleurGroupe, TitreSection } from '../../ui/TitreSection'
import { EcranResultats } from '../resultats/EcranResultats'
import { CarteCocktail } from './CarteCocktail'

export function EcranComptage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const depots = useDepots()
  const presta = usePresta(id)
  const cocktails = useCocktails()
  const types = useTypes()
  const donneesVerres = useVerres(id)
  const surModifier = useMatch('/prestas/:id/modifier') !== null
  const [resultatsOuverts, setResultatsOuverts] = useState(false)
  // Verres dont le retrait est lancé mais pas encore reflété par un instantané.
  const enCours = useRef(new Set<string>())
  // Dernier verre servi par carte : annulé si le toucher devient un défilement (pointercancel).
  const derniersServis = useRef(new Map<string, string>())

  const verres = donneesVerres?.verres
  useEffect(() => {
    if (!verres) return
    const presents = new Set(verres.map((v) => v.id))
    for (const idVerre of enCours.current) if (!presents.has(idVerre)) enCours.current.delete(idVerre)
  }, [verres])

  useEffect(() => {
    if (presta === null) navigate('/', { replace: true })
  }, [presta, navigate])

  if (!presta || !cocktails || !types || !donneesVerres) return null
  // Le comptage n'existe que pour une presta en cours : une terminée n'affiche que ses résultats (par-dessus la liste),
  // et la feuille « Modifier » ouverte par lien y suit.
  if (presta.statut === 'terminee')
    return <Navigate to={`/prestas/${id}/resultats${surModifier ? '/modifier' : ''}`} replace />

  const totaux = totauxParLigne(donneesVerres.verres)
  const type = types.find((t) => t.id === presta.typeId)
  const date = formatDate(presta.date)
  const { avec, sans } = groupes(presta.lignes, cocktails)

  // Le verre est écarté des retraits suivants tant que sa suppression est en cours ; si le serveur la refuse,
  // il réapparaît dans l'instantané et doit redevenir retirable.
  const lancerRetrait = (verreId: string) => {
    enCours.current.add(verreId)
    depots.verres.retirer(id, verreId).catch(() => enCours.current.delete(verreId))
  }

  const retirer = (ligneId: string) => {
    const verre = dernierVerre(donneesVerres.verres, ligneId, enCours.current)
    if (!verre) return false
    lancerRetrait(verre.id)
    return true
  }

  const servir = (ligneId: string) => {
    derniersServis.current.set(ligneId, depots.verres.servir(id, ligneId))
  }

  const annulerServir = (ligneId: string) => {
    const verreId = derniersServis.current.get(ligneId)
    if (!verreId) return
    derniersServis.current.delete(ligneId)
    lancerRetrait(verreId)
  }

  const bande = (titre: string, variante: 'avec' | 'sans', lignes: Ligne[]) => {
    const cartes = lignes.flatMap((ligne) => {
      const c = cocktails.find((k) => k.id === ligne.cocktailId)
      if (!c) return []
      const { nom, sousTitre } = nomLigne(c)
      return [
        <CarteCocktail
          key={ligne.id}
          nom={nom}
          sousTitre={sousTitre}
          total={totaux.get(ligne.id) ?? 0}
          variante={variante}
          onPlus={() => servir(ligne.id)}
          onAnnulerPlus={() => annulerServir(ligne.id)}
          onMoins={() => retirer(ligne.id)}
        />,
      ]
    })
    if (cartes.length === 0) return null
    // Chaque bande prend une hauteur proportionnelle à son nombre de rangées de cartes
    // (2 cartes par rangée, en paysage comme en portrait).
    return (
      <Box
        key={variante}
        component="section"
        sx={{
          flex: `${Math.ceil(cartes.length / 2)} 1 0`,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <TitreSection titre={titre} couleur={couleurGroupe(variante)} />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            // Le rebond de l'appui grossit la carte d'un poil au-delà de 100 % : sans ceci, une carte
            // de la colonne de droite fait apparaître une barre de défilement horizontale.
            overflowX: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            // Téléphone : cartes plus basses et plus serrées, pour en voir davantage à la fois.
            gridAutoRows: { xs: 'minmax(88px, 1fr)', sm: 'minmax(120px, 1fr)' },
            gap: { xs: '8px', sm: '12px' },
            // Nombre impair de cartes : la dernière, seule sur sa rangée, prend toute la largeur.
            '& > :last-child:nth-child(odd)': { gridColumn: '1 / -1' },
          }}
        >
          {cartes}
        </Box>
      </Box>
    )
  }

  const bandes = [bande('Avec alcool', 'avec', avec), bande('Sans alcool', 'sans', sans)]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        p: { xs: '8px', sm: '12px' },
        gap: { xs: '8px', sm: '12px' },
        // Écran tactile de comptage : pas de zoom au double tap, ni sélection ni menu au toucher long.
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <Box component="header" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 1 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontSize: 28, lineHeight: 1 }}>
            {nomPresta(presta)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
            {type && <PastilleType nom={type.nom} />}
            <Typography variant="body2" color="text.secondary">
              {date}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => navigate(`/prestas/${id}/modifier`, { state: DEPUIS_APP })}>
            Modifier
          </Button>
          <Button variant="contained" onClick={() => setResultatsOuverts(true)}>
            Résultats
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/')}>
            Fermer
          </Button>
        </Box>
      </Box>
      {bandes.every((b) => b === null) ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>
          Aucun cocktail sur la carte. Ajoute-en avec « Modifier ».
        </Typography>
      ) : (
        <Box
          component="main"
          sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: { xs: '8px', sm: '12px' } }}
        >
          {bandes}
        </Box>
      )}
      {resultatsOuverts && <EcranResultats onFermer={() => setResultatsOuverts(false)} />}
      <Outlet />
    </Box>
  )
}
