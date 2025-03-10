import { visit } from '@rvoh/psychic-spec-helpers'

describe('ensures that a second feature spec can run', () => {
  it('can run multiple feature specs', async () => {
    await visit('/')
  })
})
