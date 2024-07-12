import generateControllerSpecContent from '../../../../src/generate/helpers/generateControllerSpecContent'

describe('generateControllerSpecContent', () => {
  it('generates a blank controller spec with a commented out context import', () => {
    const res = generateControllerSpecContent('UsersController')
    expect(res).toEqual(`\
// import { describe as context } from '@jest/globals'

describe('UsersController', () => {
  it.todo('add a test here to get started building UsersController')
})`)
  })
})
