import { DreamCLI } from '@rvoh/dream/system'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import colorize from '../../cli/helpers/colorize.js'
import type { DefaultPsychicOpenapiOptions } from '../../psychic-app/index.js'

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
   */
  private getOasDiffConfig(): OasDiffConfig {
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
      const output = cp.execFileSync(this.oasdiffConfig.command, args, {
        shell: true,
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      })
      return output.trim()
    } catch (error) {
      const errorOutput = error instanceof Error ? error.message : String(error)
      return errorOutput
    }
  }

  /**
   * Compares two OpenAPI files using oasdiff
   */
  private compareSpecs(
    mainFilePath: string,
    currentFilePath: string,
  ): Pick<ComparisonResult, 'breaking' | 'changelog' | 'error'> {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const breakingChanges = this.runOasDiffCommand('breaking', mainFilePath, currentFilePath)
    const changelogChanges = this.runOasDiffCommand('changelog', mainFilePath, currentFilePath)
    const breaking =
      breakingChanges && !breakingChanges.includes('Command failed')
        ? breakingChanges.split('\n').filter(line => line.trim())
        : []
    const changelog =
      changelogChanges && !changelogChanges.includes('Command failed')
        ? changelogChanges.split('\n').filter(line => line.trim())
        : []

    const failedToCompare = breakingChanges.includes('Command failed')
      ? breakingChanges
      : changelogChanges.includes('Command failed')
        ? changelogChanges
        : ''

    return {
      breaking,
      changelog,
      error: failedToCompare,
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
   */
  private getHeadBranchContent(filePath: string): string {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const branchRef =
      process.env.CI === '1' ? `origin/${this.oasdiffConfig.headBranch}` : this.oasdiffConfig.headBranch

    return cp.execSync(`git show ${branchRef}:${filePath}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
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

    const currentFilePath = config.outputFilepath!

    if (!fs.existsSync(currentFilePath)) {
      result.error = `File ${config.outputFilepath!} does not exist in current branch`
      return result
    }

    const tempMainFilePath = this.createTempFilePath(config.outputFilepath!)

    const mainContent = this.getHeadBranchContent(config.outputFilepath!)

    fs.mkdirSync(path.dirname(tempMainFilePath), { recursive: true })
    fs.writeFileSync(tempMainFilePath, mainContent)

    try {
      const { breaking, changelog, error } = this.compareSpecs(tempMainFilePath, currentFilePath)

      result.breaking = breaking
      result.changelog = changelog
      result.hasChanges = breaking.length > 0 || changelog.length > 0
      result.error = error ?? ''
    } catch (error) {
      result.error = `Could not retrieve ${config.outputFilepath!} from ${this.oasdiffConfig?.headBranch} branch: ${String(error)}`
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

    for (const result of results) {
      if (result.error) {
        this.logError(result)
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

    this.logSummary(hasAnyChanges, hasBreakingChanges)
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
  private logSummary(hasAnyChanges: boolean, hasBreakingChanges: boolean): void {
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
