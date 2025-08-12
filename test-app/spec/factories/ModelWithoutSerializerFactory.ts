import { UpdateableProperties } from '@rvoh/dream'
import ModelWithoutSerializer from '../../src/app/models/ModelWithoutSerializer.js'

let counter = 0

export default async function createModelWithoutSerializer(
  attrs: UpdateableProperties<ModelWithoutSerializer> = {},
) {
  return await ModelWithoutSerializer.create({
    name: `ModelWithoutSerializer name ${++counter}`,
    ...attrs,
  })
}
