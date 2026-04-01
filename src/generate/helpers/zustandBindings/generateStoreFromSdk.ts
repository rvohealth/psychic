import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Reads the generated sdk.gen.ts file, extracts exported function names,
 * and generates a store.gen.ts file with Zustand stores wrapping each
 * SDK function.
 *
 * This is called during `psy sync` after @hey-api/openapi-ts has generated
 * the SDK, so that the store stays in sync with the API.
 */
export default async function generateZustandStoreFromSdk(outputDir: string) {
  const sdkPath = path.join(outputDir, 'sdk.gen.ts')
  const storePath = path.join(outputDir, 'store.gen.ts')

  let sdkContents: string
  try {
    sdkContents = (await fs.readFile(sdkPath)).toString()
  } catch {
    return // sdk.gen.ts doesn't exist yet, nothing to generate from
  }

  const functionNames = extractExportedFunctionNames(sdkContents)
  if (functionNames.length === 0) return

  const storeLines = functionNames.map(name => {
    const hookName = 'use' + name.charAt(0).toUpperCase() + name.slice(1)
    return `export const ${hookName} = createSdkStore(sdk.${name})`
  })

  const contents = `\
// This file is auto-generated during sync — do not edit
import { create } from 'zustand'
import * as sdk from './sdk.gen'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SdkFn = (...args: any[]) => Promise<{ data?: any; error?: any }>

interface SdkStore<TData, TArgs extends unknown[]> {
  data: TData | undefined
  error: unknown
  isLoading: boolean
  fetch: (...args: TArgs) => Promise<TData | undefined>
  reset: () => void
}

function createSdkStore<T extends SdkFn>(fn: T) {
  type TData = Awaited<ReturnType<T>>['data']
  return create<SdkStore<TData, Parameters<T>>>()((set) => ({
    data: undefined as TData | undefined,
    error: undefined as unknown,
    isLoading: false,

    fetch: async (...args: Parameters<T>) => {
      set({ isLoading: true, error: undefined })
      const { data, error } = await (fn as SdkFn)(...args)
      set({ data, error, isLoading: false })
      return data as TData | undefined
    },

    reset: () => set({ data: undefined, error: undefined, isLoading: false }),
  }))
}

${storeLines.join('\n')}
`

  await fs.writeFile(storePath, contents)
}

function extractExportedFunctionNames(sdkContents: string): string[] {
  const names: string[] = []
  const pattern = /export const (\w+)\s*=/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(sdkContents)) !== null) {
    names.push(match[1]!)
  }
  return names
}
