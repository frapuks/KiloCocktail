import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface TypeBackground {
    carte: string
  }
}

export const policeTitre = "'Big Shoulders Display', 'Arial Narrow', sans-serif"

// Seule source des couleurs et polices de l'appli (rendue globale par CssBaseline).
// Comptage : « avec alcool » = primary, « sans alcool » = secondary ; light = flash au tap, dark = creux ;
// warning = retrait (−).
export const themeMui = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#408533', light: '#6cc25a', dark: '#2b5c23', contrastText: '#f2f5ef' },
    secondary: { main: '#5d7656', light: '#84a07b', dark: '#3d4f38', contrastText: '#f2f5ef' },
    success: { main: '#408533', contrastText: '#f2f5ef' },
    warning: { main: '#e0ad4a' },
    background: { default: '#323232', paper: '#242424', carte: '#3d3e3b' },
    text: { primary: '#f2f5ef', secondary: '#b3baad' },
    divider: '#4b4d49',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif",
    // Tailles par défaut du navigateur (2em / 1.5em), celles des écrans d'avant MUI.
    h1: { fontFamily: policeTitre, fontWeight: 800, fontSize: '2rem', lineHeight: 1.15 },
    h2: { fontFamily: policeTitre, fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.15 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: 16 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          // Boutons secondaires : filet discret plutôt que la bordure claire par défaut.
          variants: [{ props: { variant: 'outlined', color: 'inherit' }, style: { borderColor: '#4b4d49' } }],
        },
      },
    },
    // Espacement par gap : sinon Stack remet à zéro la marge de ses enfants (ex. marge haute de l'en-tête).
    MuiStack: {
      defaultProps: { useFlexGap: true },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
})
