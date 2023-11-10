import * as bodyParser from 'body-parser'

export default async () => {
  return {
    limit: '20mb',
  } as bodyParser.OptionsJson
}
