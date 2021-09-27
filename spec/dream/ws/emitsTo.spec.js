import { create } from 'spec/factories'
import InvalidAsArgument from 'src/error/dream/ws/emits-to/invalid-as-argument'
import InvalidRelationNameArgument from 'src/error/dream/ws/emits-to/invalid-relation-name-argument'

describe('Dream.emitsTo', () => {
  it ('stores configuration wihtin instance', async () => {
    const TestUser = create('dream.TestUser')
    const user = new TestUser()
    posess(user, '_association').returning(true)

    expect(user._emitsTo).toEqual({})

    user.emitsTo('fishman', { as: 'currentFishman', fish: 10 })

    expect(user._emitsTo).toEqual({
      fishman: {
        as: 'currentFishman',
        to: 'fishman',
        fish: 10,
      },
    })
  })

  context ('as is not passed', () => {
    it ('throws an exception', async () => {
      const TestUser = create('dream.TestUser')
      const user = new TestUser()
      posess(user, '_association').returning(true)

      expect(user._emitsTo).toEqual({})

      expect(() => {
        user.emitsTo('fishman', { fish: 10 })
      }).toThrow(InvalidAsArgument)
    })
  })

  context ('relationName is not passed', () => {
    it ('throws an exception', async () => {
      const TestUser = create('dream.TestUser')
      const user = new TestUser()

      expect(user._emitsTo).toEqual({})

      expect(() => {
        user.emitsTo()
      }).toThrow(InvalidRelationNameArgument)
    })
  })
})

