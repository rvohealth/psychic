import { loadDreamConfigFile } from './path'

export default async function loadDBConfig() {
  const dbConfig = await loadDreamConfigFile()
  return {
    host: dbConfig.db.host || 'localhost',
    user: dbConfig.db.user || 'postgres',
    password: dbConfig.db.password || '',
    port: dbConfig.db.port ? parseInt(dbConfig.db.port as string) : 5432,
    name: dbConfig.db.name || 'dream_app_dev',
  }
}
