import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveBaseTypes,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream'
import isObject from '../../helpers/isObject.js'
import isOpenapiShorthand from './isOpenapiShorthand.js'
import maybeNullOpenapiShorthandToOpenapiShorthand from './maybeNullOpenapiShorthandToOpenapiShorthand.js'

export interface OpenapiShorthandToOpenapiOptions {
  maybeNull?: boolean
  format?: string | undefined
}

export default function openapiShorthandToOpenapi(
  openapi: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined,
  options: OpenapiShorthandToOpenapiOptions = {},
): OpenapiSchemaBody {
  if (isOpenapiShorthand(openapi)) {
    return _openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes, options)
  } else if (isObject(openapi)) {
    return openapi as OpenapiSchemaBody
  } else {
    throw new UnrecognizedOpenapiShape(openapi)
  }
}

function _openapiShorthandToOpenapi(
  shorthand: OpenapiShorthandPrimitiveTypes,
  options: OpenapiShorthandToOpenapiOptions,
): OpenapiSchemaBody {
  const shorthandString = maybeNullOpenapiShorthandToOpenapiShorthand(shorthand)
  if (!shorthandString) return { type: 'null' }
  const openapi = simpleOpenapiShorthandToOpenapi(shorthandString, options)

  if (options.maybeNull || openapiShorthandIncludesNull(shorthand)) {
    return { ...openapi, type: [openapi.type, 'null'] } as OpenapiSchemaBody
  }

  return openapi as OpenapiSchemaBody
}

function simpleOpenapiShorthandToOpenapi(
  shorthand: OpenapiShorthandPrimitiveBaseTypes,
  options: OpenapiShorthandToOpenapiOptions,
) {
  switch (shorthand) {
    case 'string':
      return options.format ? { type: 'string', format: options.format } : { type: 'string' }
    case 'boolean':
      return { type: 'boolean' }
    case 'number':
      return { type: 'number' }
    case 'date':
      return { type: 'string', format: 'date' }
    case 'date-time':
      return { type: 'string', format: 'date-time' }
    case 'decimal':
      return { type: 'number', format: 'decimal' }
    case 'integer':
      return { type: 'integer' }
    case 'null':
      return { type: 'null' }
    case 'string[]':
      return {
        type: 'array',
        items: options.format ? { type: 'string', format: options.format } : { type: 'string' },
      }
    case 'boolean[]':
      return { type: 'array', items: { type: 'boolean' } }
    case 'number[]':
      return { type: 'array', items: { type: 'number' } }
    case 'date[]':
      return { type: 'array', items: { type: 'string', format: 'date' } }
    case 'date-time[]':
      return { type: 'array', items: { type: 'string', format: 'date-time' } }
    case 'decimal[]':
      return { type: 'array', items: { type: 'number', format: 'decimal' } }
    case 'integer[]':
      return { type: 'array', items: { type: 'integer' } }
    case 'json':
      return { type: 'object' }

    default: {
      // protection so that if a new OpenapiShorthandPrimitiveBaseTypes is ever added, this will throw a type error at build time
      const _never: never = shorthand
      throw new UnrecognizedOpenapiShorthand(_never as string)
    }
  }
}

function openapiShorthandIncludesNull(openapi: OpenapiShorthandPrimitiveTypes): boolean {
  if (openapi === undefined) return false
  if (typeof openapi === 'string') return false
  if (!Array.isArray(openapi)) return false
  if (openapi.length !== 2) return false
  if (openapi[1] === 'null') return true
  if (openapi[0] === 'null') return true
  return false
}

export class UnrecognizedOpenapiShorthand extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private shorthand: any) {
    super()
  }

  public override get message() {
    return `Unrecognized OpenAPI shorthand: ${JSON.stringify(this.shorthand)}`
  }
}

export class UnrecognizedOpenapiShape extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private openapi: any) {
    super()
  }

  public override get message() {
    return `Unrecognized OpenAPI shape:
${JSON.stringify(this.openapi)}`
  }
}
