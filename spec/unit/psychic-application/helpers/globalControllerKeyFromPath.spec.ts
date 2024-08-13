import globalControllerKeyFromPath from '../../../../src/psychic-application/helpers/globalControllerKeyFromPath'

describe('globalControllerKeyFromPath', () => {
  it('converts test-app/app/controllers/Graph/Edge.ts to controllers/Graph/Edge', () => {
    expect(
      globalControllerKeyFromPath('test-app/app/controllerz/Graph/Edge.ts', 'test-app/app/controllerz/'),
    ).toEqual('controllers/Graph/Edge')
  })
})
