import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.resources('tickets', { only: [] }, r => {
    r.resources('comments')
  })

}
