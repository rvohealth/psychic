export default async function expectNoSelector(
  selector: string,
  { text, timeout = 4000 }: { text?: string; timeout?: number } = {}
) {
  if (text) {
    await expect(page.locator(selector)).not.toMatchText(text, { timeout })
  } else {
    await expect(page).not.toHaveSelector(selector, { timeout })
  }
}
