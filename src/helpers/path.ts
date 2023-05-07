import * as path from 'path'
import * as YAML from 'yaml'
import { promises as fs } from 'fs'
import compact from './compact'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}

export async function importFile(filepath: string) {
  return await import(filepath)
}

let _yamlCache: DreamYamlFile | null = null
export async function loadDreamYamlFile() {
  if (_yamlCache) return _yamlCache

  const file = await loadFile(projectRootPath({ filepath: '.dream.yml' }))
  const config = (await YAML.parse(file.toString())) as DreamYamlFile

  // TODO: validate shape of yaml file!

  _yamlCache = config
  return config
}

let _dreamConfigCache: DreamConfig | null = null
export async function loadDreamConfigFile() {
  if (_dreamConfigCache) return _dreamConfigCache

  const dreamConfig = (await import(await dreamsConfigPath())).default as DreamConfig

  // TODO: validate shape of payload!

  _dreamConfigCache = dreamConfig
  return dreamConfig
}

export function projectRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  const dirname = omitDirname ? undefined : __dirname

  if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
    return path.join(...compact([dirname, '..', '..', filepath]))
  } else {
    return path.join(...compact([dirname, '..', '..', '..', '..', filepath]))
  }
}

export async function schemaPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.schema_path, omitDirname })
}

export async function modelsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.models_path, omitDirname })
}

export async function migrationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.migrations_path, omitDirname })
}

export async function dreamsConfigPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.dream_config_path, omitDirname })
}

export interface DreamYamlFile {
  models_path: string
  migrations_path: string
  schema_path: string
  dream_config_path: string
}

export interface DreamConfig {
  db: {
    user: string
    password: string
    name: string
    host: string
    port: string | number
  }
}
