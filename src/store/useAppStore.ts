import { create } from 'zustand'
import type { PreferenceTag, RouteResult, RouteDiff, Hall } from '../data/types'
import { planRoute } from '../algorithm/routePlanner'
import { halls } from '../data/mockData'

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

interface ConflictInfo {
  hasConflict: boolean
  message?: string
}

interface AppState {
  selectedTags: PreferenceTag[]
  currentTime: string
  closingTime: string
  lockedHallIds: string[]
  skippedHallIds: string[]
  routeResult: RouteResult | null
  previousRouteHallIds: string[]
  previousSkippedHallIds: string[]
  routeDiff: RouteDiff | null
  conflictMessage: string | null
  clearConflict: () => void
  setSelectedTags: (tags: PreferenceTag[]) => void
  toggleTag: (tag: PreferenceTag) => void
  setCurrentTime: (time: string) => void
  setClosingTime: (time: string) => void
  toggleLock: (hallId: string) => ConflictInfo
  toggleSkip: (hallId: string) => ConflictInfo
  generateRoute: () => void
  clearRoute: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedTags: [],
  currentTime: getCurrentTime(),
  closingTime: '17:30',
  lockedHallIds: [],
  skippedHallIds: [],
  routeResult: null,
  previousRouteHallIds: [],
  previousSkippedHallIds: [],
  routeDiff: null,
  conflictMessage: null,

  clearConflict: () => set({ conflictMessage: null }),

  setSelectedTags: (tags) => set({ selectedTags: tags }),

  toggleTag: (tag) => {
    const { selectedTags } = get()
    const next = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    set({ selectedTags: next })
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  setClosingTime: (time) => set({ closingTime: time }),

  toggleLock: (hallId) => {
    const { lockedHallIds, skippedHallIds, routeResult } = get()
    const hall = halls.find(h => h.id === hallId)
    const hallName = hall?.name || '该展厅'

    const isCurrentlyLocked = lockedHallIds.includes(hallId)

    if (!isCurrentlyLocked && skippedHallIds.includes(hallId)) {
      set({ conflictMessage: `「${hallName}」已被标记为暂不去，无法同时锁定。请先取消暂不去再锁定。` })
      return { hasConflict: true, message: `「${hallName}」已被标记为暂不去，无法同时锁定。` }
    }

    const next = isCurrentlyLocked
      ? lockedHallIds.filter(id => id !== hallId)
      : [...lockedHallIds, hallId]
    set({ lockedHallIds: next, conflictMessage: null })

    if (routeResult) {
      const { generateRoute } = get()
      setTimeout(() => generateRoute(), 0)
    }

    return { hasConflict: false }
  },

  toggleSkip: (hallId) => {
    const { lockedHallIds, skippedHallIds, routeResult, previousSkippedHallIds } = get()
    const hall = halls.find(h => h.id === hallId)
    const hallName = hall?.name || '该展厅'

    const isCurrentlySkipped = skippedHallIds.includes(hallId)

    if (!isCurrentlySkipped && lockedHallIds.includes(hallId)) {
      set({ conflictMessage: `「${hallName}」已被锁定，无法同时标记为暂不去。请先解锁再标记暂不去。` })
      return { hasConflict: true, message: `「${hallName}」已被锁定，无法同时标记为暂不去。` }
    }

    const prevSkipped = [...skippedHallIds]
    const next = isCurrentlySkipped
      ? skippedHallIds.filter(id => id !== hallId)
      : [...skippedHallIds, hallId]

    const addedSkippedHalls: Hall[] = []
    const removedSkippedHalls: Hall[] = []
    for (const id of next) {
      if (!prevSkipped.includes(id)) {
        const h = halls.find(h => h.id === id)
        if (h) addedSkippedHalls.push(h)
      }
    }
    for (const id of prevSkipped) {
      if (!next.includes(id)) {
        const h = halls.find(h => h.id === id)
        if (h) removedSkippedHalls.push(h)
      }
    }

    set({ skippedHallIds: next, conflictMessage: null })

    const currentDiff = get().routeDiff
    if (currentDiff || addedSkippedHalls.length > 0 || removedSkippedHalls.length > 0) {
      set({
        routeDiff: {
          added: currentDiff?.added || [],
          removed: currentDiff?.removed || [],
          addedSkipped: addedSkippedHalls,
          removedSkipped: removedSkippedHalls,
        }
      })
    }

    if (routeResult) {
      const { generateRoute } = get()
      setTimeout(() => generateRoute(), 0)
    }

    return { hasConflict: false }
  },

  generateRoute: () => {
    const { selectedTags, currentTime, closingTime, lockedHallIds, skippedHallIds, routeResult, previousSkippedHallIds } = get()

    const prevHallIds = routeResult
      ? routeResult.steps.map(s => s.hall.id)
      : []

    const result = planRoute(selectedTags, lockedHallIds, skippedHallIds, currentTime, closingTime)

    const newHallIds = result.steps.map(s => s.hall.id)

    const added: Hall[] = []
    const removed: Hall[] = []

    for (const id of newHallIds) {
      if (!prevHallIds.includes(id)) {
        const hall = halls.find(h => h.id === id)
        if (hall) added.push(hall)
      }
    }
    for (const id of prevHallIds) {
      if (!newHallIds.includes(id)) {
        const hall = halls.find(h => h.id === id)
        if (hall) removed.push(hall)
      }
    }

    const addedSkipped: Hall[] = []
    const removedSkipped: Hall[] = []
    for (const id of skippedHallIds) {
      if (!previousSkippedHallIds.includes(id)) {
        const hall = halls.find(h => h.id === id)
        if (hall) addedSkipped.push(hall)
      }
    }
    for (const id of previousSkippedHallIds) {
      if (!skippedHallIds.includes(id)) {
        const hall = halls.find(h => h.id === id)
        if (hall) removedSkipped.push(hall)
      }
    }

    const hasAnyDiff = prevHallIds.length > 0
      || addedSkipped.length > 0
      || removedSkipped.length > 0

    set({
      routeResult: result,
      previousRouteHallIds: prevHallIds,
      previousSkippedHallIds: [...skippedHallIds],
      routeDiff: hasAnyDiff ? { added, removed, addedSkipped, removedSkipped } : null,
    })
  },

  clearRoute: () => set({
    routeResult: null,
    previousRouteHallIds: [],
    previousSkippedHallIds: [],
    routeDiff: null,
  }),
}))
