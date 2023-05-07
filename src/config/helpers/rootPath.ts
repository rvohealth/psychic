// DEPRECATED
export default function rootPath({ dist = true }: { dist?: boolean } = {}) {
  // OVERRIDDEN_ROOT_PATH is a hack, because sometimes (as in the case of bin/routes.ts) we have
  // a file that is running as though it were within a consuming app, but is actually
  // being run from the node_modules/psychic dir (so we don't have to copy it over)
  if (process.env.OVERRIDDEN_ROOT_PATH) return process.env.OVERRIDDEN_ROOT_PATH

  if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') return process.cwd() + '/test-app'
  if (dist) return process.cwd() + '/src'

  return process.cwd() + '/src'
}
