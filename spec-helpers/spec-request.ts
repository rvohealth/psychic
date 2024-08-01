import supertest, { Response } from 'supertest'
import { createPsychicServer } from '.'
import { HttpMethod, PsychicServer } from '../src'
import supersession from './supersession'

export class SpecRequest {
  private server: PsychicServer | undefined

  public async get(uri: string, expectedStatus: number, opts: SpecRequestOptsGet = {}): Promise<Response> {
    return await this.makeRequest('get', uri, expectedStatus, opts as SpecRequestOptsAll)
  }

  public async post(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('post', uri, expectedStatus, opts as SpecRequestOptsAll)
  }

  public async put(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('put', uri, expectedStatus, opts as SpecRequestOptsAll)
  }

  public async patch(uri: string, expectedStatus: number, opts: SpecRequestOptsPost = {}): Promise<Response> {
    return await this.makeRequest('patch', uri, expectedStatus, opts as SpecRequestOptsAll)
  }

  public async delete(uri: string, expectedStatus: number, opts: SpecRequestOptsGet = {}): Promise<Response> {
    return await this.makeRequest('delete', uri, expectedStatus, opts as SpecRequestOptsAll)
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
    return await new Promise((accept, reject) => {
      createPsychicServer()
        .then(server => {
          const session = supersession(server)

          // supersession is borrowed from a non-typescript repo, which
          // does not have strong types around http methods, so we need to any cast
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
          ;(session[(opts.httpMethod || 'post') as keyof typeof session] as any)(uri)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .send(credentials)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .expect(expectedStatus)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .query(opts.query || {})
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .set(opts.headers || {})
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .end((err: Error) => {
              if (err) return reject(err)

              return accept(session)
            })
        })
        .catch(() => null)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: any
}

export interface SpecRequestOptsPost extends SpecRequestOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

export interface SpecRequestOpts {
  headers?: Record<string, string>
  allowMocks?: boolean
}

export interface SpecRequestSessionOpts extends SpecRequestOptsAll {
  httpMethod?: HttpMethod
}

export default new SpecRequest()
