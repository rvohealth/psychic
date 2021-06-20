import twilio from 'twilio'
import Transport from 'src/message/transport'

export default class TwilioSMSTransport extends Transport {
  initialize() {
    this._twilio = twilio(this.config.auth.sid, this.config.auth.token)
  }

  async send({
    to,
    text,
  }) {
    return await this._twilio.messages.create({
      to,
      body: text,
    })
  }
}
