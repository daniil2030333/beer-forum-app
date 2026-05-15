import axios from 'axios'
import fs from 'fs'
import { parse } from 'csv-parse/sync'

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1P2kqnwEa1qATUZqwpA-gmYgXU_jAAmBJycIaBDXq1tY/export?format=csv&gid=486939963'

async function loadProgram() {
  const response = await axios.get(CSV_URL)

  const records = parse(response.data, {
    columns: true,
    skip_empty_lines: true,
  })

  fs.writeFileSync(
    'src/data/raw-program.json',
    JSON.stringify(records, null, 2)
  )

  console.log(response.data.slice(0, 5000))
}

loadProgram()