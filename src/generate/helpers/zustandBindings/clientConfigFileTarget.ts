import { FileWriteTarget } from '../../../cli/helpers/applyConfirmedWriteSet.js'

/**
 * Computes the @hey-api/openapi-ts client config write target. This is a
 * user-customizable scaffold (baseUrl, auth headers, etc.), so overwriting an
 * existing, edited copy must go through the overwrite confirmation.
 */
export default function clientConfigFileTarget({
  clientConfigFile,
}: {
  clientConfigFile: string
}): FileWriteTarget {
  const contents = `\
import { client } from './client.gen'

function baseUrl() {
  // add custom code here for determining your application's baseUrl
  // this would generally be something different, depending on if you
  // are in dev/test/production environments. For dev, you might want
  // http://localhost:7777, while test may be http://localhost:7778, or
  // some other port, depending on how you have your spec hooks configured.
  // for production, it should be the real host for your application, i.e.
  // https://myapi.com

  return 'http://localhost:7777'
}

client.setConfig({
  baseUrl: baseUrl(),
  credentials: 'include',

  // you can customize headers here, for example to add auth tokens:
  // headers: {
  //   Authorization: \`Bearer \${getToken()}\`,
  // },
})`

  return { filePath: clientConfigFile, contents }
}
