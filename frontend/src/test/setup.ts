import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location methods for testing
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '',
    search: '',
    hash: '',
    replace: vi.fn(),
  },
  writable: true,
})

// Mock history API
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
  },
  writable: true,
})
