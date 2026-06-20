import { halls, walkingEdges, getHallById, getWalkingMinutes } from "@/data/mockData"
import type { Hall, RouteStep, RouteResult, PreferenceTag } from "@/data/types"

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function getWaitMinutes(hall: Hall, arrivalMinutes: number): number {
  if (!hall.closedPeriods || hall.closedPeriods.length === 0) return 0

  for (const period of hall.closedPeriods) {
    const start = timeToMinutes(period.start)
    const end = timeToMinutes(period.end)
    if (arrivalMinutes >= start && arrivalMinutes < end) {
      return end - arrivalMinutes
    }
  }
  return 0
}

function filterCandidateHalls(
  selectedTags: PreferenceTag[],
  lockedHallIds: string[],
  accessible: boolean
): Hall[] {
  const candidates = halls.filter(h => {
    if (h.id === "entrance" || h.id === "exit") return false

    if (lockedHallIds.includes(h.id)) return true

    if (selectedTags.length === 0) return true

    if (h.tags && h.tags.some(tag => selectedTags.includes(tag))) {
      return true
    }

    return false
  })

  if (accessible) {
    return candidates.filter(h => !h.stairsOnly)
  }

  return candidates
}

function canReachExitFrom(
  hallId: string,
  currentMinutes: number,
  stayMinutes: number,
  closingMinutes: number,
  accessible: boolean
): boolean {
  const exit = halls.find(h => h.id === "exit")!
  const walk = getWalkingMinutes(hallId, "exit", accessible)
  if (walk === null) return false
  const wait = getWaitMinutes(exit, currentMinutes + walk)
  return currentMinutes + walk + wait + exit.stayMinutes + stayMinutes <= closingMinutes
}

function findNextHall(
  currentId: string,
  candidates: Hall[],
  lockedHalls: Hall[],
  accessible: boolean,
  currentMinutes: number,
  closingMinutes: number
): { hall: Hall; walkMinutes: number } | null {
  const remainingLocked = lockedHalls.filter(h => candidates.some(c => c.id === h.id))

  if (remainingLocked.length > 0) {
    let best: { hall: Hall; walkMinutes: number } | null = null
    let bestScore = Infinity
    for (const hall of remainingLocked) {
      const walk = getWalkingMinutes(currentId, hall.id, accessible)
      if (walk === null) continue
      const arrival = currentMinutes + walk
      const wait = getWaitMinutes(hall, arrival)
      const visitEnd = arrival + wait + hall.stayMinutes
      if (visitEnd > closingMinutes) continue
      if (!canReachExitFrom(hall.id, visitEnd, 0, closingMinutes, accessible)) continue
      const score = walk + wait * 0.5
      if (score < bestScore) {
        bestScore = score
        best = { hall, walkMinutes: walk }
      }
    }
    if (best) return best
    return null
  }

  const normalHalls = candidates.filter(h => !lockedHalls.some(lh => lh.id === h.id))
  if (normalHalls.length === 0) return null

  let best: { hall: Hall; walkMinutes: number } | null = null
  let bestScore = Infinity
  for (const hall of normalHalls) {
    const walk = getWalkingMinutes(currentId, hall.id, accessible)
    if (walk === null) continue
    const arrival = currentMinutes + walk
    const wait = getWaitMinutes(hall, arrival)
    const visitEnd = arrival + wait + hall.stayMinutes
    if (visitEnd > closingMinutes) continue
    if (!canReachExitFrom(hall.id, visitEnd, 0, closingMinutes, accessible)) continue
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
  const exit = halls.find(h => h.id === "exit")!
  const entrance = halls.find(h => h.id === "entrance")!
  const lockedHalls = candidateHalls.filter(h => lockedHallIds.includes(h.id))

  if (startMinutes >= closingMinutes) {
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
      ],
      totalWalkMinutes: 0,
      totalVisitMinutes: 0,
      totalTimeMinutes: 0,
      timeSufficient: false,
      suggestedRemovals: [],
      excludedHalls: [],
      timeError: "当前时间晚于闭馆时间，请检查时间设置",
    }
  }

  const walkFromEntranceToExit = getWalkingMinutes("entrance", "exit", accessible) ?? 10
  const exitWait = getWaitMinutes(exit, startMinutes + walkFromEntranceToExit)

  if (startMinutes + walkFromEntranceToExit + exitWait + exit.stayMinutes > closingMinutes) {
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
      ],
      totalWalkMinutes: 0,
      totalVisitMinutes: 0,
      totalTimeMinutes: 0,
      timeSufficient: false,
      suggestedRemovals: [],
      excludedHalls: candidateHalls,
      timeError: "剩余时间不足以走到出口，请延长参观时间或提早到达",
    }
  }

  const steps: RouteStep[] = [
    {
      hall: entrance,
      arrivalTime: currentTime,
      departureTime: currentTime,
      walkMinutesFromPrev: 0,
      isWaiting: false,
      waitMinutes: 0,
    },
  ]

  let currentMinutes = startMinutes
  let currentId = "entrance"
  let totalWalk = 0
  let totalVisit = 0
  const visitedHallIds = new Set<string>(["entrance"])

  let remainingCandidates = [...candidateHalls]

  while (remainingCandidates.length > 0) {
    const next = findNextHall(
      currentId,
      remainingCandidates,
      lockedHalls,
      accessible,
      currentMinutes,
      closingMinutes
    )

    if (!next) break

    const { hall, walkMinutes } = next
    const arrival = currentMinutes + walkMinutes
    const waitMin = getWaitMinutes(hall, arrival)
    const departure = arrival + waitMin + hall.stayMinutes

    totalWalk += walkMinutes
    totalVisit += hall.stayMinutes + waitMin

    steps.push({
      hall,
      arrivalTime: minutesToTime(arrival),
      departureTime: minutesToTime(departure),
      walkMinutesFromPrev: walkMinutes,
      isWaiting: waitMin > 0,
      waitMinutes: waitMin,
    })

    visitedHallIds.add(hall.id)
    currentMinutes = departure
    currentId = hall.id
    remainingCandidates = remainingCandidates.filter(h => h.id !== hall.id)
  }

  const walkToExit = getWalkingMinutes(currentId, "exit", accessible)
  if (walkToExit !== null) {
    const exitArrival = currentMinutes + walkToExit
    const exitWait2 = getWaitMinutes(exit, exitArrival)
    const exitDeparture = exitArrival + exitWait2 + exit.stayMinutes

    if (exitDeparture <= closingMinutes) {
      totalWalk += walkToExit
      totalVisit += exit.stayMinutes + exitWait2

      steps.push({
        hall: exit,
        arrivalTime: minutesToTime(exitArrival),
        departureTime: minutesToTime(exitDeparture),
        walkMinutesFromPrev: walkToExit,
        isWaiting: exitWait2 > 0,
        waitMinutes: exitWait2,
      })
    }
  }

  const allLockedVisited = lockedHallIds.every(id => visitedHallIds.has(id))
  const allVisited = candidateHalls.every(h => visitedHallIds.has(h.id))

  const suggestedRemovals = candidateHalls
    .filter(h => !visitedHallIds.has(h.id) && !lockedHallIds.includes(h.id))
    .sort((a, b) => b.stayMinutes - a.stayMinutes)

  const excludedHalls = halls.filter(
    h => h.id !== "entrance" && h.id !== "exit" && !visitedHallIds.has(h.id)
  )

  return {
    steps,
    totalWalkMinutes: totalWalk,
    totalVisitMinutes: totalVisit,
    totalTimeMinutes: totalWalk + totalVisit,
    timeSufficient: allVisited,
    suggestedRemovals,
    excludedHalls,
    allLockedVisited,
  }
}

function planRoute(
  selectedTags: PreferenceTag[],
  lockedHallIds: string[],
  currentTime: string,
  closingTime: string
): RouteResult {
  const accessible = selectedTags.includes("无障碍")
  const candidateHalls = filterCandidateHalls(selectedTags, lockedHallIds, accessible)
  const lockedHalls = candidateHalls.filter(h => lockedHallIds.includes(h.id))

  if (candidateHalls.length === 0) {
    const entrance = halls.find(h => h.id === "entrance")!
    const exit = halls.find(h => h.id === "exit")!
    const walkToExit = getWalkingMinutes("entrance", "exit", accessible) ?? 5
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
      excludedHalls: halls.filter(h => h.id !== "entrance" && h.id !== "exit"),
    }
  }

  const result = computeRoute(candidateHalls, lockedHallIds, accessible, currentTime, closingTime)

  if (result.timeError) {
    return result
  }

  if (lockedHallIds.length > 0 && !result.allLockedVisited) {
    return {
      ...result,
      timeSufficient: false,
      impossible: true,
      impossibleReason: "时间不足以参观所有锁定展厅，请减少锁定展厅数量或延长参观时间",
    }
  }

  return result
}

export { minutesToTime, timeToMinutes, planRoute }
