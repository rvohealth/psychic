export default class Event {
  constructor({
    bree,
  }) {
    this._bree = bree
  }

  _generateName(cb, identifier) {
    return md5(cb.toString() + '::' + identifier)
  }
}
