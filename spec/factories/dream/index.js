import buildTestUser from 'spec/factories/dream/test-user'
import buildPost from 'spec/factories/dream/post'
import buildComment from 'spec/factories/dream/comment'
import buildSpouse from 'spec/factories/dream/spouse'
import buildMotherInLaw from 'spec/factories/dream/mother-in-law'

export default class DreamFactory {
  static get Comment() {
    return {
      build: buildComment,
    }
  }

  static get Spouse() {
    return {
      build: buildSpouse,
    }
  }

  static get MotherInLaw() {
    return {
      build: buildMotherInLaw,
    }
  }

  static get TestUser() {
    return {
      build: buildTestUser,
    }
  }

  static get Post() {
    return {
      build: buildPost,
    }
  }
}
