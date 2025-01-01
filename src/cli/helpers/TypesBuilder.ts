import { DreamApplication } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import background from '../../background'
import PsychicApplication from '../../psychic-application'

export default class TypesBuilder {
  public static async sync() {
    const dreamApp = DreamApplication.getOrFail()
    const schemaPath = path.join(dreamApp.projectRoot, dreamApp.paths.types, 'psychic.ts')

    await fs.writeFile(schemaPath, this.build())
  }

  public static build() {
    background.connect()

    const psychicApp = PsychicApplication.getOrFail()

    const output: PsychicTypeSync = {
      workstreamNames: [...background['workstreamNames']],
      queueGroupMap: { ...background['groupNames'] },
      openapiNames: Object.keys(psychicApp.openapi),
    }

    return `const psychicTypes = ${JSON.stringify(output, null, 2)} as const

export default psychicTypes`
  }
}

export interface PsychicTypeSync {
  workstreamNames: string[]
  queueGroupMap: Record<string, string[]>
  openapiNames: string[]
}
