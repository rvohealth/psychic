import PsychicSerializer from '..'

export default function Delegate(delegateTo: string): any {
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof PsychicSerializer = target.constructor
    if (!Object.getOwnPropertyDescriptor(serializerClass, 'delegateStatements'))
      serializerClass.delegateStatements = [] as DelegateStatement[]

    serializerClass.delegateStatements = [
      ...serializerClass.delegateStatements,
      {
        field: key,
        delegateTo,
      } as DelegateStatement,
    ]
  }
}

export interface DelegateStatement {
  field: string
  delegateTo: string
}
