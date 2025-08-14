import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.namespace('api', r => {
    r.namespace('v1', r => {
      r.resources('comments')

      r.resources('posts')
    })
  })

}
