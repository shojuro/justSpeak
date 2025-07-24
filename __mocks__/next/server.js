// Mock for next/server
class NextRequest extends global.Request {
  constructor(input, init) {
    super(input, init)
  }
}

class NextResponse extends global.Response {
  constructor(body, init) {
    super(body, init)
  }
  
  static json(data, init) {
    const body = JSON.stringify(data)
    return new NextResponse(body, {
      ...init,
      status: init?.status || 200,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {})
      }
    })
  }
  
  static redirect(url, status = 307) {
    return new NextResponse(null, {
      status,
      headers: {
        Location: url
      }
    })
  }
  
  static error() {
    return new NextResponse(null, { status: 500 })
  }
}

module.exports = {
  NextRequest,
  NextResponse
}