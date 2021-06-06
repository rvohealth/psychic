import { buildRequest } from 'spec/factories/express/request'
import { buildResponse } from 'spec/factories/express/response'
import HTTPVision from 'src/crystal-ball/vision/http'

export function buildVision(route, method, { params }={}) {
  const req = buildRequest(params)
  const res = buildResponse()
  return new HTTPVision(route, method, req, res)
}
