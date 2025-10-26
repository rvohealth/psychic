import { cloneDeepSafe, Dream, DreamApp, uniq } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'

export default class PsychicStudioTablesController extends PsychicStudioController {
  public index() {
    this.ok(this.tableNames)
  }

  public async show() {
    const modelClass = this.modelClass

    const orderDir = this.castParam('orderDir', 'string', { enum: ['asc', 'desc'], allowNull: true }) || 'asc'
    const orderColumn =
      this.castParam('orderColumn', 'string', { allowNull: true }) ||
      (modelClass.prototype['_createdAtField'] as string | undefined) ||
      'createdAt'

    console.log({ orderColumn, orderDir })

    const paginatedData = await modelClass.order({ [orderColumn]: orderDir }).paginate({
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
}
