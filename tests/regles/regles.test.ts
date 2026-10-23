import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kilococktail',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
})

afterAll(async () => {
  await env.cleanup()
})

const verreConforme = {
  ligneId: 'l1',
  creeLe: 1000,
  horodatage: 1000,
  appareil: 'a1',
}

describe('règles de sécurité Firestore', () => {
  it('autorise le propriétaire à lire et écrire ses données', async () => {
    const db = env.authenticatedContext('u1').firestore()
    const ref = doc(db, 'users/u1/cocktails/c1')
    await assertSucceeds(setDoc(ref, { nom: 'Mojito' }))
    await assertSucceeds(getDoc(ref))
  })

  it('autorise le propriétaire à gérer ses bases, pas un autre compte', async () => {
    const ref = (uid: string) => doc(env.authenticatedContext(uid).firestore(), 'users/u1/bases/b1')
    await assertSucceeds(setDoc(ref('u1'), { nom: 'Rhum', nomNormalise: 'rhum', archive: false }))
    await assertSucceeds(getDoc(ref('u1')))
    await assertFails(getDoc(ref('u2')))
  })

  it('refuse un autre compte', async () => {
    const ref = (c: ReturnType<typeof env.authenticatedContext>) =>
      doc(c.firestore(), 'users/u1/cocktails/c1')
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/u1/cocktails/c1'), { nom: 'Mojito' })
    })
    const autre = env.authenticatedContext('u2')
    await assertFails(getDoc(ref(autre)))
    await assertFails(setDoc(ref(autre), { nom: 'Pirate' }))
  })

  it('refuse un visiteur non connecté', async () => {
    const ref = doc(env.unauthenticatedContext().firestore(), 'users/u1/cocktails/c1')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, { nom: 'Pirate' }))
  })

  it('accepte un verre conforme', async () => {
    const db = env.authenticatedContext('u1').firestore()
    await assertSucceeds(setDoc(doc(db, 'users/u1/prestas/p1/verres/v1'), verreConforme))
  })

  it('refuse un verre avec un champ en trop', async () => {
    const db = env.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'users/u1/prestas/p1/verres/v1'), { ...verreConforme, delta: 1 }),
    )
  })
})
