import { DreamApp } from '@rvoh/dream'
import { CliFileWriter } from '@rvoh/dream/system'
import * as path from 'node:path'
import PsychicApp from '../../psychic-app/index.js'

export default class TypesBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async sync(customTypes: any = undefined) {
    const dreamApp = DreamApp.getOrFail()
    const schemaPath = path.join(dreamApp.projectRoot, dreamApp.paths.types, 'psychic.ts')

    await CliFileWriter.write(schemaPath, this.build(customTypes))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static build(customTypes: any = undefined) {
    const psychicApp = PsychicApp.getOrFail()

    const output = {
      openapiNames: Object.keys(psychicApp.openapi),
      ...(customTypes || {}),
    } as PsychicTypeSync

    return `const psychicTypes = ${JSON.stringify(output, null, 2)} as const

export default psychicTypes`
  }
}

export interface PsychicTypeSync {
  openapiNames: string[]
}
