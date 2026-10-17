import { useEffect, useRef } from 'react'

interface Props {
  titre: string
  message?: string
  actions: { libelle: string; onClick(): void; danger?: boolean; desactive?: boolean }[]
  onFermer(): void
}

export function Confirmation({ titre, message, actions, onFermer }: Props) {
  const premiere = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    premiere.current?.focus()
  }, [])

  return (
    <div
      onClick={onFermer}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onFermer()
        }}
        style={{
          background: 'var(--fond)',
          border: '1px solid var(--filet)',
          borderRadius: 12,
          padding: 20,
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontFamily: 'var(--police-titre)', fontWeight: 600 }}>{titre}</h2>
        {message && <p style={{ margin: 0, color: 'var(--texte-2)' }}>{message}</p>}
        {actions.map((a, i) => (
          <button
            key={a.libelle}
            ref={i === 0 ? premiere : undefined}
            type="button"
            disabled={a.desactive}
            onClick={a.onClick}
            style={{
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid var(--filet)',
              background: a.danger ? 'var(--moins)' : 'transparent',
              color: a.danger ? '#323232' : 'var(--texte)',
              font: 'inherit',
              fontWeight: 600,
              opacity: a.desactive ? 0.6 : 1,
            }}
          >
            {a.libelle}
          </button>
        ))}
      </div>
    </div>
  )
}
