export default class MissingEncryptionKey extends Error {
  public get message() {
    return `
      In order to use the Encrypt library, encryption keys must be provided to psychic:

        export default (psy: PsychicApplication) => {
          psy.set('appEncryptionKey', process.env.APP_ENCRYPTION_KEY!)
        }

      A valid encryption key can be generated using:

        Encrypt.generateKey()
    `
  }
}
