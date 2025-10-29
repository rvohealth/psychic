import { cloneDeepSafe, Dream, DreamApp, HasManyStatement } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'

export default class PsychicStudioModelsController extends PsychicStudioController {
  public index() {
    this.ok(this.modelNames)
  }

  public async show() {
    const modelClass = this.modelClass

    const query = this.showQueryWithFilters(
      this.scopeParam ? modelClass.scope(this.scopeParam) : this.modelClass.query(),
    )

    const paginatedData = await query.paginate({
      page: this.castParam('page', 'integer', { allowNull: true }) || 1,
      pageSize: 100,
    })

    this.ok({
      ...paginatedData,
      results: paginatedData.results.map(model => model.getAttributes()),
      tableSchema: cloneDeepSafe(this.modelSchema[modelClass.table]),
      primaryKey: modelClass.primaryKey as string,
      namedScopes: this.modelScopeNames,
      associationNames: modelClass['associationNames'],
      associationMetadata: this.summarizedAssociationMetadata,
    })
  }

  private get summarizedAssociationMetadata(): SummarizedAssociationMetadata[] {
    const modelClass = this.modelClass

    const statements = // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (modelClass['associationMetadataMap'] as () => Record<string, HasManyStatement<any, any, any, any>>)()

    return Object.keys(statements).reduce((agg, associationName) => {
      const assoc = statements[associationName]!

      const associatedModel = assoc.modelCB()
      agg.push({
        associationName,
        associationGlobalName: associatedModel.globalName,
        type: assoc.type,
      })
      return agg
    }, [] as SummarizedAssociationMetadata[])
  }

  private get modelName() {
    return this.castParam('modelName', 'string', { enum: this.modelNames })
  }

  private get modelNames() {
    const models = DreamApp.getOrFail().models
    const allModelNames = Object.keys(models)
    return allModelNames.filter(modelName => !(models[modelName] as typeof Dream)['isSTIBase'])
  }

  protected override get modelClass(): typeof Dream {
    const modelClass = DreamApp.getOrFail().models[this.modelName] as typeof Dream
    if (!modelClass) this.notFound()
    return modelClass
  }

  private get modelSchema() {
    return this.modelClass.prototype.schema as Record<typeof this.modelName, object>
  }

  private get modelScopeNames() {
    return (this.modelClass['scopes'] as { named: { method: string }[] }).named.map(s => s.method)
  }

  private get scopeParam() {
    return this.castParam('scope', 'string', { enum: this.modelScopeNames, allowNull: true })
  }
}

interface SummarizedAssociationMetadata {
  associationName: string
  associationGlobalName: string
  type: 'HasOne' | 'HasMany' | 'BelongsTo'
}
