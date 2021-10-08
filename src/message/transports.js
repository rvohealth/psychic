import NodemailerEmailTransport from 'src/message/transport/email/nodemailer'
import TwilioSMSTransport from 'src/message/transport/sms/twilio'

export default class Transports {
  get transports() {
    return this._transports
  }

  constructor() {
    this._transports = {
      email: {},
      sms: {},
    }
  }

  setConfig(messagesConfig) {
    this._messagesConfig = messagesConfig
    this._loadEmailTransports(messagesConfig)
    this._loadSMSTransports(messagesConfig)
  }

  async send(transportType, transportKey, opts) {
    if (!this.transports[transportType][transportKey])
      throw `Could not find transport with type ${transportType} and key ${transportKey}`

    return await this.transports[transportKey].send(opts)
  }

  async sendSMS(...args) {
    switch (args.length) {
    case 1:
      this.send('sms', 'default', args[0])
      break

    case 2:
      this.send('sms', args[0], args[1])
      break

    default:
      throw `Must pass either (transportKey, opts) or (opts) if just planning to use default sms transport`
    }
  }

  async sendEmail(...args) {
    switch (args.length) {
    case 1:
      this.send('email', 'default', args[0])
      break

    case 2:
      this.send('email', args[0], args[1])
      break

    default:
      throw `Must pass either (transportKey, opts) or (opts) if just planning to use default email transport`
    }
  }

  _loadEmailTransports(messagesConfig) {
    Object
      .keys(messagesConfig.protocols.email)
      .forEach(transportKey => {
        const _config = messagesConfig.protocols.email[transportKey]

        switch(_config?.adapter) {
        case 'nodemailer':
        case null:
        case undefined:
          this._transports.email[transportKey] = new NodemailerEmailTransport(_config)
          break

        default:
          throw `unrecognized email adapter type ${_config.adapter}`
        }
      })
  }

  _loadSMSTransports(messagesConfig) {
    Object
      .keys(messagesConfig.protocols.sms)
      .forEach(transportKey => {
        const _config = messagesConfig.protocols.sms[transportKey]

        switch(_config?.adapter) {
        case 'twilio':
          this._transports.sms[transportKey] = new TwilioSMSTransport(_config)
          break

        default:
          // console.log('invalid config for SMS. ignoring for now...')
          // throw `unrecognized sms adapter type ${_config.adapter}`
        }
      })
  }
}
