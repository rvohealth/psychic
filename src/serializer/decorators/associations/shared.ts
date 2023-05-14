import PsychicSerializer from '../..'

export type SerializableTypes = 'date'
export type PsychicSerializerClassCB = () => typeof PsychicSerializer
export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface AssociationStatement {
  field: string
  serializerClassCB: PsychicSerializerClassCB
  type: SerializableAssociationType
}
