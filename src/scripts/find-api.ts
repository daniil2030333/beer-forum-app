import puppeteer from 'puppeteer'

const URL =
  'https://www.soud.ru/bd/PROGRAMMA/BEER-2026/'

async function findApi() {
  const browser = await puppeteer.launch({
    headless: true,
  })

  const page = await browser.newPage()

  page.on('response', async (response) => {
    const url = response.url()

    if (
      url.includes('api') ||
      url.includes('json') ||
      url.includes('program') ||
      url.includes('event')
    ) {
      console.log('\nFOUND:')
      console.log(url)
    }
  })

  await page.goto(URL, {
    waitUntil: 'networkidle2',
  })

  await new Promise((resolve) =>
  setTimeout(resolve, 5000)
)

  await browser.close()
}

findApi()