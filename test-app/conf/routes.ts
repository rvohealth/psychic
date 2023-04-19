import PsychicRouter from '../../src/router'

export default (r: PsychicRouter) => {
  r.get('ping', 'users#ping')
  r.post('ping', 'users#ping')
  r.put('ping', 'users#ping')
  r.patch('ping', 'users#ping')
  r.delete('ping', 'users#ping')
  r.get('auth-ping', 'users#authPing')
  r.get('api-ping', 'api/users#ping')

  r.namespace('api', r => {
    r.get('ping', 'users#ping')
    r.namespace('v1', r => {
      r.get('ping', 'users#ping')
    })
  })

  r.post('login', 'users#login')
  r.resources('users', { only: ['create', 'index'] })

  r.get('route-exists-but-controller-doesnt', 'nonexistent-controller#someMethod')
  r.get('controller-exists-but-method-doesnt', 'users#thisRouteDoesntExist')
}
