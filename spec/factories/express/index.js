import { buildRequest } from 'spec/factories/express/request'
import { buildResponse } from 'spec/factories/express/response'

export default class ExpressFactory {
  static get request() {
    return {
      build: buildRequest,
    }
  }

  static get response() {
    return {
      build: buildResponse,
    }
  }
}
