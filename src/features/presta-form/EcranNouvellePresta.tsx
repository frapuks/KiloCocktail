import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, useTypes } from '../../data/hooks'
import { dateDuJour } from '../../domain/affichage'
import { deplacerDansGroupe, optionsAbsentes } from '../../domain/lignes'
import type { Ligne } from '../../domain/types'
import { ChampDate } from '../../ui/ChampDate'
import { BoutonAnnulerFeuille, FeuilleModale } from '../../ui/FeuilleModale'
import { ChampType } from './ChampType'
import { FeuilleAjoutCocktails } from './FeuilleAjoutCocktails'
import { SurLaCarte } from './SurLaCarte'

// Feuille ouverte par-dessus la liste des prestas (route imbriquée sous « / ») :
// Annuler ou un tap à côté la font redescendre, puis ramènent à la liste.
export function EcranNouvellePresta() {
  const depots = useDepots()
  const navigate = useNavigate()
  const cocktailsHook = useCocktails()
  const typesHook = useTypes()
  const [date, setDate] = useState(() => dateDuJour())
  const [client, setClient] = useState('')
  const [typeId, setTypeId] = useState<string | null>(null)
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [ajout, setAjout] = useState(false)

  const cocktails = cocktailsHook ?? []
  const types = typesHook ?? []

  function commencer() {
    const id = depots.prestas.creer({ date, client: client.trim() || null, typeId, lignes })
    navigate(`/prestas/${id}`, { replace: true })
  }

  return (
    <FeuilleModale libelle="Nouvelle presta" onFermer={() => navigate('/')}>
      <Typography variant="h2">Nouvelle presta</Typography>
      <ChampDate label="Date" valeur={date} onChange={setDate} />
      <TextField label="Client" value={client} onChange={(e) => setClient(e.target.value)} />
      <ChampType
        types={types}
        valeur={typeId}
        onChange={setTypeId}
      />
      <SurLaCarte
        lignes={lignes}
        cocktails={cocktails}
        onDeplacer={(variante, de, vers) => setLignes((l) => deplacerDansGroupe(l, cocktails, variante, de, vers))}
        // Rien n'est encore compté : on retire sans confirmation.
        onRetirer={(ligneId) => setLignes((l) => l.filter((x) => x.id !== ligneId))}
        onAjouter={() => setAjout(true)}
      />
      {ajout && (
        <FeuilleAjoutCocktails
          options={optionsAbsentes(cocktails, lignes)}
          onAjouter={(nouvelles) => {
            setLignes((l) => [...l, ...nouvelles])
            setAjout(false)
          }}
          onAnnuler={() => setAjout(false)}
        />
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={commencer}>
          Commencer la presta
        </Button>
        <BoutonAnnulerFeuille />
      </Box>
    </FeuilleModale>
  )
}
