import { ObjectSerializer } from '@rvoh/dream'
import User from '../../models/User.js'
import WorldSerializer from './WorldSerializer.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (data: { world: any; user: User }) =>
  ObjectSerializer(data)
    .rendersOne('world', { serializer: WorldSerializer })
    .rendersOne('user', { dreamClass: User })
