import { ObjectSerializer } from '@rvoh/dream'
import HelloSerializer from './HelloSerializer.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (data: { hello: any }) =>
  ObjectSerializer(data).rendersOne('hello', { serializerCallback: () => HelloSerializer })
