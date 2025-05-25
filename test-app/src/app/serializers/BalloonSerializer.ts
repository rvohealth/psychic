import { DreamSerializer } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'

export const BalloonSummarySerializer = (data: Balloon, passthrough: object) =>
  DreamSerializer(Balloon, data, passthrough).attribute('id')

export default (data: Balloon, passthrough: object) =>
  BalloonSummarySerializer(data, passthrough).attribute('color')
