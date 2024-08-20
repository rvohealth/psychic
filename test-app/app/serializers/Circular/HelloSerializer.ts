import { DreamSerializer, RendersOne } from '@rvohealth/dream'
import WorldSerializer from './WorldSerializer'

export class HelloSerializer extends DreamSerializer {
  @RendersOne(() => WorldSerializer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public world: any
}
