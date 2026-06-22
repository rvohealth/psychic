import generateControllerContent from '../../../../src/generate/helpers/generateControllerContent.js'
import paramSafeColumnNamesFromCliTokens from '../../../../src/generate/helpers/paramSafeColumnNamesFromCliTokens.js'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('passing a model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerContent({
          ancestorImportStatement: "import AuthedController from './AuthedController.js'",
          ancestorName: 'AuthedController',
          fullyQualifiedControllerName: 'PostsController',
          fullyQualifiedModelName: 'Post',
          actions: ['index', 'show', 'create', 'update', 'destroy', 'preview'],
          forAdmin: false,
          singular: false,
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AuthedController from './AuthedController.js'
import Post from '@models/Post.js'

const openApiTags = ['posts']

const paramSafeColumns: DreamParamSafeColumnNames<Post>[] = []

export default class PostsController extends AuthedController {
  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Posts',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    // const posts = await this.currentUser.associationQuery('posts')
    //   .preloadFor('summary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(posts)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
    fastJsonStringify: true,
  })
  public async show() {
    // const post = await this.post()
    // this.ok(post)
  }

  @OpenAPI(Post, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Post',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let post = await this.currentUser.createAssociation('posts', this.extractParams(Post, paramSafeColumns))
    // if (post.isPersisted) post = await post.loadFor('default').execute()
    // this.created(post)
  }

  @OpenAPI(Post, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Post',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const post = await this.post()
    // await post.update(this.extractParams(Post, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Post',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const post = await this.post()
    // await post.destroy()
    // this.noContent()
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
    fastJsonStringify: true,
  })
  public async preview() {
    // const post = await this.post()
    // this.ok(post)
  }

  private async post() {
    // return await this.currentUser.associationQuery('posts')
    //   .preloadFor('default')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
        )
      })

      context('singular:true', () => {
        it('omits id param', () => {
          const res = generateControllerContent({
            ancestorImportStatement: "import AuthedController from './AuthedController.js'",
            ancestorName: 'AuthedController',
            fullyQualifiedControllerName: 'HostingAgreementController',
            fullyQualifiedModelName: 'HostingAgreement',
            actions: ['show', 'create', 'update', 'destroy'],
            forAdmin: false,
            singular: true,
          })

          expect(res).toEqual(
            `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AuthedController from './AuthedController.js'
import HostingAgreement from '@models/HostingAgreement.js'

const openApiTags = ['hosting-agreement']

const paramSafeColumns: DreamParamSafeColumnNames<HostingAgreement>[] = []

export default class HostingAgreementController extends AuthedController {
  @OpenAPI(HostingAgreement, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HostingAgreement',
    fastJsonStringify: true,
  })
  public async show() {
    // const hostingAgreement = await this.hostingAgreement()
    // this.ok(hostingAgreement)
  }

  @OpenAPI(HostingAgreement, {
    status: 201,
    tags: openApiTags,
    description: 'Create a HostingAgreement',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let hostingAgreement = await this.currentUser.createAssociation('hostingAgreement', this.extractParams(HostingAgreement, paramSafeColumns))
    // if (hostingAgreement.isPersisted) hostingAgreement = await hostingAgreement.loadFor('default').execute()
    // this.created(hostingAgreement)
  }

  @OpenAPI(HostingAgreement, {
    status: 204,
    tags: openApiTags,
    description: 'Update a HostingAgreement',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const hostingAgreement = await this.hostingAgreement()
    // await hostingAgreement.update(this.extractParams(HostingAgreement, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a HostingAgreement',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const hostingAgreement = await this.hostingAgreement()
    // await hostingAgreement.destroy()
    // this.noContent()
  }

  private async hostingAgreement() {
    // return await this.currentUser.associationQuery('hostingAgreement')
    //   .preloadFor('default')
    //   .firstOrFail()
  }
}
`,
          )
        })
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerContent({
          ancestorImportStatement: "import AuthedController from '../../../AuthedController.js'",
          ancestorName: 'AuthedController',
          fullyQualifiedControllerName: 'Api/V1/Health/PostsController',
          fullyQualifiedModelName: 'Health/Post',
          actions: ['index', 'show', 'create', 'update', 'destroy', 'preview'],
          forAdmin: false,
          singular: false,
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AuthedController from '../../../AuthedController.js'
import HealthPost from '@models/Health/Post.js'

const openApiTags = ['health-posts']

const paramSafeColumns: DreamParamSafeColumnNames<HealthPost>[] = []

export default class ApiV1HealthPostsController extends AuthedController {
  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of HealthPosts',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    // const healthPosts = await this.currentUser.associationQuery('healthPosts')
    //   .preloadFor('summary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(healthPosts)
  }

  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HealthPost',
    fastJsonStringify: true,
  })
  public async show() {
    // const healthPost = await this.healthPost()
    // this.ok(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 201,
    tags: openApiTags,
    description: 'Create a HealthPost',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let healthPost = await this.currentUser.createAssociation('healthPosts', this.extractParams(HealthPost, paramSafeColumns))
    // if (healthPost.isPersisted) healthPost = await healthPost.loadFor('default').execute()
    // this.created(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 204,
    tags: openApiTags,
    description: 'Update a HealthPost',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const healthPost = await this.healthPost()
    // await healthPost.update(this.extractParams(HealthPost, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a HealthPost',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const healthPost = await this.healthPost()
    // await healthPost.destroy()
    // this.noContent()
  }

  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HealthPost',
    fastJsonStringify: true,
  })
  public async preview() {
    // const healthPost = await this.healthPost()
    // this.ok(healthPost)
  }

  private async healthPost() {
    // return await this.currentUser.associationQuery('healthPosts')
    //   .preloadFor('default')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
        )
      })
    })

    context('when provided with a nested path', () => {
      it('generates a controller with pascal-cased naming', () => {
        const res = generateControllerContent({
          ancestorImportStatement: "import AuthedController from '../../AuthedController.js'",
          ancestorName: 'AuthedController',
          fullyQualifiedControllerName: 'Api/V1/UsersController',
          actions: ['hello', 'world'],
          forAdmin: false,
          singular: false,
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import AuthedController from '../../AuthedController.js'

const openApiTags = ['api-v1-users']

export default class ApiV1UsersController extends AuthedController {
  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
  //   fastJsonStringify: true,
  // })
  public async hello() {
  }

  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
  //   fastJsonStringify: true,
  // })
  public async world() {
  }
}
`,
        )
      })
    })

    context('specifying an owning model', () => {
      it('loads/creates/updates/deletes resources from the owning model', () => {
        const res = generateControllerContent({
          ancestorImportStatement: "import AuthedController from './AuthedController.js'",
          ancestorName: 'AuthedController',
          fullyQualifiedControllerName: 'PostsController',
          fullyQualifiedModelName: 'Post',
          actions: ['index', 'show', 'create', 'update', 'destroy', 'preview'],
          owningModel: 'Host',
          forAdmin: false,
          singular: false,
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AuthedController from './AuthedController.js'
import Post from '@models/Post.js'

const openApiTags = ['posts']

const paramSafeColumns: DreamParamSafeColumnNames<Post>[] = []

export default class PostsController extends AuthedController {
  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Posts',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    // const posts = await this.currentHost.associationQuery('posts')
    //   .preloadFor('summary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(posts)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
    fastJsonStringify: true,
  })
  public async show() {
    // const post = await this.post()
    // this.ok(post)
  }

  @OpenAPI(Post, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Post',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let post = await this.currentHost.createAssociation('posts', this.extractParams(Post, paramSafeColumns))
    // if (post.isPersisted) post = await post.loadFor('default').execute()
    // this.created(post)
  }

  @OpenAPI(Post, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Post',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const post = await this.post()
    // await post.update(this.extractParams(Post, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Post',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const post = await this.post()
    // await post.destroy()
    // this.noContent()
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
    fastJsonStringify: true,
  })
  public async preview() {
    // const post = await this.post()
    // this.ok(post)
  }

  private async post() {
    // return await this.currentHost.associationQuery('posts')
    //   .preloadFor('default')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
        )
      })
    })

    context('in the Admin namespace', () => {
      it(
        'loads/creates/updates/deletes resources without an owning model ' +
          'and sets the serializerKey to admin serializers',
        () => {
          const res = generateControllerContent({
            ancestorImportStatement: "import AdminAuthedController from './AdminAuthedController.js'",
            ancestorName: 'AdminAuthedController',
            fullyQualifiedControllerName: 'Admin/ArticlesController',
            fullyQualifiedModelName: 'Article',
            actions: ['index', 'show', 'create', 'update', 'destroy', 'preview'],
            forAdmin: true,
            singular: false,
          })

          expect(res).toEqual(
            `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AdminAuthedController from './AdminAuthedController.js'
import Article from '@models/Article.js'

const openApiTags = ['articles']

const paramSafeColumns: DreamParamSafeColumnNames<Article>[] = []

export default class AdminArticlesController extends AdminAuthedController {
  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Articles',
    cursorPaginate: true,
    serializerKey: 'adminSummary',
    fastJsonStringify: true,
  })
  public async index() {
    // const articles = await Article
    //   .preloadFor('adminSummary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(articles)
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    serializerKey: 'admin',
    fastJsonStringify: true,
  })
  public async show() {
    // const article = await this.article()
    // this.ok(article)
  }

  @OpenAPI(Article, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Article',
    serializerKey: 'admin',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let article = await Article.create(this.extractParams(Article, paramSafeColumns))
    // if (article.isPersisted) article = await article.loadFor('admin').execute()
    // this.created(article)
  }

  @OpenAPI(Article, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Article',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const article = await this.article()
    // await article.update(this.extractParams(Article, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Article',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const article = await this.article()
    // await article.destroy()
    // this.noContent()
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    fastJsonStringify: true,
  })
  public async preview() {
    // const article = await this.article()
    // this.ok(article)
  }

  private async article() {
    // return await Article
    //   .preloadFor('admin')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
          )
        },
      )

      context('with an owning model specified', () => {
        it('uses the owning model for association queries while keeping admin serializer keys', () => {
          const res = generateControllerContent({
            ancestorImportStatement: "import AdminAuthedController from './AdminAuthedController.js'",
            ancestorName: 'AdminAuthedController',
            fullyQualifiedControllerName: 'Admin/ArticlesController',
            fullyQualifiedModelName: 'Article',
            actions: ['index', 'show', 'create', 'update', 'destroy'],
            owningModel: 'Organization',
            forAdmin: true,
            singular: false,
          })

          expect(res).toEqual(
            `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import AdminAuthedController from './AdminAuthedController.js'
import Article from '@models/Article.js'

const openApiTags = ['articles']

const paramSafeColumns: DreamParamSafeColumnNames<Article>[] = []

export default class AdminArticlesController extends AdminAuthedController {
  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Articles',
    cursorPaginate: true,
    serializerKey: 'adminSummary',
    fastJsonStringify: true,
  })
  public async index() {
    // const articles = await this.currentOrganization.associationQuery('articles')
    //   .preloadFor('adminSummary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(articles)
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    serializerKey: 'admin',
    fastJsonStringify: true,
  })
  public async show() {
    // const article = await this.article()
    // this.ok(article)
  }

  @OpenAPI(Article, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Article',
    serializerKey: 'admin',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let article = await this.currentOrganization.createAssociation('articles', this.extractParams(Article, paramSafeColumns))
    // if (article.isPersisted) article = await article.loadFor('admin').execute()
    // this.created(article)
  }

  @OpenAPI(Article, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Article',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const article = await this.article()
    // await article.update(this.extractParams(Article, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Article',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const article = await this.article()
    // await article.destroy()
    // this.noContent()
  }

  private async article() {
    // return await this.currentOrganization.associationQuery('articles')
    //   .preloadFor('admin')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
          )
        })
      })
    })

    context('in the Internal namespace', () => {
      it(
        'loads/creates/updates/deletes resources scoped to the current internal user ' +
          'and sets the serializerKey to internal serializers',
        () => {
          const res = generateControllerContent({
            ancestorImportStatement: "import InternalAuthedController from './InternalAuthedController.js'",
            ancestorName: 'InternalAuthedController',
            fullyQualifiedControllerName: 'Internal/ArticlesController',
            fullyQualifiedModelName: 'Article',
            actions: ['index', 'show', 'create', 'update', 'destroy', 'preview'],
            forAdmin: false,
            forInternal: true,
            singular: false,
          })

          expect(res).toEqual(
            `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import InternalAuthedController from './InternalAuthedController.js'
import Article from '@models/Article.js'

const openApiTags = ['articles']

const paramSafeColumns: DreamParamSafeColumnNames<Article>[] = []

export default class InternalArticlesController extends InternalAuthedController {
  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Articles',
    cursorPaginate: true,
    serializerKey: 'internalSummary',
    fastJsonStringify: true,
  })
  public async index() {
    // const articles = await this.currentInternalUser.associationQuery('articles')
    //   .preloadFor('internalSummary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(articles)
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    serializerKey: 'internal',
    fastJsonStringify: true,
  })
  public async show() {
    // const article = await this.article()
    // this.ok(article)
  }

  @OpenAPI(Article, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Article',
    serializerKey: 'internal',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let article = await this.currentInternalUser.createAssociation('articles', this.extractParams(Article, paramSafeColumns))
    // if (article.isPersisted) article = await article.loadFor('internal').execute()
    // this.created(article)
  }

  @OpenAPI(Article, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Article',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const article = await this.article()
    // await article.update(this.extractParams(Article, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Article',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const article = await this.article()
    // await article.destroy()
    // this.noContent()
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    fastJsonStringify: true,
  })
  public async preview() {
    // const article = await this.article()
    // this.ok(article)
  }

  private async article() {
    // return await this.currentInternalUser.associationQuery('articles')
    //   .preloadFor('internal')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
          )
        },
      )

      context('with an owning model specified', () => {
        it('uses the owning model for association queries while keeping internal serializer keys', () => {
          const res = generateControllerContent({
            ancestorImportStatement: "import InternalAuthedController from './InternalAuthedController.js'",
            ancestorName: 'InternalAuthedController',
            fullyQualifiedControllerName: 'Internal/ArticlesController',
            fullyQualifiedModelName: 'Article',
            actions: ['index', 'show', 'create', 'update', 'destroy'],
            owningModel: 'Organization',
            forAdmin: false,
            forInternal: true,
            singular: false,
          })

          expect(res).toEqual(
            `\
import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import InternalAuthedController from './InternalAuthedController.js'
import Article from '@models/Article.js'

const openApiTags = ['articles']

const paramSafeColumns: DreamParamSafeColumnNames<Article>[] = []

export default class InternalArticlesController extends InternalAuthedController {
  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Articles',
    cursorPaginate: true,
    serializerKey: 'internalSummary',
    fastJsonStringify: true,
  })
  public async index() {
    // const articles = await this.currentOrganization.associationQuery('articles')
    //   .preloadFor('internalSummary')
    //   .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    // this.ok(articles)
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    serializerKey: 'internal',
    fastJsonStringify: true,
  })
  public async show() {
    // const article = await this.article()
    // this.ok(article)
  }

  @OpenAPI(Article, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Article',
    serializerKey: 'internal',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async create() {
    // let article = await this.currentOrganization.createAssociation('articles', this.extractParams(Article, paramSafeColumns))
    // if (article.isPersisted) article = await article.loadFor('internal').execute()
    // this.created(article)
  }

  @OpenAPI(Article, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Article',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
    },
  })
  public async update() {
    // const article = await this.article()
    // await article.update(this.extractParams(Article, paramSafeColumns))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Article',
    fastJsonStringify: true,
  })
  public async destroy() {
    // const article = await this.article()
    // await article.destroy()
    // this.noContent()
  }

  private async article() {
    // return await this.currentOrganization.associationQuery('articles')
    //   .preloadFor('internal')
    //   .findOrFail(this.castParam('id', 'string'))
  }
}
`,
          )
        })
      })
    })
  })

  describe('paramSafeColumnNamesFromCliTokens (R-011 filter)', () => {
    it('omits reserved names, belongs_to FKs, _type, and _id tokens; camelCases survivors', () => {
      const safe = paramSafeColumnNamesFromCliTokens([
        'id:integer',
        'created_at:timestamp',
        'updated_at:timestamp',
        'deleted_at:timestamp',
        'type:string',
        'name:string',
        'avatar_url:string',
        'Team:belongs_to',
        'status_type:string',
        'something_id:bigint',
      ])
      expect(safe).toEqual(['name', 'avatarUrl'])
    })

    it('returns an empty array when no columns survive the filter', () => {
      expect(paramSafeColumnNamesFromCliTokens(['id:integer', 'created_at:timestamp'])).toEqual([])
    })
  })

  describe('paramExtractionStrategy (R-011)', () => {
    it('emits extractParams referencing a shared paramSafeColumns const for non-admin scaffolds', () => {
      const res = generateControllerContent({
        ancestorImportStatement: "import AuthedController from './AuthedController.js'",
        ancestorName: 'AuthedController',
        fullyQualifiedControllerName: 'PostsController',
        fullyQualifiedModelName: 'Post',
        actions: ['create', 'update'],
        forAdmin: false,
        singular: false,
        columnsWithTypes: ['title:string', 'body:text', 'User:belongs_to', 'id:integer'],
      })
      expect(res).toContain(
        "const openApiTags = ['posts']\n\nconst paramSafeColumns: DreamParamSafeColumnNames<Post>[] = ['title', 'body']",
      )
      expect(res).toContain("import { DreamParamSafeColumnNames } from '@rvoh/dream/types'")
      expect(res).toContain('this.extractParams(Post, paramSafeColumns)')
      // Only one definition, two references
      expect(res.match(/const paramSafeColumns\b/g)).toHaveLength(1)
      expect(res.match(/this\.extractParams\(Post, paramSafeColumns\)/g)).toHaveLength(2)
    })

    it('omits paramSafeColumns when no create/update action is generated', () => {
      const res = generateControllerContent({
        ancestorImportStatement: "import AuthedController from './AuthedController.js'",
        ancestorName: 'AuthedController',
        fullyQualifiedControllerName: 'PostsController',
        fullyQualifiedModelName: 'Post',
        actions: ['index', 'show'],
        forAdmin: false,
        singular: false,
        columnsWithTypes: ['title:string'],
      })
      expect(res).not.toContain('paramSafeColumns')
    })

    it('emits an empty model-typed paramSafeColumns const when no columns survive the filter', () => {
      const res = generateControllerContent({
        ancestorImportStatement: "import AuthedController from './AuthedController.js'",
        ancestorName: 'AuthedController',
        fullyQualifiedControllerName: 'PostsController',
        fullyQualifiedModelName: 'Post',
        actions: ['create'],
        forAdmin: false,
        singular: false,
        columnsWithTypes: ['id:integer', 'created_at:timestamp'],
      })
      expect(res).toContain('const paramSafeColumns: DreamParamSafeColumnNames<Post>[] = []')
      expect(res).toContain('this.extractParams(Post, paramSafeColumns)')
    })

    it('emits the same shared-const shape for admin scaffolds', () => {
      const res = generateControllerContent({
        ancestorImportStatement: "import AdminAuthedController from './AuthedController.js'",
        ancestorName: 'AdminAuthedController',
        fullyQualifiedControllerName: 'Admin/PostsController',
        fullyQualifiedModelName: 'Post',
        actions: ['create', 'update'],
        forAdmin: true,
        singular: false,
        columnsWithTypes: ['title:string', 'body:text', 'User:belongs_to', 'id:integer'],
      })
      expect(res).toContain(
        "const openApiTags = ['posts']\n\nconst paramSafeColumns: DreamParamSafeColumnNames<Post>[] = ['title', 'body']",
      )
      expect(res.match(/this\.extractParams\(Post, paramSafeColumns\)/g)).toHaveLength(2)
    })
  })
})
