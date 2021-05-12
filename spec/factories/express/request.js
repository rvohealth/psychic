// import { jest } from '@jest/globals'

export function buildRequest(params={}) {
  {
    const res = {}
    // replace the following () => res
    // with your function stub/mock of choice
    // making sure they still return `res`
    res.status = () => res
    res.json = () => res
    res.params = params
    return res;
  }
}
