export default async function expectNoContent(text: string) {
  await expect(page).not.toHaveSelector(`*:has-text("${text}")`, { timeout: 4000 })
}
