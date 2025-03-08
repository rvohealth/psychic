import { lookupClassByGlobalName as dreamLookupClassByGlobalName } from '@rvohealth/dream'
import { getControllersOrFail } from './processControllers.js'

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
