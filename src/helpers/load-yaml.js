import { readFile } from 'fs/promises'
import yaml from 'js-yaml'
import fileExists from 'src/helpers/file-exists'

export default async function loadYaml(path) {
  if (await fileExists(path + '.yml'))
    return _loadYamlWithExactPath(path + '.yml')

  if (await fileExists(path + '.yaml'))
    return _loadYamlWithExactPath(path + '.yaml')

  throw `cant find yaml file ${path}.(yml|yaml)`
}

async function _loadYamlWithExactPath(path) {
  let stringBuffer = await readFile(path, 'utf8')
  Object.keys(ENV).forEach(key => {
    stringBuffer = stringBuffer.replace(new RegExp(`ENV::${key}`, 'g'), ENV[key])
  })

  return yaml.load(stringBuffer)
}

