// import { jest } from '@jest/globals'
import Params from 'src/crystal-ball/params'

export function buildRequest(params={}) {
  {
    const req = {}
    // replace the following () => req
    // with your function stub/mock of choice
    // making sure they still return `req`
    req.status = () => req
    req.json = () => req
    req.body = params
    return req;
  }
}
