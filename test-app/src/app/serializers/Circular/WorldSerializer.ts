import { DreamSerializer, RendersOne } from '@rvoh/dream'
import { HelloSerializer } from './HelloSerializer.js'

export default class WorldSerializer extends DreamSerializer {
  @RendersOne(() => HelloSerializer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public hello: any
}
