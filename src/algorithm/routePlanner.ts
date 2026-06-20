import type { Hall, RouteResult, RouteStep, PreferenceTag } from '../data/types'
import { halls, getWalkingMinutes } from '../data/mockData'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isHallClosedAt(hall: Hall, timeMinutes: number): boolean {
  for (const period of hall.closedPeriods) {
    const start = timeToMinutes(period.start)
    const end = timeToMinutes(period.end)
    if (timeMinutes >= start && timeMinutes < end) return true
  }
  return false
}

function getWaitMinutes(hall: Hall, timeMinutes: number): number {
  for (const period of hall.closedPeriods) {
    const start = timeToMinutes(period.start)
    const end = timeToMinutes(period.end)
    if (timeMinutes >= start && timeMinutes < end) {
      return end - timeMinutes
    }
  }
  return 0
}

function filterCandidateHalls(
  selectedTags: PreferenceTag[],
  lockedHallIds: string[],
  accessible: boolean
): Hall[] {
  const isAccessible = accessible
  return halls.filter(h => {
    if (h.id === 'entrance' || h.id === 'exit') return false
    if (isAccessible && h.stairsOnly) return false
    if (lockedHallIds.includes(h.id)) return true
    if (selectedTags.length === 0) return true
    return h.tags.some(t => selectedTags.includes(t))
  })
}

function findNearestReachable(
  currentId: string,
  candidates: Hall[],
  accessible: boolean,
  currentMinutes: number,
  closingMinutes: number
): { hall: Hall; walkMinutes: number } | null {
  let best: { hall: Hall; walkMinutes: number } | null = null
  let bestScore = Infinity

  for (const hall of candidates) {
    const walk = getWalkingMinutes(currentId, hall.id, accessible)
    if (walk === null) continue

    const arrival = currentMinutes + walk
    const wait = getWaitMinutes(hall, arrival)
    const visitEnd = arrival + wait + hall.stayMinutes

    if (visitEnd > closingMinutes) continue

    const score = walk + wait * 0.5
    if (score < bestScore) {
      bestScore = score
      best = { hall, walkMinutes: walk }
    }
  }

  return best
}

function computeRoute(
  candidateHalls: Hall[],
  lockedHallIds: string[],
  accessible: boolean,
  currentTime: string,
  closingTime: string
): RouteResult {
  const startMinutes = timeToMinutes(currentTime)
  const closingMinutes = timeToMinutes(closingTime)
  const availableMinutes = closingMinutes - startMinutes

  const entrance = halls.find(h => h.id === 'entrance')!
  const exit = halls.find(h => h.id === 'exit')!

  const steps: RouteStep[] = []
  let currentMinutes = startMinutes
  let currentId = 'entrance'
  let totalWalk = 0
  let totalVisit = 0
  const visited = new Set<string>(['entrance'])

  steps.push({
    hall: entrance,
    arrivalTime: currentTime,
    departureTime: currentTime,
    walkMinutesFromPrev: 0,
    isWaiting: false,
    waitMinutes: 0,
  })

  const remaining = [...candidateHalls]
  const lockedSet = new Set(lockedHallIds)

  while (remaining.length > 0) {
    const next = findNearestReachable(currentId, remaining, accessible, currentMinutes, closingMinutes)

    if (!next) {
      const walkToExit = getWalkingMinutes(currentId, 'exit', accessible)
      if (walkToExit !== null) {
        const exitArrival = currentMinutes + walkToExit
        if (exitArrival + exit.stayMinutes <= closingMinutes) {
          totalWalk += walkToExit
          steps.push({
            hall: exit,
            arrivalTime: minutesToTime(exitArrival),
            departureTime: minutesToTime(exitArrival + exit.stayMinutes),
            walkMinutesFromPrev: walkToExit,
            isWaiting: false,
            waitMinutes: 0,
          })
          totalVisit += exit.stayMinutes
        }
      }

      const totalTime = totalWalk + totalVisit + steps.reduce((s, st) => s + st.waitMinutes, 0)
      const excluded = remaining
      const timeSufficient = currentMinutes + (walkToExit ?? 10) + exit.stayMinutes <= closingMinutes

      return {
        steps,
        totalWalkMinutes: totalWalk,
        totalVisitMinutes: totalVisit,
        totalTimeMinutes: totalTime,
        timeSufficient,
        suggestedRemovals: timeSufficient ? [] : computeSuggestedRemovals(remaining, lockedHallIds),
        excludedHalls: excluded,
      }
    }

    const { hall, walkMinutes } = next
    const arrival = currentMinutes + walkMinutes
    const wait = getWaitMinutes(hall, arrival)
    const departure = arrival + wait + hall.stayMinutes

    totalWalk += walkMinutes
    totalVisit += hall.stayMinutes

    steps.push({
      hall,
      arrivalTime: minutesToTime(arrival),
      departureTime: minutesToTime(departure),
      walkMinutesFromPrev: walkMinutes,
      isWaiting: wait > 0,
      waitMinutes: wait,
    })

    currentMinutes = departure
    currentId = hall.id
    visited.add(hall.id)

    const idx = remaining.findIndex(h => h.id === hall.id)
    if (idx >= 0) remaining.splice(idx, 1)
  }

  const walkToExit = getWalkingMinutes(currentId, 'exit', accessible)
  if (walkToExit !== null) {
    const exitArrival = currentMinutes + walkToExit
    if (exitArrival + exit.stayMinutes <= closingMinutes) {
      totalWalk += walkToExit
      steps.push({
        hall: exit,
        arrivalTime: minutesToTime(exitArrival),
        departureTime: minutesToTime(exitArrival + exit.stayMinutes),
        walkMinutesFromPrev: walkToExit,
        isWaiting: false,
        waitMinutes: 0,
      })
      totalVisit += exit.stayMinutes
    }
  }

  const totalWait = steps.reduce((s, st) => s + st.waitMinutes, 0)
  const totalTime = totalWalk + totalVisit + totalWait
  const lastStep = steps[steps.length - 1]
  const finalMinutes = lastStep ? timeToMinutes(lastStep.departureTime) : startMinutes
  const timeSufficient = finalMinutes <= closingMinutes

  return {
    steps,
    totalWalkMinutes: totalWalk,
    totalVisitMinutes: totalVisit,
    totalTimeMinutes: totalTime,
    timeSufficient,
    suggestedRemovals: timeSufficient ? [] : computeSuggestedRemovals(candidateHalls, lockedHallIds),
    excludedHalls: [],
  }
}

function computeSuggestedRemovals(
  hallsToConsider: Hall[],
  lockedHallIds: string[]
): Hall[] {
  return hallsToConsider
    .filter(h => !lockedHallIds.includes(h.id))
    .sort((a, b) => {
      if (a.stayMinutes !== b.stayMinutes) return b.stayMinutes - a.stayMinutes
      return a.tags.length - b.tags.length
    })
}

export function planRoute(
  selectedTags: PreferenceTag[],
  lockedHallIds: string[],
  currentTime: string,
  closingTime: string
): RouteResult {
  const accessible = selectedTags.includes('无障碍')
  const candidateHalls = filterCandidateHalls(selectedTags, lockedHallIds, accessible)

  if (candidateHalls.length === 0) {
    const entrance = halls.find(h => h.id === 'entrance')!
    const exit = halls.find(h => h.id === 'exit')!
    const walkToExit = getWalkingMinutes('entrance', 'exit', accessible) ?? 5
    const exitArrival = timeToMinutes(currentTime) + walkToExit

    return {
      steps: [
        {
          hall: entrance,
          arrivalTime: currentTime,
          departureTime: currentTime,
          walkMinutesFromPrev: 0,
          isWaiting: false,
          waitMinutes: 0,
        },
        {
          hall: exit,
          arrivalTime: minutesToTime(exitArrival),
          departureTime: minutesToTime(exitArrival + exit.stayMinutes),
          walkMinutesFromPrev: walkToExit,
          isWaiting: false,
          waitMinutes: 0,
        },
      ],
      totalWalkMinutes: walkToExit,
      totalVisitMinutes: exit.stayMinutes,
      totalTimeMinutes: walkToExit + exit.stayMinutes,
      timeSufficient: true,
      suggestedRemovals: [],
      excludedHalls: halls.filter(h => h.id !== 'entrance' && h.id !== 'exit'),
    }
  }

  const result = computeRoute(candidateHalls, lockedHallIds, accessible, currentTime, closingTime)

  if (!result.timeSufficient) {
    const removable = result.suggestedRemovals
    if (removable.length > 0) {
      const reducedCandidates = candidateHalls.filter(
        h => !removable.slice(0, 1).some(r => r.id === h.id)
      )
      const retry = computeRoute(reducedCandidates, lockedHallIds, accessible, currentTime, closingTime)
      if (retry.timeSufficient) {
        return retry
      }
      return retry
    }
  }

  return result
}

export { minutesToTime, timeToMinutes }
