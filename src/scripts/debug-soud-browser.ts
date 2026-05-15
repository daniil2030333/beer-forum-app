import puppeteer from 'puppeteer'

const URL =
  'https://www.soud.ru/bd/PROGRAMMA/BEER-2026/'

async function debugBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
  })

  const page = await browser.newPage()

  await page.goto(URL, {
    waitUntil: 'networkidle2',
  })

  await page.waitForSelector('body')

  const text = await page.evaluate(() => {
    return document.body.innerText
  })

  console.log(text.slice(0, 5000))

  await browser.close()
}

debugBrowser()