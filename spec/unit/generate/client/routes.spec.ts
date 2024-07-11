import generateClientRoutes from '../../../../src/generate/client/routes'

describe('generateClientRoutes', () => {
  it('generates expected route structure', () => {
    const str = generateClientRoutes([
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
          PUT: ({ id }: { id: UriParam }) => \`/api/v1/users/$\{id}\`,
        },
      },
    },
  },
} as const
export default apiRoutes

export type UriParam = string | number`,
    )
  })

  context('with two separate routes with the same path', () => {
    it('correctly combines separate namespaces', () => {
      const str = generateClientRoutes([
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
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })

  context('with a hyphenated uri param', () => {
    it('camelizes hyphenated name', () => {
      const str = generateClientRoutes([
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
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })

  context('with a uri param nested in the route', () => {
    it('includes param in namespace', () => {
      const str = generateClientRoutes([
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
        POST: ({ version }: { version: UriParam }) => \`/api/$\{version}/users\`,
      },
    },
  },
} as const
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })

  context('with two separate namespaces', () => {
    it('correctly combines separate namespaces', () => {
      const str = generateClientRoutes([
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
          PUT: ({ id }: { id: UriParam }) => \`/api/v2/users/$\{id}\`,
        },
      },
    },
  },
} as const
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })

  context('with multiple route params in a route', () => {
    it('correctly adds multiple params to function call for route', () => {
      const str = generateClientRoutes([
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
          POST: ({ are, arentThey }: { are: UriParam, arentThey: UriParam }) => \`/chalupas/$\{are}/good/$\{arentThey}\`,
        },
      },
    },
  },
} as const
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })

  context('with a wildcard character as one of the segments', () => {
    it('correctly encases the wildcard in a string', () => {
      const str = generateClientRoutes([
        {
          controllerActionString: 'Api/V1/Users#create',
          httpMethod: 'get',
          path: '/wildcards-are-tricky/*',
        },
      ])

      expect(str).toEqual(
        `\
const apiRoutes = {
  wildcardsAreTricky: {
    '*': {
      GET: '/wildcards-are-tricky/*',
    },
  },
} as const
export default apiRoutes

export type UriParam = string | number`,
      )
    })
  })
})
