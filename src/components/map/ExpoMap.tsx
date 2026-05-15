'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LocateFixed, Minus, Plus, Search, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type Touch,
  type TouchEvent,
} from 'react'

import mapMeta from '@/data/map-meta.json'
import {
  borders,
  cn,
  inputClassName,
  radius,
} from '@/lib/design-system'
import { getInteractiveMapStands, type InteractiveMapStand } from '@/lib/map'

const mapWidth = mapMeta.width || 2240
const mapHeight = mapMeta.height || 3340
const maxZoom = 1.05
const defaultZoom = 0.18
const focusZoomMultiplier = 1.8

type Point = {
  x: number
  y: number
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function getStandTitle(stand: InteractiveMapStand) {
  return stand.companies.map((company) => company.name).join(', ')
}

function getDistance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function getMidpoint(first: Point, second: Point) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }
}

function clampZoom(value: number, minZoom = 0.12) {
  return Math.min(Math.max(value, minZoom), maxZoom)
}

export default function ExpoMap() {
  const searchParams = useSearchParams()
  const initialStand = searchParams.get('stand')
  const viewportRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const touchActiveRef = useRef(false)
  const lastTapRef = useRef(0)
  const gestureRef = useRef<{
    mode: 'pinch'
    startPan: Point
    startZoom: number
    startDistance?: number
    startMidpoint?: Point
  } | null>(null)

  const [query, setQuery] = useState('')
  const [selectedStand, setSelectedStand] = useState<string | null>(initialStand)
  const [zoom, setZoom] = useState(defaultZoom)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [mapImage, setMapImage] = useState('/maps/forum-map-clean.svg')

  const stands = useMemo(
    () => getInteractiveMapStands().filter((stand) => stand.companies.length > 0),
    []
  )
  const selected = useMemo(
    () => stands.find((stand) => stand.stand === selectedStand) ?? null,
    [stands, selectedStand]
  )

  const searchResults = useMemo(() => {
    const normalized = normalizeSearch(query)
    if (!normalized) {
      return []
    }

    return stands
      .filter((stand) => {
        const companyNames = stand.companies
          .map((company) => company.name.toLowerCase())
          .join(' ')

        return (
          stand.stand.includes(normalized) ||
          companyNames.includes(normalized)
        )
      })
      .slice(0, 8)
  }, [query, stands])

  const clampPan = useCallback((nextPan: Point, nextZoom: number) => {
    const viewport = viewportRef.current
    const viewportWidth = viewport?.clientWidth || 390
    const viewportHeight = viewport?.clientHeight || 600
    const scaledWidth = mapWidth * nextZoom
    const scaledHeight = mapHeight * nextZoom
    const x = scaledWidth <= viewportWidth
      ? (viewportWidth - scaledWidth) / 2
      : Math.min(Math.max(nextPan.x, viewportWidth - scaledWidth), 0)
    const y = scaledHeight <= viewportHeight
      ? 0
      : Math.min(Math.max(nextPan.y, viewportHeight - scaledHeight), 0)

    return { x, y }
  }, [])

  const getInitialView = useCallback(() => {
    const viewport = viewportRef.current
    const viewportWidth = viewport?.clientWidth || 390
    const viewportHeight = viewport?.clientHeight || 600
    const nextZoom = clampZoom(viewportHeight / mapHeight, 0)

    return {
      zoom: nextZoom,
      pan: clampPan({
        x: (viewportWidth - mapWidth * nextZoom) / 2,
        y: 0,
      }, nextZoom),
    }
  }, [clampPan])

  const resetMap = useCallback(() => {
    const initialView = getInitialView()
    setZoom(initialView.zoom)
    setPan(initialView.pan)
    setSelectedStand(null)
  }, [getInitialView])

  const centerStand = useCallback((stand: InteractiveMapStand, nextZoom = zoom) => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const minAllowedZoom = getInitialView().zoom
    const clampedZoom = clampZoom(nextZoom, minAllowedZoom)
    setZoom(clampedZoom)
    setPan(clampPan({
      x: viewport.clientWidth / 2 - stand.x * clampedZoom,
      y: viewport.clientHeight / 2 - stand.y * clampedZoom,
    }, clampedZoom))
  }, [clampPan, getInitialView, zoom])

  const chooseStand = useCallback((stand: InteractiveMapStand, shouldFocus = false) => {
    setSelectedStand(stand.stand)
    const initialView = getInitialView()
    centerStand(
      stand,
      shouldFocus ? Math.max(zoom, initialView.zoom * focusZoomMultiplier) : zoom
    )
  }, [centerStand, getInitialView, zoom])

  const zoomAroundPoint = useCallback((point: Point, nextZoom: number) => {
    const minAllowedZoom = getInitialView().zoom
    const clampedZoom = clampZoom(nextZoom, minAllowedZoom)
    const scale = clampedZoom / zoom

    setPan((current) => ({
      ...clampPan({
        x: point.x - (point.x - current.x) * scale,
        y: point.y - (point.y - current.y) * scale,
      }, clampedZoom),
    }))
    setZoom(clampedZoom)
  }, [clampPan, getInitialView, zoom])

  function getLocalPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function getTouchPoint(touch: Touch, element: HTMLDivElement) {
    const rect = element.getBoundingClientRect()

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (touchActiveRef.current) {
      return
    }

    const point = getLocalPoint(event)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Older mobile Safari/WebViews can throw here; touch handlers below cover them.
    }
    pointersRef.current.set(event.pointerId, point)

    const now = Date.now()
    if (now - lastTapRef.current < 280 && pointersRef.current.size === 1) {
      const initialView = getInitialView()
      const tapZoom = initialView.zoom * focusZoomMultiplier
      zoomAroundPoint(point, zoom < tapZoom ? tapZoom : initialView.zoom)
    }
    lastTapRef.current = now

    const pointers = [...pointersRef.current.values()]
    if (pointers.length >= 2) {
      gestureRef.current = {
        mode: 'pinch',
        startPan: pan,
        startZoom: zoom,
        startDistance: getDistance(pointers[0], pointers[1]),
        startMidpoint: getMidpoint(pointers[0], pointers[1]),
      }
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (touchActiveRef.current) {
      return
    }

    if (!pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, getLocalPoint(event))
    const gesture = gestureRef.current
    if (!gesture) {
      return
    }

    const pointers = [...pointersRef.current.values()]
    if (gesture.mode === 'pinch' && pointers.length >= 2 && gesture.startDistance && gesture.startMidpoint) {
      const midpoint = getMidpoint(pointers[0], pointers[1])
      const distance = getDistance(pointers[0], pointers[1])
      const nextZoom = clampZoom(
        gesture.startZoom * (distance / gesture.startDistance),
        getInitialView().zoom
      )
      const scale = nextZoom / gesture.startZoom

      setZoom(nextZoom)
      setPan(clampPan({
        x: midpoint.x - (gesture.startMidpoint.x - gesture.startPan.x) * scale,
        y: midpoint.y - (gesture.startMidpoint.y - gesture.startPan.y) * scale,
      }, nextZoom))
      return
    }

  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (touchActiveRef.current) {
      return
    }

    pointersRef.current.delete(event.pointerId)

    gestureRef.current = null
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 0) {
      return
    }

    touchActiveRef.current = true
    pointersRef.current.clear()

    const touches = Array.from(event.touches)
    const points = touches.map((touch) => getTouchPoint(touch, event.currentTarget))

    if (points.length >= 2) {
      event.preventDefault()
      gestureRef.current = {
        mode: 'pinch',
        startPan: pan,
        startZoom: zoom,
        startDistance: getDistance(points[0], points[1]),
        startMidpoint: getMidpoint(points[0], points[1]),
      }
      return
    }

    const point = points[0]
    const now = Date.now()

    if (now - lastTapRef.current < 280) {
      const initialView = getInitialView()
      const tapZoom = initialView.zoom * focusZoomMultiplier
      zoomAroundPoint(point, zoom < tapZoom ? tapZoom : initialView.zoom)
    }

    lastTapRef.current = now
    gestureRef.current = null
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const gesture = gestureRef.current
    if (!gesture || event.touches.length === 0) {
      return
    }

    event.preventDefault()

    const points = Array.from(event.touches).map((touch) =>
      getTouchPoint(touch, event.currentTarget)
    )

    if (gesture.mode === 'pinch' && points.length >= 2 && gesture.startDistance && gesture.startMidpoint) {
      const midpoint = getMidpoint(points[0], points[1])
      const distance = getDistance(points[0], points[1])
      const nextZoom = clampZoom(
        gesture.startZoom * (distance / gesture.startDistance),
        getInitialView().zoom
      )
      const scale = nextZoom / gesture.startZoom

      setZoom(nextZoom)
      setPan(clampPan({
        x: midpoint.x - (gesture.startMidpoint.x - gesture.startPan.x) * scale,
        y: midpoint.y - (gesture.startMidpoint.y - gesture.startPan.y) * scale,
      }, nextZoom))
      return
    }

  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length > 0) {
      return
    }

    touchActiveRef.current = false
    gestureRef.current = null
  }

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const initialView = getInitialView()
      setZoom(initialView.zoom)
      setPan(initialView.pan)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [getInitialView])

  useEffect(() => {
    const linkedStand = stands.find((stand) => stand.stand === initialStand)
    if (linkedStand) {
      window.setTimeout(() => {
        setSelectedStand(linkedStand.stand)
        const initialView = getInitialView()
        centerStand(linkedStand, initialView.zoom * focusZoomMultiplier)
      }, 120)
    }
  }, [centerStand, getInitialView, initialStand, stands])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="shrink-0 space-y-2 px-4 pb-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A7795F]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Компания или номер стенда"
            className={cn(inputClassName, 'w-full pl-11')}
          />
        </div>

        {searchResults.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {searchResults.map((stand) => (
              <button
                key={stand.stand}
                type="button"
                onClick={() => chooseStand(stand, true)}
                className={cn(
                  radius.badgeRadius,
                  'shrink-0 border border-[#F7941D]/30 bg-[#FFF4E6] px-3 py-2 text-left text-sm font-medium text-[#5A321E] transition-colors'
                )}
              >
                <span className="block font-semibold">Стенд {stand.stand}</span>
                <span className="block max-w-52 truncate text-xs text-[#8A654F]">
                  {getStandTitle(stand)}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section
        ref={viewportRef}
        data-map-viewport
        className="relative min-h-0 flex-1 overflow-hidden bg-white touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerEnd}
        onPointerUp={handlePointerEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchEnd}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapImage}
            alt="Схема экспозиции Форума ПИВО-2026"
            className="block h-full w-full max-w-none select-none"
            draggable={false}
            onError={() => setMapImage('/maps/forum-map.svg')}
          />
        </div>

        {stands.map((stand) => {
          const active = stand.stand === selectedStand
          const standWidth = Math.max((stand.width ?? 28) * zoom + 18, 32)
          const standHeight = Math.max((stand.height ?? 28) * zoom + 14, 32)

          return (
            <button
              key={stand.stand}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                chooseStand(stand)
              }}
              title={getStandTitle(stand)}
              className={cn(
                'absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-transparent transition-colors',
                active && 'z-20 border border-[#F7941D]/80 bg-[#F7941D]/10 ring-2 ring-[#F7941D]/20'
              )}
              style={{
                left: pan.x + stand.x * zoom + ((stand.width ?? 28) * zoom) / 2,
                top: pan.y + stand.y * zoom - ((stand.height ?? 28) * zoom) / 2,
                width: standWidth,
                height: standHeight,
              }}
              aria-label={`Стенд ${stand.stand}: ${getStandTitle(stand)}`}
            />
          )
        })}

        <div
          className="absolute right-3 top-3 flex flex-col gap-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => zoomAroundPoint({ x: 180, y: 240 }, zoom + 0.12)}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm transition-colors', radius.buttonRadius, borders.borderDefault)}
            aria-label="Увеличить карту"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => zoomAroundPoint({ x: 180, y: 240 }, zoom - 0.12)}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm transition-colors', radius.buttonRadius, borders.borderDefault)}
            aria-label="Уменьшить карту"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              resetMap()
            }}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm transition-colors', radius.buttonRadius, borders.borderDefault)}
            aria-label="Сбросить масштаб"
            title="Сбросить масштаб"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        {selected ? (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#4A2412]/20 p-4"
            onPointerDown={(event) => {
              event.stopPropagation()
              setSelectedStand(null)
            }}
          >
            <section
              className="w-full max-w-sm rounded-3xl border border-[#7A3F1D]/15 bg-[#FFFDF8] p-4 shadow-sm"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A7795F]">
                    Стенд
                  </p>
                  <h2 className="text-3xl font-bold leading-tight text-[#4A2412]">
                    {selected.stand}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStand(null)}
                  className={cn('flex h-10 w-10 items-center justify-center bg-[#FFF4E6] text-[#7A3F1D] transition-colors', radius.buttonRadius)}
                  aria-label="Закрыть карточку стенда"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {selected.companies.map((company) => (
                  <div
                    key={company.id}
                    className={cn(radius.inputRadius, borders.borderDefault, 'flex items-center justify-between gap-3 bg-[#FFF4E6] p-3')}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#4A2412]">
                        {company.name}
                      </p>
                      <p className="truncate text-xs text-[#8A654F]">
                        {[company.city, company.country].filter(Boolean).join(', ') || 'Экспонент'}
                      </p>
                    </div>
                    <Link
                      href={`/companies/${company.id}`}
                      className={cn('shrink-0 bg-[#4A2412] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7A3F1D]', radius.buttonRadius)}
                    >
                      Открыть
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
