import { useAppStore } from '@/store/useAppStore'
import { Plus, Minus } from 'lucide-react'

export default function RouteDiff() {
  const { routeDiff } = useAppStore()

  if (!routeDiff || (routeDiff.added.length === 0 && routeDiff.removed.length === 0)) {
    return null
  }

  return (
    <div className="card-base p-4">
      <h3 className="text-sm font-semibold text-museum-charcoal mb-3">
        路线变化
      </h3>
      <div className="space-y-2">
        {routeDiff.added.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mb-1">
              <Plus size={14} />
              新增展厅
            </div>
            <div className="flex flex-wrap gap-1">
              {routeDiff.added.map(hall => (
                <span
                  key={hall.id}
                  className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {hall.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {routeDiff.removed.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-red-500 text-xs font-medium mb-1">
              <Minus size={14} />
              移除展厅
            </div>
            <div className="flex flex-wrap gap-1">
              {routeDiff.removed.map(hall => (
                <span
                  key={hall.id}
                  className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 border border-red-200"
                >
                  {hall.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
