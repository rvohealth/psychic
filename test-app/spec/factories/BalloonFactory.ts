import { UpdateableProperties } from '@rvoh/dream'
import Balloon from '../../src/app/models/Balloon.js'

export default async function createBalloon(attrs: UpdateableProperties<Balloon> = {}) {
  return await Balloon.create({
    color: 'red',
    ...attrs,
  })
}
