import PsychicRouter from '../../src/router'

export default (r: PsychicRouter) => {
  r.get('ping', 'Users#ping')
  r.post('ping', 'Users#ping')
  r.put('ping', 'Users#ping')
  r.patch('ping', 'Users#ping')
  r.delete('ping', 'Users#ping')
  r.get('auth-ping', 'Users#authPing')
  r.get('api-ping', 'Api/Users#ping')

  // hooks tests
  r.get('users-before-all-test', 'Users#beforeAllTest')
  r.post('failed-to-save-test', 'Users#failedToSaveTest')

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
  r.resources('users', { only: ['create', 'index'] })

  r.get('route-exists-but-controller-doesnt', 'Nonexistent#someMethod')
  r.get('controller-exists-but-method-doesnt', 'Users#thisRouteDoesntExist')
}
