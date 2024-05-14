export function productionEnv() {
  return !developmentOrTestEnv()
}

export function testEnv() {
  return process.env.NODE_ENV === 'test'
}

export function developmentEnv() {
  return process.env.NODE_ENV === 'development'
}

export function developmentOrTestEnv() {
  return testEnv() || developmentEnv()
}

type ServerEnvironments = 'production' | 'staging' | 'development' | 'test'
export function serverEnvironment(): ServerEnvironments {
  if (developmentEnv()) {
    return 'development'
  } else if (testEnv()) {
    return 'test'
  }

  switch (process.env.SENTRY_ENVIRONMENT) {
    case 'development':
      return 'development'

    case 'staging':
      return 'staging'

    default:
      return 'production'
  }
}

export function requiredEnvVariable(variable: string): string {
  const envVar = process.env[variable]
  if (!envVar) throw new Error(`Required environment variable ${variable} missing`)
  return envVar
}

export function optionalEnvVariable(variable: string): string | undefined {
  return process.env[variable]
}
