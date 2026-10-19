// Remplit les émulateurs avec un jeu de données de démonstration : types, cocktails, prestas et verres servis.
// Usage : émulateurs lancés (npm run emulateurs), puis npm run remplir.
// Attention : vide d'abord TOUT le Firestore de l'émulateur.
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  terminate,
  Timestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { normaliserNom } from '../src/domain/noms.ts';
import type { Ligne, StatutPresta, Variante, Variantes } from '../src/domain/types.ts';

const PROJET = 'demo-kilococktail';
const EMAIL = 'barman@kilococktail.test';
const MOT_DE_PASSE = 'motdepasse123';
const TAILLE_LOT = 500;

// Générateur pseudo-aléatoire à graine fixe : le jeu de données est le même à chaque exécution.
let graine = 42;
function aleatoire(): number {
  graine = (graine * 1103515245 + 12345) % 2 ** 31;
  return graine / 2 ** 31;
}
const entre = (min: number, max: number) => min + Math.floor(aleatoire() * (max - min + 1));

const TYPES = [
  { id: 'anniversaire', nom: 'Anniversaire' },
  { id: 'soiree-entreprise', nom: "Soirée d'entreprise" },
  { id: 'mariage', nom: 'Mariage' },
  { id: 'cocktail-dinatoire', nom: 'Cocktail dînatoire' },
  { id: 'bapteme', nom: 'Baptême', archive: true },
  { id: 'enterrement-vie-celibataire', nom: 'Enterrement de vie de célibataire' },
  { id: 'seminaire', nom: 'Séminaire' },
  { id: 'vernissage', nom: 'Vernissage' },
  { id: 'fete-de-quartier', nom: 'Fête de quartier' },
  { id: 'soiree-privee', nom: 'Soirée privée' },
];

const COCKTAILS: { id: string; nom: string; variantes: Variantes; nomSansAlcool?: string; archive?: boolean }[] = [
  { id: 'mojito', nom: 'Mojito', variantes: 'les-deux', nomSansAlcool: 'Nojito' },
  { id: 'pina-colada', nom: 'Piña Colada', variantes: 'les-deux', nomSansAlcool: 'Virgin Colada' },
  { id: 'spritz', nom: 'Spritz', variantes: 'avec' },
  { id: 'margarita', nom: 'Margarita', variantes: 'avec' },
  { id: 'cosmopolitan', nom: 'Cosmopolitan', variantes: 'avec' },
  { id: 'moscow-mule', nom: 'Moscow Mule', variantes: 'les-deux' },
  { id: 'gin-tonic', nom: 'Gin Tonic', variantes: 'avec' },
  { id: 'limonade-maison', nom: 'Limonade maison', variantes: 'sans' },
  { id: 'cafe-frappe', nom: 'Café frappé', variantes: 'sans' },
  { id: 'blue-lagoon', nom: 'Blue Lagoon', variantes: 'avec', archive: true },
  { id: 'caipirinha', nom: 'Caïpirinha', variantes: 'avec' },
  { id: 'daiquiri', nom: 'Daïquiri', variantes: 'les-deux', nomSansAlcool: 'Virgin Daïquiri' },
  { id: 'negroni', nom: 'Negroni', variantes: 'avec' },
  { id: 'espresso-martini', nom: 'Espresso Martini', variantes: 'avec' },
  { id: 'sex-on-the-beach', nom: 'Sex on the Beach', variantes: 'les-deux', nomSansAlcool: 'Safe Sex on the Beach' },
  { id: 'tequila-sunrise', nom: 'Tequila Sunrise', variantes: 'les-deux', nomSansAlcool: 'Sunrise' },
  { id: 'bellini', nom: 'Bellini', variantes: 'avec' },
  { id: 'americano', nom: 'Americano', variantes: 'avec', archive: true },
  { id: 'citronnade-menthe', nom: 'Citronnade à la menthe', variantes: 'sans' },
  { id: 'the-glace-peche', nom: 'Thé glacé pêche', variantes: 'sans' },
];

interface PrestaDemo {
  decalageJours: number; // par rapport à aujourd'hui
  client: string | null;
  typeId: string | null;
  statut: StatutPresta;
  cocktails: { id: string; variantes?: Variante[] }[];
  servis: [number, number]; // fourchette de verres par ligne
}

const PRESTAS: PrestaDemo[] = [
  {
    decalageJours: -62, client: 'Julie Martin', typeId: 'anniversaire', statut: 'terminee', servis: [10, 40],
    cocktails: [{ id: 'mojito' }, { id: 'spritz' }, { id: 'limonade-maison' }],
  },
  {
    decalageJours: -41, client: 'Acme SAS', typeId: 'soiree-entreprise', statut: 'terminee', servis: [30, 90],
    cocktails: [{ id: 'gin-tonic' }, { id: 'moscow-mule' }, { id: 'margarita' }, { id: 'cafe-frappe' }],
  },
  {
    decalageJours: -20, client: 'Léa & Thomas', typeId: 'mariage', statut: 'terminee', servis: [40, 120],
    cocktails: [{ id: 'mojito' }, { id: 'pina-colada' }, { id: 'cosmopolitan' }, { id: 'spritz' }],
  },
  {
    decalageJours: -9, client: null, typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [5, 25],
    cocktails: [{ id: 'spritz' }, { id: 'pina-colada', variantes: ['sans'] }],
  },
  {
    decalageJours: -2, client: 'Mairie de Lyon', typeId: null, statut: 'terminee', servis: [15, 50],
    cocktails: [{ id: 'gin-tonic' }, { id: 'limonade-maison' }, { id: 'mojito', variantes: ['avec'] }],
  },
  {
    decalageJours: 0, client: 'Nadia Benali', typeId: 'anniversaire', statut: 'en-cours', servis: [0, 12],
    cocktails: [{ id: 'mojito' }, { id: 'margarita' }, { id: 'moscow-mule' }, { id: 'limonade-maison' }],
  },
  {
    decalageJours: 5, client: 'Studio Pixel', typeId: 'soiree-entreprise', statut: 'en-cours', servis: [0, 0],
    cocktails: [{ id: 'cosmopolitan' }, { id: 'gin-tonic' }, { id: 'cafe-frappe' }],
  },
  {
    decalageJours: -180, client: 'Camille Durand', typeId: 'anniversaire', statut: 'terminee', servis: [8, 30],
    cocktails: [{ id: 'caipirinha' }, { id: 'daiquiri' }, { id: 'the-glace-peche' }],
  },
  {
    decalageJours: -165, client: 'BNP Paribas', typeId: 'soiree-entreprise', statut: 'terminee', servis: [50, 140],
    cocktails: [{ id: 'negroni' }, { id: 'espresso-martini' }, { id: 'gin-tonic' }, { id: 'citronnade-menthe' }],
  },
  {
    decalageJours: -150, client: 'Sarah & Mehdi', typeId: 'mariage', statut: 'terminee', servis: [60, 160],
    cocktails: [{ id: 'bellini' }, { id: 'mojito' }, { id: 'sex-on-the-beach' }, { id: 'tequila-sunrise' }],
  },
  {
    decalageJours: -133, client: 'Famille Rousseau', typeId: 'bapteme', statut: 'terminee', servis: [5, 20],
    cocktails: [{ id: 'bellini' }, { id: 'limonade-maison' }, { id: 'the-glace-peche' }],
  },
  {
    decalageJours: -118, client: 'Galerie Nord', typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [15, 45],
    cocktails: [{ id: 'americano' }, { id: 'negroni' }, { id: 'spritz' }],
  },
  {
    decalageJours: -104, client: null, typeId: null, statut: 'terminee', servis: [10, 35],
    cocktails: [{ id: 'blue-lagoon' }, { id: 'pina-colada' }, { id: 'caipirinha' }],
  },
  {
    decalageJours: -90, client: 'Hugo Lefebvre', typeId: 'anniversaire', statut: 'terminee', servis: [12, 40],
    cocktails: [{ id: 'sex-on-the-beach' }, { id: 'margarita' }, { id: 'moscow-mule', variantes: ['avec'] }],
  },
  {
    decalageJours: -76, client: 'Decathlon Lille', typeId: 'soiree-entreprise', statut: 'terminee', servis: [40, 110],
    cocktails: [{ id: 'mojito' }, { id: 'gin-tonic' }, { id: 'espresso-martini' }, { id: 'cafe-frappe' }],
  },
  {
    decalageJours: -55, client: 'Emma & Lucas', typeId: 'mariage', statut: 'terminee', servis: [70, 180],
    cocktails: [{ id: 'spritz' }, { id: 'daiquiri' }, { id: 'cosmopolitan' }, { id: 'citronnade-menthe' }],
  },
  {
    decalageJours: -30, client: 'Association Les Lilas', typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [10, 30],
    cocktails: [{ id: 'tequila-sunrise', variantes: ['sans'] }, { id: 'limonade-maison' }, { id: 'bellini' }],
  },
];

function dateIso(decalageJours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function variantesDe(id: string): Variante[] {
  const c = COCKTAILS.find((x) => x.id === id);
  if (!c) throw new Error(`Cocktail inconnu : ${id}`);
  return c.variantes === 'les-deux' ? ['avec', 'sans'] : [c.variantes];
}

async function connecter(): Promise<{ db: Firestore; uid: string }> {
  const app = initializeApp({ projectId: PROJET, apiKey: 'demo' });
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  try {
    const cred = await signInWithEmailAndPassword(auth, EMAIL, MOT_DE_PASSE);
    return { db, uid: cred.user.uid };
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, MOT_DE_PASSE);
    return { db, uid: cred.user.uid };
  }
}

async function viderFirestore(): Promise<void> {
  const rep = await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJET}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  if (!rep.ok) throw new Error(`Impossible de vider Firestore (${rep.status})`);
}

async function main() {
  await viderFirestore().catch((e: unknown) => {
    console.error('Émulateurs injoignables : lance-les d’abord avec npm run emulateurs.');
    throw e;
  });
  const { db, uid } = await connecter();
  const racine = ['users', uid] as const;

  const lot = writeBatch(db);
  for (const t of TYPES) {
    lot.set(doc(db, ...racine, 'types', t.id), { nom: t.nom, nomNormalise: normaliserNom(t.nom), archive: t.archive ?? false });
  }
  for (const c of COCKTAILS) {
    lot.set(doc(db, ...racine, 'cocktails', c.id), {
      nom: c.nom,
      nomNormalise: normaliserNom(c.nom),
      variantes: c.variantes,
      nomSansAlcool: c.nomSansAlcool ?? null,
      archive: c.archive ?? false,
    });
  }
  await lot.commit();

  let totalVerres = 0;
  for (const [i, p] of PRESTAS.entries()) {
    const prestaId = `presta-${i + 1}`;
    const lignes: Ligne[] = p.cocktails.flatMap(({ id, variantes }) =>
      (variantes ?? variantesDe(id)).map((variante) => ({ id: crypto.randomUUID(), cocktailId: id, variante, masquee: false })),
    );
    const date = dateIso(p.decalageJours);
    const lotPresta = writeBatch(db);
    lotPresta.set(doc(db, ...racine, 'prestas', prestaId), { date, client: p.client, typeId: p.typeId, lignes, statut: p.statut });
    await lotPresta.commit();

    // Verres étalés sur la soirée (19 h → 1 h) ; pour la presta du jour, jusqu'à maintenant.
    const debut = new Date(`${date}T19:00:00`).getTime();
    const fin = p.decalageJours === 0 ? Math.max(debut, Date.now()) : debut + 6 * 3600_000;
    const verres = lignes.flatMap((l) =>
      Array.from({ length: entre(...p.servis) }, () => ({ ligneId: l.id, creeLe: debut + Math.floor(aleatoire() * (fin - debut)) })),
    );
    for (let j = 0; j < verres.length; j += TAILLE_LOT) {
      const lotVerres = writeBatch(db);
      for (const v of verres.slice(j, j + TAILLE_LOT)) {
        lotVerres.set(doc(db, ...racine, 'prestas', prestaId, 'verres', crypto.randomUUID()), {
          ligneId: v.ligneId,
          creeLe: v.creeLe,
          horodatage: Timestamp.fromMillis(v.creeLe),
          appareil: 'appareil-remplissage',
        });
      }
      await lotVerres.commit();
    }
    totalVerres += verres.length;
    console.log(`  ${date}  ${(p.client ?? '(sans client)').padEnd(16)} ${p.statut.padEnd(9)} ${verres.length} verres`);
  }

  console.log(`\n${TYPES.length} types, ${COCKTAILS.length} cocktails, ${PRESTAS.length} prestas, ${totalVerres} verres.`);
  console.log(`Connexion : ${EMAIL} / ${MOT_DE_PASSE}`);
  await terminate(db);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
