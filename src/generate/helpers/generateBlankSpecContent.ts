export default function generateBlankSpecContent(name: string) {
  return `\
describe('${name}', () => {
  it.todo('add a test here to get started building ${name}')
})
`
}
