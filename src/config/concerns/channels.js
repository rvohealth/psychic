const ChannelsConfigProvider = superclass => class extends superclass {
  get channels() {
    return this._channels
  }

  get cookies() {
    return {
      maxAge: process.env.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 30, // 30 days
    }
  }
}

export default ChannelsConfigProvider
