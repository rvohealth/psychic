import { promises as fs } from 'fs'
import path from 'path'
import { getCachedPsychicApplicationOrFail } from '../psychic-application/cache'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}

export function clientApiPath(): Promise<string> {
  const psychicApp = getCachedPsychicApplicationOrFail()
  const schemaPath = psychicApp.openapi?.clientOutputFilename || 'client/src/api/schema.ts'
  const schemaParts = schemaPath.split('/')
  schemaParts.pop()
  return new Promise(accept => accept(path.join(psychicApp.appRoot, ...schemaParts)))
}

export async function clientApiFileName(): Promise<string> {
  const psychicApp = getCachedPsychicApplicationOrFail()
  return await new Promise(accept =>
    accept(psychicApp.openapi?.clientOutputFilename || 'client/src/api/schema.ts'),
  )
}
