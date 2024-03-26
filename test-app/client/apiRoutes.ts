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
      pets: {
        GET: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
        POST: (userId: string) => `/api/users/${userId}/pets`,
        PUT: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
        PATCH: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
        DELETE: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
      },
      GET: (id: string) => `/api/users/${id}`,
      POST: '/api/users',
      PUT: (id: string) => `/api/users/${id}`,
      PATCH: (id: string) => `/api/users/${id}`,
      DELETE: (id: string) => `/api/users/${id}`,
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
    hello: {
      GET: (id: string) => `/users/${id}/hello`,
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