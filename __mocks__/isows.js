// Mock for isows WebSocket library
class MockWebSocket {
  constructor(url, protocols) {
    this.url = url
    this.protocols = protocols
    this.readyState = 0 // CONNECTING
    this.onopen = null
    this.onclose = null
    this.onerror = null
    this.onmessage = null
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1 // OPEN
      if (this.onopen) this.onopen({ type: 'open' })
    }, 0)
  }
  
  send(data) {
    // Mock send
  }
  
  close(code, reason) {
    this.readyState = 3 // CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code, reason })
    }
  }
  
  addEventListener(event, handler) {
    this[`on${event}`] = handler
  }
  
  removeEventListener(event, handler) {
    if (this[`on${event}`] === handler) {
      this[`on${event}`] = null
    }
  }
}

MockWebSocket.CONNECTING = 0
MockWebSocket.OPEN = 1
MockWebSocket.CLOSING = 2
MockWebSocket.CLOSED = 3

module.exports = {
  WebSocket: MockWebSocket,
  default: MockWebSocket
}