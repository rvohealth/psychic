import { DreamCLI } from '@rvoh/dream'
import cp from 'child_process'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
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
  isDocker: boolean
}

/**
 * Colors for console output
 */
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
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',
}

export type PsychicOpenapiConfig = DefaultPsychicOpenapiOptions

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
 * Determines the best way to run oasdiff
 */
function getOasDiffConfig(): OasDiffConfig {
  if (hasOasDiffInstalled()) {
    DreamCLI.logger.logContinueProgress('Using local oasdiff installation...')
    return {
      command: 'oasdiff',
      isDocker: false,
    }
  }
  if (handleDockerInstall()) {
    DreamCLI.logger.logContinueProgress('Using Docker oasdiff installation...')
    const openApiDir = path.join(process.cwd(), 'openapi')
    return {
      command: `docker run --rm -v "${openApiDir}:/openapi" -w /openapi tufin/oasdiff`,
      isDocker: true,
    }
  }

  throw new Error(
    `⚠️ ${colors.red}${colors.bright}oasdiff not found.
    
    ${colors.reset}\n\n${colors.yellow}${colors.bright}Install it via the instructions here:
        https://github.com/tufin/oasdiff or 
        install Docker and we'll handle the rest.${colors.reset}\n\n`,
  )
}

/**
 * Converts file paths for Docker container
 */
function convertPathsForDocker(mainPath: string, currentPath: string, isDocker: boolean): [string, string] {
  if (!isDocker) {
    return [mainPath, currentPath]
  }

  const openApiDir = path.join(process.cwd(), 'openapi')
  const dockerMainPath = mainPath.replace(openApiDir, '/openapi')
  const dockerCurrentPath = currentPath.replace(openApiDir, '/openapi')

  return [dockerMainPath, dockerCurrentPath]
}

/**
 * Runs oasdiff command and returns the output
 */
function runOasDiffCommand(
  command: string,
  subcommand: string,
  mainPath: string,
  currentPath: string,
  flag?: string,
): string {
  try {
    const output = cp.execSync(
      `${command} ${subcommand} "${mainPath}" "${currentPath}" ${flag ? `--${flag}` : ''}`,
      {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    return output.trim()
  } catch (error) {
    // oasdiff returns non-zero exit code when breaking changes are found
    // The actual output is in the error message
    const errorOutput = error instanceof Error ? error.message : String(error)

    if (errorOutput.includes('Command failed')) {
      const lines = errorOutput.split('\n')
      return lines
        .filter(
          line =>
            line.trim() &&
            !line.includes('Command failed') &&
            !line.includes('Error:') &&
            !line.includes('at '),
        )
        .join('\n')
    }

    return errorOutput
  }
}

/**
 * Compares two OpenAPI files using oasdiff
 */
function compareSpecs(
  mainFilePath: string,
  currentFilePath: string,
  config: OasDiffConfig,
): Pick<ComparisonResult, 'breaking' | 'changelog'> {
  const [mainPath, currentPath] = convertPathsForDocker(mainFilePath, currentFilePath, config.isDocker)

  const breakingOutput = runOasDiffCommand(config.command, 'breaking', mainPath, currentPath, 'flatten-allof')
  const changelogOutput = runOasDiffCommand(
    config.command,
    'changelog',
    mainPath,
    currentPath,
    'flatten-allof',
  )

  const breakingChanges = breakingOutput ? breakingOutput.split('\n').filter(line => line.trim()) : []

  return {
    breaking: breakingChanges,
    changelog: changelogOutput,
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
function getMainBranchContent(fileName: string): string {
  const branchRef = process.env.CI === '1' ? 'origin/main' : 'main'

  return cp.execSync(`git show ${branchRef}:api/openapi/${fileName}`, {
    encoding: 'utf8',
    cwd: process.cwd(),
  })
}

/**
 * Compares a single OpenAPI file against main branch
 */
async function compareOpenApiFile(
  openapiName: string,
  config: PsychicOpenapiConfig,
  oasdiffConfig: OasDiffConfig,
): Promise<ComparisonResult> {
  const result: ComparisonResult = {
    file: openapiName,
    hasChanges: false,
    breaking: [],
    changelog: '',
  }

  try {
    const currentFilePath = path.join(process.cwd(), config.outputFilepath!)

    // Check if file exists in current branch
    if (!existsSync(currentFilePath)) {
      result.error = `File ${config.outputFilepath!} does not exist in current branch`
      return result
    }

    const tempMainFile = createTempFilePath(path.basename(config.outputFilepath!), oasdiffConfig.isDocker)

    try {
      // Get main branch content and write to temp file
      const mainContent = getMainBranchContent(path.basename(config.outputFilepath!))
      writeFileSync(tempMainFile, mainContent)

      // Compare using oasdiff
      const oasDiffResult = compareSpecs(tempMainFile, currentFilePath, oasdiffConfig)

      result.breaking = oasDiffResult.breaking
      result.changelog = oasDiffResult.changelog
      result.hasChanges = oasDiffResult.breaking.length > 0 || oasDiffResult.changelog.length > 0
    } catch (gitError) {
      result.error = `Could not retrieve ${config.outputFilepath!} from main branch: ${String(gitError)}`
    } finally {
      // Clean up temporary file
      if (existsSync(tempMainFile)) {
        unlinkSync(tempMainFile)
      }
    }
  } catch (error) {
    result.error = `Error processing ${openapiName}: ${String(error)}`
  }

  return result
}

/**
 * Check diffs for a single OpenAPI configuration
 */
async function checkSingleOpenapiDiff(openapiName: string, config: PsychicOpenapiConfig) {
  DreamCLI.logger.logContinueProgress(`[${openapiName}] checking diffs...`)

  try {
    const config_oasdiff = getOasDiffConfig()
    const result = await compareOpenApiFile(openapiName, config, config_oasdiff)

    if (result.error) {
      DreamCLI.logger.logContinueProgress(`[${openapiName}] Error: ${result.error}`)
      return
    }

    if (result.hasChanges) {
      DreamCLI.logger.logContinueProgress(`[${openapiName}] HAS CHANGES`)

      if (result.breaking.length > 0) {
        DreamCLI.logger.logContinueProgress(`[${openapiName}] 🚨 BREAKING CHANGES:`)

        result.breaking.forEach(change => {
          DreamCLI.logger.logContinueProgress(`[${openapiName}]   • ${change}`)
        })
      }

      if (result.changelog) {
        DreamCLI.logger.logContinueProgress(`[${openapiName}] 📋 CHANGELOG:`)

        const changelogLines = result.changelog.split('\n').filter(line => line.trim())
        changelogLines.forEach(line => {
          DreamCLI.logger.logContinueProgress(`[${openapiName}]   ${line}`)
        })
      }
    } else {
      DreamCLI.logger.logContinueProgress(`[${openapiName}] ✅ No changes`)
    }
  } catch (error) {
    DreamCLI.logger.logContinueProgress(`[${openapiName}] Error: ${String(error)}`)
  }
}

/**
 * Check for OpenAPI diffs if checkDiffs is enabled for any OpenAPI configuration
 */
async function compare(openapiConfigsWithCheckDiffs: [string, PsychicOpenapiConfig][]) {
  DreamCLI.logger.logStartProgress('checking OpenAPI diffs...')

  for (const [openapiName, config] of openapiConfigsWithCheckDiffs) {
    try {
      await checkSingleOpenapiDiff(openapiName, config)
    } catch (error) {
      DreamCLI.logger.logEndProgress(`Failed to check diffs for ${openapiName}: ${error}`)
      // Continue with other OpenAPI configs even if one fails
    }
  }

  DreamCLI.logger.logEndProgress()
}

export default {
  checkSingleOpenapiDiff,
  compare,
  compareOpenApiFile,
  compareSpecs,
  convertPathsForDocker,
  createTempFilePath,
  getMainBranchContent,
  getOasDiffConfig,
  hasOasDiffInstalled,
  runOasDiffCommand,
}
