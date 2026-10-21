import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import RemoveIcon from '@mui/icons-material/Remove'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import { alpha, keyframes } from '@mui/material/styles'
import { libelleCumul } from '../../domain/cumul'
import type { Variante } from '../../domain/types'
import { CompteurServis } from '../../ui/CompteurServis'
import { policeTitre } from '../../ui/themeMui'
import { useCumul } from './useCumul'

interface Props {
  nom: string
  sousTitre: string | null
  total: number
  variante: Variante
  onPlus(): void
  onAnnulerPlus(): void
  onMoins(): boolean
}

// Onde maison plutôt que le ripple MUI : celui-ci écoute lui-même les pointeurs et brouillerait
// l'annulation du +1 quand le toucher devient un défilement (pointercancel).
interface Onde {
  id: number
  x: number
  y: number
  diametre: number
}

const MAX_ONDES = 6

const propager = keyframes`
  from { transform: translate(-50%, -50%) scale(0); opacity: 0.55; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`

const SANS_ANIMATION = '@media (prefers-reduced-motion: reduce)'

const estValidation = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' '

export function CarteCocktail({ nom, sousTitre, total, variante, onPlus, onAnnulerPlus, onMoins }: Props) {
  const { cumul, taper, annuler } = useCumul()
  // Pointeur du dernier +1, tant qu'il peut encore être annulé par un pointercancel (défilement).
  const dernierPlus = useRef<{ pointerId: number } | null>(null)
  // Relance le rebond du total à chaque tap.
  const [rebond, setRebond] = useState(0)
  const [appuyee, setAppuyee] = useState(false)
  const [ondes, setOndes] = useState<Onde[]>([])
  const prochaineOnde = useRef(0)
  const couleur = variante === 'avec' ? 'primary' : 'secondary'

  const lancerOnde = (el: HTMLElement, clientX: number | null, clientY: number | null) => {
    const r = el.getBoundingClientRect()
    const x = clientX === null ? r.width / 2 : clientX - r.left
    const y = clientY === null ? r.height / 2 : clientY - r.top
    // Diamètre qui couvre la carte jusqu'au coin le plus éloigné du doigt.
    const diametre = 2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y))
    const onde = { id: prochaineOnde.current++, x, y, diametre }
    setOndes((o) => [...o.slice(-(MAX_ONDES - 1)), onde])
  }

  const plus = (pointerId: number | null) => {
    dernierPlus.current = pointerId === null ? null : { pointerId }
    onPlus()
    taper(1)
    setRebond((n) => n + 1)
  }
  const moins = () => {
    if (total === 0 || !onMoins()) return
    dernierPlus.current = null
    taper(-1)
    setRebond((n) => n + 1)
  }

  return (
    <Card
      elevation={0}
      role="button"
      tabIndex={0}
      aria-label={sousTitre ? `${nom}, ${sousTitre}` : nom}
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
        if ((e.target as Element).closest('button')) return
        setAppuyee(true)
        lancerOnde(e.currentTarget, e.clientX, e.clientY)
        plus(e.pointerId)
      }}
      onPointerUp={() => setAppuyee(false)}
      onPointerLeave={() => setAppuyee(false)}
      onPointerCancel={(e: PointerEvent) => {
        setAppuyee(false)
        const dernier = dernierPlus.current
        if (!dernier || dernier.pointerId !== e.pointerId) return
        dernierPlus.current = null
        annuler()
        onAnnulerPlus()
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || !estValidation(e)) return
        e.preventDefault()
        lancerOnde(e.currentTarget, null, null)
        plus(null)
      }}
      sx={(t) => ({
        // Un élément par coin : la rangée du milieu prend toute la hauteur libre, donc les coins suivent
        // la carte quelle que soit sa taille. Les tailles suivent aussi la carte (cqi / cqh : % de sa largeur / hauteur).
        containerType: 'size',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        gridTemplateAreas: '"nom cumul" ". ." "servis moins"',
        // Marges et espaces proportionnels à la carte, avec des minimums bas : sur téléphone, la carte s'affine.
        columnGap: 'clamp(6px, 3cqi, 12px)',
        p: 'clamp(6px, 6cqh, 18px) clamp(8px, 4cqi, 20px)',
        borderRadius: 'clamp(10px, 8cqh, 16px)',
        bgcolor: `${couleur}.main`,
        color: 'text.primary',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        // Appui : la carte se tasse au contact, puis revient avec un léger rebond.
        transform: appuyee ? 'scale(0.97)' : 'none',
        transition: appuyee ? 'transform 80ms ease-out' : 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:focus-visible': { outline: `3px solid ${t.palette.text.primary}`, outlineOffset: 2 },
        [SANS_ANIMATION]: { transform: 'none', transition: 'none' },
      })}
    >
      {ondes.map((o) => (
        <Box
          key={o.id}
          component="span"
          aria-hidden="true"
          onAnimationEnd={() => setOndes((liste) => liste.filter((x) => x.id !== o.id))}
          sx={(t) => ({
            position: 'absolute',
            left: o.x,
            top: o.y,
            width: o.diametre,
            height: o.diametre,
            borderRadius: '50%',
            pointerEvents: 'none',
            bgcolor: alpha(t.palette[couleur].light, 0.9),
            opacity: 0,
            animation: `${propager} 520ms ease-out`,
            [SANS_ANIMATION]: { display: 'none' },
          })}
        />
      ))}

      {/* Haut gauche : nom (et sous-titre). */}
      <Box sx={{ gridArea: 'nom', alignSelf: 'start', position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <Box
          component="span"
          sx={{
            fontFamily: policeTitre,
            fontWeight: 800,
            fontSize: 'clamp(18px, min(8cqi, 24cqh), 56px)',
            lineHeight: 1.1,
            // Une seule ligne : « … » si le nom ne rentre pas (le nom complet reste dans l'aria-label de la carte).
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {nom}
        </Box>
        {sousTitre && (
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 'clamp(11px, 9cqh, 15px)' }}>
            {sousTitre}
          </Box>
        )}
      </Box>

      {/* Haut droite : cumul des derniers taps (« +3 »), visible juste après un tap. */}
      <Box
        component="span"
        aria-hidden="true"
        // Opacité en style direct : l'apparition doit être immédiate au tap.
        style={{ opacity: cumul ? 1 : 0 }}
        sx={(t) => ({
          gridArea: 'cumul',
          alignSelf: 'start',
          justifySelf: 'end',
          position: 'relative',
          minWidth: 'clamp(48px, 18cqi, 112px)',
          height: 'clamp(30px, 28cqh, 70px)',
          px: 'clamp(6px, 2.5cqi, 14px)',
          borderRadius: 999,
          bgcolor: cumul?.signe === -1 ? 'warning.main' : 'text.primary',
          color: t.palette[couleur].dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: policeTitre,
          fontWeight: 800,
          fontSize: 'clamp(20px, 22cqh, 54px)',
          lineHeight: 1,
        })}
      >
        {cumul ? libelleCumul(cumul) : ''}
      </Box>

      {/* Bas gauche : total servi. */}
      <CompteurServis
        total={total}
        rebond={rebond}
        sx={{
          gridArea: 'servis',
          alignSelf: 'end',
          justifySelf: 'start',
          position: 'relative',
          fontSize: 'clamp(12px, 10cqh, 22px)',
          gap: '2px 6px',
        }}
      />

      {/* Bas droite : retirer un verre. 40 px minimum pour rester facile à toucher.
          La zone autour arrête le toucher : désactivé (total à 0), le bouton n'en reçoit plus (MUI coupe
          ses événements de pointeur) et un tap sur lui compterait sinon un verre sur la carte. */}
      <Box
        data-zone-moins
        onPointerDown={(e) => e.stopPropagation()}
        sx={{ gridArea: 'moins', alignSelf: 'end', justifySelf: 'end', position: 'relative', display: 'flex' }}
      >
        <IconButton
          aria-label={`Retirer un ${nom}${sousTitre ? ` ${sousTitre}` : ''}`}
          disabled={total === 0}
          onPointerDown={(e) => {
            e.stopPropagation()
            moins()
          }}
          onKeyDown={(e) => {
            if (!estValidation(e)) return
            e.preventDefault()
            e.stopPropagation()
            moins()
          }}
          sx={{
            width: 'clamp(40px, 26cqh, 56px)',
            height: 'clamp(40px, 26cqh, 56px)',
            border: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(0, 0, 0, 0.18)',
            color: 'text.primary',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.28)' },
            '&.Mui-disabled': { color: 'text.primary', opacity: 0.35 },
          }}
        >
          {/* Icône plutôt que le caractère « − », que la police décale dans le cercle. */}
          <RemoveIcon sx={{ fontSize: 'clamp(22px, 15cqh, 30px)' }} />
        </IconButton>
      </Box>
    </Card>
  )
}
