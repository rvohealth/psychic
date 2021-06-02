import RoutingError from 'src/error/crystal-ball/routing-error'
export default class Unauthorized extends RoutingError {
  static statusCode = 401
}

