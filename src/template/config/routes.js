export default r => {
  r.namespace('api', () => {
    r.namespace('v1', () => {
      r.resource('black-cats', { only: ['show', 'index'] })
      r.resource('users', { only: ['create'] }, () => {
        r.auth('currentUser')
      })

      r.given('auth:currentUser', () => {
        r.get('hamburgers', 'black-cats#hamburgers')
      })
    })
  })
}
