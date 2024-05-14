export default async function expectSelector(
  selector: string,
  { text, timeout = 4000 }: { text?: string; timeout?: number } = {}
) {
  await expect(page).toHaveSelector(text ? `${selector}:has-text("${text}")` : selector, {
    state: 'visible',
    timeout,
  })
}
