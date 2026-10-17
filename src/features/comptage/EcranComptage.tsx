import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useDepots } from '../../data/DepotsContext'
import { useCocktails, usePresta, useTypes, useVerres } from '../../data/hooks'
import { formatDateLongue, nomLigne, nomPresta } from '../../domain/affichage'
import { groupes } from '../../domain/lignes'
import { dernierVerre, totauxParLigne } from '../../domain/verres'
import type { Ligne } from '../../domain/types'
import { IndicateurSauvegarde } from '../../ui/IndicateurSauvegarde'
import { CarteCocktail } from './CarteCocktail'
import './comptage.css'

export function EcranComptage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const depots = useDepots()
  const presta = usePresta(id)
  const cocktails = useCocktails()
  const types = useTypes()
  const donneesVerres = useVerres(id)
  // Verres dont le retrait est lancé mais pas encore reflété par un instantané.
  const enCours = useRef(new Set<string>())

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
  if (presta.statut === 'terminee') return <Navigate to={`/prestas/${id}/resultats`} replace />

  const totaux = totauxParLigne(donneesVerres.verres)
  const type = types.find((t) => t.id === presta.typeId)
  const date = formatDateLongue(presta.date)
  const { avec, sans } = groupes(presta.lignes)

  const retirer = (ligneId: string) => {
    const verre = dernierVerre(donneesVerres.verres, ligneId, enCours.current)
    if (!verre) return false
    enCours.current.add(verre.id)
    depots.verres.retirer(id, verre.id)
    return true
  }

  const terminer = () => {
    depots.prestas.changerStatut(id, 'terminee')
    navigate(`/prestas/${id}/resultats`)
  }

  const bande = (titre: string, variante: 'avec' | 'sans', lignes: Ligne[]) => {
    const cartes = lignes.flatMap((ligne) => {
      const c = cocktails.find((k) => k.id === ligne.cocktailId)
      if (!c) return []
      const { nom, sousTitre } = nomLigne(ligne, c)
      return [
        <CarteCocktail
          key={ligne.id}
          nom={nom}
          sousTitre={sousTitre}
          total={totaux.get(ligne.id) ?? 0}
          variante={variante}
          onPlus={() => depots.verres.servir(id, ligne.id)}
          onMoins={() => retirer(ligne.id)}
        />,
      ]
    })
    if (cartes.length === 0) return null
    const style = {
      '--rangees-paysage': Math.ceil(cartes.length / 2),
      '--rangees-portrait': cartes.length,
    } as CSSProperties
    return (
      <section key={variante} className="bande" style={style}>
        <h2 className={`bande-titre bande-titre-${variante}`}>{titre}</h2>
        <div className="grille">{cartes}</div>
      </section>
    )
  }

  const bandes = [bande('Avec alcool', 'avec', avec), bande('Sans alcool', 'sans', sans)]

  return (
    <div className="comptage">
      <header className="comptage-entete">
        <Link to="/" className="comptage-retour">← Prestas</Link>
        <div className="comptage-titres">
          <h1>{nomPresta(presta)}</h1>
          <p>{type ? `${type.nom} · ${date}` : date}</p>
        </div>
        <IndicateurSauvegarde etat={donneesVerres.etat} />
        <div className="comptage-actions">
          <button type="button" onClick={() => navigate(`/prestas/${id}/modifier`)}>Modifier</button>
          <button type="button" onClick={() => navigate(`/prestas/${id}/resultats`)}>Résultats</button>
          <button type="button" onClick={terminer}>Terminer</button>
        </div>
      </header>
      {bandes.every((b) => b === null) ? (
        <p className="comptage-vide">Aucun cocktail sur la carte. Ajoute-en avec « Modifier ».</p>
      ) : (
        <main className="bandes">{bandes}</main>
      )}
    </div>
  )
}
