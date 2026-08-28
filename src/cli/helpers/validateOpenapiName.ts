import PsychicApp from '../../psychic-app/index.js'

/**
 * Thrown when a requested OpenAPI spec name is not registered on the app.
 * Lists the registered names so a typo is immediately diagnosable.
 */
export class UnregisteredOpenapiNameError extends Error {
  constructor(openapiName: string, registeredNames: string[]) {
    super(`\
"${openapiName}" is not a registered OpenAPI spec name.

Registered OpenAPI spec names:
${registeredNames.map(name => `  ${name}`).join('\n')}

OpenAPI specs are registered in conf/app.ts via psy.set('openapi', ...) (registered
as 'default') or psy.set('openapi', '<name>', ...).`)
  }
}

/**
 * Validates that `openapiName` names a registered OpenAPI spec, throwing
 * {@link UnregisteredOpenapiNameError} otherwise.
 *
 * Without this validation, rendering an unknown name would silently produce
 * a skeleton document with no matching controllers, and an enum sync would
 * silently overwrite the client enums file with an empty module.
 */
export default function validateOpenapiName(openapiName: string): void {
  const psychicApp = PsychicApp.getOrFail()
  const registeredNames = Object.keys(psychicApp.openapi)

  if (!registeredNames.includes(openapiName)) {
    throw new UnregisteredOpenapiNameError(openapiName, registeredNames)
  }
}
