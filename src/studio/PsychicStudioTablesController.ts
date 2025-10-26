import { cloneDeepSafe, Dream, DreamApp, ops, uniq, WhereStatementForDreamClass } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'

export default class PsychicStudioTablesController extends PsychicStudioController {
  public index() {
    this.ok(this.tableNames)
  }

  public async show() {
    const modelClass = this.modelClass

    const query = this.showQueryWithFilters()
    const paginatedData = await query.paginate({
      page: this.castParam('page', 'integer', { allowNull: true }) || 1,
      pageSize: 100,
    })

    this.ok({
      ...paginatedData,
      results: paginatedData.results.map(model => model.getAttributes()),
      tableSchema: cloneDeepSafe(this.modelSchema[this.tableName]),
      primaryKey: modelClass.primaryKey as string,
    })
  }

  public async create() {
    const modelClass = this.modelClass
    try {
      await modelClass.create(this.paramsFor(modelClass))
    } catch (err) {
      console.log(err)
    }
    this.noContent()
  }

  public async update() {
    const modelClass = this.modelClass
    const id = this.params[modelClass.primaryKey as keyof typeof this.params]
    const model = await modelClass.findOrFail(id)
    await model.update(this.paramsFor(modelClass))

    this.noContent()
  }

  private get tableName() {
    return this.castParam('tableName', 'string', { enum: this.tableNames })
  }

  private get tableNames() {
    const models = Object.values(DreamApp.getOrFail().models)
    return uniq(models.map(modelClass => modelClass.table))
  }

  private get modelClass(): typeof Dream {
    const models = Object.values(DreamApp.getOrFail().models)
    const modelClass = models.find(
      modelClass => modelClass.table === this.tableName && !modelClass['isSTIChild'],
    ) as typeof Dream

    if (!modelClass) this.notFound()

    return modelClass
  }

  private get modelSchema() {
    return this.modelClass.prototype.schema as Record<typeof this.tableName, object>
  }

  private showQueryWithFilters() {
    const modelClass = this.modelClass

    const orderDir = this.castParam('orderDir', 'string', { enum: ['asc', 'desc'], allowNull: true }) || 'asc'
    const orderColumn =
      this.castParam('orderColumn', 'string', { allowNull: true }) ||
      (modelClass.prototype['_createdAtField'] as string | undefined) ||
      'createdAt'

    let query = modelClass.order({ [orderColumn]: orderDir })
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
      query = query.whereAny(whereStatements)
    }

    return query
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
}

export interface TableFilter {
  columnName: string
  value: unknown
  comparisonOperator: FilterComparisonOperator
}

const FILTER_COMPARISON_OPERATORS = ['=', '!=', 'like', 'not like', '<', '<=', '>', '>=', 'in'] as const
export type FilterComparisonOperator = (typeof FILTER_COMPARISON_OPERATORS)[number]
