import { Dream, DreamSerializer } from '@rvohealth/dream'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
import { HttpMethod } from '../router/types'

export default class OpenapiRenderer<DreamOrSerializer extends typeof Dream | typeof DreamSerializer> {
  private path: OpenapiRendererOpts<DreamOrSerializer>['path']
  private method: OpenapiRendererOpts<DreamOrSerializer>['method']
  private status: OpenapiRendererOpts<DreamOrSerializer>['status']
  private serializerKey: OpenapiRendererOpts<DreamOrSerializer>['serializerKey']
  private params: OpenapiRendererOpts<DreamOrSerializer>['params']
  private headers: OpenapiRendererOpts<DreamOrSerializer>['headers']

  constructor(
    private modelOrSerializerCb: () => DreamOrSerializer,
    { path, method, status, serializerKey, params, headers }: OpenapiRendererOpts<DreamOrSerializer>,
  ) {
    this.path = path
    this.method = method
    this.status = status
    this.serializerKey = serializerKey
    this.params = params
    this.headers = headers
  }

  public toObject(): OpenapiEndpointResponse {
    // const serializerClass = this.getSerializerClass()
    // console.log('schema object', this.schemaObject(), this.path, this.method)

    return {
      [this.path]: {
        parameters: [...(this.headersArray() as any[]), ...(this.paramsArray() as any[])],
        [this.method]: {
          tags: [],
          summary: '',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: this.schemaObject(),
                },
              },
            },
          },
        },
      },
      // }
    } as unknown as OpenapiEndpointResponse
  }

  private headersArray(): OpenapiParameterResponse[] {
    return (
      this.headers?.map(header => ({
        in: 'header',
        ...header,
        description: header.description || '',
        schema: {
          type: 'string',
        },
      })) || []
    )
  }

  private paramsArray(): OpenapiParameterResponse[] {
    return (
      this.params?.map(param => {
        const schema = this.recursiveRenderAsToObject(param.type as SerializableTypes)
        return {
          in: param.in,
          name: param.name,
          required: param.required,
          description: param.description || '',
          schema,
        }
      }) || []
    )
  }

  private schemaObject(): OpenapiSchemaBody {
    const serializerClass = this.getSerializerClass()

    let obj: any = {}
    for (const attributeStatement of serializerClass['attributeStatements']) {
      obj = {
        ...obj,
        ...this.renderAsToObject(attributeStatement),
      }
    }

    return obj
  }

  private renderAsToObject(attributeStatement: AttributeStatement) {
    if (typeof attributeStatement.renderAs === 'object') {
      return {
        [attributeStatement.field]: this.recursiveRenderAsToObject(attributeStatement.renderAs),
      }
    } else {
      return {
        [attributeStatement.field]: {
          type: attributeStatement.renderAs,
        },
      }
    }
  }

  private recursiveRenderAsToObject(data: SerializableTypes | undefined): any {
    if (data === undefined) {
      return { type: 'any' }
    }

    if (typeof data === 'object') {
      const nestedData: any = {
        type: 'object',
        properties: {},
      }

      for (const key of Object.keys(data)) {
        nestedData.properties[key] = this.recursiveRenderAsToObject(data[key])
      }

      return nestedData
    }

    switch (data) {
      default:
        return {
          type: data,
        }
    }
  }

  private getSerializerClass(): typeof DreamSerializer {
    const modelOrSerializer = this.modelOrSerializerCb()

    if ((modelOrSerializer as typeof Dream).isDream) {
      const modelClass = modelOrSerializer as typeof Dream
      return modelClass.prototype.serializers[
        (this.serializerKey || 'default') as keyof typeof modelClass.prototype.serializers
      ]
    } else {
      return modelOrSerializer as typeof DreamSerializer
    }
  }
}

export interface OpenapiRendererOpts<T extends typeof Dream | typeof DreamSerializer> {
  path: string
  method: HttpMethod
  status: number
  serializerKey?: T extends typeof Dream
    ? keyof InstanceType<T>['serializers' & keyof InstanceType<T>]
    : undefined
  params?: OpenapiParamOption[]
  headers?: OpenapiHeaderOption[]
}

export interface OpenapiHeaderOption {
  name: string
  required: boolean
  description?: string
}

export interface OpenapiParamOption {
  in: Exclude<OpenapiHeaderType, 'header'>
  name: string
  required: boolean
  description?: string
  type: OpenapiTypeField
}

export type OpenapiEndpointResponse = {
  [path: string]: {
    [method in HttpMethod]: OpenapiMethodBody
  } & {
    parameters: OpenapiParameterResponse[]
  }
}

export interface OpenapiParameterResponse {
  in: OpenapiHeaderType
  name: string
  required: boolean
  description: string
  schema: {
    type: 'string' | { type: 'object'; properties: OpenapiSchemaBody }
  }
}

export type OpenapiHeaderType = 'header' | 'body' | 'path'

export type OpenapiMethodResponse = {
  [method in HttpMethod]: OpenapiMethodBody
}

export interface OpenapiMethodBody {
  tags: string[]
  summary: string
  requestBody: {
    content: {
      [format in OpenapiFormats]: {
        schema: {
          type: OpenapiPrimitiveTypes
          properties?: OpenapiSchemaBody
        }
      }
    }
  }
}

export interface OpenapiSchemaBody {
  [key: string]: {
    type: OpenapiPrimitiveTypes
    properties: OpenapiSchemaBody
  }
}

export type OpenapiPrimitiveTypes = 'string' | 'boolean' | 'number' | 'object'
export type OpenapiTypeField = Exclude<OpenapiPrimitiveTypes, 'object'> | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: Exclude<OpenapiPrimitiveTypes, 'object'> | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
