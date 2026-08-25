import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import confirmOverwrite from './confirmOverwrite.js'

/**
 * A candidate file write: the absolute-or-cwd-relative destination path and
 * the exact contents that would be written there.
 */
export interface FileWriteTarget {
  filePath: string
  contents: string
}

export type ConfirmOverwriteFn = (filePaths: string[]) => Promise<boolean>

/**
 * Applies a command's full candidate write-set with confirm-then-overwrite
 * re-run semantics. The whole set is compared against disk BEFORE anything is
 * written:
 *
 * - missing targets are created
 * - byte-identical targets are silently left alone
 * - when any target exists with different content, the user is prompted ONCE,
 *   with every differing path listed, before the first write:
 *   - confirmed → every non-identical target is written (new settings win everywhere)
 *   - declined → no file is touched, and the command says so
 *
 * The confirmation is deliberately not silently answerable: with no TTY, with
 * `BYPASS_CLI_PROMPT=1`, or on an empty answer, the default `confirm`
 * ({@link confirmOverwrite}) throws before any write. Specs answer the
 * confirmation through the injectable `confirm` seam instead.
 *
 * Returns `true` when the writes were applied (or nothing needed writing),
 * `false` when the user declined — callers should skip any follow-on side
 * effects (package installs, next-steps messages) on `false`.
 */
export default async function applyConfirmedWriteSet(
  targets: FileWriteTarget[],
  {
    confirm = confirmOverwrite,
  }: {
    confirm?: ConfirmOverwriteFn | undefined
  } = {},
): Promise<boolean> {
  const targetsWithExistingContents = await Promise.all(
    targets.map(async target => {
      let existingContents: string | undefined
      try {
        existingContents = (await fs.readFile(target.filePath)).toString()
      } catch (error) {
        // only a missing file (ENOENT) means "create it": any other read
        // failure (EACCES, EISDIR, I/O errors) must not be treated as missing,
        // or an existing — possibly user-customized — file would be
        // overwritten without the confirmation above
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      return { ...target, existingContents }
    }),
  )

  const differingTargets = targetsWithExistingContents.filter(
    target => target.existingContents !== undefined && target.existingContents !== target.contents,
  )

  if (differingTargets.length) {
    const confirmed = await confirm(differingTargets.map(target => target.filePath))
    if (!confirmed) {
      console.log(`\
Declined overwrite; leaving all files untouched:
${differingTargets.map(target => `  ${target.filePath}`).join('\n')}`)
      return false
    }
  }

  for (const target of targetsWithExistingContents) {
    if (target.existingContents === target.contents) continue // byte-identical: nothing to write

    await fs.mkdir(path.dirname(target.filePath), { recursive: true })
    await fs.writeFile(target.filePath, target.contents)
  }

  return true
}
