import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { frFR } from '@mui/x-date-pickers/locales'

interface Props {
  label: string
  // Date au format AAAA-MM-JJ, comme dans les données.
  valeur: string
  onChange(date: string): void
}

const TEXTES = frFR.components.MuiLocalizationProvider.defaultProps.localeText

// Champ date aux couleurs de l'appli : le calendrier s'ouvre au tap et se ferme au choix du jour.
// Pas d'effacement possible : une presta a toujours une date.
export function ChampDate({ label, valeur, onChange }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr" localeText={TEXTES}>
      <MobileDatePicker
        label={label}
        value={dayjs(valeur)}
        format="DD/MM/YYYY"
        closeOnSelect
        onAccept={(d) => {
          if (d?.isValid()) onChange(d.format('YYYY-MM-DD'))
        }}
        slotProps={{
          textField: { fullWidth: true },
          actionBar: { actions: ['cancel'] },
          toolbar: { hidden: true },
        }}
      />
    </LocalizationProvider>
  )
}
