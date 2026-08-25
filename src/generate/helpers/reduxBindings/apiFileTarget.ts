import { FileWriteTarget } from '../../../cli/helpers/applyConfirmedWriteSet.js'

/**
 * Computes the RTK Query base api file write target. This is a user-customizable
 * scaffold (baseUrl, auth headers, etc.), so overwriting an existing, edited
 * copy must go through the overwrite confirmation.
 */
export default function apiFileTarget({
  apiFile,
  apiImport,
}: {
  apiFile: string
  apiImport: string
}): FileWriteTarget {
  const contents = `\
// Or from '@reduxjs/toolkit/query' if not using the auto-generated hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// import { RootState } from '../store' // update this to the correct path to your app's store

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

// initialize an empty api service that we'll inject endpoints into later as needed
export const ${apiImport} = createApi({
  // forces cache to bust any time a component is mounted
  refetchOnMountOrArgChange: true,
  keepUnusedDataFor: 0,

  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl(),
    credentials: 'include',

    // we recommend that you use a function like this for preparing
    // headers, so that you can make sure any necessary auth tokens
    // used by your app can be applied to the headers when any requests
    // are made to your backend api.
    // prepareHeaders: (headers, { getState }) => {
    //   return new Promise(resolve => {
    //     function checkToken() {
    //       const token = (getState() as RootState).app.authToken
    //       if (token) {
    //         headers.set('Authorization', \`Bearer \${token}\`)
    //         resolve(headers)
    //       } else {
    //         setTimeout(checkToken, 500) // try again in 500ms
    //       }
    //     }
    //     checkToken()
    //   })
    // },
  }),
  endpoints: () => ({}),
})`

  return { filePath: apiFile, contents }
}
