import { Dream, DreamApp } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'
import { cloneDeepSafe, uniq } from '@rvoh/dream/utils'

export default class PsychicStudioTablesController extends PsychicStudioController {
  public index() {
    this.ok(this.tableNames)
  }

  public async show() {
    const modelClass = this.modelClass

    const query = this.showQueryWithFilters(modelClass.query())
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

  private get tableName() {
    return this.castParam('tableName', 'string', { enum: this.tableNames })
  }

  private get tableNames() {
    const models = Object.values(DreamApp.getOrFail().models)
    return uniq(models.map(modelClass => modelClass.table))
  }

  protected override get modelClass(): typeof Dream {
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
}
