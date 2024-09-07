export default class PsychicApplicationInvalidEncryptionKey extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
When providing an app encryption key to psychic, it must be a
32-bit, base64 encoded string.

This can be done by calling 'Encrypt.generateKey()', which will
automatically generate a key for you in the correct format. We
recommend that you generate the key, and then place it in either
your env, or else AWS secrets, or anywhere else where you may
be trying to access it.
    `
  }
}
