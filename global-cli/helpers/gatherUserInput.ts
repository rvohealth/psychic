import argAndValue from './argAndValue'
import Select from './select'

export interface NewAppCLIOptions {
  apiOnly: boolean
  redis: boolean
  ws: boolean
  primaryKeyType: 'uuid' | 'integer' | 'bigint' | 'bigserial'
  client: FrontEndClientType
}

export const primaryKeyTypes = ['bigserial', 'bigint', 'integer', 'uuid'] as const
export const clientTypes = ['react', 'vue', 'nuxt', 'none (api only)', 'none'] as const

export type FrontEndClientType = 'react' | 'vue' | 'nuxt' | null

async function redisQuestion(args: string[], options: NewAppCLIOptions) {
  const [redisArg, value] = argAndValue('--redis', args)
  if (redisArg) {
    options.redis = value === 'true' || value === null
    return
  }

  const answer = await new Select('redis?', ['yes', 'no'] as const).run()
  options.redis = answer === 'yes'
  console.log('')
}

async function wsQuestion(args: string[], options: NewAppCLIOptions) {
  const [wsArg, value] = argAndValue('--ws', args)
  if (wsArg) {
    options.ws = value === 'true' || value === null
    return
  }

  const answer = await new Select('websockets?', ['yes', 'no'] as const).run()
  options.ws = answer === 'yes'
}

async function clientQuestion(args: string[], options: NewAppCLIOptions) {
  const [clientArg, value] = argAndValue('--client', args)
  if (clientArg && clientTypes.includes(value! as (typeof clientTypes)[number])) {
    if (value === 'none') options.apiOnly = true
    else options.client = value as FrontEndClientType
    return
  }

  if (options.apiOnly) return

  const answer = await new Select('which front end client would you like to use?', clientTypes).run()

  if (answer === 'none (api only)') {
    options.apiOnly = true
  } else {
    options.client = answer as FrontEndClientType
  }
}

async function primaryKeyTypeQuestion(args: string[], options: NewAppCLIOptions) {
  const [primaryKeyArg, value] = argAndValue('--primaryKey', args)
  if (primaryKeyArg && primaryKeyTypes.includes(value! as (typeof primaryKeyTypes)[number])) {
    options.primaryKeyType = value as (typeof primaryKeyTypes)[number]
    return
  }

  const answer = await new Select('what primary key type would you like to use?', primaryKeyTypes).run()
  options.primaryKeyType = answer
}

export default async function gatherUserInput(args: string[]) {
  const options: NewAppCLIOptions = {
    apiOnly: false,
    redis: false,
    ws: false,
    primaryKeyType: 'bigserial',
    client: null,
  }

  await redisQuestion(args, options)
  await wsQuestion(args, options)
  await clientQuestion(args, options)
  await primaryKeyTypeQuestion(args, options)

  return options
}
