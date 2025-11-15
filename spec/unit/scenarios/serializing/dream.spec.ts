import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicApp from '../../../../src/psychic-app/index.js'
import PsychicServer from '../../../../src/server/index.js'
import createModelWithoutSerializer from '../../../../test-app/spec/factories/ModelWithoutSerializerFactory.js'
import createSimpleSerializerModel from '../../../../test-app/spec/factories/SimpleSerializerModelFactory.js'

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

  context('Dangerous characters', () => {
    context('with sanitizeResponseJson: true', () => {
      it('are sanitized', async () => {
        vi.spyOn(PsychicApp.prototype, 'sanitizeResponseJson', 'get').mockReturnValue(true)
        const model = await createSimpleSerializerModel({ name: 'h<llo' })
        const result = await request.get('/serializer-tests/sanitized', 200)

        expect(result.header['content-type']).toEqual('application/json; charset=utf-8')
        expect(result.text).toEqual(`{"id":"${model.id}","name":"h\\u003cllo"}`)
      })
    })

    context('with sanitizeResponseJson: false', () => {
      it('are not sanitized', async () => {
        vi.spyOn(PsychicApp.prototype, 'sanitizeResponseJson', 'get').mockReturnValue(false)
        const model = await createSimpleSerializerModel({ name: 'h<llo' })
        const result = await request.get('/serializer-tests/sanitized', 200)

        expect(result.header['content-type']).toEqual('application/json; charset=utf-8')
        expect(result.text).toEqual(`{"id":"${model.id}","name":"h<llo"}`)
      })
    })
  })
})
