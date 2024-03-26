import generateClientRoutes from '../../../../src/generate/client/routes'

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

    expect(str).toEqual(
      `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        POST: '/api/v1/users',
        id: {
          PUT: ({ id }: { id: string }) => \`/api/v1/users/\$\{id\}\`,
        },
      },
    },
  },
} as const
export default apiRoutes`
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

      expect(str).toEqual(
        `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        POST: '/api/v1/users',
        GET: '/api/v1/users',
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

      expect(str).toEqual(
        `\
const apiRoutes = {
  api: {
    versionOfYourDreams: {
      users: {
        POST: '/api/version-of-your-dreams/users',
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })

  context('with a uri param nested in the route', () => {
    it('includes param in namespace', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/api/:version/users',
        },
      ])

      expect(str).toEqual(
        `\
const apiRoutes = {
  api: {
    version: {
      users: {
        POST: ({ version }: { version: string }) => \`/api/\$\{version\}/users\`,
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

      expect(str).toEqual(
        `\
const apiRoutes = {
  api: {
    v1: {
      users: {
        POST: '/api/v1/users',
      },
    },
    v2: {
      users: {
        id: {
          PUT: ({ id }: { id: string }) => \`/api/v2/users/\$\{id\}\`,
        },
      },
    },
  },
} as const
export default apiRoutes`
      )
    })
  })

  context('with multiple route params in a route', () => {
    it('correctly adds multiple params to function call for route', async () => {
      const str = await generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'post',
          path: '/chalupas/:are/good/:arentThey',
        },
      ])

      expect(str).toEqual(
        `\
const apiRoutes = {
  chalupas: {
    are: {
      good: {
        arentThey: {
          POST: ({ are, arentThey }: { are: string, arentThey: string }) => \`\/chalupas\/\$\{are\}/good/\$\{arentThey\}\`,
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
