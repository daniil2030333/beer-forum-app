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
const queryDebounceMs = 180
const dragThreshold = 6

type Point = {
  x: number
  y: number
}

type Transform = {
  pan: Point
  zoom: number
}

type ViewportMetrics = {
  width: number
  height: number
}

type Gesture =
  | {
      mode: 'pan'
      pointerId: number
      startPoint: Point
      startPan: Point
      moved: boolean
    }
  | {
      mode: 'pinch'
      pointerIds: [number, number]
      startDistance: number
      startMidpoint: Point
      startPan: Point
      startZoom: number
      moved: boolean
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

function applyLayerTransform(element: HTMLElement | null, transform: Transform) {
  if (!element) {
    return
  }

  element.style.transform = `translate3d(${transform.pan.x}px, ${transform.pan.y}px, 0) scale(${transform.zoom})`
}

function getHitSize(value?: number) {
  return Math.max(value ?? 28, 150)
}

export default function ExpoMap() {
  const searchParams = useSearchParams()
  const initialStand = searchParams.get('stand')
  const viewportRef = useRef<HTMLDivElement>(null)
  const mapLayerRef = useRef<HTMLDivElement>(null)
  const viewportMetricsRef = useRef<ViewportMetrics>({ width: 390, height: 600 })
  const viewportRectRef = useRef<DOMRect | null>(null)
  const transformRef = useRef<Transform>({
    pan: { x: 0, y: 0 },
    zoom: defaultZoom,
  })
  const minZoomRef = useRef(defaultZoom)
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<Gesture | null>(null)
  const rafRef = useRef<number | null>(null)
  const movedSincePointerDownRef = useRef(false)
  const tapStandRef = useRef<string | null>(null)
  const initStartedAtRef = useRef<number | null>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [highlightedStand, setHighlightedStand] = useState<string | null>(initialStand)
  const [selectedStand, setSelectedStand] = useState<string | null>(null)
  const [view, setView] = useState<Transform>({
    pan: { x: 0, y: 0 },
    zoom: defaultZoom,
  })
  const [mapImage, setMapImage] = useState('/maps/forum-map-clean.svg')

  const stands = useMemo(
    () => getInteractiveMapStands().filter((stand) => stand.companies.length > 0),
    []
  )
  const selected = useMemo(
    () => stands.find((stand) => stand.stand === selectedStand) ?? null,
    [stands, selectedStand]
  )
  const activeStand = selectedStand ?? highlightedStand
  const standsById = useMemo(() => new Map(stands.map((stand) => [stand.stand, stand])), [stands])

  const searchResults = useMemo(() => {
    const normalized = normalizeSearch(debouncedQuery)
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
  }, [debouncedQuery, stands])

  const clampPan = useCallback((nextPan: Point, nextZoom: number) => {
    const { width: viewportWidth, height: viewportHeight } = viewportMetricsRef.current
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

  const setTransform = useCallback((nextTransform: Transform, commit = false) => {
    transformRef.current = nextTransform

    if (commit) {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      applyLayerTransform(mapLayerRef.current, nextTransform)
      setView(nextTransform)
      return
    }

    if (rafRef.current !== null) {
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      applyLayerTransform(mapLayerRef.current, transformRef.current)
    })
  }, [])

  const getInitialView = useCallback(() => {
    const { width: viewportWidth, height: viewportHeight } = viewportMetricsRef.current
    const nextZoom = clampZoom(viewportHeight / mapHeight, 0)
    minZoomRef.current = nextZoom

    return {
      zoom: nextZoom,
      pan: clampPan({
        x: (viewportWidth - mapWidth * nextZoom) / 2,
        y: 0,
      }, nextZoom),
    }
  }, [clampPan])

  const resetMap = useCallback(() => {
    setTransform(getInitialView(), true)
    setHighlightedStand(null)
    setSelectedStand(null)
  }, [getInitialView, setTransform])

  const centerStand = useCallback((stand: InteractiveMapStand, nextZoom = transformRef.current.zoom) => {
    const { width, height } = viewportMetricsRef.current
    const clampedZoom = clampZoom(nextZoom, minZoomRef.current)
    setTransform({
      zoom: clampedZoom,
      pan: clampPan({
        x: width / 2 - stand.x * clampedZoom,
        y: height / 2 - stand.y * clampedZoom,
      }, clampedZoom),
    }, true)
  }, [clampPan, setTransform])

  const chooseStand = useCallback((
    stand: InteractiveMapStand,
    shouldFocus = false,
    shouldOpenModal = false
  ) => {
    setHighlightedStand(stand.stand)
    setSelectedStand(shouldOpenModal ? stand.stand : null)

    if (shouldFocus) {
      centerStand(
        stand,
        Math.max(transformRef.current.zoom, minZoomRef.current * focusZoomMultiplier)
      )
    }
  }, [centerStand])

  const zoomAroundPoint = useCallback((point: Point, nextZoom: number) => {
    const current = transformRef.current
    const clampedZoom = clampZoom(nextZoom, minZoomRef.current)
    const scale = clampedZoom / current.zoom

    setTransform({
      zoom: clampedZoom,
      pan: clampPan({
        x: point.x - (point.x - current.pan.x) * scale,
        y: point.y - (point.y - current.pan.y) * scale,
      }, clampedZoom),
    }, true)
  }, [clampPan, setTransform])

  const getLocalPoint = useCallback((event: PointerEvent) => {
    const rect = viewportRectRef.current
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, queryDebounceMs)

    return () => window.clearTimeout(timeout)
  }, [query])

  useLayoutEffect(() => {
    initStartedAtRef.current = performance.now()

    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const updateMetrics = () => {
      viewportRectRef.current = viewport.getBoundingClientRect()
      viewportMetricsRef.current = {
        width: viewport.clientWidth || 390,
        height: viewport.clientHeight || 600,
      }
      setTransform(getInitialView(), true)
    }

    updateMetrics()

    const resizeObserver = new ResizeObserver(updateMetrics)
    resizeObserver.observe(viewport)

    return () => {
      resizeObserver.disconnect()
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [getInitialView, setTransform])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const startedAt = initStartedAtRef.current
    if (startedAt !== null) {
      console.info('[map:init]', Math.round(performance.now() - startedAt))
    }
    console.info('[map:stands]', stands.length)
  }, [stands.length])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const startPinch = () => {
      const pointers = [...pointersRef.current.entries()]
      if (pointers.length < 2) {
        return
      }

      const first = pointers[0]
      const second = pointers[1]
      const startDistance = getDistance(first[1], second[1])
      if (startDistance <= 0) {
        return
      }

      gestureRef.current = {
        mode: 'pinch',
        pointerIds: [first[0], second[0]],
        startDistance,
        startMidpoint: getMidpoint(first[1], second[1]),
        startPan: transformRef.current.pan,
        startZoom: transformRef.current.zoom,
        moved: false,
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }
      if (event.target instanceof Element && event.target.closest('[data-map-control]')) {
        return
      }

      viewportRectRef.current = viewport.getBoundingClientRect()
      movedSincePointerDownRef.current = false
      tapStandRef.current = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-stand]')?.dataset.stand ?? null
        : null

      try {
        viewport.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is best-effort on older WebViews.
      }

      const point = getLocalPoint(event)
      pointersRef.current.set(event.pointerId, point)

      if (pointersRef.current.size >= 2) {
        startPinch()
        return
      }

      gestureRef.current = {
        mode: 'pan',
        pointerId: event.pointerId,
        startPoint: point,
        startPan: transformRef.current.pan,
        moved: false,
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return
      }

      const point = getLocalPoint(event)
      pointersRef.current.set(event.pointerId, point)
      const gesture = gestureRef.current
      if (!gesture) {
        return
      }

      if (gesture.mode === 'pan') {
        if (gesture.pointerId !== event.pointerId) {
          return
        }

        const dx = point.x - gesture.startPoint.x
        const dy = point.y - gesture.startPoint.y
        const moved = Math.hypot(dx, dy) > dragThreshold
        gesture.moved ||= moved
        movedSincePointerDownRef.current ||= moved

        setTransform({
          zoom: transformRef.current.zoom,
          pan: clampPan({
            x: gesture.startPan.x + dx,
            y: gesture.startPan.y + dy,
          }, transformRef.current.zoom),
        })
        return
      }

      const first = pointersRef.current.get(gesture.pointerIds[0])
      const second = pointersRef.current.get(gesture.pointerIds[1])
      if (!first || !second) {
        return
      }

      const midpoint = getMidpoint(first, second)
      const distance = getDistance(first, second)
      const nextZoom = clampZoom(
        gesture.startZoom * (distance / gesture.startDistance),
        minZoomRef.current
      )
      const scale = nextZoom / gesture.startZoom
      const moved = Math.abs(distance - gesture.startDistance) > dragThreshold ||
        getDistance(midpoint, gesture.startMidpoint) > dragThreshold

      gesture.moved ||= moved
      movedSincePointerDownRef.current ||= moved

      setTransform({
        zoom: nextZoom,
        pan: clampPan({
          x: midpoint.x - (gesture.startMidpoint.x - gesture.startPan.x) * scale,
          y: midpoint.y - (gesture.startMidpoint.y - gesture.startPan.y) * scale,
        }, nextZoom),
      })
    }

    const handlePointerEnd = (event: PointerEvent) => {
      const pointerCount = pointersRef.current.size
      const gesture = gestureRef.current
      const tappedStand = tapStandRef.current

      pointersRef.current.delete(event.pointerId)

      try {
        viewport.releasePointerCapture(event.pointerId)
      } catch {
        // Matching the best-effort capture above.
      }

      if (pointerCount === 1 && gesture?.mode === 'pan' && !gesture.moved && tappedStand) {
        const stand = standsById.get(tappedStand)
        if (stand) {
          chooseStand(stand, false, true)
        }
      }

      tapStandRef.current = null

      if (pointersRef.current.size === 1) {
        const [remainingId, remainingPoint] = [...pointersRef.current.entries()][0]
        gestureRef.current = {
          mode: 'pan',
          pointerId: remainingId,
          startPoint: remainingPoint,
          startPan: transformRef.current.pan,
          moved: true,
        }
        movedSincePointerDownRef.current = true
        setTransform(transformRef.current, true)
        return
      }

      gestureRef.current = null
      setTransform(transformRef.current, true)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
    }

    viewport.addEventListener('pointerdown', handlePointerDown)
    viewport.addEventListener('pointermove', handlePointerMove)
    viewport.addEventListener('pointerup', handlePointerEnd)
    viewport.addEventListener('pointercancel', handlePointerEnd)
    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewport.removeEventListener('pointerdown', handlePointerDown)
      viewport.removeEventListener('pointermove', handlePointerMove)
      viewport.removeEventListener('pointerup', handlePointerEnd)
      viewport.removeEventListener('pointercancel', handlePointerEnd)
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [chooseStand, clampPan, getLocalPoint, setTransform, standsById])

  useEffect(() => {
    const linkedStand = stands.find((stand) => stand.stand === initialStand)
    if (!linkedStand) {
      return
    }

    const timeout = window.setTimeout(() => {
      setHighlightedStand(linkedStand.stand)
      setSelectedStand(null)
      centerStand(linkedStand, minZoomRef.current * focusZoomMultiplier)
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [centerStand, initialStand, stands])

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
                  'shrink-0 border border-[#F7941D]/30 bg-[#FFF4E6] px-3 py-2 text-left text-sm font-medium text-[#5A321E]'
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
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-[#FAF6F0]"
      >
        <div
          ref={mapLayerRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `translate3d(${view.pan.x}px, ${view.pan.y}px, 0) scale(${view.zoom})`,
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

          {stands.map((stand) => {
            const active = stand.stand === activeStand
            const standWidth = stand.width ?? 28
            const standHeight = stand.height ?? 28
            const hitWidth = getHitSize(standWidth)
            const hitHeight = getHitSize(standHeight)

            return (
              <button
                key={stand.stand}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (movedSincePointerDownRef.current) {
                    return
                  }
                  chooseStand(stand, false, true)
                }}
                title={getStandTitle(stand)}
                data-stand={stand.stand}
                className={cn(
                  'absolute z-10 bg-transparent p-0',
                  active && 'z-20'
                )}
                style={{
                  left: stand.x + standWidth / 2 - hitWidth / 2,
                  top: stand.y - standHeight / 2 - hitHeight / 2,
                  width: hitWidth,
                  height: hitHeight,
                }}
                aria-label={`Стенд ${stand.stand}: ${getStandTitle(stand)}`}
              />
            )
          })}

          {activeStand ? (() => {
            const stand = standsById.get(activeStand)
            if (!stand) {
              return null
            }

            const standWidth = stand.width ?? 28
            const pinSize = 132

            return (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-30 flex items-center justify-center drop-shadow-sm"
                style={{
                  left: stand.x + standWidth / 2,
                  top: stand.y,
                  width: pinSize,
                  height: pinSize,
                  color: 'orangered',
                  WebkitTextFillColor: 'orangered',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: pinSize * 0.9,
                  fontWeight: 800,
                  lineHeight: 1,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                ✔︎
              </div>
            )
          })() : null}
        </div>

        <div
          data-map-control
          className="absolute right-3 top-3 flex flex-col gap-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => zoomAroundPoint({ x: 180, y: 240 }, transformRef.current.zoom + 0.12)}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
            aria-label="Увеличить карту"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => zoomAroundPoint({ x: 180, y: 240 }, transformRef.current.zoom - 0.12)}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
            aria-label="Уменьшить карту"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={resetMap}
            className={cn('flex h-11 w-11 items-center justify-center bg-[#FFFDF8]/95 text-[#7A3F1D] shadow-sm', radius.buttonRadius, borders.borderDefault)}
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
                  className={cn('flex h-10 w-10 items-center justify-center bg-[#FFF4E6] text-[#7A3F1D]', radius.buttonRadius)}
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
                      className={cn('shrink-0 bg-[#4A2412] px-3 py-2 text-sm font-semibold text-white', radius.buttonRadius)}
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
