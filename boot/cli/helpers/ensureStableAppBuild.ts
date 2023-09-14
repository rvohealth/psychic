import fs from 'fs/promises'
import developmentOrTestEnv from './developmentOrTestEnv'

export default async function ensureStableAppBuild(programArgs: string[]) {
  if (!developmentOrTestEnv()) return

  console.log('checking app for build stability...')
  await removeTestInfrastructureFor('dream')
  await removeTestInfrastructureFor('psychic')
}

export async function removeTestInfrastructureFor(pkg: 'psychic' | 'dream') {
  try {
    await fs.stat(`./node_modules/${pkg}/test-app`)
    console.log(`test-app still present in ${pkg} installation, removing...`)
    await fs.rm(`./node_modules/${pkg}/test-app`, { recursive: true, force: true })
  } catch (error) {
    // intentionally ignore, since we expect this dir to be empty.
  }
}
