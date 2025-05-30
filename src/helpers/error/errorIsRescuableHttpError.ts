import { rescuableHttpErrorClasses } from './httpErrorClasses.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function errorIsRescuableHttpError(err: any) {
  return !!rescuableHttpErrorClasses().find(klass => err instanceof klass)
}
