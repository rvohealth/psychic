import { buildRequest } from 'spec/factories/express/request'
import { buildResponse } from 'spec/factories/express/response'
import Vision from 'src/crystal-ball/vision'

export function buildVision(route, method, { params }={}) {
  const req = buildRequest(params)
  const res = buildResponse()
  return new Vision(route, method, req, res)
}
