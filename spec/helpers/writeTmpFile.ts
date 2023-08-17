import fs from 'fs/promises'
import absoluteFilePath from '../../src/helpers/absoluteFilePath'

export default async function writeTmpFile(content: string) {
  return await fs.writeFile(absoluteFilePath('spec/tmp.txt'), content)
}
