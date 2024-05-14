// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function fillInput(selector: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await page.locator(selector).fill(value, { timeout: 4000 })
}
