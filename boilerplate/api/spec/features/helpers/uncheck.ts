export default async function uncheck(checkboxGroupSelector: string, text: string) {
  await page.waitForSelector(`${checkboxGroupSelector} label:has-text("${text}") input:checked`, {
    timeout: 4000,
  })
  const checkboxLabelEl = await page.waitForSelector(`${checkboxGroupSelector} label:has-text("${text}")`, {
    timeout: 1000,
  })
  await checkboxLabelEl.click({ timeout: 4000 })
}
