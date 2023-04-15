import ApiUsersController from '../app/controllers/api/users'
import ApiV1UsersController from '../app/controllers/api/v1/users'
import BackgroundTestController from '../app/controllers/background-test'
import UsersController from '../app/controllers/users'

export default {
  'api/users': ApiUsersController,
  'api/v1/users': ApiV1UsersController,
  'background-test': BackgroundTestController,
  'users': UsersController,
}
