import { PsychicRouter } from '@rvohealth/psychic'

export default (r: PsychicRouter) => {
  r.namespace('api', r => {
    r.namespace('v1', r => {
      r.resources('posts')
    })
  })

}
