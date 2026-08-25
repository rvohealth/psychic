import cliPrompt from './cli-prompt.js'

/**
 * Thrown when an overwrite confirmation is required but was not answered:
 * there is no TTY, the prompt is bypassed via `BYPASS_CLI_PROMPT=1`, or the
 * user submits an empty answer. All three throw this error — silently
 * choosing for the user (either skipping or overwriting) is the defect the
 * confirmation exists to remove — with advice worded for the cause: the
 * empty-answer case asks for an explicit y/n rather than suggesting a TTY the
 * user already has.
 */
export class CannotConfirmOverwriteError extends Error {
  constructor(filePaths: string[], { emptyAnswer = false }: { emptyAnswer?: boolean } = {}) {
    super(`\
Cannot ${emptyAnswer ? 'accept an empty answer as' : 'prompt for'} confirmation to overwrite existing file(s):
${filePaths.map(filePath => `  ${filePath}`).join('\n')}

These file(s) already exist with different content, and overwriting them requires
${
  emptyAnswer
    ? `an explicit answer. Re-run this command and answer y (overwrite) or n (leave the
file(s) untouched), or move/remove the file(s) above and re-run.`
    : `interactive confirmation. Re-run this command from an interactive terminal (TTY),
or move/remove the file(s) above and re-run.`
}`)
  }
}

/**
 * Asks the user to confirm overwriting the listed existing files, returning
 * `true` to overwrite and `false` when the user declines.
 *
 * Every affected path is listed in the prompt so consent is informed (some
 * setup-generated files are user-customizable scaffolds).
 *
 * Deliberately not silently answerable: when there is no TTY, when
 * `BYPASS_CLI_PROMPT=1` would short-circuit `cliPrompt` to `''`, or when the
 * user submits an empty answer, this throws {@link CannotConfirmOverwriteError}
 * instead of choosing on the user's behalf.
 */
export default async function confirmOverwrite(filePaths: string[]): Promise<boolean> {
  if (process.env.BYPASS_CLI_PROMPT === '1' || !process.stdin.isTTY) {
    throw new CannotConfirmOverwriteError(filePaths)
  }

  const question = `\
The following file(s) already exist and differ from what would be generated:
${filePaths.map(filePath => `  ${filePath}`).join('\n')}

Overwrite? [y/n] `

  const answer = (await cliPrompt(question)).trim()
  if (answer === '') throw new CannotConfirmOverwriteError(filePaths, { emptyAnswer: true })

  return /^y(es)?$/i.test(answer)
}
