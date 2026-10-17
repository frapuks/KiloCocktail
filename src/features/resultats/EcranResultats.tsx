import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { formatDate, nomLigne } from '../../domain/affichage'
import { totauxParLigne } from '../../domain/verres'
import './resultats.css'

export function EcranResultats() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const depots = useDepots()
  const presta = usePresta(id)
  const cocktails = useCocktails()
  const types = useTypes()
  const donneesVerres = useVerres(id)

  useEffect(() => {
    if (presta === null) navigate('/', { replace: true })
  }, [presta, navigate])

  if (!presta || !cocktails || !types || !donneesVerres) return null

  const totaux = totauxParLigne(donneesVerres.verres)
  const type = types.find((t) => t.id === presta.typeId)
  const terminee = presta.statut === 'terminee'

  const groupe = (titre: string, variante: 'avec' | 'sans') => {
    const items = presta.lignes
      .filter((l) => l.variante === variante)
      .flatMap((ligne) => {
        const c = cocktails.find((k) => k.id === ligne.cocktailId)
        if (!c) return []
        const { nom, sousTitre } = nomLigne(ligne, c)
        return [
          <li key={ligne.id} className="resultats-ligne">
            <span className="resultats-nom">
              {nom}
              {sousTitre && <small className="resultats-sous-titre">{sousTitre}</small>}
            </span>
            <span className="resultats-total">{totaux.get(ligne.id) ?? 0}</span>
          </li>,
        ]
      })
    if (items.length === 0) return null
    return (
      <section className="resultats-groupe">
        <h2 className={`resultats-titre resultats-titre-${variante}`}>{titre}</h2>
        <ul className="resultats-liste">{items}</ul>
      </section>
    )
  }

  return (
    <main className="resultats">
      <h1>Résultats</h1>
      <p className="resultats-statut">{terminee ? 'Terminée · lecture seule' : 'En cours'}</p>
      <dl className="resultats-infos">
        <dt>Date</dt>
        <dd>{formatDate(presta.date)}</dd>
        <dt>Client</dt>
        <dd>{presta.client?.trim() || '—'}</dd>
        <dt>Type</dt>
        <dd>{type?.nom ?? '—'}</dd>
      </dl>
      {groupe('Avec alcool', 'avec')}
      {groupe('Sans alcool', 'sans')}
      <div className="resultats-actions">
        {terminee ? (
          <>
            <button type="button" onClick={() => navigate(`/prestas/${id}/modifier`)}>Modifier</button>
            <button
              type="button"
              onClick={() => {
                depots.prestas.changerStatut(id, 'en-cours')
                navigate(`/prestas/${id}`)
              }}
            >
              Reprendre le comptage
            </button>
          </>
        ) : (
          <button type="button" onClick={() => navigate(`/prestas/${id}`)}>Retour au comptage</button>
        )}
      </div>
    </main>
  )
}
