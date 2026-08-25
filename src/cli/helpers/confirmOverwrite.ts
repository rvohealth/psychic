import cliPrompt from './cli-prompt.js'

/**
 * Thrown when an overwrite confirmation is required but cannot be answered
 * interactively: there is no TTY, the prompt is bypassed via
 * `BYPASS_CLI_PROMPT=1`, or the user submits an empty answer. All three fail
 * identically — silently choosing for the user (either skipping or
 * overwriting) is the defect the confirmation exists to remove.
 */
export class CannotConfirmOverwriteError extends Error {
  constructor(filePaths: string[]) {
    super(`\
Cannot prompt for confirmation to overwrite existing file(s):
${filePaths.map(filePath => `  ${filePath}`).join('\n')}

These file(s) already exist with different content, and overwriting them requires
interactive confirmation. Re-run this command from an interactive terminal (TTY),
or move/remove the file(s) above and re-run.`)
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

Overwrite? [y/N] `

  const answer = (await cliPrompt(question)).trim()
  if (answer === '') throw new CannotConfirmOverwriteError(filePaths)

  return /^y(es)?$/i.test(answer)
}
