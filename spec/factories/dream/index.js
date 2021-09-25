import buildTestUser from 'spec/factories/dream/test-user'

export default class DreamFactory {
  static get testUser() {
    return {
      build: buildTestUser,
    }
  }
}
