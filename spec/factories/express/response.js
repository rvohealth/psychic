// import { jest } from '@jest/globals'

export function buildResponse() {
  {
    const res = {}
    // replace the following () => res
    // with your function stub/mock of choice
    // making sure they still return `res`
    res.status = () => res
    res.json = () => res
    return res;
  }
}
