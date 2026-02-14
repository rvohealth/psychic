import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import createModelWithoutSerializer from '../../../../test-app/spec/factories/ModelWithoutSerializerFactory.js'

describe('serializing Dream models', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('rendering a Dream that does not have a default serializer', () => {
    it('throws AttemptingToRenderDreamWithoutSerializer', async () => {
      await createModelWithoutSerializer()
      const result = await request.get('/serializer-tests/naked-dream', 200)
      expect(result.body).toEqual('MissingSerializersDefinition')
    })
  })
})
