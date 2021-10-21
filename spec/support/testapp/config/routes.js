export default r => {
  r.get('testget', 'tests#testget')
  r.post('testpost', 'tests#testpost')
  r.put('testput', 'tests#testput')
  r.patch('testpatch', 'tests#testpatch')
  r.delete('testdelete', 'tests#testdelete')
  r.resource('test_users')
  r.namespace('testapi', () => {
    r.namespace('v1', () => {
      r.get('namespacetest', 'tests#namespacetest')
    })
  })
}
