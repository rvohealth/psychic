import { DreamCLI } from '@rvoh/dream'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
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
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    redBright: '\x1b[91m',
    greenBright: '\x1b[92m',
    yellowBright: '\x1b[93m',
    blueBright: '\x1b[94m',
    magentaBright: '\x1b[95m',
    cyanBright: '\x1b[96m',
    whiteBright: '\x1b[97m',
  }

  private oasdiffConfig?: OasDiffConfig

  /**
   * Initialize the OpenAPI spec diff tool
   */
  constructor() {}

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

    DreamCLI.logger.logStartProgress(
      `${this.colors.cyanBright}🔍 Comparing current OpenAPI Specs against ${this.oasdiffConfig.headBranch}...${this.colors.reset}\n`,
      { logPrefixColor: 'cyanBright' },
    )

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

    const output = cp.execFileSync(this.oasdiffConfig.command, args, {
      shell: true,
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return output.trim()
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

    const breakingChanges = this.runOasDiffCommand('breaking', mainFilePath, currentFilePath, [
      'flatten-allof',
    ])
    const changelogChanges = this.runOasDiffCommand('changelog', mainFilePath, currentFilePath, [
      'flatten-allof',
    ])
    const breaking = breakingChanges ? breakingChanges.split('\n').filter(line => line.trim()) : []
    const changelog = changelogChanges ? changelogChanges.split('\n').filter(line => line.trim()) : []

    return {
      breaking,
      changelog,
    }
  }

  /**
   * Creates a temporary file path for the head branch content
   */
  private createTempFilePath(fileName: string): string {
    const tempFileName = `temp_main_${fileName}`
    return path.join(process.cwd(), tempFileName)
  }

  /**
   * Retrieves head branch content for a file
   */
  private getHeadBranchContent(fileName: string): string {
    if (!this.oasdiffConfig) {
      throw new Error('OasDiff config not initialized')
    }

    const branchRef =
      process.env.CI === '1' ? `origin/${this.oasdiffConfig.headBranch}` : this.oasdiffConfig.headBranch

    return cp.execSync(`git show ${branchRef}:${fileName}`, {
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

    try {
      const currentFilePath = path.join(process.cwd(), config.outputFilepath!)

      if (!fs.existsSync(currentFilePath)) {
        result.error = `File ${config.outputFilepath!} does not exist in current branch`
        return result
      }

      const tempMainFilePath = this.createTempFilePath(path.basename(config.outputFilepath!))

      try {
        const mainContent = this.getHeadBranchContent(config.outputFilepath!)

        fs.mkdirSync(path.dirname(tempMainFilePath), { recursive: true })
        fs.writeFileSync(tempMainFilePath, mainContent)

        const { breaking, changelog } = this.compareSpecs(tempMainFilePath, currentFilePath)

        result.breaking = breaking
        result.changelog = changelog
        result.hasChanges = breaking.length > 0 || changelog.length > 0
      } catch (gitError) {
        result.error = `Could not retrieve ${config.outputFilepath!} from ${this.oasdiffConfig?.headBranch} branch: ${String(gitError)}`
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempMainFilePath)) {
          fs.unlinkSync(tempMainFilePath)
        }
      }
    } catch (error) {
      result.error = `Error processing ${openapiName}: ${String(error)}`
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
    DreamCLI.logger.logContinueProgress(
      `${this.colors.redBright}❌ ${this.colors.bright}${result.file}${this.colors.reset}${this.colors.redBright}: ${result.error}${this.colors.reset}`,
      { logPrefixColor: 'redBright' },
    )
  }

  /**
   * Log changes for a comparison result
   */
  private logChanges(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(
      `${this.colors.yellowBright}${this.colors.bright}${result.file}: HAS CHANGES${this.colors.reset}`,
      { logPrefixColor: 'yellowBright' },
    )
  }

  /**
   * Log breaking changes for a comparison result
   */
  private logBreakingChanges(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(
      `   ${this.colors.redBright}${this.colors.bright}🚨 BREAKING CHANGES:${this.colors.reset}`,
      { logPrefixColor: 'redBright' },
    )
    result.breaking.forEach(change => {
      DreamCLI.logger.logContinueProgress(
        `      ${this.colors.redBright}• ${this.colors.bright}${change}${this.colors.reset}`,
        { logPrefixColor: 'redBright' },
      )
    })
  }

  /**
   * Log changelog for a comparison result
   */
  private logChangelog(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(
      `   ${this.colors.blueBright}${this.colors.bright}📋 CHANGELOG:${this.colors.reset}`,
      { logPrefixColor: 'blueBright' },
    )
    const changelogLines = result.changelog
    changelogLines.forEach(line => {
      DreamCLI.logger.logContinueProgress(`      ${this.colors.bright}${line}${this.colors.reset}`, {
        logPrefixBgColor: 'bgWhite',
        logPrefixColor: 'white',
      })
    })
  }

  /**
   * Log no changes for a comparison result
   */
  private logNoChanges(result: ComparisonResult): void {
    DreamCLI.logger.logContinueProgress(
      `${this.colors.greenBright}✅ ${this.colors.bright}${result.file}${this.colors.reset}${this.colors.greenBright}: No changes${this.colors.reset}`,
      { logPrefixColor: 'greenBright' },
    )
  }

  /**
   * Log final summary and handle exit conditions
   */
  private logSummary(hasAnyChanges: boolean, hasBreakingChanges: boolean): void {
    DreamCLI.logger.logContinueProgress(`\n${this.colors.gray}${'='.repeat(60)}${this.colors.reset}`, {
      logPrefixColor: 'gray',
    })

    if (hasBreakingChanges) {
      DreamCLI.logger.logContinueProgress(
        `${this.colors.redBright}${this.colors.bright}🚨 CRITICAL: ${this.colors.reset} ${this.colors.bright} Breaking changes detected in current branch compared to ${this.oasdiffConfig?.headBranch}! Review before merging.${this.colors.reset}`,
        { logPrefixColor: 'redBright' },
      )
      DreamCLI.logger.logContinueProgress(`${this.colors.gray}${'='.repeat(60)}${this.colors.reset}`, {
        logPrefixColor: 'gray',
      })
      DreamCLI.logger.logContinueProgress(`${this.colors.gray}${'\n'.repeat(5)}${this.colors.reset}`, {
        logPrefixColor: 'gray',
      })

      throw new BreakingChangesDetectedInOpenApiSpecError(this.oasdiffConfig!)
    } else if (hasAnyChanges) {
      DreamCLI.logger.logContinueProgress(
        `${this.colors.yellow}📊 Summary: Some OpenAPI files have non-breaking changes in current branch compared to ${this.oasdiffConfig?.headBranch}${this.colors.reset}`,
        { logPrefixColor: 'yellow' },
      )
    } else {
      DreamCLI.logger.logContinueProgress(
        `${this.colors.green}📊 Summary: All OpenAPI files in current branch are identical to ${this.oasdiffConfig?.headBranch} branch${this.colors.reset}`,
        { logPrefixColor: 'green' },
      )
    }

    DreamCLI.logger.logContinueProgress(`${this.colors.gray}${'='.repeat(60)}${this.colors.reset}`, {
      logPrefixColor: 'gray',
    })
    DreamCLI.logger.logEndProgress(`${this.colors.gray}${'\n'.repeat(5)}${this.colors.reset}`, {
      logPrefixColor: 'gray',
    })
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
