import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { vi } from 'vitest'
import PsychicApp from '../../../src/psychic-app/index.js'
import { PsychicServer } from '../../../src/package-exports/index.js'

// R-006 @koa/cors defaults `origin` to '*' when called with no options, which
// would emit Access-Control-Allow-Origin: * on every response — a foot-gun
// for an API serving user-scoped data. Psychic now skips mounting @koa/cors
// entirely when the app hasn't called psy.set('cors', ...). Apps opt in to
// cross-origin by configuring cors explicitly.

describe('CORS defaults (R-006)', () => {
  describe('when corsOptions is unset', () => {
    it('does not set Access-Control-Allow-Origin on cross-origin requests', async () => {
      const app = PsychicApp.getOrFail()
      vi.spyOn(app, 'corsOptions', 'get').mockReturnValue(undefined as never)

      await request.init(PsychicServer)
      const res = await request.get('/ping', 200, {
        headers: { Origin: 'https://evil.example' },
      })

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
      expect(res.headers['access-control-allow-credentials']).toBeUndefined()
    })
  })
})
