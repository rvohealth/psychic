import { Encrypt } from '@rvohealth/dream'

export default class EnvBuilder {
  public static build({ env, appName }: { env: 'test' | 'development' | 'production'; appName: string }) {
    return `\
DB_USER=
DB_NAME=${snakeify(appName)}_${env}
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="${Encrypt.generateKey('aes-256-gcm')}"
TZ=UTC
`
  }
}

// TODO: import from shared space. The version within dream contains the most robust variant of snakeify,
// though we don't really use it for anything other than string transformations, so this version has been simplified.
function snakeify(str: string): string {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .toLowerCase()
}
