import { useEffect, useState } from 'react'
import EditIcon from '@mui/icons-material/Edit'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { useBases, useCocktails } from '../../data/hooks'
import { comparerNoms } from '../../domain/affichage'
import type { Cocktail } from '../../domain/types'
import { ConfirmationArchivage } from '../../ui/ConfirmationArchivage'
import { EnTeteEcran } from '../../ui/EnTeteEcran'
import { FiltreAlcool, gardeAlcool } from '../../ui/FiltreAlcool'
import { FiltreBase, gardeBase, TOUTES } from '../../ui/FiltreBase'
import { PastilleAlcool } from '../../ui/PastilleAlcool'
import { SectionArchives } from '../../ui/SectionArchives'
import { TitreSection } from '../../ui/TitreSection'
import { FicheCocktail } from './FicheCocktail'
import { InfosCocktail } from './InfosCocktail'

const pluriel = (n: number, un: string, plusieurs: string) => (n === 1 ? un : plusieurs)

// Confirmation de suppression : chiffre ce qui sera perdu (calculé à l'ouverture, prestas terminées comprises).
export function texteSuppression(impact: { prestas: number; verres: number }): string {
  if (impact.prestas === 0) return 'Le cocktail sera supprimé de l’appli. Aucune presta ne l’a à sa carte. C’est définitif.'
  const prestas = `${impact.prestas} ${pluriel(impact.prestas, 'presta', 'prestas')}`
  const verres =
    impact.verres === 0
      ? 'aucun verre n’avait été compté pour lui'
      : `les ${impact.verres} ${pluriel(impact.verres, 'verre compté', 'verres comptés')} pour lui seront perdus`
  return `Le cocktail sera supprimé de l’appli et retiré de la carte de ${prestas} ; ${verres}. C’est définitif.`
}

function MessageSuppression({ id }: { id: string }) {
  const depots = useDepots()
  const [texte, setTexte] = useState<string | null>(null)
  useEffect(() => {
    let actif = true
    depots.cocktails.impactSuppression(id).then(
      (impact) => actif && setTexte(texteSuppression(impact)),
      // Hors connexion, l'impact ne peut pas être chiffré (et la suppression sera refusée).
      () =>
        actif &&
        setTexte('Le cocktail sera supprimé de l’appli, avec les verres comptés pour lui. C’est définitif. Une connexion internet est nécessaire.'),
    )
    return () => {
      actif = false
    }
  }, [depots, id])
  return <>{texte ?? 'Calcul des prestas et des verres concernés…'}</>
}

export function EcranCocktails() {
  const depots = useDepots()
  const cocktails = useCocktails()
  const bases = useBases()
  // 'nouveau' = création, Cocktail = modification, null = fiche fermée
  const [fiche, setFiche] = useState<'nouveau' | Cocktail | null>(null)
  // Cocktail dont la fiche en lecture seule (description) est ouverte.
  const [infos, setInfos] = useState<Cocktail | null>(null)
  // Cocktail dont l'archivage (icône de sa fiche) attend confirmation.
  const [archivageAConfirmer, setArchivageAConfirmer] = useState<Cocktail | null>(null)
  const [filtre, setFiltre] = useState<FiltreAlcool>('tous')
  const [filtreBase, setFiltreBase] = useState<FiltreBase>(TOUTES)

  if (!cocktails) return <Typography sx={{ p: 2 }} color="text.secondary">Chargement…</Typography>

  const deLaBase = cocktails.filter(gardeBase(filtreBase))
  const visibles = deLaBase.filter(gardeAlcool[filtre])
  const actifs = visibles.filter((c) => !c.archive).sort(comparerNoms)
  const archives = visibles.filter((c) => c.archive).sort(comparerNoms)

  return (
    <Box component="main" sx={{ p: 2, pb: 12 }}>
      <EnTeteEcran titre="Cocktails" action={{ libelle: 'Nouveau cocktail', onClick: () => setFiche('nouveau') }} />

      {/* Compteurs sur les cocktails actifs de la base choisie, ceux de la liste principale. */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <FiltreAlcool valeur={filtre} onChange={setFiltre} cocktails={deLaBase.filter((c) => !c.archive)} />
        <FiltreBase valeur={filtreBase} onChange={setFiltreBase} bases={bases ?? []} />
      </Box>

      <Box sx={{ mt: 3 }}>
        <TitreSection titre="Disponibles" />
      </Box>
      {/* En retrait sous le titre, nom puis Modifier, qui ouvre la fiche (où se trouve l'archivage). */}
      <List sx={{ mt: 1, mb: 3, pl: 2 }} disablePadding>
        {actifs.map((c) => (
          <ListItem key={c.id} divider disableGutters sx={{ minHeight: 56, gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Une seule ligne : « … » si le nom ne rentre pas, la pastille et les icônes restent visibles. */}
              <Typography component="span" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
                {c.nom}
              </Typography>
              {/* Seuls les sans alcool sont marqués : c'est l'exception. */}
              {!c.alcool && (
                <Box sx={{ flexShrink: 0, display: 'flex' }}>
                  <PastilleAlcool alcool={false} />
                </Box>
              )}
            </Box>
            {c.description && (
              <IconButton aria-label={`Voir ${c.nom}`} onClick={() => setInfos(c)}>
                <InfoOutlinedIcon />
              </IconButton>
            )}
            <IconButton aria-label={`Modifier ${c.nom}`} onClick={() => setFiche(c)}>
              <EditIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>

      <SectionArchives
        elements={archives}
        libelle={(c) => (c.alcool ? c.nom : `${c.nom} · sans alcool`)}
        onModifier={(c) => setFiche(c)}
        onDesarchiver={(c) => depots.cocktails.archiver(c.id, false)}
        suppression={{
          message: (c) => <MessageSuppression id={c.id} />,
          onSupprimer: (c) => depots.cocktails.supprimer(c.id),
        }}
      />

      {infos && (
        <InfosCocktail
          key={infos.id}
          cocktail={infos}
          base={bases?.find((b) => b.id === infos.baseId)}
          onModifier={() => {
            setFiche(infos)
            setInfos(null)
          }}
          onFermer={() => setInfos(null)}
        />
      )}
      {fiche && (
        <FicheCocktail
          key={fiche === 'nouveau' ? 'nouveau' : fiche.id}
          cocktail={fiche === 'nouveau' ? undefined : fiche}
          cocktails={cocktails}
          bases={bases ?? []}
          onAnnuler={() => setFiche(null)}
          onEnregistrer={(liste) => {
            if (fiche === 'nouveau') liste.forEach((d) => depots.cocktails.creer(d))
            else depots.cocktails.modifier(fiche.id, liste[0])
            setFiche(null)
          }}
          // Pas d'« Archiver » dans la fiche d'un cocktail déjà archivé.
          onArchiver={fiche === 'nouveau' || fiche.archive ? undefined : () => setArchivageAConfirmer(fiche)}
        />
      )}
      {archivageAConfirmer && (
        <ConfirmationArchivage
          nom={archivageAConfirmer.nom}
          onFermer={() => setArchivageAConfirmer(null)}
          onArchiver={() => {
            depots.cocktails.archiver(archivageAConfirmer.id, true)
            setArchivageAConfirmer(null)
            setFiche(null)
          }}
        />
      )}
    </Box>
  )
}
