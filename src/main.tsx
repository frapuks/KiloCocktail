import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/big-shoulders-display/600'
import '@fontsource/big-shoulders-display/800'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import CssBaseline from '@mui/material/CssBaseline'
import { themeMui } from './ui/themeMui'
import { App } from './app/App'
import { db } from './data/firebase'
import { creerDepots } from './data/firestore'

// Demande au navigateur de ne pas purger le stockage local (résultat ignoré).
navigator.storage?.persist?.()?.catch(() => {})

const fabriqueDepots = (uid: string) => creerDepots(db, uid)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={themeMui}>
      {/* Fond, couleur et police de la page, box-sizing : tout vient du thème. */}
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <App fabriqueDepots={fabriqueDepots} />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
