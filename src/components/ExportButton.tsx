import { useAppStore } from '@/store/useAppStore'
import { Download } from 'lucide-react'

export default function ExportButton() {
  const { routeResult, currentTime, closingTime, selectedTags } = useAppStore()

  if (!routeResult) return null

  const handleExport = () => {
    const lines: string[] = []
    lines.push('═══════════════════════════════════════')
    lines.push('  市立博物馆 · 参观行程单')
    lines.push('═══════════════════════════════════════')
    lines.push('')
    lines.push(`参观日期：${new Date().toLocaleDateString('zh-CN')}`)
    lines.push(`当前时间：${currentTime}`)
    lines.push(`闭馆时间：${closingTime}`)
    if (selectedTags.length > 0) {
      lines.push(`参观偏好：${selectedTags.join('、')}`)
    }
    lines.push('')
    lines.push('───────────────────────────────────────')
    lines.push('  推荐路线')
    lines.push('───────────────────────────────────────')

    routeResult.steps.forEach((step, i) => {
      const { hall, arrivalTime, departureTime, walkMinutesFromPrev, isWaiting, waitMinutes } = step
      lines.push('')
      lines.push(`  ${i + 1}. ${hall.name}`)
      if (hall.description) {
        lines.push(`     ${hall.description}`)
      }
      lines.push(`     时间：${arrivalTime} → ${departureTime}`)
      if (walkMinutesFromPrev > 0) {
        lines.push(`     步行：${walkMinutesFromPrev} 分钟`)
      }
      if (hall.stayMinutes > 0) {
        lines.push(`     参观：${hall.stayMinutes} 分钟`)
      }
      if (isWaiting) {
        lines.push(`     ⚠ 等待 ${waitMinutes} 分钟（午休闭厅）`)
      }
      if (hall.tags.length > 0) {
        lines.push(`     标签：${hall.tags.join('、')}`)
      }
    })

    lines.push('')
    lines.push('───────────────────────────────────────')
    lines.push('  时间统计')
    lines.push('───────────────────────────────────────')
    const totalWait = routeResult.steps.reduce((s, st) => s + st.waitMinutes, 0)
    lines.push(`  步行时间：${routeResult.totalWalkMinutes} 分钟`)
    lines.push(`  参观时间：${routeResult.totalVisitMinutes} 分钟`)
    if (totalWait > 0) {
      lines.push(`  等待时间：${totalWait} 分钟`)
    }
    lines.push(`  总计时间：${routeResult.totalWalkMinutes + routeResult.totalVisitMinutes + totalWait} 分钟`)

    if (!routeResult.timeSufficient) {
      lines.push('')
      lines.push('  ⚠ 时间不足！建议删除以下展厅：')
      routeResult.suggestedRemovals.forEach(hall => {
        lines.push(`    - ${hall.name}（${hall.stayMinutes} 分钟）`)
      })
    }

    lines.push('')
    lines.push('═══════════════════════════════════════')
    lines.push('  祝您参观愉快！')
    lines.push('═══════════════════════════════════════')

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `博物馆行程单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="w-full py-3 rounded-xl border-2 border-museum-teal text-museum-teal font-medium text-sm hover:bg-museum-teal hover:text-white active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
    >
      <Download size={16} />
      导出为纯文本行程单
    </button>
  )
}
