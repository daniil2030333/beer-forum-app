import { chromium } from 'playwright'
import fs from 'fs'

type LoadedSpeaker = {
  name: string
  image: string
  href: string
}

async function loadSpeakers() {
  const browser = await chromium.launch({
    headless: true,
  })

  const page = await browser.newPage()

  await page.goto('https://www.beersochi.ru', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })

  await page.waitForTimeout(8000)

  const speakers = await page.evaluate(() => {
    const result: LoadedSpeaker[] = []

    const links = document.querySelectorAll('a')

    links.forEach((link) => {
      const href = link.getAttribute('href') || ''

      if (href.includes('speaker=')) {
        const name =
          link.textContent?.trim() || ''

        const img =
          link.querySelector('img')

        const image =
          img?.getAttribute('src') || ''

        if (name.length > 2) {
          result.push({
            name,
            image,
            href,
          })
        }
      }
    })

    return result
  })

  const unique = speakers.filter(
    (speaker, index, self) =>
      index ===
      self.findIndex(
        (s) => s.name === speaker.name
      )
  )

  fs.writeFileSync(
    'src/data/speakers.json',
    JSON.stringify(unique, null, 2)
  )

  console.log(unique.slice(0, 10))
  console.log(`Loaded ${unique.length} speakers`)

  await browser.close()
}

loadSpeakers()
