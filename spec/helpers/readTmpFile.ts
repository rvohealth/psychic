import fs from 'fs/promises'
import absoluteFilePath from '../../src/helpers/absoluteFilePath'

export default async function readTmpFile() {
  return (await fs.readFile(absoluteFilePath('spec/tmp.txt'))).toString()
}
