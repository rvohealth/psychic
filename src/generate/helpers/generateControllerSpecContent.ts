export default function generateControllerSpecContent(name: string) {
  return `\
describe('${name}', () => {
  it.todo('add a test here to get started building ${name}')
})`
}
