import YAML from 'yaml'
import { promises as fs } from 'fs'
import absoluteFilePath from './absoluteFilePath'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}

let _yamlCache: DreamYamlFile | null = null
export async function loadDreamYamlFile() {
  if (_yamlCache) return _yamlCache

  const file = await loadFile(absoluteFilePath('.dream.yml', { purgeTestAppInCoreDevelopment: true }))
  const config = (await YAML.parse(file.toString())) as DreamYamlFile

  // TODO: validate shape of yaml file!

  _yamlCache = config
  return config
}

export async function schemaPath() {
  const yamlConfig = await loadDreamYamlFile()
  return absoluteFilePath(yamlConfig.schema_path)
}

export async function clientApiPath() {
  const yamlConfig = await loadDreamYamlFile()
  const schemaPath = yamlConfig.client_api_schema_path
  const schemaParts = schemaPath.split('/')
  schemaParts.pop()

  return absoluteFilePath(schemaParts.join('/'))
}

export async function clientApiFileName(): Promise<string> {
  return await new Promise(accept => accept('schema.ts'))
}

export async function modelsPath() {
  const yamlConfig = await loadDreamYamlFile()
  return absoluteFilePath(yamlConfig.models_path)
}

export async function migrationsPath() {
  const yamlConfig = await loadDreamYamlFile()
  return absoluteFilePath(yamlConfig.migrations_path)
}

export async function dreamsConfigPath() {
  const yamlConfig = await loadDreamYamlFile()
  return absoluteFilePath(yamlConfig.dream_config_path)
}

export interface DreamYamlFile {
  models_path: string
  migrations_path: string
  schema_path: string
  dream_config_path: string
  client_api_schema_path: string
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
