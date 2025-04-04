import GlobalNameCompatibleClass from '../../../test-app/src/app/services/GlobalNameCompatibleClass.js'
import NestedGlobalNameCompatibleClass from '../../../test-app/src/app/services/Nested/GlobalNameCompatibleClass.js'
import NoGlobalNameClass from '../../../test-app/src/app/services/NoGlobalNameClass.js'

describe('services with globalName accessor', () => {
  it('have globalName set automatically', () => {
    expect(GlobalNameCompatibleClass.globalName).toEqual('services/GlobalNameCompatibleClass')
  })

  it('doesn’t set globalName on classes that don’t include a setter', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((NoGlobalNameClass as any).globalName).toBeUndefined()
  })

  it('works for nested directories', () => {
    expect(NestedGlobalNameCompatibleClass.globalName).toEqual('services/Nested/GlobalNameCompatibleClass')
  })
})
