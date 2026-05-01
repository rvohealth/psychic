export default class OpenApiSpecDiffRequiresDevelopmentOrTest extends Error {
  public override get message() {
    return `
OpenApiSpecDiff refused to run outside development or test
(NODE_ENV must be 'development' or 'test').

This helper shells out to \`oasdiff\` to compare local OpenAPI specs
against the head branch. It is invoked only via \`pnpm psy openapi:spec-diff\`
in developer or CI workflows; refusing here turns the dev-only contract
into a runtime invariant. Checking \`!isDevelopmentOrTest\` (rather than
\`isProduction\`) means staging-style envs and any unforeseen NODE_ENV
value also fail closed.
    `
  }
}
