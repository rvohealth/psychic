export default async function attachFile(selector: string, testFile: string) {
  await page.locator(selector).setInputFiles('spec/support/' + testFile)
}
