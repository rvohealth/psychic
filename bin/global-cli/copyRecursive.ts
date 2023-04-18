import * as fs from 'fs'
import * as path from 'path'

export default function copyRecursive(src: string, dest: string) {
  var exists = fs.existsSync(src)
  var stats = exists && fs.statSync(src)
  var isDirectory = exists && (stats as fs.Stats).isDirectory()
  if (isDirectory) {
    if (!['.', './.'].includes(dest)) fs.mkdirSync(dest)

    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}
