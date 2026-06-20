import type { Hall, WalkingEdge } from './types'

export const halls: Hall[] = [
  {
    id: 'entrance',
    name: '入口大厅',
    stayMinutes: 0,
    tags: [],
    closedPeriods: [],
    stairsOnly: false,
    description: '博物馆主入口，领取导览资料',
  },
  {
    id: 'bronze',
    name: '古代青铜器展厅',
    stayMinutes: 25,
    tags: ['重点文物'],
    closedPeriods: [],
    stairsOnly: false,
    description: '商周青铜礼器精品，国之重器',
  },
  {
    id: 'painting',
    name: '书画珍品馆',
    stayMinutes: 30,
    tags: ['重点文物', '短时长'],
    closedPeriods: [],
    stairsOnly: false,
    description: '宋元明清书画名家真迹',
  },
  {
    id: 'family',
    name: '亲子互动体验区',
    stayMinutes: 40,
    tags: ['亲子'],
    closedPeriods: [],
    stairsOnly: false,
    description: '手工拓印、考古模拟等亲子项目',
  },
  {
    id: 'ceramics',
    name: '陶瓷艺术展厅',
    stayMinutes: 20,
    tags: ['短时长'],
    closedPeriods: [],
    stairsOnly: false,
    description: '从原始瓷到明清官窑精品',
  },
  {
    id: 'nature',
    name: '自然历史展厅',
    stayMinutes: 35,
    tags: ['亲子'],
    closedPeriods: [{ start: '12:00', end: '13:00' }],
    stairsOnly: false,
    description: '恐龙化石、矿物标本与生态环境',
  },
  {
    id: 'special',
    name: '临时特展厅',
    stayMinutes: 25,
    tags: ['重点文物'],
    closedPeriods: [{ start: '12:00', end: '13:00' }],
    stairsOnly: false,
    description: '当期国际交流特展，限时展出',
  },
  {
    id: 'silkroad',
    name: '丝路文明展厅',
    stayMinutes: 30,
    tags: ['重点文物'],
    closedPeriods: [],
    stairsOnly: false,
    description: '丝绸之路文物与多元文化交融',
  },
  {
    id: 'folk',
    name: '民俗文化馆',
    stayMinutes: 20,
    tags: ['短时长'],
    closedPeriods: [],
    stairsOnly: true,
    description: '传统节庆、民间工艺与生活记忆',
  },
  {
    id: 'digital',
    name: '数字互动展厅',
    stayMinutes: 35,
    tags: ['亲子', '短时长'],
    closedPeriods: [],
    stairsOnly: false,
    description: 'VR沉浸体验与数字化文物互动',
  },
  {
    id: 'jade',
    name: '玉器珍品展厅',
    stayMinutes: 25,
    tags: ['重点文物', '短时长'],
    closedPeriods: [{ start: '12:00', end: '13:00' }],
    stairsOnly: true,
    description: '新石器时代至清代玉器精华',
  },
  {
    id: 'exit',
    name: '出口纪念品店',
    stayMinutes: 15,
    tags: [],
    closedPeriods: [],
    stairsOnly: false,
    description: '文创产品与纪念品选购',
  },
]

export const walkingEdges: WalkingEdge[] = [
  { fromId: 'entrance', toId: 'bronze', minutes: 2, stairsOnly: false },
  { fromId: 'entrance', toId: 'painting', minutes: 3, stairsOnly: false },
  { fromId: 'entrance', toId: 'family', minutes: 5, stairsOnly: false },
  { fromId: 'bronze', toId: 'painting', minutes: 3, stairsOnly: false },
  { fromId: 'bronze', toId: 'ceramics', minutes: 4, stairsOnly: false },
  { fromId: 'bronze', toId: 'silkroad', minutes: 5, stairsOnly: false },
  { fromId: 'painting', toId: 'ceramics', minutes: 2, stairsOnly: false },
  { fromId: 'painting', toId: 'folk', minutes: 3, stairsOnly: true },
  { fromId: 'painting', toId: 'special', minutes: 4, stairsOnly: false },
  { fromId: 'family', toId: 'nature', minutes: 2, stairsOnly: false },
  { fromId: 'family', toId: 'digital', minutes: 3, stairsOnly: false },
  { fromId: 'ceramics', toId: 'nature', minutes: 4, stairsOnly: false },
  { fromId: 'ceramics', toId: 'special', minutes: 3, stairsOnly: false },
  { fromId: 'ceramics', toId: 'folk', minutes: 2, stairsOnly: true },
  { fromId: 'nature', toId: 'digital', minutes: 3, stairsOnly: false },
  { fromId: 'nature', toId: 'special', minutes: 4, stairsOnly: false },
  { fromId: 'special', toId: 'silkroad', minutes: 3, stairsOnly: false },
  { fromId: 'special', toId: 'jade', minutes: 2, stairsOnly: true },
  { fromId: 'silkroad', toId: 'jade', minutes: 3, stairsOnly: true },
  { fromId: 'silkroad', toId: 'folk', minutes: 4, stairsOnly: true },
  { fromId: 'folk', toId: 'jade', minutes: 2, stairsOnly: true },
  { fromId: 'folk', toId: 'digital', minutes: 5, stairsOnly: true },
  { fromId: 'digital', toId: 'exit', minutes: 3, stairsOnly: false },
  { fromId: 'nature', toId: 'exit', minutes: 5, stairsOnly: false },
  { fromId: 'jade', toId: 'exit', minutes: 4, stairsOnly: true },
  { fromId: 'silkroad', toId: 'exit', minutes: 6, stairsOnly: false },
  { fromId: 'ceramics', toId: 'exit', minutes: 6, stairsOnly: false },
  { fromId: 'bronze', toId: 'exit', minutes: 7, stairsOnly: false },
  { fromId: 'family', toId: 'exit', minutes: 4, stairsOnly: false },
  { fromId: 'special', toId: 'exit', minutes: 5, stairsOnly: false },
  { fromId: 'painting', toId: 'exit', minutes: 6, stairsOnly: false },
  { fromId: 'entrance', toId: 'ceramics', minutes: 4, stairsOnly: false },
  { fromId: 'entrance', toId: 'special', minutes: 6, stairsOnly: false },
  { fromId: 'entrance', toId: 'nature', minutes: 7, stairsOnly: false },
  { fromId: 'bronze', toId: 'family', minutes: 6, stairsOnly: false },
  { fromId: 'bronze', toId: 'digital', minutes: 7, stairsOnly: false },
  { fromId: 'painting', toId: 'silkroad', minutes: 5, stairsOnly: false },
  { fromId: 'painting', toId: 'digital', minutes: 6, stairsOnly: false },
  { fromId: 'silkroad', toId: 'digital', minutes: 5, stairsOnly: false },
  { fromId: 'folk', toId: 'exit', minutes: 5, stairsOnly: true },
]

export const preferenceTags: { key: string; label: string; icon: string }[] = [
  { key: '亲子', label: '亲子', icon: '👶' },
  { key: '无障碍', label: '无障碍', icon: '♿' },
  { key: '短时长', label: '短时长', icon: '⏱' },
  { key: '重点文物', label: '重点文物', icon: '🏛' },
]

export function getHallById(id: string): Hall | undefined {
  return halls.find(h => h.id === id)
}

export function getWalkingMinutes(fromId: string, toId: string, accessible: boolean): number | null {
  const edge = walkingEdges.find(
    e => (e.fromId === fromId && e.toId === toId) || (e.fromId === toId && e.toId === fromId)
  )
  if (!edge) return null
  if (accessible && edge.stairsOnly) return null
  return edge.minutes
}
