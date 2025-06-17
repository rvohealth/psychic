import * as fs from 'node:fs/promises'
import OpenapiAppRenderer from '../../../../src/openapi-renderer/app.js'

describe('OpenapiAppRenderer', () => {
  describe('.sync', () => {
    it('syncs default openapi data to the default file', async () => {
      const filename = './openapi.json'

      try {
        await fs.rm(filename)
      } catch {
        // noop
      }

      await OpenapiAppRenderer.sync()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const syncFile = JSON.parse((await fs.readFile(filename)).toString())

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      expect(Object.keys(syncFile.paths)).not.toContain('/admin/test')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      expect(Object.keys(syncFile.paths)).toContain('/greeter/justforspecs')
    })

    it('syncs named openapi data to the specified file', async () => {
      const filename = './admin.openapi.json'

      try {
        await fs.rm(filename)
      } catch {
        // noop
      }

      await OpenapiAppRenderer.sync()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const syncFile = JSON.parse((await fs.readFile(filename)).toString())

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      expect(Object.keys(syncFile.paths)).toEqual([
        '/admin/test',
        '/openapi/multiple-openapi-names',
        '/openapi/multiple-serializer-statements',
        '/openapi/request-body-for-type',
      ])
    })
  })
})
