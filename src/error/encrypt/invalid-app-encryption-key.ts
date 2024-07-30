export default class InvalidAppEncryptionKey extends Error {
  public get message() {
    return `
      Invalid encryption key set!
      In order to use the Encrypt class, you must ensure you have a valid
      encryption key set in 'conf/app.ts', like so:

      
      export default (psy: Psyconf) => {
        psy.encryptionKey = process.env.APP_ENCRYPTION_KEY
      }
    `
  }
}
