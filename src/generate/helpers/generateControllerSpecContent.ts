export default function generateControllerSpecContent(name: string) {
  return `\
// import { describe as context } from '@jest/globals'

describe('${name}', () => {
  it.todo('add a test here to get started building ${name}')
})`
}
