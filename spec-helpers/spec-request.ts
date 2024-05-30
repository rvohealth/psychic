import supertest, { Response } from 'supertest'
import { createPsychicServer } from '.'
import { HttpMethod, PsychicServer } from '../src'
import supersession from './supersession'

export class SpecRequest {
  private server: PsychicServer | undefined

  public async get(uri: string, expectedStatus: number, opts: SpecRequestOptsGet = {}): Promise<Response> {
    return await this.makeRequest('get', uri, expectedStatus, opts)
  }

  public async post(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('post', uri, expectedStatus, opts)
  }

  public async put(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('put', uri, expectedStatus, opts)
  }

  public async patch(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('patch', uri, expectedStatus, opts)
  }

  public async delete(
    uri: string,
    expectedStatus: number,
    opts: SpecRequestOptsPost = {},
  ): Promise<Response> {
    return await this.makeRequest('delete', uri, expectedStatus, opts)
  }

  public async init() {
    this.server ||= await createPsychicServer()
  }

  public async session(
    uri: string,
    credentials: object,
    expectedStatus: number,
    opts: SpecRequestSessionOpts = {},
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
    opts: SpecRequestOptsAll = {},
  ) {
    // TODO: find out why this is necessary. Currently, without initializing the server
    // at the beginning of the specs, supertest is unable to use our server to handle requests.
    // it gives the appearance of being an issue with a runaway promise (i.e. missing await)
    // but I can't find it anywhere, so I am putting this init method in as a temporary fix.
    if (!this.server)
      throw new Error(
        `
  ERROR:
    When making use of the send spec helper, you must first call "await specRequest.init()"
    from a beforEach hook at the root of your specs.
`,
      )

    if (expectedStatus === 500) {
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = '1'
    }

    const req = supertest.agent(this.server.app)
    let request = req[method](uri)
    if (opts.headers) request = request.set(opts.headers)
    if (opts.query) request = request.query(opts.query)
    if (method !== 'get') request = request.send(opts.data)

    try {
      const res = await request.expect(expectedStatus)
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined
      return res
    } catch (err) {
      // without manually console logging, you get no stack trace here
      console.error(err)
      console.trace()

      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined

      throw err
    }
  }
}

export interface SpecRequestOptsAll extends SpecRequestOpts {
  query?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface SpecRequestOptsGet extends SpecRequestOpts {
  query?: Record<string, unknown>
}

export interface SpecRequestOptsPost extends SpecRequestOpts {
  data?: Record<string, unknown>
}

export interface SpecRequestOpts {
  headers?: Record<string, string>
  allowMocks?: boolean
}

export interface SpecRequestSessionOpts extends SpecRequestOptsAll {
  httpMethod?: HttpMethod
}

export default new SpecRequest()
