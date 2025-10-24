import { cloneDeepSafe, DreamApp, uniq } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'

export default class PsychicStudioTablesController extends PsychicStudioController {
  public index() {
    const models = Object.values(DreamApp.getOrFail().models)
    const tableNames = uniq(models.map(modelClass => modelClass.table))
    this.ok(tableNames)
  }

  public async show() {
    const models = Object.values(DreamApp.getOrFail().models)
    const tableNames = uniq(models.map(modelClass => modelClass.table))

    const table = this.castParam('tableName', 'string', { enum: tableNames })
    const modelClass = models.find(modelClass => modelClass.table === table && !modelClass['isSTIChild'])
    if (!modelClass) return this.notFound()

    const schema = modelClass.prototype.schema as Record<typeof table, object>

    const paginatedData = await modelClass
      .order((modelClass.prototype['_createdAtField'] as string | undefined) || 'createdAt')
      .paginate({
        page: this.castParam('page', 'integer', { allowNull: true }) || 1,
        pageSize: 100,
      })

    this.ok({
      ...paginatedData,
      results: paginatedData.results.map(model => model.getAttributes()),
      tableSchema: cloneDeepSafe(schema[table]),
      primaryKey: modelClass.primaryKey as string,
    })
  }

  public async update() {
    const models = Object.values(DreamApp.getOrFail().models)
    const tableNames = uniq(models.map(modelClass => modelClass.table))

    const table = this.castParam('tableName', 'string', { enum: tableNames })
    const modelClass = models.find(modelClass => modelClass.table === table && !modelClass['isSTIChild'])
    if (!modelClass) return this.notFound()

    const id = this.params[modelClass.primaryKey as keyof typeof this.params]
    const model = await modelClass.findOrFail(id)
    await model.update(this.paramsFor(modelClass))

    this.noContent()
  }
}
