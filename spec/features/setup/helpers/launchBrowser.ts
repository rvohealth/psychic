import puppeteer from 'puppeteer'

export default async function launchBrowser() {
  return await puppeteer.launch({
    browser: 'firefox',
    dumpio: true,
    headless: true,
  })
}
