import { UpdateableProperties } from '@rvoh/dream'
import BalloonMylar from '../../../src/app/models/Balloon/Mylar.js'

export default async function createBalloonMylar(attrs: UpdateableProperties<BalloonMylar> = {}) {
  return await BalloonMylar.create({
    ...attrs,
  })
}
