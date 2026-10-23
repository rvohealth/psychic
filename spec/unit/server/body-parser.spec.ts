import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { Transform } from 'node:stream'
import zlib from 'node:zlib'
import { agent as supertest } from 'supertest'
import { MockInstance } from 'vitest'
import PsychicApp, { type BodyParserOptions } from '../../../src/psychic-app/index.js'
import PsychicServer from '../../../src/server/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('PsychicServer body parsing', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
    vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
  })

  it('parses nested URL-encoded form fields before passing them to the controller', async () => {
    const email = 'urlencoded+form@example.com'

    await request.post('/users', 201, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: {
        user: {
          email,
          password: 'form-parser-regression',
        },
      },
    })

    expect(await User.where({ email }).count()).toEqual(1)
  })

  it('rejects URL-encoded bodies larger than the default 56 KB form limit', async () => {
    await request.post('/users', 413, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: {
        user: {
          email: 'oversized-form@example.com',
          password: 'x'.repeat(60 * 1024),
        },
      },
    })
  })

  let logWithLevelSpy: MockInstance

  beforeEach(() => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
  })

  function errorLogs(): unknown[] {
    return logWithLevelSpy.mock.calls
      .filter(([level]) => level === 'error')
      .map(([, message]): unknown => message)
  }

  function serverErrorHookCallCount() {
    return (process.env.__PSYCHIC_HOOKS_TEST_CACHE || '').split(',').filter(entry => entry === 'server:error')
      .length
  }

  // An app that never calls psy.set('json', …) leaves its json options
  // unset, and gets @koa/bodyparser's own defaults.
  context('when the app never configures json', () => {
    beforeEach(() => {
      // PsychicApp is re-initialized before each spec, so this does not leak
      ;(PsychicApp.getOrFail() as unknown as { _jsonOptions: unknown })._jsonOptions = undefined
    })

    async function post(body: string) {
      const server = new PsychicServer()
      await server.boot()

      return await supertest(server.koaApp.callback())
        .post('/ping')
        .set('content-type', 'application/json')
        .send(body)
    }

    it('boots and parses a JSON body', async () => {
      expect(PsychicApp.getOrFail().jsonOptions).toBeUndefined()

      const res = await post('{"valid": "json"}')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual('helloworld')
    })

    it("answers malformed JSON with the parser's 400, without logging it or calling server:error hooks", async () => {
      const res = await post('this is not json')

      expect(res.status).toEqual(400)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    })
  })

  // An app's own detectJSON and onError callbacks, passed through
  // psy.set('json', …), run inside the body parser's parse step. An error
  // they throw is the app's, not the body parser's own, so one that merely
  // carries a 4xx status is a server error, as from any other middleware.
  context("with an app's own detectJSON or onError callback", () => {
    // e.g. an uncaught API client error mirroring an upstream 401
    function callbackDependencyFailure() {
      return Object.assign(new Error('callback dependency failed'), { status: 401 })
    }

    async function post(
      jsonOptions: BodyParserOptions,
      body: string,
      contentType: string = 'application/json',
    ) {
      PsychicApp.getOrFail().set('json', jsonOptions)
      const server = new PsychicServer()
      await server.boot()

      return await supertest(server.koaApp.callback())
        .post('/ping')
        .set('content-type', contentType)
        .send(body)
    }

    it("answers malformed JSON with the parser's 400, without logging it or calling server:error hooks, when the app configures no callback", async () => {
      const res = await post({}, 'this is not json')

      expect(res.status).toEqual(400)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it('answers an error carrying a 4xx status thrown by detectJSON with a 500, logged and passed to server:error hooks', async () => {
      const res = await post(
        {
          detectJSON: () => {
            throw callbackDependencyFailure()
          },
        },
        '{"valid": "json"}',
      )

      expect(res.status).toEqual(500)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([expect.stringContaining('callback dependency failed')])
      expect(serverErrorHookCallCount()).toEqual(1)
    })

    it("answers an error carrying a 4xx status thrown by onError in place of the parser's with a 500, logged and passed to server:error hooks", async () => {
      const res = await post(
        {
          onError: () => {
            throw callbackDependencyFailure()
          },
        },
        'this is not json',
      )

      expect(res.status).toEqual(500)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([expect.stringContaining('callback dependency failed')])
      expect(serverErrorHookCallCount()).toEqual(1)
    })

    it('answers the detectJSON error that onError re-throws with a 500, logged and passed to server:error hooks', async () => {
      const res = await post(
        {
          detectJSON: () => {
            throw callbackDependencyFailure()
          },
          onError: err => {
            throw err
          },
        },
        '{"valid": "json"}',
      )

      expect(res.status).toEqual(500)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([expect.stringContaining('callback dependency failed')])
      expect(serverErrorHookCallCount()).toEqual(1)
    })

    it("answers the parser's own error that onError re-throws with its 400, without logging it or calling server:error hooks", async () => {
      const errorsHandedToOnError: Error[] = []

      const res = await post(
        {
          onError: err => {
            errorsHandedToOnError.push(err)
            throw err
          },
        },
        'this is not json',
      )

      expect(errorsHandedToOnError).toEqual([expect.any(SyntaxError)])
      expect(res.status).toEqual(400)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it("parses the body as JSON when detectJSON says so, answering malformed JSON with the parser's 400", async () => {
      const res = await post({ detectJSON: () => true }, 'this is not json', 'text/plain')

      expect(res.status).toEqual(400)
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it("hands the request on when onError handles the parser's error without throwing", async () => {
      const res = await post({ onError: () => {} }, 'this is not json')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual('helloworld')
    })
  })

  // The body parser decompresses a body sent with a gzip, deflate or br
  // Content-Encoding. A body that is not valid compressed data is the
  // client's fault, like malformed JSON, although the error zlib throws for
  // it carries no status.
  context('with a compressed body', () => {
    const json = '{"valid": "json"}'

    async function post(body: Buffer | string, contentEncoding: string, jsonOptions: BodyParserOptions = {}) {
      PsychicApp.getOrFail().set('json', jsonOptions)
      const server = new PsychicServer()
      await server.boot()

      return await supertest(server.koaApp.callback())
        .post('/ping')
        .set('content-type', 'application/json')
        .set('content-encoding', contentEncoding)
        // sends the bytes as they are; superagent would otherwise send a
        // Buffer as JSON
        .serialize((data: Buffer | string) => data as string)
        .send(body as string)
    }

    function expectQuiet400(res: { status: number; text: string }) {
      expect(res.status).toEqual(400)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    }

    // a decompression stream that fails, on the first chunk it is given, with
    // an error shaped like the ones zlib throws
    function decompressionFailingWith(code: string, errno: number) {
      return new Transform({
        transform(_chunk, _encoding, callback) {
          callback(Object.assign(new Error(`decompression failed: ${code}`), { errno, code }))
        },
      })
    }

    it('parses a valid gzip body', async () => {
      const res = await post(zlib.gzipSync(json), 'gzip')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual('helloworld')
    })

    it.each([
      ['a malformed gzip body', 'this is not gzip', 'gzip'],
      ['a malformed deflate body', 'this is not deflate', 'deflate'],
      ['a malformed br body', 'this is not brotli', 'br'],
      ['a truncated gzip body', zlib.gzipSync(json).subarray(0, -6), 'gzip'],
      ['an empty gzip body', '', 'gzip'],
      [
        'a deflate body that needs a preset dictionary',
        zlib.deflateSync(json, { dictionary: Buffer.from('a preset dictionary') }),
        'deflate',
      ],
    ])(
      'answers %s with a 400, without logging it or calling server:error hooks',
      async (_, body, contentEncoding) => {
        expectQuiet400(await post(body, contentEncoding))
      },
    )

    it("answers a malformed gzip body with a 400 when the app's onError re-throws the parser's error", async () => {
      expectQuiet400(
        await post('this is not gzip', 'gzip', {
          onError: err => {
            throw err
          },
        }),
      )
    })

    it('answers an unsupported Content-Encoding with a 415, without logging it or calling server:error hooks', async () => {
      const res = await post(json, 'compress')

      expect(res.status).toEqual(415)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([])
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    // a failure on the server's side, e.g. zlib running out of memory, is a
    // server error, though it comes from the body parser
    it.each([
      ['gzip', 'createUnzip', 'Z_MEM_ERROR', -4],
      ['br', 'createBrotliDecompress', 'ERR__ERROR_ALLOC_RING_BUFFER_1', -26],
    ] as const)(
      'answers a %s decompression failing with %s with a 500, logged and passed to server:error hooks',
      async (contentEncoding, createDecompression, code, errno) => {
        const createDecompressionSpy = vi
          .spyOn(zlib, createDecompression)
          .mockReturnValue(
            decompressionFailingWith(code, errno) as unknown as ReturnType<typeof zlib.createUnzip> &
              ReturnType<typeof zlib.createBrotliDecompress>,
          )

        try {
          const res = await post(zlib.gzipSync(json), contentEncoding)

          expect(createDecompressionSpy).toHaveBeenCalledTimes(1)
          expect(res.status).toEqual(500)
          expect(res.text).toEqual('')
          expect(errorLogs()).toEqual([expect.stringContaining(code)])
          expect(serverErrorHookCallCount()).toEqual(1)
        } finally {
          createDecompressionSpy.mockRestore()
        }
      },
    )

    it("answers a zlib-shaped error thrown by the app's onError in place of the parser's with a 500, logged and passed to server:error hooks", async () => {
      const res = await post('this is not gzip', 'gzip', {
        onError: () => {
          throw Object.assign(new Error('the callback failed'), { errno: -3, code: 'Z_DATA_ERROR' })
        },
      })

      expect(res.status).toEqual(500)
      expect(res.text).toEqual('')
      expect(errorLogs()).toEqual([expect.stringContaining('the callback failed')])
      expect(serverErrorHookCallCount()).toEqual(1)
    })
  })
})
