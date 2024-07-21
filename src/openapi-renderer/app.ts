import fs from 'fs/promises'
import PsychicController from '../controller'
import openapiJsonPath from '../helpers/openapiJsonPath'
import PsychicDir from '../helpers/psychicdir'
import { OpenapiSchema } from './body-segment'

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
    const controllers = await PsychicDir.controllers()

    const finalOutput: OpenapiSchema = {
      openapi: '3.0.2',
      paths: {},
      components: {
        schemas: {},
      },
    }

    for (const controllerName of Object.keys(controllers)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const controller = controllers[controllerName] as typeof PsychicController

      for (const key of Object.keys(controller.openapi || {})) {
        const renderer = controller.openapi[key]

        finalOutput.components.schemas = {
          ...finalOutput.components.schemas,
          ...(await renderer.toSchemaObject()),
        }

        const endpointPayload = await renderer.toObject()

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const path = Object.keys(endpointPayload)[0]!

        const method = Object.keys(endpointPayload[path]).find(key =>
          ['get', 'post', 'delete', 'patch', 'options'].includes(key),
        )!

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(finalOutput.paths as any)[path] ||= {
          parameters: [],
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        ;(finalOutput.paths as any)[path][method] = (endpointPayload as any)[path][method]
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
