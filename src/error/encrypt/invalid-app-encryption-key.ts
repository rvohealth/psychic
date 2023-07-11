export default class InvalidAppEncryptionKey extends Error {
  public get message() {
    return `
      Invalid APP_ENCRYPTION_KEY set!
      In order to use the Encrypt class, you must ensure you have the APP_ENCRYPTION_KEY environment variable set
    `
  }
}
