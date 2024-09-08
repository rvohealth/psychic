import { PsychicRouter } from '@rvohealth/psychic'

export default (r: PsychicRouter) => {
  r.namespace('api', r => {
    r.resources('posts')
  })

}
