import * as fs from 'fs/promises'
import * as path from 'path'

export default async function getFiles(dir: string): Promise<string[]> {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      dirents.map(dirent => {
        const res = path.resolve(dir, dirent.name)
        return dirent.isDirectory() ? getFiles(res) : res.replace(/\.ts$/, '.js')
      }),
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array.prototype.concat(...files)
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    if ((err as any).code === 'ENOENT') return []
    throw err
  }
}
