import puppeteer from 'puppeteer'
import fs from 'fs'

const URL =
  'https://www.soud.ru/bd/PROGRAMMA/BEER-2026/'

async function saveHtml() {
  const browser = await puppeteer.launch({
    headless: true,
  })

  const page = await browser.newPage()

  await page.goto(URL, {
    waitUntil: 'networkidle2',
  })

  await new Promise((resolve) =>
    setTimeout(resolve, 8000)
  )

  const html = await page.content()

  fs.writeFileSync(
    'src/data/soud-rendered.html',
    html
  )

  console.log('HTML SAVED')

  await browser.close()
}

saveHtml()