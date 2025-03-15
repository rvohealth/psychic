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
          actions: ['create', 'index', 'show', 'update', 'destroy', 'preview'],
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import AuthedController from './AuthedController.js'
import Post from '../models/Post.js'

const openApiTags = ['posts']

export default class PostsController extends AuthedController {
  @OpenAPI(Post, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Post',
  })
  public async create() {
    //    const post = await this.currentUser.createAssociation('posts', this.paramsFor(Post))
    //    this.created(post)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple Posts',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const posts = await this.currentUser.associationQuery('posts').all()
    //    this.ok(posts)
  }

  @OpenAPI(Post, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Post',
  })
  public async show() {
    //    const post = await this.post()
    //    this.ok(post)
  }

  @OpenAPI(Post, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Post',
  })
  public async update() {
    //    const post = await this.post()
    //    await post.update(this.paramsFor(Post))
    //    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Post',
  })
  public async destroy() {
    //    const post = await this.post()
    //    await post.destroy()
    //    this.noContent()
  }

  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async preview() {
  }

  private async post() {
    // return await this.currentUser.associationQuery('posts').findOrFail(
    //   this.castParam('id', 'string')
    // )
  }
}
`,
        )
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerContent({
          ancestorImportStatement: "import AuthedController from '../../../AuthedController.js'",
          ancestorName: 'AuthedController',
          fullyQualifiedControllerName: 'Api/V1/Health/PostsController',
          fullyQualifiedModelName: 'Health/Post',
          actions: ['create', 'index', 'show', 'update', 'destroy', 'preview'],
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import AuthedController from '../../../AuthedController.js'
import HealthPost from '../../../../models/Health/Post.js'

const openApiTags = ['health-posts']

export default class ApiV1HealthPostsController extends AuthedController {
  @OpenAPI(HealthPost, {
    status: 201,
    tags: openApiTags,
    description: 'Create a HealthPost',
  })
  public async create() {
    //    const healthPost = await this.currentUser.createAssociation('healthPosts', this.paramsFor(HealthPost))
    //    this.created(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch multiple HealthPosts',
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const healthPosts = await this.currentUser.associationQuery('healthPosts').all()
    //    this.ok(healthPosts)
  }

  @OpenAPI(HealthPost, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a HealthPost',
  })
  public async show() {
    //    const healthPost = await this.healthPost()
    //    this.ok(healthPost)
  }

  @OpenAPI(HealthPost, {
    status: 204,
    tags: openApiTags,
    description: 'Update a HealthPost',
  })
  public async update() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.update(this.paramsFor(HealthPost))
    //    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a HealthPost',
  })
  public async destroy() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.destroy()
    //    this.noContent()
  }

  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async preview() {
  }

  private async healthPost() {
    // return await this.currentUser.associationQuery('healthPosts').findOrFail(
    //   this.castParam('id', 'string')
    // )
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
        })

        expect(res).toEqual(
          `\
import { OpenAPI } from '@rvoh/psychic'
import AuthedController from '../../AuthedController.js'

const openApiTags = ['api-v1-users']

export default class ApiV1UsersController extends AuthedController {
  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async hello() {
  }

  @OpenAPI({
    response: {
      200: {
        tags: openApiTags,
        description: '<tbd>',
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async world() {
  }
}
`,
        )
      })
    })
  })
})
