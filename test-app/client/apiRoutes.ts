const apiRoutes = {
  ping: {
    GET: '/ping',
    POST: '/ping',
    PUT: '/ping',
    PATCH: '/ping',
    DELETE: '/ping',
    OPTIONS: '/ping',
  },
  authPing: {
    GET: '/auth-ping',
  },
  apiPing: {
    GET: '/api-ping',
  },
  usersBeforeAllTest: {
    GET: '/users-before-all-test',
  },
  failedToSaveTest: {
    POST: '/failed-to-save-test',
  },
  forceThrow: {
    POST: '/force-throw',
  },
  conflict: {
    GET: '/conflict',
  },
  api: {
    ping: {
      GET: '/api/ping',
    },
    v1: {
      ping: {
        GET: '/api/v1/ping',
      },
      users: {
        GET: '/api/v1/users',
      },
    },
    users: {
      userId: {
        pets: {
          GET: ({ userId }: { userId: string }) => `/api/users/${userId}/pets`,
          POST: ({ userId }: { userId: string }) => `/api/users/${userId}/pets`,
          id: {
            PUT: ({ userId, id }: { userId: string, id: string }) => `/api/users/${userId}/pets/${id}`,
            PATCH: ({ userId, id }: { userId: string, id: string }) => `/api/users/${userId}/pets/${id}`,
            GET: ({ userId, id }: { userId: string, id: string }) => `/api/users/${userId}/pets/${id}`,
            DELETE: ({ userId, id }: { userId: string, id: string }) => `/api/users/${userId}/pets/${id}`,
          },
        },
      },
      GET: '/api/users',
      POST: '/api/users',
      id: {
        PUT: ({ id }: { id: string }) => `/api/users/${id}`,
        PATCH: ({ id }: { id: string }) => `/api/users/${id}`,
        GET: ({ id }: { id: string }) => `/api/users/${id}`,
        DELETE: ({ id }: { id: string }) => `/api/users/${id}`,
      },
    },
  },
  scopedThings: {
    testingScopes: {
      GET: '/scoped-things/testing-scopes',
    },
  },
  login: {
    POST: '/login',
  },
  users: {
    id: {
      hello: {
        GET: ({ id }: { id: string }) => `/users/${id}/hello`,
      },
    },
    POST: '/users',
    GET: '/users',
  },
  greeter: {
    hello: {
      GET: '/greeter/hello',
    },
    GET: '/greeter',
  },
  routeExistsButControllerDoesnt: {
    GET: '/route-exists-but-controller-doesnt',
  },
  controllerExistsButMethodDoesnt: {
    GET: '/controller-exists-but-method-doesnt',
  },
} as const
export default apiRoutes