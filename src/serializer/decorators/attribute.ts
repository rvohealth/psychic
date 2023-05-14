import PsychicSerializer from '..'

export default function Attribute(renderAs?: SerializableTypes): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof PsychicSerializer = target.constructor
    if (!Object.getOwnPropertyDescriptor(serializerClass, 'attributeStatements'))
      serializerClass.attributeStatements = [] as AttributeStatement[]

    serializerClass.attributeStatements = [
      ...serializerClass.attributeStatements,
      {
        field: key,
        functional: typeof def?.value === 'function',
        renderAs,
      } as AttributeStatement,
    ]
  }
}

export type SerializableTypes = 'date'

export interface AttributeStatement {
  field: string
  functional: boolean
  renderAs?: SerializableTypes
}
