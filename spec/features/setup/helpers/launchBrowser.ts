import puppeteer from 'puppeteer'

export default async function launchBrowser() {
  return await puppeteer.launch({
    browser: 'firefox',
    dumpio: process.env.DEBUG === '1',
    headless: true,
  })
}
