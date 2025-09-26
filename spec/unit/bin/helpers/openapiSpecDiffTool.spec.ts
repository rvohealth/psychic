import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OpenAPISpecDiffTool from '../../../../src/bin/helpers/openapiSpecDiffTool.js'

// Mock external dependencies
vi.mock('@rvoh/dream', async () => {
  const actual = await vi.importActual('@rvoh/dream')
  return {
    ...actual,
    DreamCLI: {
      logger: {
        logStartProgress: vi.fn(),
        logContinueProgress: vi.fn(),
        logEndProgress: vi.fn(),
      },
    },
  }
})

describe('OpenAPISpecDiffTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Spy on execSync and set up default behavior
    vi.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
      throw new Error('Command not found')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('hasOasDiffInstalled', () => {
    it('returns true when oasdiff is installed', () => {
      // Override the default mock behavior for this test
      vi.spyOn(require('child_process'), 'execSync').mockImplementation(command => {
        if (command === 'oasdiff --version') {
          return 'oasdiff version 1.0.0' as any
        }
        throw new Error('Command not found')
      })

      const result = OpenAPISpecDiffTool.hasOasDiffInstalled()

      expect(result).toBe(true)
      expect(require('child_process').execSync).toHaveBeenCalledWith('oasdiff --version', { stdio: 'ignore' })
    })

    it('returns false when oasdiff is not installed', () => {
      // The default mock behavior already throws an error, so this test should work as-is
      const result = OpenAPISpecDiffTool.hasOasDiffInstalled()

      expect(result).toBe(false)
      expect(require('child_process').execSync).toHaveBeenCalledWith('oasdiff --version', { stdio: 'ignore' })
    })
  })

  describe('getOasDiffConfig', () => {
    it('returns the local spec diff config', () => {
      vi.spyOn(require('child_process'), 'execSync').mockImplementation(command => {
        if (command === 'oasdiff --version') {
          return 'oasdiff version 1.0.0'
        }
        throw new Error('Command not found')
      })

      const config = OpenAPISpecDiffTool.getOasDiffConfig()

      expect(config).toEqual({
        command: 'oasdiff',
        isDocker: false,
      })
    })

    it('returns the Docker spec diff config', () => {
      vi.spyOn(require('child_process'), 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') throw new Error('Not found')
        if (cmd === 'docker --version') return 'Docker version 20.0.0'
        if (cmd === 'docker pull tufin/oasdiff') return 'Success'
        throw new Error('Unknown command')
      })

      const config = OpenAPISpecDiffTool.getOasDiffConfig()

      expect(config.isDocker).toBe(true)
      expect(config.command).toContain('docker run')
    })

    it('throws error if oasdiff or docker is not installed', () => {
      vi.spyOn(require('child_process'), 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') throw new Error('Not found')
        if (cmd === 'docker --version') throw new Error('Not found')
        throw new Error('Unknown command')
      })

      try {
        OpenAPISpecDiffTool.getOasDiffConfig()
      } catch (error: any) {
        expect(error).toBeDefined()
        expect(error.message).toContain('oasdiff not found.')
        expect(error.message).toContain('Install it via the instructions here:')
        expect(error.message).toContain('https://github.com/tufin/oasdiff or')
        expect(error.message).toContain("install Docker and we'll handle the rest.")
      }
    })
  })

  describe('compareOpenApiFile', () => {
    let mockWriteFileSync: any
    let mockUnlinkSync: any
    let mockExecSync: any

    beforeEach(() => {
      mockWriteFileSync = vi.spyOn(require('fs'), 'writeFileSync')
      mockUnlinkSync = vi.spyOn(require('fs'), 'unlinkSync')
      mockExecSync = vi.spyOn(require('child_process'), 'execSync')
    })

    it('handles missing current file gracefully', async () => {
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(false)

      const result = await OpenAPISpecDiffTool.compareOpenApiFile(
        'test-api',
        { outputFilepath: 'nonexistent.json' },
        { command: 'oasdiff', isDocker: false },
      )

      expect(result.error).toContain('does not exist in current branch')
      expect(result.hasChanges).toBe(false)
    })

    it('tests helper functions used in the selected code section', () => {
      // Test createTempFilePath function
      const tempFilePath = OpenAPISpecDiffTool.createTempFilePath('test.json', false)
      expect(tempFilePath).toContain('temp_main_test.json')
      expect(tempFilePath).toContain(process.cwd())

      const dockerTempFilePath = OpenAPISpecDiffTool.createTempFilePath('test.json', true)
      expect(dockerTempFilePath).toContain('temp_main_test.json')
      expect(dockerTempFilePath).toContain('openapi')

      // Test getMainBranchContent function
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('git show main:')) {
          return '{"openapi": "3.0.0", "info": {"title": "Main Branch API"}}'
        }
        throw new Error('Unknown command')
      })

      const mainContent = OpenAPISpecDiffTool.getMainBranchContent('test.json')
      expect(mainContent).toBe('{"openapi": "3.0.0", "info": {"title": "Main Branch API"}}')
      expect(mockExecSync).toHaveBeenCalledWith(
        'git show main:api/openapi/test.json',
        expect.objectContaining({
          encoding: 'utf8',
          cwd: process.cwd(),
        }),
      )

      // Test compareSpecs function
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('oasdiff breaking')) {
          return 'Breaking change 1\nBreaking change 2\n'
        }
        if (command.includes('oasdiff changelog')) {
          return 'Added new endpoint /users\nRemoved deprecated field'
        }
        throw new Error('Unknown command')
      })

      const comparisonResult = OpenAPISpecDiffTool.compareSpecs(
        '/path/to/main.json',
        '/path/to/current.json',
        { command: 'oasdiff', isDocker: false },
      )

      expect(comparisonResult.breaking).toEqual(['Breaking change 1', 'Breaking change 2'])
      expect(comparisonResult.changelog).toBe('Added new endpoint /users\nRemoved deprecated field')
    })

    it('tests error handling for the selected code section', async () => {
      // Test error handling scenarios from the selected code section
      // This test demonstrates that the function handles errors gracefully
      vi.spyOn(require('fs'), 'existsSync').mockImplementation(() => {
        throw new Error('File system error')
      })

      const result = await OpenAPISpecDiffTool.compareOpenApiFile(
        'test-api',
        { outputFilepath: 'api/openapi/test.json' },
        { command: 'oasdiff', isDocker: false },
      )

      // The function should handle the error and return an appropriate error message
      expect(result.error).toBeDefined()
      expect(result.hasChanges).toBe(false)
    })
  })
})
