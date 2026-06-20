import { useAppStore } from '@/store/useAppStore'
import { preferenceTags } from '@/data/mockData'
import type { PreferenceTag } from '@/data/types'
import { Clock, DoorOpen } from 'lucide-react'

export default function PreferencePanel() {
  const {
    selectedTags,
    currentTime,
    closingTime,
    toggleTag,
    setCurrentTime,
    setClosingTime,
    generateRoute,
  } = useAppStore()

  return (
    <div className="card-base p-6 space-y-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-museum-teal-dark mb-3">
          参观偏好
        </h2>
        <div className="flex flex-wrap gap-2">
          {preferenceTags.map(tag => {
            const isActive = selectedTags.includes(tag.key as PreferenceTag)
            return (
              <button
                key={tag.key}
                onClick={() => toggleTag(tag.key as PreferenceTag)}
                className={`tag-button ${isActive ? 'tag-button-active' : 'tag-button-inactive'}`}
              >
                <span className="mr-1">{tag.icon}</span>
                {tag.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-museum-teal-dark">
          时间设置
        </h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-museum-charcoal-light">
            <Clock size={16} className="text-museum-teal" />
            <span className="w-20">当前时间</span>
            <input
              type="time"
              value={currentTime}
              onChange={e => setCurrentTime(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-museum-ivory-dark bg-white text-museum-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-museum-gold/40 focus:border-museum-gold"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-museum-charcoal-light">
            <DoorOpen size={16} className="text-museum-teal" />
            <span className="w-20">闭馆时间</span>
            <input
              type="time"
              value={closingTime}
              onChange={e => setClosingTime(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-museum-ivory-dark bg-white text-museum-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-museum-gold/40 focus:border-museum-gold"
            />
          </label>
        </div>
      </div>

      <button
        onClick={generateRoute}
        className="w-full py-3 rounded-xl bg-museum-teal text-white font-medium text-base shadow-lg shadow-museum-teal/20 hover:bg-museum-teal-light active:scale-[0.98] transition-all duration-200"
      >
        生成推荐路线
      </button>

      {selectedTags.includes('无障碍') && (
        <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          ♿ 无障碍模式已开启：仅包含电梯可达展厅与通道
        </div>
      )}
    </div>
  )
}
