import fs from 'fs/promises'
import path from 'path'
import sspawn from '../../../src/helpers/sspawn'
import yarncmdRunByAppConsumer from './yarncmdRunByAppConsumer'
import developmentOrTestEnv from './developmentOrTestEnv'

export default async function maybeSyncExisting(programArgs: string[]) {
  if (!developmentOrTestEnv()) return

  try {
    const pathToCheck = programArgs.includes('--core')
      ? path.join(process.cwd(), 'node_modules/dream/src/sync/schema.ts')
      : path.join(process.cwd(), '/../../node_modules/dream/src/sync/schema.ts')
    await fs.statfs(pathToCheck)
  } catch (_) {
    console.log('Missing schema file, resyncing app')
    await sspawn(yarncmdRunByAppConsumer('dream sync:existing', programArgs))
  }
}
