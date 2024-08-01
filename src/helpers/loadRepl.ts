import './loadEnv'
import * as fs from 'fs/promises'
import * as path from 'path'
import { DateTime } from 'luxon'
import { Dream } from '@rvohealth/dream'
import Psyconf from '../psyconf'

export default async function loadRepl(context: Record<string, unknown>) {
  await Psyconf.configure()

  const inflectionsPath = './src/conf/inflections'
  try {
    await import(inflectionsPath)
  } catch (_) {
    // don't fret about if no inflections file found, it's ok.
  }

  context.DateTime = DateTime
  const dreamPaths = (await getFiles('./src/app/models')).filter(file => /\.ts$/.test(file))
  for (const dreamPath of dreamPaths) {
    const importablePath = dreamPath.replace(/.*\/src/, '../../../../../src')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dreamClass = (await import(importablePath)).default as typeof Dream
    if (dreamClass.isDream) {
      const globalName: string | undefined = await dreamClass.globalName()
      if (globalName) context[globalName] = dreamClass
    }
  }

  try {
    const servicePaths = (await getFiles('./src/app/services')).filter(file => /\.ts$/.test(file))
    for (const servicePath of servicePaths) {
      const importablePath = servicePath.replace(/.*\/src/, '../../../../../src')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const serviceExport = (await import(importablePath)).default as typeof Dream
      if (serviceExport) context[serviceExport.name] = serviceExport
    }
  } catch (_) {
    // don't fret about if services aren't present
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    }),
  )
  return Array.prototype.concat(...files) as string[]
}
