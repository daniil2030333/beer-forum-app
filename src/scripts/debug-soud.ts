import axios from 'axios'
import * as cheerio from 'cheerio'

const URL =
  'https://www.soud.ru/bd/PROGRAMMA/BEER-2026/'

async function debug() {
  const { data } = await axios.get(URL)

  const $ = cheerio.load(data)

  console.log('TITLE:')
  console.log($('title').text())

  console.log('\nH1:')
  console.log($('h1').first().text())

  console.log('\nFIRST 20 HEADINGS:\n')

  $('h1, h2, h3, h4').each((i, el) => {
    if (i < 20) {
      console.log(
        `${el.tagName.toUpperCase()}:`,
        $(el).text().trim()
      )
    }
  })

  console.log('\nFIRST 20 DIV CLASSES:\n')

  const classes = new Set<string>()

  $('div').each((_, el) => {
    const cls = $(el).attr('class')

    if (cls) {
      classes.add(cls)
    }
  })

  Array.from(classes)
    .slice(0, 20)
    .forEach((cls) => {
      console.log(cls)
    })
}

debug()