// Error severity levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log entry structure
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  error?: Error
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableRemote: boolean
}

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      ...config,
    }

    // Set up periodic flush for production
    if (this.config.enableRemote) {
      this.flushInterval = setInterval(() => {
        this.flush()
      }, 5000) // Flush every 5 seconds
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    return levels.indexOf(level) >= levels.indexOf(this.config.minLevel)
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, error, context } = entry
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (context) {
      formatted += ` | Context: ${JSON.stringify(context)}`
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`
      if (error.stack) {
        formatted += `\nStack: ${error.stack}`
      }
    }
    
    return formatted
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return
    
    try {
      // Filter entries by severity for remote logging
      const significantEntries = entries.filter(entry => 
        [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL].includes(entry.level)
      )
      
      if (significantEntries.length === 0) return
      
      // If using a service like LogTail, Datadog, or custom endpoint
      const loggingEndpoint = process.env.REMOTE_LOGGING_ENDPOINT
      
      if (loggingEndpoint) {
        const response = await fetch(loggingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REMOTE_LOGGING_TOKEN || ''}`,
          },
          body: JSON.stringify({
            source: 'justspeak-app',
            environment: process.env.NODE_ENV,
            entries: significantEntries,
          }),
        })
        
        if (!response.ok) {
          // Fallback to console in production if remote logging fails
          significantEntries.forEach(entry => {
            const formatted = this.formatMessage(entry)
            if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
              console.error('[Remote Logging Failed]', formatted)
            } else {
              console.warn('[Remote Logging Failed]', formatted)
            }
          })
        }
      }
    } catch (error) {
      // Silent fail - don't throw errors from logging
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send logs to remote:', error)
      }
    }
  }

  private log(level: LogLevel, message: string, meta?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }

    // Console logging - disabled in production except for errors
    if (this.config.enableConsole && 
        (process.env.NODE_ENV !== 'production' || 
         level === LogLevel.ERROR || 
         level === LogLevel.FATAL)) {
      const formatted = this.formatMessage(entry)
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted)
          break
      }
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry)
      
      // Flush if buffer is getting large
      if (this.logBuffer.length >= 100) {
        this.flush()
      }
    }
  }

  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return
    
    const entries = [...this.logBuffer]
    this.logBuffer = []
    
    await this.sendToRemote(entries)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, { context })
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, { context })
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, { context })
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.log(LogLevel.ERROR, message, { error: errorObj, context })
  }

  fatal(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.log(LogLevel.FATAL, message, { error: errorObj, context })
  }

  // For request-scoped logging
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config)
    childLogger.logBuffer = this.logBuffer // Share buffer with parent
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger)
    childLogger.log = (level, message, meta) => {
      originalLog(level, message, {
        ...meta,
        context: { ...context, ...meta?.context },
      })
    }
    
    return childLogger
  }

  // Clean up
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }
}

// Create singleton instance
export const logger = new Logger()

// For use in API routes
export function createRequestLogger(req: Request): Logger {
  const requestId = crypto.randomUUID()
  const url = new URL(req.url)
  
  return logger.child({
    requestId,
    method: req.method,
    path: url.pathname,
    userAgent: req.headers.get('user-agent'),
  })
}