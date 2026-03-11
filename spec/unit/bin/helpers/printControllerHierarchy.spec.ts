import colors from 'yoctocolors'
import {
  actualDisplayColumn,
  controllerHierarchyLines,
  controllerTreeLine,
  globalNameDir,
  globalPrefixFromPath,
  hierarchyViolation,
  parentOfDir,
  sharedDirPrefix,
} from '../../../../src/bin/helpers/printControllerHierarchy.js'

describe('printControllerHierarchy', () => {
  describe('sharedDirPrefix', () => {
    it('returns the shared directory prefix between two paths', () => {
      expect(
        sharedDirPrefix('controllers/Admin/AuthedController', 'controllers/Admin/TestController'),
      ).toEqual('controllers/Admin/')
    })

    it('returns only the first segment when paths diverge at segment two', () => {
      expect(
        sharedDirPrefix('controllers/ApplicationController', 'controllers/Admin/AuthedController'),
      ).toEqual('controllers/')
    })

    it('returns an empty string when there is no shared prefix', () => {
      expect(sharedDirPrefix('foo/Bar', 'baz/Qux')).toEqual('')
    })

    it('handles deeply nested shared prefixes', () => {
      expect(sharedDirPrefix('a/b/c/D', 'a/b/c/E')).toEqual('a/b/c/')
    })
  })

  describe('globalPrefixFromPath', () => {
    it('returns controllers/ when path matches default', () => {
      expect(globalPrefixFromPath('src/app/controllers', 'src/app/controllers')).toEqual('controllers/')
    })

    it('returns a scoped prefix when path is a subdirectory of default', () => {
      expect(globalPrefixFromPath('src/app/controllers/Admin', 'src/app/controllers')).toEqual(
        'controllers/Admin/',
      )
    })

    it('returns controllers/ when path does not start with default', () => {
      expect(globalPrefixFromPath('other/path', 'src/app/controllers')).toEqual('controllers/')
    })

    it('strips trailing slashes before comparing', () => {
      expect(globalPrefixFromPath('src/app/controllers/Api/', 'src/app/controllers/')).toEqual(
        'controllers/Api/',
      )
    })
  })

  describe('globalNameDir', () => {
    it('returns the directory portion of a globalName', () => {
      expect(globalNameDir('controllers/Admin/AuthedController')).toEqual('controllers/Admin/')
    })

    it('returns the root directory for a top-level controller', () => {
      expect(globalNameDir('controllers/ApplicationController')).toEqual('controllers/')
    })

    it('returns empty string when there is no slash', () => {
      expect(globalNameDir('SomeController')).toEqual('')
    })
  })

  describe('parentOfDir', () => {
    it('returns the parent of a nested directory', () => {
      expect(parentOfDir('controllers/Admin/')).toEqual('controllers/')
    })

    it('returns empty string for a top-level directory', () => {
      expect(parentOfDir('controllers/')).toEqual('')
    })

    it('returns the grandparent for a deeply nested directory', () => {
      expect(parentOfDir('controllers/Api/V1/')).toEqual('controllers/Api/')
    })
  })

  describe('hierarchyViolation', () => {
    const controllersPath = 'src/app/controllers'

    it('returns null when child is in the same directory as parent', () => {
      expect(
        hierarchyViolation(
          'controllers/Admin/TestController',
          'controllers/Admin/AuthedController',
          controllersPath,
        ),
      ).toBeNull()
    })

    it('returns null when child is one directory below parent', () => {
      expect(
        hierarchyViolation(
          'controllers/Admin/AuthedController',
          'controllers/ApplicationController',
          controllersPath,
        ),
      ).toBeNull()
    })

    it('returns a violation message when child is two or more directories below parent', () => {
      const result = hierarchyViolation(
        'controllers/Api/V1/UsersController',
        'controllers/ApplicationController',
        controllersPath,
      )
      expect(result).toEqual(
        '[hierarchy violation: src/app/controllers/Api/V1/UsersController.ts should extend the BaseController in its directory or be moved]',
      )
    })

    it('returns a violation when child skips a directory level', () => {
      const result = hierarchyViolation(
        'controllers/Internal/Candidates/CitiesController',
        'controllers/ApplicationController',
        controllersPath,
      )
      expect(result).toEqual(
        '[hierarchy violation: src/app/controllers/Internal/Candidates/CitiesController.ts should extend the BaseController in its directory or be moved]',
      )
    })
  })

  describe('actualDisplayColumn', () => {
    it('returns displayColumn at depth 0', () => {
      expect(actualDisplayColumn(0, 0, 0)).toEqual(0)
    })

    it('returns displayColumn when numDashes exceeds MIN_DASHES', () => {
      // baseIndent = 5, displayColumn = 12: numDashes = max(2, 12-5-2) = 5
      // actual = 5 + 5 + 2 = 12
      expect(actualDisplayColumn(12, 1, 5)).toEqual(12)
    })

    it('returns adjusted column when MIN_DASHES pushes the name further right', () => {
      // baseIndent = 11, displayColumn = 12: numDashes = max(2, 12-11-2) = max(2, -1) = 2
      // actual = 11 + 2 + 2 = 15
      expect(actualDisplayColumn(12, 2, 11)).toEqual(15)
    })
  })

  describe('controllerTreeLine', () => {
    it('returns just the colorized name at depth 0', () => {
      expect(controllerTreeLine('controllers/ApplicationController', 0, 0, 0)).toEqual(
        colors.cyan('controllers/ApplicationController'),
      )
    })

    it('returns an indented line with dashes at depth 1 using ROOT_CHILD_INDENT', () => {
      // depth 1: baseIndent = 5 (ROOT_CHILD_INDENT), numDashes = max(2, 12 - 5 - 2) = 5
      const line = controllerTreeLine('Admin/AuthedController', 1, 12, 5)
      expect(line).toEqual(`     └${'─'.repeat(5)} ${colors.cyan('Admin/AuthedController')}`)
    })

    it('aligns depth 2 indent with end of parent indentation line', () => {
      // parent displayColumn = 12, so child baseIndent = 12 - 1 = 11
      // displayColumn = 18, numDashes = max(2, 18 - 11 - 2) = 5
      const line = controllerTreeLine('TestController', 2, 18, 11)
      expect(line).toEqual(`           └${'─'.repeat(5)} ${colors.cyan('TestController')}`)
    })

    it('aligns depth 3 indent with end of depth 2 indentation line', () => {
      // parent displayColumn = 18, so child baseIndent = 18 - 1 = 17
      // displayColumn = 24, numDashes = max(2, 24 - 17 - 2) = 5
      const line = controllerTreeLine('DeepController', 3, 24, 17)
      expect(line).toEqual(`                 └${'─'.repeat(5)} ${colors.cyan('DeepController')}`)
    })

    it('uses minimum dashes when displayColumn is small relative to baseIndent', () => {
      const line = controllerTreeLine('X', 3, 5, 15)
      // numDashes = max(2, 5 - 15 - 2) = 2
      expect(line).toEqual(`               └${'─'.repeat(2)} ${colors.cyan('X')}`)
    })

    it('produces 2 minimum dashes when prefix divergence leaves no room', () => {
      // Simulates V1/BaseController under AuthedController:
      // baseIndent = 11 (parentDisplayColumn - 1 = 12 - 1), displayColumn = 12
      // numDashes = max(2, 12 - 11 - 2) = 2
      const line = controllerTreeLine('V1/BaseController', 2, 12, 11)
      expect(line).toEqual(`           └${'─'.repeat(2)} ${colors.cyan('V1/BaseController')}`)
    })
  })

  describe('controllerHierarchyLines', () => {
    it('produces lines for the full test-app controller hierarchy', () => {
      const lines = controllerHierarchyLines()

      // Roots extend PsychicController directly: ApplicationController, AuthedController, PassportAuthedController
      expect(lines).toContainEqual(colors.cyan('controllers/ApplicationController'))
      expect(lines).toContainEqual(colors.cyan('controllers/AuthedController'))
      expect(lines).toContainEqual(colors.cyan('controllers/PassportAuthedController'))
    })

    it('strips shared directory prefixes from nested controllers', () => {
      const lines = controllerHierarchyLines()

      // Admin/AuthedController extends ApplicationController
      // shared prefix: controllers/ (12 chars), displayed as Admin/AuthedController at column 12
      // depth 1: baseIndent=5 (ROOT_CHILD_INDENT), numDashes=max(2, 12-5-2)=5
      expect(lines).toContainEqual(`     └${'─'.repeat(5)} ${colors.cyan('Admin/AuthedController')}`)

      // Admin/TestController extends Admin/AuthedController
      // shared prefix: controllers/Admin/ (18 chars)
      // displayColumn = 12 + 18 - 12 = 18, displayed as TestController
      // depth 2: baseIndent = parentDisplayColumn - 1 = 12 - 1 = 11, numDashes = max(2, 18 - 11 - 2) = 5
      expect(lines).toContainEqual(`           └${'─'.repeat(5)} ${colors.cyan('TestController')}`)
    })

    it('shows AuthedUsersController nested under AuthedController', () => {
      const lines = controllerHierarchyLines()

      // AuthedUsersController extends AuthedController (both in controllers/)
      // shared prefix: controllers/ (12 chars)
      // depth 1: baseIndent=5, numDashes=max(2, 12-5-2)=5
      expect(lines).toContainEqual(`     └${'─'.repeat(5)} ${colors.cyan('AuthedUsersController')}`)
    })

    it('orders root before its children in the output', () => {
      const lines = controllerHierarchyLines()

      const applicationIdx = lines.findIndex(l => l === colors.cyan('controllers/ApplicationController'))
      const adminAuthedIdx = lines.findIndex(l => l.includes(colors.cyan('Admin/AuthedController')))
      const adminTestIdx = lines.findIndex(l => l.includes(colors.cyan('TestController')))

      expect(applicationIdx).toBeLessThan(adminAuthedIdx)
      expect(adminAuthedIdx).toBeLessThan(adminTestIdx)
    })

    it('includes a hierarchy violation warning for controllers that skip directory levels', () => {
      const lines = controllerHierarchyLines()

      // Api/V1/UsersController extends ApplicationController (root dir), but lives in Api/V1/
      // That skips the Api/ directory level, so it should have a violation
      const expectedViolation = colors.yellow(
        '[hierarchy violation: test-app/src/app/controllers/Api/V1/UsersController.ts should extend the BaseController in its directory or be moved]',
      )
      const violationLine = lines.find(l => l.includes(expectedViolation))
      expect(violationLine).toBeDefined()
    })

    it('does not include a violation for controllers in same or parent directory', () => {
      const lines = controllerHierarchyLines()

      // Admin/TestController extends Admin/AuthedController (same directory) — no violation
      const adminTestViolation = lines.find(l => l.includes('Admin/TestController.ts should extend'))
      expect(adminTestViolation).toBeUndefined()

      // Admin/AuthedController extends ApplicationController (parent directory) — no violation
      const adminAuthedViolation = lines.find(l => l.includes('Admin/AuthedController.ts should extend'))
      expect(adminAuthedViolation).toBeUndefined()
    })

    it('indents the violation message to align with the controller name', () => {
      const lines = controllerHierarchyLines()

      const expectedViolation = colors.yellow(
        '[hierarchy violation: test-app/src/app/controllers/Api/V1/UsersController.ts should extend the BaseController in its directory or be moved]',
      )
      const violationIdx = lines.findIndex(l => l.includes(expectedViolation))
      expect(violationIdx).toBeGreaterThan(-1)

      const violationLine = lines[violationIdx]!
      // Api/V1/UsersController displayColumn = 12, baseIndent = 5
      // numDashes = max(2, 12 - 5 - 2) = 5, actualDisplayColumn = 12
      // The violation line starts with 12 spaces
      expect(violationLine).toEqual(' '.repeat(12) + expectedViolation)
    })
  })
})
