import { expect, test, type Page } from '@playwright/test'

const MOT_DE_PASSE = 'motdepasse123'

async function creerCompteEtSeConnecter(page: Page): Promise<void> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemple.fr`
  const reponse = await page.request.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',
    { data: { email, password: MOT_DE_PASSE, returnSecureToken: true } },
  )
  expect(reponse.ok()).toBe(true)

  await page.goto('/')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('button', { name: 'Nouvelle presta' })).toBeVisible()
}

async function creerCocktail(page: Page, nom: string, alcool = true): Promise<void> {
  await page.getByRole('link', { name: 'Cocktails' }).click()
  await page.getByRole('button', { name: 'Nouveau cocktail' }).click()
  await page.getByLabel('Nom', { exact: true }).fill(nom)
  if (!alcool) await page.getByRole('dialog').getByRole('button', { name: 'Sans alcool', exact: true }).click()
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('button', { name: `Modifier ${nom}`, exact: true })).toBeVisible()
}

async function demarrerPresta(page: Page, client: string, cocktails: string[]): Promise<void> {
  await page.getByRole('link', { name: 'Prestas' }).click()
  await page.getByRole('button', { name: 'Nouvelle presta' }).click()
  await page.getByLabel('Client').fill(client)
  await page.getByRole('button', { name: '+ Ajouter un cocktail' }).click()
  for (const nom of cocktails) await page.getByRole('checkbox', { name: new RegExp(nom) }).check()
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await page.getByRole('button', { name: 'Créer la presta' }).click()
  // La création ramène à la liste : le comptage s'ouvre depuis la carte de la presta.
  await page.getByRole('region', { name: 'En cours' }).getByRole('link').filter({ hasText: client }).click()
}

test('parcours complet : cocktail, presta, comptage, résultats', async ({ page }) => {
  await creerCompteEtSeConnecter(page)
  await creerCocktail(page, 'Mojito')
  await creerCocktail(page, 'Nojito', false)
  await demarrerPresta(page, 'Julie Martin', ['Mojito', 'Nojito'])

  const mojito = page.getByRole('button', { name: 'Mojito', exact: true })
  const nojito = page.getByRole('button', { name: 'Nojito, sans alcool', exact: true })
  await expect(mojito).toBeVisible()
  await expect(nojito).toBeVisible()

  for (let i = 0; i < 3; i++) await mojito.click()
  await nojito.click()
  await page.getByRole('button', { name: 'Retirer un Mojito' }).click()

  await page.getByRole('button', { name: 'Résultats' }).click()
  const ligne = (nom: string) => page.getByRole('dialog', { name: 'Résultats' }).getByRole('listitem').filter({ hasText: nom })
  await expect(ligne('Mojito')).toContainText('2')
  await expect(ligne('Nojito')).toContainText('1')

  // Terminer la presta ramène à la liste, où elle passe dans « Terminées ».
  await page.getByRole('button', { name: 'Terminer la presta' }).click()
  const terminees = page.getByRole('region', { name: 'Terminées' })
  await expect(terminees).toContainText('Julie Martin')
  await expect(terminees).toContainText('3 servis')
})

test('les noms longs tiennent sur une ligne, coupés par « … », en portrait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const nom = 'Moscow Mule Gingembre Royal'
  await creerCompteEtSeConnecter(page)
  await creerCocktail(page, nom)
  await demarrerPresta(page, 'Client portrait', [nom])

  const carte = page.getByRole('button', { name: nom, exact: true })
  const elementNom = carte.getByText(nom, { exact: true })
  await expect(elementNom).toBeVisible()
  const mesure = await elementNom.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      coupe: el.scrollWidth > el.clientWidth,
      points: style.textOverflow,
      hauteur: el.getBoundingClientRect().height,
      ligne: parseFloat(style.lineHeight),
    }
  })
  // Nom trop long pour une demi-largeur de téléphone : coupé par « … », sur une seule ligne.
  expect(mesure.coupe).toBe(true)
  expect(mesure.points).toBe('ellipsis')
  expect(mesure.hauteur).toBeLessThan(mesure.ligne * 1.5)
  // Et la case du nom reste dans la carte.
  const boiteNom = (await elementNom.boundingBox())!
  const boiteCarte = (await carte.boundingBox())!
  expect(boiteNom.x + boiteNom.width).toBeLessThanOrEqual(boiteCarte.x + boiteCarte.width + 1)
})
