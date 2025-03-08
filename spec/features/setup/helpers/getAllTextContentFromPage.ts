import { Page } from 'puppeteer'

export default async function getAllTextContentFromPage(page: Page) {
  // Evaluate and extract all text content on the page
  const allText = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const elements = document.body.querySelectorAll('*')

    const textContentArray: string[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(elements as any[]).forEach(element => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (element.textContent.trim() !== '') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        textContentArray.push(element.innerText.trim())
      }
    })

    return textContentArray.join(' ')
  })

  return allText
}
