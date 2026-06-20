import { create } from 'zustand'
import type { PreferenceTag, RouteResult, RouteDiff, Hall } from '../data/types'
import { planRoute } from '../algorithm/routePlanner'
import { halls } from '../data/mockData'

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

interface AppState {
  selectedTags: PreferenceTag[]
  currentTime: string
  closingTime: string
  lockedHallIds: string[]
  routeResult: RouteResult | null
  previousRouteHallIds: string[]
  routeDiff: RouteDiff | null
  setSelectedTags: (tags: PreferenceTag[]) => void
  toggleTag: (tag: PreferenceTag) => void
  setCurrentTime: (time: string) => void
  setClosingTime: (time: string) => void
  toggleLock: (hallId: string) => void
  generateRoute: () => void
  clearRoute: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedTags: [],
  currentTime: getCurrentTime(),
  closingTime: '17:30',
  lockedHallIds: [],
  routeResult: null,
  previousRouteHallIds: [],
  routeDiff: null,

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
    const { lockedHallIds } = get()
    const next = lockedHallIds.includes(hallId)
      ? lockedHallIds.filter(id => id !== hallId)
      : [...lockedHallIds, hallId]
    set({ lockedHallIds: next })
  },

  generateRoute: () => {
    const { selectedTags, currentTime, closingTime, lockedHallIds, routeResult } = get()

    const prevHallIds = routeResult
      ? routeResult.steps.map(s => s.hall.id)
      : []

    const result = planRoute(selectedTags, lockedHallIds, currentTime, closingTime)

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

    set({
      routeResult: result,
      previousRouteHallIds: prevHallIds,
      routeDiff: prevHallIds.length > 0 ? { added, removed } : null,
    })
  },

  clearRoute: () => set({
    routeResult: null,
    previousRouteHallIds: [],
    routeDiff: null,
  }),
}))
