import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'

const allSpy = jest.fn()
const devSpy = jest.fn()
const prodSpy = jest.fn()
const testingSpy = jest.fn()

jest.mock('../../../test-app/conf/hooks/all', () => ({ default: allSpy }))
jest.mock('../../../test-app/conf/hooks/dev', () => ({ default: devSpy }))
jest.mock('../../../test-app/conf/hooks/prod', () => ({ default: prodSpy }))
jest.mock('../../../test-app/conf/hooks/testing', () => ({ default: testingSpy }))

describe('PsychicConfig', () => {
  let config: PsychicConfig

  beforeEach(() => {
    config = new PsychicConfig(new PsychicServer().app)
  })

  it('loads conf/hooks/all.ts', async () => {
    await config.boot()
    expect(allSpy).toHaveBeenCalledWith(config)
  })

  it('loads conf/hooks/testing.ts', async () => {
    await config.boot()
    expect(testingSpy).toHaveBeenCalledWith(config)
  })

  context('process.env.NODE_ENV === "development"', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('loads conf/hooks/testing.ts', async () => {
      await config.boot()
      expect(devSpy).toHaveBeenCalledWith(config)
    })
  })

  context('process.env.NODE_ENV === "production"', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('loads conf/hooks/prod.ts', async () => {
      await config.boot()
      expect(prodSpy).toHaveBeenCalledWith(config)
    })
  })
})
