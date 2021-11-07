const MessagesConfigProvider = superclass => class extends superclass {
  get messages() {
    return this._messagesConfig
  }
}

export default MessagesConfigProvider
