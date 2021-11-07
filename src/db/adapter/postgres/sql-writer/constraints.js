export default class Constraints {
  static constraints = {
    array: [],
  }

  constructor(column) {
    this.column = column
    this.constraints = []
  }

  build() {
    const { column } = this
    if (!column) return ''

    let str = ''
    if (column.array) str += ' []'
    if (column.nullable == false) str += ' NOT NULL'
    if (column.primary) str += ' PRIMARY KEY'
    if (column.primary || column.unique) str += ' UNIQUE'
    // if (column.type === 'uuid' && !column.default) column.default = 'uuid_generate_v4()'
    if (column.default) str += ` DEFAULT '${column.default}'`
    return str
  }
}
