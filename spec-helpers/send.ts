import supertest, { Response } from 'supertest'
import { createPsychicServer } from '.'
import { HttpMethod, PsychicServer } from '../src'
import supersession from './supersession'

export class Send {
  public async get(uri: string, expectedStatus: number, opts: SendOptsGet = {}): Promise<Response> {
    return await this.makeRequest('get', uri, expectedStatus, opts)
  }

  public async post(uri: string, expectedStatus: number, opts: SendOptsPost = {}): Promise<Response> {
    return await this.makeRequest('post', uri, expectedStatus, opts)
  }

  public async put(uri: string, expectedStatus: number, opts: SendOptsPost = {}): Promise<Response> {
    return await this.makeRequest('put', uri, expectedStatus, opts)
  }

  public async patch(uri: string, expectedStatus: number, opts: SendOptsPost = {}): Promise<Response> {
    return await this.makeRequest('patch', uri, expectedStatus, opts)
  }

  public async delete(uri: string, expectedStatus: number, opts: SendOptsPost = {}): Promise<Response> {
    return await this.makeRequest('delete', uri, expectedStatus, opts)
  }

  public async session(
    uri: string,
    credentials: object,
    expectedStatus: number,
    opts: SendSessionOpts = {},
  ): Promise<ReturnType<typeof supertest>> {
    return await new Promise(async (accept, reject) => {
      const server = await createPsychicServer()
      const session = supersession(server)

      // supersession is borrowed from a non-typescript repo, which
      // does not have strong types around http methods, so we need to any cast
      ;(session[(opts.httpMethod || 'post') as keyof typeof session] as any)(uri)
        .send(credentials)
        .expect(expectedStatus)
        .query(opts.query || {})
        .set(opts.headers || {})
        .end((err: Error) => {
          if (err) return reject(err)

          return accept(session)
        })
    })
  }

  private async makeRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    uri: string,
    expectedStatus: number,
    opts: SendOptsAll = {},
  ) {
    server ||= await createPsychicServer()

    const req = supertest(server.app)
    let request = req[method](uri)
      .set(opts.headers || {})
      .query(opts.query || {})
    if (method !== 'get') request = request.send(opts.data)

    try {
      return await request.expect(expectedStatus)
    } catch (err) {
      // without manually console logging, you get no stack trace here
      console.error(err)
      console.trace()
      throw err
    }
  }
}

let server: PsychicServer

export interface SendOptsAll extends SendOpts {
  query?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface SendOptsGet extends SendOpts {
  query?: Record<string, unknown>
}

export interface SendOptsPost extends SendOpts {
  data?: Record<string, unknown>
}

export interface SendOpts {
  headers?: Record<string, string>
  allowMocks?: boolean
}

export interface SendSessionOpts extends SendOptsAll {
  httpMethod?: HttpMethod
}

export default new Send()
