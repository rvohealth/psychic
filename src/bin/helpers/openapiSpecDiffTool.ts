import { DreamCLI } from '@rvoh/dream'
import cp from 'child_process'
import fs from 'fs'
import * as path from 'node:path'
import type { DefaultPsychicOpenapiOptions } from '../../psychic-app/index.js'

/**
 * Interface to hold the result of a comparison
 * between the current local OpenAPI specification and the main branch
 * for a given OpenAPI file
 */
export interface ComparisonResult {
  file: string
  hasChanges: boolean
  breaking: string[]
  changelog: string
  error?: string
}

/**
 * Interface to hold the configuration for oasdiff
 */
export interface OasDiffConfig {
  command: string
  baseArgs: string[]
  isDocker: boolean
  headBranch: string
}

export type PsychicOpenapiConfig = DefaultPsychicOpenapiOptions

const colors = {
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

/**
 * Checks if oasdiff is installed locally
 */
function hasOasDiffInstalled(): boolean {
  try {
    cp.execSync('oasdiff --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Checks if Docker is installed and pulls the oasdiff image
 */
function handleDockerInstall(): boolean {
  try {
    cp.execSync('docker --version', { stdio: 'ignore' })
    cp.execSync('docker pull tufin/oasdiff', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Fetch the head branch of a remote using git remote show origin or default to main
 */
function getHeadBranch(): string {
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
 * Determines the best way to run oasdiff
 */
function getOasDiffConfig(): OasDiffConfig {
  const headBranch = getHeadBranch()

  if (hasOasDiffInstalled()) {
    DreamCLI.logger.logContinueProgress('Using local oasdiff installation...')
    return {
      command: 'oasdiff',
      baseArgs: [],
      isDocker: false,
      headBranch,
    }
  }
  if (handleDockerInstall()) {
    DreamCLI.logger.logContinueProgress('Using Docker oasdiff installation...')
    const openApiDir = path.join(process.cwd(), 'openapi')
    return {
      command: 'docker',
      baseArgs: ['run', '--rm', '-v', `${openApiDir}:/openapi`, '-w', '/openapi', 'tufin/oasdiff'],
      isDocker: true,
      headBranch,
    }
  }

  throw new Error(
    `⚠️ oasdiff not found.
    
    Install it via the instructions here:
        https://github.com/tufin/oasdiff or 
        install Docker and we'll handle the rest.`,
  )
}

/**
 * Converts file paths for Docker container
 */
function convertPathsForDocker(mainPath: string, currentPath: string): [string, string] {
  const openApiDir = path.join(process.cwd(), 'openapi')
  const dockerMainPath = mainPath.replace(openApiDir, '/openapi')
  const dockerCurrentPath = currentPath.replace(openApiDir, '/openapi')

  return [dockerMainPath, dockerCurrentPath]
}

/**
 * Runs oasdiff command and returns the output
 */
function runOasDiffCommand(
  config: OasDiffConfig,
  subcommand: string,
  mainPath: string,
  currentPath: string,
  flag?: string,
): string {
  const args = [...config.baseArgs, subcommand, mainPath, currentPath]
  if (flag) {
    args.push(`--${flag}`)
  }

  // const output = cp.execSync(builtCommand, {
  //   encoding: 'utf8',
  //   cwd: process.cwd(),
  //   stdio: ['pipe', 'pipe', 'pipe'],
  // })
  const output = cp.execFileSync(config.command, args, {
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
function compareSpecs(
  config: OasDiffConfig,
  mainFilePath: string,
  currentFilePath: string,
): Pick<ComparisonResult, 'breaking' | 'changelog'> {
  if (config.isDocker) {
    ;[mainFilePath, currentFilePath] = convertPathsForDocker(mainFilePath, currentFilePath)
  }

  const breakingChanges = runOasDiffCommand(
    config,
    'breaking',
    mainFilePath,
    currentFilePath,
    'flatten-allof',
  )
  const changelog = runOasDiffCommand(config, 'changelog', mainFilePath, currentFilePath, 'flatten-allof')
  const breaking = breakingChanges ? breakingChanges.split('\n').filter(line => line.trim()) : []

  return {
    breaking,
    changelog,
  }
}

/**
 * Creates a temporary file path for the main branch content
 */
function createTempFilePath(fileName: string, isDocker: boolean): string {
  const tempFileName = `temp_main_${fileName}`
  return isDocker ? path.join(process.cwd(), 'openapi', tempFileName) : path.join(process.cwd(), tempFileName)
}

/**
 * Retrieves main branch content for a file
 */
function getHeadBranchContent(fileName: string, headBranchName: string): string {
  const branchRef = process.env.CI === '1' ? `origin/${headBranchName}` : headBranchName

  return cp.execSync(`git show ${branchRef}:api/openapi/${fileName}`, {
    encoding: 'utf8',
    cwd: process.cwd(),
  })
}

/**
 * Compares a single OpenAPI file against main branch
 */
function compareConfig(
  openapiName: string,
  config: PsychicOpenapiConfig,
  oasdiffConfig: OasDiffConfig,
): ComparisonResult {
  const result: ComparisonResult = {
    file: openapiName,
    hasChanges: false,
    breaking: [],
    changelog: '',
  }

  try {
    const currentFilePath = path.join(process.cwd(), config.outputFilepath!)

    if (!fs.existsSync(currentFilePath)) {
      result.error = `File ${config.outputFilepath!} does not exist in current branch`
      return result
    }

    const tempMainFile = createTempFilePath(path.basename(config.outputFilepath!), oasdiffConfig.isDocker)

    try {
      const mainContent = getHeadBranchContent(
        path.basename(config.outputFilepath!),
        oasdiffConfig.headBranch,
      )

      fs.writeFileSync(tempMainFile, mainContent)

      const oasDiffResult = compareSpecs(oasdiffConfig, tempMainFile, currentFilePath)

      result.breaking = oasDiffResult.breaking
      result.changelog = oasDiffResult.changelog
      result.hasChanges = oasDiffResult.breaking.length > 0 || oasDiffResult.changelog.length > 0
    } catch (gitError) {
      result.error = `Could not retrieve ${config.outputFilepath!} from ${oasdiffConfig.headBranch} branch: ${String(gitError)}`
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempMainFile)) {
        fs.unlinkSync(tempMainFile)
      }
    }
  } catch (error) {
    result.error = `Error processing ${openapiName}: ${String(error)}`
  }

  return result
}

/**
 * Check for OpenAPI diffs if checkDiffs is enabled for any OpenAPI configuration
 */
function compare(openapiConfigs: [string, PsychicOpenapiConfig][]): void {
  const results: ComparisonResult[] = []

  DreamCLI.logger.logStartProgress(
    `${colors.cyanBright}🔍 Comparing current OpenAPI Specs against main...${colors.reset}\n`,
    { logPrefixColor: 'cyanBright' },
  )
  const oasdiffConfig = getOasDiffConfig()

  for (const [openapiName, config] of openapiConfigs) {
    const result = compareConfig(openapiName, config, oasdiffConfig)
    results.push(result)
  }

  let hasAnyChanges = false
  let hasBreakingChanges = false

  for (const result of results) {
    if (result.error) {
      DreamCLI.logger.logContinueProgress(
        `${colors.redBright}❌ ${colors.bright}${result.file}${colors.reset}${colors.redBright}: ${result.error}${colors.reset}`,
        { logPrefixColor: 'redBright' },
      )
    } else if (result.hasChanges) {
      DreamCLI.logger.logContinueProgress(
        `${colors.yellowBright}${colors.bright}${result.file}: HAS CHANGES${colors.reset}`,
        { logPrefixColor: 'yellowBright' },
      )
      hasAnyChanges = true

      if (result.breaking.length > 0) {
        DreamCLI.logger.logContinueProgress(
          `   ${colors.redBright}${colors.bright}🚨 BREAKING CHANGES:${colors.reset}`,
          { logPrefixColor: 'redBright' },
        )
        result.breaking.forEach(change => {
          DreamCLI.logger.logContinueProgress(
            `      ${colors.redBright}• ${colors.bright}${change}${colors.reset}`,
            { logPrefixColor: 'redBright' },
          )
        })
        hasBreakingChanges = true
      }

      if (result.changelog) {
        DreamCLI.logger.logContinueProgress(
          `   ${colors.blueBright}${colors.bright}📋 CHANGELOG:${colors.reset}`,
          { logPrefixColor: 'blueBright' },
        )
        const changelogLines = result.changelog.split('\n').filter(line => line.trim())
        changelogLines.forEach(line => {
          DreamCLI.logger.logContinueProgress(`      ${colors.bright}${line}${colors.reset}`, {
            logPrefixBgColor: 'bgWhite',
            logPrefixColor: 'white',
          })
        })
      }
    } else {
      DreamCLI.logger.logContinueProgress(
        `${colors.greenBright}✅ ${colors.bright}${result.file}${colors.reset}${colors.greenBright}: No changes${colors.reset}`,
        { logPrefixColor: 'greenBright' },
      )
    }
  }

  DreamCLI.logger.logContinueProgress(`\n${colors.gray}${'='.repeat(60)}${colors.reset}`, {
    logPrefixColor: 'gray',
  })

  if (hasBreakingChanges) {
    DreamCLI.logger.logContinueProgress(
      `${colors.redBright}${colors.bright}🚨 CRITICAL: ${colors.reset} ${colors.bright} Breaking changes detected in current branch compared to main! Review before merging.${colors.reset}`,
      { logPrefixColor: 'redBright' },
    )
    DreamCLI.logger.logContinueProgress(`${colors.gray}${'='.repeat(60)}${colors.reset}`, {
      logPrefixColor: 'gray',
    })
    DreamCLI.logger.logContinueProgress(`${colors.gray}${'\n'.repeat(5)}${colors.reset}`, {
      logPrefixColor: 'gray',
    })

    process.exit(1)
  } else if (hasAnyChanges) {
    DreamCLI.logger.logContinueProgress(
      `${colors.yellow}📊 Summary: Some OpenAPI files have non-breaking changes in current branch compared to main${colors.reset}`,
      { logPrefixColor: 'yellow' },
    )
  } else {
    DreamCLI.logger.logContinueProgress(
      `${colors.green}📊 Summary: All OpenAPI files in current branch are identical to main branch${colors.reset}`,
      { logPrefixColor: 'green' },
    )
  }

  DreamCLI.logger.logContinueProgress(`${colors.gray}${'='.repeat(60)}${colors.reset}`, {
    logPrefixColor: 'gray',
  })
  DreamCLI.logger.logEndProgress(`${colors.gray}${'\n'.repeat(5)}${colors.reset}`, { logPrefixColor: 'gray' })
}

export default {
  compare,
}
