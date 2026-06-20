import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAppStore } from '@/store/useAppStore'
import { getHallById } from '@/data/mockData'
import type { RouteDiff } from '@/data/types'

describe('状态层 · 暂不去与冲突检测', () => {
  beforeEach(() => {
    useAppStore.getState().clearRoute()
    useAppStore.setState({
      selectedTags: [],
      currentTime: '09:00',
      closingTime: '18:00',
      lockedHallIds: [],
      skippedHallIds: [],
      routeResult: null,
      previousRouteHallIds: [],
      previousSkippedHallIds: [],
      routeDiff: null,
      conflictMessage: null,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('toggleSkip 基本行为', () => {
    it('正常标记暂不去：skippedHallIds 增加该展厅，无冲突', () => {
      const info = useAppStore.getState().toggleSkip('ceramics')
      expect(info.hasConflict).toBe(false)
      expect(useAppStore.getState().skippedHallIds).toContain('ceramics')
      expect(useAppStore.getState().conflictMessage).toBeNull()
    })

    it('取消暂不去：skippedHallIds 移除该展厅', () => {
      useAppStore.setState({ skippedHallIds: ['ceramics', 'painting'] })
      const info = useAppStore.getState().toggleSkip('ceramics')
      expect(info.hasConflict).toBe(false)
      expect(useAppStore.getState().skippedHallIds).toEqual(['painting'])
    })

    it('不能标记入口或出口为暂不去（算法层负责过滤，状态层不阻止但算法会忽略）', () => {
      useAppStore.getState().toggleSkip('entrance')
      useAppStore.getState().toggleSkip('exit')
      expect(useAppStore.getState().skippedHallIds).toContain('entrance')
      expect(useAppStore.getState().skippedHallIds).toContain('exit')
    })
  })

  describe('冲突检测：锁定 ↔ 暂不去 互斥', () => {
    it('对已锁定展厅标记暂不去，被阻止且 conflictMessage 包含展厅名称', () => {
      useAppStore.getState().toggleLock('bronze')
      expect(useAppStore.getState().lockedHallIds).toContain('bronze')

      const info = useAppStore.getState().toggleSkip('bronze')
      expect(info.hasConflict).toBe(true)
      expect(info.message).toContain(getHallById('bronze')?.name || '')

      const { conflictMessage, lockedHallIds, skippedHallIds } = useAppStore.getState()
      expect(conflictMessage).toContain('已被锁定')
      expect(conflictMessage).toContain(getHallById('bronze')?.name || '')
      expect(lockedHallIds).toContain('bronze')
      expect(skippedHallIds).not.toContain('bronze')
    })

    it('对已暂不去展厅执行锁定，被阻止且 conflictMessage 包含展厅名称', () => {
      useAppStore.getState().toggleSkip('painting')
      expect(useAppStore.getState().skippedHallIds).toContain('painting')

      const info = useAppStore.getState().toggleLock('painting')
      expect(info.hasConflict).toBe(true)
      expect(info.message).toContain(getHallById('painting')?.name || '')

      const { conflictMessage, lockedHallIds, skippedHallIds } = useAppStore.getState()
      expect(conflictMessage).toContain('已被标记为暂不去')
      expect(conflictMessage).toContain(getHallById('painting')?.name || '')
      expect(skippedHallIds).toContain('painting')
      expect(lockedHallIds).not.toContain('painting')
    })

    it('冲突提示可通过 clearConflict 清除', () => {
      useAppStore.getState().toggleLock('bronze')
      useAppStore.getState().toggleSkip('bronze')
      expect(useAppStore.getState().conflictMessage).not.toBeNull()

      useAppStore.getState().clearConflict()
      expect(useAppStore.getState().conflictMessage).toBeNull()
    })

    it('冲突检测通过后（取消暂不去再锁定），状态可正常变更', () => {
      useAppStore.getState().toggleSkip('silkroad')
      expect(useAppStore.getState().skippedHallIds).toContain('silkroad')

      const tryLockFail = useAppStore.getState().toggleLock('silkroad')
      expect(tryLockFail.hasConflict).toBe(true)

      useAppStore.getState().toggleSkip('silkroad')
      expect(useAppStore.getState().skippedHallIds).not.toContain('silkroad')

      const tryLockOk = useAppStore.getState().toggleLock('silkroad')
      expect(tryLockOk.hasConflict).toBe(false)
      expect(useAppStore.getState().lockedHallIds).toContain('silkroad')
    })
  })

  describe('路线变化差异对比：addedSkipped / removedSkipped', () => {
    beforeEach(() => {
      useAppStore.getState().generateRoute()
      vi.advanceTimersByTime(50)
    })

    it('生成路线后标记暂不去：routeDiff 同时出现 removed（展厅）和 addedSkipped', () => {
      const beforeSteps = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      expect(beforeSteps.length).toBeGreaterThan(3)

      const pickFromRoute = beforeSteps.find(id => id !== 'entrance' && id !== 'exit')!
      useAppStore.getState().toggleSkip(pickFromRoute)
      vi.advanceTimersByTime(50)

      const diff: RouteDiff = useAppStore.getState().routeDiff!
      expect(diff).not.toBeNull()
      expect(diff.removed.map(h => h.id)).toContain(pickFromRoute)
      expect(diff.addedSkipped.map(h => h.id)).toContain(pickFromRoute)
    })

    it('取消暂不去（时间允许）：routeDiff 同时出现 added（展厅）和 removedSkipped', () => {
      useAppStore.setState({ skippedHallIds: ['ceramics'], previousSkippedHallIds: ['ceramics'] })
      useAppStore.getState().generateRoute()
      vi.advanceTimersByTime(50)

      const stepsAfterSkip = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      expect(stepsAfterSkip).not.toContain('ceramics')

      useAppStore.getState().toggleSkip('ceramics')
      vi.advanceTimersByTime(50)

      const diff: RouteDiff = useAppStore.getState().routeDiff!
      expect(diff).not.toBeNull()
      expect(diff.added.map(h => h.id)).toContain('ceramics')
      expect(diff.removedSkipped.map(h => h.id)).toContain('ceramics')
    })

    it('路线结果中步骤列表不再包含暂不去展厅', () => {
      const beforeSteps = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      const pickFromRoute = beforeSteps.find(id => id !== 'entrance' && id !== 'exit')!

      useAppStore.getState().toggleSkip(pickFromRoute)
      vi.advanceTimersByTime(50)

      const afterStepIds = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      expect(afterStepIds).not.toContain(pickFromRoute)
      expect(afterStepIds[0]).toBe('entrance')
      expect(afterStepIds[afterStepIds.length - 1]).toBe('exit')
    })
  })

  describe('标记暂不去后自动重新规划路线', () => {
    it('存在 routeResult 时，toggleSkip 会触发 setTimeout 重新规划', () => {
      useAppStore.getState().generateRoute()
      vi.advanceTimersByTime(50)
      const beforeRouteLen = useAppStore.getState().routeResult?.steps.length || 0

      const beforeSteps = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      const pickId = beforeSteps.find(id => id !== 'entrance' && id !== 'exit')!

      useAppStore.getState().toggleSkip(pickId)
      vi.advanceTimersByTime(100)

      const afterSteps = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
      expect(afterSteps).not.toContain(pickId)
      expect(afterSteps.length).toBeLessThanOrEqual(beforeRouteLen)
    })
  })
})
