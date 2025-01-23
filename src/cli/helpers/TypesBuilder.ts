import { DreamApplication } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import background from '../../background'
import PsychicApplication from '../../psychic-application'

export default class TypesBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async sync(customTypes: any = undefined) {
    const dreamApp = DreamApplication.getOrFail()
    const schemaPath = path.join(dreamApp.projectRoot, dreamApp.paths.types, 'psychic.ts')

    await fs.writeFile(schemaPath, this.build(customTypes))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static build(customTypes: any = undefined) {
    background.connect()

    const psychicApp = PsychicApplication.getOrFail()

    const output = {
      workstreamNames: [...background['workstreamNames']],
      queueGroupMap: { ...background['groupNames'] },
      openapiNames: Object.keys(psychicApp.openapi),
      ...(customTypes || {}),
    } as PsychicTypeSync

    return `const psychicTypes = ${JSON.stringify(output, null, 2)} as const

export default psychicTypes`
  }
}

export interface PsychicTypeSync {
  workstreamNames: string[]
  queueGroupMap: Record<string, string[]>
  openapiNames: string[]
}
