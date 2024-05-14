import clickSelector from './clickSelector'

export default async function toggle(checkboxSelector: string) {
  await clickSelector(checkboxSelector)
}
