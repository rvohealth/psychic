const snakeToCamel = (str) => str
  .replace(
    /([-_ ][a-z])/g,
    (group) => (
      group
        .toUpperCase()
        .replace(/\s*/g, '')
        .replace('-', '')
        .replace('_', '')
    )
  )
  .uncapitalize()

export default snakeToCamel
