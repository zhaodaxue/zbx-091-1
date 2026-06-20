import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import ExportButton from '@/components/ExportButton'
import { useAppStore } from '@/store/useAppStore'
import { getHallById } from '@/data/mockData'
import { planRoute } from '@/algorithm/routePlanner'

describe('界面层 · ExportButton 暂不去清单导出', () => {
  let capturedText = ''
  let blobType = ''
  let clickCalled = false
  let createObjectURLReturnValue = 'blob:mock-url'
  let objectURLRevoked = false
  let fallbackURLCaptured = ''

  beforeEach(() => {
    capturedText = ''
    blobType = ''
    clickCalled = false
    objectURLRevoked = false
    fallbackURLCaptured = ''

    vi.spyOn(global, 'Blob').mockImplementation(function (this: any, parts: any, opts: any) {
      capturedText = Array.isArray(parts) ? parts.join('') : String(parts || '')
      blobType = opts?.type || ''
      this.size = capturedText.length
      this.type = blobType
      this.slice = function () { return this }
      return this
    } as any)

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => createObjectURLReturnValue)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { objectURLRevoked = true })

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const realA = originalCreateElement('a')
        Object.defineProperty(realA, 'click', {
          value: () => { clickCalled = true },
          writable: true,
        })
        return realA
      }
      return originalCreateElement(tag) as any
    })

    const originalAppendChild = document.body.appendChild.bind(document.body)
    const originalRemoveChild = document.body.removeChild.bind(document.body)
    vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      return originalAppendChild(node)
    })
    vi.spyOn(document.body, 'removeChild').mockImplementation(node => {
      try { return originalRemoveChild(node) } catch { return null as any }
    })

    vi.spyOn(window, 'open').mockImplementation((url?: any) => {
      fallbackURLCaptured = String(url || '')
      return null
    })

    useAppStore.getState().clearRoute()
    useAppStore.setState({
      selectedTags: [],
      currentTime: '10:00',
      closingTime: '17:30',
      lockedHallIds: [],
      skippedHallIds: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const getCapturedContent = () => {
    if (capturedText) return capturedText
    if (fallbackURLCaptured.startsWith('data:')) {
      const encoded = fallbackURLCaptured.split(',').slice(1).join(',')
      try { return decodeURIComponent(encoded) } catch { return fallbackURLCaptured }
    }
    return capturedText || fallbackURLCaptured
  }

  const renderWithRoute = (extraState?: Partial<ReturnType<typeof useAppStore.getState>>) => {
    const state = useAppStore.getState()
    const baseState = {
      selectedTags: state.selectedTags,
      currentTime: state.currentTime,
      closingTime: state.closingTime,
      lockedHallIds: state.lockedHallIds,
      skippedHallIds: state.skippedHallIds,
      ...extraState,
    }
    const routeResult = planRoute(
      baseState.selectedTags,
      baseState.lockedHallIds,
      baseState.skippedHallIds,
      baseState.currentTime,
      baseState.closingTime
    )

    useAppStore.setState({
      ...baseState,
      routeResult,
      previousRouteHallIds: [],
      previousSkippedHallIds: baseState.skippedHallIds,
      routeDiff: null,
    })

    return render(<ExportButton />)
  }

  it('未生成路线时按钮不渲染', () => {
    const { container } = render(<ExportButton />)
    expect(container.firstChild).toBeNull()
  })

  it('无暂不去展厅时，导出文本不包含「本次暂不去展厅」区块标题', () => {
    renderWithRoute()
    const btn = screen.getByText('导出为纯文本行程单')
    fireEvent.click(btn)

    const content = getCapturedContent()
    expect(clickCalled).toBe(true)
    expect(content).toContain('推荐路线')
    expect(content).toContain('时间统计')
    expect(content).not.toContain('本次暂不去展厅')
  })

  it('存在多个暂不去展厅时，文本含区块且列出全部展厅名称', () => {
    const skipped = ['ceramics', 'family', 'jade']
    renderWithRoute({
      skippedHallIds: skipped,
      lockedHallIds: ['bronze'],
    })
    const btn = screen.getByText('导出为纯文本行程单')
    fireEvent.click(btn)

    const content = getCapturedContent()
    expect(content).toContain('本次暂不去展厅')
    for (const id of skipped) {
      expect(content).toContain(getHallById(id)?.name || '')
    }
    expect(content).toContain('已锁定展厅')
    expect(content).toContain(getHallById('bronze')?.name || '')
  })

  it('暂不去清单列出的展厅与状态严格一致，不多列也不列', () => {
    const skipped = ['silkroad']
    renderWithRoute({ skippedHallIds: skipped })
    fireEvent.click(screen.getByText('导出为纯文本行程单'))

    const content = getCapturedContent()
    const lines = content.split('\n')
    const skipSectionStart = lines.findIndex(l => l.includes('本次暂不去展厅'))
    expect(skipSectionStart).toBeGreaterThan(-1)

    const afterSection = lines.slice(skipSectionStart)
    const nextDividerIdx = afterSection.findIndex((l, i) => i > 1 && l.includes('──────────'))
    const chunk = nextDividerIdx > 0 ? afterSection.slice(0, nextDividerIdx).join('\n') : afterSection.join('\n')

    for (const id of skipped) {
      expect(chunk).toContain(getHallById(id)?.name || '')
    }

    const notSkipped = ['ceramics', 'painting', 'nature']
    for (const id of notSkipped) {
      expect(chunk).not.toContain(getHallById(id)?.name || '')
    }
  })

  it('使用备用方案时，文本仍包含暂不去清单（以防 Blob 方案失败）', () => {
    renderWithRoute({ skippedHallIds: ['digital'] })

    vi.spyOn(URL, 'createObjectURL').mockImplementationOnce(() => {
      throw new Error('Blob scheme failed')
    })

    fireEvent.click(screen.getByText('导出为纯文本行程单'))

    const content = getCapturedContent()
    expect(content).toContain('本次暂不去展厅')
    expect(content).toContain(getHallById('digital')?.name || '')
  })
})
