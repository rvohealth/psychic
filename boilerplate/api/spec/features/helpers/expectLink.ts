import expectSelector from './expectSelector'

export default async function expectLink(text: string) {
  await expectSelector('a', { text })
}
