import { PsychicRouter } from '@rvohealth/psychic'

export default (r: PsychicRouter) => {
  r.get('ping', 'ping#ping')
}
