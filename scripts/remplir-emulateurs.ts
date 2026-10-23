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
import type { Ligne, StatutPresta } from '../src/domain/types.ts';

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

// Gin sans cocktail (le filtre propose quand même la base), Whisky archivée.
const BASES = [
  { id: 'rhum', nom: 'Rhum' },
  { id: 'vodka', nom: 'Vodka' },
  { id: 'gin', nom: 'Gin' },
  { id: 'tequila', nom: 'Tequila' },
  { id: 'vin-petillant', nom: 'Vin pétillant' },
  { id: 'jus-de-fruits', nom: 'Jus de fruits' },
  { id: 'whisky', nom: 'Whisky', archive: true },
];

// Base de chaque cocktail ; les autres n'en ont pas.
const BASE_DES_COCKTAILS: Record<string, string> = {
  mojito: 'rhum',
  'pina-colada': 'rhum',
  caipirinha: 'rhum',
  daiquiri: 'rhum',
  'blue-lagoon': 'vodka',
  cosmopolitan: 'vodka',
  'moscow-mule': 'vodka',
  'espresso-martini': 'vodka',
  'sex-on-the-beach': 'vodka',
  margarita: 'tequila',
  'tequila-sunrise': 'tequila',
  spritz: 'vin-petillant',
  bellini: 'vin-petillant',
  'virgin-colada': 'jus-de-fruits',
  'safe-sex-on-the-beach': 'jus-de-fruits',
  sunrise: 'jus-de-fruits',
};

const COCKTAILS: { id: string; nom: string; alcool: boolean; archive?: boolean; description?: string }[] = [
  {
    id: 'mojito',
    nom: 'Mojito',
    alcool: true,
    description: 'Rhum blanc, citron vert, menthe fraîche, sucre de canne, eau gazeuse.\nPiler la menthe avec le sucre et le citron, glace pilée, compléter à l’eau gazeuse.',
  },
  { id: 'nojito', nom: 'Nojito', alcool: false, description: 'Le Mojito sans rhum : citron vert, menthe, sucre de canne, eau gazeuse.' },
  { id: 'pina-colada', nom: 'Piña Colada', alcool: true },
  { id: 'virgin-colada', nom: 'Virgin Colada', alcool: false },
  { id: 'spritz', nom: 'Spritz', alcool: true, description: 'Apérol, prosecco, eau gazeuse, rondelle d’orange.' },
  { id: 'margarita', nom: 'Margarita', alcool: true },
  { id: 'cosmopolitan', nom: 'Cosmopolitan', alcool: true },
  { id: 'moscow-mule', nom: 'Moscow Mule', alcool: true },
  { id: 'virgin-mule', nom: 'Virgin Mule', alcool: false },
  { id: 'gin-tonic', nom: 'Gin Tonic', alcool: true },
  { id: 'limonade-maison', nom: 'Limonade maison', alcool: false },
  { id: 'cafe-frappe', nom: 'Café frappé', alcool: false },
  { id: 'blue-lagoon', nom: 'Blue Lagoon', alcool: true, archive: true },
  { id: 'caipirinha', nom: 'Caïpirinha', alcool: true },
  { id: 'daiquiri', nom: 'Daïquiri', alcool: true },
  { id: 'virgin-daiquiri', nom: 'Virgin Daïquiri', alcool: false },
  { id: 'negroni', nom: 'Negroni', alcool: true },
  { id: 'espresso-martini', nom: 'Espresso Martini', alcool: true },
  { id: 'sex-on-the-beach', nom: 'Sex on the Beach', alcool: true },
  { id: 'safe-sex-on-the-beach', nom: 'Safe Sex on the Beach', alcool: false },
  { id: 'tequila-sunrise', nom: 'Tequila Sunrise', alcool: true },
  { id: 'sunrise', nom: 'Sunrise', alcool: false },
  { id: 'bellini', nom: 'Bellini', alcool: true },
  { id: 'americano', nom: 'Americano', alcool: true, archive: true },
  { id: 'citronnade-menthe', nom: 'Citronnade à la menthe', alcool: false },
  { id: 'the-glace-peche', nom: 'Thé glacé pêche', alcool: false },
];

interface PrestaDemo {
  decalageJours: number; // par rapport à aujourd'hui
  client: string | null;
  typeId: string | null;
  statut: StatutPresta;
  cocktails: string[];
  servis: [number, number]; // fourchette de verres par ligne
}

const PRESTAS: PrestaDemo[] = [
  {
    decalageJours: -62, client: 'Julie Martin', typeId: 'anniversaire', statut: 'terminee', servis: [10, 40],
    cocktails: ['mojito', 'nojito', 'spritz', 'limonade-maison'],
  },
  {
    decalageJours: -41, client: 'Acme SAS', typeId: 'soiree-entreprise', statut: 'terminee', servis: [30, 90],
    cocktails: ['gin-tonic', 'moscow-mule', 'virgin-mule', 'margarita', 'cafe-frappe'],
  },
  {
    decalageJours: -20, client: 'Léa & Thomas', typeId: 'mariage', statut: 'terminee', servis: [40, 120],
    cocktails: ['mojito', 'nojito', 'pina-colada', 'virgin-colada', 'cosmopolitan', 'spritz'],
  },
  {
    decalageJours: -9, client: null, typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [5, 25],
    cocktails: ['spritz', 'virgin-colada'],
  },
  {
    decalageJours: -2, client: 'Mairie de Lyon', typeId: null, statut: 'terminee', servis: [15, 50],
    cocktails: ['gin-tonic', 'limonade-maison', 'mojito'],
  },
  {
    decalageJours: 0, client: 'Nadia Benali', typeId: 'anniversaire', statut: 'en-cours', servis: [0, 12],
    cocktails: ['mojito', 'nojito', 'margarita', 'moscow-mule', 'virgin-mule', 'limonade-maison'],
  },
  {
    decalageJours: 5, client: 'Studio Pixel', typeId: 'soiree-entreprise', statut: 'en-cours', servis: [0, 0],
    cocktails: ['cosmopolitan', 'gin-tonic', 'cafe-frappe'],
  },
  // Grande carte (6 avec alcool, 5 sans), en cours : pour éprouver l'écran de comptage avec beaucoup de cartes.
  {
    decalageJours: 1, client: 'Salon des vins', typeId: 'seminaire', statut: 'en-cours', servis: [0, 20],
    cocktails: [
      'mojito', 'pina-colada', 'spritz', 'margarita', 'cosmopolitan', 'moscow-mule',
      'nojito', 'virgin-colada', 'virgin-mule', 'limonade-maison', 'cafe-frappe',
    ],
  },
  {
    decalageJours: -180, client: 'Camille Durand', typeId: 'anniversaire', statut: 'terminee', servis: [8, 30],
    cocktails: ['caipirinha', 'daiquiri', 'virgin-daiquiri', 'the-glace-peche'],
  },
  {
    decalageJours: -165, client: 'BNP Paribas', typeId: 'soiree-entreprise', statut: 'terminee', servis: [50, 140],
    cocktails: ['negroni', 'espresso-martini', 'gin-tonic', 'citronnade-menthe'],
  },
  {
    decalageJours: -150, client: 'Sarah & Mehdi', typeId: 'mariage', statut: 'terminee', servis: [60, 160],
    cocktails: ['bellini', 'mojito', 'nojito', 'sex-on-the-beach', 'safe-sex-on-the-beach', 'tequila-sunrise', 'sunrise'],
  },
  {
    decalageJours: -133, client: 'Famille Rousseau', typeId: 'bapteme', statut: 'terminee', servis: [5, 20],
    cocktails: ['bellini', 'limonade-maison', 'the-glace-peche'],
  },
  {
    decalageJours: -118, client: 'Galerie Nord', typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [15, 45],
    cocktails: ['americano', 'negroni', 'spritz'],
  },
  {
    decalageJours: -104, client: null, typeId: null, statut: 'terminee', servis: [10, 35],
    cocktails: ['blue-lagoon', 'pina-colada', 'virgin-colada', 'caipirinha'],
  },
  {
    decalageJours: -90, client: 'Hugo Lefebvre', typeId: 'anniversaire', statut: 'terminee', servis: [12, 40],
    cocktails: ['sex-on-the-beach', 'safe-sex-on-the-beach', 'margarita', 'moscow-mule'],
  },
  {
    decalageJours: -76, client: 'Decathlon Lille', typeId: 'soiree-entreprise', statut: 'terminee', servis: [40, 110],
    cocktails: ['mojito', 'nojito', 'gin-tonic', 'espresso-martini', 'cafe-frappe'],
  },
  {
    decalageJours: -55, client: 'Emma & Lucas', typeId: 'mariage', statut: 'terminee', servis: [70, 180],
    cocktails: ['spritz', 'daiquiri', 'virgin-daiquiri', 'cosmopolitan', 'citronnade-menthe'],
  },
  {
    decalageJours: -30, client: 'Association Les Lilas', typeId: 'cocktail-dinatoire', statut: 'terminee', servis: [10, 30],
    cocktails: ['sunrise', 'limonade-maison', 'bellini'],
  },
];

function dateIso(decalageJours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  for (const b of BASES) {
    lot.set(doc(db, ...racine, 'bases', b.id), { nom: b.nom, nomNormalise: normaliserNom(b.nom), archive: b.archive ?? false });
  }
  for (const c of COCKTAILS) {
    lot.set(doc(db, ...racine, 'cocktails', c.id), {
      nom: c.nom,
      nomNormalise: normaliserNom(c.nom),
      alcool: c.alcool,
      archive: c.archive ?? false,
      description: c.description ?? '',
      baseId: BASE_DES_COCKTAILS[c.id] ?? null,
    });
  }
  await lot.commit();

  let totalVerres = 0;
  for (const [i, p] of PRESTAS.entries()) {
    const prestaId = `presta-${i + 1}`;
    const lignes: Ligne[] = p.cocktails.map((cocktailId) => ({ id: crypto.randomUUID(), cocktailId, masquee: false }));
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

  console.log(`\n${TYPES.length} types, ${BASES.length} bases, ${COCKTAILS.length} cocktails, ${PRESTAS.length} prestas, ${totalVerres} verres.`);
  console.log(`Connexion : ${EMAIL} / ${MOT_DE_PASSE}`);
  await terminate(db);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
