import RoutingError from 'src/error/crystal-ball/routing-error'
export default class NotFound extends RoutingError {
  static statusCode = 404
}

