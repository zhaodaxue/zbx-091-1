import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HallCard from '@/components/HallCard'
import { useAppStore } from '@/store/useAppStore'
import { getHallById } from '@/data/mockData'
import type { Hall } from '@/data/types'

describe('界面层 · HallCard 暂不去 UI', () => {
  const commonProps = (hall: Hall) => ({
    hall,
    index: 1,
    arrivalTime: '10:00',
    departureTime: '10:30',
    walkMinutesFromPrev: 3,
    isWaiting: false,
    waitMinutes: 0,
    isLast: false,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    useAppStore.getState().clearRoute()
    useAppStore.setState({
      selectedTags: [],
      currentTime: '09:00',
      closingTime: '18:00',
      lockedHallIds: [],
      skippedHallIds: [],
      conflictMessage: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('暂不去状态下：卡片显示「暂不去」小标签、序号圆点为灰色、按钮显示 RotateCcw（取消暂不去）', () => {
    useAppStore.setState({ skippedHallIds: ['bronze'] })
    const hall = getHallById('bronze')!
    render(<HallCard {...commonProps(hall)} />)

    const skipBadge = screen.getByText('暂不去')
    expect(skipBadge).toBeInTheDocument()

    const undoBtn = screen.getByTitle('取消暂不去')
    expect(undoBtn).toBeInTheDocument()
  })

  it('未暂不去状态下：按钮点击后展厅被加入 skippedHallIds', () => {
    const hall = getHallById('ceramics')!
    render(<HallCard {...commonProps(hall)} />)

    expect(useAppStore.getState().skippedHallIds).not.toContain('ceramics')
    const skipBtn = screen.getByTitle('标记为暂不去（本次不参观）')
    fireEvent.click(skipBtn)

    expect(useAppStore.getState().skippedHallIds).toContain('ceramics')
  })

  it('取消暂不去：点击 RotateCcw 按钮后展厅从 skippedHallIds 移除', () => {
    useAppStore.setState({ skippedHallIds: ['painting'] })
    const hall = getHallById('painting')!
    render(<HallCard {...commonProps(hall)} />)

    const undoBtn = screen.getByTitle('取消暂不去')
    fireEvent.click(undoBtn)
    expect(useAppStore.getState().skippedHallIds).not.toContain('painting')
  })

  it('入口和出口无暂不去与锁定按钮', () => {
    const entranceHall = getHallById('entrance')!
    const { rerender } = render(<HallCard {...commonProps(entranceHall)} />)

    expect(screen.queryByTitle('标记为暂不去（本次不参观）')).not.toBeInTheDocument()
    expect(screen.queryByTitle('锁定展厅（重新规划时保留）')).not.toBeInTheDocument()

    const exitHall = getHallById('exit')!
    rerender(<HallCard {...commonProps(exitHall)} />)
    expect(screen.queryByTitle('标记为暂不去（本次不参观）')).not.toBeInTheDocument()
    expect(screen.queryByTitle('锁定展厅（重新规划时保留）')).not.toBeInTheDocument()
  })

  it('先锁定再点暂不去按钮 → 操作被阻止，冲突提示出现，展厅状态未变', () => {
    useAppStore.getState().toggleLock('bronze')
    expect(useAppStore.getState().lockedHallIds).toContain('bronze')
    expect(useAppStore.getState().conflictMessage).toBeNull()

    const hall = getHallById('bronze')!
    render(<HallCard {...commonProps(hall)} />)

    const skipBtn = screen.getByTitle('标记为暂不去（本次不参观）')
    fireEvent.click(skipBtn)

    expect(useAppStore.getState().skippedHallIds).not.toContain('bronze')
    expect(useAppStore.getState().conflictMessage).not.toBeNull()
    expect(useAppStore.getState().conflictMessage).toContain('已被锁定')
    expect(useAppStore.getState().conflictMessage).toContain(hall.name)
  })

  it('先暂不去再点锁定按钮 → 操作被阻止，冲突提示出现', () => {
    useAppStore.getState().toggleSkip('family')
    expect(useAppStore.getState().skippedHallIds).toContain('family')

    const hall = getHallById('family')!
    render(<HallCard {...commonProps(hall)} />)

    const lockBtn = screen.getByTitle('锁定展厅（重新规划时保留）')
    fireEvent.click(lockBtn)

    expect(useAppStore.getState().lockedHallIds).not.toContain('family')
    expect(useAppStore.getState().conflictMessage).not.toBeNull()
    expect(useAppStore.getState().conflictMessage).toContain('已被标记为暂不去')
    expect(useAppStore.getState().conflictMessage).toContain(hall.name)
  })

  it('存在 routeResult 时点击暂不去会触发重新规划（setTimeout → generateRoute）', () => {
    useAppStore.getState().generateRoute()
    vi.advanceTimersByTime(50)
    const beforeLen = useAppStore.getState().routeResult?.steps.length || 0
    expect(beforeLen).toBeGreaterThan(3)

    const steps = useAppStore.getState().routeResult?.steps || []
    const pickHall = steps.find(s => s.hall.id !== 'entrance' && s.hall.id !== 'exit')?.hall || getHallById('bronze')!
    const pickId = pickHall.id

    const { unmount } = render(<HallCard {...commonProps(pickHall)} />)
    unmount()

    useAppStore.getState().toggleSkip(pickId)
    vi.advanceTimersByTime(200)

    const afterIds = useAppStore.getState().routeResult?.steps.map(s => s.hall.id) || []
    expect(afterIds).not.toContain(pickId)
  })
})
