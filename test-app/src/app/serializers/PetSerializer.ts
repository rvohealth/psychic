import { DreamSerializer } from '@rvoh/dream'
import Pet from '../models/Pet.js'

export const PetSummarySerializer = (data: Pet) =>
  DreamSerializer(Pet, data)
    .attribute('id')
    .customAttribute('customAttributeTest', () => data.customAttributeTest(), { openapi: { type: 'string' } })

export default (data: Pet) => PetSummarySerializer(data).attribute('name')

export const PetAdditionalSerializer = (data: Pet) =>
  PetSummarySerializer(data).customAttribute('nickname', () => `nick${data.name}`, { openapi: 'string' })

export const PetWithAssociationSerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

export const PetWithFlattenedAssociationSerializer = (data: Pet) =>
  DreamSerializer(Pet, data).rendersOne('user', { serializerKey: 'withFlattenedPost' })
