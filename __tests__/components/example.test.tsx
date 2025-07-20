import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple test to verify setup
describe('Test Setup Verification', () => {
  it('should render a simple component', () => {
    render(<div>Test Setup Works!</div>)
    expect(screen.getByText('Test Setup Works!')).toBeInTheDocument()
  })

  it('should handle basic assertions', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
  })
})