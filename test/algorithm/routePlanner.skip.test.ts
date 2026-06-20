import { describe, it, expect } from 'vitest'
import { planRoute } from '@/algorithm/routePlanner'
import { halls } from '@/data/mockData'
import type { PreferenceTag } from '@/data/types'

describe('算法层 · 暂不去能力', () => {
  const allTags: PreferenceTag[] = []
  const LONG_ENOUGH_TIME = { currentTime: '09:00', closingTime: '18:00' }
  const TIGHT_TIME = { currentTime: '16:15', closingTime: '17:30' }

  describe('暂不去过滤 - planRoute 跳过展厅', () => {
    it('标记陶瓷艺术展厅为暂不去后，其不出现在路线步骤列表中', () => {
      const before = planRoute(allTags, [], [], LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const beforeSteps = before.steps.map(s => s.hall.id)
      expect(beforeSteps).toContain('ceramics')

      const after = planRoute(allTags, [], ['ceramics'], LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const afterSteps = after.steps.map(s => s.hall.id)
      expect(afterSteps).not.toContain('ceramics')
      expect(afterSteps[0]).toBe('entrance')
      expect(afterSteps[afterSteps.length - 1]).toBe('exit')
    })

    it('同时标记多个展厅为暂不去，所有被标记展厅均不出现于步骤中', () => {
      const skippedIds = ['ceramics', 'painting', 'family']
      const result = planRoute(allTags, [], skippedIds, LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const stepIds = result.steps.map(s => s.hall.id)
      for (const sid of skippedIds) {
        expect(stepIds).not.toContain(sid)
      }
    })

    it('入口与出口不受暂不去规则影响，始终保留', () => {
      const result = planRoute(allTags, [], ['entrance', 'exit'], LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const stepIds = result.steps.map(s => s.hall.id)
      expect(stepIds[0]).toBe('entrance')
      expect(stepIds[stepIds.length - 1]).toBe('exit')
    })
  })

  describe('删减建议排除暂不去展厅', () => {
    it('时间不足触发建议时，suggestedRemovals 不包含已标记暂不去的展厅', () => {
      const skippedIds = ['ceramics', 'nature']
      const result = planRoute(allTags, [], skippedIds, TIGHT_TIME.currentTime, TIGHT_TIME.closingTime)

      expect(result.timeSufficient).toBe(false)
      expect(result.suggestedRemovals.length).toBeGreaterThanOrEqual(0)

      for (const hall of result.suggestedRemovals) {
        expect(skippedIds).not.toContain(hall.id)
      }
    })

    it('时间不足场景下，若所有候选展厅都被标记暂不去，suggestedRemovals 为空数组', () => {
      const allMiddleIds = halls
        .filter(h => h.id !== 'entrance' && h.id !== 'exit')
        .map(h => h.id)

      const result = planRoute(allTags, [], allMiddleIds, TIGHT_TIME.currentTime, TIGHT_TIME.closingTime)
      expect(result.suggestedRemovals).toEqual([])
    })
  })

  describe('无障碍 + 暂不去 协同生效', () => {
    const accessibleTags: PreferenceTag[] = ['无障碍']

    it('开启无障碍偏好后，楼梯-only 展厅本身被过滤，且暂不去规则仍生效', () => {
      const resultBefore = planRoute(accessibleTags, [], [], LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const stairsOnlyIds = halls.filter(h => h.stairsOnly).map(h => h.id)
      for (const sid of stairsOnlyIds) {
        expect(resultBefore.steps.map(s => s.hall.id)).not.toContain(sid)
      }

      const skippedIds = ['bronze', 'digital']
      const resultAfter = planRoute(accessibleTags, [], skippedIds, LONG_ENOUGH_TIME.currentTime, LONG_ENOUGH_TIME.closingTime)
      const stepIds = resultAfter.steps.map(s => s.hall.id)
      for (const sid of skippedIds) {
        expect(stepIds).not.toContain(sid)
      }
      for (const sid of stairsOnlyIds) {
        expect(stepIds).not.toContain(sid)
      }
      expect(stepIds[0]).toBe('entrance')
      expect(stepIds[stepIds.length - 1]).toBe('exit')
    })

    it('无障碍模式 + 暂不去部分展厅后，suggestedRemovals 同时排除楼梯和暂不去展厅', () => {
      const skippedIds = ['ceramics']
      const result = planRoute(accessibleTags, [], skippedIds, TIGHT_TIME.currentTime, TIGHT_TIME.closingTime)

      const stairsOnlyIds = halls.filter(h => h.stairsOnly).map(h => h.id)
      for (const h of result.suggestedRemovals) {
        expect(skippedIds).not.toContain(h.id)
        expect(stairsOnlyIds).not.toContain(h.id)
      }
    })
  })

  describe('锁定 + 暂不去 + 时间不足', () => {
    it('已锁定展厅不会出现在暂不去中时，锁定展厅仍在路线且不被删除建议包含', () => {
      const lockedIds = ['bronze']
      const skippedIds = ['ceramics']
      const result = planRoute(allTags, lockedIds, skippedIds, TIGHT_TIME.currentTime, TIGHT_TIME.closingTime)

      const stepIds = result.steps.map(s => s.hall.id)
      expect(stepIds).toContain('bronze')

      for (const h of result.suggestedRemovals) {
        expect(h.id).not.toBe('bronze')
        expect(h.id).not.toBe('ceramics')
      }
    })
  })
})
