import cliPrompt from '../../../../src/cli/helpers/cli-prompt.js'
import confirmOverwrite, {
  CannotConfirmOverwriteError,
} from '../../../../src/cli/helpers/confirmOverwrite.js'

vi.mock('../../../../src/cli/helpers/cli-prompt.js', () => ({ default: vi.fn() }))

const cliPromptMock = vi.mocked(cliPrompt)

describe('confirmOverwrite', () => {
  beforeEach(() => {
    delete process.env.BYPASS_CLI_PROMPT
  })

  context('with no TTY on stdin (as in this test process)', () => {
    it('throws with advice to re-run from an interactive terminal', async () => {
      await expect(confirmOverwrite(['a.ts'])).rejects.toThrow(CannotConfirmOverwriteError)
      await expect(confirmOverwrite(['a.ts'])).rejects.toThrow(/interactive terminal \(TTY\)/)
      expect(cliPromptMock).not.toHaveBeenCalled()
    })
  })

  context('at a TTY', () => {
    let originalIsTTY: boolean | undefined

    beforeEach(() => {
      originalIsTTY = process.stdin.isTTY
      process.stdin.isTTY = true
    })

    afterEach(() => {
      process.stdin.isTTY = originalIsTTY as boolean
    })

    it('asks with a [y/n] prompt that does not advertise a default answer', async () => {
      cliPromptMock.mockResolvedValue('y')

      await confirmOverwrite(['a.ts'])

      expect(cliPromptMock).toHaveBeenCalledWith(expect.stringContaining('Overwrite? [y/n] '))
      expect(cliPromptMock).not.toHaveBeenCalledWith(expect.stringContaining('[y/N]'))
    })

    it('returns true for a yes answer and false for a no answer', async () => {
      cliPromptMock.mockResolvedValue('yes')
      expect(await confirmOverwrite(['a.ts'])).toBe(true)

      cliPromptMock.mockResolvedValue('n')
      expect(await confirmOverwrite(['a.ts'])).toBe(false)
    })

    it('throws on an empty answer, with advice to answer y or n rather than the no-TTY advice', async () => {
      cliPromptMock.mockResolvedValue('')

      await expect(confirmOverwrite(['a.ts'])).rejects.toThrow(CannotConfirmOverwriteError)
      await expect(confirmOverwrite(['a.ts'])).rejects.toThrow(/answer y \(overwrite\) or n \(leave/)

      let error: Error | undefined
      try {
        await confirmOverwrite(['a.ts'])
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).not.toMatch(/interactive terminal/)
    })
  })
})
