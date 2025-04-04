export default class GlobalNameCompatibleClass {
  private static _globalName: string

  public static get globalName() {
    return this._globalName
  }

  public static setGlobalName(name: string) {
    this._globalName = name
  }
}
