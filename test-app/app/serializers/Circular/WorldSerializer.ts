import { DreamSerializer, RendersOne } from '@rvohealth/dream'
import { HelloSerializer } from './HelloSerializer'

export default class WorldSerializer extends DreamSerializer {
  @RendersOne(() => HelloSerializer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public hello: any
}
