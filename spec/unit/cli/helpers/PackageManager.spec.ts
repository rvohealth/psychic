import PackageManager from '../../../../src/cli/helpers/PackageManager.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

// PackageManager turns a logical command (`run`/`add`/`exec`) into the concrete
// argv for whichever package manager the app is configured with. pnpm/yarn share
// the permissive `<pm> <cmd>` form; npm, bun, and deno each need a distinct shape
// (verified against bun 1.3 / deno 2.8: `bun <script>` is file-exec so `run` is
// required, and deno has no script shorthand at all — `deno task` resolves a
// package.json script and forwards trailing args).
describe('PackageManager', () => {
  function usePackageManager(packageManager: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    vi.spyOn(PsychicApp, 'getOrFail').mockReturnValue({ packageManager } as any)
  }

  describe('.run', () => {
    it('pnpm', () => {
      usePackageManager('pnpm')
      expect(PackageManager.run('psy', ['sync'])).toEqual({ command: 'pnpm', args: ['psy', 'sync'] })
    })

    it('yarn', () => {
      usePackageManager('yarn')
      expect(PackageManager.run('psy', ['sync'])).toEqual({ command: 'yarn', args: ['psy', 'sync'] })
    })

    it('npm separates script args with --', () => {
      usePackageManager('npm')
      expect(PackageManager.run('psy', ['sync'])).toEqual({
        command: 'npm',
        args: ['run', 'psy', '--', 'sync'],
      })
      expect(PackageManager.run('psy')).toEqual({ command: 'npm', args: ['run', 'psy'] })
    })

    it('bun requires `run` (bare `bun <script>` is file execution)', () => {
      usePackageManager('bun')
      expect(PackageManager.run('psy', ['sync'])).toEqual({ command: 'bun', args: ['run', 'psy', 'sync'] })
    })

    it('deno uses `deno task` (no `<pm> <script>` shorthand exists)', () => {
      usePackageManager('deno')
      expect(PackageManager.run('psy', ['sync'])).toEqual({ command: 'deno', args: ['task', 'psy', 'sync'] })
    })
  })

  describe('.add', () => {
    it('pnpm / yarn', () => {
      usePackageManager('pnpm')
      expect(PackageManager.add('lodash')).toEqual({ command: 'pnpm', args: ['add', 'lodash'] })
      expect(PackageManager.add('lodash', { dev: true })).toEqual({
        command: 'pnpm',
        args: ['add', '-D', 'lodash'],
      })
    })

    it('npm', () => {
      usePackageManager('npm')
      expect(PackageManager.add(['a', 'b'])).toEqual({ command: 'npm', args: ['install', 'a', 'b'] })
      expect(PackageManager.add('a', { dev: true })).toEqual({
        command: 'npm',
        args: ['install', '--save-dev', 'a'],
      })
    })

    it('bun', () => {
      usePackageManager('bun')
      expect(PackageManager.add('lodash')).toEqual({ command: 'bun', args: ['add', 'lodash'] })
      expect(PackageManager.add('lodash', { dev: true })).toEqual({
        command: 'bun',
        args: ['add', '--dev', 'lodash'],
      })
    })

    it('deno prefixes bare names with npm: and preserves existing specifiers', () => {
      usePackageManager('deno')
      expect(PackageManager.add(['lodash', 'npm:zod', 'jsr:@std/assert'])).toEqual({
        command: 'deno',
        args: ['add', 'npm:lodash', 'npm:zod', 'jsr:@std/assert'],
      })
      expect(PackageManager.add('lodash', { dev: true })).toEqual({
        command: 'deno',
        args: ['add', '--dev', 'npm:lodash'],
      })
    })
  })

  describe('.exec', () => {
    it('pnpm', () => {
      usePackageManager('pnpm')
      expect(PackageManager.exec('oasdiff', ['diff'])).toEqual({
        command: 'pnpm',
        args: ['exec', 'oasdiff', 'diff'],
      })
    })

    it('yarn', () => {
      usePackageManager('yarn')
      expect(PackageManager.exec('oasdiff', ['diff'])).toEqual({ command: 'yarn', args: ['oasdiff', 'diff'] })
    })

    it('npm', () => {
      usePackageManager('npm')
      expect(PackageManager.exec('oasdiff', ['diff'])).toEqual({
        command: 'npm',
        args: ['exec', '--', 'oasdiff', 'diff'],
      })
    })

    it('bun uses bunx', () => {
      usePackageManager('bun')
      expect(PackageManager.exec('oasdiff', ['diff'])).toEqual({ command: 'bunx', args: ['oasdiff', 'diff'] })
    })

    it('deno runs an npm: specifier with -A', () => {
      usePackageManager('deno')
      expect(PackageManager.exec('oasdiff', ['diff'])).toEqual({
        command: 'deno',
        args: ['run', '-A', 'npm:oasdiff', 'diff'],
      })
    })
  })
})
