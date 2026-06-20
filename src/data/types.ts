export type PreferenceTag = '亲子' | '无障碍' | '短时长' | '重点文物'

export interface ClosedPeriod {
  start: string
  end: string
}

export interface Hall {
  id: string
  name: string
  stayMinutes: number
  tags: PreferenceTag[]
  closedPeriods: ClosedPeriod[]
  stairsOnly: boolean
  description: string
}

export interface WalkingEdge {
  fromId: string
  toId: string
  minutes: number
  stairsOnly: boolean
}

export interface RouteStep {
  hall: Hall
  arrivalTime: string
  departureTime: string
  walkMinutesFromPrev: number
  isWaiting: boolean
  waitMinutes: number
}

export interface RouteResult {
  steps: RouteStep[]
  totalWalkMinutes: number
  totalVisitMinutes: number
  totalTimeMinutes: number
  timeSufficient: boolean
  suggestedRemovals: Hall[]
  excludedHalls: Hall[]
  timeError?: string
  impossible?: boolean
  impossibleReason?: string
  allLockedVisited?: boolean
}

export interface UserPreferences {
  selectedTags: PreferenceTag[]
  currentTime: string
  closingTime: string
  lockedHallIds: string[]
}

export interface RouteDiff {
  added: Hall[]
  removed: Hall[]
}
