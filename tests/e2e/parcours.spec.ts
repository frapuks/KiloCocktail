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

async function creerCocktail(page: Page, nom: string, nomSansAlcool?: string): Promise<void> {
  await page.getByRole('link', { name: 'Cocktails' }).click()
  await page.getByRole('button', { name: 'Nouveau cocktail' }).click()
  await page.getByLabel('Nom', { exact: true }).fill(nom)
  if (nomSansAlcool) {
    await page.getByLabel('Les deux').check()
    await page.getByLabel('Nom de la version sans alcool').fill(nomSansAlcool)
  }
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('button', { name: new RegExp(nom) })).toBeVisible()
}

async function demarrerPresta(page: Page, client: string, cocktail: string): Promise<void> {
  await page.getByRole('link', { name: 'Prestas' }).click()
  await page.getByRole('button', { name: 'Nouvelle presta' }).click()
  await page.getByLabel('Client').fill(client)
  await page.getByRole('checkbox', { name: cocktail }).check()
  await page.getByRole('button', { name: 'Commencer la presta' }).click()
}

test('parcours complet : cocktail, presta, comptage, résultats', async ({ page }) => {
  await creerCompteEtSeConnecter(page)
  await creerCocktail(page, 'Mojito', 'Nojito')
  await demarrerPresta(page, 'Julie Martin', 'Mojito')

  const mojito = page.getByRole('button', { name: 'Mojito', exact: true })
  const nojito = page.getByRole('button', { name: 'Nojito', exact: true })
  await expect(mojito).toBeVisible()
  await expect(nojito).toBeVisible()

  for (let i = 0; i < 3; i++) await mojito.click()
  await nojito.click()
  await page.getByRole('button', { name: 'Retirer un Mojito' }).click()

  await page.getByRole('button', { name: 'Terminer' }).click()

  const ligne = (nom: string) => page.locator('.resultats-ligne').filter({ hasText: nom })
  await expect(ligne('Mojito')).toContainText('2')
  await expect(ligne('Nojito')).toContainText('1')

  await page.goto('/')
  const terminees = page.getByRole('region', { name: 'Terminées' })
  await expect(terminees).toContainText('Julie Martin')
  await expect(terminees).toContainText('3 servis')
})

test('les noms longs ne débordent pas en portrait', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const nom = 'Moscow Mule Gingembre Royal'
  await creerCompteEtSeConnecter(page)
  await creerCocktail(page, nom)
  await demarrerPresta(page, 'Client portrait', nom)

  const elementNom = page.locator('.carte-nom').filter({ hasText: nom })
  await expect(elementNom).toBeVisible()
  const { scrollWidth, clientWidth } = await elementNom.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})
