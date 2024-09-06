import PsychicRouter from '../../../src/router'
import ApiUsersController from '../app/controllers/Api/UsersController'
import ApiV1UsersController from '../app/controllers/Api/V1/UsersController'
import AuthedUsersController from '../app/controllers/AuthedUsersController'
import CircularController from '../app/controllers/CircularController'
import ErrorsController from '../app/controllers/ErrorsController'
import GreeterController from '../app/controllers/GreeterController'
import ParamsTestController from '../app/controllers/ParamsTestController'
import PetsController from '../app/controllers/PetsController'
import ScopeTestController from '../app/controllers/ScopeTestController'
import UnauthedUsersController from '../app/controllers/UnauthedUsersController'
import UsersController from '../app/controllers/UsersController'

export default (r: PsychicRouter) => {
  r.get('circular', CircularController, 'hello')
  r.get('ping', UsersController, 'ping')
  r.post('ping', UsersController, 'ping')
  r.put('ping', UsersController, 'ping')
  r.patch('ping', UsersController, 'ping')
  r.delete('ping', UsersController, 'ping')
  r.options('ping', UsersController, 'ping')
  r.post('auth', UnauthedUsersController, 'signin')
  r.get('auth-ping', AuthedUsersController, 'ping')
  r.get('api-ping', ApiUsersController, 'ping')
  r.post('cast-param-test', ParamsTestController, 'testCastParam')
  r.post('openapi-validation-test', ParamsTestController, 'testOpenapiValidation')
  r.get('users/howyadoin', UsersController, 'howyadoin')
  r.resources('users')
  r.resources('pets', { only: ['create', 'update'] }, r => {
    r.put('update2', PetsController, 'update2')
  })

  // hooks tests
  r.get('users-before-all-test', UsersController, 'beforeAllTest')
  r.post('failed-to-save-test', UsersController, 'failedToSaveTest')
  r.post('force-throw', UsersController, 'forceThrow')
  r.get('conflict', ErrorsController, 'throwConflict')
  r.get('not-found', ErrorsController, 'throwNotFound')

  r.namespace('api', r => {
    r.get('ping', ApiUsersController, 'ping')
    r.namespace('v1', r => {
      r.get('ping', ApiV1UsersController, 'ping')
      r.resources('users', { only: ['index'] })
    })
    r.resources('users', { only: ['create', 'update'] })
    r.resources('pets', { only: ['create', 'update'] })
  })

  r.scope('scoped-things', r => {
    r.get('testing-scopes', ScopeTestController, 'scopeTest')
  })

  r.post('login', UsersController, 'login')
  // TODO this one uses new syntax
  r.resources('users', { controller: UsersController, only: ['create', 'index'] }, r => {
    r.get('hello', UsersController, 'hello')
    r.post('', UsersController, 'doathing')
    r.get('justforspecs', UsersController, 'justforspecs')
  })

  r.resource('greeter', { only: ['show'] }, r => {
    r.get('hello', GreeterController, 'hello')
    r.get('justforspecs', GreeterController, 'justforspecs')
  })

  // TODO do we still need these?
  // r.get('route-exists-but-controller-doesnt')
  // r.get('controller-exists-but-method-doesnt')
}
