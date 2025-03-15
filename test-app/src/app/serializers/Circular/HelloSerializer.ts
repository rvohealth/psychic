import { DreamSerializer, RendersOne } from '@rvoh/dream'
import User from '../../models/User.js'
import WorldSerializer from './WorldSerializer.js'

export class HelloSerializer extends DreamSerializer {
  @RendersOne(() => WorldSerializer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public world: any

  @RendersOne(User, { flatten: true })
  public user: User
}
