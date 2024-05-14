import expectSelector from './expectSelector'

export default async function expectContent(...texts: string[]) {
  for (const text of texts) {
    try {
      await expect(page).toMatchText(new RegExp(text), { timeout: 4000 })
    } catch (err) {
      try {
        await expect(page).toHaveSelector(`body:has-text("${text}")`, { timeout: 4000 })
      } catch (err) {
        await expectSelector(`input[value="${text}"]`, { timeout: 4000 })
      }
    }
  }
}
