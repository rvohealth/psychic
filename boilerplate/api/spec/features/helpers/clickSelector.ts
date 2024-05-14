export default async function clickSelector(selector: string, { text }: { text?: string | RegExp } = {}) {
  await page.locator(selector, text ? { hasText: text } : undefined).click({ timeout: 4000 })
}
