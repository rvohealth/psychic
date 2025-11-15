import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.resources('tickets', r => {
    r.resources('comments')
  })

}
