import pascalize from './pascalize'
import uncapitalize from './uncapitalize'

const camelize = (str: string) => uncapitalize(pascalize(str))

export default camelize
