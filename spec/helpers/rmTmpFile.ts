import fs from 'fs/promises'
import absoluteFilePath from '../../src/helpers/absoluteFilePath'

export default async function readTmpFile() {
  try {
    return await fs.rm(absoluteFilePath('spec/tmp.txt'))
  } catch (err) {}
}
