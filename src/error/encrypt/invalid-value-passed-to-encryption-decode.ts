export default class InvalidValuePassedToEncryptionDecode extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
Must pass a value that is not either null or undefined when calling Encrypt.decrypt
`
  }
}
