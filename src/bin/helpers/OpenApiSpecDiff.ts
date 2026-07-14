import { DreamCLI } from '@rvoh/dream/system'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import colorize from '../../cli/helpers/colorize.js'
import OpenApiSpecDiffRequiresDevelopmentOrTest from '../../error/openapi/OpenApiSpecDiffRequiresDevelopmentOrTest.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import PsychicApp, { DefaultPsychicOpenapiOptions } from '../../psychic-app/index.js'

/**
 * Interface to hold the result of a comparison
 * between the current local OpenAPI specification and the head branch
 * for a given OpenAPI file
 */
export interface ComparisonResult {
  file: string
  hasChanges: boolean
  breaking: string[]
  changelog: string[]
  error?: string
}

/**
 * Interface to hold the configuration for oasdiff
 */
export interface OasDiffConfig {
  command: string
  baseArgs: string[]
  headBranch: string
}

export type PsychicOpenapiConfig = DefaultPsychicOpenapiOptions

/**
 * Class-based OpenAPI specification diff tool
 *
 * Compares current OpenAPI specs against the head branch using oasdiff
 *
 * Example usages:
 *
 * Instance-based usage
 *    const diffTool = new OpenApiSpecDiff()
 *    diffTool.compare(openapiConfigs)
 *
 * Factory method usage
 *    const diffTool = OpenApiSpecDiff.create()
 *    diffTool.compare(openapiConfigs)
 *
 * Static method usage (backward compatibility)
 *    OpenApiSpecDiff.compare(openapiConfigs)
 */
export class OpenApiSpecDiff {
  /**
   * The configuration for the oasdiff command
   */
  private oasdiffConfig?: OasDiffConfig

  /**
   * Compares a list of OpenAPI specifications between the current branch and the head branch.
   *
   * Uses `oasdiff` under the hood to detect breaking and non-breaking changes for each file,
   * helping you review and validate API updates with confidence before merging.
   *
   * This tool only runs for configurations where `checkDiffs` is enabled.
   *
   * @param openapiConfigs - An array of tuples containing the OpenAPI file name and its configuration.
   * @example
   * ```ts
   * const openapiConfigs: [string, PsychicOpenapiConfig][] = [
   *   ['openapi', { outputFilepath: 'openapi.json' }],
   * ]
   * OpenApiSpecDiff.compare(openapiConfigs)
   * ```
   */
  public compare(openapiConfigs: [string, PsychicOpenapiConfig][]): void {
    if (!EnvInternal.isDevelopmentOrTest) throw new OpenApiSpecDiffRequiresDevelopmentOrTest()
    const results: ComparisonResult[] = []

    this.oasdiffConfig = this.getOasDiffConfig()
    const comparing = colorize(
      `🔍 Comparing current OpenAPI Specs against ${this.oasdiffConfig.headBranch}...`,
      { color: 'cyanBright' },
    )
    DreamCLI.logger.logStartProgress(comparing, { logPrefixColor: 'cyanBright' })
    DreamCLI.logger.logContinueProgress(`\n`, { logPrefixColor: 'cyanBright' })

    for (const [openapiName, config] of openapiConfigs) {
      const result = this.compareConfig(openapiName, config)
      results.push(result)
    }

    this.processResults(results)
  }

  /**
   * Checks if oasdiff is installed locally
   */
  private hasOasDiffInstalled(): boolean {
    try {
      cp.execSync('oasdiff --version', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  /**
   * Fetch the head branch of a remote using git remote show origin
   * default to main if not set
   */
  private getHeadBranch(): string {
    let head = ''
    const output = cp.execSync('git remote show origin', { encoding: 'utf-8' })
    const lines = output.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('HEAD branch:')) {
        head = trimmed.replace('HEAD branch:', '').trim() || 'main'
      }
    }

    return head
  }

  /**
   * Validates that oasdiff is installed and builds the oasdiff config
   *
   * Marked `protected` so tests can supply a deterministic config (e.g. a
   * command guaranteed to fail) instead of probing the local oasdiff install
   * and git remote. Production code never overrides this.
   */
  protected getOasDiffConfig(): OasDiffConfig {
    const headBranch = this.getHeadBranch()

    if (this.hasOasDiffInstalled()) {
      DreamCLI.logger.logContinueProgress('🎉 oasdiff package found\n')
      return {
        command: 'oasdiff',
        baseArgs: [],
        headBranch,
      }
    }

    throw new Error(
      `⚠️ oasdiff not found.

      Install it via the instructions here:
        https://github.com/tufin/oasdiff
      `,
    )
  }

  /**
   * Runs oasdiff command and returns the output
   */
  private runOasDiffCommand(
    subcommand: string,
    mainPath: string,
    currentPath: string,
    flags?: string[],
  ): string {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const args = [...this.oasdiffConfig.baseArgs, subcommand, mainPath, currentPath]
    if (flags && flags.length > 0) {
      args.push(...flags.map(flag => `--${flag}`))
    }

    try {
      // shell: true is intentional — `oasdiff` may be installed as a `.cmd` shim
      // on Windows, which `execFile` cannot invoke directly. This helper runs
      // only via `pnpm psy openapi:spec-diff` (developer / CI invocation), never
      // in a deployed process; `args` are literal subcommand strings plus
      // developer-controlled file paths, not request input. See docs/SECURITY_CVE_CHECKLIST.md R-026.
      const output = cp.execFileSync(this.oasdiffConfig.command, args, {
        shell: true,
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      })
      return output.trim()
    } catch (error) {
      // a failed oasdiff invocation must never be mistaken for diff output
      // (previously the error text was returned and string-matched, so a
      // broken oasdiff read as "no breaking changes")
      throw new OasDiffCommandFailedError(subcommand, error)
    }
  }

  /**
   * Detects oasdiff output that indicates no reportable changes for the
   * given subcommand. Newer oasdiff versions print informational messages
   * like "No changes detected", "No changes to report, but the specs are
   * different", or "No breaking changes to report, but the specs are
   * different" to stdout rather than returning empty output.
   */
  private isNoChangesOutput(output: string): boolean {
    const trimmed = output.trim()
    return (
      trimmed === 'No changes detected' ||
      trimmed.startsWith('No changes to report') ||
      trimmed.startsWith('No breaking changes to report')
    )
  }

  /**
   * Compares two OpenAPI files using oasdiff
   */
  private compareSpecs(
    mainFilePath: string,
    currentFilePath: string,
  ): Pick<ComparisonResult, 'breaking' | 'changelog'> {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const breakingChanges = this.runOasDiffCommand('breaking', mainFilePath, currentFilePath)
    const changelogChanges = this.runOasDiffCommand('changelog', mainFilePath, currentFilePath)
    const breaking =
      breakingChanges && !this.isNoChangesOutput(breakingChanges)
        ? breakingChanges.split('\n').filter(line => line.trim())
        : []
    const changelog =
      changelogChanges && !this.isNoChangesOutput(changelogChanges)
        ? changelogChanges.split('\n').filter(line => line.trim())
        : []

    return {
      breaking,
      changelog,
    }
  }

  /**
   * Creates a temporary file path for the head branch content
   */
  private createTempFilePath(filePath: string): string {
    const tempFileName = `temp_main_${path.basename(filePath)}`
    return path.join(path.dirname(filePath), tempFileName)
  }

  /**
   * Retrieves head branch content for a file
   *
   * Marked `protected` so tests can supply a deterministic baseline instead of
   * the live head branch. Production code never overrides this.
   *
   * @param absoluteFilePath - Absolute path to the file
   */
  protected getHeadBranchContent(absoluteFilePath: string): string {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const branchRef =
      process.env.CI === '1' ? `origin/${this.oasdiffConfig.headBranch}` : this.oasdiffConfig.headBranch

    // Get git repo root
    const gitRepoRoot = cp
      .execSync('git rev-parse --show-toplevel', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })
      .trim()

    // Get relative path from git repo root to the file
    const gitPath = path.relative(gitRepoRoot, absoluteFilePath).replace(/\\/g, '/')

    return cp.execFileSync('git', ['show', `${branchRef}:${gitPath}`], {
      encoding: 'utf8',
      cwd: gitRepoRoot,
      maxBuffer: 1024 * 1024 * 50,
    })
  }

  /**
   * Compares a single OpenAPI file against head branch
   */
  private compareConfig(openapiName: string, config: PsychicOpenapiConfig): ComparisonResult {
    const result: ComparisonResult = {
      file: openapiName,
      hasChanges: false,
      breaking: [],
      changelog: [],
    }

    // Get absolute path using apiRoot
    const psychicApp = PsychicApp.getOrFail()
    const currentFilePath = path.isAbsolute(config.outputFilepath!)
      ? config.outputFilepath!
      : path.join(psychicApp.apiRoot, config.outputFilepath!)

    if (!fs.existsSync(currentFilePath)) {
      result.error = `File ${config.outputFilepath!} does not exist in current branch`
      return result
    }

    const tempMainFilePath = this.createTempFilePath(config.outputFilepath!)

    try {
      // inside the try so a failed `git show` (e.g. file unreadable on the
      // head branch) is recorded as this file's error instead of escaping
      // and aborting the entire diff run with a raw error
      const mainContent = this.getHeadBranchContent(currentFilePath)

      fs.mkdirSync(path.dirname(tempMainFilePath), { recursive: true })
      fs.writeFileSync(tempMainFilePath, mainContent)

      const { breaking, changelog } = this.compareSpecs(tempMainFilePath, currentFilePath)

      result.breaking = breaking
      result.changelog = changelog
      result.hasChanges = breaking.length > 0 || changelog.length > 0
    } catch (error) {
      result.error =
        error instanceof OasDiffCommandFailedError
          ? error.message
          : `Could not retrieve ${config.outputFilepath!} from ${this.oasdiffConfig?.headBranch} branch: ${String(error)}`
    } finally {
      if (fs.existsSync(tempMainFilePath)) {
        fs.unlinkSync(tempMainFilePath)
      }
    }

    return result
  }

  /**
   * Process and display the comparison results
   */
  private processResults(results: ComparisonResult[]): void {
    let hasAnyChanges = false
    let hasBreakingChanges = false
    const erroredFiles: string[] = []

    for (const result of results) {
      if (result.error) {
        this.logError(result)
        erroredFiles.push(result.file)
      } else if (result.hasChanges) {
        this.logChanges(result)
        hasAnyChanges = true

        if (result.breaking.length > 0) {
          this.logBreakingChanges(result)
          hasBreakingChanges = true
        }

        if (result.changelog.length > 0) {
          this.logChangelog(result)
        }
      } else {
        this.logNoChanges(result)
      }
    }

    this.logSummary(hasAnyChanges, hasBreakingChanges, erroredFiles)
  }

  /**
   * Log error for a comparison result
   */
  private logError(result: ComparisonResult): void {
    const file = colorize(`❌ ${result.file}`, { color: 'whiteBright' })
    const error = colorize(`${result.error}`, { color: 'redBright' })

    DreamCLI.logger.logContinueProgress(`${file}: ${error}`, { logPrefixColor: 'redBright' })
  }

  /**
   * Log changes for a comparison result
   */
  private logChanges(result: ComparisonResult): void {
    const file = colorize(`${result.file}`, { color: 'whiteBright' })
    const changes = colorize('HAS CHANGES', { color: 'yellowBright' })
    DreamCLI.logger.logContinueProgress(`${file}: ${changes}`, { logPrefixColor: 'yellowBright' })
  }

  /**
   * Log breaking changes for a comparison result
   */
  private logBreakingChanges(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(`   ${colorize(`🚨 BREAKING CHANGES:`, { color: 'redBright' })}`, {
      logPrefixColor: 'redBright',
    })
    result.breaking.forEach(change => {
      DreamCLI.logger.logContinueProgress(`      ${colorize(`• ${change}`, { color: 'redBright' })}`, {
        logPrefixColor: 'redBright',
      })
    })
  }

  /**
   * Log changelog for a comparison result
   */
  private logChangelog(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(`   ${colorize(`📋 CHANGELOG:`, { color: 'blueBright' })}`, {
      logPrefixColor: 'blueBright',
    })
    const changelogLines = result.changelog
    changelogLines.forEach(line => {
      DreamCLI.logger.logContinueProgress(`      ${colorize(line, { color: 'whiteBright' })}`, {
        logPrefixBgColor: 'bgWhite',
        logPrefixColor: 'white',
      })
    })
  }

  /**
   * Log no changes for a comparison result
   */
  private logNoChanges(result: ComparisonResult): void {
    const file = colorize(`${result.file}`, { color: 'whiteBright' })
    const changes = colorize('No changes', { color: 'greenBright' })
    DreamCLI.logger.logContinueProgress(`${file}: ${changes}`, { logPrefixColor: 'greenBright' })
  }

  /**
   * Log final summary and handle exit conditions
   */
  private logSummary(hasAnyChanges: boolean, hasBreakingChanges: boolean, erroredFiles: string[]): void {
    DreamCLI.logger.logContinueProgress(`\n${colorize(`${'='.repeat(60)}`, { color: 'gray' })}`, {
      logPrefixColor: 'gray',
    })

    if (hasBreakingChanges) {
      DreamCLI.logger.logContinueProgress(
        `${colorize(`🚨 CRITICAL:`, { color: 'redBright' })} ${colorize(`Breaking changes detected in current branch compared to ${this.oasdiffConfig?.headBranch}! Review before merging.`, { color: 'whiteBright' })}`,
        { logPrefixColor: 'redBright' },
      )
      DreamCLI.logger.logContinueProgress(`${colorize(`${'='.repeat(60)}`, { color: 'gray' })}`, {
        logPrefixColor: 'gray',
      })
      DreamCLI.logger.logContinueProgress('\n'.repeat(5), {
        logPrefixColor: 'gray',
      })

      throw new BreakingChangesDetectedInOpenApiSpecError(this.oasdiffConfig!)
    } else if (erroredFiles.length > 0) {
      DreamCLI.logger.logContinueProgress(
        `${colorize(`❌ CRITICAL:`, { color: 'redBright' })} ${colorize(`The OpenAPI diff tooling failed for: ${erroredFiles.join(', ')}. This result is inconclusive — it is NOT a clean "no breaking changes" result.`, { color: 'whiteBright' })}`,
        { logPrefixColor: 'redBright' },
      )

      throw new OpenApiSpecDiffToolFailureError(erroredFiles)
    } else if (hasAnyChanges) {
      const summary = colorize(
        `📊 Summary: Some OpenAPI files have non-breaking changes in current branch compared to ${this.oasdiffConfig?.headBranch}`,
        { color: 'yellow' },
      )
      DreamCLI.logger.logContinueProgress(summary, { logPrefixColor: 'yellow' })
    } else {
      const summary = colorize(
        `📊 Summary: All OpenAPI files in current branch are identical to ${this.oasdiffConfig?.headBranch} branch`,
        { color: 'green' },
      )
      DreamCLI.logger.logContinueProgress(summary, { logPrefixColor: 'green' })
    }
  }

  /**
   * Static factory method for convenience
   */
  public static create(): OpenApiSpecDiff {
    return new OpenApiSpecDiff()
  }

  /**
   * Static method to maintain compatibility with functional approach
   */
  public static compare(openapiConfigs: [string, PsychicOpenapiConfig][]): void {
    const instance = OpenApiSpecDiff.create()
    instance.compare(openapiConfigs)
  }
}

export class BreakingChangesDetectedInOpenApiSpecError extends Error {
  constructor(private readonly oasdiffConfig: OasDiffConfig) {
    super()
    this.name = 'BreakingChangesDetectedInOpenApiSpecError'
  }

  public override get message() {
    return `Breaking changes detected in current branch compared to ${this.oasdiffConfig.headBranch}! Review before merging.`
  }
}

/**
 * Thrown when the diff tooling itself fails (oasdiff invocation error,
 * unreadable head-branch spec, missing spec file), as opposed to oasdiff
 * successfully running and detecting breaking changes
 * ({@link BreakingChangesDetectedInOpenApiSpecError}). Under
 * `psy diff:openapi --fail-on-breaking`, both exit nonzero, but with
 * distinguishable messages: an inconclusive diff must never pass a CI gate
 * as "no breaking changes".
 */
export class OpenApiSpecDiffToolFailureError extends Error {
  constructor(private readonly erroredFiles: string[]) {
    super()
    this.name = 'OpenApiSpecDiffToolFailureError'
  }

  public override get message() {
    return `OpenAPI spec diff could not complete for: ${this.erroredFiles.join(', ')}. The diff tooling failed, so this result is inconclusive — this is a tool failure, NOT a breaking-changes result.`
  }
}

/**
 * Internal marker for a failed oasdiff invocation, so
 * {@link OpenApiSpecDiff.compareConfig} can distinguish "oasdiff itself
 * failed" from "could not retrieve head-branch content" when recording
 * a per-file error.
 */
export class OasDiffCommandFailedError extends Error {
  constructor(subcommand: string, cause: unknown) {
    super(
      `oasdiff ${subcommand} invocation failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    )
    this.name = 'OasDiffCommandFailedError'
  }
}
