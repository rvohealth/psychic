import HttpError from './index'

export default class FailedDependency extends HttpError {
  constructor(message: string | undefined) {
    super(424, message)
  }
}
