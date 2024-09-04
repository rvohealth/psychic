import { specRequest } from '@rvohealth/psychic-spec-helpers'
import User from '../../../src/app/models/User'

export function addEndUserAuthHeader(request: typeof specRequest, user: User, headers: object) {
  // Update this function to either modify headers (e.g. with an Authorization header)
  // or to apply a cookie to the request
  return { ...headers }
}
