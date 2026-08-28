import * as fs from 'node:fs/promises'
import applyConfirmedWriteSet from '../../../../src/cli/helpers/applyConfirmedWriteSet.js'

describe('applyConfirmedWriteSet', () => {
  const tmpDir = 'spec/tmp/apply-confirmed-write-set'
  const filePath = `${tmpDir}/customized.ts`

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    await fs.mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.chmod(filePath, 0o600).catch(() => undefined)
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('creates a missing target without confirmation', async () => {
    const confirm = vi.fn()

    const applied = await applyConfirmedWriteSet([{ filePath, contents: 'generated' }], { confirm })

    expect(applied).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
    expect((await fs.readFile(filePath)).toString()).toEqual('generated')
  })

  context('with overwrite: true (pre-given non-interactive consent)', () => {
    it('replaces a differing target without confirming, still creating missing and skipping identical targets', async () => {
      await fs.writeFile(filePath, 'customized')
      const identicalPath = `${tmpDir}/identical.ts`
      await fs.writeFile(identicalPath, 'same')
      const missingPath = `${tmpDir}/missing.ts`
      const confirm = vi.fn()

      const applied = await applyConfirmedWriteSet(
        [
          { filePath, contents: 'generated' },
          { filePath: identicalPath, contents: 'same' },
          { filePath: missingPath, contents: 'new' },
        ],
        { confirm, overwrite: true },
      )

      expect(applied).toBe(true)
      expect(confirm).not.toHaveBeenCalled()
      expect((await fs.readFile(filePath)).toString()).toEqual('generated')
      expect((await fs.readFile(identicalPath)).toString()).toEqual('same')
      expect((await fs.readFile(missingPath)).toString()).toEqual('new')
    })

    it('still rethrows on an unreadable existing target — overwrite consents to replacing files, not to skipping the unreadable guard', async () => {
      await fs.writeFile(filePath, 'customized', { mode: 0o200 })

      await expect(
        applyConfirmedWriteSet([{ filePath, contents: 'generated' }], { overwrite: true }),
      ).rejects.toThrow(/EACCES/)

      await fs.chmod(filePath, 0o600)
      expect((await fs.readFile(filePath)).toString()).toEqual('customized')
    })
  })

  context('when an existing target cannot be read (e.g. EACCES)', () => {
    it('rethrows the read failure without confirming or writing (unreadable is not the same as missing)', async () => {
      await fs.writeFile(filePath, 'customized', { mode: 0o200 })
      const confirm = vi.fn()

      await expect(
        applyConfirmedWriteSet([{ filePath, contents: 'generated' }], { confirm }),
      ).rejects.toThrow(/EACCES/)

      expect(confirm).not.toHaveBeenCalled()
      await fs.chmod(filePath, 0o600)
      expect((await fs.readFile(filePath)).toString()).toEqual('customized')
    })
  })

  context('when an existing target is a directory (EISDIR)', () => {
    it('rethrows the read failure without confirming or writing', async () => {
      const dirTargetPath = `${tmpDir}/dir-target`
      await fs.mkdir(dirTargetPath)
      const confirm = vi.fn()

      await expect(
        applyConfirmedWriteSet([{ filePath: dirTargetPath, contents: 'generated' }], { confirm }),
      ).rejects.toThrow(/EISDIR/)

      expect(confirm).not.toHaveBeenCalled()
      expect((await fs.stat(dirTargetPath)).isDirectory()).toBe(true)
    })
  })
})
