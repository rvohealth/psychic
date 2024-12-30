import { describe as context } from '@jest/globals'
import openapiRoute from '../../../../src/openapi-renderer/helpers/openapiRoute'

describe('openapiRoute', () => {
  context('/hello/world', () => {
    it('stays /hello/world', () => {
      expect(openapiRoute('/hello/world')).toEqual('/hello/world')
    })
  })
  context('hello/world', () => {
    it('becomes /hello/world', () => {
      expect(openapiRoute('hello/world')).toEqual('/hello/world')
    })
  })

  context('/users/:id', () => {
    it('becomes /users/{id}', () => {
      expect(openapiRoute('/users/:id')).toEqual('/users/{id}')
    })
  })

  context('/users/:id/hello', () => {
    it('becomes /users/{id}/hello', () => {
      expect(openapiRoute('/users/:id/hello')).toEqual('/users/{id}/hello')
    })
  })

  context('/users/:userId/friends/:id', () => {
    it('becomes /users/{userId}/friends/{id}', () => {
      expect(openapiRoute('/users/:userId/friends/:id')).toEqual('/users/{userId}/friends/{id}')
    })
  })
})
