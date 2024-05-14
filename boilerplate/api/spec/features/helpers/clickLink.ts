export default async function clickLink(text: string) {
  await page.locator(`a:has-text("${text}")`).first().click({ timeout: 4000 })
}
