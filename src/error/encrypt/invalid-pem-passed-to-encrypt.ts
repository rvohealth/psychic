export default class InvalidPemPassedToEncrypt extends Error {
  public get message() {
    return `
      Both the public and private encryption keys provided to Psychic must be in PEM format.
    `
  }
}
