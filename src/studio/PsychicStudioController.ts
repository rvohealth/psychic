import { Dream, ops, Query, WhereStatementForDreamClass } from '@rvoh/dream'
import PsychicController from '../controller/index.js'

export default class PsychicStudioController extends PsychicController {
  public async create() {
    try {
      const modelClass = this.modelClass
      await modelClass.create(this.paramsFor(modelClass, { including: this.safeColumnsForModelClass }))
      this.noContent()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public async update() {
    try {
      const modelClass = this.modelClass
      const id = this.params[modelClass.primaryKey as keyof typeof this.params]
      const model = await modelClass.findOrFail(id)

      await model.update(this.paramsFor(modelClass, { including: this.safeColumnsForModelClass }))
      this.noContent()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  private get safeColumnsForModelClass() {
    const modelClass = this.modelClass
    return [...modelClass.columns()].filter(column => column !== modelClass.primaryKey)
  }

  private operatorStatement(operator: FilterComparisonOperator, value: unknown) {
    switch (operator) {
      case '=':
        return ops.equal(value)

      case '!=':
        return ops.not.equal(value)

      case '<':
        return ops.lessThan(value)

      case '<=':
        return ops.lessThanOrEqualTo(value)

      case '>':
        return ops.greaterThan(value)

      case '>=':
        return ops.greaterThanOrEqualTo(value)

      case 'in':
        return ops.in(value as unknown[])

      case 'like':
        return ops.ilike(value as string)

      case 'not like':
        return ops.not.ilike(value as string)
    }
  }

  protected showQueryWithFilters(baseQuery: Query<Dream>) {
    const modelClass = this.modelClass
    const orderDir = this.castParam('orderDir', 'string', { enum: ['asc', 'desc'], allowNull: true }) || 'asc'
    const orderColumn =
      this.castParam('orderColumn', 'string', { allowNull: true }) ||
      (modelClass.prototype['_createdAtField'] as string | undefined) ||
      'createdAt'

    let query = baseQuery.order({ [orderColumn]: orderDir })
    const whereStatements: WhereStatementForDreamClass<typeof modelClass>[] = []

    if (Array.isArray(this.params.filters)) {
      this.params.filters.forEach(_filter => {
        const filter = _filter as unknown as TableFilter
        whereStatements.push({
          [filter.columnName]: this.operatorStatement(filter.comparisonOperator, filter.value),
        })
      })
    }

    // NOTE: SHOULDNT NEED THIS!
    if (whereStatements.length) {
      query = baseQuery.whereAny(whereStatements)
    }

    return query
  }

  protected get modelClass(): typeof Dream {
    throw new Error('define in child class')
  }
}

export interface TableFilter {
  columnName: string
  value: unknown
  comparisonOperator: FilterComparisonOperator
}

const FILTER_COMPARISON_OPERATORS = ['=', '!=', 'like', 'not like', '<', '<=', '>', '>=', 'in'] as const
export type FilterComparisonOperator = (typeof FILTER_COMPARISON_OPERATORS)[number]
