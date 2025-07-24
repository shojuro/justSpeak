// Mock for logger
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
}

module.exports = {
  logger,
  default: logger
}