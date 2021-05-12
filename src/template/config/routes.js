export default r => {
  r.namespace('api', api => {
    api.namespace('v1', v1 => {
      v1.resource('black-cats')
      v1.get('hamburgers', 'black-cats#hamburgers')
    })
  })
}
