import { Dream, DreamApp } from '@rvoh/dream'
import PsychicStudioController from './PsychicStudioController.js'
import { cloneDeepSafe } from '@rvoh/dream/utils'
import { HasManyStatement } from '@rvoh/dream/types'

export default class PsychicStudioModelsController extends PsychicStudioController {
  public index() {
    this.ok(this.modelNames)
  }

  public async show() {
    const modelClass = this.modelClass
    const baseQuery = this.scopeParam
      ? modelClass.scope(this.scopeParam).removeDefaultScope('dream:STI')
      : modelClass.removeDefaultScope('dream:STI')
    const query = this.showQueryWithFilters(baseQuery)

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
        polymorphic: assoc.polymorphic,
        associationName,
        associationGlobalName: associatedModel.globalName,
        type: assoc.type,
        foreignKey: assoc.foreignKey(),
        foreignKeyTypeField: assoc.foreignKeyTypeField(),
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
    return allModelNames
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
  polymorphic: boolean
  foreignKey: string
  foreignKeyTypeField: string | null
  associationGlobalName: string
  type: 'HasOne' | 'HasMany' | 'BelongsTo'
}
