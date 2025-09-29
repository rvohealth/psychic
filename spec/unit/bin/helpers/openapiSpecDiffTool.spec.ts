import cp from 'child_process'
import fs from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OpenAPISpecDiffTool from '../../../../src/bin/helpers/openapiSpecDiffTool.js'
import { DefaultPsychicOpenapiOptions } from '../../../../src/psychic-app/index.js'

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
    vi.spyOn(cp, 'execSync').mockImplementation(() => {
      throw new Error('Command not found')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('compare', () => {
    const ciValue = process.env.CI
    afterEach(() => {
      process.env.CI = ciValue
    })

    it('handles changelogs', () => {
      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        throw new Error('Unknown command')
      })

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
        ['api2', { outputFilepath: 'api/openapi/api2.json' }],
      ]

      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        if (typeof cmd === 'string' && cmd.includes('git show main:')) return '{"openapi": "3.0.0"}'
        if (typeof cmd === 'string' && cmd.includes('oasdiff breaking')) return ''
        if (typeof cmd === 'string' && cmd.includes('oasdiff changelog')) return 'Change 1'
        throw new Error('Unknown command')
      })

      expect(() => OpenAPISpecDiffTool.compare(configs)).not.toThrow()
    })

    it('handles breaking changes', () => {
      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        if (typeof cmd === 'string' && cmd.includes('git show main:')) return '{"openapi": "3.0.0"}'
        if (typeof cmd === 'string' && cmd.includes('oasdiff breaking'))
          return 'Breaking change 1\nBreaking change 2'
        if (typeof cmd === 'string' && cmd.includes('oasdiff changelog'))
          return 'Added new endpoint /users\nModified /products endpoint\nRemoved deprecated field'
        throw new Error('Unknown command')
      })

      vi.spyOn(fs, 'existsSync').mockImplementation(() => true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).toThrow()
    })

    it('handles no breaking changes or changelogs', () => {
      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        if (typeof cmd === 'string' && cmd.includes('git show main:')) return '{"openapi": "3.0.0"}'
        if (typeof cmd === 'string' && cmd.includes('oasdiff breaking')) return ''
        if (typeof cmd === 'string' && cmd.includes('oasdiff changelog')) return ''
        throw new Error('Unknown command')
      })

      vi.spyOn(fs, 'existsSync').mockImplementation(() => true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).not.toThrow()
    })

    it('runs the git show command with origin/main', () => {
      process.env.CI = '1'

      vi.spyOn(fs, 'existsSync').mockImplementation(() => true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        throw new Error('Unknown command')
      })

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).not.toThrow()
    })

    it('does not have an existing file', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') return 'oasdiff version 1.0.0'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        if (typeof cmd === 'string' && cmd.includes('git show main:')) return '{"openapi": "3.0.0"}'
        if (typeof cmd === 'string' && cmd.includes('oasdiff breaking')) return ''
        if (typeof cmd === 'string' && cmd.includes('oasdiff changelog')) return ''
        throw new Error('Unknown command')
      })

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).not.toThrow()
    })
    it('uses docker', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') throw new Error('Not found')
        if (cmd === 'docker --version') return 'Docker version 20.0.0'
        if (cmd === 'docker pull tufin/oasdiff') return 'Success'
        if (cmd === 'git remote show origin') return 'HEAD branch: main'
        throw new Error('Unknown command')
      })

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).not.toThrow()
    })
    it('does not have oasdiff installed', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

      vi.spyOn(cp, 'execSync').mockImplementation(cmd => {
        if (cmd === 'oasdiff --version') throw new Error('Not found')
        if (cmd === 'docker --version') throw new Error('Not found')
        throw new Error('Unknown command')
      })

      const configs: [string, DefaultPsychicOpenapiOptions][] = [
        ['api1', { outputFilepath: 'api/openapi/api1.json' }],
      ]

      expect(() => OpenAPISpecDiffTool.compare(configs)).toThrow()
    })
  })
})
