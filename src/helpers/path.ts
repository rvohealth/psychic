import { promises as fs } from 'fs'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}
