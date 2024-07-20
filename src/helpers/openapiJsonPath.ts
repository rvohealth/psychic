import path from 'path'

export default function openapiJsonPath() {
  return path.join(process.env.APP_ROOT_PATH!, 'openapi.json')
}
