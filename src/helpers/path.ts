import { promises as fs } from 'fs'
import PsychicApplication from '../psychic-application'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}

export async function clientApiFileName(): Promise<string> {
  const psychicApp = PsychicApplication.getOrFail()
  return await new Promise(accept =>
    accept(psychicApp.openapi?.clientOutputFilename || 'client/src/api/schema.ts'),
  )
}
