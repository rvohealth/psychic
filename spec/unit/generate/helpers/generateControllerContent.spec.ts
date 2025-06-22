import generateControllerContent from '../../../../src/generate/helpers/generateControllerContent.js'

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
import AuthedController from './AuthedController.js'
import Post from '../models/Post.js'

const openApiTags = ['posts']

export default class PostsController extends AuthedController {
  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple Posts',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    // const posts = await this.currentUser.associationQuery('posts')
    //   .preloadFor('summary')
    //   .all()
    // this.ok(posts)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
  })
  public async show() {
    // const post = await this.post()
    // this.ok(post)
  }

  @OpenAPI(Post, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Post',
  })
  public async create() {
    // let post = await this.currentUser.createAssociation('posts', this.paramsFor(Post))
    // if (post.isPersisted) post = await post.loadFor('default').execute()
    // this.created(post)
  }

  @OpenAPI(Post, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Post',
  })
  public async update() {
    // const post = await this.post()
    // await post.update(this.paramsFor(Post))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Post',
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
import AuthedController from './AuthedController.js'
import HostingAgreement from '../models/HostingAgreement.js'

const openApiTags = ['hosting-agreement']

export default class HostingAgreementController extends AuthedController {
  @OpenAPI(HostingAgreement, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HostingAgreement',
  })
  public async show() {
    // const hostingAgreement = await this.hostingAgreement()
    // this.ok(hostingAgreement)
  }

  @OpenAPI(HostingAgreement, {
    status: 201,
    tags: openApiTags,
    description: 'Create a HostingAgreement',
  })
  public async create() {
    // let hostingAgreement = await this.currentUser.createAssociation('hostingAgreement', this.paramsFor(HostingAgreement))
    // if (hostingAgreement.isPersisted) hostingAgreement = await hostingAgreement.loadFor('default').execute()
    // this.created(hostingAgreement)
  }

  @OpenAPI(HostingAgreement, {
    status: 204,
    tags: openApiTags,
    description: 'Update a HostingAgreement',
  })
  public async update() {
    // const hostingAgreement = await this.hostingAgreement()
    // await hostingAgreement.update(this.paramsFor(HostingAgreement))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a HostingAgreement',
  })
  public async destroy() {
    // const hostingAgreement = await this.hostingAgreement()
    // await hostingAgreement.destroy()
    // this.noContent()
  }

  private async hostingAgreement() {
    // return await this.currentUser.associationQuery('hostingAgreement')
    //   .preloadFor('default')
    //   .findOrFail(this.castParam('id', 'string'))
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
import AuthedController from '../../../AuthedController.js'
import HealthPost from '../../../../models/Health/Post.js'

const openApiTags = ['health-posts']

export default class ApiV1HealthPostsController extends AuthedController {
  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple HealthPosts',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    // const healthPosts = await this.currentUser.associationQuery('healthPosts')
    //   .preloadFor('summary')
    //   .all()
    // this.ok(healthPosts)
  }

  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HealthPost',
  })
  public async show() {
    // const healthPost = await this.healthPost()
    // this.ok(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 201,
    tags: openApiTags,
    description: 'Create a HealthPost',
  })
  public async create() {
    // let healthPost = await this.currentUser.createAssociation('healthPosts', this.paramsFor(HealthPost))
    // if (healthPost.isPersisted) healthPost = await healthPost.loadFor('default').execute()
    // this.created(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 204,
    tags: openApiTags,
    description: 'Update a HealthPost',
  })
  public async update() {
    // const healthPost = await this.healthPost()
    // await healthPost.update(this.paramsFor(HealthPost))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a HealthPost',
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
  // })
  public async hello() {
  }

  // @OpenAPI(<model, view model, or serializer>, {
  //   status: 200,
  //   tags: openApiTags,
  //   description: '<tbd>',
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
import AuthedController from './AuthedController.js'
import Post from '../models/Post.js'

const openApiTags = ['posts']

export default class PostsController extends AuthedController {
  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple Posts',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    // const posts = await this.currentHost.associationQuery('posts')
    //   .preloadFor('summary')
    //   .all()
    // this.ok(posts)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
  })
  public async show() {
    // const post = await this.post()
    // this.ok(post)
  }

  @OpenAPI(Post, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Post',
  })
  public async create() {
    // let post = await this.currentHost.createAssociation('posts', this.paramsFor(Post))
    // if (post.isPersisted) post = await post.loadFor('default').execute()
    // this.created(post)
  }

  @OpenAPI(Post, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Post',
  })
  public async update() {
    // const post = await this.post()
    // await post.update(this.paramsFor(Post))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Post',
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
import AdminAuthedController from './AdminAuthedController.js'
import Article from '../../models/Article.js'

const openApiTags = ['articles']

export default class AdminArticlesController extends AdminAuthedController {
  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple Articles',
    many: true,
    serializerKey: 'adminSummary',
  })
  public async index() {
    // const articles = await Article
    //   .preloadFor('adminSummary')
    //   .all()
    // this.ok(articles)
  }

  @OpenAPI(Article, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Article',
    serializerKey: 'admin',
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
  })
  public async create() {
    // let article = await Article.create(this.paramsFor(Article))
    // if (article.isPersisted) article = await article.loadFor('admin').execute()
    // this.created(article)
  }

  @OpenAPI(Article, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Article',
  })
  public async update() {
    // const article = await this.article()
    // await article.update(this.paramsFor(Article))
    // this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Article',
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
    })
  })
})
