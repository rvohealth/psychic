import pluralize from 'pluralize'

class Inflector {
  constructor() {
    this.inflections = {
      plural: [],
      singular: [],
      irregular: [],
      uncountable: [],
    }
  }

  plural(regex, changeTo) {
    this.inflections.plural.push({ regex, changeTo })
    pluralize.addPluralRule(regex, changeTo)
  }

  singular(regex, changeTo) {
    this.inflections.singular.push({ regex, changeTo })
    pluralize.addSingularRule(regex, changeTo)
  }

  irregular(regex, changeTo) {
    this.inflections.singular.push({ regex, changeTo })
    pluralize.addIrregularRule(regex, changeTo)
  }

  uncountable(regex) {
    this.inflections.singular.push({ regex })
    pluralize.addUncountableRule(regex)
  }
}

const inflect = global.__psy__inflect || new Inflector()
export default inflect
