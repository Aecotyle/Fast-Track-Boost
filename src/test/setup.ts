import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Minimal DOM stubs needed by the components under test.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ResizeObserver used by some UI libs.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO

// scrollIntoView not implemented in jsdom
Element.prototype.scrollIntoView = () => {}

// PointerEvent (used by dnd-kit sensors)
if (!('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId = 1
    isPrimary = true
    pointerType = 'mouse'
  }
  ;(globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill
}

// getBoundingClientRect for dnd + dropdowns
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}

// clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
})
