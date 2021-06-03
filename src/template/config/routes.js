export default r => {
  r.namespace('api', () => {
    r.namespace('v1', () => {
      r.resource('black-cats')
      r.get('hamburgers', 'black-cats#hamburgers')
    })
  })
}
