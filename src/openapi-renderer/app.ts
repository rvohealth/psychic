import { uniq } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import PsychicController from '../controller'
import { envBool } from '../helpers/envValue'
import openapiJsonPath from '../helpers/openapiJsonPath'
import PsychicApplication from '../psychic-application'
import { HttpMethod, HttpMethods } from '../router/types'
import { DEFAULT_OPENAPI_COMPONENT_RESPONSES, DEFAULT_OPENAPI_COMPONENT_SCHEMAS } from './defaults'
import { OpenapiSchema } from './endpoint'

export default class OpenapiAppRenderer {
  /**
   * @internal
   *
   * reads the lates openapi builds using buildOpenapiObject, and syncs
   * the contents to the openapi.json file at the project root.
   */
  public static async sync() {
    const openapiContents = await OpenapiAppRenderer.toObject()
    const jsonPath = openapiJsonPath()
    await fs.writeFile(jsonPath, JSON.stringify(openapiContents, null, 2), {
      flag: 'w+',
    })
  }

  /**
   * @internal
   *
   * builds a new typescript object which contains the combined
   * payloads of all `@Openapi` decorator calls used throughout
   * the controller layer.
   */
  public static async toObject(): Promise<OpenapiSchema> {
    const processedSchemas: Record<string, boolean> = {}
    const psychicApp = PsychicApplication.getOrFail()
    const controllers = psychicApp.controllers
    const packageJsonPath = path.join(psychicApp.apiRoot, 'package.json')

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const packageJson = (await import(packageJsonPath)).default as {
      version: string
      name: string
      description?: string
    }

    const finalOutput: OpenapiSchema = {
      openapi: '3.0.2',
      info: {
        version: packageJson.version,
        title: packageJson.name,
        description: packageJson.description || 'The autogenerated openapi spec for your app',
      },
      paths: {},
      components: {
        ...(psychicApp.openapi?.defaults?.components || {}),
        schemas: {
          ...DEFAULT_OPENAPI_COMPONENT_SCHEMAS,
          ...((psychicApp.openapi?.defaults?.components?.schemas ||
            {}) as typeof DEFAULT_OPENAPI_COMPONENT_SCHEMAS),
        },
        responses: {
          ...DEFAULT_OPENAPI_COMPONENT_RESPONSES,
          ...(psychicApp.openapi?.defaults?.components?.responses || {}),
        },
      },
    }

    for (const controllerName of Object.keys(controllers)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const controller = controllers[controllerName] as typeof PsychicController

      for (const key of Object.keys(controller.openapi || {})) {
        if (envBool('DEBUG')) console.log(`Processing OpenAPI key ${key} for controller ${controllerName}`)

        const renderer = controller.openapi[key]

        finalOutput.components.schemas = {
          ...finalOutput.components.schemas,
          ...renderer.toSchemaObject(processedSchemas),
        }

        const endpointPayload = await renderer.toPathObject(processedSchemas)

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const path = Object.keys(endpointPayload)[0]!

        const method = Object.keys(endpointPayload[path]).find(key =>
          HttpMethods.includes(key as HttpMethod),
        )!

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(finalOutput.paths as any)[path] ||= {
          parameters: [],
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        const pathObj = (finalOutput.paths as any)[path]

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        pathObj[method] = (endpointPayload as any)[path][method]

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        pathObj.parameters = uniq(
          [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            ...(pathObj.parameters || []),

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            ...((endpointPayload as any)[path]?.['parameters'] || []),
          ],

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (a, b) => a.name === b.name,
        )
      }
    }

    return this.sortedSchemaPayload(finalOutput)
  }

  private static sortedSchemaPayload(schema: OpenapiSchema) {
    const sortedPaths = Object.keys(schema.paths).sort()
    const sortedSchemas = Object.keys(schema.components.schemas).sort()

    const sortedSchema: typeof schema = { ...schema }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortedSchema.paths = sortedPaths.reduce((agg, path) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      agg[path] = schema.paths[path]

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return agg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortedSchema.components.schemas = sortedSchemas.reduce((agg, key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      agg[key] = schema.components.schemas[key]

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return agg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any)

    return sortedSchema
  }
}
