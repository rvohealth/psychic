import PsychicApp from '../../psychic-app/index.js'

export default function addImportSuffix(filepath: string) {
  return `${filepath.replace(/(\.ts|\.js)$/, '')}${suffix()}`
}

function suffix() {
  switch (PsychicApp.getOrFail().importExtension) {
    case '.js':
      return '.js'
    case '.ts':
      return '.ts'
    case 'none':
      return ''
  }
}
