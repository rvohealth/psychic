import * as dotenv from 'dotenv'

class Env {
  public loaded = false

  public load() {
    if (this.loaded) return
    dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })
    this.check()
  }

  public ensureLoaded() {
    if (!this.loaded) this.load()
  }

  private check() {
    const missingEnvs: string[] = []
    // if (!process.env.APP_ENCRYPTION_KEY) missingEnvs.push('APP_ENCRYPTION_KEY')

    // if (!!missingEnvs.length)
    //   throw `Must make sure the following env vars are set before starting the howl server: \n${missingEnvs.join(",\n  ")}`
  }
}

const env = new Env()
export default env
