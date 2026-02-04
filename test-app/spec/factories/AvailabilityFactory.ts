import { UpdateableProperties } from '@rvoh/dream/types'
import Availability from '@models/Availability.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createAvailability(attrs: UpdateableProperties<Availability> = {}) {
  return await Availability.create({
    user: attrs.user ? null : await createUser(),
    ...attrs,
  })
}
