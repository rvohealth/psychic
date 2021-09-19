import { buildRequest } from 'spec/factories/express/request'
import { buildResponse } from 'spec/factories/express/response'
import { createServer } from 'http'
import HTTPVision from 'src/crystal-ball/vision/http'
import WSVision from 'src/crystal-ball/vision/ws'

export function buildVision(route, method, { params, ws }={}) {
  if (ws) return buildWSVision(route, method, { params, ws })

  const req = buildRequest(params)
  const res = buildResponse()
  return new HTTPVision(route, method, req, res)
}

export function buildWSVision(route, method, { params }={}) {
  const io = createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if ( req.method === 'OPTIONS' ) {
      res.writeHead(200);
      res.end();
      return;
    }
  })

  return new WSVision(route, method, params, { socket: {}, io })
}
