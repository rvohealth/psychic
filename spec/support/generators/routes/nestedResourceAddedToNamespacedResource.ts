import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.namespace('api', r => {
    r.namespace('v1', r => {
      r.resources('tickets', r => {
        r.resources('comments')

      })

    })
  })

}
