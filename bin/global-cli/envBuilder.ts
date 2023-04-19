export default class EnvBuilder {
  public static build({ env, appName }: { env: 'test' | 'development' | 'production'; appName: string }) {
    const key =
      Math.random().toString(36).substr(2, 3) +
      '-' +
      Math.random().toString(36).substr(2, 3) +
      '-' +
      Math.random().toString(36).substr(2, 4)

    return `\
DB_USER=
DB_NAME=${snakeify(appName)}_${env}
APP_ENCRYPTION_KEY='${key}'
`
  }
}

function snakeify(str: any): string {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .toLowerCase()
}
