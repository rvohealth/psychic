import * as dotenv from 'dotenv'
import EnvInternal from '../helpers/EnvInternal'

class EnvLoader {
  public loaded = false

  public load() {
    if (this.loaded) return
    dotenv.config({ path: EnvInternal.isTest ? '.env.test' : '.env' })
    this.check()
  }

  public ensureLoaded() {
    if (!this.loaded) this.load()
  }

  private check() {
    // const missingEnvs: string[] = []
    // if (!process.env.APP_ENCRYPTION_KEY) missingEnvs.push('APP_ENCRYPTION_KEY')
    //
    // if (!!missingEnvs.length)
    //   throw `Must make sure the following env vars are set before starting the psychic server: \n${missingEnvs.join(",\n  ")}`
  }
}

const envLoader = new EnvLoader()
export default envLoader
