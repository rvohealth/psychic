import { UpdateableProperties } from '@rvoh/dream/types'
import SimpleSerializerModel from '../../src/app/models/SimpleSerializerModel.js'

let counter = 0

export default async function createSimpleSerializerModel(
  attrs: UpdateableProperties<SimpleSerializerModel> = {},
) {
  return await SimpleSerializerModel.create({
    name: `SimpleSerializerModel name ${++counter}`,
    ...attrs,
  })
}
