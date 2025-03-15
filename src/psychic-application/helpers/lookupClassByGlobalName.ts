import { lookupClassByGlobalName as dreamLookupClassByGlobalName } from '@rvoh/dream'
import { getControllersOrFail } from './import/importControllers.js'

export default function lookupClassByGlobalName(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lookup = dreamLookupClassByGlobalName(name)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  if (lookup) return lookup

  const combinedObj = {
    ...getControllersOrFail(),
  }

  return combinedObj[name] || null
}
