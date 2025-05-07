import { UpdateableProperties } from '@rvoh/dream'
import BalloonLatex from '../../../src/app/models/Balloon/Latex.js'

export default async function createBalloonLatex(attrs: UpdateableProperties<BalloonLatex> = {}) {
  return await BalloonLatex.create({
    ...attrs,
  })
}
