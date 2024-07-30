import { primaryKeyTypes } from '@rvohealth/dream'
import fs from 'fs/promises'

export async function readHowyadoinFile(filePath: string) {
  return (await fs.readFile(`./howyadoin/${filePath}`)).toString()
}

export async function removeHowyadoinDir() {
  try {
    await fs.rmdir('./howyadoin', { recursive: true })
  } catch (_) {
    // noop
  }
}

export function expectAppName(appName: string, appTsContent: string) {
  expect(appTsContent).toMatch(
    `
  psy.appName = '${appName}'
`,
  )
}

export function expectRedis(redisEnabled: boolean, appTsContent: string) {
  expect(appTsContent).toMatch(
    `
  psy.useRedis = ${redisEnabled}

`,
  )
}

export function expectWs(wsEnabled: boolean, appTsContent: string) {
  expect(appTsContent).toMatch(
    `
  psy.useWs = ${wsEnabled}

`,
  )
}

export function expectApiOnly(apiOnlyEnabled: boolean, appTsContent: string) {
  expect(appTsContent).toMatch(
    `
  psy.apiOnly = ${apiOnlyEnabled}

`,
  )
}

export function expectPrimaryKey(primaryKey: (typeof primaryKeyTypes)[number], dreamYmlContent: string) {
  expect(dreamYmlContent).toMatch(
    `\
primary_key_type: '${primaryKey}'
`,
  )
}

export async function expectApiNodeModulesInstalled() {
  const packageJson = await readHowyadoinFile('api/node_modules/@rvohealth/psychic/package.json')
  expect(packageJson).toMatch('@rvohealth/psychic')
}

export async function removeProjectDir(projectName: string) {
  try {
    await fs.rmdir(`./${projectName}`, { recursive: true })
  } catch (_) {
    // noop
  }
}

export async function expectReactClient() {
  // TODO: add spec assertions related to react build
}

export async function expectVueClient() {
  // TODO: add spec assertions related to vue build
}
