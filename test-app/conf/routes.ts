import PsychicRouter from '../../src/router'

export default (r: PsychicRouter) => {
  r.get('ping', 'Users#ping')
  r.post('ping', 'Users#ping')
  r.put('ping', 'Users#ping')
  r.patch('ping', 'Users#ping')
  r.delete('ping', 'Users#ping')
  r.options('ping', 'Users#ping')
  r.post('auth', 'UnauthedUsers#signin')
  r.get('auth-ping', 'AuthedUsers#ping')
  r.get('api-ping', 'Api/Users#ping')
  r.post('cast-param-test', 'ParamsTest#testCastParam')
  r.get('users/howyadoin', 'Users#howyadoin')
  r.resources('users', { only: ['show', 'create', 'index', 'destroy'] })

  // hooks tests
  r.get('users-before-all-test', 'Users#beforeAllTest')
  r.post('failed-to-save-test', 'Users#failedToSaveTest')
  r.post('force-throw', 'Users#forceThrow')
  r.get('conflict', 'Errors#throwConflict')
  r.get('not-found', 'Errors#throwNotFound')

  r.namespace('api', r => {
    r.get('ping', 'Users#ping')
    r.namespace('v1', r => {
      r.get('ping', 'Users#ping')
      r.resources('users', { only: ['index'] })
    })
    r.resources('users', r => {
      r.resources('pets')
    })
  })

  r.scope('scoped-things', r => {
    r.get('testing-scopes', 'ScopeTest#scopeTest')
  })

  r.post('login', 'Users#login')
  r.resources('users', { only: ['create', 'index'] }, r => {
    r.get('hello', 'Users#hello')
    r.post('', 'Users#doathing')
  })

  r.resource('greeter', { only: ['show'] }, r => {
    r.get('hello', 'Greeter#hello')
    r.get('justforspecs', 'Greeter#justforspecs')
  })

  r.get('route-exists-but-controller-doesnt', 'Nonexistent#someMethod')
  r.get('controller-exists-but-method-doesnt', 'Users#thisRouteDoesntExist')
}
