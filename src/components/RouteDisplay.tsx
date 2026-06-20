import { useAppStore } from '@/store/useAppStore'
import { Footprints, Eye, Clock, AlertTriangle, X, AlertCircle, Lock, LockOpen, Ban, RotateCcw } from 'lucide-react'
import HallCard from './HallCard'

export default function RouteDisplay() {
  const { routeResult, clearRoute, lockedHallIds, skippedHallIds, conflictMessage, clearConflict, toggleLock, toggleSkip } = useAppStore()

  if (!routeResult) {
    return (
      <div className="card-base p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-museum-teal/10 flex items-center justify-center mb-4">
          <Footprints size={28} className="text-museum-teal" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-museum-charcoal mb-2">
          选择偏好，开始规划
        </h3>
        <p className="text-sm text-museum-charcoal-light max-w-xs">
          在左侧面板选择您的参观偏好与时间，点击「生成推荐路线」获取最优参观方案
        </p>
      </div>
    )
  }

  const { steps, totalWalkMinutes, totalVisitMinutes, timeSufficient, suggestedRemovals, excludedHalls, timeError, impossible, impossibleReason } = routeResult
  const totalWait = steps.reduce((s, st) => s + st.waitMinutes, 0)

  if (timeError) {
    return (
      <div className="card-base p-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-700 mb-1">时间设置有误</h3>
            <p className="text-sm text-red-600">{timeError}</p>
          </div>
        </div>
      </div>
    )
  }

  const excludedSkipped = excludedHalls.filter(h => skippedHallIds.includes(h.id))
  const excludedOthers = excludedHalls.filter(h => !skippedHallIds.includes(h.id))

  return (
    <div className="space-y-4">
      {conflictMessage && (
        <div className="card-base p-0 overflow-hidden">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-b border-amber-200">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">{conflictMessage}</p>
            </div>
            <button
              onClick={clearConflict}
              className="shrink-0 p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="card-base p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-museum-teal-dark">
            推荐路线
          </h2>
          <button
            onClick={clearRoute}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-museum-charcoal-light hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
            清除路线
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-3 rounded-lg bg-museum-teal/5">
            <div className="flex items-center justify-center gap-1 text-museum-teal mb-1">
              <Footprints size={14} />
              <span className="text-xs">步行</span>
            </div>
            <span className="text-xl font-bold text-museum-teal-dark">{totalWalkMinutes}</span>
            <span className="text-xs text-museum-charcoal-light ml-1">分钟</span>
          </div>
          <div className="text-center p-3 rounded-lg bg-museum-gold/5">
            <div className="flex items-center justify-center gap-1 text-museum-gold-dark mb-1">
              <Eye size={14} />
              <span className="text-xs">参观</span>
            </div>
            <span className="text-xl font-bold text-museum-gold-dark">{totalVisitMinutes}</span>
            <span className="text-xs text-museum-charcoal-light ml-1">分钟</span>
          </div>
          <div className="text-center p-3 rounded-lg bg-museum-charcoal/5">
            <div className="flex items-center justify-center gap-1 text-museum-charcoal-light mb-1">
              <Clock size={14} />
              <span className="text-xs">总计</span>
            </div>
            <span className="text-xl font-bold text-museum-charcoal">{totalWalkMinutes + totalVisitMinutes + totalWait}</span>
            <span className="text-xs text-museum-charcoal-light ml-1">分钟</span>
          </div>
        </div>

        {!timeSufficient && !impossible && suggestedRemovals.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
              <AlertTriangle size={16} />
              时间不足
            </div>
            <p className="text-xs text-amber-600 mb-2">
              在当前可用时间内无法完成所有展厅参观，建议删除以下展厅（按节省时间从多到少）：
            </p>
            <div className="flex flex-wrap gap-1">
              {suggestedRemovals.map(hall => {
                const isLocked = lockedHallIds.includes(hall.id)
                return (
                  <span
                    key={hall.id}
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      isLocked
                        ? 'bg-museum-teal/10 text-museum-teal'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isLocked ? '🔒 ' : ''}{hall.name}（{hall.stayMinutes}分钟）
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {impossible && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
              <AlertCircle size={16} />
              时间严重不足
            </div>
            <p className="text-xs text-red-600">
              {impossibleReason || '即使删减所有可选展厅，也无法在闭馆前完成（含已锁定展厅）。'}
            </p>
            {lockedHallIds.length > 0 && (
              <p className="text-xs text-red-500 mt-1">
                提示：您已锁定 {lockedHallIds.length} 个展厅，可尝试解锁部分以缩短行程。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card-base p-6">
        <div className="space-y-0">
          {steps.map((step, i) => (
            <HallCard
              key={step.hall.id + '-' + i}
              hall={step.hall}
              index={i}
              arrivalTime={step.arrivalTime}
              departureTime={step.departureTime}
              walkMinutesFromPrev={step.walkMinutesFromPrev}
              isWaiting={step.isWaiting}
              waitMinutes={step.waitMinutes}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </div>

      {excludedHalls.length > 0 && (
        <div className="card-base p-4">
          {excludedSkipped.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-museum-charcoal-light mb-2">
                本次暂不去（{excludedSkipped.length}）
              </h3>
              <div className="flex flex-wrap gap-2">
                {excludedSkipped.map(hall => (
                  <div
                    key={hall.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    <Ban size={12} className="text-gray-500" />
                    <span className="text-xs">{hall.name}</span>
                    <button
                      onClick={() => toggleSkip(hall.id)}
                      className="ml-1 p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                      title="取消暂不去"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {excludedOthers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-museum-charcoal-light mb-2">
                未纳入路线的展厅（{excludedOthers.length}）
              </h3>
              <div className="flex flex-wrap gap-2">
                {excludedOthers.map(hall => {
                  const isLocked = lockedHallIds.includes(hall.id)
                  const isSkipped = skippedHallIds.includes(hall.id)
                  return (
                    <div
                      key={hall.id}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        isLocked
                          ? 'bg-museum-teal/5 text-museum-teal-dark border border-museum-teal/30'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {isLocked && <Lock size={12} className="text-museum-teal" />}
                      <span className="text-xs">{hall.name}</span>
                      {!isSkipped && (
                        <button
                          onClick={() => toggleSkip(hall.id)}
                          className="ml-1 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                          title="标记为暂不去"
                        >
                          <Ban size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleLock(hall.id)}
                        className={`ml-0.5 p-0.5 rounded transition-colors ${
                          isLocked
                            ? 'hover:bg-museum-teal/20 text-museum-teal'
                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                        }`}
                        title={isLocked ? '解锁' : '锁定'}
                      >
                        {isLocked ? <LockOpen size={12} /> : <Lock size={12} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
