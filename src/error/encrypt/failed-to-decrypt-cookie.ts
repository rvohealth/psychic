export default class FailedToDecryptCookie extends Error {
  public get message() {
    return `
        Psychic failed to decrypt a cookie value. Usually, this is due to an
        invalid encryption setup within your application. Make sure that the
        encryption algorithm and keys are both present and match.

        // conf/app.ts
        export default (psy: PsychicApplication) => {
          psy.set('encryption', {
            columns: {
              current: {
                algorithm: '<YOUR_ALGORITHM>',
                key: process.env.COLUMN_ENCRYPTION_KEY! 
              },
              legacy: {
                algorithm: '<YOUR_LEGACY_ALGORITHM>',
                key: process.env.LEGACY_COLUMN_ENCRYPTION_KEY! 
              },
            }
          })
        }

      A valid encryption key can be generated for your algorithm using:

        Encrypt.generateKey('<YOUR_ALGORITHM>')
    `
  }
}
