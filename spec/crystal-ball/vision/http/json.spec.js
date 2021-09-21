import { create } from 'spec/factories'
import Dream from 'src/dream'
import config from 'src/singletons/config'

class TestUser extends Dream {}

describe('HTTPVision#json', () => {
  beforeEach(() => {
    posess(config, 'dreams', 'get').mockReturnValue({
      'test_user': TestUser,
    })

    posess(config, 'schema', 'get').mockReturnValue({
      test_users: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        email: {
          type: 'text',
          name: 'email',
        },
      }
    })
  })

  context ('the object passed is a standard javascript object', () => {
    it ('serializes the object', async () => {
      const vision = create('crystalBall.vision', 'test-users', 'index', {})
      const spy = posess(vision.response, 'json').returning({ fish: 20 })
      const result = vision.json({ fish: 10 })

      expect(spy).toHaveBeenCalledWith({ fish: 10 })
      expect(result).toEqual({ fish: 20 })
    })
  })

  context ('the object passed is a dream instance', () => {
    it ('serializes the projected dream', async () => {
      const vision = create('crystalBall.vision', 'test-users', 'index', {})
      const projectSpy = posess(vision, 'project').returning({ fish: 20 })
      const jsonSpy = posess(vision.response, 'json').returning({ fish: 30 })
      const testUser = new TestUser({ email: 'fishman' })

      const result = vision.json(testUser)

      expect(projectSpy).toHaveBeenCalledWith(testUser, undefined)
      expect(jsonSpy).toHaveBeenCalledWith({ fish: 20 })
      expect(result).toEqual({ fish: 30 })
    })
  })

  context ('the object passed is an array of dream instances', () => {
    it ('serializes the projected dream', async () => {
      const vision = create('crystalBall.vision', 'test-users', 'index', {})
      const projectSpy = posess(vision, 'project').returning({ fish: 20 })
      const jsonSpy = posess(vision.response, 'json').returning({ fish: 30 })
      const testUser = new TestUser({ email: 'fishman' })
      const otherTestUser = new TestUser({ email: 'fishman2' })

      const result = vision.json([ testUser, otherTestUser ])

      expect(projectSpy).toHaveBeenCalledWith(testUser, undefined)
      expect(projectSpy).toHaveBeenCalledWith(otherTestUser, undefined)
      expect(jsonSpy).toHaveBeenCalledWith([{ fish: 20 }, { fish: 20 }])
      expect(result).toEqual({ fish: 30 })
    })
  })
})
