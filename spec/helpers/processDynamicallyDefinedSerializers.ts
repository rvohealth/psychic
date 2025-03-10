import { DreamSerializer } from '@rvohealth/dream'

export default function processDynamicallyDefinedSerializers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...serializerClasses: (typeof DreamSerializer<any, any>)[]
) {
  DreamSerializer['globallyInitializingDecorators'] = true
  serializerClasses.forEach(serializerClass => {
    new serializerClass({})
  })
  DreamSerializer['globallyInitializingDecorators'] = false
}
