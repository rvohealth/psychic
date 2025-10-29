import { DreamApp } from '@rvoh/dream'
import { getControllersOrFail } from './import/importControllers.js'
import { getServicesOrFail } from './import/importServices.js'

export default function lookupClassByGlobalName(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lookup = DreamApp.lookupClassByGlobalName(name)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  if (lookup) return lookup

  const combinedObj = {
    ...getControllersOrFail(),
    ...getServicesOrFail(),
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return combinedObj[name] || null
}
