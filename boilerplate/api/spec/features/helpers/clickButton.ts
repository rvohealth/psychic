export default async function clickButton(text: string) {
  await page.locator(`button:text-is("${text}")`).click({ timeout: 4000 })
}
