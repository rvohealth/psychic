import PsychicSerializer from '../..'
import { AssociationStatement, PsychicSerializerClassCB } from './shared'

export default function RendersMany(serializerClassCB: PsychicSerializerClassCB): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof PsychicSerializer = target.constructor

    if (!Object.getOwnPropertyDescriptor(serializerClass, 'associationStatements'))
      serializerClass.associationStatements = [] as AssociationStatement[]

    serializerClass.associationStatements = [
      ...serializerClass.associationStatements,
      {
        type: 'RendersMany',
        field: key,
        serializerClassCB,
      } as AssociationStatement,
    ]
  }
}
