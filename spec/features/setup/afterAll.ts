import rmTmpFile from '../../helpers/rmTmpFile'
// import { teardown as teardownDevServer } from 'jest-dev-server'

export default async () => {
  await rmTmpFile()
  // await teardownDevServer((globalThis as any).servers)
}
