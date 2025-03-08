import { Page } from 'puppeteer'

export default async function getAllTextContentFromPage(page: Page) {
  // Evaluate and extract all text content on the page
  const allText = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const elements = document.body.querySelectorAll('*')

    const textContentArray: string[] = []

    elements.forEach(element => {
      if (element.textContent.trim() !== '') {
        textContentArray.push(element.innerText.trim())
      }
    })

    return textContentArray.join(' ')
  })

  return allText
}
