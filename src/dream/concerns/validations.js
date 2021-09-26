import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'
import UniqueCheckFailed from 'src/error/dream/validation/unique-check-failed'
import InclusionCheckFailed from 'src/error/dream/validation/inclusion-check-failed'
import ExclusionCheckFailed from 'src/error/dream/validation/exclusion-check-failed'

const ValidationsProvider = superclass => class extends superclass {
  constructor(...args) {
    super(...args)

    this._validations = {}
  }

  validates(column, opts) {
    this._validations[column] = this._validations[column] || []
    this._validations[column].push(opts)
    return this
  }

  async _runValidations() {
    for (const column in this._validations) {
      const validations = this._validations[column]
      for (const i in validations) {
        const validation = validations[i]
        if (
          validation.presence &&
            !this[column + 'IsPresent']
        )
          throw new PresenceCheckFailed(`Failed to check presence for column ${this.table}.${column}`)

        if (
          validation.unique &&
            !(await this[column + 'IsUnique']())
        )
          throw new UniqueCheckFailed(`Failed to check presence for column ${this.table}.${column}`)

        if (
          validation.inclusion &&
            !validation.inclusion.includes(this[column])
        )
          throw new InclusionCheckFailed(`expected ${this[column]} in ${validation.inclusion}`)

        if (
          validation.exclusion &&
            validation.exclusion.includes(this[column])
        )
          throw new ExclusionCheckFailed(`expected ${this[column]} in ${validation.exclusion}`)
      }
    }
  }
}

export default ValidationsProvider
