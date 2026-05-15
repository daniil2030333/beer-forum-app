import fs from 'node:fs'
import path from 'node:path'

import companies from '@/data/companies.json'
import type { Company } from '@/lib/types/company'

type Matrix = [number, number, number, number, number, number]

type MapStand = {
  stand: string
  x: number
  y: number
  width?: number
  height?: number
}

type StandMatch = {
  companyId: string
  company: string
  stand: string
  coordinates: MapStand
  clickable: true
}

const root = process.cwd()
const publicMapPath = path.join(root, 'public', 'beerforum-map.svg')
const fallbackMapPath = path.join(root, 'beerforum-map.svg')
const preparedMapPath = path.join(root, 'public', 'maps', 'forum-map.svg')
const cleanMapPath = path.join(root, 'public', 'maps', 'forum-map-clean.svg')
const mapStandsPath = path.join(root, 'src', 'data', 'map-stands.json')
const mapReportPath = path.join(root, 'src', 'data', 'map-report.json')
const mapMetaPath = path.join(root, 'src', 'data', 'map-meta.json')

const identity: Matrix = [1, 0, 0, 1, 0, 0]

function round(value: number) {
  return Number(value.toFixed(2))
}

function multiply(left: Matrix, right: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = left
  const [a2, b2, c2, d2, e2, f2] = right

  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ]
}

function transformPoint(matrix: Matrix, x: number, y: number) {
  const [a, b, c, d, e, f] = matrix

  return {
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  }
}

function parseNumbers(value: string) {
  return value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((number) => Number.isFinite(number))
}

function parseTransform(transform?: string): Matrix {
  if (!transform) {
    return identity
  }

  let matrix = identity
  const transformPattern = /([a-zA-Z]+)\(([^)]*)\)/g
  let match: RegExpExecArray | null

  while ((match = transformPattern.exec(transform)) !== null) {
    const [, name, rawValues] = match
    const values = parseNumbers(rawValues)
    let next = identity

    if (name === 'matrix' && values.length >= 6) {
      next = values.slice(0, 6) as Matrix
    }

    if (name === 'translate') {
      next = [1, 0, 0, 1, values[0] ?? 0, values[1] ?? 0]
    }

    if (name === 'scale') {
      const scaleX = values[0] ?? 1
      const scaleY = values[1] ?? scaleX
      next = [scaleX, 0, 0, scaleY, 0, 0]
    }

    if (name === 'rotate') {
      const angle = ((values[0] ?? 0) * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const rotate: Matrix = [cos, sin, -sin, cos, 0, 0]

      if (values.length >= 3) {
        const [degrees, cx = 0, cy = 0] = values
        const radians = (degrees * Math.PI) / 180
        const localCos = Math.cos(radians)
        const localSin = Math.sin(radians)
        next = multiply(
          multiply([1, 0, 0, 1, cx, cy], [localCos, localSin, -localSin, localCos, 0, 0]),
          [1, 0, 0, 1, -cx, -cy]
        )
      } else {
        next = rotate
      }
    }

    matrix = multiply(matrix, next)
  }

  return matrix
}

function getAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}="([^"]+)"`))
  return match?.[1]
}

function decodeXmlText(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, '')
    .trim()
}

function extractFirstCoordinate(value?: string) {
  if (!value) {
    return undefined
  }

  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

function extractFontSize(tag: string) {
  const style = getAttribute(tag, 'style') ?? ''
  const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)px/)
  return match ? Number(match[1]) : 36
}

function estimateScale(matrix: Matrix) {
  const [a, b, c, d] = matrix

  return {
    x: Math.hypot(a, b) || 1,
    y: Math.hypot(c, d) || Math.hypot(a, b) || 1,
  }
}

function isStandNumber(value: string) {
  return /^\d{1,3}$/.test(value)
}

function extractStands(svg: string): MapStand[] {
  const stands = new Map<string, MapStand>()
  const matrixStack: Matrix[] = [identity]
  const tokenPattern = /<g\b[^>]*>|<\/g>|<text\b[\s\S]*?<\/text>/gi
  let tokenMatch: RegExpExecArray | null

  while ((tokenMatch = tokenPattern.exec(svg)) !== null) {
    const token = tokenMatch[0]

    if (token.startsWith('</g')) {
      if (matrixStack.length > 1) {
        matrixStack.pop()
      }
      continue
    }

    if (token.startsWith('<g')) {
      const current = matrixStack[matrixStack.length - 1]
      const next = parseTransform(getAttribute(token, 'transform'))
      matrixStack.push(multiply(current, next))
      continue
    }

    const textTag = token.match(/^<text\b[^>]*>/)?.[0]
    if (!textTag) {
      continue
    }

    const stand = decodeXmlText(token)
    if (!isStandNumber(stand) || stands.has(stand)) {
      continue
    }

    const rawX = extractFirstCoordinate(getAttribute(textTag, 'x'))
    const rawY = extractFirstCoordinate(getAttribute(textTag, 'y'))
    if (rawX == null || rawY == null) {
      continue
    }

    const matrix = matrixStack[matrixStack.length - 1]
    const point = transformPoint(matrix, rawX, rawY)
    const fontSize = extractFontSize(textTag)
    const scale = estimateScale(matrix)

    stands.set(stand, {
      stand,
      x: round(point.x),
      y: round(point.y),
      width: round(stand.length * fontSize * 0.62 * scale.x),
      height: round(fontSize * scale.y),
    })
  }

  return [...stands.values()].sort((a, b) => Number(a.stand) - Number(b.stand))
}

function normalizeStand(value?: string) {
  if (!value) {
    return null
  }

  const normalized = value.trim()
  if (!normalized || normalized === '-' || normalized === '—') {
    return null
  }

  const match = normalized.match(/\d+/)
  return match?.[0] ?? null
}

function optimizeSvg(svg: string) {
  return svg
    .replace(/<\?xml[^>]*>\s*/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trimStart()
}

function getViewBox(svg: string) {
  const match = svg.match(/viewBox="([^"]+)"/i)
  const [x = 0, y = 0, width = 0, height = 0] = match
    ? parseNumbers(match[1])
    : [0, 0, 0, 0]

  return {
    x,
    y,
    width,
    height,
  }
}

function cleanSvg(svg: string) {
  const viewBox = getViewBox(svg)
  const optimized = optimizeSvg(svg)
    .replace(/fill:rgb\(43,42,41\)/g, 'fill:#4A2412')
    .replace(/stroke:rgb\(43,42,41\)/g, 'stroke:#4A2412')
    .replace(/stroke:rgb\(92,63,36\)/g, 'stroke:#7A3F1D')
    .replace(/stroke:rgb\(167,95,74\)/g, 'stroke:#7A3F1D')
    .replace(/fill:rgb\(243,147,20\)/g, 'fill:#7A3F1D')
    .replace(/stroke-width:4px/g, 'stroke-width:3px')
    .replace(/stroke-width:3px/g, 'stroke-width:2.4px')
    .replace(/stroke-width:2px/g, 'stroke-width:2px')
    .replace(/stroke-width:0\.29px/g, 'stroke-width:0.2px')
    .replace(/stroke-width:0\.31px/g, 'stroke-width:0.2px')
    .replace(/stroke-width:0\.22px/g, 'stroke-width:0.4px')
    .replace(/<rect\b(?![^>]*\brx=)([^>]*fill:#4A2412[^>]*)\/>/g, '<rect rx="4" ry="4"$1/>')
    .replace(
      /<svg\b([^>]*)>/,
      '<svg$1 shape-rendering="geometricPrecision" text-rendering="optimizeLegibility">'
    )

  return optimized.replace(
    /<svg\b([^>]*)>/,
    `<svg$1>
  <rect x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" fill="#FFFDF8"/>
  <rect x="${viewBox.x + 24}" y="${viewBox.y + 24}" width="${Math.max(viewBox.width - 48, 0)}" height="${Math.max(viewBox.height - 48, 0)}" rx="36" fill="#FAF6EF" opacity="0.58"/>`
  )
}

function findSourceMap() {
  if (fs.existsSync(publicMapPath)) {
    return publicMapPath
  }

  if (fs.existsSync(fallbackMapPath)) {
    return fallbackMapPath
  }

  throw new Error(
    'Map SVG not found. Add public/beerforum-map.svg or beerforum-map.svg.'
  )
}

function buildReport(stands: MapStand[], sourcePath: string) {
  const standMap = new Map(stands.map((stand) => [stand.stand, stand]))
  const companiesByStand = new Map<string, Company[]>()

  for (const company of companies as Company[]) {
    const stand = normalizeStand(company.stand)
    if (!stand) {
      continue
    }

    const list = companiesByStand.get(stand) ?? []
    list.push(company)
    companiesByStand.set(stand, list)
  }

  const matchedCompanies: StandMatch[] = []
  const unmatchedCompanies = []

  for (const [stand, standCompanies] of companiesByStand) {
    const coordinates = standMap.get(stand)

    for (const company of standCompanies) {
      if (coordinates) {
        matchedCompanies.push({
          companyId: company.id,
          company: company.name,
          stand,
          coordinates,
          clickable: true,
        })
      } else {
        unmatchedCompanies.push({
          companyId: company.id,
          company: company.name,
          stand,
        })
      }
    }
  }

  const standsWithoutCompanies = stands
    .filter((stand) => !companiesByStand.has(stand.stand))
    .map((stand) => stand.stand)

  const checkedStands = ['61', '86', '146', '147', '98', '131'].map((stand) => ({
    stand,
    existsOnMap: standMap.has(stand),
    matchedCompanies: companiesByStand.get(stand)?.map((company) => ({
      id: company.id,
      name: company.name,
    })) ?? [],
  }))

  return {
    source: path.relative(root, sourcePath),
    totalStandsOnMap: stands.length,
    matchedCompanies,
    matchedCompanyCount: matchedCompanies.length,
    unmatchedCompanies,
    unmatchedCompanyCount: unmatchedCompanies.length,
    standsWithoutCompanies,
    standsWithoutCompanyCount: standsWithoutCompanies.length,
    checkedStands,
  }
}

function main() {
  const sourcePath = findSourceMap()
  const sourceSvg = fs.readFileSync(sourcePath, 'utf8')
  const viewBox = getViewBox(sourceSvg)
  const preparedSvg = optimizeSvg(sourceSvg)
  const cleanedSvg = cleanSvg(sourceSvg)
  const stands = extractStands(sourceSvg)

  fs.mkdirSync(path.dirname(preparedMapPath), { recursive: true })
  fs.writeFileSync(preparedMapPath, preparedSvg)
  fs.writeFileSync(cleanMapPath, cleanedSvg)
  fs.writeFileSync(publicMapPath, preparedSvg)
  fs.writeFileSync(
    mapMetaPath,
    `${JSON.stringify({ viewBox, width: viewBox.width, height: viewBox.height }, null, 2)}\n`
  )
  fs.writeFileSync(mapStandsPath, `${JSON.stringify(stands, null, 2)}\n`)
  fs.writeFileSync(
    mapReportPath,
    `${JSON.stringify(buildReport(stands, sourcePath), null, 2)}\n`
  )

  console.info(
    `Map built: ${stands.length} stands, source ${path.relative(root, sourcePath)}`
  )
}

main()
