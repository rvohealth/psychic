import { DreamApp } from '@rvoh/dream'

/**
 * Appends the app's import suffix (`.js`, `.ts` or none) to a generated import
 * path. The suffix is Dream's `importExtension` setting: the same one the
 * model, factory and serializer imports follow through Dream's
 * `absoluteDreamPath`, so every import a Psychic generator writes carries one
 * style. An app declares it once, in conf/app.ts with
 * `psy.set('importExtension', …)`, which Psychic forwards to Dream.
 */
export default function addImportSuffix(filepath: string) {
  return `${filepath.replace(/(\.ts|\.js)$/, '')}${suffix()}`
}

function suffix() {
  switch (DreamApp.getOrFail().importExtension) {
    case '.js':
      return '.js'
    case '.ts':
      return '.ts'
    case 'none':
      return ''
  }
}
