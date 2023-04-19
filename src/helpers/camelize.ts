import uncapitalize from './uncapitalize'

const camelize = (str: string) =>
  uncapitalize(str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', '')))

export default camelize
