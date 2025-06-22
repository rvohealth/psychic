import { PsychicRouter } from '@rvoh/psychic'

export default (r: PsychicRouter) => {
  r.resources('posts', { only: ['create', 'show'] })

}
