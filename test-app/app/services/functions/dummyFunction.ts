import fs from 'fs/promises'
import backgroundedFunction from '../../../../src/background/backgrounded-function'
import absoluteFilePath from '../../../../src/helpers/absoluteFilePath'

export default async function dummyDefaultFunction(a: string, b: string) {
  await fs.writeFile(absoluteFilePath('spec/tmp.txt'), `${a} 1 ${b}`)
}

export const dummyConstFunction = async (a: string, b: string) => {
  await fs.writeFile(absoluteFilePath('spec/tmp.txt'), `${a} 2 ${b}`)
}
export async function dummyNamedFunction(a: string, b: string) {
  await fs.writeFile(absoluteFilePath('spec/tmp.txt'), `${a} 3 ${b}`)
}

export const backgroundedDummyDefaultFunction = backgroundedFunction(dummyDefaultFunction, {
  filepath: __filename,
  defaultExport: true,
})
export const backgroundedDummyConstFunction = backgroundedFunction(dummyConstFunction, {
  filepath: __filename,
})
export const backgroundedDummyNamedFunction = backgroundedFunction(dummyNamedFunction, {
  filepath: __filename,
})
