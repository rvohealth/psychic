import generateClientRoutes from '../../../src/generate/client/routes'

describe('generateClientRoutes', () => {
  it('generates expected route structure', async () => {
    const str = await generateClientRoutes([
      {
        controllerActionString: 'Api/V1/Users#create',
        httpMethod: 'post',
        path: '/api/v1/users',
      },
      {
        controllerActionString: 'Api/V1/Users#update',
        httpMethod: 'put',
        path: '/api/v1/users/:id',
      },
    ])

    expect(str).toContain(
      `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        create: {
          path: '/api/v1/users',
          method: 'post',
        },
        update: {
          path: (id: string) => \`/api/v1/users/\$\{id\}\`,
          method: 'put',
        },
      },
    },
  },
} as const
export default apiRoutes`
    )
  })

  it('generates necessary type helpers', async () => {
    const str = await generateClientRoutes([
      {
        controllerActionString: 'Api/V1/Users#create',
        httpMethod: 'post',
        path: '/api/v1/users',
      },
      {
        controllerActionString: 'Api/V1/Users#update',
        httpMethod: 'put',
        path: '/api/v1/users/:id',
      },
    ])

    expect(str).toContain("import { Inc, Decrement, PathValue, Path, ArrayPath } from './type-helpers'")

    expect(str).toContain(
      `\
export type DottedApiRoutePathsToParams<T extends keyof ParamsInterface = keyof ParamsInterface> = [
  T,
  ParamsInterface[T],
]
`
    )
  })

  context('with two separate routes with the same path', () => {
    it('correctly combines separate namespaces', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/api/v1/users',
        },
        {
          controllerActionString: 'Api/V1/Users#index',
          httpMethod: 'get',
          path: '/api/v1/users',
        },
      ])

      expect(str).toContain(
        `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        create: {
          path: '/api/v1/users',
          method: 'post',
        },
        index: {
          path: '/api/v1/users',
          method: 'get',
        },
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })

  context('with a hyphenated uri param', () => {
    it('camelizes hyphenated name', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/api/version-of-your-dreams/users',
        },
      ])

      expect(str).toContain(
        `\
const apiRoutes = {
  api: {
    versionOfYourDreams: {
      users: {
        create: {
          path: '/api/version-of-your-dreams/users',
          method: 'post',
        },
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })

  context('with a uri param nested in the route', () => {
    it('does not use for namespace', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/api/:version/users',
        },
      ])

      expect(str).toContain(
        `\
const apiRoutes = {
  api: {
    users: {
      create: {
        path: (version: string) => \`/api/\$\{version\}/users\`,
        method: 'post',
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })

  context('with two separate namespaces', () => {
    it('correctly combines separate namespaces', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/api/v1/users',
        },
        {
          controllerActionString: 'Api/V1/Users#update',
          httpMethod: 'put',
          path: '/api/v2/users/:id',
        },
      ])

      expect(str).toContain(
        `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        create: {
          path: '/api/v1/users',
          method: 'post',
        },
      },
    },
    v2: {
      users: {
        update: {
          path: (id: string) => \`/api/v2/users/\$\{id\}\`,
          method: 'put',
        },
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })
})
