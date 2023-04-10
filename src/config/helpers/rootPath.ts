export default function rootPath({ dist = true }: { dist?: boolean } = {}) {
  if (process.env.CORE_DEVELOPMENT === '1') return process.cwd() + '/test-app'
  if (dist) return process.cwd() + '/dist/src'

  return process.cwd() + '/src'
}
