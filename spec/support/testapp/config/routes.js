export default r => {
  r.resource('test_users', { only: ['create'] })
}
