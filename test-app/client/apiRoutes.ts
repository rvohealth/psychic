import { Inc, Decrement, PathValue, Path, ArrayPath } from './type-helpers'
const apiRoutes = {
  ping: {
    ping: {
      path: '/ping',
      method: 'options',
    },
  },
  authPing: {
    authPing: {
      path: '/auth-ping',
      method: 'get',
    },
  },
  apiPing: {
    ping: {
      path: '/api-ping',
      method: 'get',
    },
  },
  usersBeforeAllTest: {
    beforeAllTest: {
      path: '/users-before-all-test',
      method: 'get',
    },
  },
  failedToSaveTest: {
    failedToSaveTest: {
      path: '/failed-to-save-test',
      method: 'post',
    },
  },
  forceThrow: {
    forceThrow: {
      path: '/force-throw',
      method: 'post',
    },
  },
  conflict: {
    throwConflict: {
      path: '/conflict',
      method: 'get',
    },
  },
  api: {
    ping: {
      ping: {
        path: '/api/ping',
        method: 'get',
      },
    },
    v1: {
      ping: {
        ping: {
          path: '/api/v1/ping',
          method: 'get',
        },
      },
      users: {
        index: {
          path: '/api/v1/users',
          method: 'get',
        },
      },
    },
    users: {
      pets: {
        index: {
          path: (userId: string) => `/api/users/${userId}/pets`,
          method: 'get',
        },
        create: {
          path: (userId: string) => `/api/users/${userId}/pets`,
          method: 'post',
        },
        update: {
          path: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
          method: 'patch',
        },
        show: {
          path: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
          method: 'get',
        },
        destroy: {
          path: (userId: string, id: string) => `/api/users/${userId}/pets/${id}`,
          method: 'delete',
        },
      },
      index: {
        path: '/api/users',
        method: 'get',
      },
      create: {
        path: '/api/users',
        method: 'post',
      },
      update: {
        path: (id: string) => `/api/users/${id}`,
        method: 'patch',
      },
      show: {
        path: (id: string) => `/api/users/${id}`,
        method: 'get',
      },
      destroy: {
        path: (id: string) => `/api/users/${id}`,
        method: 'delete',
      },
    },
  },
  scopedThings: {
    testingScopes: {
      scopeTest: {
        path: '/scoped-things/testing-scopes',
        method: 'get',
      },
    },
  },
  login: {
    login: {
      path: '/login',
      method: 'post',
    },
  },
  users: {
    hello: {
      hello: {
        path: (id: string) => `/users/${id}/hello`,
        method: 'get',
      },
    },
    create: {
      path: '/users',
      method: 'post',
    },
    index: {
      path: '/users',
      method: 'get',
    },
  },
  greeter: {
    hello: {
      hello: {
        path: '/greeter/hello',
        method: 'get',
      },
    },
    show: {
      path: '/greeter',
      method: 'get',
    },
  },
  routeExistsButControllerDoesnt: {
    someMethod: {
      path: '/route-exists-but-controller-doesnt',
      method: 'get',
    },
  },
  controllerExistsButMethodDoesnt: {
    thisRouteDoesntExist: {
      path: '/controller-exists-but-method-doesnt',
      method: 'get',
    },
  },
} as const
export default apiRoutes

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: T[K] extends { path: any; method: string }
        ? [K]
        : [K, ...PathsToStringProps<T[K]>]
    }[Extract<keyof T, string>]

type JoinAllButLast<T extends string[], D extends string, Index extends number> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? Index extends T['length']
      ? `${F}${D}${T[Decrement<Index> & string & keyof T]}`
      : `${F}${D}${JoinAllButLast<Extract<R, string[]>, D, Inc<Index>>}`
    : never
  : string

type ParamsInterface = {
  [Key in JoinAllButLast<PathsToStringProps<typeof apiRoutes>, '.', 1> &
    (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)]: PathValue<
    typeof apiRoutes,
    Key & (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)
  >['path'] extends (...args: any) => any
    ? Parameters<
        PathValue<typeof apiRoutes, Key & (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)>['path']
      >
    : []
}

export type DottedApiRoutePathsToParams<T extends keyof ParamsInterface = keyof ParamsInterface> = [
  T,
  ParamsInterface[T],
]
