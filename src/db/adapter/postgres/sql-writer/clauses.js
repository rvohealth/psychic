export default class Clauses {
  static selectClause(
    statement,
    {
      fetch,
      from,
      group,
      join,
      limit,
      offset,
      order,
      having,
      where,
    })
  {
    return statement +
      // this._joinSelects(join) + // leaving this in in case we need it later
      this.#fromClause(from) +
      // this._joinFroms(join) + // leaving this in in case we need it later
      this.#joinsClause(join) +
      this.whereClause(where) +
      this.#groupClause(group) +
      this.#havingClause(having) +
      this.#orderClause(order) +
      this.#limitClause(limit) +
      this.#offsetClause(offset) +
      this.#fetchClause(fetch)
  }

  static updateClause(statement, { group, having, limit, offset, order, returning, where }) {
    return statement +
      this.whereClause(where) +
      this.#groupClause(group) +
      this.#havingClause(having) +
      this.#orderClause(order) +
      this.#limitClause(limit) +
      this.#offsetClause(offset) +
      this.#returningClause(returning)
  }

  static whereClause(where) {
    if (!where || !Object.keys(where).length) return ''
    return `\nWHERE ${Object.keys(where).map(attribute => `${attribute}='${where[attribute]}`).join('AND ')}'`
  }

  static #fetchClause(_fetch) {
    if (!_fetch) return ''
    return `\nFETCH FIRST ${_fetch} ${_fetch > 1 ? 'ROWS' : 'ROW'} ONLY`
  }

  static #fromClause(from) {
    if (!from) return ''
    return `\nFROM ${from}`
  }

  static #groupClause(group) {
    if (!group) return ''
    return `\nGROUP BY ${group.join(', ')}`
  }

  static #havingClause(having) {
    if (!having) return ''
    return `\nHAVING ${having}`
  }

  static #joinsClause(joins) {
    if (!joins) return ''
    if (!Array.isArray(joins)) throw `invalid type ${typeof joins} passed for arg: joins`

    return joins.reduce((agg, join) => {
      agg += `\n${(join.type || 'inner').toUpperCase()} JOIN ${join.table}`

      // const data = this._interpretJoinOn(join.on)
      if (join.on) {
        agg += `\nON ${join.on}` // originally was this simple, not sure added complexity will benefit us...
        // agg += `\nON ${data.left.table}.${data.left.column}=` + (data.right.column ? `${data.right.table}.${data.right.column}` : `${data.right.table}`)
      }

      return agg
    }, '')
  }

  static #limitClause(limit) {
    if (!limit) return ''
    return `\nLIMIT ${limit}`
  }

  static #offsetClause(offset) {
    if (!offset) return ''
    return `\nOFFSET ${offset}`
  }

  static #orderClause(order) {
    if (!order || !(Array.isArray(order) && order.length)) return ''
    return `\nORDER BY ${
      order
        .map(o => {
          if (typeof o === 'string') return o
          if (Array.isArray(o) && o.length === 1) return `${o[0]}`
          if (Array.isArray(o) && o.length === 2) return `${o[0]} ${o[1]}`
          if (typeof o === 'object') return `${o.col || o.column} ${o.dir || o.direction || 'asc'}`
        })
        .join(', ')
    }`
  }

  static #returningClause(returning) {
    if (!returning) return 'RETURNING *'
    return `\nRETURNING ${returning.join(', ')}`
  }

  // _joinFroms(joins) {
  //   if (!joins) return ''
  //   if (!Array.isArray(joins)) throw `invalid type ${joins.constructor.name} passed for arg: joins`

  //   const froms = []
  //   joins.forEach((join) => {
  //     if (join.on) {
  //       const data = this._interpretJoinOn(join.on)
  //       if (data.left.table && data.left.column)
  //         froms.push(data.left.table)

  //       if (data.right.table && data.right.column)
  //         froms.push(data.right.table)
  //     }
  //   })

  //   if (!froms.length) return ''
  //   return ', ' + froms.uniq().join(', ')
  // }

  // _joinSelects(joins) {
  //   if (!joins) return ''
  //   if (!Array.isArray(joins)) throw `invalid type ${joins.constructor.name} passed for arg: joins`

  //   const selects = []
  //   joins.forEach(join => {
  //     if (join.on) {
  //       const data = this._interpretJoinOn(join.on)
  //       if (data.left.table && data.left.column)
  //         selects.push(`${data.left.table}.${data.left.column} AS "${data.left.table}_${data.left.column}"`)

  //       if (data.right.table && data.right.column)
  //         selects.push(`${data.right.table}.${data.right.column} AS "${data.right.table}_${data.right.column}"`)
  //     }
  //   })

  //   if (!selects.length) return ''
  //   return ', ' + selects.uniq().join(', ')
  // }

  // _interpretJoinOn(joinOn) {
  //   const tableAndFields = joinOn.split(/\s{0,}=\s{0,}/)
  //   const left = tableAndFields[0]
  //   const right = tableAndFields[1]

  //   const leftParts = left.split('.')
  //   const leftTableName = leftParts[0]
  //   const leftColumn = leftParts[1]

  //   const rightParts = right.split('.')
  //   const rightTableName = rightParts[0]
  //   const rightColumn = rightParts[1]

  //   return {
  //     left: {
  //       table: leftTableName,
  //       column: leftColumn,
  //     },
  //     right: {
  //       table: rightTableName,
  //       column: rightColumn,
  //     }
  //   }
  // }
}
