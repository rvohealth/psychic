import { Dream } from '@rvoh/dream'
import { CannotSaveMissingDream } from '@rvoh/dream/errors'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import PsychicController from '../../../src/controller/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'
import { createMockKoaContext } from '../controller/helpers/mockRequest.js'

describe('PsychicRouter#handle', () => {
  let server: PsychicServer
  let router: PsychicRouter
  const ctx = createMockKoaContext({ body: {} })
  beforeEach(async () => {
    server = new PsychicServer()
    await server.boot()
    router = new PsychicRouter(server.koaApp)
  })

  it('calls the matching method on a corresponding controller', async () => {
    vi.spyOn(UsersController.prototype, 'ping')
    router.get('users', UsersController, 'ping')
    await router.handle(UsersController, 'ping', { ctx })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UsersController.prototype.ping).toHaveBeenCalled()
  })

  it('returns 404 when saving a dream whose row was deleted', async () => {
    const missingDream = {
      sanitizedConstructorName: 'User',
      primaryKeyValue: () => 'id',
    } as unknown as Dream
    vi.spyOn(PsychicController.prototype, 'runAction').mockRejectedValueOnce(
      new CannotSaveMissingDream(missingDream),
    )

    await router.handle(UsersController, 'ping', { ctx })

    expect(ctx.status).toBe(404)
  })
})
