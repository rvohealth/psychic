import { Request, Response } from 'express'
import Encrypt from '../encryption/encrypt'

export default class Session {
  private req: Request
  private res: Response
  constructor(req: Request, res: Response) {
    this.req = req
    this.res = res
  }

  public cookie(name: string, data?: string) {
    if (data) return this.setCookie(name, data)
    return (this.req.cookies as any)[name]
  }

  private setCookie(name: string, data: string) {
    this.res.cookie(name, Encrypt.sign(data), {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: this.daysToMilliseconds(31),
    })
  }

  public clearCookie(name: string) {
    this.res.clearCookie(name)
  }

  public daysToMilliseconds(numDays: number) {
    return numDays * 60 * 60 * 24 * 1000
  }
}
