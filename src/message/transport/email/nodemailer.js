import nodemailer from 'nodemailer'
import Transport from 'src/message/transport'

export default class NodemailerEmailTransport extends Transport {
  get nm() {
    return this._nm
  }

  initialize() {
    this._nm = nodemailer.createTransport({
      ...this.config,
    })
  }

  async send({
    to,
    from,
    subject,
    text,
    html,
  }) {
    return await this.nm.sendMail({
      to,
      from,
      subject,
      text,
      html,
    })
  }

  _verify() {
    return new Promise((accept, reject) => {
      this.nm.verify((error, success) => {
        if (error) return reject(error)
        return accept(success)
      })
    })
  }
}
