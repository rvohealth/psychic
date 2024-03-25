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

    expect(str).toEqual(
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
}
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
}
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
        create: {
          path: '/api/version-of-your-dreams/users',
          method: 'post',
        },
      },
    },
  },
}
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

      expect(str).toEqual(
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
}
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
}
export default apiRoutes`
      )
    })
  })
})
