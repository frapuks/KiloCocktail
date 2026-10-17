import type { CSSProperties, ReactNode } from 'react'

export const champ: CSSProperties = {
  minHeight: 44,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--filet)',
  background: 'transparent',
  color: 'var(--texte)',
  font: 'inherit',
}

export const bouton: CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 8,
  border: '1px solid var(--filet)',
  background: 'transparent',
  color: 'var(--texte)',
  font: 'inherit',
  fontWeight: 600,
}

interface Props {
  libelle: string
  onSubmit(): void
  children: ReactNode
}

export function FeuilleModale({ libelle, onSubmit, children }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={libelle}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        style={{
          background: 'var(--fond)',
          borderTop: '1px solid var(--filet)',
          borderRadius: '12px 12px 0 0',
          padding: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {children}
      </form>
    </div>
  )
}
