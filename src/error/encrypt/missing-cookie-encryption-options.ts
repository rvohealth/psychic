export default class MissingCookieEncryptionOpts extends Error {
  public override get message() {
    return `
      In order to use the Encrypt library to encrypt cookies,
      encryption keys must be provided to psychic:

        // conf/app.ts
        export default (psy: PsychicApp) => {
          dream.set('encryption', {
            cookies: {
              current: {
                algorithm: 'aes-256-gcm',
                key: process.env.COOKIE_ENCRYPTION_KEY! 
              },
            }
          })
        }

      A valid encryption key can be generated using:

        Encrypt.generateKey()
    `
  }
}
