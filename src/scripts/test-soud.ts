import axios from 'axios'
import * as cheerio from 'cheerio'

const URL =
  'https://www.soud.ru/bd/PROGRAMMA/BEER-2026/'

async function test() {
  const { data } = await axios.get(URL)

  const $ = cheerio.load(data)

  console.log($('title').text())

  console.log('Links found:', $('a').length)
}

test()