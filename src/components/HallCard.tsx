import { Lock, LockOpen, MapPin, AlertTriangle } from 'lucide-react'
import type { Hall } from '@/data/types'
import { useAppStore } from '@/store/useAppStore'

interface HallCardProps {
  hall: Hall
  index: number
  arrivalTime: string
  departureTime: string
  walkMinutesFromPrev: number
  isWaiting: boolean
  waitMinutes: number
  isLast: boolean
}

export default function HallCard({
  hall,
  index,
  arrivalTime,
  departureTime,
  walkMinutesFromPrev,
  isWaiting,
  waitMinutes,
  isLast,
}: HallCardProps) {
  const { lockedHallIds, toggleLock, routeResult } = useAppStore()
  const isLocked = lockedHallIds.includes(hall.id)
  const isEntranceOrExit = hall.id === 'entrance' || hall.id === 'exit'

  const isTimeInsufficient = routeResult && !routeResult.timeSufficient

  return (
    <div className="relative pl-14 pb-2">
      {!isLast && <div className="route-step-line" />}

      <div
        className={`absolute left-4 top-3 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center text-[10px] font-bold ${
          isEntranceOrExit
            ? 'bg-museum-gold border-museum-gold-dark text-white'
            : isLocked
              ? 'bg-museum-teal border-museum-teal-dark text-white'
              : 'bg-white border-museum-teal/40 text-museum-teal'
        }`}
      >
        {index + 1}
      </div>

      <div
        className={`card-base p-4 transition-all duration-200 ${
          isLocked ? 'ring-2 ring-museum-teal/40' : ''
        } ${isTimeInsufficient && !isEntranceOrExit ? 'border-amber-300' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-semibold text-museum-charcoal truncate">
                {hall.name}
              </h3>
              {hall.stairsOnly && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-medium">
                  仅楼梯
                </span>
              )}
            </div>
            <p className="text-xs text-museum-charcoal-light mb-2">{hall.description}</p>
            <div className="flex flex-wrap gap-1">
              {hall.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-museum-teal/10 text-museum-teal font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {!isEntranceOrExit && (
            <button
              onClick={() => toggleLock(hall.id)}
              className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                isLocked
                  ? 'bg-museum-teal/10 text-museum-teal hover:bg-museum-teal/20'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
              title={isLocked ? '解锁展厅' : '锁定展厅（重新规划时保留）'}
            >
              {isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-museum-ivory-dark/50 flex items-center gap-4 text-xs text-museum-charcoal-light">
          {walkMinutesFromPrev > 0 && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              步行 {walkMinutesFromPrev} 分钟
            </span>
          )}
          <span>
            {arrivalTime} → {departureTime}
          </span>
          {hall.stayMinutes > 0 && (
            <span>参观 {hall.stayMinutes} 分钟</span>
          )}
          {isWaiting && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} />
              等待 {waitMinutes} 分钟（午休闭厅）
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
